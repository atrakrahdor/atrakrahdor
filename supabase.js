 const SUPABASE_URL = 'https://ynbtegberxjesxvjevoi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IO2OKA-9uPneVIDfL3avJg_fsKbPlHG';
const SUPABASE_ROW_ID = 'main';
let cloudSyncQueue = Promise.resolve();

        function isCloudStorageConfigured() {
            return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
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
                        headers: {
                            apikey: SUPABASE_ANON_KEY,
                            'Content-Type': 'application/json',
                            Prefer: 'resolution=merge-duplicates,return=minimal'
                        },
                        body: JSON.stringify({
                            id: SUPABASE_ROW_ID,
                            data
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`Cloud save failed: ${response.status}`);
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

    // اضافه کردن این خط برای عیب‌یابی
    console.log("بررسی مقادیر اولیه:", { 
        URL: SUPABASE_URL, 
        KEY: SUPABASE_ANON_KEY ? "مقدار موجود است" : "خالی است!", 
        ROW_ID: SUPABASE_ROW_ID 
    });

    atrakRealtimeStarted = true;

    try {
        // اصلاح شد: بخش auth حذف شد تا از تداخل جلوگیری شود
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


        async function loadStateFromCloud() {
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

                // Cloud منبع اصلی اطلاعات مشترک سایت است.
                // نسخه قدیمی localStorage دیگر نباید Cloud را بازنویسی کند.
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

                if (typeof data.iconColor === 'string') {
                    localStorage.setItem('atrak_icon_color', data.iconColor);
                }

                if (typeof data.theme === 'string' && data.theme) {
                    localStorage.setItem('atrak_theme', data.theme);
                }

                if (data.updatedAt !== undefined && data.updatedAt !== null) {
                    localStorage.setItem(
                        'atrak_state_updated_at',
                        String(data.updatedAt)
                    );
                }
            } catch (error) {
                console.error('خطا در دریافت ذخیره‌سازی آنلاین:', error);
            }
        }
