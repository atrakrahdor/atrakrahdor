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
        table: 'site_state'
    },
    (payload) => {

        const changedId =
            payload &&
            payload.new &&
            payload.new.id;

        if (
            typeof changedId !== 'string'
        ) {
            return;
        }

        // فقط تغییرات مربوط به بانک سوالات
        if (
            !changedId.startsWith(
                'questions_lesson_'
            )
        ) {
            return;
        }

        // مدیر تغییر خودش را دوباره از Cloud دریافت نکند
        if (
            typeof state !== 'undefined' &&
            state &&
            state.isAdmin === true
        ) {
            return;
        }

        loadQuestionsBankFromCloud()
            .then(() => {

                try {
                    renderCurrentView();
                } catch (e) {}

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
// بانک سوالات مستقل
// هر درس در یک رکورد جداگانه Supabase ذخیره می‌شود.
// =========================================================

const ATRAK_QLESSON_PREFIX =
    'questions_lesson_';

let atrakQuestionsCloudQueue =
    Promise.resolve();

function getQuestionsLessonRowId(lessonId) {

    return (
        ATRAK_QLESSON_PREFIX +
        encodeURIComponent(
            String(lessonId)
        )
    );
}


// =========================================================
// ذخیره سوالات یک درس
// =========================================================

async function saveQuestionsLessonToCloud(
    lessonId,
    lessonQuestions
) {

    if (!isCloudStorageConfigured()) {
        return false;
    }

    if (!atrakIsAdminNow()) {
        return false;
    }

    const rowId =
        getQuestionsLessonRowId(
            lessonId
        );

    atrakQuestionsCloudQueue =
        atrakQuestionsCloudQueue.then(
            async () => {

                const response =
                    await fetch(
                        `${SUPABASE_URL}/rest/v1/site_state?on_conflict=id`,
                        {
                            method: 'POST',

                            headers:
                                getSupabaseWriteHeaders(),

                            body:
                                JSON.stringify({

                                    id: rowId,

                                    data: {

                                        schemaVersion: 2,

                                        lessonId:
                                            String(
                                                lessonId
                                            ),

                                        updatedAt:
                                            String(
                                                Date.now()
                                            ),

                                        questions:
                                            lessonQuestions

                                    }

                                })
                        }
                    );

                if (!response.ok) {

                    const details =
                        await response
                            .text()
                            .catch(() => '');

                    throw new Error(
                        `ذخیره سوالات درس ناموفق بود: ${response.status} ${details}`
                    );
                }

            }
        );

    try {

        await atrakQuestionsCloudQueue;

        console.log(
            '✅ سوالات این درس در Cloud ذخیره شد:',
            lessonId
        );

        return true;

    } catch (error) {

        console.error(
            '❌ خطا در ذخیره آنلاین سوالات:',
            error
        );

        alert(
            'سوال روی این دستگاه ذخیره شد، ' +
            'اما ذخیره آن در سرور انجام نشد.\n\n' +
            'جزئیات خطا:\n' +
            (
                error &&
                error.message
                    ? error.message
                    : error
            )
        );

        return false;
    }
}


// =========================================================
// دریافت تمام سوالات از Cloud
// =========================================================

async function loadQuestionsBankFromCloud() {

    if (!isCloudStorageConfigured()) {
        return;
    }

    try {

        const params =
            new URLSearchParams();

        params.set(
            'select',
            'id,data'
        );

        params.set(
            'id',
            `like.${ATRAK_QLESSON_PREFIX}*`
        );

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/site_state?${params.toString()}`,
                {
                    headers: {
                        apikey:
                            SUPABASE_ANON_KEY
                    }
                }
            );

        if (!response.ok) {

            const details =
                await response
                    .text()
                    .catch(() => '');

            throw new Error(
                `دریافت سوالات ناموفق بود: ${response.status} ${details}`
            );
        }

        const rows =
            await response.json();

        if (
            !Array.isArray(rows) ||
            rows.length === 0
        ) {

            console.log(
                'هنوز بانک سوالات جدید در Cloud وجود ندارد.'
            );

            return;
        }


        let allQuestions = {};

        try {

            const local =
                localStorage.getItem(
                    'atrak_questions_v1'
                );

            if (local) {

                allQuestions =
                    JSON.parse(local) || {};

            }

        } catch (error) {

            allQuestions = {};

        }


        rows.forEach(function(row) {

            const data =
                row &&
                row.data;

            if (
                !data ||
                typeof data !== 'object'
            ) {
                return;
            }

            const lessonId =
                String(
                    data.lessonId || ''
                );

            if (!lessonId) {
                return;
            }

            if (
                data.questions &&
                typeof data.questions === 'object'
            ) {

                allQuestions[
                    lessonId
                ] =
                    data.questions;

            }

        });


        localStorage.setItem(
            'atrak_questions_v1',
            JSON.stringify(
                allQuestions
            )
        );


        console.log(
            '✅ بانک سوالات از Cloud دریافت شد.'
        );


    } catch (error) {

        console.error(
            '❌ خطا در دریافت بانک سوالات:',
            error
        );

    }

}


// =========================================================
// دریافت کل وضعیت سایت
// =========================================================

async function loadStateFromCloud() {

    await loadMainStateFromCloud();

    await loadQuestionsBankFromCloud();

}
