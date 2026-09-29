const SUPABASE_URL = 'https://ynbtegberxjesxvjevoi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IO2OKA-9uPneVIDfL3avJg_fsKbPlHG';
const SUPABASE_ROW_ID = 'main';
let cloudSyncQueue = Promise.resolve();

function isCloudStorageConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getSupabaseWriteHeaders() {
    const headers = {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
    };

    // PostgREST/RLS باید نشست واقعی مدیر را هم دریافت کند؛ فقط apikey
    // برای نوشتن رکورد اخبار کافی نیست.
    let accessToken = '';
    try {
        accessToken = String(
            typeof atrakAdminAccessToken !== 'undefined'
                ? atrakAdminAccessToken
                : sessionStorage.getItem('atrak_admin_access_token') || ''
        ).trim();
    } catch (e) {}

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
}

async function syncStateToCloud() {
    if (!isCloudStorageConfigured()) return;

    // فقط مدیر مجاز به نوشتن در Cloud است.
    // کاربران عادی فقط اطلاعات Cloud را دریافت می‌کنند.
    if (typeof state !== 'undefined' && state && state.isAdmin !== true) {
        return;
    }

    const updatedAt = String(Date.now());
    localStorage.setItem('atrak_state_updated_at', updatedAt);

    cloudSyncQueue = cloudSyncQueue.then(async () => {
        const data = {
            schemaVersion: 2,
            edits: localStorage.getItem('atrak_saved_edits') || '{}',
            icons: localStorage.getItem('atrak_saved_icons') || '{}',
            images: localStorage.getItem('atrak_saved_images') || '{}',
            iconColor: localStorage.getItem('atrak_icon_color') || '',
            theme: localStorage.getItem('atrak_theme') || 'light',
            news: localStorage.getItem(ATRAK_NEWS_STORAGE_KEY) || '[]',
            components: localStorage.getItem('atrak_dynamic_elements_v1') || '[]',
            comments_v39: localStorage.getItem('atrak_comments_v39') || '[]',
                      honors: localStorage.getItem('atrak_honors_v1') || '[]',
            questions: localStorage.getItem('atrak_questions_v1') || '{}',
            updatedAt: updatedAt
        };

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/site_state?on_conflict=id`,
            {
                method: 'POST',
                headers: getSupabaseWriteHeaders(),
                body: JSON.stringify({
                    id: SUPABASE_ROW_ID,
                    data
                })
            }
        );

        if (!response.ok) {
            const details = await response.text().catch(() => '');
            throw new Error(`Cloud save failed: ${response.status} ${details}`);
        }
    }).catch(error => {
        console.error('خطا در ذخیره‌سازی آنلاین:', error);
    });

    return cloudSyncQueue;
}

// =========================================================
// Supabase Realtime: همگام‌سازی لحظه‌ای سایت برای تمام کاربران
// =========================================================
let atrakRealtimeClient = null;
let atrakRealtimeChannel = null;
let atrakRealtimeStarted = false;
let atrakRealtimeRefreshTimer = null;

function applyCloudStateAfterRealtime() {
    try {
        state.theme = localStorage.getItem('atrak_theme') || state.theme;
        applyTheme(state.theme);
        renderCurrentView();
        loadSavedImages();
        loadSavedEdits();
        restoreIcons();
        initCarousel();
        generate100IconsList();
        renderAtrakDynamicElements();
        if (typeof renderAtrakNews === 'function') {
            try { renderAtrakNews(); } catch (e) {}
        }
    } catch (error) {
        console.warn('اعمال تغییرات لحظه‌ای سایت انجام نشد:', error);
    }
}

async function refreshSiteFromRealtime() {
    try {
        await loadStateFromCloud();
        applyCloudStateAfterRealtime();
    } catch (error) {
        console.warn('دریافت تغییرات لحظه‌ای سایت ناموفق بود:', error);
    }
}

function scheduleRealtimeSiteRefresh() {
    clearTimeout(atrakRealtimeRefreshTimer);
    atrakRealtimeRefreshTimer = setTimeout(() => {
        refreshSiteFromRealtime();
    }, 120);
}

async function startAtrakRealtime() {
    if (atrakRealtimeStarted || !isCloudStorageConfigured()) return;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn('کتابخانه Supabase برای Realtime بارگذاری نشده است.');
        return;
    }

    console.log('بررسی مقادیر اولیه:', {
        URL: SUPABASE_URL,
        KEY: SUPABASE_ANON_KEY ? 'مقدار موجود است' : 'خالی است!',
        ROW_ID: SUPABASE_ROW_ID
    });

    atrakRealtimeStarted = true;

    try {
        atrakRealtimeClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        atrakRealtimeChannel = atrakRealtimeClient
            .channel('atrak-site-state-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_state',
                    filter: `id=eq.${SUPABASE_ROW_ID}`
                },
                (payload) => {
                    const incoming = payload && payload.new && payload.new.data;
                    if (!incoming || typeof incoming !== 'object') return;

                    const incomingUpdatedAt = Number(incoming.updatedAt || 0);
                    const localUpdatedAt = Number(localStorage.getItem('atrak_state_updated_at') || 0);
                    if (incomingUpdatedAt && localUpdatedAt >= incomingUpdatedAt) return;

                    scheduleRealtimeSiteRefresh();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'site_state',
                    filter: `id=eq.${ATRAK_QBANK_ROW_ID}`
                },
                () => {
                    if (typeof state !== 'undefined' && state && state.isAdmin === true) return;
                    loadQuestionsBankFromCloud().then(() => {
                        try { renderCurrentView(); } catch (e) {}
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Supabase Realtime فعال شد!');
                } else {
                    console.error('❌ وضعیت اتصال Realtime:', status);
                }
            });
    } catch (error) {
        atrakRealtimeStarted = false;
        console.error('❌ خطای بحرانی در راه‌اندازی Realtime:', error);
    }
}

async function loadMainStateFromCloud() {
    if (!isCloudStorageConfigured()) return;

    try {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Cloud load timeout')), 5000);
        });

        const response = await Promise.race([
            fetch(
                `${SUPABASE_URL}/rest/v1/site_state?id=eq.${SUPABASE_ROW_ID}&select=data`,
                {
                    headers: {
                        apikey: SUPABASE_ANON_KEY
                    }
                }
            ),
            timeout
        ]);

        if (!response.ok) return;

        const rows = await response.json();
        const data = rows[0] && rows[0].data;
        if (!data || typeof data !== 'object') return;

        if (typeof data.edits === 'string') {
            localStorage.setItem('atrak_saved_edits', data.edits);
        }
        if (typeof data.icons === 'string') {
            localStorage.setItem('atrak_saved_icons', data.icons);
        }
        if (typeof data.images === 'string') {
            localStorage.setItem('atrak_saved_images', data.images);
        }
        if (typeof data.news === 'string') {
            localStorage.setItem(ATRAK_NEWS_STORAGE_KEY, data.news);
        }
        if (typeof data.components === 'string') {
            localStorage.setItem('atrak_dynamic_elements_v1', data.components);
        }
        if (typeof data.comments_v39 === 'string') {
            localStorage.setItem('atrak_comments_v39', data.comments_v39);
        }
        if (typeof data.honors === 'string') {
            localStorage.setItem('atrak_honors_v1', data.honors);
        }
        if (typeof data.questions === 'string') {
            localStorage.setItem('atrak_questions_v1', data.questions);
        }
        if (typeof data.iconColor === 'string') {
            localStorage.setItem('atrak_icon_color', data.iconColor);
        }
        if (typeof data.theme === 'string' && data.theme) {
            localStorage.setItem('atrak_theme', data.theme);
        }
        if (data.updatedAt !== undefined && data.updatedAt !== null) {
            localStorage.setItem('atrak_state_updated_at', String(data.updatedAt));
        }
    } catch (error) {
        console.error('خطا در دریافت ذخیره‌سازی آنلاین:', error);
    }
}


// =========================================================
// بانک سوالات (متن کتاب / نوبت اول / نوبت دوم)
// -------------------------------------------------------
// سوالات در چند کلید localStorage ذخیره می‌شوند که قبلاً به Cloud
// وصل نبودند. اینجا هر تغییر روی این کلیدها خودکار در یک ردیف جدا
// (site_state با id = questions_bank) ذخیره می‌شود تا:
//   1) برای همه کاربران نمایش داده شود
//   2) حجم زیاد، ردیف اصلی سایت را خراب نکند
//   3) اگر حافظه مرورگر پر بود، ذخیره باز هم انجام شود
// =========================================================
const ATRAK_QBANK_ROW_ID = 'questions_bank';
const ATRAK_QBANK_KEYS = [
    'atrak_questions_v1',
    'atrak_middle1_questions',
    'MIDDLE1_QUESTIONS_FINAL_V3',
    'atrak_question_chapter_settings'
];
const ATRAK_QBANK_DIRTY = 'atrak_qbank_dirty';

const atrakQbankMemory = {};
let atrakQbankApplying = false;
let atrakQbankTimer = null;
let atrakQbankQueue = Promise.resolve();
let atrakQbankAlerted = false;

(function patchQuestionStorage() {
    const nativeSet = Storage.prototype.setItem;
    const nativeGet = Storage.prototype.getItem;

    function isQbankKey(storage, key) {
        return storage === window.localStorage &&
            ATRAK_QBANK_KEYS.indexOf(String(key)) !== -1;
    }

    Storage.prototype.setItem = function (key, value) {
        if (!isQbankKey(this, key)) {
            return nativeSet.call(this, key, value);
        }

        const text = String(value);
        try {
            nativeSet.call(this, key, text);
            delete atrakQbankMemory[key];
        } catch (error) {
            // حافظه مرورگر پر است؛ مقدار در حافظه موقت نگه داشته می‌شود
            // و به Cloud ارسال خواهد شد.
            atrakQbankMemory[key] = text;
            console.warn('localStorage پر است؛ سوالات فقط در Cloud ذخیره می‌شوند.', error);
        }

        if (!atrakQbankApplying) {
            atrakScheduleQuestionsPush();
        }
    };

    Storage.prototype.getItem = function (key) {
        if (isQbankKey(this, key) &&
            Object.prototype.hasOwnProperty.call(atrakQbankMemory, key)) {
            return atrakQbankMemory[key];
        }
        return nativeGet.call(this, key);
    };
})();

function atrakIsAdminNow() {
    return typeof state !== 'undefined' && state && state.isAdmin === true;
}

function atrakScheduleQuestionsPush() {
    if (!isCloudStorageConfigured() || !atrakIsAdminNow()) return;

    try { localStorage.setItem(ATRAK_QBANK_DIRTY, '1'); } catch (e) {}

    clearTimeout(atrakQbankTimer);
    atrakQbankTimer = setTimeout(pushQuestionsBankToCloud, 800);
}

function pushQuestionsBankToCloud() {
    if (!isCloudStorageConfigured() || !atrakIsAdminNow()) return Promise.resolve();

    atrakQbankQueue = atrakQbankQueue.then(async () => {
        const items = {};
        ATRAK_QBANK_KEYS.forEach((key) => {
            const value = localStorage.getItem(key);
            if (typeof value === 'string') items[key] = value;
        });

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/site_state?on_conflict=id`,
            {
                method: 'POST',
                headers: getSupabaseWriteHeaders(),
                body: JSON.stringify({
                    id: ATRAK_QBANK_ROW_ID,
                    data: {
                        schemaVersion: 1,
                        updatedAt: String(Date.now()),
                        items: items
                    }
                })
            }
        );

        if (!response.ok) {
            const details = await response.text().catch(() => '');
            throw new Error(`${response.status} ${details}`);
        }

        try { localStorage.removeItem(ATRAK_QBANK_DIRTY); } catch (e) {}
        atrakQbankAlerted = false;
    }).catch((error) => {
        console.error('خطا در ذخیره آنلاین بانک سوالات:', error);
        if (!atrakQbankAlerted) {
            atrakQbankAlerted = true;
            alert(
                'سوالات روی این دستگاه ذخیره شد اما در سرور ذخیره نشد، ' +
                'پس برای بقیه کاربران دیده نمی‌شود.\n\n' +
                'جزئیات خطا: ' + (error && error.message ? error.message : error)
            );
        }
    });

    return atrakQbankQueue;
}

async function loadQuestionsBankFromCloud() {
    if (!isCloudStorageConfigured()) return;

    try {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Questions load timeout')), 5000);
        });

        const response = await Promise.race([
            fetch(
                `${SUPABASE_URL}/rest/v1/site_state?id=eq.${ATRAK_QBANK_ROW_ID}&select=data`,
                { headers: { apikey: SUPABASE_ANON_KEY } }
            ),
            timeout
        ]);

        if (!response.ok) return;

        const rows = await response.json();
        const items = rows[0] && rows[0].data && rows[0].data.items;
        const isAdmin = atrakIsAdminNow();

        // مدیر: اگر تغییر ذخیره‌نشده دارد، آن را به Cloud بفرست و رونویسی نکن
        let dirty = false;
        try { dirty = localStorage.getItem(ATRAK_QBANK_DIRTY) === '1'; } catch (e) {}
        if (isAdmin && dirty) {
            atrakScheduleQuestionsPush();
            return;
        }

        if (!items || typeof items !== 'object') {
            // هنوز چیزی در Cloud نیست: سوالات موجود مدیر را یک بار آپلود کن
            if (isAdmin && ATRAK_QBANK_KEYS.some((k) => localStorage.getItem(k))) {
                atrakScheduleQuestionsPush();
            }
            return;
        }

        atrakQbankApplying = true;
        try {
            ATRAK_QBANK_KEYS.forEach((key) => {
                if (typeof items[key] === 'string') {
                    localStorage.setItem(key, items[key]);
                }
            });
        } finally {
            atrakQbankApplying = false;
        }
    } catch (error) {
        console.error('خطا در دریافت بانک سوالات:', error);
    }
}

async function loadStateFromCloud() {
    await loadMainStateFromCloud();
    await loadQuestionsBankFromCloud();
}
