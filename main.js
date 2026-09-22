 // Supabase project settings. Replace these two values before publishing.
    // اضافه کردن تابع گمشده برای جلوگیری از خطای ReferenceError
function getSavedStudentUsername() {
    try {
        return localStorage.getItem('atrak_student_last_username_v1') || '';
    } catch (e) {
        console.error("خطا در بازیابی نام کاربری از حافظه:", e);
        return '';
    }
}

        let isAdminMode = false;
        let atrakSelectedNewsId = null;

        /* =========================================================
           تاریخچه ناوبری پایدار
           فقط تاریخچه صفحات عمومی/مدیریتی را در مرورگر نگه می‌دارد.
           محتوای LMS را تغییر نمی‌دهد.
        ========================================================= */
        const ATRAk_HISTORY_STORAGE_KEY = 'atrak_navigation_history_v1';

        function persistNavigationHistory(target) {
            try {
                const fullHistory = Array.isArray(target.history) && target.history.length
                    ? target.history.filter(item => typeof item === 'string')
                    : ['home'];
                const fullIndex = Number.isFinite(Number(target.historyIndex))
                    ? Number(target.historyIndex)
                    : fullHistory.length - 1;
                const safeIndex = Math.max(0, Math.min(fullIndex, fullHistory.length - 1));

                // فقط ۵۰ مورد آخر ذخیره می‌شوند و اندیس همزمان با برش اصلاح می‌شود.
                const start = Math.max(0, fullHistory.length - 50);
                const history = fullHistory.slice(start);
                const historyIndex = Math.max(0, Math.min(safeIndex - start, history.length - 1));

                localStorage.setItem(
                    ATRAk_HISTORY_STORAGE_KEY,
                    JSON.stringify({ history, historyIndex })
                );
            } catch (historySaveError) {
                console.warn('ذخیره تاریخچه ناوبری انجام نشد:', historySaveError);
            }
        }

      let state = new Proxy({
    theme: localStorage.getItem('atrak_theme') || 'light',
    isAdmin: false,
    currentView: 'home',
    history: ['home'],
    historyIndex: 0,
    carouselIndex: 0,
    _historyNavigation: false
}, {
    set(target, property, value) {

        if (
            property === 'currentView' &&
            target.currentView !== value &&
            target._historyNavigation !== true
        ) {
            target.history =
                target.history.slice(0, target.historyIndex + 1);

            target.history.push(value);

            target.historyIndex =
                target.history.length - 1;
        }

        target[property] = value;

        /* تاریخچه بعد از هر تغییر ناوبری ذخیره شود تا با F5 از بین نرود. */
        if (property === 'currentView' || property === 'history' || property === 'historyIndex') {
            persistNavigationHistory(target);
        }

        return true;
    }
});

        /* بازیابی تاریخچه قبلی؛ اگر خراب باشد، تاریخچه استاندارد از صفحه اصلی شروع می‌شود. */
        try {
            const savedHistory = JSON.parse(
                localStorage.getItem(ATRAk_HISTORY_STORAGE_KEY) || 'null'
            );
            if (
                savedHistory &&
                Array.isArray(savedHistory.history) &&
                savedHistory.history.length &&
                savedHistory.history.every(item => typeof item === 'string')
            ) {
                const validHistory = savedHistory.history.filter(item => item === 'home' || views[item]);
                if (validHistory.length) {
                    const originalIndex = Math.max(
                        0,
                        Math.min(
                            Number(savedHistory.historyIndex) || 0,
                            validHistory.length - 1
                        )
                    );
                    const start = Math.max(0, validHistory.length - 50);
                    state.history = validHistory.slice(start);
                    state.historyIndex = Math.max(
                        0,
                        Math.min(originalIndex - start, state.history.length - 1)
                    );
                    persistNavigationHistory(state);
                }
            }
        } catch (historyLoadError) {
            console.warn('بازیابی تاریخچه ناوبری انجام نشد:', historyLoadError);
            state.history = ['home'];
            state.historyIndex = 0;
        }

        let activeEditableElement = null;
        let targetIconSvgElement = null;

        const LMS_PASSCODE = "101090";
        let atrakAdminAccessToken = '';

        const defaultImages = {
            intro: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
            classroom: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
            srvVirtual: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=600&q=80',
            srvMonitor: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
            srvSupport: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=600&q=80',
            srvResources: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
            srvCert: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
            slide1: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
            slide2: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
            slide3: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
        };

        const iconLibrary100 = [
            `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>`,
            `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>`,
            `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>`,
            `<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>`,
            `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
            `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`,
            `<circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>`,
            `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`,
            `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>`,
            `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>`,
            `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>`,
            `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>`,
            `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`,
            `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>`,
            `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
            `<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>`,
            `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline>`,
            `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`,
            `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`,
            `<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,
            `<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>`,
            `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>`,
            `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>`,
            `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
            `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>`,
            `<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>`,
            `<circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon>`,
            `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>`,
            `<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>`,
            `<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>`,
            `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>`,
            `<path d="M6 9l6 6 6-6"></path>`,
            `<path d="M18 15l-6-6-6 6"></path>`,
            `<polyline points="20 6 9 17 4 12"></polyline>`,
            `<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`,
            `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
            `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>`,
            `<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>`,
            `<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>`,
            `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>`,
            `<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path>`,
            `<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>`,
            `<path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path>`,
            `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>`,
            `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`,
            `<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>`,
            `<path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle>`,
            `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>`,
            `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="6" x2="12" y2="12"></line><line x1="12" y1="12" x2="16" y2="14"></line>`,
            `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>`,
            `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>`,
            `<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path>`,
            `<rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 15h0M12 15h0M17 15h0M7 11h0M12 11h0M17 11h0M7 7h0M12 7h0M17 7h0"></path>`,
            `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`,
            `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>`,
            `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 12 8"></polygon>`,
            `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>`,
            `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>`,
            `<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>`,
            `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>`,
            `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line>`,
            `<path d="M9 18l6-6-6-6"></path>`,
            `<path d="M15 18l-6-6 6-6"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M12 8v8M8 12h8"></path>`,
            `<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>`,
            `<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><polyline points="12 8 8 12 12 16"></polyline><line x1="16" y1="12" x2="8" y2="12"></line>`,
            `<circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line>`,
            `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>`,
            `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>`,
            `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="2" y1="2" x2="22" y2="22"></line>`,
            `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line>`,
            `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path>`,
            `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
            `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>`,
            `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle>`,
            `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`,
            `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>`,
            `<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>`,
            `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
            `<circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>`,
            `<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`,
            `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`,
            `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>`,
            `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>`,
            `<circle cx="12" cy="12" r="10"></circle><path d="M15 9.35a4 4 0 1 0 0 5.3"></path>`,
        



];


        /* =========================================================
   جستجوی مطالب آموزشی فقط داخل سامانه آموزش مجازی
   ========================================================= */

function searchLmsMaterials() {

    const input =
        document.getElementById('lmsMaterialSearch');

    const results =
        document.getElementById('lmsSearchResults');

    if (!input || !results) {
        return;
    }

    const query =
        input.value.trim().toLowerCase();

    results.innerHTML = '';

    if (!query) {
        results.style.display = 'none';
        return;
    }

    /*
       فقط درس‌هایی که در همین فایل صفحه محتوایی دارند
       بررسی می‌شوند.
    */
    const lessonKeys = Object.keys(views).filter(function (key) {

        return (
            /^m1-p[789]-lesson\d+$/.test(key) ||
            /^m2-p(10|11|12)-/.test(key)
        );

    });

    const found = [];

    lessonKeys.forEach(function (lessonKey) {

        const html =
            String(views[lessonKey] || '');

        /*
           پیدا کردن عنوان درس از خود صفحه همان درس
        */
        const titleMatch =
            html.match(
                /data-editable="[^"]*-title"[^>]*>([^<]+)</
            );

        let lessonTitle =
            titleMatch
                ? titleMatch[1].trim()
                : lessonKey;

        /*
           متن قابل جستجو
        */
        const searchableText =
            (
                lessonTitle +
                ' ' +
                lessonKey +
                ' فیلم آموزشی ' +
                'مطالب آموزشی ' +
                'جزوه '
            ).toLowerCase();

        if (
            searchableText.includes(query)
        ) {

            found.push({
                key: lessonKey,
                title: lessonTitle
            });

        }

    });

    if (!found.length) {

        results.style.display = 'block';

        results.innerHTML = `
            <div style="
                padding:20px;
                text-align:center;
                color:var(--text-muted);
                background:var(--card-bg);
                border:1px solid var(--card-border);
                border-radius:14px;
            ">
                مطلبی با این عبارت پیدا نشد.
            </div>
        `;

        return;
    }

    results.style.display = 'grid';

    found.forEach(function (item) {

        const card =
            document.createElement('div');

        card.style.cssText = `
            padding:14px;
            border:1px solid var(--card-border);
            background:var(--card-bg);
            border-radius:14px;
            cursor:pointer;
            transition:all .2s ease;
            text-align:right;
        `;

        card.innerHTML = `
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
            ">

                <div style="
                    width:42px;
                    height:42px;
                    min-width:42px;
                    border-radius:12px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:rgba(236,72,153,.10);
                    color:var(--accent-pink);
                    font-size:22px;
                ">
                    🎬
                </div>

                <div>
                    <div style="
                        font-weight:800;
                        color:var(--text-color);
                        font-size:14px;
                        line-height:1.8;
                    ">
                        ${escapeQuestionHTML(item.title)}
                    </div>

                    <div style="
                        color:var(--text-muted);
                        font-size:12px;
                        margin-top:3px;
                    ">
                        مشاهده فیلم‌ها و مطالب آموزشی
                    </div>
                </div>

            </div>
        `;

        card.onmouseenter = function () {
            card.style.background =
                'var(--card-hover-bg)';
            card.style.transform =
                'translateY(-2px)';
        };

        card.onmouseleave = function () {
            card.style.background =
                'var(--card-bg)';
            card.style.transform =
                'translateY(0)';
        };

        card.onclick = function () {

            openLessonVideos(
                item.key,
                item.title
            );

        };

        results.appendChild(card);

    });
}
/* =========================================================
   سیستم کامل اخبار مدرسه اترک
   ========================================================= */

const ATRAK_NEWS_STORAGE_KEY = 'atrak_school_news_v1';

let atrakNewsCurrentIndex = 0;
let atrakNewsTimer = null;
let atrakNewsTouchStartX = 0;

function getAtrakNews() {

    try {

        const saved =
            localStorage.getItem(
                ATRAK_NEWS_STORAGE_KEY
            );

        if (saved) {

            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }

    } catch (error) {

        console.error(
            'خطا در خواندن اخبار:',
            error
        );

    }

    return [
        {
            id: 'news-1',
            title: 'اطلاعیه مهم مدرسه آموزش از راه دور اترک',
            date: '2026-09-14',
            image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=900&q=80',
            content:
                'این قسمت متن کامل خبر اول است. مدیر مدرسه می‌تواند این متن را از بخش مدیریت اخبار تغییر دهد.'
        },

        {
            id: 'news-2',
            title: 'شروع برنامه‌های آموزشی جدید مدرسه',
            date: '2026-09-12',
            image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
            content:
                'در این قسمت می‌توانید متن کامل خبر دوم را قرار دهید.'
        },

        {
            id: 'news-3',
            title: 'اطلاعیه آموزشی برای دانش‌آموزان',
            date: '2026-09-10',
            image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
            content:
                'متن کامل خبر سوم در این قسمت نمایش داده می‌شود.'
        },

        {
            id: 'news-4',
            title: 'خبر جدید مدرسه اترک',
            date: '2026-09-08',
            image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80',
            content:
                'این قسمت متن کامل خبر چهارم است.'
        }
    ];
}


function saveAtrakNews(news) {

    try {

        localStorage.setItem(
            ATRAK_NEWS_STORAGE_KEY,
            JSON.stringify(
                Array.isArray(news)
                    ? news
                    : []
            )
        );

        /*
         * ارسال خبرها به فضای ابری
         * تا بعداً همه کاربران همان اطلاعات را ببینند.
         */
        if (
            typeof syncStateToCloud ===
            'function'
        ) {
            syncStateToCloud();
        }

        return true;

    } catch (error) {

        console.error(
            'خطا در ذخیره اخبار:',
            error
        );

        return false;
    }
}


function escapeAtrakNewsHTML(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function formatAtrakNewsDate(dateValue) {

    if (!dateValue) {
        return '';
    }

    try {

        const parts =
            String(dateValue).split('-');

        if (parts.length === 3) {

            return (
                parts[2] +
                '/' +
                parts[1] +
                '/' +
                parts[0]
            );
        }

    } catch (e) {}

    return dateValue;
}


function sortAtrakNews(news) {

    return [...news].sort(
        (a, b) =>
            new Date(b.date || 0) -
            new Date(a.date || 0)
    );
}


function getAtrakNewsVisibleCount() {

    if (window.innerWidth <= 600) {
        return 1;
    }

    if (window.innerWidth <= 900) {
        return 2;
    }

    return 4;
}


function renderAtrakNews() {

    const track =
        document.getElementById(
            'atrakNewsTrack'
        );

    if (!track) {
        return;
    }

    const news =
        sortAtrakNews(
            getAtrakNews()
        );

    if (!news.length) {

        track.innerHTML = `
            <div
                class="atrak-news-empty"
                style="
                    width:100%;
                    text-align:center;
                    padding:30px;
                "
            >
                هنوز خبری منتشر نشده است.
            </div>
        `;

        return;
    }


    track.innerHTML =
        news.map(function(item) {

            return `
                <article
                    class="atrak-news-card"
                    onclick="openAtrakNews('${item.id}')"
                >

                    <img
                        class="atrak-news-image"
                        src="${escapeAtrakNewsHTML(item.image)}"
                        alt="${escapeAtrakNewsHTML(item.title)}"
                        loading="lazy"
                        onerror="
                            this.src='${escapeAtrakNewsHTML(defaultImages.slide1)}'
                        "
                     decoding="async">

                    <div class="atrak-news-card-content">

                        <h3 class="atrak-news-card-title">
                            ${escapeAtrakNewsHTML(item.title)}
                        </h3>

                        <div class="atrak-news-card-date">
                            ${formatAtrakNewsDate(item.date)}
                        </div>

                        <div class="atrak-news-card-more">
                            مشاهده خبر
                        </div>

                    </div>

                </article>
            `;

        }).join('');


    atrakNewsCurrentIndex = 0;

    updateAtrakNewsSlider();

    startAtrakNewsAutoSlide();

}


function updateAtrakNewsSlider() {

    const track =
        document.getElementById(
            'atrakNewsTrack'
        );

    if (!track) {
        return;
    }

    const visible =
        getAtrakNewsVisibleCount();

    const news =
        sortAtrakNews(
            getAtrakNews()
        );

    const maxIndex =
        Math.max(
            0,
            news.length - visible
        );

    if (
        atrakNewsCurrentIndex >
        maxIndex
    ) {

        atrakNewsCurrentIndex =
            maxIndex;
    }

    /*
     * جهت حرکت RTL است.
     * با هر مرحله، کارت‌ها یکی‌یکی جابه‌جا می‌شوند.
     */

    const cards =
        track.querySelectorAll(
            '.atrak-news-card'
        );

    if (!cards.length) {
        return;
    }

    const firstCard =
        cards[0];

    const cardWidth =
        firstCard.getBoundingClientRect().width;

    const gap = 18;

    const move =
        (cardWidth + gap) *
        atrakNewsCurrentIndex;

    track.style.transform =
        `translateX(${move}px)`;
}


function atrakNewsNext() {

    const news =
        sortAtrakNews(
            getAtrakNews()
        );

    const visible =
        getAtrakNewsVisibleCount();

    const maxIndex =
        Math.max(
            0,
            news.length - visible
        );

    if (!news.length) {
        return;
    }

    if (
        atrakNewsCurrentIndex <
        maxIndex
    ) {

        atrakNewsCurrentIndex++;

    } else {

        atrakNewsCurrentIndex = 0;
    }

    updateAtrakNewsSlider();
}


function atrakNewsPrev() {

    const news =
        sortAtrakNews(
            getAtrakNews()
        );

    const visible =
        getAtrakNewsVisibleCount();

    const maxIndex =
        Math.max(
            0,
            news.length - visible
        );

    if (!news.length) {
        return;
    }

    if (
        atrakNewsCurrentIndex > 0
    ) {

        atrakNewsCurrentIndex--;

    } else {

        atrakNewsCurrentIndex =
            maxIndex;
    }

    updateAtrakNewsSlider();
}


function startAtrakNewsAutoSlide() {

    stopAtrakNewsAutoSlide();

    atrakNewsTimer =
        setInterval(
            () => {

                const section =
                    document.getElementById(
                        'atrakNewsSection'
                    );

                if (!section) {
                    return;
                }

                if (
                    section.matches(':hover')
                ) {
                    return;
                }

                atrakNewsNext();

            },
            4000
        );
}


function stopAtrakNewsAutoSlide() {

    if (atrakNewsTimer) {

        clearInterval(
            atrakNewsTimer
        );

        atrakNewsTimer = null;
    }
}


/* لمس موبایل */

function initAtrakNewsTouch() {

    const slider =
        document.getElementById(
            'atrakNewsSlider'
        );

    if (!slider) {
        return;
    }

    slider.addEventListener(
        'touchstart',
        function(event) {

            atrakNewsTouchStartX =
                event.changedTouches[0].screenX;

        },
        { passive: true }
    );


    slider.addEventListener(
        'touchend',
        function(event) {

            const endX =
                event.changedTouches[0].screenX;

            const difference =
                endX -
                atrakNewsTouchStartX;

            if (
                Math.abs(difference) <
                40
            ) {
                return;
            }

            if (difference > 0) {

                atrakNewsPrev();

            } else {

                atrakNewsNext();
            }

        },
        { passive: true }
    );
}


/* باز کردن خبر */

function openAtrakNews(newsId) {

    const news =
        getAtrakNews().find(
            item =>
                item.id === newsId
        );

    if (!news) {
        return;
    }

    atrakSelectedNewsId = newsId;

    state.currentView = 'news-detail';

    renderCurrentView();

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


function closeAtrakNewsModal() {

    const modal =
        document.getElementById(
            'atrakNewsModalOverlay'
        );

    if (modal) {
        modal.style.display =
            'none';
    }
}


/* =========================================================
   آرشیو اخبار
   ========================================================= */

function renderAtrakNewsArchive() {

    const container =
        document.getElementById(
            'atrakNewsArchiveContainer'
        );

    if (!container) {
        return;
    }

    const news =
        sortAtrakNews(
            getAtrakNews()
        );


    if (!news.length) {

        container.innerHTML = `
            <div class="atrak-news-empty">
                هنوز هیچ خبری در آرشیو قرار نگرفته است.
            </div>
        `;

        return;
    }


    container.innerHTML =
        news.map(item => {

            return `

                <article
                    class="atrak-news-archive-card"
                    onclick="openAtrakNews('${item.id}')">

                    <img
                        src="${escapeAtrakNewsHTML(item.image)}"
                        alt="${escapeAtrakNewsHTML(item.title)}" decoding="async" loading="lazy">

                    <div class="atrak-news-archive-content">

                        <h3>
                            ${escapeAtrakNewsHTML(item.title)}
                        </h3>

                        <div class="atrak-news-date">
                            ${formatAtrakNewsDate(item.date)}
                        </div>

                    </div>

                </article>

            `;

        }).join('');
}

function renderAtrakNewsDetail() {

    const container =
        document.getElementById(
            'atrakNewsDetailContainer'
        );

    if (!container) {
        return;
    }

    const news =
        getAtrakNews().find(
            item =>
                item.id === atrakSelectedNewsId
        );

    if (!news) {

        container.innerHTML = `
            <div class="atrak-news-empty">
                خبر موردنظر پیدا نشد.
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="atrak-news-detail-image-wrap">

            <img
                class="atrak-news-detail-image"
                src="${escapeAtrakNewsHTML(news.image)}"
                alt="${escapeAtrakNewsHTML(news.title)}"
                onerror="
                    this.src='${escapeAtrakNewsHTML(defaultImages.slide1)}'
                "
             decoding="async" loading="lazy">

        </div>


        <div class="atrak-news-detail-body">

            <div class="atrak-news-detail-date">

                تاریخ انتشار:
                ${formatAtrakNewsDate(news.date)}

            </div>


            <h1 class="atrak-news-detail-title">

                ${escapeAtrakNewsHTML(news.title)}

            </h1>


            <div class="atrak-news-detail-text">

                ${escapeAtrakNewsHTML(news.content)}

            </div>


            ${
                state.isAdmin
                ?
                `
                <div class="atrak-news-detail-admin">

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="openAtrakNewsAdmin('${news.id}')">

                        ✏️ ویرایش این خبر

                    </button>

                </div>
                `
                :
                ''
            }

        </div>

    `;
}

/* =========================================================
   فرم مدیریت اخبار
   ========================================================= */

function openAtrakNewsAdmin(editId = '') {

    if (
        typeof state !== 'undefined' &&
        !state.isAdmin
    ) {

        alert(
            'ابتدا وارد حالت مدیریت شوید.'
        );

        return;
    }


    let modal =
        document.getElementById(
            'atrakNewsAdminModal'
        );


    if (!modal) {

        modal =
            document.createElement('div');

        modal.id =
            'atrakNewsAdminModal';

        modal.className =
            'atrak-news-modal-overlay';

        document.body.appendChild(
            modal
        );
    }


    const news =
        sortAtrakNews(
            getAtrakNews()
        );

    const editing =
        news.find(
            item =>
                item.id === editId
        );


    modal.innerHTML = `

        <div
            class="atrak-news-modal"
            style="width:min(850px,96vw);">

            <button
                type="button"
                class="atrak-news-modal-close"
                onclick="closeAtrakNewsAdmin()">
                ×
            </button>

            <h2>
                مدیریت اخبار مدرسه
            </h2>

            <p style="
                color:var(--text-muted);
                font-size:13px;
                margin-bottom:12px;
            ">
                از این بخش می‌توانید خبر جدید اضافه کنید
                یا خبرهای قبلی را ویرایش و حذف کنید.
            </p>


            <div class="atrak-news-form">

                <input
                    type="hidden"
                    id="atrakNewsEditId"
                    value="${editing ? escapeAtrakNewsHTML(editing.id) : ''}">


                <label>
                    تیتر خبر

                    <input
                        type="text"
                        id="atrakNewsTitleInput"
                        value="${editing ? escapeAtrakNewsHTML(editing.title) : ''}"
                        placeholder="مثلاً: اطلاعیه شروع ثبت‌نام">
                </label>


                <label>
                    تاریخ انتشار

                    <input
                        type="date"
                        id="atrakNewsDateInput"
                        value="${editing ? escapeAtrakNewsHTML(editing.date) : new Date().toISOString().slice(0,10)}">
                </label>


                <label>
    تصویر کادر خبر

    <input
        type="text"
        id="atrakNewsImageInput"
        value="${editing ? escapeAtrakNewsHTML(editing.image) : ''}"
        placeholder="آدرس تصویر یا تصویر انتخاب‌شده">

    <div
        style="
            display:flex;
            gap:8px;
            align-items:center;
            flex-wrap:wrap;
            margin-top:8px;
        ">

        <button
            type="button"
            class="btn-primary"
            style="
                background:var(--primary-purple);
                padding:8px 14px;
            "
            onclick="document.getElementById('atrakNewsLocalImageInput').click()">

            🖼️ انتخاب تصویر از دستگاه

        </button>

        <input
            type="file"
            id="atrakNewsLocalImageInput"
            accept="image/*"
            style="display:none"
            onchange="handleAtrakNewsLocalImage(this)">

    </div>

    <div
        id="atrakNewsImagePreview"
        style="
            margin-top:10px;
            display:${editing && editing.image ? 'block' : 'none'};
        ">

        ${
            editing && editing.image
            ?
            `
            <img
                alt="تصویر خبر"
                src="${escapeAtrakNewsHTML(editing.image)}"
                style="
                    width:180px;
                    height:110px;
                    object-fit:cover;
                    border-radius:12px;
                    border:1px solid var(--card-border);
                    display:block;
                "
                onerror="this.parentElement.style.display='none'" decoding="async" loading="lazy">
            `
            :
            ''
        }

    </div>

</label>

                <label>
                    متن کامل خبر

                    <textarea
                        id="atrakNewsContentInput"
                        placeholder="متن کامل خبر را بنویسید...">${editing ? escapeAtrakNewsHTML(editing.content) : ''}</textarea>
                </label>


                <div class="atrak-news-form-actions">

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="saveAtrakNewsFromAdmin()">
                        💾 ذخیره خبر
                    </button>

                   <button
    type="button"
    class="btn-primary"
    style="
        background:#ec4899;
        box-shadow:0 6px 18px rgba(236,72,153,.20);
    "
    onclick="clearAtrakNewsForm()">

    ＋ افزودن کادر

</button>

                </div>

            </div>


            <hr style="
                margin:22px 0;
                border:none;
                border-top:1px solid var(--card-border);
            ">


            <h3
                style="
                    color:var(--primary-purple);
                    margin-bottom:10px;
                ">
                خبرهای ثبت‌شده
            </h3>


            <div
                class="atrak-news-admin-list"
                id="atrakNewsAdminList">

            </div>

        </div>
    `;


    renderAtrakNewsAdminList();

    modal.style.display =
        'flex';
}


function renderAtrakNewsAdminList() {

    const container =
        document.getElementById(
            'atrakNewsAdminList'
        );

    if (!container) {
        return;
    }

    const news =
        sortAtrakNews(
            getAtrakNews()
        );


    if (!news.length) {

        container.innerHTML = `
            <div class="atrak-news-empty">
                هنوز خبری ثبت نشده است.
            </div>
        `;

        return;
    }


    container.innerHTML =
        news.map(item => {

            return `

                <div class="atrak-news-admin-item">

                    <img
                        src="${escapeAtrakNewsHTML(item.image)}"
                        alt="" decoding="async" loading="lazy">

                    <div class="atrak-news-admin-item-info">

                        <div
                            class="atrak-news-admin-item-title">
                            ${escapeAtrakNewsHTML(item.title)}
                        </div>

                        <div
                            class="atrak-news-admin-item-date">
                            ${formatAtrakNewsDate(item.date)}
                        </div>

                    </div>


                    <button
                        type="button"
                        class="atrak-news-admin-edit"
                        onclick="openAtrakNewsAdmin('${item.id}')">
                        ویرایش
                    </button>


                    <button
                        type="button"
                        class="atrak-news-admin-delete"
                        onclick="deleteAtrakNews('${item.id}')">
                        حذف
                    </button>

                </div>

            `;

        }).join('');
}


function saveAtrakNewsFromAdmin() {

    const title =
        document.getElementById(
            'atrakNewsTitleInput'
        )?.value.trim();

    const date =
        document.getElementById(
            'atrakNewsDateInput'
        )?.value;

    const image =
        document.getElementById(
            'atrakNewsImageInput'
        )?.value.trim();

    const content =
        document.getElementById(
            'atrakNewsContentInput'
        )?.value.trim();

    const editId =
        document.getElementById(
            'atrakNewsEditId'
        )?.value.trim();


    if (!title) {

        alert(
            'لطفاً تیتر خبر را وارد کنید.'
        );

        return;
    }


    if (!date) {

        alert(
            'لطفاً تاریخ خبر را انتخاب کنید.'
        );

        return;
    }


    if (!content) {

        alert(
            'لطفاً متن کامل خبر را وارد کنید.'
        );

        return;
    }


    const news =
        getAtrakNews();


    if (editId) {

        const index =
            news.findIndex(
                item =>
                    item.id === editId
            );

        if (index !== -1) {

            news[index] = {

                ...news[index],

                title,
                date,
                image:
                    image ||
                    defaultImages.slide1,
                content

            };
        }

    } else {

        news.push({

            id:
                'news-' +
                Date.now() +
                '-' +
                Math.random()
                    .toString(36)
                    .slice(2),

            title,

            date,

            image:
                image ||
                defaultImages.slide1,

            content

        });
    }


    saveAtrakNews(news);

    renderAtrakNews();

    renderAtrakNewsArchive();

    renderAtrakNewsAdminList();

    clearAtrakNewsForm();

    alert(
        'خبر با موفقیت ذخیره شد.'
    );
}


function clearAtrakNewsForm() {

    const id =
        document.getElementById(
            'atrakNewsEditId'
        );

    const title =
        document.getElementById(
            'atrakNewsTitleInput'
        );

    const date =
        document.getElementById(
            'atrakNewsDateInput'
        );

    const image =
        document.getElementById(
            'atrakNewsImageInput'
        );

    const content =
        document.getElementById(
            'atrakNewsContentInput'
        );


    if (id) {
        id.value = '';
    }

    if (title) {
        title.value = '';
    }

    if (date) {
        date.value =
            new Date()
                .toISOString()
                .slice(0,10);
    }

    if (image) {
        image.value = '';
    }

    if (content) {
        content.value = '';
    }
}

/* =========================================================
   انتخاب تصویر خبر از دستگاه
   ========================================================= */

function handleAtrakNewsLocalImage(input) {

    if (!input || !input.files || !input.files[0]) {
        return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {

        alert(
            'لطفاً یک فایل تصویری انتخاب کنید.'
        );

        input.value = '';

        return;
    }

    const reader =
        new FileReader();

    reader.onload = function(event) {

        const imageInput =
            document.getElementById(
                'atrakNewsImageInput'
            );

        const preview =
            document.getElementById(
                'atrakNewsImagePreview'
            );

        const imageData =
            event.target.result;

        if (imageInput) {
            imageInput.value =
                imageData;
        }

        if (preview) {

            preview.style.display =
                'block';

            preview.innerHTML = `

                <img
                    alt="تصویر"
                    src="${escapeAtrakNewsHTML(imageData)}"
                    style="
                        width:180px;
                        height:110px;
                        object-fit:cover;
                        border-radius:12px;
                        border:1px solid var(--card-border);
                        display:block;
                    "
                 decoding="async" loading="lazy">

            `;
        }
    };

    reader.readAsDataURL(file);
}

function deleteAtrakNews(newsId) {

    const news =
        getAtrakNews();


    const target =
        news.find(
            item =>
                item.id === newsId
        );


    if (!target) {
        return;
    }


    const confirmed =
        confirm(
            'آیا از حذف این خبر مطمئن هستید؟'
        );


    if (!confirmed) {
        return;
    }


    const filtered =
        news.filter(
            item =>
                item.id !== newsId
        );


    saveAtrakNews(filtered);

    renderAtrakNews();

    renderAtrakNewsArchive();

    renderAtrakNewsAdminList();
}


function closeAtrakNewsAdmin() {

    const modal =
        document.getElementById(
            'atrakNewsAdminModal'
        );

    if (modal) {

        modal.style.display =
            'none';
    }
}


/* =========================================================
   نمایش دکمه مدیریت فقط برای مدیر
   ========================================================= */

function updateAtrakNewsAdminButton() {

    const button =
        document.getElementById(
            'atrakNewsAdminButton'
        );

    if (!button) {
        return;
    }


    if (
        typeof state !== 'undefined' &&
        state.isAdmin
    ) {

        button.style.display =
            'inline-block';

    } else {

        button.style.display =
            'none';
    }
}


/* =========================================================
   اجرای اولیه اخبار
   ========================================================= */

function initAtrakNews() {

    renderAtrakNews();

    initAtrakNewsTouch();

    updateAtrakNewsAdminButton();
}


/* با تغییر اندازه صفحه */
window.addEventListener(
    'resize',
    function() {

        updateAtrakNewsSlider();

    }
);


/* وقتی DOM آماده شد */
document.addEventListener(
    'DOMContentLoaded',
    function() {

        setTimeout(
            initAtrakNews,
            250
        );

    }
);
        const views = {
      
`,
    'online-school': `
        <section class="glass-card fade-in-up online-school-page">

            <!-- عنوان اصلی -->
            <div class="online-school-header">
                <div class="online-school-header-icon">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="13" rx="2"></rect>
                        <path d="M8 21h8"></path>
                        <path d="M12 17v4"></path>
                        <path d="M7 9h10"></path>
                        <path d="M7 12h6"></path>
                    </svg>
                </div>

                <div>
                    <h1 data-editable="online-school-title">
                        مدرسه آنلاین
                    </h1>
                    <p data-editable="online-school-subtitle">
                        آموزش از راه دور در بستر مدرسه آنلاین
                    </p>
                </div>
            </div>


            <!-- معرفی -->
            <div class="online-school-intro">
                <p data-editable="online-school-intro-text">
                    در سال‌هایی که گذشت، واژه‌ای مانند مدرسه آنلاین و آموزش از راه دور، بسیار پررنگ‌تر و فراگیرتر شده است و گروه گسترده‌ای از افراد در مناطق مختلف جهان با مدرسه آنلاین آشنا شده‌اند.
                    پس از گسترش و پراکندگی کوید19 و ایجاد قرنطینه در کشورهای متعدد، مدارس و تعداد بسیار زیادی از دانش‌آموزان در سراسر دنیا به مدرسه آنلاین روی آورده‌اند و از سامانه‌های آموزشی در فضای مجازی استفاده می‌کنند.
                    در همین جهت، ما در ادامه این نوشته به کاوش چگونگی، ویژگی‌های مدرسه آنلاین و آموزش از راه دور خواهیم پرداخت.
                </p>

                <div class="online-school-intro-note">
                    کنار ما باشید.
                </div>
            </div>


            <!-- مدرسه آنلاین چیست -->
            <div class="online-school-section">
                <h2 data-editable="online-school-what-title">
                    مدرسه آنلاین
                </h2>

                <h3 data-editable="online-school-what-heading">
                    مدرسه آنلاین چیست؟
                </h3>

                <p data-editable="online-school-what-text-1">
                    یک مدرسه آنلاین از بسیاری جهات همانند یک مدرسه حقیقی است.
                </p>

                <p data-editable="online-school-what-text-2">
                    ازاین‌رو، دانش‌آموزان همانند یک مدرسه معمولی باید قوانین مدرسه آنلاین را رعایت و در مدرسه آنلاین ثبت نام کنند.
                    ولی دیگر نیازی به حضور در ساختمان مدرسه نیست، و دانش‌آموزان به صورت آنلاین (مجازی) و در منزل درس‌های خود را مطالعه می‌کنند.
                    مدرسه آنلاین دارای کلاس‌های مجازی هست که دانش‌آموزان می‌توانند در هرجایی که هستند، خانه یا کتابخانه یا هر کجای دیگر که به اینترنت و نرم افزار مدرسه آنلاین دسترسی دارند، در کلاس‌ها شرکت کنند.
                </p>

                <p data-editable="online-school-what-text-3">
                    مدرسه آنلاین با هدف امکان تحصیل از پایه هفتم تا دوازدهم برای دانش‌آموزان ایرانی خارج از کشور ایجاد شده است.
                    تمامی دروس به صورت آنلاین و با مجرب‌ترین اساتید کشور در نظام آموزش از راه دور، کاملا مشابه یک کلاس حضوری برگزار می‌گردد.
                </p>

                <p data-editable="online-school-what-text-4">
                    دانش‌آموز در مدرسه آنلاین به مهارت کسب کلیه علوم و مجهولات شناخته شده، دسترسی پیدا می‌کند و برای کشف ناشناخته‌ها با مجرب‌ترین محققین همکاری می‌کند و تنها در ارتباط با یک نفر (معلم) نمی‌باشد، که معلم میتواند نقش راهنما را داشته باشد.
                </p>

                <p data-editable="online-school-what-text-5">
                    طبیعی است که امروزه، مفهوم مدرسه آنلاین (آموزش از راه دور) نیز تکامل بیشتری پیدا کرده و روش‌های یادگیری ترکیبی نیز بسیار رایج شده است.
                </p>
            </div>


            <!-- یادگیری ترکیبی -->
            <div class="online-school-section">
                <h3 data-editable="online-school-blended-title">
                    منظور از یادگیری ترکیبی چیست؟
                </h3>

                <p data-editable="online-school-blended-text">
                    در مدرسه آنلاین دانش‌آموزان در کلاس‌های آنلاین شرکت می‌کنند و اگر به هر دلیلی نتوانند در کلاس حاضر شوند دسترسی به همان کلاس بصورت آفلاین را خواهند داشت و می‌توانند سوالات خود را در جلسه بعد از دبیر مربوطه بپرسند.
                </p>
            </div>


            <!-- مدرسه آنلاین چطور کار می‌کند -->
            <div class="online-school-section">
                <div class="online-school-section-label">
                    مدرسه آنلاین 2
                </div>

                <h3 data-editable="online-school-how-title">
                    مدرسه آنلاین چطور کار می‌کند؟
                </h3>

                <p data-editable="online-school-how-text-1">
                    آموزش ‌از راه دور در بستر مدرسه آنلاین جایگزینی برای آموزش حضوری است.
                    مدرسه آنلاین روشی است که در پایه‌های مختلف به دانش‌آموزان داخل (تهران) و ایرانیان خارج از کشور این امکان را می‌دهد که تمام دوره آموزشی را از راه دور و در هر نقطه‌ای از جهان که هستند و بدون نیاز به حضور فیزیکی در کلاس درس بگذرانند و درنهایت در صورت موفقیت در آزمون‌های مربوطه از امتیازاتی مشابه دانش‌آموزان حضوری بهره‌مند شوند.
                    مدرسه آنلاین به همه‌ی ایرانیان خارج از کشور امکان ادامه تحصیل می‌دهد.
                    حتی افرادی که برنامه‌ی کار و یا محل سکونت، آنها مانع از حضورشان در کلاسهای درس دوره‌های حضوری می‌باشد.
                </p>

                <p data-editable="online-school-how-text-2">
                    دانش‌آموزانی که به هر نوع، دسترسی به مدرسه ندارند (ازنظر جغرافیایی، یا شرایط رفتن به مدرسه عادی را ندارند و یا به علت سرعت یادگیری تحمل مدرسه را ندارند و...) بهترین شیوه مدرسه آنلاین و آموزش مجازی می‌باشد.
                </p>
            </div>


            <!-- امکانات و مزایا -->
            <div class="online-school-section">
                <h3 data-editable="online-school-benefits-title">
                    امکانات و مزایای تحصیل در مدرسه آنلاین
                </h3>

                <div class="online-school-benefit">
                    <h4 data-editable="online-school-flex-title">
                        انعطاف پذیری در مدرسه آنلاین
                    </h4>

                    <p data-editable="online-school-flex-text-1">
                        دانش‌آموزانی هستند که خارج از حوزه مدرسه فعالیت‌های مهمی دارند، مدرسه آنلاین برای این دسته از دانش‌آموزان بسیار مناسب می‌باشد.
                    </p>

                    <p data-editable="online-school-flex-text-2">
                        به عنوان مثال: مدرسه آنلاین برای دانش آموزانی که به کالج می‌روند و یا ورزش و حرفه‌ای را دنبال می‌کنند، اجازه می‌دهد تا دروس و برنامه زمانی کلاس‌هایشان را متناسب با دیگر تمرینات درسی و غیر درسی خود تنظیم کنند.
                    </p>

                    <p data-editable="online-school-flex-text-3">
                        ویکی دیگر از مواردی که باید به آن اشاره کرد، خانواده‌هایی هستند که جابجایی مکانی زیادی دارند.
                        مدرسه آنلاین این کمک را به شما می‌کند که دانش‌آموزان با تغییر محل زندگی مجبور به تغییر مدرسه، معلم و دوستان و برنامه درسی خود نشوند و استرس ناشی از این تغییرات را دیگر نداشته باشند.
                    </p>
                </div>


                <div class="online-school-benefit">
                    <h4 data-editable="online-school-quality-title">
                        کیفیت بالای آموزش در مدرسه آنلاین
                    </h4>

                    <p data-editable="online-school-quality-text-1">
                        آموزش باکیفیت در دسترس همه خانواده‌ها نمی‌باشد.
                        اگر والدین دوست دارند و می‌خواهند که فرزندشان با اساتید مجرب و سطح بالا تحصیل کند و یا برنامه درسی داشته باشد که در مدارس دیگر وجود ندارد.
                        مدرسه آنلاین رایان‌کاشیها این امکان را به شما می‌دهد و گزینه مناسبی می‌باشد.
                    </p>

                    <p data-editable="online-school-quality-text-2">
                        در مدرسه آنلاین بهترین و کارآمدترین اساتید انتخاب می‌شوند، که همه دانش‌آموزان به یک اندازه از آموزش بهره ببرند (عدالت آموزشی).
                    </p>
                </div>


                <div class="online-school-benefit">
                    <h4 data-editable="online-school-comfort-title">
                        آرامش و راحتی در مدرسه آنلاین
                    </h4>

                    <p data-editable="online-school-comfort-text-1">
                        رفت و آمد به مدرسه مخصوصا در کشورهایی که دانش‌آموزان فاصله خیلی زیادی از محل زندگی تا مدرسه را باید طی کنند، مشکلاتی را به وجود میاورد که این امر باعث استرس اولیا می‌شود، برای دانش‌آموزان نیز بسیار سخت و خسته کننده است.
                    </p>

                    <p data-editable="online-school-comfort-text-2">
                        در چنین مواردی که ذکر شد، مدرسه آنلاین محیطی امن و آرام را برای دانش‌آموزان فراهم کرده، که علاوه بر معاشرت با همسالان خود در نقاط مختلف دنیا، به راحتی بتوانند به تحصیل و پیشرفت خود بپردازند.
                    </p>

                    <p data-editable="online-school-comfort-text-3">
                        و یک نکته حائز اهمیت که باید به آن اشاره کرد، دانش‌آموز در مدرسه آنلاین مهارت مدیریت آموزش و برنامه‌ریزی را فرا می‌گیرد.
                    </p>
                </div>
            </div>


            <!-- مدرسه آنلاین یا دوره حضوری -->
            <div class="online-school-section">
                <div class="online-school-section-label">
                    مدرسه آنلاین 3
                </div>

                <h3 data-editable="online-school-vs-title">
                    مدرسه آنلاین یا دوره‌های حضوری؟
                </h3>

                <p data-editable="online-school-vs-text-1">
                    نحوه‌ی سنجش تحصیلی و امتحانات پایانی مدرسه آنلاین دقیقا مثل دوره‌های حضوری است، بنابراین مدرک داده شده در مدرسه آنلاین همانند مدرک دوره‌های حضوری می باشد.
                </p>

                <p data-editable="online-school-vs-text-2">
                    محدودیت‌های مکانی و یا رفت و آمد دانش‌آموزان که می‌تواند ناشی از شغل والدین، شرایط جغرافیایی و یا هر عامل دیگری باشد. نبایستی مانع ادامه تحصیل فرزند شود.
                    همچنین شرایط ویژه از قبیل پاندمی‌ها و مخاطرات طبیعی ممکن است امکان رفت و آمد به مدرسه برای دانش‌آموز را محدود یا مسدود کند.
                    از سوی دیگر، پیشرفت فناوری و تکنولوژی گسترده ارتباطاتی فرصت آموزش از راه دور (مدرسه آنلاین) را ایجاد کرده است.
                    تا در حالی که به راحتی بر موانع و مشکلات چیره می‌گردد، کیفیت آموزشی مطلوبی را برای آینده‌سازان کشور تأمین نماید.
                </p>
            </div>


            <!-- مزیت های مدرسه آنلاین -->
            <div class="online-school-section">
                <h3 data-editable="online-school-advantages-title">
                    مزیت های مدرسه آنلاین عبارتند از:
                </h3>

                <p data-editable="online-school-advantages-intro">
                    اخذ مدرک از طریق مدرسه آنلاین مزیت‌های زیادی برای شما خواهد داشت.
                </p>

                <ol class="online-school-advantages-list">
                    <li data-editable="online-school-advantage-1">
                        شما انتخاب می کنید که دقیقا چه زمانی و کجا تحصیل کنید.
                    </li>

                    <li data-editable="online-school-advantage-2">
                        کاهش هزینه های تحصیل دانش آموز (هزینه‌های رفت و آمد)
                    </li>

                    <li data-editable="online-school-advantage-3">
                        تسریع در پیشرفت یادگیری دانش‌آموز
                    </li>

                    <li data-editable="online-school-advantage-4">
                        ایجاد امنیت در تحصیل دانش‌آموز
                    </li>

                    <li data-editable="online-school-advantage-5">
                        ایجاد برقراری ارتباط بین اساتید و دانش‌آموزان در سراسر جهان
                    </li>

                    <li data-editable="online-school-advantage-6">
                        مدیریت بهتر زمان
                    </li>

                    <li data-editable="online-school-advantage-7">
                        می‌توانید آموزش و یادگیری خود را بر پایه کار و زندگی خانگی خود هماهنگ کنید.
                    </li>
                </ol>
            </div>


            <!-- سوالات متداول -->
            <section class="online-school-faq">
                <h2 class="card-title online-school-faq-title">
                    <svg class="inline-icon topic-icon-svg" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>

                    <span data-editable="online-school-faq-title">
                        سؤالات متداول مدرسه آنلاین
                    </span>
                </h2>


                <div class="faq-list">

                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>
                                <span data-editable="online-faq-q1">
                                    مدرسه آنلاین چیست؟
                                </span>
                            </span>
                            <span class="faq-icon">▼</span>
                        </div>

                        <div class="faq-answer" data-editable="online-faq-a1">
                            مدرسه آنلاین یک محیط آموزشی اینترنتی است که دانش‌آموزان می‌توانند از راه دور دروس خود را یاد بگیرند و با معلمان ارتباط برقرار کنند. این روش محدودیت‌های مکانی و زمانی را از بین می‌برد.
                        </div>
                    </div>


                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>
                                <span data-editable="online-faq-q2">
                                    چه مزایایی در مدرسه آنلاین وجود دارد؟
                                </span>
                            </span>
                            <span class="faq-icon">▼</span>
                        </div>

                        <div class="faq-answer" data-editable="online-faq-a2">
                            یکی از مهم‌ترین مزایا، دسترسی سریع و راحت به محتوای درسی است. همچنین مدرسه آنلاین امکان یادگیری شخصی‌سازی‌شده و صرفه‌جویی در وقت را برای دانش‌آموزان فراهم می‌کند.
                        </div>
                    </div>


                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>
                                <span data-editable="online-faq-q3">
                                    اعتبار مدرسه آنلاین با مدرک معتبر چگونه است؟
                                </span>
                            </span>
                            <span class="faq-icon">▼</span>
                        </div>

                        <div class="faq-answer" data-editable="online-faq-a3">
                            مدارک صادر شده توسط مدرسه آنلاین با مدرک معتبر قابل استفاده برای ادامه تحصیل در داخل و خارج کشور هستند و در رزومه کاری نیز ارزش بالایی دارند.
                        </div>
                    </div>


                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>
                                <span data-editable="online-faq-q4">
                                    بهترین مدرسه آنلاین ایران چه ویژگی‌هایی دارد؟
                                </span>
                            </span>
                            <span class="faq-icon">▼</span>
                        </div>

                        <div class="faq-answer" data-editable="online-faq-a4">
                            بهترین مدرسه آنلاین ایران باید معلمان مجرب، محتوای استاندارد، سیستم پشتیبانی قوی و بستر آنلاین پیشرفته داشته باشد.
                        </div>
                    </div>


                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>
                                <span data-editable="online-faq-q5">
                                    چگونه بهترین مدرسه آنلاین ایران را انتخاب کنیم؟
                                </span>
                            </span>
                            <span class="faq-icon">▼</span>
                        </div>

                        <div class="faq-answer" data-editable="online-faq-a5">
                            برای انتخاب بهترین مدرسه آنلاین ایران باید به مجوزهای رسمی، کیفیت آموزش، سطح رضایت دانش‌آموزان و امکانات آموزشی توجه شود.
                        </div>
                    </div>


                    <div class="faq-item" onclick="toggleFaq(this)">
                        <div class="faq-question">
                            <span>
                                <span data-editable="online-faq-q6">
                                    آیا تحصیل در مدرسه آنلاین هزینه بیشتری دارد؟
                                </span>
                            </span>
                            <span class="faq-icon">▼</span>
                        </div>

                        <div class="faq-answer" data-editable="online-faq-a6">
معمولاً هزینه‌ها نسبت به مدارس حضوری کمتر است، زیرا بسیاری از مخارج جانبی مانند حمل‌ونقل و کتاب‌های چاپی کاهش پیدا می‌کند..
                        </div>
                    </div>

                </div>
            </section>

        </section>
    `,
    'school': `
        <section class="glass-card fade-in-up">
            <div class="online-school-header">
                <div class="online-school-header-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 10.5L12 4l9 6.5"></path>
                        <path d="M5 10v9h14v-9"></path>
                        <path d="M9 19v-5h6v5"></path>
                    </svg>
                </div>
                <div>
                    <h1 data-editable="school-page-title">مدرسه آموزش از راه دور اترک</h1>
                    <p data-editable="school-page-subtitle">معرفی مدرسه و خدمات آموزشی</p>
                </div>
            </div>

            <div class="distance-history-card">
                <h2 data-editable="school-intro-title">معرفی مدرسه آموزش از راه دور اترک</h2>
                <p data-editable="school-intro-text">
                    این آموزشگاه معتبر، اولین مدرسه از راه دور در کل خراسان شمالی مجهز به سامانه LMS است و این مدرسه مخصوص افرادی است که مایل به ادامه تحصیل هستند و ما در آنجا مدرک رسمی دیپلم از طرف آموزش و پرورش به شما می‌دهیم. این مدرسه، نقش بسزایی در توسعه علمی، فرهنگی و آموزشی داشته که علاوه بر تربیت دانش‌آموزان در جهت کسب مهارت یادگیری به‌صورت مجازی، همواره در زمینه حرکت‌های نوین آموزشی پیش‌قدم بوده است. تاسیس این مجموعه در سال ۱۴۰۱ می‌باشد و در حال حاضر با تیم آموزشی و پشتیبان تحصیلی در کلیه مقاطع فعالیت می‌کند و از وجوه متمایزی نسبت به دیگر مراکز آموزشی برخوردار است.
                </p>
            </div>

            <div class="drilldown-grid">
                <div class="drilldown-card">
                    <svg class="topic-icon-svg" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <h3 data-editable="school-feature-1-title">آموزش و منابع</h3>
                    <p data-editable="school-feature-1-text">دسترسی منظم به خدمات و منابع آموزشی مدرسه.</p>
                </div>
                <div class="drilldown-card">
                    <svg class="topic-icon-svg" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    <h3 data-editable="school-feature-2-title">پشتیبانی آموزشی</h3>
                    <p data-editable="school-feature-2-text">همراهی و پشتیبانی تحصیلی در مسیر یادگیری.</p>
                </div>
                <div class="drilldown-card">
                    <svg class="topic-icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9"></path></svg>
                    <h3 data-editable="school-feature-3-title">آموزش از راه دور</h3>
                    <p data-editable="school-feature-3-text">تحصیل از راه دور با استفاده از امکانات آموزشی و مجازی.</p>
                </div>
            </div>
        </section>
    `,

    'faq': `
        <section class="glass-card fade-in-up">
            <div class="online-school-header">
                <div class="online-school-header-icon">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                    <h1 data-editable="faq-page-title">سؤالات متداول</h1>
                    <p data-editable="faq-page-subtitle">پاسخ به پرسش‌های رایج درباره مدرسه آنلاین</p>
                </div>
            </div>

            <div class="faq-list">
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question"><span data-editable="faq-page-q1">مدرسه آنلاین چیست؟</span><span class="faq-icon">▼</span></div>
                    <div class="faq-answer" data-editable="faq-page-a1">مدرسه آنلاین یک محیط آموزشی اینترنتی است که دانش‌آموزان می‌توانند از راه دور دروس خود را یاد بگیرند و با معلمان ارتباط برقرار کنند.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question"><span data-editable="faq-page-q2">چه مزایایی در مدرسه آنلاین وجود دارد؟</span><span class="faq-icon">▼</span></div>
                    <div class="faq-answer" data-editable="faq-page-a2">یکی از مهم‌ترین مزایا، دسترسی سریع و راحت به محتوای درسی و امکان صرفه‌جویی در وقت است.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question"><span data-editable="faq-page-q3">تحصیل در مدرسه آنلاین چگونه انجام می‌شود؟</span><span class="faq-icon">▼</span></div>
                    <div class="faq-answer" data-editable="faq-page-a3">یادگیری از طریق بسترهای آنلاین و منابع آموزشی انجام می‌شود و دانش‌آموز می‌تواند از راه دور به آموزش دسترسی داشته باشد.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question"><span data-editable="faq-page-q4">برای استفاده بهتر از آموزش آنلاین چه چیزی مهم است؟</span><span class="faq-icon">▼</span></div>
                    <div class="faq-answer" data-editable="faq-page-a4">برنامه‌ریزی منظم، استفاده از منابع آموزشی و ارتباط مناسب با پشتیبانان آموزشی به استفاده بهتر از آموزش کمک می‌کند.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question"><span data-editable="faq-page-q5">آیا امکان یادگیری از راه دور وجود دارد؟</span><span class="faq-icon">▼</span></div>
                    <div class="faq-answer" data-editable="faq-page-a5">بله، آموزش از راه دور با استفاده از فناوری و ابزارهای ارتباطی آموزشی امکان‌پذیر است.</div>
                </div>
            </div>
        </section>
    `,

    'news-archive': `
    <section class="glass-card fade-in-up atrak-news-archive-page">

        <div
            style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
            ">

            <button
                type="button"
                onclick="navigateTo('home')"
                style="
                    width:36px;
                    height:36px;
                    border-radius:50%;
                    border:1px solid var(--card-border);
                    background:var(--card-bg);
                    color:var(--primary-purple);
                    cursor:pointer;
                    font-size:18px;
                ">
                →
            </button>

            <div>

                <h1
                    style="
                        margin:0;
                        color:var(--primary-purple);
                        font-size:24px;
                        font-weight:900;
                    "
                    data-editable="news-archive-title">
                    آرشیو اخبار مدرسه
                </h1>

                <p
                    style="
                        margin:5px 0 0;
                        color:var(--text-muted);
                        font-size:13px;
                    "
                    data-editable="news-archive-subtitle">
                    تمامی اخبار منتشرشده مدرسه آموزش از راه دور اترک
                </p>

            </div>

        </div>


        <div
            id="atrakNewsArchiveContainer"
            class="atrak-news-archive-grid">
        </div>

    </section>
`,
'news-detail': `

<section class="glass-card fade-in-up atrak-news-detail-page">

    <div class="atrak-news-detail-topbar">

        <button
            type="button"
            class="atrak-news-detail-back"
            onclick="navigateTo('news-archive')">

            →
            <span>
                بازگشت به آرشیو اخبار
            </span>

        </button>

    </div>


    <article
        id="atrakNewsDetailContainer"
        class="atrak-news-detail-container">

        <div class="atrak-news-detail-loading">
            در حال بارگذاری خبر...
        </div>

    </article>

</section>

`,
    'distance-history': `
        <section class="glass-card fade-in-up distance-history-page">

            <div class="distance-history-header">
                <div class="distance-history-icon">
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9"></circle>
                        <path d="M3 12h18"></path>
                        <path d="M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9"></path>
                        <path d="M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9"></path>
                    </svg>
                </div>

                <div>
                    <h1 data-editable="distance-history-title">
                        تاریخچه آموزش از راه دور در جهان
                    </h1>

                    <p>
                        نگاهی کوتاه به شکل‌گیری و گسترش آموزش از راه دور
                    </p>
                </div>
            </div>

            <div class="distance-history-image-card">
                <img
                    src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1200&q=80"
                    alt="آموزش از راه دور" decoding="async" loading="lazy">
            </div>

            <article class="distance-history-card">

                <h2 data-editable="distance-history-world-title">
                    تاریخچه آموزش از راه دور
                </h2>

                <p>
                    <strong>آموزش از راه دور</strong> (Distance Learning) به یادگیری ای گفته می شود که طی آن دانش‌آموز و دبیر از نظر بعد مکانی از یکدیگر دور باشند.
                    <strong>آموزش از راه دور</strong> با استفاده از امکاناتی مانند پست الکترونیکی، فیلم‌های آموزشی، رسانه‌ها و یا هر نوع تکنولوژی مرتبط با اینترنت از قبیل تابلوی پیغام‌ها، اتاق گفتگو و کنفرانس‌های کامپیوتری یا ویدیویی قابل اجراست.
                    در واقع <strong>آموزش از راه دور</strong> فرآیندی است که فراگیرندگان را به منابع دور دست متصل می کند.
                </p>

                <p>
                    درواقع <strong>آموزش از راه دور</strong> نوعی فرایند آموزشی است که در آن آموزش از فردی که درحال آموزش دادن است نسبت به فردی که در حال آموزش گرفتن می باشد، فارغ از زمان و مکان مشخصی انجام می گیرد.
                    به این طریق که تمامی یا بخشی از ارتباط بین دبیران و دانش‌آموزان از طریق یک رسانه مصنوعی، یه بصورت الکترونیکی و یا بصورت چاپی صورت می پذیرد.
                    بنابرتعریف، در آموزش از راه دور ابزار اصلی ارتباط، فناوری است.
                </p>

                <p>
                    آموزش از راه دور یا غیر حضوری در دهه اول سال 1700 میلادی آغاز و تا کنون در سراسر جهان از جمله ایران به عنوان یکی از شیوه های یاددهی – یادگیری مورد استفاده قرار گرفته است.
                </p>

                <p>
                    به عقیده برخی از صاحب‌نظران افلاطون و شاگردش دیونسیس از جمله افرادی بودند که برای اولین بار از شیوه آموزش از راه دور استفاده کردند.
                </p>

                <p>
                    در سال 1800 میلادی شیوه آموزش مجازی به صورت آموزش مکاتبه‌ای بود.
                    در این روش دانش‌آموزان و دانشجویان از طریق مدرسه با نامه‌نگاری آموزش داده می شدند که این شیوه آموزشی مورد استقبال همگان قرار گرفته بود.
                </p>

                <p>
                    اولین آموزش از راه دور به شیوه پستی در سال‌های 1728 میلادی انجام گرفته است.
                    از آن زمان تا به حال شکل‌های مختلفی از آموزش به شیوه‌های مختلف دیگری انجام شده است.
                    اما آموزش از راه دور به شیوه‌ای جدید و با استفاده از فناوری‌های روز، کامپیوتر و اینترنت، به عنوان ابزاری جدید برای انتقال مفاهیم آموزشی و روند امر یاددهی – یادگیری مورد استفاده قرار گرفته است.
                </p>

                <p>
                    همزمان با ایالات متحده آمریکا که در زمینه آموزش از راه دور فعالیت داشت، کشورهای اروپایی نیز دوره‌های آموزشی را به صورت ارائه چکیده و خلاصه مطالب درسی در قالب جزوات آغاز کرده بودند.
                    در ادامه آن اولین دوره آموزشی از راه دور دانشگاهی در سال 1892 تأسیس و توسط اداره پست اداره می شد.
                </p>

                <p>
                    با بهره‌گیری از ساختار برنامه‌سازی تلویزیون و رادیو، متصدیان سیستم آموزش از راه دور به تکنولوژی جدیدتری نسبت به پست دست یافتند که منجر به تأسیس اولین رادیوی آموزشی دانشگاهی در سال 1921 شد.
                    در ادامه، دانشگاه‌ها توانستند با استفاده از ابزارهای مختلف ترکیبی و چندرسانه‌ای، آموزش الکترونیک را توسعه دهند.
                </p>

                <p>
                    با ظهور اینترنت اولین دوره دروس دوره کارشناسی به صورت آنلاین توسط انستیتوی فناوری نیوجرسی در سال 1984 به دانشجویان ارائه شد.
                    در ادامه دانشگاه فونیکس در سال 1989 اقدام به برگزاری کلاس‌های آنلاین کرد.
                </p>

            </article>

            <div class="distance-history-timeline">

                <div class="distance-history-event">
                    <div class="distance-history-year">1728</div>
                    <div>
                        <h3>آموزش از راه دور به شیوه پستی</h3>
                        <p>اولین آموزش از راه دور به شیوه پستی در سال 1728 میلادی انجام گرفته است.</p>
                    </div>
                </div>

                <div class="distance-history-event">
                    <div class="distance-history-year">1800</div>
                    <div>
                        <h3>آموزش مکاتبه‌ای</h3>
                        <p>در سال 1800 میلادی آموزش به صورت مکاتبه‌ای و از طریق نامه‌نگاری انجام می شد.</p>
                    </div>
                </div>

                <div class="distance-history-event">
                    <div class="distance-history-year">1892</div>
                    <div>
                        <h3>آموزش دانشگاهی از راه دور</h3>
                        <p>اولین دوره آموزشی از راه دور دانشگاهی در سال 1892 تأسیس شد.</p>
                    </div>
                </div>

                <div class="distance-history-event">
                    <div class="distance-history-year">1921</div>
                    <div>
                        <h3>ورود رادیو به آموزش</h3>
                        <p>اولین رادیوی آموزشی دانشگاهی در سال 1921 شکل گرفت.</p>
                    </div>
                </div>

                <div class="distance-history-event">
                    <div class="distance-history-year">1984</div>
                    <div>
                        <h3>ورود آموزش آنلاین</h3>
                        <p>اولین دوره دروس کارشناسی به صورت آنلاین در سال 1984 ارائه شد.</p>
                    </div>
                </div>

                <div class="distance-history-event">
                    <div class="distance-history-year">1989</div>
                    <div>
                        <h3>گسترش کلاس‌های آنلاین</h3>
                        <p>دانشگاه فونیکس در سال 1989 اقدام به برگزاری کلاس‌های آنلاین کرد.</p>
                    </div>
                </div>

            </div>

            <article class="distance-history-card iran-history-card">

                <div class="distance-history-section-icon">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 21h18"></path>
                        <path d="M5 21V9l7-5 7 5v12"></path>
                        <path d="M9 21v-6h6v6"></path>
                        <path d="M9 10h.01"></path>
                        <path d="M15 10h.01"></path>
                    </svg>
                </div>

                <h2 data-editable="distance-history-iran-title">
                    تاریخچه آموزش از راه دور در ایران
                </h2>

                <p>
                    سابقه آموزش از راه دور در ایران به زمان استفاده از ابزارهای کمک آموزشی شامل نمایش اسلاید و فیلم‌های آموزشی در کلاس درس باز می‌گردد.
                    پس از آن تلویزیون نیز رسماً به عنوان آموزش همگانی از طریق این رسانه در سراسر کشور پرداخت.
                    سپس دانشگاه ابوریحان بیرونی در سال 1350 برای اولین بار آموزش‌های مجازی را به صورت مکاتبه‌ای در هشت رشته تحصیلی برگزار کرد.
                </p>

                <p>
                    در ادامه بهره‌مندی دانشگاه‌ها از این شیوه آموزشی، دانشگاه پیام نور پس از تأسیس در سال 1366 و دانشگاه تهران در پایان دهه هفتاد آموزش مجازی را در دستور کار خود قرار داد.
                </p>

                <p>
                    به همین ترتیب برخی از دانشگاه‌ها آموزش الکترونیکی را راه‌اندازی کرده و اکنون در برخی از آنان تعدادی از دروس خود را به صورت تک درس به دانشجویان ارائه می دهند.
                </p>

                <p>
                    به طور کلی آموزش از راه دور از سنوات بسیار دور در کشورهایی همچون آلمان، سوئد، انگلستان و ایالات متحده وجود داشته است.
                </p>

                <p>
                    و در حال حاضر با گذر زمان و توسعه امکانات و نیاز بشر به این فرایند آموزشی، مدارس و سایر مراکز آموزشی و حتی ادارات و سازمان‌ها بر این باور هستند تا با استفاده از ارتباطات و آموزش‌های خود را گسترش دهند.
                </p>

            </article>

            <div class="distance-history-image-grid">

                <div class="distance-history-small-image">
                    <img
                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=700&q=80"
                        alt="کلاس آموزشی" decoding="async" loading="lazy">
                </div>

                <div class="distance-history-small-image">
                    <img
                        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=700&q=80"
                        alt="فناوری و آموزش" decoding="async" loading="lazy">
                </div>

            </div>

        </section>
    `,

    services: `
        <section class="glass-card fade-in-up services-my-page">

            <div class="services-header fade-in-up">
                <div class="diamonds-group diamonds-left">
                    <span class="diamond small"></span>
                    <span class="diamond medium"></span>
                    <span class="diamond large"></span>
                </div>

                <h2 class="services-title-text" style="display:flex; align-items:center; gap:8px;">
                    <svg class="inline-icon topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>

                    <span data-editable="services-my-title">
                        خدمات ما
                    </span>
                </h2>

                <div class="diamonds-group diamonds-right">
                    <span class="diamond small"></span>
                    <span class="diamond medium"></span>
                    <span class="diamond large"></span>
                </div>
            </div>


            <!-- =================================================
                 ۱- آموزش مجازی
            ================================================== -->

            <div class="glass-card fade-in-up services-my-text-card">

                <h2 class="card-title">
                    <svg class="inline-icon topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>

                    <span data-editable="services-my-1-title">
                        ۱- آموزش مجازی
                    </span>
                </h2>

                <div class="services-my-text"
                     data-editable="services-my-1-text">

                    <h3>برگزاری کلاس‌های درسی آنلاین و رفع اشکال در طول ترم:</h3>

                    <p>
                        با شروع هر ترم، شما می‌توانید طبق برنامه هفتگی و انتخاب واحد ارائه‌شده
                        از جانب مدرسه، در کلاس‌های آنلاین ما شرکت کنید و مطالب درسی خود را
                        به‌صورت منظم دنبال کنید.
                    </p>

                    <p>
                        همچنین تمامی کلاس‌های آنلاین پس از ۴۸ ساعت به‌صورت آفلاین روی سایت
                        قرار می‌گیرند تا شما بتوانید در زمان مناسب، بارها و بارها کلاس‌ها را
                        بازبینی کرده و مطالبی را که نیاز به مرور بیشتری دارند دوباره مشاهده کنید.
                    </p>

                    <p>
                        علاوه بر این، در طول ترم می‌توانید با شرکت در کلاس‌های آنلاین و ارتباط
                        مستقیم با دبیر از طریق سایت مدرسه، سؤالات و اشکالات درسی خود را مطرح
                        کرده و برای یادگیری بهتر مطالب، راهنمایی‌های لازم را دریافت کنید.
                    </p>

                </div>

            </div>


            <!-- =================================================
                 ۲- نظارت مستمر آموزشی
            ================================================== -->

            <div class="glass-card fade-in-up services-my-text-card">

                <h2 class="card-title">
                    <svg class="inline-icon topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>

                    <span data-editable="services-my-2-title">
                        ۲- نظارت مستمر آموزشی
                    </span>
                </h2>

                <div class="services-my-text"
                     data-editable="services-my-2-text">

                    <p>
                        در طول ترم، با شرکت در آزمون‌های میان‌ترم و آزمون‌های آزمایشی آنلاین،
                        می‌توانید میزان عملکرد و میزان آمادگی خود را بسنجید و نقاط قوت و
                        ضعف درسی خود را بهتر شناسایی کنید.
                    </p>

                    <p>
                        علاوه بر آن، می‌توانید از نمونه سؤالات هر درس برای تمرین بیشتر استفاده
                        کنید و با آشنایی بیشتر با نوع سؤالات، آمادگی خود را برای آزمون‌های
                        اصلی افزایش دهید.
                    </p>

                    <p>
                        لازم به ذکر است نمرات این آزمون‌ها در اعلام ارزشیابی مستمر ترم،
                        تأثیر مثبت دارد و می‌تواند به دانش‌آموز کمک کند تا روند پیشرفت
                        تحصیلی خود را بهتر دنبال کند.
                    </p>

                </div>

            </div>


            <!-- =================================================
                 ۳- مشاور من
            ================================================== -->

            <div class="glass-card fade-in-up services-my-text-card">

                <h2 class="card-title">
                    <svg class="inline-icon topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>

                    <span data-editable="services-my-3-title">
                        ۳- مشاور من
                    </span>
                </h2>

                <div class="services-my-text"
                     data-editable="services-my-3-text">

                    <p>
                        مشاور تحصیلی و پشتیبان آموزشی مدرسه در تمام مراحل درسی دانش‌آموز
                        و در طول ترم همراه او بوده و تلاش می‌کند مسیر تحصیلی دانش‌آموز
                        با برنامه‌ریزی منظم و متناسب با شرایط او دنبال شود.
                    </p>

                    <p>
                        مشاور با برنامه‌ریزی فردی، طبق شرایط منحصر به فرد دانش‌آموز و
                        انتخاب واحد ارائه‌شده به وی، راهنمایی‌های لازم را جهت ارتقای معدل،
                        مدیریت بهتر زمان و کاهش استرس دانش‌آموز به عمل می‌آورد.
                    </p>

                    <p>
                        همچنین در تمام مراحل پشتیبانی از دانش‌آموزان، والدین نیز در جریان
                        امور مربوط به فرزندشان قرار می‌گیرند تا بتوانند در کنار مدرسه،
                        روند تحصیلی دانش‌آموز را بهتر پیگیری کنند.
                    </p>

                </div>

            </div>


            <!-- =================================================
                 ۴- منابع آموزشی
            ================================================== -->

            <div class="glass-card fade-in-up services-my-text-card">

                <h2 class="card-title">
                    <svg class="inline-icon topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>

                    <span data-editable="services-my-4-title">
                        ۴- منابع آموزشی
                    </span>
                </h2>

                <div class="services-my-text"
                     data-editable="services-my-4-text">

                    <p>
                        تمامی کتب درسی مورد نیاز دانش‌آموزان را می‌توانید از طریق بخش
                        منابع آموزشی در اختیار داشته باشید و در زمان مناسب از آنها استفاده
                        کنید.
                    </p>

                    <p>
                        این بخش امکان دسترسی آسان‌تر به منابع آموزشی را فراهم می‌کند تا
                        دانش‌آموزان بتوانند در کنار کلاس‌های آنلاین و آفلاین، منابع مورد
                        نیاز خود را نیز در اختیار داشته باشند.
                    </p>

                    <p>
                        دسترسی به این بخش به‌صورت رایگان بوده و دانش‌آموزان می‌توانند
                        برای مطالعه، مرور مطالب و آمادگی بیشتر برای آزمون‌ها از منابع
                        موجود استفاده کنند.
                    </p>

                </div>

            </div>


            <!-- =================================================
                 ۵- صدور مدرک
            ================================================== -->

            <div class="glass-card fade-in-up services-my-text-card">

                <h2 class="card-title">
                    <svg class="inline-icon topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="6"></circle>
                        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>
                    </svg>

                    <span data-editable="services-my-5-title">
                        ۵- صدور مدرک رسمی از وزارت آموزش و پرورش
                    </span>
                </h2>

                <div class="services-my-text"
                     data-editable="services-my-5-text">

                    <p>
                        با تحصیل در مدرسه آموزش از راه دور رایان کاشیها و پس از کسب نمره
                        قبولی در تمام درس‌ها، موفق به اخذ مدرک تحصیلی نظام جدید (دیپلم)
                        و نظام قدیم (دیپلم و پیش‌دانشگاهی) وزارت آموزش و پرورش شوید.
                    </p>

                    <p>
                        دانش‌آموزان می‌توانند با طی کردن مراحل تحصیلی و کسب موفقیت در
                        دروس مربوطه، مسیر تحصیل خود را تا دریافت مدرک رسمی ادامه دهند.
                    </p>

                </div>

            </div>


            <!-- =================================================
                 ۶ کارت خدمات موجود سایت
                 دقیقاً در انتهای صفحه
            ================================================== -->

            <div class="services-my-cards-title">

                <div class="diamonds-group">
                    <span class="diamond small"></span>
                    <span class="diamond medium"></span>
                    <span class="diamond large"></span>
                </div>

                <h2 data-editable="services-my-cards-title">
                    خدمات و بخش‌های اصلی مدرسه
                </h2>

                <div class="diamonds-group">
                    <span class="diamond small"></span>
                    <span class="diamond medium"></span>
                    <span class="diamond large"></span>
                </div>

            </div>


            <div class="services-grid fade-in-up">

                <!-- کارت ۱ -->
                <div class="service-card large-card"
                     onclick="navigateTo('virtual-edu')">

                    <svg class="topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>

                    <div class="img-frame-container">

                        <img src="${defaultImages.srvVirtual}"
                             class="zoom-img"
                             alt="آموزش مجازی"
                             id="img-services-copy-1" decoding="async" loading="lazy">

                        <div class="img-upload-overlay"
                             onclick="event.stopPropagation(); triggerImageUpload('img-services-copy-1')">
                            تعویض عکس
                        </div>

                    </div>

                    <h3 class="service-card-title"
                        data-editable="services-copy-title-1">
                        آموزش مجازی
                    </h3>

                </div>


                <!-- کارت ۲ -->
                <div class="service-card large-card"
                     onclick="navigateTo('monitoring')">

                    <svg class="topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>

                    <div class="img-frame-container">

                        <img src="${defaultImages.srvMonitor}"
                             class="zoom-img"
                             alt="نظارت مستمر"
                             id="img-services-copy-2" decoding="async" loading="lazy">

                        <div class="img-upload-overlay"
                             onclick="event.stopPropagation(); triggerImageUpload('img-services-copy-2')">
                            تعویض عکس
                        </div>

                    </div>

                    <h3 class="service-card-title"
                        data-editable="services-copy-title-2">
                        نظارت مستمر آموزشی
                    </h3>

                </div>


                <!-- کارت ۳ -->
                <div class="service-card large-card"
                     onclick="navigateTo('support')">

                    <svg class="topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>

                    <div class="img-frame-container">

                        <img src="${defaultImages.srvSupport}"
                             class="zoom-img"
                             alt="پشتیبان آموزشی"
                             id="img-services-copy-3" decoding="async" loading="lazy">

                        <div class="img-upload-overlay"
                             onclick="event.stopPropagation(); triggerImageUpload('img-services-copy-3')">
                            تعویض عکس
                        </div>

                    </div>

                    <h3 class="service-card-title"
                        data-editable="services-copy-title-3">
                        پشتیبان آموزشی
                    </h3>

                </div>


                <!-- کارت ۴ -->
                <div class="service-card large-card"
                     onclick="navigateTo('resources')">

                    <svg class="topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>

                    <div class="img-frame-container">

                        <img src="${defaultImages.srvResources}"
                             class="zoom-img"
                             alt="منابع آموزشی"
                             id="img-services-copy-4" decoding="async" loading="lazy">

                        <div class="img-upload-overlay"
                             onclick="event.stopPropagation(); triggerImageUpload('img-services-copy-4')">
                            تعویض عکس
                        </div>

                    </div>

                    <h3 class="service-card-title"
                        data-editable="services-copy-title-4">
                        منابع آموزشی
                    </h3>

                </div>


                <!-- کارت ۵ -->
                <div class="service-card large-card"
                     onclick="navigateTo('certificate')">

                    <svg class="topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="6"></circle>
                        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path>
                    </svg>

                    <div class="img-frame-container">

                        <img src="${defaultImages.srvCert}"
                             class="zoom-img"
                             alt="صدور مدرک"
                             id="img-services-copy-5" decoding="async" loading="lazy">

                        <div class="img-upload-overlay"
                             onclick="event.stopPropagation(); triggerImageUpload('img-services-copy-5')">
                            تعویض عکس
                        </div>

                    </div>

                    <h3 class="service-card-title"
                        data-editable="services-copy-title-5">
                        صدور مدرک رسمی از آموزش و پرورش
                    </h3>

                </div>


                <!-- کارت ۶ - مقاطع -->
                <div class="service-card large-card"
                     onclick="navigateTo('maghta')">

                    <svg class="topic-icon-svg"
                         onclick="openIconPicker(event, this)"
                         viewBox="0 0 24 24">
                        <path d="M3 5h18v14H3z"></path>
                        <path d="M7 9h10"></path>
                        <path d="M7 13h7"></path>
                        <path d="M9 19v2"></path>
                        <path d="M15 19v2"></path>
                    </svg>

                    <div class="img-frame-container">

                        <img src="${defaultImages.classroom}"
                             class="zoom-img"
                             alt="مقاطع تحصیلی"
                             id="img-services-copy-6" decoding="async" loading="lazy">

                        <div class="img-upload-overlay"
                             onclick="event.stopPropagation(); triggerImageUpload('img-services-copy-6')">
                            تعویض عکس
                        </div>

                    </div>

                    <h3 class="service-card-title"
                        data-editable="services-copy-title-6">
                        مقاطع تحصیلی
                    </h3>

                </div>

            </div>

        </section>
    `,
         honors: `
<section class="atrak-honors-page">

    <div class="atrak-honors-page-header">
        <h1>افتخارآفرینان مدرسه آموزش از راه دور اترک</h1>
        <p>دانش‌آموزان افتخارآفرین مدرسه اترک</p>
    </div>

    <div class="atrak-honors-admin-box" id="atrakHonorsAdminBox">
        <button
            type="button"
            class="atrak-honors-add-btn"
            onclick="openAtrakHonorAdmin()"
            style="display:none;"
            id="atrakHonorsAddButton"
        >
            افزودن افتخارآفرین
        </button>
    </div>

    <div
        id="atrakHonorsPageGrid"
        class="atrak-honors-grid"
    ></div>

</section>
`,
    home: `

        <section class="glass-card fade-in-up">
            <div class="grid-2col">
                <div>
                    <h2 class="card-title">
                        <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        <span data-editable="intro-title">معرفی مدرسه آموزش از راه دور اترک</span>
                    </h2>
                    <p data-editable="intro-text" style="text-align:justify; font-size:15px; line-height:2;">
                        این آموزشگاه معتبر، اولین مدرسه از راه دور در کل خراسان شمالی مجهز به سامانه <strong>LMS</strong> است و این مدرسه مخصوص افرادی است که مایل به ادامه تحصیل هستند و ما در آنجا مدرک رسمی دیپلم از طرف آموزش و پرورش به شما می‌دهیم. این مدرسه، نقش بسزایی در توسعه علمی، فرهنگی و آموزشی داشته که علاوه بر تربیت دانش‌آموزان در جهت کسب مهارت یادگیری به‌صورت مجازی، همواره در زمینه حرکت‌های نوین آموزشی پیش‌قدم بوده است. تاسیس این مجموعه در سال ۱۴۰۱ می‌باشد و در حال حاضر با تیم آموزشی و پشتیبان تحصیلی در کلیه مقاطع فعالیت می‌کند و از وجوه متمایزی نسبت به دیگر مراکز آموزشی برخوردار است.
                    </p>
                </div>
                <div class="img-frame-container" id="frame-intro">
                    <img src="${defaultImages.intro}" class="zoom-img" alt="مدرسه اترک" id="img-intro" decoding="async" loading="lazy">
                    <div class="img-upload-overlay" onclick="triggerImageUpload('img-intro')">تعویض عکس</div>
                </div>
            </div>
        </section>

<!-- چهار کادر خدمات ویژه زیر کادر معرفی -->
<div
    class="four-feature-cards"
    style="
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:12px;
       margin:-15px 0 24px;
        padding:0;
    "
>

    <!-- کادر 1 -->
    <div
        class="four-feature-card"
        style="
            position:relative;
            background:#38b6d4;
            color:#fff;
            border-radius:13px;
            min-height:190px;
            padding:42px 14px 16px;
            text-align:center;
            box-sizing:border-box;
            box-shadow:0 6px 15px rgba(0,0,0,.10);
        "
    >
        <svg
            class="topic-icon-svg four-feature-icon"
            onclick="event.stopPropagation(); openIconPicker(event, this)"
            viewBox="0 0 24 24"
            style="
                position:absolute;
                top:-38px;
                left:50%;
                transform:translateX(-50%);
                width:58px;
                height:58px;
                padding:13px;
                box-sizing:border-box;
                background:#fff;
                border-radius:50%;
                stroke:#111827;
                stroke-width:1.5;
                fill:none;
                z-index:2;
            "
        >
            <path d="M5 5h14v14H5z"></path>
            <path d="M8 8h8"></path>
            <path d="M8 12h8"></path>
            <path d="M8 16h5"></path>
        </svg>

        <h3
            data-editable="feature-box-1-title"
            style="
                margin:0;
                font-size:16px;
                font-weight:800;
                color:#fff;
            "
        >
            سرویس رایگان
        </h3>

        <div
            style="
                width:58px;
                height:2px;
                background:rgba(255,255,255,.85);
                margin:9px auto 13px;
            "
        ></div>

        <p
            data-editable="feature-box-1-text"
            style="
                margin:0;
                font-size:12px;
                line-height:1.9;
                color:#fff;
            "
        >
            امکان استفاده از خدمات آموزشی و پشتیبانی مدرسه با دسترسی ساده و منظم
        </p>
    </div>


    <!-- کادر 2 -->
    <div
        class="four-feature-card"
        style="
            position:relative;
            background:#ff0038;
            color:#fff;
            border-radius:13px;
            min-height:190px;
            padding:42px 14px 16px;
            text-align:center;
            box-sizing:border-box;
            box-shadow:0 6px 15px rgba(0,0,0,.10);
        "
    >
        <svg
            class="topic-icon-svg four-feature-icon"
            onclick="event.stopPropagation(); openIconPicker(event, this)"
            viewBox="0 0 24 24"
            style="
                position:absolute;
                top:-38px;
                left:50%;
                transform:translateX(-50%);
                width:58px;
                height:58px;
                padding:13px;
                box-sizing:border-box;
                background:#fff;
                border-radius:50%;
                stroke:#111827;
                stroke-width:1.5;
                fill:none;
                z-index:2;
            "
        >
            <path d="M4 5h16v14H4z"></path>
            <path d="M8 5v14"></path>
            <path d="M12 5v14"></path>
            <path d="M16 5v14"></path>
        </svg>

        <h3
            data-editable="feature-box-2-title"
            style="
                margin:0;
                font-size:16px;
                font-weight:800;
                color:#fff;
            "
        >
            کتابخانه مجهز
        </h3>

        <div
            style="
                width:58px;
                height:2px;
                background:rgba(255,255,255,.85);
                margin:9px auto 13px;
            "
        ></div>

        <p
            data-editable="feature-box-2-text"
            style="
                margin:0;
                font-size:12px;
                line-height:1.9;
                color:#fff;
            "
        >
            دسترسی به منابع و مطالب آموزشی برای مطالعه بهتر و منظم‌تر دانش‌آموزان
        </p>
    </div>


    <!-- کادر 3 -->
    <div
        class="four-feature-card"
        style="
            position:relative;
            background:#064b78;
            color:#fff;
            border-radius:13px;
            min-height:190px;
            padding:42px 14px 16px;
            text-align:center;
            box-sizing:border-box;
            box-shadow:0 6px 15px rgba(0,0,0,.10);
        "
    >
        <svg
            class="topic-icon-svg four-feature-icon"
            onclick="event.stopPropagation(); openIconPicker(event, this)"
            viewBox="0 0 24 24"
            style="
                position:absolute;
                top:-38px;
                left:50%;
                transform:translateX(-50%);
                width:58px;
                height:58px;
                padding:13px;
                box-sizing:border-box;
                background:#fff;
                border-radius:50%;
                stroke:#111827;
                stroke-width:1.5;
                fill:none;
                z-index:2;
            "
        >
            <rect x="5" y="4" width="14" height="12" rx="1"></rect>
            <path d="M8 20h8"></path>
            <path d="M10 16v4"></path>
            <path d="M14 16v4"></path>
        </svg>

        <h3
            data-editable="feature-box-3-title"
            style="
                margin:0;
                font-size:16px;
                font-weight:800;
                color:#fff;
            "
        >
            تجهیزات جدید
        </h3>

        <div
            style="
                width:58px;
                height:2px;
                background:rgba(255,255,255,.85);
                margin:9px auto 13px;
            "
        ></div>

        <p
            data-editable="feature-box-3-text"
            style="
                margin:0;
                font-size:12px;
                line-height:1.9;
                color:#fff;
            "
        >
            امکانات آموزشی و خدمات مدرسه برای پشتیبانی بهتر از مسیر تحصیلی دانش‌آموزان
        </p>
    </div>


    <!-- کادر 4 -->
    <div
        class="four-feature-card"
        style="
            position:relative;
            background:#f5ad00;
            color:#fff;
            border-radius:13px;
            min-height:190px;
            padding:42px 14px 16px;
            text-align:center;
            box-sizing:border-box;
            box-shadow:0 6px 15px rgba(0,0,0,.10);
        "
    >
        <svg
            class="topic-icon-svg four-feature-icon"
            onclick="event.stopPropagation(); openIconPicker(event, this)"
            viewBox="0 0 24 24"
            style="
                position:absolute;
                top:-38px;
                left:50%;
                transform:translateX(-50%);
                width:58px;
                height:58px;
                padding:13px;
                box-sizing:border-box;
                background:#fff;
                border-radius:50%;
                stroke:#111827;
                stroke-width:1.5;
                fill:none;
                z-index:2;
            "
        >
            <circle cx="7" cy="17" r="2.5"></circle>
            <circle cx="17" cy="17" r="2.5"></circle>
            <path d="M7 17l3-7h4l3 7"></path>
            <path d="M10 10l2-3 3 3"></path>
            <circle cx="12" cy="4" r="1"></circle>
        </svg>

        <h3
            data-editable="feature-box-4-title"
            style="
                margin:0;
                font-size:16px;
                font-weight:800;
                color:#fff;
            "
        >
            تجهیزات ورزشی
        </h3>

        <div
            style="
                width:58px;
                height:2px;
                background:rgba(255,255,255,.85);
                margin:9px auto 13px;
            "
        ></div>

        <p
            data-editable="feature-box-4-text"
            style="
                margin:0;
                font-size:12px;
                line-height:1.9;
                color:#fff;
            "
        >
            توجه به فعالیت بدنی و سلامت دانش‌آموزان در کنار برنامه‌های آموزشی مدرسه
        </p>
    </div>

</div>

        <section class="glass-card fade-in-up" style="padding:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 10px;">
                <h3 style="font-size:17px; font-weight:800; color:var(--primary-purple); display:flex; align-items:center; gap:6px;">
                    <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span data-editable="carousel-header-title">جدیدترین اطلاعیه‌ها و برنامه‌ها</span>
                </h3>
                <span style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:4px;">
                    <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span data-editable="carousel-header-sub">به‌روزرسانی روزانه مدرسه</span>
                </span>
            </div>
            <div class="carousel-container" id="announcementsCarousel">
                <div class="carousel-track" id="carouselTrack">
                    <div class="carousel-slide">
                        <img src="${defaultImages.slide1}" alt="اطلاعیه ۱" id="img-slide-1" decoding="async" loading="lazy">
                        <div class="img-upload-overlay" onclick="triggerImageUpload('img-slide-1')">تعویض تصویر/ویدیو</div>
                        <div class="carousel-caption">
                            <h3 data-editable="slide1-title">آغاز ثبت‌نام دوره‌های تحصیلی جدید ۱۴۰۵</h3>
                            <p data-editable="slide1-sub">ثبت‌نام دانش‌آموزان عادی، بزرگسالان و بازماندگان از تحصیل با شرایط ویژه</p>
                        </div>
                    </div>
                    <div class="carousel-slide">
                        <img src="${defaultImages.slide2}" alt="اطلاعیه ۲" id="img-slide-2" decoding="async" loading="lazy">
                        <div class="img-upload-overlay" onclick="triggerImageUpload('img-slide-2')">تعویض تصویر/ویدیو</div>
                        <div class="carousel-caption">
                            <h3 data-editable="slide2-title">برگزاری وبینارهای رفع اشکال دروس تخصصی</h3>
                            <p data-editable="slide2-sub">پخش آنلاین و ارائه فایل‌های ضبط شده در سامانه LMS</p>
                        </div>
                    </div>
                    <div class="carousel-slide">
                        <img src="${defaultImages.slide3}" alt="اطلاعیه ۳" id="img-slide-3" decoding="async" loading="lazy">
                        <div class="img-upload-overlay" onclick="triggerImageUpload('img-slide-3')">تعویض تصویر/ویدیو</div>
                        <div class="carousel-caption">
                            <h3 data-editable="slide3-title">صدور مدارک رسمی دیپلم نظام جدید و قدیم</h3>
                            <p data-editable="slide3-sub">مورد تایید قطعی وزارت آموزش و پرورش با قابلیت استعلام</p>
                        </div>
                    </div>
                </div>
                <button class="carousel-btn prev" aria-label="اسلاید قبلی" onclick="moveCarousel(-1)" type="button">❮</button>
                <button class="carousel-btn next" aria-label="اسلاید بعدی" onclick="moveCarousel(1)" type="button">❯</button>
                <div class="carousel-dots" id="carouselDots">
                    <span class="dot active" onclick="setSlide(0)"></span>
                    <span class="dot" onclick="setSlide(1)"></span>
                    <span class="dot" onclick="setSlide(2)"></span>
                </div>
            </div>
        </section>

        
<!-- بنر چرا اترک -->
<div class="atrak-banner-wrapper">
    <img
        src="wide_horizontal_colorful_promotional_banner_image.PNG"
        alt="چرا اترک؟"
        class="atrak-banner-image"
     decoding="async" loading="lazy">
</div>
<!-- =====================================================
     افتخارآفرینان مدرسه آموزش از راه دور اترک
     ===================================================== -->

<section class="atrak-honors-home">

    <h2>
        افتخارآفرینان مدرسه آموزش از راه دور اترک
    </h2>

    <div
        id="atrakHonorsHomeGrid"
        class="atrak-honors-grid"
    ></div>

    <button
        type="button"
        class="atrak-honors-more"
        onclick="navigateTo('honors')"
    >
        برای دیدن افتخارآفرینان مدرسه آموزش از راه دور اترک کلیک کنید
    </button>

</section>
        <div class="services-header fade-in-up">
            <div class="diamonds-group diamonds-left">
                <span class="diamond small"></span>
                <span class="diamond medium"></span>
                <span class="diamond large"></span>
            </div>
            <h2 class="services-title-text" style="display:flex; align-items:center; gap:8px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span data-editable="services-main-title">خدمات ما</span>
            </h2>
            <div class="diamonds-group diamonds-right">
                <span class="diamond small"></span>
                <span class="diamond medium"></span>
                <span class="diamond large"></span>
            </div>
        </div>

        <div class="services-grid fade-in-up" id="homeServicesGrid">
            <div class="service-card large-card" onclick="navigateTo('maghta')">
    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24">
        <path d="M3 5h18v14H3z"></path>
        <path d="M7 9h10"></path>
        <path d="M7 13h6"></path>
        <path d="M7 17h8"></path>
    </svg>

    <div class="img-frame-container">
        <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80"
            class="zoom-img"
            alt="مقاطع تحصیلی"
            id="img-srv-maghta"
         decoding="async" loading="lazy">
        <div
            class="img-upload-overlay"
            onclick="event.stopPropagation(); triggerImageUpload('img-srv-maghta')"
        >
            تعویض عکس
        </div>
    </div>

    <h3 class="service-card-title" data-editable="srv-title-maghta">
        مقاطع تحصیلی
    </h3>
</div>
    <div class="service-card large-card" onclick="navigateTo('virtual-edu')">
        <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        <div class="img-frame-container">
            <img src="${defaultImages.srvVirtual}" class="zoom-img" alt="آموزش مجازی" id="img-srv-1" decoding="async" loading="lazy">
            <div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-srv-1')">تعویض عکس</div>
        </div>
        <h3 class="service-card-title" data-editable="srv-title-1">آموزش مجازی</h3>
    </div>
    <div class="service-card large-card" onclick="navigateTo('monitoring')">
        <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        <div class="img-frame-container">
            <img src="${defaultImages.srvMonitor}" class="zoom-img" alt="نظارت مستمر" id="img-srv-2" decoding="async" loading="lazy">
            <div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-srv-2')">تعویض عکس</div>
        </div>
        <h3 class="service-card-title" data-editable="srv-title-2">نظارت مستمر آموزشی</h3>
    </div>
    <div class="service-card large-card" onclick="navigateTo('support')">
        <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <div class="img-frame-container">
            <img src="${defaultImages.srvSupport}" class="zoom-img" alt="پشتیبان آموزشی" id="img-srv-3" decoding="async" loading="lazy">
            <div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-srv-3')">تعویض عکس</div>
        </div>
        <h3 class="service-card-title" data-editable="srv-title-3">پشتیبان آموزشی</h3>
    </div>
    <div class="service-card large-card" onclick="navigateTo('resources')">
        <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        <div class="img-frame-container">
            <img src="${defaultImages.srvResources}" class="zoom-img" alt="منابع آموزشی" id="img-srv-4" decoding="async" loading="lazy">
            <div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-srv-4')">تعویض عکس</div>
        </div>
        <h3 class="service-card-title" data-editable="srv-title-4">منابع آموزشی</h3>
    </div>
    <div class="service-card large-card" onclick="navigateTo('certificate')">
        <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path></svg>
        <div class="img-frame-container">
            <img src="${defaultImages.srvCert}" class="zoom-img" alt="صدور مدرک" id="img-srv-5" decoding="async" loading="lazy">
            <div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-srv-5')">تعویض عکس</div>
        </div>
        <h3 class="service-card-title" data-editable="srv-title-5">صدور مدرک رسمی از آموزش و پرورش</h3>
    </div>
</div>

        <a href="tel:09905117017" aria-label="تماس تلفنی با مدرسه" class="laser-box-wrapper fade-in-up">
            <div class="laser-box-inner">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span data-editable="cta-phone-text">همین حالا تماس بگیرید (مشاوره و ثبت‌نام رایگان)</span>
                <span style="font-size:24px; direction:ltr; font-family:sans-serif;">09905117017</span>
            </div>
        </a>

        <section class="glass-card glass-card-red fade-in-up">
            <div class="grid-2col">
                <div>
                    <h2 class="card-title" style="color:#e11d48;">
                        <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                        <span data-editable="adv-title">مزایای آموزش از راه دور اترک</span>
                    </h2>
                    <div style="font-size:15px; line-height:2;" data-editable="advantages-text">
                        <p style="margin-bottom:12px;">
                            <strong>۱- بهترین کیفیت با کمترین هزینه همراه بازبینی درس‌ها هروقت که بخوای:</strong><br>
                            شما می‌تونید با صرف هزینه کمتر و با بالاترین کیفیت، از هرجای دنیا که هستید به‌صورت آنلاین آموزش ببینید و تمامی مطالب آموزشی را به‌صورت آفلاین چندین بار بازبینی کنید.
                        </p>
                        <p style="margin-bottom:12px;">
                            <strong>۲- منعطف بودن آموزش از راه دور:</strong><br>
                            شما می‌تونید وقت خودتون رو هرطور که می‌خواین تنظیم کنید تا به تمام کارهاتون برسید.
                        </p>
                        <p>
                            <strong>۳- دسترسی آسان:</strong><br>
                            در هر موقعیت جغرافیایی که قرار دارید به راحتی می‌تونید ادامه تحصیل بدید.
                        </p>
                    </div>
                </div>
                <div class="img-frame-container" id="frame-classroom">
                    <img src="${defaultImages.classroom}" class="zoom-img" alt="کلاس مدرن مینیمال" id="img-classroom" decoding="async" loading="lazy">
                    <div class="img-upload-overlay" onclick="triggerImageUpload('img-classroom')">تعویض عکس</div>
                </div>
            </div>
        </section>
        <!-- =========================================================
     اخبار مدرسه آموزش از راه دور اترک
     ========================================================= -->

<section class="atrak-news-section fade-in-up" id="atrakNewsSection">

    <div class="atrak-news-header">

        <div>
            <h2 class="atrak-news-title">
                <span data-editable="atrak-news-title">
                    آخرین اخبار مدرسه
                </span>
            </h2>

            <p class="atrak-news-subtitle">
                <span data-editable="atrak-news-subtitle">
                    تازه‌ترین خبرها و اطلاعیه‌های مدرسه آموزش از راه دور اترک
                </span>
            </p>
        </div>

        <button
            type="button"
            class="atrak-news-admin-btn"
            id="atrakNewsAdminButton"
            onclick="openAtrakNewsAdmin()"
            style="display:none;">
            ⚙️ مدیریت اخبار
        </button>

    </div>

    <div class="atrak-news-slider-wrap">

        <button
            type="button"
            class="atrak-news-arrow"
            onclick="atrakNewsPrev()"
            aria-label="خبر قبلی">
            →
        </button>

        <div
            class="atrak-news-slider"
            id="atrakNewsSlider">

            <div
                class="atrak-news-track"
                id="atrakNewsTrack">
            </div>

        </div>

        <button
            type="button"
            class="atrak-news-arrow"
            onclick="atrakNewsNext()"
            aria-label="خبر بعدی">
            ←
        </button>

    </div>

    <div class="atrak-news-bottom">

        <button
            type="button"
            class="atrak-news-archive-btn"
            onclick="navigateTo('news-archive')">
            آرشیو اخبار
        </button>

    </div>

</section>
    `,

    'virtual-edu': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span data-editable="ve-main-heading">آموزش مجازی در مدرسه اترک</span>
            </h2>
            <p data-editable="ve-p1" style="font-size:15px; line-height:2; text-align:justify; margin-bottom:18px;">
                سیستم آموزش مجازی (آموزش از راه دور) سامانه‌ای است که به صورت الکترونیکی و خودکار مدیریت شده و برنامه‌های آموزشی یک مدرسه را آسان می‌کند. سیستم آموزش مجازی در مدرسه آموزش از راه دور اترک بصورت برگزاری کلاس‌های آنلاین می‌باشد و دانش‌آموزان در هر جای دنیا بدون هیچگونه محدودیتی می‌توانند در این کلاس‌ها شرکت کرده و با دبیر خود ارتباط گرفته و مباحث درسی را بطور کامل آموزش ببینند. چنانچه به هردلیلی نتوانند در ساعت مقرر در کلاس‌های آنلاین شرکت کنند، می‌توانند از آفلاین کلاس‌ها که در همین بخش قرار می‌گیرد، بدون هیچ محدودیتی استفاده نمایند.
            </p>
            <h3 style="color:var(--primary-purple); margin:20px 0 10px; font-weight:800; display:flex; align-items:center; gap:6px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                <span data-editable="ve-sub-heading">آموزش مجازی چیست؟ آموزش مجازی اترک</span>
            </h3>
            <div data-editable="ve-p2" style="font-size:14.5px; line-height:1.9; text-align:justify; color:var(--text-muted);">
                <p style="margin-bottom:12px;">
                    سیستم مدیریت آموزش مجازی، سامانه‌ای است که روند آموزش از راه دور را به صورت الکترونیکی به صورت خودکار مدیریت می‌کند و مدیریت برنامه‌های آموزشی را در درون یک مدرسه آسان می‌کند. سیستم مدیریت آموزش مجازی، به عنوان یکی از اصلی‌ترین شاخه‌های آموزش مجازی، برای ارائه دوره‌های آموزش از راه دور توسعه یافته است. در عصر حاضر این سیستم آموزشی در بین کارشناسان و افراد مرتبط با حیطه آموزش کاملاً شناخته شده است. مدارس، آموزشگاه‌های غیردرسی، دانشگاه‌ها، مراکز پژوهشی از سیستم آموزش مجازی استفاده می‌کنند. به کمک این شیوه محدودیت‌های زمانی و مکانی در مورد فراگیری و آموزش برداشته شده و همین امر باعث انعطاف بیشتری برای امر آموزش مجازی شده است. به صورتی که شدت علاقه افراد در فراگیری مهارت‌های جدید و حضور در دوره‌های آموزشی جدید خود را افزایش داده است.
                </p>
                <p style="margin-bottom:12px;">
                    آموزش مجازی یکی از روش‌های آموزش از راه دور محسوب می‌گردد. سیستم آموزش مجازی یا <strong>e-learning</strong>، سیستمی است که فعالیت‌های آموزش‌گیرنده را ثبت و پیگیری می‌کند. این روش، روند یادگیری و آموزش را بصورت خودکار مدیریت می‌کند. یک سیستم مدیریت آموزش مجازی قوی، مدیریت اجرایی برنامه‌های آموزشی را تسهیل می‌کند و همچنین این نوع آموزش، دانش‌آموزان را به مشارکت و همکاری با سایر دانش‌آموزان هم‌تراز خود ترغیب می‌کند.
                </p>
                <p style="margin-bottom:12px;">
                    مدرسه آموزش مجازی فضایی است که برنامه‌های آموزشی در آن ارائه می‌شوند. استفاده دانش‌آموزان از این شیوه برای یادگیری و تحصیل در آن موقع که روی خط (آنلاین) حضور بهم می‌رسانند، همانند عمل وارد شدن دانش‌آموزان به کلاس حضوری است. دانش‌آموزان با کمک از آموزش مجازی، واحدهای درسی خود را انتخاب کرده و نیز مطالب درسی مرتبط با آن را دریافت می‌کنند و همچنین به شرکت در امتحان و تمرین‌های درسی مشغول می‌شوند. چنانچه می‌توانند با آموزش مجازی در ساعات مشخص شده با دبیران و سایر دانش‌آموزان ارتباط برقرار کنند.
                </p>
                <p>
                    در آموزش مجازی، سامانه لیست دانش‌آموزان را بر اساس کلاس‌بندی ثبت، اطلاعات دانش‌آموزان را ثبت کرده و گزارش‌های مورد نیاز بر اساس داده‌ها برای مدیر و دبیران تهیه می‌کند. دانش‌آموزان بعد از ثبت‌نام و تایید توسط مدرسه می‌توانند درس‌ها و اطلاعات را مشاهده کرده و درس دلخواه خود را انتخاب و به مطالعه بپردازند در حالیکه کلیه فعالیت‌های دانش‌آموزان و نتایج آنها در بانک‌های اطلاعاتی مربوط به هر دانش‌آموز ضبط خواهد شد.
                </p>
            </div>
        </section>
        <section class="glass-card fade-in-up">
            <div class="grid-2col">
                <div>
                    <h3 style="color:var(--primary-purple); margin-bottom:16px; font-weight:800; display:flex; align-items:center; gap:6px;">
                        <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span data-editable="ve-features-title">مهم‌ترین ویژگی‌های استفاده از سیستم آموزش مجازی</span>
                    </h3>
                    <ol style="padding-right:20px; line-height:2.1; font-size:15px;" data-editable="ve-features-list">
                        <li>کاهش هزینه‌های رفت و آمد و جلوگیری از هدر رفتن زمان دانش‌آموز</li>
                        <li>آموزش همزمان تعداد زیادی از دانش‌آموزان در یک زمان</li>
                        <li>امکان ارزیابی دانش‌آموز همانند کلاس‌های حضوری</li>
                        <li>استفاده از تجهیزات الکترونیکی کمک آموزشی مناسب به همراه عکس و فیلم</li>
                        <li>کسب مهارت دانش‌آموزان در افزایش کیفیت یادگیری مطالب درسی</li>
                    </ol>
                </div>
                <div class="img-frame-container" id="frame-features">
                    <img src="${defaultImages.srvVirtual}" class="zoom-img" alt="ویژگی‌های آموزش مجازی" id="img-features" decoding="async" loading="lazy">
                    <div class="img-upload-overlay" onclick="triggerImageUpload('img-features')">تعویض عکس</div>
                </div>
            </div>
        </section>
        <section class="glass-card fade-in-up">
            <h3 style="color:var(--primary-purple); margin-bottom:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span data-editable="ve-ops-heading">عملکرد مدرسه مجازی چگونه است؟</span>
            </h3>
            <div data-editable="ve-ops-text" style="font-size:15px; line-height:2; text-align:justify;">
                <p style="margin-bottom:12px;">
                    هر آنچه که از لحاظ کیفیت آموزش در مدارس روزانه انتظار می‌رود در مدارس مجازی نیز می‌توان یافت اما باید دقت کرد که برخی عملکردها و سیستم‌ها در آموزش مجازی متفاوت است.
                </p>
                <p style="margin-bottom:12px;">
                    مدرسه مجازی بصورت ترمی واحدی بوده و عملکرد سیستم مدرسه مجازی مانند سیستم دانشگاه‌ها می‌باشد یعنی هر سال تحصیلی شامل <strong>ترم اول</strong> که از مهر ماه تا پایان آذر ماه است، <strong>ترم دوم</strong> که از ابتدای بهمن تا آخر اردیبهشت ماه است و <strong>ترم تابستان</strong> که شروع ترم تابستان از تیر و پایان آن آخر مرداد است، می‌باشد.
                </p>
                <p>
                    دانش‌آموزان در سیستم آموزش مجازی طبق برنامه هفتگی مشخصی باتوجه به انتخاب واحد هر ترم خود سر کلاس‌های آنلاین حاضر می‌شوند و سپس می‌توانند همان کلاس‌ها را بصورت آفلاین مطالعه و مرور کنند.
                </p>
            </div>
        </section>
        <section class="glass-card fade-in-up">
            <h3 style="color:var(--primary-purple); margin-bottom:10px; font-weight:800; display:flex; align-items:center; gap:6px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span data-editable="ve-faq-title">سوالات متداول آموزش مجازی</span>
            </h3>
            <div class="faq-list">
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q1">آموزش مجازی چیست؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a1">آموزش مجازی نوعی آموزش از راه دور است که در آن معلم و دانش‌آموز از طریق اینترنت و سامانه‌های آنلاین با هم در ارتباط هستند.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q2">مدرسه آموزش مجازی چه مزایایی دارد؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a2">مدرسه آموزش مجازی باعث صرفه‌جویی در زمان و هزینه می‌شود و دانش‌آموزان می‌توانند بدون محدودیت مکانی به کلاس‌ها دسترسی داشته باشند.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q3">آیا آموزش مجازی با مدرک معتبر ارائه می‌شود؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a3">بله، دوره‌های آموزش از راه دور مدرسه اترک با مدرک رسمی وزارت آموزش و پرورش برگزار می‌شوند که کاملاً قابل استعلام و استفاده رسمی است.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q4">چه کسانی می‌توانند از آموزش مجازی استفاده کنند؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a4">همه افراد از دانش‌آموزان گرفته تا کارمندان و علاقه‌مندان به یادگیری مهارت‌های جدید و بازماندگان از تحصیل می‌توانند از آموزش مجازی استفاده کنند.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q5">کیفیت آموزش مجازی چگونه است؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a5">کیفیت مدرسه آموزش مجازی به محتوای آموزشی، تجربه اساتید و امکانات پلتفرم وابسته است و در بسیاری موارد به دلیل امکان بازبینی درس‌ها حتی از آموزش حضوری نیز بهتر است.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q6">آموزش مجازی با مدرک معتبر چه کمکی به رزومه می‌کند؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a6">داشتن مدرک معتبر از دوره‌های آموزش مجازی می‌تواند نشان‌دهنده توانایی یادگیری آنلاین، نظم شخصی و ارتقای شغلی فرد باشد.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q7">آیا آموزش مجازی برای کودکان مناسب است؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a7">بله، آموزش مجازی با محتوای متناسب می‌تواند گزینه‌ای مناسب برای آموزش کودکان باشد، به شرط نظارت والدین.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q8">چگونه می‌توان بهترین نتیجه از آموزش مجازی گرفت؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a8">با داشتن برنامه‌ریزی درست، ایجاد محیط یادگیری آرام و پیگیری مداوم تمرین‌ها می‌توان بهترین نتیجه را از آموزش مجازی گرفت.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q9">معایب آموزش مجازی چیست؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a9">یکی از معایب مدرسه آموزش مجازی نیاز به اینترنت پایدار است و همچنین ممکن است تعامل حضوری کمتری میان معلم و دانش‌آموز برقرار شود که با جلسات آنلاین تعاملی جبران می‌شود.</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">
                        <span><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span data-editable="faq-q10">چگونه مطمئن شویم دوره آموزش مجازی معتبر است؟</span></span>
                        <span class="faq-icon">▼</span>
                    </div>
                    <div class="faq-answer" data-editable="faq-a10">با بررسی مجوزهای رسمی موسسه، تاییدیه آموزش و پرورش، اعتبار مدرک و امکان استعلام کد دانش‌آموزی، می‌توان از معتبر بودن دوره آموزش مجازی مطمئن شد.</div>
                </div>
            </div>
        </section>
        <div class="laser-box-wrapper fade-in-up" onclick="openLmsModal()">
            <div class="laser-box-inner">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span data-editable="ve-lms-cta">برای دریافت فیلم‌ها و جزوه‌ها کلیک کنید (ورود به سامانه محتوا)</span>
            </div>
        </div>
    `,

    'lms-portal': `
        <section class="glass-card fade-in-up">
            <div style="text-align:center; padding:15px;">
                <h2 style="color:var(--primary-purple); margin:12px 0; font-weight:800; display:inline-flex; align-items:center; gap:8px;">
                    <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    <span data-editable="lms-title">به بخش آموزش مجازی مدرسه اترک خوش آمدید</span>
                </h2>
                <p data-editable="lms-sub" style="font-size:16px; color:var(--text-muted); max-width:800px; margin:0 auto 25px; line-height:2;">
                    شما در این بخش به تمامی ویدیوها و جزوه‌های آموزشی تمامی درس‌ها دسترسی دارید و می‌توانید از آن‌ها استفاده کنید.
                </p>
            </div>
            <!-- =====================================================
     جستجوی مطالب آموزشی
     فقط داخل سامانه آموزش مجازی
     ===================================================== -->

<div
    style="
        max-width:850px;
        margin:0 auto 25px;
    "
>

    <div
        style="
            display:flex;
            align-items:center;
            gap:10px;
            padding:10px;
            border:1px solid var(--card-border);
            background:var(--card-bg);
            border-radius:16px;
            box-shadow:var(--glass-shadow);
        "
    >

        <span
            style="
                font-size:22px;
                color:var(--accent-pink);
                padding:0 5px;
            "
        >
            🔎
        </span>

        <input
            aria-label="جستجوی مطالب آموزشی"
            id="lmsMaterialSearch"
            type="search"
            placeholder="جستجوی فیلم، جزوه و مطالب آموزشی..."
            oninput="searchLmsMaterials()"
            style="
                flex:1;
                min-width:0;
                border:none;
                outline:none;
                background:transparent;
                color:var(--text-color);
                font-family:inherit;
                font-size:14px;
                padding:9px 5px;
                text-align:right;
            "
        >

    </div>

    <div
        id="lmsSearchResults"
        style="
            display:none;
            grid-template-columns:
                repeat(auto-fit, minmax(240px, 1fr));
            gap:12px;
            margin-top:12px;
        "
    >
    </div>

</div>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('lms-theory')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <h3 data-editable="lms-card1-title" style="font-size:18px; font-weight:800;">دروس نظری</h3>
                    <p data-editable="lms-card1-sub" style="font-size:13px; color:var(--text-muted); margin-top:8px;">رشته‌های تجربی، ریاضی، انسانی (متوسطه اول و دوم)</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('lms-kardanesh')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    <h3 data-editable="lms-card2-title" style="font-size:18px; font-weight:800;">کاردانش و فنی‌حرفه‌ای</h3>
                    <p data-editable="lms-card2-sub" style="font-size:13px; color:var(--text-muted); margin-top:8px;">مهارت‌های فنی، کامپیوتر، حسابداری و گرافیک</p>
                </div>
            </div>
            <a href="http://www.chap.sch.ir/" target="_blank" rel="noopener noreferrer" aria-label="ورود به سایت چاپ وزارت آموزش و پرورش" class="laser-box-wrapper" style="margin-top: 30px;">
                <div class="laser-box-inner" style="justify-content: center; gap: 12px;">
                    <svg class="topic-icon-svg" style="width:28px; height:28px; margin:0;" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span data-editable="lms-chap-link">برای دسترسی رایگان به تمامی دروس آموزشی کلیک کنید</span>
                </div>
            </a>
            <div class="img-frame-container" style="aspect-ratio: 21/9; margin-top:20px;" id="frame-lms-main">
                <img src="${defaultImages.slide1}" class="zoom-img" alt="پنل ویدیوها و جزوات" id="img-lms-main" decoding="async" loading="lazy">
                <div class="img-upload-overlay" onclick="triggerImageUpload('img-lms-main')">بارگذاری عکس یا پوستر اختصاصی</div>
            </div>
        </section>
    `,

    'lms-theory': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span data-editable="lms-theory-title">دروس نظری - انتخاب مقطع تحصیلی</span>
            </h2>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('lms-theory-m1')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    <h3 data-editable="lms-theory-m1-title" style="font-size:18px; font-weight:800;">متوسطه اول</h3>
                    <p data-editable="lms-theory-m1-sub" style="font-size:13px; color:var(--text-muted); margin-top:8px;">پایه‌های هفتم، هشتم و نهم</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('lms-theory-m2')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                    <h3 data-editable="lms-theory-m2-title" style="font-size:18px; font-weight:800;">متوسطه دوم</h3>
                    <p data-editable="lms-theory-m2-sub" style="font-size:13px; color:var(--text-muted); margin-top:8px;">پایه‌های دهم، یازدهم و دوازدهم</p>
                </div>
            </div>
        </section>
    `,

    'lms-theory-m1': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                <span data-editable="m1-main-title">مقطع متوسطه اول</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">لطفاً پایه تحصیلی مورد نظر خود را انتخاب کنید:</p>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('m1-p7')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m1-p7" style="font-size:18px; font-weight:800;">پایه هفتم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه هفتم متوسطه اول</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m1-p8')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m1-p8" style="font-size:18px; font-weight:800;">پایه هشتم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه هشتم متوسطه اول</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m1-p9')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m1-p9" style="font-size:18px; font-weight:800;">پایه نهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه نهم متوسطه اول</p>
                </div>
            </div>
        </section>
    `,

    'm1-p7': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m1-p7-title">پایه هفتم - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید تا محتوای آن را مشاهده کنید:</p>
            <div class="services-grid">
                <div class="service-card" onclick="navigateTo('m1-p7-lesson1')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="قرآن" id="img-m1-p7-1" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-1')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson1-name">قرآن</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson2')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="پیام‌های آسمانی" id="img-m1-p7-2" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-2')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson2-name">پیام‌های آسمانی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson3')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="فارسی" id="img-m1-p7-3" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-3')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson3-name">فارسی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson4')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="ریاضی" id="img-m1-p7-4" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-4')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson4-name">ریاضی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson5')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="علوم" id="img-m1-p7-5" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-5')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson5-name">علوم</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson6')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="مطالعات اجتماعی" id="img-m1-p7-6" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-6')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson6-name">مطالعات اجتماعی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson7')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="عربی" id="img-m1-p7-7" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-7')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson7-name">عربی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p7-lesson8')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="انگلیسی" id="img-m1-p7-8" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p7-8')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p7-lesson8-name">انگلیسی</h3>
                </div>
            </div>
        </section>
    `,

    'm1-p8': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m1-p8-title">پایه هشتم - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید تا محتوای آن را مشاهده کنید:</p>
            <div class="services-grid">
                <div class="service-card" onclick="navigateTo('m1-p8-lesson1')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="قرآن" id="img-m1-p8-1" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-1')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson1-name">قرآن</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson2')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="پیام‌های آسمانی" id="img-m1-p8-2" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-2')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson2-name">پیام‌های آسمانی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson3')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="فارسی" id="img-m1-p8-3" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-3')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson3-name">فارسی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson4')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="ریاضی" id="img-m1-p8-4" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-4')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson4-name">ریاضی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson5')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="علوم" id="img-m1-p8-5" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-5')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson5-name">علوم</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson6')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="مطالعات اجتماعی" id="img-m1-p8-6" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-6')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson6-name">مطالعات اجتماعی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson7')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="عربی" id="img-m1-p8-7" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-7')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson7-name">عربی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p8-lesson8')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="انگلیسی" id="img-m1-p8-8" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p8-8')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p8-lesson8-name">انگلیسی</h3>
                </div>
            </div>
        </section>
    `,

    'm1-p9': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m1-p9-title">پایه نهم - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید تا محتوای آن را مشاهده کنید:</p>
            <div class="services-grid">
                <div class="service-card" onclick="navigateTo('m1-p9-lesson1')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="قرآن" id="img-m1-p9-1" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-1')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson1-name">قرآن</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson2')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="پیام‌های آسمانی" id="img-m1-p9-2" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-2')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson2-name">پیام‌های آسمانی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson3')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="فارسی" id="img-m1-p9-3" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-3')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson3-name">فارسی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson4')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="ریاضی" id="img-m1-p9-4" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-4')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson4-name">ریاضی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson5')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="علوم" id="img-m1-p9-5" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-5')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson5-name">علوم</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson6')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="مطالعات اجتماعی" id="img-m1-p9-6" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-6')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson6-name">مطالعات اجتماعی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson7')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="عربی" id="img-m1-p9-7" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-7')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson7-name">عربی</h3>
                </div>
                <div class="service-card" onclick="navigateTo('m1-p9-lesson8')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <div class="img-frame-container"><img src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80" class="zoom-img" alt="انگلیسی" id="img-m1-p9-8" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="event.stopPropagation(); triggerImageUpload('img-m1-p9-8')">تعویض عکس</div></div>
                    <h3 class="service-card-title" data-editable="m1-p9-lesson8-name">انگلیسی</h3>
                </div>
            </div>
        </section>
    `,

       // ====== صفحات محتوا دروس پایه هفتم ======
'm1-p7-lesson1': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson1-title">پایه هفتم - قرآن</span></h2>${lessonCards('m1-p7-lesson1', 'قرآن')}</section>`,

'm1-p7-lesson2': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson2-title">پایه هفتم - پیام‌های آسمانی</span></h2>${lessonCards('m1-p7-lesson2', 'پیام‌های آسمانی')}</section>`,

'm1-p7-lesson3': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson3-title">پایه هفتم - فارسی</span></h2>${lessonCards('m1-p7-lesson3', 'فارسی')}</section>`,

'm1-p7-lesson4': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson4-title">پایه هفتم - ریاضی</span></h2>${lessonCards('m1-p7-lesson4', 'ریاضی')}</section>`,

'm1-p7-lesson5': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson5-title">پایه هفتم - علوم</span></h2>${lessonCards('m1-p7-lesson5', 'علوم')}</section>`,

'm1-p7-lesson6': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson6-title">پایه هفتم - مطالعات اجتماعی</span></h2>${lessonCards('m1-p7-lesson6', 'مطالعات اجتماعی')}</section>`,

'm1-p7-lesson7': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson7-title">پایه هفتم - عربی</span></h2>${lessonCards('m1-p7-lesson7', 'عربی')}</section>`,

'm1-p7-lesson8': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p7-lesson8-title">پایه هفتم - انگلیسی</span></h2>${lessonCards('m1-p7-lesson8', 'انگلیسی')}</section>`,


// ====== صفحات محتوا دروس پایه هشتم ======
'm1-p8-lesson1': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson1-title">پایه هشتم - قرآن</span></h2>${lessonCards('m1-p8-lesson1', 'قرآن')}</section>`,

'm1-p8-lesson2': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson2-title">پایه هشتم - پیام‌های آسمانی</span></h2>${lessonCards('m1-p8-lesson2', 'پیام‌های آسمانی')}</section>`,

'm1-p8-lesson3': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson3-title">پایه هشتم - فارسی</span></h2>${lessonCards('m1-p8-lesson3', 'فارسی')}</section>`,

'm1-p8-lesson4': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson4-title">پایه هشتم - ریاضی</span></h2>${lessonCards('m1-p8-lesson4', 'ریاضی')}</section>`,

'm1-p8-lesson5': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson5-title">پایه هشتم - علوم</span></h2>${lessonCards('m1-p8-lesson5', 'علوم')}</section>`,

'm1-p8-lesson6': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson6-title">پایه هشتم - مطالعات اجتماعی</span></h2>${lessonCards('m1-p8-lesson6', 'مطالعات اجتماعی')}</section>`,

'm1-p8-lesson7': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson7-title">پایه هشتم - عربی</span></h2>${lessonCards('m1-p8-lesson7', 'عربی')}</section>`,

'm1-p8-lesson8': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p8-lesson8-title">پایه هشتم - انگلیسی</span></h2>${lessonCards('m1-p8-lesson8', 'انگلیسی')}</section>`,


// ====== صفحات محتوا دروس پایه نهم ======
'm1-p9-lesson1': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson1-title">پایه نهم - قرآن</span></h2>${lessonCards('m1-p9-lesson1', 'قرآن')}</section>`,

'm1-p9-lesson2': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson2-title">پایه نهم - پیام‌های آسمانی</span></h2>${lessonCards('m1-p9-lesson2', 'پیام‌های آسمانی')}</section>`,

'm1-p9-lesson3': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson3-title">پایه نهم - فارسی</span></h2>${lessonCards('m1-p9-lesson3', 'فارسی')}</section>`,

'm1-p9-lesson4': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson4-title">پایه نهم - ریاضی</span></h2>${lessonCards('m1-p9-lesson4', 'ریاضی')}</section>`,

'm1-p9-lesson5': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson5-title">پایه نهم - علوم</span></h2>${lessonCards('m1-p9-lesson5', 'علوم')}</section>`,

'm1-p9-lesson6': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson6-title">پایه نهم - مطالعات اجتماعی</span></h2>${lessonCards('m1-p9-lesson6', 'مطالعات اجتماعی')}</section>`,

'm1-p9-lesson7': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson7-title">پایه نهم - عربی</span></h2>${lessonCards('m1-p9-lesson7', 'عربی')}</section>`,

'm1-p9-lesson8': `<section class="glass-card fade-in-up"><h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="m1-p9-lesson8-title">پایه نهم - انگلیسی</span></h2>${lessonCards('m1-p9-lesson8', 'انگلیسی')}</section>`,

    // ====== متوسطه دوم - انتخاب رشته ======
    'lms-theory-m2': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                <span data-editable="m2-main-title">مقطع متوسطه دوم</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">لطفاً رشته تحصیلی مورد نظر خود را انتخاب کنید:</p>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('m2-riazi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <h3 data-editable="m2-riazi-title" style="font-size:18px; font-weight:800;">رشته ریاضی</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس تخصصی رشته ریاضی فیزیک</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-tajrobi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <h3 data-editable="m2-tajrobi-title" style="font-size:18px; font-weight:800;">رشته تجربی</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس تخصصی رشته علوم تجربی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-ensani')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-ensani-title" style="font-size:18px; font-weight:800;">رشته انسانی</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس تخصصی رشته علوم انسانی</p>
                </div>
            </div>
        </section>
    `,

    // ====== رشته ریاضی ======
    'm2-riazi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span data-editable="m2-riazi-page-title">رشته ریاضی - انتخاب پایه</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">لطفاً پایه تحصیلی مورد نظر خود را انتخاب کنید:</p>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('m2-p10-riazi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p10-riazi" style="font-size:18px; font-weight:800;">پایه دهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه دهم رشته ریاضی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-p11-riazi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p11-riazi" style="font-size:18px; font-weight:800;">پایه یازدهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه یازدهم رشته ریاضی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-p12-riazi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p12-riazi" style="font-size:18px; font-weight:800;">پایه دوازدهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه دوازدهم رشته ریاضی</p>
                </div>
            </div>
        </section>
    `,

    // ====== رشته تجربی ======
    'm2-tajrobi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span data-editable="m2-tajrobi-page-title">رشته تجربی - انتخاب پایه</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">لطفاً پایه تحصیلی مورد نظر خود را انتخاب کنید:</p>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('m2-p10-tajrobi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p10-tajrobi" style="font-size:18px; font-weight:800;">پایه دهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه دهم رشته تجربی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-p11-tajrobi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p11-tajrobi" style="font-size:18px; font-weight:800;">پایه یازدهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه یازدهم رشته تجربی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-p12-tajrobi')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p12-tajrobi" style="font-size:18px; font-weight:800;">پایه دوازدهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه دوازدهم رشته تجربی</p>
                </div>
            </div>
        </section>
    `,

    // ====== رشته انسانی ======
    'm2-ensani': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m2-ensani-page-title">رشته انسانی - انتخاب پایه</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">لطفاً پایه تحصیلی مورد نظر خود را انتخاب کنید:</p>
            <div class="drilldown-grid">
                <div class="drilldown-card" onclick="navigateTo('m2-p10-ensani')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p10-ensani" style="font-size:18px; font-weight:800;">پایه دهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه دهم رشته انسانی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-p11-ensani')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p11-ensani" style="font-size:18px; font-weight:800;">پایه یازدهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه یازدهم رشته انسانی</p>
                </div>
                <div class="drilldown-card" onclick="navigateTo('m2-p12-ensani')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 data-editable="m2-p12-ensani" style="font-size:18px; font-weight:800;">پایه دوازدهم</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">دروس پایه دوازدهم رشته انسانی</p>
                </div>
            </div>
        </section>
    `,

    // ====== پایه دهم انسانی ======
    'm2-p10-ensani': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m2-p10-ensani-title">پایه دهم انسانی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('فارسی', 'm2-p10-ensani-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('علوم و فنون ادبی', 'm2-p10-ensani-uloom', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p10-ensani-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('عربی', 'm2-p10-ensani-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('ریاضی و آمار', 'm2-p10-ensani-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('جغرافیای ایران', 'm2-p10-ensani-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تاریخ', 'm2-p10-ensani-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('جامعه شناسی', 'm2-p10-ensani-jame', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>')}
                ${subjectCard('اقتصاد', 'm2-p10-ensani-eghtesad', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('منطق', 'm2-p10-ensani-mantegh', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path>')}
                ${subjectCard('انگلیسی', 'm2-p10-ensani-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
            </div>
        </section>
    `,

    // ====== پایه یازدهم انسانی ======
    'm2-p11-ensani': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m2-p11-ensani-title">پایه یازدهم انسانی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('فارسی', 'm2-p11-ensani-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('علوم و فنون ادبی', 'm2-p11-ensani-uloom', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p11-ensani-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('عربی', 'm2-p11-ensani-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('ریاضی و آمار', 'm2-p11-ensani-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('جغرافیای ایران', 'm2-p11-ensani-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تاریخ', 'm2-p11-ensani-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('جامعه شناسی', 'm2-p11-ensani-jame', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>')}
                ${subjectCard('اقتصاد', 'm2-p11-ensani-eghtesad', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('منطق', 'm2-p11-ensani-mantegh', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path>')}
                ${subjectCard('فلسفه', 'm2-p11-ensani-falsafe', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('روان شناسی', 'm2-p11-ensani-ravan', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p11-ensani-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
            </div>
        </section>
    `,

    // ====== پایه دوازدهم انسانی ======
    'm2-p12-ensani': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span data-editable="m2-p12-ensani-title">پایه دوازدهم انسانی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('فارسی', 'm2-p12-ensani-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('علوم و فنون ادبی', 'm2-p12-ensani-uloom', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p12-ensani-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('عربی', 'm2-p12-ensani-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('ریاضی و آمار', 'm2-p12-ensani-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('جغرافیای ایران', 'm2-p12-ensani-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تاریخ', 'm2-p12-ensani-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('جامعه شناسی', 'm2-p12-ensani-jame', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>')}
                ${subjectCard('اقتصاد', 'm2-p12-ensani-eghtesad', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('منطق', 'm2-p12-ensani-mantegh', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path>')}
                ${subjectCard('فلسفه', 'm2-p12-ensani-falsafe', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('روان شناسی', 'm2-p12-ensani-ravan', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>')}
                ${subjectCard('سلامت و بهداشت', 'm2-p12-ensani-salamat', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p12-ensani-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
            </div>
        </section>
    `,

    // ====== پایه دهم تجربی ======
    'm2-p10-tajrobi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span data-editable="m2-p10-tajrobi-title">پایه دهم تجربی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('فارسی', 'm2-p10-tajrobi-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p10-tajrobi-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('عربی', 'm2-p10-tajrobi-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('شیمی', 'm2-p10-tajrobi-shimi', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('ریاضی', 'm2-p10-tajrobi-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('فیزیک', 'm2-p10-tajrobi-fizik', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('زیست', 'm2-p10-tajrobi-zist', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('آزمایشگاه', 'm2-p10-tajrobi-azmayesh', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('جغرافیای ایران', 'm2-p10-tajrobi-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تعلیمات ادیان الهی', 'm2-p10-tajrobi-adyan', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p10-tajrobi-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
                ${subjectCard('تاریخ', 'm2-p10-tajrobi-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
            </div>
        </section>
    `,

    // ====== پایه یازدهم تجربی ======
    'm2-p11-tajrobi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span data-editable="m2-p11-tajrobi-title">پایه یازدهم تجربی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('فارسی', 'm2-p11-tajrobi-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p11-tajrobi-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('عربی', 'm2-p11-tajrobi-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('شیمی', 'm2-p11-tajrobi-shimi', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('ریاضی', 'm2-p11-tajrobi-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('فیزیک', 'm2-p11-tajrobi-fizik', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('زیست', 'm2-p11-tajrobi-zist', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('آزمایشگاه', 'm2-p11-tajrobi-azmayesh', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('جغرافیای ایران', 'm2-p11-tajrobi-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تعلیمات ادیان الهی', 'm2-p11-tajrobi-adyan', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p11-tajrobi-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
                ${subjectCard('تاریخ', 'm2-p11-tajrobi-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('زمین شناسی', 'm2-p11-tajrobi-zamin', 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('انسان و محیط زیست', 'm2-p11-tajrobi-mohit', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
            </div>
        </section>
    `,

    // ====== پایه دوازدهم تجربی ======
    'm2-p12-tajrobi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span data-editable="m2-p12-tajrobi-title">پایه دوازدهم تجربی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('فارسی', 'm2-p12-tajrobi-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p12-tajrobi-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('عربی', 'm2-p12-tajrobi-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('شیمی', 'm2-p12-tajrobi-shimi', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('ریاضی', 'm2-p12-tajrobi-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('فیزیک', 'm2-p12-tajrobi-fizik', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('زیست', 'm2-p12-tajrobi-zist', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('آزمایشگاه', 'm2-p12-tajrobi-azmayesh', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('جغرافیای ایران', 'm2-p12-tajrobi-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تعلیمات ادیان الهی', 'm2-p12-tajrobi-adyan', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p12-tajrobi-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
                ${subjectCard('تاریخ', 'm2-p12-tajrobi-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('زمین شناسی', 'm2-p12-tajrobi-zamin', 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('انسان و محیط زیست', 'm2-p12-tajrobi-mohit', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('سلامت و بهداشت', 'm2-p12-tajrobi-salamat', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
            </div>
        </section>
    `,

    // ====== پایه دهم ریاضی ======
    'm2-p10-riazi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span data-editable="m2-p10-riazi-title">پایه دهم ریاضی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('ریاضی', 'm2-p10-riazi-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('فیزیک', 'm2-p10-riazi-fizik', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('شیمی', 'm2-p10-riazi-shimi', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('آزمایشگاه', 'm2-p10-riazi-azmayesh', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('هندسه', 'm2-p10-riazi-hendese', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>')}
                ${subjectCard('فارسی', 'm2-p10-riazi-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p10-riazi-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p10-riazi-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
                ${subjectCard('عربی', 'm2-p10-riazi-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('جغرافیا', 'm2-p10-riazi-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
            </div>
        </section>
    `,

    // ====== پایه یازدهم ریاضی ======
    'm2-p11-riazi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span data-editable="m2-p11-riazi-title">پایه یازدهم ریاضی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('ریاضی', 'm2-p11-riazi-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('فیزیک', 'm2-p11-riazi-fizik', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('شیمی', 'm2-p11-riazi-shimi', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('آزمایشگاه', 'm2-p11-riazi-azmayesh', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('هندسه', 'm2-p11-riazi-hendese', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>')}
                ${subjectCard('فارسی', 'm2-p11-riazi-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p11-riazi-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p11-riazi-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
                ${subjectCard('عربی', 'm2-p11-riazi-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('جغرافیا', 'm2-p11-riazi-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('حسابان', 'm2-p11-riazi-hesaban', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('آمار و احتمال', 'm2-p11-riazi-amar', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('زمین شناسی', 'm2-p11-riazi-zamin', 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تاریخ', 'm2-p11-riazi-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('انسان و محیط زیست', 'm2-p11-riazi-mohit', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
            </div>
        </section>
    `,

    // ====== پایه دوازدهم ریاضی ======
    'm2-p12-riazi': `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span data-editable="m2-p12-riazi-title">پایه دوازدهم ریاضی - انتخاب درس</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">روی هر درس کلیک کنید:</p>
            <div class="services-grid">
                ${subjectCard('ریاضی', 'm2-p12-riazi-riazi', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>')}
                ${subjectCard('فیزیک', 'm2-p12-riazi-fizik', 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>')}
                ${subjectCard('شیمی', 'm2-p12-riazi-shimi', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('آزمایشگاه', 'm2-p12-riazi-azmayesh', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80', '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>')}
                ${subjectCard('هندسه', 'm2-p12-riazi-hendese', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80', '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>')}
                ${subjectCard('فارسی', 'm2-p12-riazi-farsi', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('دین و زندگی', 'm2-p12-riazi-din', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('انگلیسی', 'm2-p12-riazi-english', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>')}
                ${subjectCard('عربی', 'm2-p12-riazi-arabi', 'https://images.unsplash.com/photo-1585149208996-5565c60e2b6c?auto=format&fit=crop&w=600&q=80', '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>')}
                ${subjectCard('جغرافیا', 'm2-p12-riazi-joghrafia', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('حسابان', 'm2-p12-riazi-hesaban', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('آمار و احتمال', 'm2-p12-riazi-amar', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80', '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>')}
                ${subjectCard('زمین شناسی', 'm2-p12-riazi-zamin', 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=600&q=80', '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>')}
                ${subjectCard('تاریخ', 'm2-p12-riazi-tarikh', 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80', '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>')}
                ${subjectCard('انسان و محیط زیست', 'm2-p12-riazi-mohit', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
                ${subjectCard('ریاضیات گسسته', 'm2-p12-riazi-gosaste', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80', '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>')}
                ${subjectCard('هویت اجتماعی', 'm2-p12-riazi-hoviat', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>')}
                ${subjectCard('سلامت و بهداشت', 'm2-p12-riazi-salamat', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>')}
            </div>
        </section>
    `,

    // ====== سایر صفحات (همان قبلی) ======
    'lms-kardanesh': `
        <section class="glass-card fade-in-up" style="text-align:center; padding:40px 20px;">
            <h2 class="card-title" style="justify-content:center; margin-top:15px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span data-editable="kardanesh-title">شاخه کاردانش و مهارت‌آموزی</span>
            </h2>
            <p data-editable="kardanesh-sub" style="font-size:18px; color:#ef4444; font-weight:700; margin:20px 0;">این صفحه به‌زودی فعال می‌شود</p>
            <p data-editable="kardanesh-desc" style="font-size:14px; color:var(--text-muted);">شما می‌توانید فایل‌ها و پروژه‌های خود را مستقیماً از طریق پنل مدیریت آپلود نمایید.</p>
        </section>
    `,

    monitoring: `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <span data-editable="mon-main-title">نظارت و ارزشیابی مستمر آموزشی</span>
            </h2>
            <p data-editable="mon-p1" style="font-size:15px; line-height:2; text-align:justify; margin-bottom:20px;">
                دانش‌آموزان متقاضی پس از ثبت‌نام در مقاطع مورد درخواست خود، توسط مشاور مدرسه انتخاب واحد شده و برنامه کلاس‌های آنلاین را از طریق بخش آموزش مجازی، با رمز عبور خودشان، می‌توانند دریافت کنند و از امکانات آموزش‌های مجازی مدرسه استفاده کنند.
            </p>
            <h3 style="color:var(--primary-purple); margin-bottom:14px; font-weight:800; display:flex; align-items:center; gap:6px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                <span data-editable="mon-steps-title">مراحل نظارت مستمر آموزشی:</span>
            </h3>
            <div style="font-size:14.5px; line-height:2.1;" data-editable="mon-steps">
                <p><strong>۱-</strong> کنترل و پیگیری دانش‌آموزان جهت شرکت در کلاس‌های آنلاین.<br><em>توجه: در صورت عدم استفاده دانش‌آموز از کلاس آنلاین، می‌تواند از کلاس‌های آفلاین استفاده نماید.</em></p>
                <p><strong>۲-</strong> برنامه‌ریزی مطالعاتی توسط مشاور مدرسه جهت بهبود کیفیت مطالعه دانش‌آموز</p>
                <p><strong>۳-</strong> پیگیری مشاور من از روند مطالعات دانش‌آموزان بصورت تماس تلفنی یا آنلاین بصورت هفتگی و ماهانه</p>
                <p><strong>۴-</strong> ثبت گزارشات دریافت شده توسط مشاور من در پرونده مشاوره دانش‌آموز</p>
                <p><strong>۵-</strong> استفاده مستمر دانش‌آموزان از بانک سوالات مدرسه در تمام طول ترم</p>
                <p><strong>۶-</strong> استفاده دانش‌آموزان از جزوات و منابع آموزشی مدرسه در دروس تخصصی و عمومی</p>
                <p><strong>۷-</strong> برنامه‌ریزی و برگزاری آزمون میان‌ترم توسط مدرسه بصورت آنلاین<br><em>توجه: این آزمون میان‌ترم صرفاً جهت یادگیری بهتر دانش‌آموز در راستای شرکت در کلاس‌های آنلاین و کسب مهارت شرکت در آزمون‌های پایان‌ترم می‌باشد و نمره آن در نمره پایانی دانش‌آموز هیچ تاثیری ندارد.</em></p>
                <p><strong>۸-</strong> در پایان ترم دانش‌آموزان امکان رفع اشکال از دبیران مجرب این مدرسه را دارند.</p>
            </div>
            <div style="margin-top:25px; padding:15px; border-radius:12px; background:rgba(236,72,153,0.12); text-align:center; font-weight:800; color:var(--primary-purple); display:flex; align-items:center; justify-content:center; gap:8px;">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span data-editable="mon-center-title">مرکز مشاوره مدرسه آموزش از راه دور اترک</span>
            </div>
        </section>
    `,

    support: `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <span data-editable="sup-main-title">مشاور من (پشتیبان آموزشی)</span>
            </h2>
            <div style="font-size:15px; line-height:2; text-align:justify;" data-editable="sup-p1">
                <p style="margin-bottom:12px;">شنیدم برای راحت‌تر درس خوندن دنبال یه مشاوره خوب می‌گردی تا راهو برات ساده‌تر کنه!</p>
                <p style="margin-bottom:12px;">خب...! جای خوبی اومدی. همراهم بیا تا برات بگم...!</p>
                <p style="margin-bottom:12px;">این روزا با پیشرفت تکنولوژی و زیاد شدن مشغله خانواده‌ها، پدر مادرها سرشون خیلی شلوغ شده و ترجیح میدن کارهای آموزشی بچه‌هاشون با بالاترین کیفیت و در کوتاه‌ترین زمان انجام بشه.</p>
                <p style="margin-bottom:12px;">خیلی از دانش‌آموزان وقتی تصمیم می‌گیرن تا در امتحاناتشون نمره خوبی بگیرن فکر می‌کنن صرفاً با مطالعه‌ی سخت می‌تونن موفق بشن. درسته! مطالعه نقش مهمی داره ولی برای موفقیت باید طبق یک برنامه دقیق و مشخص و البته مستمر عمل کرد. پس نیاز به یک مشاور و پشتیبان تحصیلی هست.</p>
                <p style="margin-bottom:12px;">معمولاً آینده تحصیلی و شغلی بچه‌ها، والدین و حتی خودشون رو تا حد زیادی درگیر می‌کنه. لذا برای پیشگیری از هر گونه پشیمانی در آینده و یا عدم موفقیت در مسیر تحصیلی دانش‌آموز، بهتره یه مشاور دلسوز، کاربلد و متخصص همراه هر دانش‌آموز باشه.</p>
                <p>وقتی با افراد موفق در زمینه‌های مختلف علمی صحبت می‌کنیم به موارد مشابهی بر می‌خوریم؛ یکی از اون‌ها کمک گرفتن از افراد متخصص هست. کمتر کسی پیدا می‌شه که بدون استفاده از تجربیات افراد دیگر بتونه تصمیمات مهم رو در مواضع مهم بگیره. پس انتخاب یک مشاور تحصیلی خوب و مناسب می‌تونه نقش خیلی مهمی در موفقیت دانش‌آموزان ایفا کنه.</p>
            </div>
        </section>
        <section class="glass-card fade-in-up">
            <div class="grid-2col">
                <div class="img-frame-container" id="frame-sup-adv"><img src="${defaultImages.srvSupport}" class="zoom-img" alt="مشاوره آنلاین" id="img-sup-adv" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-sup-adv')">آپلود تصویر (فقط مدیریت)</div></div>
                <div>
                    <h3 style="color:var(--primary-purple); margin-bottom:14px; font-weight:800; display:flex; align-items:center; gap:6px;"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 16 12 12 16 12 8"></polygon></svg><span data-editable="sup-adv-title">مزایای مشاور آنلاین</span></h3>
                    <div style="font-size:14.5px; line-height:2;" data-editable="sup-adv-list">
                        <p><strong>۱-</strong> بدون محدودیت زمانی و مکانی در هر جای دنیا که هستید می‌تونید در سریع‌ترین زمان ممکن با مشاور شخصی خودتون ارتباط برقرار کنید.</p>
                        <p><strong>۲-</strong> برای استفاده از مشاوره آنلاین می‌تونید بدون صرف هزینه و وقت در مسیر رفت و آمد، به صورت غیرحضوری با مشاور و پشتیبان تحصیلی ارتباط گرفته و از زمانتون به نحو احسن استفاده کنید.</p>
                        <p><strong>۳-</strong> شما می‌تونید با صرف هزینه کمتر از مشاوره حضوری و البته با کیفیت بالا از خونتون برنامه دقیق درسی رو دریافت کنید.</p>
                        <p><strong>۴-</strong> هر زمان اراده کردی مشاور آنلاین می‌تونه بهت مشاوره بده و راهگشا باشه.</p>
                        <p style="margin-top:10px;"><em>و در نهایت همه ما می‌دونیم که همیشه برای رسیدن به موفقیت، پیگیری و استمرار لازمه و مشاوره آنلاین مدرسه اترک علاوه بر ارائه برنامه درسی، با پیگیری مستمر از دانش‌آموزان پشتیبانی می‌کنه.</em></p>
                    </div>
                </div>
            </div>
        </section>
        <section class="glass-card fade-in-up">
            <div class="grid-2col">
                <div>
                    <h3 style="color:var(--primary-purple); margin-bottom:14px; font-weight:800; display:flex; align-items:center; gap:6px;"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg><span data-editable="sup-ops-title">عملکرد مشاوره و پشتیبان تحصیلی مدرسه اترک چجوریه؟</span></h3>
                    <div style="font-size:14.5px; line-height:2; text-align:justify;" data-editable="sup-ops-desc"><p>بعد از ثبت‌نام، مشاور از طریق اینستاگرام یا تلگرام با دانش‌آموز ارتباط برقرار می‌کنه و طبق برنامه شخصی وی، برنامه درسی و نکات مهم رو به دانش‌آموز متذکر میشه. بله درست متوجه شدید! مشاوره به صورت کاملاً فردی و مختص با شرایط هر دانش‌آموز انجام میشه و در واقع برنامه درسی ارائه شده فقط و فقط خاص آن دانش‌آموز هست. بعد از ارائه برنامه درسی، مشاور به دانش‌آموز کمک می‌کنه تا خودش بتونه مدیر زمان خودش باشه و مطالعه دروس و سایر کارهاش رو درست اولویت‌بندی کنه. در نتیجه دانش‌آموز می‌تونه به یک برنامه دقیق و مناسب، بدون هدر رفت زمان و یا صرف انرژی زیاد دست پیدا کنه.</p></div>
                </div>
                <div class="img-frame-container" id="frame-sup-ops"><img src="${defaultImages.classroom}" class="zoom-img" alt="عملکرد مشاور" id="img-sup-ops" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-sup-ops')">آپلود عکس (مدیریت)</div></div>
            </div>
        </section>
        <section class="glass-card fade-in-up">
            <div class="img-frame-container" style="max-width:550px; margin:0 auto 20px; aspect-ratio:16/9;" id="frame-sup-mid"><img src="${defaultImages.slide2}" class="zoom-img" alt="نقش مشاور" id="img-sup-mid" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-sup-mid')">آپلود عکس سایز متوسط (مدیریت)</div></div>
            <h3 style="text-align:center; color:var(--primary-purple); margin-bottom:14px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:6px;"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><span data-editable="sup-conclusion-title">مشاور من باید چیکار کنه؟!</span></h3>
            <div style="font-size:15px; line-height:2; text-align:justify; max-width:900px; margin:0 auto;" data-editable="sup-conclusion">
                <p style="margin-bottom:12px;">قطعاً این ضرب‌المثل شنیدید که میگن ماهی دستش نده، ماهیگیری یادش بده!</p>
                <p style="margin-bottom:12px;">دقیقاً عملکرد یک مشاور خوب هم به همین صورت هست که در ابتدا طبق برنامه و شرایط خاص دانش‌آموز برنامه درسی رو برای دانش‌آموز تنظیم می‌کنه و بعد از پیگیری‌های مستمر در جهت اجرایی کردن برنامه، طرز تهیه و تنظیم یک برنامه دقیق با مدیریت زمان و اولویت‌بندی امور را به دانش‌آموز یاد میده و رفته‌رفته خود شخص توانایی کامل برنامه‌ریزی و کنترل و مدیریت زمان برای رسیدن به اهدافش را بدست میاره، و هر زمان که تمایل داشت می‌تونه با مشاور تماس و از اون مشورت بگیره. یک مشاور خوب به مرور زمان در طی مسیر راه را به دانش‌آموز نشان میده.</p>
                <p style="margin-bottom:12px;">دوستان من! یادتون نره شما باید در تمامی مراحل زندگیتون خودتون تصمیم بگیرید. البته تصمیم‌های مهم و درست، و مشاور خوب صرفاً یک راهنما و روشنگر برای روشن شدن مسیرتون هست که البته نقش بسیار مهمی در رسیدن شما به اهدافتون داره.</p>
                <p style="font-weight:700; color:var(--accent-pink); text-align:center;">پس به امید رسیدن به آرزوهاتون، با مشاوره آنلاین مدرسه آموزش از راه دور اترک همراه باشید.</p>
            </div>
        </section>
    `,

    resources: `
        <section class="glass-card fade-in-up">
            <h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span data-editable="res-main-title">منابع آموزشی</span></h2>
            <p data-editable="res-intro" style="font-size:15px; line-height:2; text-align:justify; margin-bottom:20px;">منابع آموزشی شامل کتاب‌های درسی و غیر درسی، خلاصه درس و نکات، نمونه سوالات، آزمون‌های آنلاین می‌باشد و دانش‌آموز مدرسه اترک، می‌توانند از طریق همین صفحه از آنها استفاده نمایند.</p>
            <div class="grid-2col" style="margin:20px 0;">
                <div style="font-size:14.5px; line-height:2;" data-editable="res-book-types">
                    <p style="margin-bottom:14px;"><strong>کتاب‌های درسی :</strong> به کتاب‌هایی اطلاق می‌شود که بر طبق برنامه درسی خاص و با هدف معینی که از طرف نهادهای ذیصلاح وزارت آموزش و پرورش مصوب و تهیه شده‌اند و در کلاس‌های درس از آنها استفاده می‌شود.</p>
                    <p><strong>کتاب‌های غیردرسی :</strong> به کتاب‌هایی اطلاق می‌شود که برای مهیا کردن زمینه‌ ایجاد انگیزه برای یادگیری، مکمل، جبران آموزش، افزایش سواد علمی و دانش و پرورش مهارت‌های عملی و افزایش یادگیرندگی برطبق برنامه‌های ویژه و هدف‌هایی تهیه و تنظیم شده و الزاما وابسته به برنامه‌های درسی دوره تحصیلی نیستند.</p>
                </div>
                <div class="img-frame-container" id="frame-res-books"><img src="${defaultImages.srvResources}" class="zoom-img" alt="کتاب‌ها و منابع" id="img-res-books" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-res-books')">آپلود عکس دلخواه (مدیریت)</div></div>
            </div>
            <h3 style="color:var(--primary-purple); margin:25px 0 12px; font-weight:800; display:flex; align-items:center; gap:6px;"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg><span data-editable="res-importance-title">کتاب‌های درسی در بخش آموزش، چه اهمیتی دارد؟</span></h3>
            <div style="font-size:14.5px; line-height:1.9; text-align:justify; color:var(--text-muted);" data-editable="res-importance">
                <p style="margin-bottom:12px;">در بخشی از یافته‌های یکی از محققین در رابطه با عوامل مرتبط با محتوای درس‌ها که سبب بی‌توجهی دانش‌آموزان به مطالب درسی می‌شود به این نتیجه رسید که از منظر دانش‌آموزان، انتزاعی بودن محتوای درسها، مشخص نبودن کاربرد و ضرورت و فایده دروس، عدم ارتباط مطالب درسی با اهداف و نیازهای دانش‌آموزان و زیاد بودن مطالب و حجم مفاهیم عنوان شده در درسهای مختلف به ترتیب رتبه‌های اول تا چهارم بی‌توجهی دانش‌آموزان به مطالب درسی را به خود اختصاص می‌دهند. این امر به خوبی وجود مشکلاتی را در سازماندهی و انتخاب محتوای کتاب‌ها نشان می‌دهد. یافته‌های این مطالعه نشان می‌دهد برای اینکه دانش‌آموزان توجه بیشتری به کتاب‌های درسی کنند لازم است مفاهیم و حجم مطالب درسی آنها کاسته و بر طبق نیاز روزمره دانش‌آموزان تهیه شود. کاربرد، ضرورت و فایده هر درس مشخص و محتوای کتاب‌های درسی به گونه‌ای مناسب سازماندهی گردد.</p>
                <p style="margin-bottom:12px;">در وضعیتی که محتواهای کتاب‌های درسی به شکلی خوب سازماندهی شوند و بتواند در مورد مطالب ارائه شده، دانش‌آموزان را به تفکر انتقادی و تحلیلی وادار کند می‌تواند باعث پرورش تفکر خلاق وی شود.</p>
                <p>از طرفی، گاهی موانع و مشکلاتی در طول یادگیری مطالب کتاب‌های درسی برای دانش‌آموزان ایجاد می‌شود. از جمله این مشکلات انتشار کتاب‌هایی با عنوان کتاب‌های کمک آموزشی است. نتایج یک پژوهش بیانگر این مطلب می‌باشد که نقش کتاب‌های کمک آموزشی در نظام تدوین و طراحی برنامه درسی دوره متوسطه بسیار کمرنگ و ضعیف است و آنها نقش گسترش سواد عمومی از قبیل اطلاعات تاریخی و جانبی دانش‌آموزان است. وی با بیان این مطلب که برنامه درسی دوره متوسطه باید زمینه یادگیری فراوانی برای مراجعه به کتاب‌های غیردرسی فراهم کند، به این باور رسیدند که در بیشتر کتاب‌های‌ کمک آموزشی، دانش‌آموز نقش فعالی ندارد و نویسنده کتاب به جای او می‌اندیشد و بر این استدلال کتاب‌های کمک آموزشی به پرورش خلاقیت و تفکر دانش‌آموزان کمکی نمی‌کند.</p>
            </div>
            <a href="http://www.chap.sch.ir/" target="_blank" rel="noopener noreferrer" aria-label="ورود به سایت چاپ وزارت آموزش و پرورش" class="laser-box-wrapper" style="margin-top: 30px;"><div class="laser-box-inner" style="justify-content: center; gap: 12px;"><svg class="topic-icon-svg" style="width:28px; height:28px; margin:0;" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg><span data-editable="res-chap-link">برای دسترسی رایگان به تمامی دروس آموزشی کلیک کنید</span></div></a>
        </section>
    `,
/* =========================================================
   مسیرهای جدید بخش مقاطع
========================================================= */

'maghta': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>مقاطع تحصیلی</h1>

        <p>
            مسیر آموزشی خود را انتخاب کنید و با محتوای اختصاصی هر مقطع آشنا شوید.
        </p>

    </div>


    <div class="maghta-main-grid">

        <!-- متوسطه اول -->
        <article class="maghta-card">

            <div class="maghta-card-image">

                <svg viewBox="0 0 160 160"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <rect x="30" y="92" width="100" height="12" rx="5"
                          stroke="currentColor" stroke-width="5"/>

                    <path d="M40 92L55 48L80 70L105 48L120 92"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>

                    <path d="M55 48L80 35L105 48"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <circle cx="80" cy="28" r="8"
                            stroke="currentColor"
                            stroke-width="5"/>

                </svg>

            </div>


            <h2>متوسطه اول</h2>

            <p>
                شروع یک مسیر تازه در دوره متوسطه؛
                آشنایی با درس‌های اصلی، مهارت‌های مطالعه،
                برنامه‌ریزی و تقویت پایه‌های علمی دانش‌آموز.
            </p>

            <div class="maghta-topics">
                پایه هفتم · پایه هشتم · پایه نهم
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m1')" type="button">
                ورود
            </button>

        </article>


        <!-- متوسطه دوم -->
        <article class="maghta-card">

            <div class="maghta-card-image">

                <svg viewBox="0 0 160 160"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <path d="M35 70L80 43L125 70L80 97L35 70Z"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linejoin="round"/>

                    <path d="M52 80V105C52 118 64 128 80 128C96 128 108 118 108 105V80"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"/>

                    <path d="M125 70V104"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"/>

                    <circle cx="125" cy="111" r="7"
                            stroke="currentColor"
                            stroke-width="5"/>

                </svg>

            </div>


            <h2>متوسطه دوم</h2>

            <p>
                ورود به مرحله‌ای تازه از تحصیل؛
                تقویت پایه‌های علمی، تعمیق آموخته‌ها
                و آماده‌شدن برای مسیر آموزشی آینده.
            </p>

            <div class="maghta-topics">
                پایه دهم · پایه یازدهم · پایه دوازدهم
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m2')" type="button">
                ورود
            </button>

        </article>


        <!-- کاردانش -->
        <article class="maghta-card">

            <div class="maghta-card-image">

                <svg viewBox="0 0 160 160"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <circle cx="80" cy="80" r="43"
                            stroke="currentColor"
                            stroke-width="6"/>

                    <path d="M80 37V23"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"/>

                    <path d="M80 137V123"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"/>

                    <path d="M37 80H23"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"/>

                    <path d="M137 80H123"
                          stroke="currentColor"
                          stroke-width="6"
                          stroke-linecap="round"/>

                    <circle cx="80" cy="80" r="14"
                            stroke="currentColor"
                            stroke-width="6"/>

                </svg>

            </div>


            <h2>کاردانش</h2>

            <p></p>

            <div class="maghta-topics">
                
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-kardanesh')" type="button">
                ورود
            </button>

        </article>

    </div>

</section>
`,


'maghta-m1': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>متوسطه اول</h1>

        <p>
            پایه تحصیلی موردنظر خود را انتخاب کنید.
        </p>

    </div>


    <div class="maghta-grade-grid">

        <article class="maghta-grade-card">

            <div class="maghta-grade-image">

                <svg viewBox="0 0 120 120"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <rect x="25" y="38" width="70" height="50"
                          rx="8"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M38 52H82"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <path d="M38 66H70"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <circle cx="82" cy="74" r="5"
                            fill="currentColor"/>

                </svg>

            </div>

            <h2>پایه هفتم</h2>

            <p>
                شروع دوره متوسطه اول؛
                تقویت پایه‌های درسی، آشنایی با فضای جدید مدرسه
                و شکل‌دادن عادت‌های درست مطالعه.
            </p>

            <div class="maghta-topics">
                قرآن · پیام‌های آسمانی · فارسی · ریاضی · علوم
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m1-p7')" type="button">
                ورود
            </button>

        </article>


        <article class="maghta-grade-card">

            <div class="maghta-grade-image">

                <svg viewBox="0 0 120 120"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <path d="M22 83H98"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <path d="M30 83V47H90V83"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M40 47V37H80V47"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M45 60H75"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <path d="M45 70H67"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                </svg>

            </div>

            <h2>پایه هشتم</h2>

            <p>
                مرحله‌ای برای عمیق‌تر کردن مفاهیم درسی،
                تقویت مهارت‌های یادگیری و آماده‌شدن
                برای سال پایانی متوسطه اول.
            </p>

            <div class="maghta-topics">
                فارسی · ریاضی · علوم · مطالعات اجتماعی · عربی · انگلیسی
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m1-p8')" type="button">
                ورود
            </button>

        </article>


        <article class="maghta-grade-card">

            <div class="maghta-grade-image">

                <svg viewBox="0 0 120 120"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <path d="M20 88H100"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <path d="M30 88V52L60 35L90 52V88"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linejoin="round"/>

                    <path d="M48 88V65H72V88"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <circle cx="60" cy="51" r="6"
                            stroke="currentColor"
                            stroke-width="4"/>

                </svg>

            </div>

            <h2>پایه نهم</h2>

            <p>
                سال پایانی متوسطه اول؛
                تمرکز بر جمع‌بندی آموخته‌ها،
                تقویت توانایی‌های تحصیلی و شناخت مسیر ادامه تحصیل.
            </p>

            <div class="maghta-topics">
                دروس اصلی · جمع‌بندی · شناخت مسیر تحصیلی
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m1-p9')" type="button">
                ورود
            </button>

        </article>

    </div>

</section>
`,


'maghta-m2': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>متوسطه دوم</h1>

        <p>
            پایه تحصیلی موردنظر خود را انتخاب کنید.
        </p>

    </div>


    <div class="maghta-grade-grid">

        <article class="maghta-grade-card">

            <div class="maghta-grade-image">

                <svg viewBox="0 0 120 120"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <path d="M20 82L60 35L100 82"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>

                    <path d="M34 68V92H86V68"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M48 92V74H72V92"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <circle cx="60" cy="51" r="6"
                            stroke="currentColor"
                            stroke-width="4"/>

                </svg>

            </div>

            <h2>پایه دهم</h2>

            <p>
                آغاز متوسطه دوم؛ ساختن پایه‌ای قوی
                برای درس‌های تخصصی و پیدا کردن مسیر آموزشی مناسب.
            </p>

            <div class="maghta-topics">
                دروس پایه · تقویت علمی · شناخت مسیر آموزشی
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m2-p10')" type="button">
                ورود
            </button>

        </article>


        <article class="maghta-grade-card">

            <div class="maghta-grade-image">

                <svg viewBox="0 0 120 120"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <rect x="25" y="30" width="70" height="62"
                          rx="8"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M40 47H80"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <path d="M40 62H80"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                    <path d="M40 77H67"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                </svg>

            </div>

            <h2>پایه یازدهم</h2>

            <p>
                سال تثبیت و تقویت آموخته‌ها؛
                تمرکز بیشتر بر مفاهیم تخصصی
                و آمادگی برای مرحله نهایی تحصیل.
            </p>

            <div class="maghta-topics">
                تعمیق مفاهیم · مهارت حل مسئله · آمادگی تحصیلی
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m2-p11')" type="button">
                ورود
            </button>

        </article>


        <article class="maghta-grade-card">

            <div class="maghta-grade-image">

                <svg viewBox="0 0 120 120"
                     fill="none"
                     xmlns="http://www.w3.org/2000/svg">

                    <path d="M25 78L60 32L95 78"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linejoin="round"/>

                    <path d="M38 78V94H82V78"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M50 94V70H70V94"
                          stroke="currentColor"
                          stroke-width="5"/>

                    <path d="M60 32V20"
                          stroke="currentColor"
                          stroke-width="5"
                          stroke-linecap="round"/>

                </svg>

            </div>

            <h2>پایه دوازدهم</h2>

            <p>
                مرحله پایانی متوسطه؛
                جمع‌بندی دانش، آمادگی برای آینده تحصیلی
                و ورود به مسیر تازه زندگی.
            </p>

            <div class="maghta-topics">
                جمع‌بندی · آمادگی آینده · مسیر تحصیلی
            </div>

            <button
                class="maghta-enter"
                onclick="navigateTo('maghta-m2-p12')" type="button">
                ورود
            </button>

        </article>

    </div>

</section>
`,


'maghta-kardanesh': `
<section class="maghta-page">
    <div class="maghta-page-header">
        <h1 data-editable="kardanesh-page-title">کاردانش و مهارت‌آموزی</h1>
        <p data-editable="kardanesh-page-subtitle">معرفی شاخه مهارتی و فنی</p>
    </div>

    <div class="glass-card">
        <h2 data-editable="kardanesh-intro-title">کاردانش و مهارت‌آموزی</h2>
        <p data-editable="kardanesh-intro-text" style="line-height:2;">
            این بخش برای معرفی مسیرهای مهارتی، فنی و کاربردی کاردانش در مدرسه اترک طراحی شده است.
        </p>
    </div>

    <div class="maghta-main-grid">
        <article class="maghta-card">
            <div class="maghta-card-image"><svg viewBox="0 0 160 160" fill="none"><circle cx="80" cy="80" r="42" stroke="currentColor" stroke-width="6"></circle><path d="M55 80h50M80 55v50" stroke="currentColor" stroke-width="6" stroke-linecap="round"></path></svg></div>
            <h2 data-editable="kardanesh-skill-title">مهارت‌های فنی</h2>
            <p data-editable="kardanesh-skill-text">معرفی مهارت‌های کاربردی و فنی قابل ارائه در این بخش.</p>
        </article>
        <article class="maghta-card">
            <div class="maghta-card-image"><svg viewBox="0 0 160 160" fill="none"><rect x="42" y="35" width="76" height="90" rx="8" stroke="currentColor" stroke-width="6"></rect><path d="M58 58h44M58 80h44M58 102h30" stroke="currentColor" stroke-width="6" stroke-linecap="round"></path></svg></div>
            <h2 data-editable="kardanesh-resource-title">منابع مهارتی</h2>
            <p data-editable="kardanesh-resource-text">این قسمت برای معرفی منابع، فایل‌ها و مطالب مرتبط با مهارت‌آموزی آماده شده است.</p>
        </article>
        <article class="maghta-card">
            <div class="maghta-card-image"><svg viewBox="0 0 160 160" fill="none"><path d="M35 105h90M48 105V65h20v40M72 105V48h20v57M96 105V58h20v47" stroke="currentColor" stroke-width="6" stroke-linejoin="round"></path></svg></div>
            <h2 data-editable="kardanesh-path-title">مسیر مهارت‌آموزی</h2>
            <p data-editable="kardanesh-path-text">توضیح مسیر یادگیری، تمرین و توسعه مهارت‌ها در مدرسه.</p>
        </article>
    </div>
</section>
`,


/* =========================================================
   صفحات اختصاصی پایه‌ها
========================================================= */

'maghta-m1-p7': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>پایه هفتم</h1>

        <p>
            صفحه اختصاصی پایه هفتم در بخش جدید مقاطع.
        </p>

    </div>

    <div class="glass-card">

        <h2>پایه هفتم</h2>

        <p style="line-height:2;">
            این بخش برای ارائه محتوای اختصاصی پایه هفتم
            طراحی شده است و می‌توان در آن درس‌ها،
            منابع، برنامه آموزشی و مطالب ویژه این پایه را قرار داد.
        </p>

    </div>

</section>
`,


'maghta-m1-p8': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>پایه هشتم</h1>

        <p>
            صفحه اختصاصی پایه هشتم در بخش جدید مقاطع.
        </p>

    </div>

    <div class="glass-card">

        <h2>پایه هشتم</h2>

        <p style="line-height:2;">
            این بخش برای ارائه محتوای اختصاصی پایه هشتم
            طراحی شده است و می‌توان در آن درس‌ها،
            منابع، برنامه آموزشی و مطالب ویژه این پایه را قرار داد.
        </p>

    </div>

</section>
`,


'maghta-m1-p9': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>پایه نهم</h1>

        <p>
            صفحه اختصاصی پایه نهم در بخش جدید مقاطع.
        </p>

    </div>

    <div class="glass-card">

        <h2>پایه نهم</h2>

        <p style="line-height:2;">
            این بخش برای ارائه محتوای اختصاصی پایه نهم
            طراحی شده است و می‌توان در آن درس‌ها،
            منابع، برنامه آموزشی و مطالب ویژه این پایه را قرار داد.
        </p>

    </div>

</section>
`,


'maghta-m2-p10': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>پایه دهم</h1>

        <p>
            صفحه اختصاصی پایه دهم در بخش جدید مقاطع.
        </p>

    </div>

    <div class="glass-card">

        <h2>پایه دهم</h2>

        <p style="line-height:2;">
            این بخش برای ارائه محتوای اختصاصی پایه دهم
            طراحی شده است و برای محتوای جدید این بخش
            کاملاً مستقل از سامانه LMS قبلی ساخته شده است.
        </p>

    </div>

</section>
`,


'maghta-m2-p11': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>پایه یازدهم</h1>

        <p>
            صفحه اختصاصی پایه یازدهم در بخش جدید مقاطع.
        </p>

    </div>

    <div class="glass-card">

        <h2>پایه یازدهم</h2>

        <p style="line-height:2;">
            این بخش برای ارائه محتوای اختصاصی پایه یازدهم
            طراحی شده است و در ادامه می‌توان محتوای
            آموزشی ویژه این پایه را به آن اضافه کرد.
        </p>

    </div>

</section>
`,


'maghta-m2-p12': `
<section class="maghta-page">

    <div class="maghta-page-header">

        <h1>پایه دوازدهم</h1>

        <p>
            صفحه اختصاصی پایه دوازدهم در بخش جدید مقاطع.
        </p>

    </div>

    <div class="glass-card">

        <h2>پایه دوازدهم</h2>

        <p style="line-height:2;">
            این بخش برای ارائه محتوای اختصاصی پایه دوازدهم
            طراحی شده است و در ادامه می‌توان محتوای
            آموزشی ویژه این پایه را به آن اضافه کرد.
        </p>

    </div>

</section>
`,
    certificate: `
        <section class="glass-card fade-in-up">
            <h2 class="card-title"><svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"></path></svg><span data-editable="cert-main-title">صدور مدرک رسمی از وزارت آموزش و پرورش</span></h2>
            <p data-editable="cert-desc" style="font-size:16px; line-height:2.1; text-align:justify; font-weight:700; color:var(--primary-purple); margin-bottom:25px;">با تحصیل در مدرسه آموزش از راه دور اترک موفق به اخذ مدرک تحصیلی نظام جدید (دیپلم) و نظام قدیم (دیپلم و پیش دانشگاهی) وزارت آموزش و پرورش شوید.</p>
            <div class="drilldown-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
                <div class="img-frame-container" style="aspect-ratio:16/10;" id="frame-cert-1"><img src="${defaultImages.srvCert}" class="zoom-img" alt="مدرک ۱" id="img-cert-1" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-cert-1')">آپلود نمونه مدرک دیپلم</div></div>
                <div class="img-frame-container" style="aspect-ratio:16/10;" id="frame-cert-2"><img src="${defaultImages.slide1}" class="zoom-img" alt="مدرک ۲" id="img-cert-2" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-cert-2')">آپلود تاییدیه آموزش و پرورش</div></div>
                <div class="img-frame-container" style="aspect-ratio:16/10;" id="frame-cert-3"><img src="${defaultImages.slide2}" class="zoom-img" alt="مدرک ۳" id="img-cert-3" decoding="async" loading="lazy"><div class="img-upload-overlay" onclick="triggerImageUpload('img-cert-3')">آپلود گواهی مهارت و فارغ‌التحصیلی</div></div>
            </div>
            <div style="margin-top:25px; padding:10px 15px; border-radius:10px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); text-align:center;"><span style="font-size:11px; opacity:0.75; letter-spacing:1px;" data-editable="cert-small-atrak">اترک</span></div>
        </section>
    `

};
/* =========================================
   حرکت خودکار تور افقی خدمات
   ========================================= */


/* =========================================================
   جستجوی عمومی سایت
   فقط جستجوی عنوان
   بدون دسترسی به سامانه محتوا
   ========================================================= */

let siteSearchIndex = [];


/* ---------- عناوین صفحات عمومی ---------- */

const publicSearchPages = {

    home: 'صفحه اصلی',

    school: 'مدرسه آموزش از راه دور اترک',

    faq: 'سؤالات متداول',

    services: 'خدمات ما',

    'virtual-edu': 'آموزش مجازی',

    monitoring: 'نظارت مستمر',

    support: 'مشاور من',

    resources: 'منابع آموزشی',

    certificate: 'صدور مدرک',

    'online-school': 'مدرسه آنلاین و آموزش مجازی',

    'distance-history': 'تاریخچه آموزش از راه دور',

    'news-archive': 'آرشیو اخبار',

    maghta: 'مقاطع تحصیلی'



};


/* ---------- صفحات سامانه محتوا
   هر چیزی که اینجا باشد در جستجوی عمومی نمایش داده نمی‌شود ---------- */

const blockedSearchPages = [

    'lms-portal',
    'lms-theory',
    'lms-theory-m1',
    'lms-theory-m2',
    'lms-kardanesh',

    'm1-p7',
    'm1-p8',
    'm1-p9',

    'm2-riazi',
    'm2-tajrobi',
    'm2-ensani',

    'lesson-videos',
    'lesson-video-chapter',

    'content'

];


/* ---------- نرمال‌سازی فارسی ---------- */

function normalizeSearchText(text) {

    return String(text || '')
        .toLowerCase()
        .replace(/ي/g, 'ی')
        .replace(/ى/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/ۀ/g, 'ه')
        .replace(/ة/g, 'ه')
        .replace(/\u200c/g, ' ')
        .replace(/[ًٌٍَُِّْـ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

}


/* ---------- ساخت فهرست جستجو ---------- */

function buildSiteSearchIndex() {

    siteSearchIndex = [];

    /* فقط صفحات عمومی مشخص‌شده */
    Object.keys(publicSearchPages).forEach(function(viewKey) {

        /* اطمینان دوباره از عدم ورود سامانه */
        if (blockedSearchPages.includes(viewKey)) {
            return;
        }

        siteSearchIndex.push({

            key: viewKey,

            title: publicSearchPages[viewKey]

        });

    });

}


/* ---------- باز کردن جستجو ---------- */

function toggleSiteSearch() {

    const box =
        document.getElementById('siteSearchBox');

    const input =
        document.getElementById('siteSearchInput');

    if (!box || !input) return;


    const isOpen =
        box.classList.contains('search-open');


    if (!isOpen) {

        box.classList.add('search-open');

        setTimeout(function() {

            input.focus();

        }, 80);

        return;

    }


    if (input.value.trim()) {

        performSiteSearch(input.value);

    } else {

        closeSiteSearch();

    }

}


/* ---------- بستن جستجو ---------- */

function closeSiteSearch() {

    const box =
        document.getElementById('siteSearchBox');

    const input =
        document.getElementById('siteSearchInput');

    const results =
        document.getElementById('siteSearchResults');


    if (box) {

        box.classList.remove('search-open');

    }


    if (input) {

        input.value = '';

    }


    if (results) {

        results.innerHTML = '';

        results.style.display = 'none';

    }

}


/* ---------- انجام جستجو
   فقط عنوان ---------- */

function performSiteSearch(query) {

    const results =
        document.getElementById('siteSearchResults');

    if (!results) return;


    query = String(query || '').trim();


    if (!query) {

        results.innerHTML = '';

        results.style.display = 'none';

        return;

    }


    /* اگر ایندکس خالی است دوباره بساز */

    if (!siteSearchIndex.length) {

        buildSiteSearchIndex();

    }


    const search =
        normalizeSearchText(query);


    const words =
        search
            .split(' ')
            .filter(function(word) {

                return word.length > 0;

            });


    const matches = siteSearchIndex
        .filter(function(page) {

            /* اطمینان نهایی:
               هیچ صفحه سامانه‌ای اجازه ورود ندارد */

            if (
                blockedSearchPages.includes(page.key)
            ) {

                return false;

            }


            const title =
                normalizeSearchText(page.title);


            /*
               فقط عنوان بررسی می‌شود.
               متن صفحه اصلاً بررسی نمی‌شود.
            */

            if (title.includes(search)) {

                return true;

            }


            /* جستجوی کلمات داخل عنوان */

            return words.some(function(word) {

                return title.includes(word);

            });

        })
        .slice(0, 10);


    results.innerHTML = '';


    /* ---------- بدون نتیجه ---------- */

    if (!matches.length) {

        results.innerHTML = `
            <div class="site-search-empty">
                نتیجه‌ای یافت نشد
            </div>
        `;

        results.style.display = 'block';

        return;

    }


    /* ---------- نمایش عمودی و مینیمال ---------- */

    matches.forEach(function(page) {

        const item =
            document.createElement('button');


        item.type = 'button';

        item.className =
            'site-search-result-item';


        item.innerHTML = `
            <span class="site-search-result-title">
                ${escapeSearchHtml(page.title)}
            </span>
        `;


        item.onclick = function() {

            closeSiteSearch();

            navigateTo(page.key);

        };


        results.appendChild(item);

    });


    results.style.display = 'block';

}


/* ---------- جلوگیری از HTML ناخواسته ---------- */

function escapeSearchHtml(text) {

    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* ---------- بستن نتایج با کلیک بیرون ---------- */

document.addEventListener('click', function(event) {

    const box =
        document.getElementById('siteSearchBox');

    const results =
        document.getElementById('siteSearchResults');


    if (!box || !results) return;


    if (!box.contains(event.target)) {

        results.style.display = 'none';

    }

});


/* ---------- آماده‌سازی ---------- */

setTimeout(function() {

    buildSiteSearchIndex();

}, 500);


/* =========================================================
   سیستم کامل عناصر قابل افزودن توسط مدیریت سایت اترک
   کادر + تصویر + جدول + آیکون + متن
   ========================================================= */
const ATRAK_DYNAMIC_STORAGE_KEY = 'atrak_dynamic_elements_v1';
let atrakDynamicSelectedId = null;
let atrakDynamicDrag = null;
let atrakDynamicResize = null;
let atrakDynamicTableEditing = null;

function getAtrakDynamicElements(){
    try {
        const data = JSON.parse(localStorage.getItem(ATRAK_DYNAMIC_STORAGE_KEY) || '[]');
        return Array.isArray(data) ? data : [];
    } catch(e) { return []; }
}

function saveAtrakDynamicElements(items, sync=true){
    const safe = Array.isArray(items) ? items : [];
    localStorage.setItem(ATRAK_DYNAMIC_STORAGE_KEY, JSON.stringify(safe));
    if(sync && typeof syncStateToCloud === 'function') syncStateToCloud();
}

function getAtrakDynamicView(){
    return (typeof state !== 'undefined' && state.currentView) ? state.currentView : 'home';
}

function createAtrakDynamicId(){
    return 'dyn-' + Date.now() + '-' + Math.random().toString(36).slice(2,9);
}

function escDyn(v){
    return String(v ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function safeDynColor(v, fallback=''){
    const x=String(v||'').trim();
    return /^#[0-9a-fA-F]{6}$/.test(x) || /^#[0-9a-fA-F]{3}$/.test(x) ? x : fallback;
}

function clampDyn(v,min,max){
    const n=Number(v);
    return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : min;
}

function normalizeDynamicItem(item){
    const x={...item};
    x.x=Math.max(0,Number(x.x)||0); x.y=Math.max(0,Number(x.y)||0);
    x.w=Math.max(70,Number(x.w)||240); x.h=Math.max(45,Number(x.h)||120);
    x.opacity=clampDyn(x.opacity==null?1:x.opacity,0.05,1);
    return x;
}

function openDynamicElementMenu(){
    if(!state.isAdmin) return;
    let menu=document.getElementById('atrakDynamicElementMenu');
    if(!menu){
        menu=document.createElement('div'); menu.id='atrakDynamicElementMenu';
        menu.className='atrak-dynamic-menu'; document.body.appendChild(menu);
    }
    menu.innerHTML=`
      <div class="atrak-dynamic-menu-card">
        <button type="button" onclick="closeDynamicElementMenu()" style="float:left;border:0;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:20px;">×</button>
        <h2 style="margin:0;color:var(--primary-purple);">افزودن عنصر به صفحه</h2>
        <p style="color:var(--text-muted);font-size:13px;margin:7px 0 0;">هر عنصر بعد از افزودن قابل جابه‌جایی، تغییر اندازه و ویرایش است.</p>
        <div class="atrak-dynamic-menu-grid">
          <button class="atrak-dynamic-menu-btn" onclick="startDynamicCreate('box')" type="button">▣<br>کادر</button>
          <button class="atrak-dynamic-menu-btn" onclick="startDynamicCreate('image')" type="button">▧<br>تصویر</button>
          <button class="atrak-dynamic-menu-btn" onclick="startDynamicCreate('table')" type="button">▤<br>جدول</button>
          <button class="atrak-dynamic-menu-btn" onclick="startDynamicCreate('icon')" type="button">✦<br>آیکون</button>
          <button class="atrak-dynamic-menu-btn" onclick="startDynamicCreate('text')" type="button">T<br>متن</button>
        </div>
      </div>`;
    menu.style.display='flex';
}
function closeDynamicElementMenu(){const m=document.getElementById('atrakDynamicElementMenu');if(m)m.style.display='none';}
function startDynamicCreate(type){
    closeDynamicElementMenu();
    if(type==='box'||type==='text') return openDynamicForm(type);
    if(type==='image') return openDynamicImageForm();
    if(type==='table') return openDynamicTableForm();
    if(type==='icon') return openDynamicIconPicker();
}

function ensureDynamicLayer(){
    const host=document.getElementById('mainAppContent'); if(!host)return null;
    host.classList.add('atrak-dynamic-host');
    let layer=host.querySelector(':scope > .atrak-dynamic-layer');
    if(!layer){layer=document.createElement('div');layer.className='atrak-dynamic-layer';host.appendChild(layer);}
    return layer;
}

function dynamicDefaultPosition(){
    const host=document.getElementById('mainAppContent');
    const n=getAtrakDynamicElements().filter(x=>x.view===getAtrakDynamicView()).length;
    const hostW=host?.clientWidth||900;
    const w=Math.min(360,Math.max(240,hostW-40));
    const col=Math.min(2,Math.floor(hostW/390));
    return {x:20+(n%Math.max(1,col))*Math.min(380,w+20),y:35+Math.floor(n/Math.max(1,col))*185,w,h:150};
}

function addDynamicElement(item){
    const all=getAtrakDynamicElements(); all.push(normalizeDynamicItem(item));
    saveAtrakDynamicElements(all); renderAtrakDynamicElements();
}
function updateDynamicElement(id,patch,sync=true){
    const all=getAtrakDynamicElements(); const i=all.findIndex(x=>x.id===id); if(i<0)return;
    all[i]=normalizeDynamicItem({...all[i],...patch}); saveAtrakDynamicElements(all,sync); renderAtrakDynamicElements();
}
function removeDynamicElement(id){
    if(!confirm('این عنصر حذف شود؟'))return;
    saveAtrakDynamicElements(getAtrakDynamicElements().filter(x=>x.id!==id));
    atrakDynamicSelectedId=null; renderAtrakDynamicElements();
}
function editDynamicElement(id){
    const item=getAtrakDynamicElements().find(x=>x.id===id); if(!item)return;
    if(item.type==='box'||item.type==='text')return openDynamicForm(item.type,item);
    if(item.type==='image')return openDynamicImageForm(item);
    if(item.type==='table')return openDynamicTableForm(item);
    if(item.type==='icon')return openDynamicIconPicker(item);
}

function openDynamicForm(type,item=null){
    let m=document.getElementById('atrakDynamicFormModal');
    if(!m){m=document.createElement('div');m.id='atrakDynamicFormModal';m.className='atrak-dynamic-menu';document.body.appendChild(m);}
    const title=item?'ویرایش '+(type==='box'?'کادر':'متن'):'افزودن '+(type==='box'?'کادر':'متن');
    m.innerHTML=`<div class="atrak-dynamic-menu-card">
      <button type="button" onclick="closeDynamicFormModal()" style="float:left;border:0;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:20px;">×</button>
      <h2 style="margin:0;color:var(--primary-purple);">${title}</h2>
      <div class="atrak-dynamic-form">
        <label>متن
          <textarea id="dynFormText" placeholder="متن مورد نظر...">${escDyn(item?.text||'')}</textarea>
        </label>
        ${type==='box'?`<label>لینک هنگام کلیک (اختیاری)
          <input aria-label="آدرس لینک عنصر" id="dynFormHref" value="${escDyn(item?.href||'')}" placeholder="آدرس، view:home یا news:شناسه خبر">
        </label>`:''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <label>رنگ متن<input type="color" aria-label="رنگ متن عنصر" id="dynTextColor" value="${safeDynColor(item?.color,'#4a154b')}"></label>
          ${type==='box'?`<label>رنگ پس‌زمینه<input type="color" aria-label="رنگ پس‌زمینه عنصر" id="dynBgColor" value="${safeDynColor(item?.bg,'#ffffff')}"></label>`:''}
        </div>
        <label>شفافیت <input type="range" aria-label="شفافیت عنصر" id="dynOpacity" min="0.05" max="1" step="0.05" value="${item?.opacity??1}"></label>
        <div class="atrak-dynamic-actions">
          <button style="background:#7c3aed;color:#fff;" onclick="saveDynamicForm('${type}','${item?.id||''}')" type="button">ذخیره</button>
          <button style="background:var(--card-hover-bg);color:var(--text-color);" onclick="closeDynamicFormModal()" type="button">انصراف</button>
        </div>
      </div></div>`;
    m.style.display='flex';
}
function closeDynamicFormModal(){const m=document.getElementById('atrakDynamicFormModal');if(m)m.style.display='none';}
function saveDynamicForm(type,id){
    const text=document.getElementById('dynFormText')?.value||'';
    if(!text.trim()){alert('لطفاً متن را وارد کنید.');return;}
    const patch={text,color:document.getElementById('dynTextColor')?.value||'#4a154b',opacity:Number(document.getElementById('dynOpacity')?.value||1)};
    if(type==='box'){patch.href=document.getElementById('dynFormHref')?.value.trim()||'';patch.bg=document.getElementById('dynBgColor')?.value||'#ffffff';}
    if(id)updateDynamicElement(id,patch); else {const p=dynamicDefaultPosition();addDynamicElement({id:createAtrakDynamicId(),view:getAtrakDynamicView(),type,...p,...patch});}
    closeDynamicFormModal();
}

function openDynamicImageForm(item=null){
    let m=document.getElementById('atrakDynamicImageModal');
    if(!m){m=document.createElement('div');m.id='atrakDynamicImageModal';m.className='atrak-dynamic-menu';document.body.appendChild(m);}
    m.innerHTML=`<div class="atrak-dynamic-menu-card">
      <button type="button" onclick="closeDynamicImageModal()" style="float:left;border:0;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:20px;">×</button>
      <h2 style="margin:0;color:var(--primary-purple);">${item?'ویرایش تصویر':'افزودن تصویر'}</h2>
      <div class="atrak-dynamic-form">
        <label>انتخاب تصویر از دستگاه <input type="file" aria-label="انتخاب تصویر عنصر" id="dynImageFile" accept="image/*"></label>
        <label>یا آدرس تصویر <input aria-label="آدرس تصویر عنصر" id="dynImageUrl" value="${escDyn(item?.image||'')}" placeholder="https://..."></label>
        <label>لینک هنگام کلیک (اختیاری) <input aria-label="لینک تصویر عنصر" id="dynImageHref" value="${escDyn(item?.href||'')}" placeholder="آدرس یا view:home"></label>
        <label>شفافیت <input aria-label="شفافیت تصویر عنصر" type="range" id="dynImageOpacity" min="0.05" max="1" step="0.05" value="${item?.opacity??1}"></label>
        <div class="atrak-dynamic-actions"><button style="background:#7c3aed;color:#fff;" onclick="saveDynamicImage('${item?.id||''}')" type="button">ذخیره تصویر</button><button style="background:var(--card-hover-bg);color:var(--text-color);" onclick="closeDynamicImageModal()" type="button">انصراف</button></div>
      </div></div>`;
    m.style.display='flex';
}
function closeDynamicImageModal(){const m=document.getElementById('atrakDynamicImageModal');if(m)m.style.display='none';}
function compressDynamicImage(file,cb){
    const r=new FileReader();
    r.onload=e=>{const img=new Image();img.onload=()=>{const max=1600,scale=Math.min(1,max/img.width);const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.88));};img.src=e.target.result;};
    r.onerror=()=>cb(''); r.readAsDataURL(file);
}
function saveDynamicImage(id){
    const file=document.getElementById('dynImageFile')?.files?.[0];
    const url=document.getElementById('dynImageUrl')?.value.trim()||'';
    const href=document.getElementById('dynImageHref')?.value.trim()||'';
    const opacity=Number(document.getElementById('dynImageOpacity')?.value||1);
    const finish=image=>{
        if(!image){alert('لطفاً تصویر را انتخاب کنید یا آدرس تصویر بدهید.');return;}
        if(id)updateDynamicElement(id,{image,href,opacity});
        else {const p=dynamicDefaultPosition();addDynamicElement({id:createAtrakDynamicId(),view:getAtrakDynamicView(),type:'image',image,href,...p,w:Math.min(380,p.w),h:230,opacity});}
        closeDynamicImageModal();
    };
    if(file)compressDynamicImage(file,finish);else finish(url);
}

function openDynamicTableForm(item=null){
    let m=document.getElementById('atrakDynamicTableModal');
    if(!m){m=document.createElement('div');m.id='atrakDynamicTableModal';m.className='atrak-dynamic-menu';document.body.appendChild(m);}
    m._editingItem=item||null;
    const rows=item?.rows||3,cols=item?.cols||3;
    m.innerHTML=`<div class="atrak-dynamic-menu-card" style="width:min(1100px,97vw);">
      <button type="button" onclick="closeDynamicTableModal()" style="float:left;border:0;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:20px;">×</button>
      <h2 style="margin:0;color:var(--primary-purple);">${item?'ویرایش جدول':'افزودن جدول'}</h2>
      <p style="font-size:12px;color:var(--text-muted);">متن، رنگ، شفافیت و اندازه هر سلول را جداگانه تنظیم کن.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <label>تعداد ردیف<input aria-label="تعداد ردیف‌های جدول" type="number" id="dynRows" min="1" max="100" value="${rows}"></label>
        <label>تعداد ستون<input aria-label="تعداد ستون‌های جدول" type="number" id="dynCols" min="1" max="50" value="${cols}"></label>
      </div>
      <div id="dynTableEditor"></div>
      <div class="atrak-dynamic-actions"><button style="background:#7c3aed;color:#fff;" onclick="saveDynamicTable('${item?.id||''}')" type="button">ذخیره جدول</button><button style="background:var(--card-hover-bg);color:var(--text-color);" onclick="closeDynamicTableModal()" type="button">انصراف</button></div>
    </div>`;
    m.style.display='flex';
    document.getElementById('dynRows').oninput=buildDynamicTableEditor;
    document.getElementById('dynCols').oninput=buildDynamicTableEditor;
    buildDynamicTableEditor();
}
function closeDynamicTableModal(){const m=document.getElementById('atrakDynamicTableModal');if(m)m.style.display='none';}
function buildDynamicTableEditor(){
    const wrap=document.getElementById('dynTableEditor');if(!wrap)return;
    const r=clampDyn(document.getElementById('dynRows')?.value,1,100),c=clampDyn(document.getElementById('dynCols')?.value,1,50);
    const m=document.getElementById('atrakDynamicTableModal');const item=m?m._editingItem:null;const old=item?.cells||[];
    const rowHeights=item?.rowHeights||[],colWidths=item?.colWidths||[];
    let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;"><label>عرض ستون‌ها (پیکسل، با ویرگول)<input id="dynColWidths" aria-label="عرض ستون‌های جدول" value="'+escDyn(colWidths.join(','))+'" placeholder="120,180,120"></label><label>ارتفاع ردیف‌ها (پیکسل، با ویرگول)<input id="dynRowHeights" aria-label="ارتفاع ردیف‌های جدول" value="'+escDyn(rowHeights.join(','))+'" placeholder="55,70,55"></label></div>';
    html+='<div class="atrak-table-editor-grid" style="grid-template-columns:repeat('+c+',minmax(155px,1fr));">';
    for(let i=0;i<r*c;i++){
        const cell=old[i]||{};
        html+=`<div class="atrak-table-editor-card" data-cell-index="${i}">
          <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">سلول ${i+1}</div>
          <textarea class="atrak-table-editor-cell" data-cell-index="${i}" placeholder="متن سلول" aria-label="متن سلول">${escDyn(cell.text||'')}</textarea>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:5px;">
            <label style="font-size:10px;">متن<input type="color" class="dyn-cell-color" aria-label="رنگ متن سلول جدول" value="${safeDynColor(cell.color,'#4a154b')}"></label>
            <label style="font-size:10px;">زمینه<input type="color" class="dyn-cell-bg" aria-label="رنگ پس‌زمینه سلول جدول" value="${safeDynColor(cell.bg,'#ffffff')}"></label>
            <label style="font-size:10px;">شفافیت<input aria-label="شفافیت سلول" type="range" class="dyn-cell-opacity" min="0.05" max="1" step="0.05" value="${cell.opacity??1}"></label>
          </div>
        </div>`;
    }
    wrap.innerHTML=html+'</div>';
}

function saveDynamicTable(id){
    const r=clampDyn(document.getElementById('dynRows')?.value,1,100),c=clampDyn(document.getElementById('dynCols')?.value,1,50);
    const cells=[...document.querySelectorAll('#dynTableEditor .atrak-table-editor-card')].map(card=>({
        text:card.querySelector('.atrak-table-editor-cell')?.value||'',
        color:card.querySelector('.dyn-cell-color')?.value||'#4a154b',
        bg:card.querySelector('.dyn-cell-bg')?.value||'#ffffff',
        opacity:Number(card.querySelector('.dyn-cell-opacity')?.value||1)
    }));
    const colWidths=(document.getElementById('dynColWidths')?.value||'').split(',').map(v=>Math.max(50,Number(v.trim())||0)).filter(v=>v>0).slice(0,c);
    const rowHeights=(document.getElementById('dynRowHeights')?.value||'').split(',').map(v=>Math.max(35,Number(v.trim())||0)).filter(v=>v>0).slice(0,r);
    if(id)updateDynamicElement(id,{rows:r,cols:c,cells,colWidths,rowHeights});
    else {const p=dynamicDefaultPosition();addDynamicElement({id:createAtrakDynamicId(),view:getAtrakDynamicView(),type:'table',rows:r,cols:c,cells,colWidths,rowHeights,...p,w:Math.min(700,Math.max(360,p.w+220)),h:260});}
    closeDynamicTableModal();
}

function openDynamicIconPicker(item=null){
    let m=document.getElementById('atrakDynamicIconModal');
    if(!m){m=document.createElement('div');m.id='atrakDynamicIconModal';m.className='atrak-dynamic-menu';document.body.appendChild(m);}
    m._editingItem=item||null;
    m.innerHTML=`<div class="atrak-dynamic-menu-card" style="width:min(850px,97vw);">
      <button type="button" onclick="closeDynamicIconModal()" style="float:left;border:0;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:20px;">×</button>
      <h2 style="margin:0;color:var(--primary-purple);">انتخاب آیکون از ۱۰۰ آیکون</h2>
      <p style="color:var(--text-muted);font-size:13px;">هر آیکون رنگ مستقل خودش را دارد و تغییر یک آیکون روی بقیه اثر نمی‌گذارد.</p>
      <div class="atrak-icon-picker-grid">${iconLibrary100.map((x,i)=>`<button class="atrak-icon-picker-cell" type="button" onclick="selectDynamicIcon(${i})"><svg viewBox="0 0 24 24">${x}</svg></button>`).join('')}</div>
    </div>`;
    m.style.display='flex';
}
function closeDynamicIconModal(){const m=document.getElementById('atrakDynamicIconModal');if(m)m.style.display='none';}
function selectDynamicIcon(index){
    const m=document.getElementById('atrakDynamicIconModal');const item=m?m._editingItem:null;
    if(item)updateDynamicElement(item.id,{iconIndex:Number(index)});
    else {const p=dynamicDefaultPosition();addDynamicElement({id:createAtrakDynamicId(),view:getAtrakDynamicView(),type:'icon',iconIndex:Number(index),...p,w:120,h:120,color:'#ec4899'});}
    closeDynamicIconModal();
}
function changeDynamicIconColor(id){
    const item=getAtrakDynamicElements().find(x=>x.id===id);if(!item)return;
    const m=document.createElement('div');m.className='atrak-dynamic-menu';m.style.display='flex';
    m.innerHTML=`<div class="atrak-dynamic-menu-card" style="max-width:360px;"><h3 style="margin-top:0;">رنگ آیکون</h3><input aria-label="رنگ آیکون عنصر" id="oneDynamicIconColor" type="color" value="${safeDynColor(item.color,'#ec4899')}" style="width:100%;height:55px;"><div class="atrak-dynamic-actions"><button style="background:#7c3aed;color:#fff;" id="saveOneDynamicIconColor" type="button">ذخیره</button><button style="background:var(--card-hover-bg);color:var(--text-color);" id="cancelOneDynamicIconColor" type="button">انصراف</button></div></div>`;
    document.body.appendChild(m);
    m.querySelector('#saveOneDynamicIconColor').onclick=()=>{updateDynamicElement(id,{color:m.querySelector('#oneDynamicIconColor').value});m.remove();};
    m.querySelector('#cancelOneDynamicIconColor').onclick=()=>m.remove();
}

function renderDynamicTableHTML(item){
    const rows=Math.max(1,Number(item.rows)||1),cols=Math.max(1,Number(item.cols)||1),cells=item.cells||[];
    let html='<div class="atrak-drag-surface atrak-dynamic-table-wrap"><table class="atrak-dynamic-table"><tbody>';
    for(let r=0;r<rows;r++){
        html+='<tr>';
        for(let c=0;c<cols;c++){
            const cell=cells[r*cols+c]||{};
            const bg=safeDynColor(cell.bg,'');const color=safeDynColor(cell.color,'');const op=clampDyn(cell.opacity==null?1:cell.opacity,.05,1);
            const cw=Number((item.colWidths||[])[c])||0; const rh=Number((item.rowHeights||[])[r])||0;
            html+=`<td style="${cw?'width:'+cw+'px;':''}${rh?'height:'+rh+'px;':''}${bg?'background:'+bg+';':''}${color?'color:'+color+';':''}opacity:${op};">${escDyn(cell.text||'')}</td>`;
        }
        html+='</tr>';
    }
    return html+'</tbody></table></div>';
}

function dynamicNavigate(href){
    const x=String(href||'').trim();if(!x)return false;
    if(x.indexOf('news:')===0 && typeof openAtrakNews==='function'){openAtrakNews(x.slice(5));return true;}
    if(x.indexOf('view:')===0 && typeof navigateTo==='function'){navigateTo(x.slice(5));return true;}
    return false;
}

function renderAtrakDynamicElements(){
    const layer=ensureDynamicLayer();if(!layer)return;
    layer.innerHTML='';
    const view=getAtrakDynamicView();
    const items=getAtrakDynamicElements().filter(x=>x.view===view);
    const host=document.getElementById('mainAppContent');
    let maxBottom=Math.max(500,host?.clientHeight||500);
    items.forEach(raw=>{
        const item=normalizeDynamicItem(raw);
        const el=document.createElement('div');
        el.className='atrak-dynamic-item'+(item.id===atrakDynamicSelectedId?' admin-selected':'');el.dataset.id=item.id;
        el.style.left=item.x+'px';el.style.top=item.y+'px';el.style.width=item.w+'px';el.style.height=item.h+'px';el.style.zIndex=String(item.z||40);el.style.opacity=item.opacity;
        let inner='';
        if(item.type==='box')inner=`<div class="atrak-drag-surface atrak-dynamic-box" style="${safeDynColor(item.bg)?'background:'+safeDynColor(item.bg)+';':''}${safeDynColor(item.color)?'color:'+safeDynColor(item.color)+';':''}">${escDyn(item.text||'')}</div>`;
        if(item.type==='text')inner=`<div class="atrak-drag-surface atrak-dynamic-text" style="${safeDynColor(item.color)?'color:'+safeDynColor(item.color)+';':''}">${escDyn(item.text||'')}</div>`;
        if(item.type==='image')inner=`<div class="atrak-drag-surface atrak-dynamic-image-wrap"><img class="atrak-dynamic-image" src="${escDyn(item.image||'')}" alt="" onerror="this.style.opacity='.25'" decoding="async" loading="lazy"></div>`;
        if(item.type==='icon')inner=`<div class="atrak-drag-surface atrak-dynamic-icon" style="color:${safeDynColor(item.color,'#ec4899')};"><svg viewBox="0 0 24 24">${iconLibrary100[Number(item.iconIndex)||0]||iconLibrary100[0]}</svg></div>`;
        if(item.type==='table')inner=renderDynamicTableHTML(item);
        el.innerHTML=inner+`<div class="atrak-dynamic-toolbar"><button type="button" data-action="edit">ویرایش</button><button type="button" data-action="delete">حذف</button>${item.type==='icon'?'<button type="button" data-action="color">رنگ</button>':''}</div><span class="atrak-resize-handle"></span>`;
        const surface=el.querySelector('.atrak-drag-surface');
        if(item.href){
            const a=document.createElement('a');a.className='atrak-dynamic-link';a.href=item.href;a.target='_blank';a.rel='noopener';
            a.addEventListener('click',ev=>{if(state.isAdmin){ev.preventDefault();selectDynamicItem(item.id);}else if(dynamicNavigate(item.href))ev.preventDefault();});
            if(surface){surface.replaceWith(a);a.appendChild(surface);}
        }
        el.addEventListener('pointerdown',e=>beginDynamicDrag(e,item.id));
        el.addEventListener('click',e=>{if(state.isAdmin){e.stopPropagation();selectDynamicItem(item.id);}});
        el.querySelector('[data-action="edit"]')?.addEventListener('click',e=>{e.stopPropagation();editDynamicElement(item.id);});
        el.querySelector('[data-action="delete"]')?.addEventListener('click',e=>{e.stopPropagation();removeDynamicElement(item.id);});
        el.querySelector('[data-action="color"]')?.addEventListener('click',e=>{e.stopPropagation();changeDynamicIconColor(item.id);});
        el.querySelector('.atrak-resize-handle')?.addEventListener('pointerdown',e=>beginDynamicResize(e,item.id));
        el.querySelectorAll('button').forEach(b=>b.addEventListener('pointerdown',e=>e.stopPropagation()));
        layer.appendChild(el);
        maxBottom=Math.max(maxBottom,item.y+item.h+50);
    });
    layer.style.minHeight=maxBottom+'px';
}

function selectDynamicItem(id){atrakDynamicSelectedId=id;renderAtrakDynamicElements();}
function beginDynamicDrag(e,id){
    if(!state.isAdmin||e.button!==0||e.target.closest('button')||e.target.classList.contains('atrak-resize-handle'))return;
    const item=getAtrakDynamicElements().find(x=>x.id===id);if(!item)return;
    atrakDynamicSelectedId=id;atrakDynamicDrag={id,startX:e.clientX,startY:e.clientY,x:Number(item.x)||0,y:Number(item.y)||0};
    document.addEventListener('pointermove',moveDynamicDrag);document.addEventListener('pointerup',endDynamicDrag,{once:true});
}
function moveDynamicDrag(e){
    if(!atrakDynamicDrag)return;
    const dx=e.clientX-atrakDynamicDrag.startX,dy=e.clientY-atrakDynamicDrag.startY;
    const all=getAtrakDynamicElements(),i=all.findIndex(x=>x.id===atrakDynamicDrag.id);if(i<0)return;
    all[i]={...all[i],x:Math.max(0,Math.round(atrakDynamicDrag.x+dx)),y:Math.max(0,Math.round(atrakDynamicDrag.y+dy))};
    localStorage.setItem(ATRAK_DYNAMIC_STORAGE_KEY,JSON.stringify(all));renderAtrakDynamicElements();
}
function endDynamicDrag(){if(atrakDynamicDrag)saveAtrakDynamicElements(getAtrakDynamicElements());atrakDynamicDrag=null;document.removeEventListener('pointermove',moveDynamicDrag);}
function beginDynamicResize(e,id){
    if(!state.isAdmin)return;e.preventDefault();e.stopPropagation();
    const item=getAtrakDynamicElements().find(x=>x.id===id);if(!item)return;
    atrakDynamicSelectedId=id;atrakDynamicResize={id,startX:e.clientX,startY:e.clientY,w:Number(item.w)||200,h:Number(item.h)||120};
    document.addEventListener('pointermove',moveDynamicResize);document.addEventListener('pointerup',endDynamicResize,{once:true});
}
function moveDynamicResize(e){
    if(!atrakDynamicResize)return;
    const all=getAtrakDynamicElements(),i=all.findIndex(x=>x.id===atrakDynamicResize.id);if(i<0)return;
    all[i]={...all[i],w:Math.max(70,Math.round(atrakDynamicResize.w+e.clientX-atrakDynamicResize.startX)),h:Math.max(45,Math.round(atrakDynamicResize.h+e.clientY-atrakDynamicResize.startY))};
    localStorage.setItem(ATRAK_DYNAMIC_STORAGE_KEY,JSON.stringify(all));renderAtrakDynamicElements();
}
function endDynamicResize(){if(atrakDynamicResize)saveAtrakDynamicElements(getAtrakDynamicElements());atrakDynamicResize=null;document.removeEventListener('pointermove',moveDynamicResize);}

let atrakDynamicResizeRenderTimer = null;
window.addEventListener('resize', function(){
    clearTimeout(atrakDynamicResizeRenderTimer);
    atrakDynamicResizeRenderTimer = setTimeout(function(){
        renderAtrakDynamicElements();
    }, 120);
});

document.addEventListener('dblclick',function(e){
    if(!state.isAdmin)return;
    const cell=e.target.closest('.atrak-dynamic-table td');if(!cell)return;
    const wrapper=e.target.closest('.atrak-dynamic-item');const id=wrapper?.dataset.id;if(!id)return;
    const item=getAtrakDynamicElements().find(x=>x.id===id);if(!item)return;
    const index=[...wrapper.querySelectorAll('td')].indexOf(cell);if(index<0)return;
    const value=prompt('متن این سلول:',item.cells?.[index]?.text||'');
    if(value!==null){const cells=[...(item.cells||[])];cells[index]={...(cells[index]||{}),text:value};updateDynamicElement(id,{cells});}
});

document.addEventListener('click',function(e){
    if(!state.isAdmin)return;
    if(e.target.closest('.atrak-dynamic-item')||e.target.closest('#atrakDynamicElementMenu')||e.target.closest('#atrakDynamicFormModal')||e.target.closest('#atrakDynamicImageModal')||e.target.closest('#atrakDynamicTableModal')||e.target.closest('#atrakDynamicIconModal'))return;
    atrakDynamicSelectedId=null;document.querySelectorAll('.atrak-dynamic-item.admin-selected').forEach(x=>x.classList.remove('admin-selected'));
});

        window.addEventListener('DOMContentLoaded', async () => {
            // ابتدا نسخه محلی برای نمایش سریع سایت اجرا می‌شود.
            applyTheme(state.theme);
            renderCurrentView();
            loadSavedEdits();
            loadSavedImages();
            restoreIcons();
            initCarousel();
            generate100IconsList();
            renderAtrakDynamicElements();

            // سپس Cloud به عنوان منبع اصلی داده‌های مشترک بارگذاری می‌شود.
            await loadStateFromCloud();

            // تمام داده‌های دریافت‌شده از Cloud دوباره روی DOM اعمال می‌شوند.
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
                try { renderAtrakNews(); } catch (e) { console.warn('بازسازی اخبار انجام نشد:', e); }
            }

            // اتصال لحظه‌ای برای تمام کاربران سایت
            startAtrakRealtime();
        });

        window.addEventListener('beforeunload', () => {
            saveAllEdits(false, false);
        });

        function toggleTheme() {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('atrak_theme', state.theme);
            applyTheme(state.theme);
            if (state.isAdmin === true) {
                syncStateToCloud();
            }
        }

        function applyTheme(theme) {

    /* اعمال تم روی کل سایت */
    document.body.setAttribute('data-theme', theme);


    /* =====================================================
       آیکون تغییر تم داخل هدر اصلی
       ===================================================== */

    const iconSvg = document.getElementById('themeIconSvg');

    /* =====================================================
       آیکون تغییر تم داخل نوار شفاف
       ===================================================== */

    const compactIconSvg =
        document.getElementById('compactThemeIconSvg');


    /* =====================================================
       اگر حالت روشن باشد
       ===================================================== */

    if (theme === 'light') {

        const sunIcon = `
            <circle cx="12" cy="12" r="5"></circle>

            <line x1="12" y1="1"
                  x2="12" y2="3"></line>

            <line x1="12" y1="21"
                  x2="12" y2="23"></line>

            <line x1="4.22" y1="4.22"
                  x2="5.64" y2="5.64"></line>

            <line x1="18.36" y1="18.36"
                  x2="19.78" y2="19.78"></line>

            <line x1="1" y1="12"
                  x2="3" y2="12"></line>

            <line x1="21" y1="12"
                  x2="23" y2="12"></line>

            <line x1="4.22" y1="19.78"
                  x2="5.64" y2="18.36"></line>

            <line x1="18.36" y1="5.64"
                  x2="19.78" y2="4.22"></line>
        `;

        if (iconSvg) {
            iconSvg.innerHTML = sunIcon;
        }

        if (compactIconSvg) {
            compactIconSvg.innerHTML = sunIcon;
        }

    }

    /* =====================================================
       اگر حالت تاریک باشد
       ===================================================== */

    else {

        const moonIcon = `
            <path
                d="M21 12.79A9 9 0 1 1
                   11.21 3
                   7 7 0 0 0
                   21 12.79z">
            </path>
        `;

        if (iconSvg) {
            iconSvg.innerHTML = moonIcon;
        }

        if (compactIconSvg) {
            compactIconSvg.innerHTML = moonIcon;
        }
    }
}
/* =========================================================
   فهرست مطالب خودکار صفحات
========================================================= */

function generatePageTableOfContents() {

    const container = document.getElementById('mainAppContent');
    if (!container) return;

    /*
     * صفحاتی که نباید فهرست مطالب داشته باشند
     */
    const viewKey = state.currentView;

    const excludedViews = [

        // صفحه اصلی
        'home',

        // سامانه محتوا
        'lms-portal',
        'lms-theory',
        'lms-theory-m1',
        'lms-theory-m2',
        'lms-kardanesh',

        // انتخاب پایه‌های سامانه محتوا
        'm1-p7',
        'm1-p8',
        'm1-p9',

        // رشته‌های متوسطه دوم
        'm2-riazi',
        'm2-tajrobi',
        'm2-ensani',

        // صفحات پایه‌های متوسطه دوم
        'm2-p10-riazi',
        'm2-p11-riazi',
        'm2-p12-riazi',

        'm2-p10-tajrobi',
        'm2-p11-tajrobi',
        'm2-p12-tajrobi',

        'm2-p10-ensani',
        'm2-p11-ensani',
        'm2-p12-ensani',

        // صفحه محتوای درس
        'content',
        'questions'
    ];


    /*
     * اگر صفحه مربوط به سامانه محتوا یا یکی از
     * صفحات دروس باشد، اصلاً فهرست مطالب نساز
     */
    if (excludedViews.includes(viewKey)) {
        return;
    }


    /*
     * هر صفحه‌ای که با lms- شروع شود،
     * مربوط به سامانه محتوا محسوب می‌شود.
     */
    if (viewKey.startsWith('lms-')) {
        return;
    }


    /*
     * صفحات درس‌های متوسطه اول
     * مثل:
     * m1-p7-lesson1
     * m1-p8-lesson3
     * m1-p9-lesson8
     */
    if (/^m1-p[789]-lesson\d+/.test(viewKey)) {
        return;
    }


    /*
     * صفحات رشته و پایه‌های متوسطه دوم
     */
    if (/^m2-/.test(viewKey)) {
        return;
    }


    /*
     * اگر قبلاً فهرست مطالب ساخته شده بود،
     * قبل از ساخت مجدد حذفش کن.
     */
    const oldToc = container.querySelector('.atrak-table-of-contents');

    if (oldToc) {
        oldToc.remove();
    }


    const headings = Array.from(
    container.querySelectorAll('h2, h3, h4')
).filter(function (heading) {

    /* حذف عنوان‌های ۶ کارت کپی‌شده انتهای صفحه خدمات ما */
    if (
        heading.classList.contains('service-card-title') &&
        heading.closest('.services-my-page')
    ) {
        return false;
    }

    /* حذف عنوان «خدمات و بخش‌های اصلی مدرسه» */
    if (
        heading.classList.contains('services-my-cards-title') &&
        heading.closest('.services-my-page')
    ) {
        return false;
    }

    return true;
});


    /*
     * عنوان‌های خالی را حذف کن
     */
    const validHeadings = headings.filter(function (heading) {

        return heading.textContent.trim() !== '';

    });


    /*
     * اگر کمتر از دو عنوان وجود داشت،
     * فهرست مطالب ساخته نشود.
     */
    if (validHeadings.length < 2) {
        return;
    }


    /*
     * برای هر عنوان یک ID اختصاص بده
     */
    validHeadings.forEach(function (heading, index) {

        heading.id = 'atrak-toc-heading-' + index;

    });


    /*
     * ساخت فهرست مطالب
     */
    const toc = document.createElement('aside');

    toc.className = 'atrak-table-of-contents';


    toc.innerHTML = `
        <div class="atrak-toc-header">
            <span class="atrak-toc-icon">☰</span>
            <span>فهرست مطالب</span>
        </div>

        <div class="atrak-toc-list"></div>
    `;


    const list = toc.querySelector('.atrak-toc-list');


    /*
     * ساخت آیتم‌های فهرست
     */
    validHeadings.forEach(function (heading) {

        const item = document.createElement('button');

        item.type = 'button';

        item.className = 'atrak-toc-item';

        item.textContent = heading.textContent.trim();


        item.addEventListener('click', function () {

            heading.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        });


        list.appendChild(item);

    });


    /*
     * فهرست مطالب در ابتدای مطلب قرار می‌گیرد
     */
    container.insertBefore(
        toc,
        container.firstChild
    );
}

   function renderCurrentView() {

    const container =
        document.getElementById(
            'mainAppContent'
        );

    if (!container) {
        return;
    }


    /*
     * ابتدا محتوای صفحه را می‌سازیم
     */
    container.innerHTML =
        views[state.currentView] ||
        views.home;

    /* نظرات: این کادر مستقیماً هنگام ساخت هر صفحه ساخته می‌شود؛ صفحه اصلی مستثنی است. */
    if (state.currentView !== 'home') {
        const commentsShell = document.createElement('section');
        commentsShell.id = 'atrak-comments-root';
        commentsShell.setAttribute('data-page-key', String(state.currentView || 'unknown-page'));
        commentsShell.innerHTML = `
            <div class="atrak-comments-card">
                <h2 class="atrak-comments-title">نظرات این بخش</h2>
                <p class="atrak-comments-subtitle">نظر خود را درباره این بخش بنویسید. پس از تأیید مدیریت، برای همه نمایش داده می‌شود.</p>
                <form aria-label="فرم ثبت نظر" class="atrak-comment-form" id="atrak-comment-form">
                    <textarea aria-label="متن نظر" id="atrak-comment-input" class="atrak-comment-input" maxlength="2000" placeholder="نظر خود را بنویسید..."></textarea>
                    <button type="submit" class="atrak-comment-submit">ثبت نظر</button>
                    <div class="atrak-comment-status" id="atrak-comment-status">در حال آماده‌سازی نظرات...</div><div class="atrak-comment-note">نام شما: <strong id="atrak-comment-author">ناشناس</strong></div>
                </form>
                <div class="atrak-comment-list" id="atrak-approved-list">
                    <div class="atrak-empty">در حال آماده‌سازی نظرات...</div>
                </div>
                <div class="atrak-admin-comments" id="atrak-admin-comments" hidden>
                    <h3>مدیریت نظرات این بخش</h3>
                    <p class="atrak-comments-note">نظرات جدید ابتدا اینجا بررسی می‌شوند.</p>
                    <div class="atrak-comment-list" id="atrak-pending-list"></div>
                </div>
            </div>`;
        container.appendChild(commentsShell);
    }


    /*
     * امکانات عمومی صفحه
     */
    generatePageTableOfContents();

    updateBreadcrumbs();

    updateNavHistoryButtons();

    enableAdminEditableFields();


    if (!state.isAdmin) {
        disableAdminEditableFields();
    }


    /*
     * بعد از ساخته شدن کامل HTML صفحه،
     * سیستم اخبار را اجرا می‌کنیم.
     */
    setTimeout(function() {

        loadSavedImages();

        loadSavedEdits();

        restoreIcons();


        /*
         * ساخت کارت‌های اخبار
         */
        if (
            document.getElementById(
                'atrakNewsTrack'
            )
        ) {

            renderAtrakNews();

            initAtrakNewsTouch();

            updateAtrakNewsAdminButton();

        }
        /*
 * ساخت آرشیو اخبار
 */
if (
    document.getElementById(
        'atrakNewsArchiveContainer'
    )
) {

    renderAtrakNewsArchive();

}
/*
 * ساخت صفحه اختصاصی خبر
 */
if (
    document.getElementById(
        'atrakNewsDetailContainer'
    )
) {

    renderAtrakNewsDetail();

}

        renderAtrakDynamicElements()
     if (
    document.getElementById(
        'atrakHonorsHomeGrid'
    )
) {
    renderAtrakHonors(
        'atrakHonorsHomeGrid'
    );
}


if (
    document.getElementById(
        'atrakHonorsPageGrid'
    )
) {
    renderAtrakHonors(
        'atrakHonorsPageGrid'
    );
}
const honorsAddButton =
    document.getElementById(
        'atrakHonorsAddButton'
    );

if (honorsAddButton) {
    honorsAddButton.style.display =
        state.isAdmin ? 'inline-flex' : 'none';
}
    }, 100);
    

}
const honorsAddButton =
    document.getElementById('atrakHonorsAddButton');

if (honorsAddButton) {
    honorsAddButton.style.display =
        state.isAdmin ? 'inline-block' : 'none';
}
function restoreIcons() {
    const savedIcons = localStorage.getItem('atrak_saved_icons');
    let icons = {};
    if (savedIcons) {
        try { icons = JSON.parse(savedIcons) || {}; } catch (e) { icons = {}; }
    }

    document.querySelectorAll('.topic-icon-svg').forEach(svg => {
        const key = getIconStorageKey(svg);
        const savedIcon = icons[key] || icons[getLegacyIconStorageKey(svg)];
        if (!key) return;

        // اگه توی localStorage ذخیره شده که این آیکون مخفیه، مخفیش کن
        if (savedIcon && savedIcon.hidden === true && svg.dataset.videoIcon !== 'true') {
            svg.style.display = 'none';
            svg.setAttribute('data-icon-hidden', 'true');
        } else {
            // اگه مخفی نبود، نمایش بده
            svg.style.display = '';
            svg.removeAttribute('data-icon-hidden');
        }

        if (savedIcon && savedIcon.html && svg.dataset.videoIcon !== 'true') {
            svg.innerHTML = savedIcon.html;
        }
        if (savedIcon && savedIcon.color && svg.dataset.videoIcon !== 'true') {
            svg.style.stroke = savedIcon.color;
            svg.style.color = savedIcon.color;
        }

        if (svg.dataset.videoIcon === 'true') {
            svg.style.display = 'block';
            svg.classList.add('video-card-icon');
            svg.removeAttribute('data-icon-hidden');
            svg.innerHTML = '<circle cx="12" cy="12" r="9"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon>';
        }
    });
}

function saveIconState(svg) {
    const key = getIconStorageKey(svg);
    if (!key) return;

    let icons = {};
    try {
        icons = JSON.parse(localStorage.getItem('atrak_saved_icons') || '{}');
    } catch (e) {
        icons = {};
    }

    icons[key] = {
        html: svg.innerHTML,
        hidden: svg.style.display === 'none' || svg.getAttribute('data-icon-hidden') === 'true',
        color: svg.style.stroke || svg.style.color || ''
    };
    localStorage.setItem('atrak_saved_icons', JSON.stringify(icons));
    syncStateToCloud();
}




function navigateTo(viewKey) {
    /* خدماتِ هدر دوم روی همان بخش خدمات صفحه اصلی باز می‌شود.
       این مسیر قبلاً به view ناموجود می‌رفت و عملاً هیچ کاری نمی‌کرد. */
    if (viewKey === 'services') {
        const alreadyHome = state.currentView === 'home';
        if (!alreadyHome) {
            state.currentView = 'home';
        } else {
            renderCurrentView();
        }
        setTimeout(function () {
            const services = document.getElementById('homeServicesGrid');
            if (services) {
                services.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 140);
        return;
    }

    if (!views[viewKey]) {
        if (typeof showToast === 'function') {
            showToast('این صفحه در حال حاضر در دسترس نیست.');
        }
        return;
    }

    /* سامانه محتوا فقط برای دانش آموز واردشده در دسترس است */
    if (isStudentProtectedView(viewKey) && !isStudentLoggedIn()) {
        promptStudentLogin();
        const error = document.getElementById('studentLoginError');
        if (error) {
            error.textContent = 'ابتدا از بخش «ورود» در هدر بالای صفحه وارد حساب دانش آموز شوید.';
            error.style.display = 'block';
        }
        return;
    }

    /*
     * اگر کاربر روی یکی از آیتم‌های موجود در تاریخچه کلیک کرد،
     * تمام صفحات بعد از آن آیتم حذف شوند.
     */
    const clickedHistoryIndex = state.history.indexOf(viewKey);

    if (
        clickedHistoryIndex !== -1 &&
        clickedHistoryIndex <= state.historyIndex
    ) {
        state._historyNavigation = true;

        // تاریخچه را تا همان صفحه نگه می‌داریم
        state.history = state.history.slice(
            0,
            clickedHistoryIndex + 1
        );

        state.historyIndex = clickedHistoryIndex;

        state.currentView = viewKey;

        state._historyNavigation = false;
    } else {
        // اگر صفحه جدید است، رفتار معمول قبلی حفظ شود
        state.currentView = viewKey;
    }

    renderCurrentView();

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function navGoBack() {

    if (state.historyIndex > 0) {

        state._historyNavigation = true;

        state.historyIndex--;

        state.currentView =
            state.history[state.historyIndex];

        state._historyNavigation = false;

        renderCurrentView();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        return;
    }

    if (state.currentView !== 'home') {

        state._historyNavigation = true;

        state.currentView = 'home';

        state._historyNavigation = false;

        renderCurrentView();

        return;
    }
}

function navGoForward() {

    if (state.historyIndex < state.history.length - 1) {

        state._historyNavigation = true;

        state.historyIndex++;

        state.currentView =
            state.history[state.historyIndex];

        state._historyNavigation = false;

        renderCurrentView();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

      function rememberView(viewKey) {
    state.currentView = viewKey;
    updateNavHistoryButtons();
}

        function updateNavHistoryButtons() {
            const btnBack = document.getElementById('btnBack');
            const btnForward = document.getElementById('btnForward');
            if (btnBack) btnBack.disabled = (state.historyIndex <= 0 && state.currentView === 'home');
            if (btnForward) btnForward.disabled = (state.historyIndex >= state.history.length - 1);
        }

      function updateBreadcrumbs() {
            const trail = document.getElementById('breadcrumbTrail');
            if (!trail) return;

            const labels = {
                'home': 'صفحه اصلی',
                'school': 'مدرسه آموزش از راه دور اترک',
                'faq': 'سؤالات متداول',
                'services': 'خدمات ما',
                'maghta': 'مقاطع تحصیلی',
                'virtual-edu': 'آموزش مجازی',
                'monitoring': 'نظارت مستمر',
                'support': 'مشاور من',
                'resources': 'منابع آموزشی',
                'certificate': 'صدور مدرک',
                'maghta': 'مقاطع',
'maghta-m1': 'متوسطه اول',
'maghta-m1-p7': 'پایه هفتم',
'maghta-m1-p8': 'پایه هشتم',
'maghta-m1-p9': 'پایه نهم',
'maghta-m2': 'متوسطه دوم',
'maghta-m2-p10': 'پایه دهم',
'maghta-m2-p11': 'پایه یازدهم',
'maghta-m2-p12': 'پایه دوازدهم',
'maghta-kardanesh': 'کاردانش',
                'lms-portal': 'سامانه LMS',
                'lms-theory': 'دروس نظری',
                'lms-theory-m1': 'متوسطه اول',
                'lms-theory-m2': 'متوسطه دوم',
                'lms-kardanesh': 'کاردانش',
                'm2-riazi': 'رشته ریاضی',
'm2-tajrobi': 'رشته تجربی',
'm2-ensani': 'رشته انسانی',
'm2-p10-riazi': 'دهم ریاضی',
'm2-p11-riazi': 'یازدهم ریاضی',
'm2-p12-riazi': 'دوازدهم ریاضی',
'm2-p10-tajrobi': 'دهم تجربی',
'm2-p11-tajrobi': 'یازدهم تجربی',
'm2-p12-tajrobi': 'دوازدهم تجربی',
'm2-p10-ensani': 'دهم انسانی',
'm2-p11-ensani': 'یازدهم انسانی',
'm2-p12-ensani': 'دوازدهم انسانی',

                        'm1-p7': 'پایه هفتم',
        'm1-p8': 'پایه هشتم',
        'm1-p9': 'پایه نهم',
        'm1-p7-lesson1': 'قرآن',
        'm1-p7-lesson2': 'پیام‌های آسمانی',
        'm1-p7-lesson3': 'فارسی',
        'm1-p7-lesson4': 'ریاضی',
        'm1-p7-lesson5': 'علوم',
        'm1-p7-lesson6': 'مطالعات اجتماعی',
        'm1-p7-lesson7': 'عربی',
        'm1-p7-lesson8': 'انگلیسی',
        'm1-p8-lesson1': 'قرآن',
        'm1-p8-lesson2': 'پیام‌های آسمانی',
        'm1-p8-lesson3': 'فارسی',
        'm1-p8-lesson4': 'ریاضی',
        'm1-p8-lesson5': 'علوم',
        'm1-p8-lesson6': 'مطالعات اجتماعی',
        'm1-p8-lesson7': 'عربی',
        'm1-p8-lesson8': 'انگلیسی',
        'm1-p9-lesson1': 'قرآن',
        'm1-p9-lesson2': 'پیام‌های آسمانی',
        'm1-p9-lesson3': 'فارسی',
        'm1-p9-lesson4': 'ریاضی',
        'm1-p9-lesson5': 'علوم',
        'm1-p9-lesson6': 'مطالعات اجتماعی',
        'm1-p9-lesson7': 'عربی',
        'm1-p9-lesson8': 'انگلیسی',
        'content': 'محتوا',

            };

            const viewKey = state.currentView;
            const parents = {
                'virtual-edu': ['home'],
                'lms-portal': ['home', 'virtual-edu'],
                'lms-theory': ['home', 'virtual-edu', 'lms-portal'],
                'lms-theory-m1': ['home', 'virtual-edu', 'lms-portal', 'lms-theory'],
                'lms-theory-m2': ['home', 'virtual-edu', 'lms-portal', 'lms-theory'],
                'lms-kardanesh': ['home', 'virtual-edu', 'lms-portal'],
                'm1-p7': ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m1'],
                'm1-p8': ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m1'],
                'm1-p9': ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m1'],
                'm2-riazi': ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m2'],
                'm2-tajrobi': ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m2'],
                'm2-ensani': ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m2']
            };

            if (/^m1-p[789]-lesson[1-8]$/.test(viewKey)) {
                const grade = viewKey.match(/^m1-(p[789])/)[1];
                parents[viewKey] = ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m1', `m1-${grade}`];
            }

            if (/^m2-p(10|11|12)-(riazi|tajrobi|ensani)$/.test(viewKey)) {
                const field = viewKey.match(/^m2-p(?:10|11|12)-(riazi|tajrobi|ensani)/)[1];
                parents[viewKey] = ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m2', `m2-${field}`];
            }

            const lessonKey = window.currentLessonId || '';
            if (/^m1-p[789]-lesson[1-8]$/.test(lessonKey)) {
                const grade = lessonKey.match(/^m1-(p[789])/)[1];
                parents[viewKey] = ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m1', `m1-${grade}`];
                labels[viewKey] = window.currentLessonName || labels[viewKey] || 'محتوای درس';
            }

            if (/^m2-p(10|11|12)-(riazi|tajrobi|ensani)-/.test(lessonKey)) {
                const field = lessonKey.match(/^m2-p(?:10|11|12)-(riazi|tajrobi|ensani)-/)[1];
                const gradeView = lessonKey.match(/^m2-p(?:10|11|12)-(?:riazi|tajrobi|ensani)/)[0];
                parents[viewKey] = ['home', 'virtual-edu', 'lms-portal', 'lms-theory', 'lms-theory-m2', `m2-${field}`, gradeView];
                labels[viewKey] = window.currentLessonName || labels[viewKey] || 'محتوای درس';
            }

            if (viewKey === 'lesson-videos' || viewKey === 'lesson-video-chapter' || viewKey === 'content') {
                labels[viewKey] = window.currentLessonName || labels[viewKey] || 'محتوای درس';
            }

            const breadcrumbViews = parents[viewKey] || ['home'];
            if (viewKey !== 'home') breadcrumbViews.push(viewKey);

            let html = breadcrumbViews.map((breadcrumbView, index) => {
                const label = labels[breadcrumbView] || breadcrumbView;
                const isActive = index === breadcrumbViews.length - 1;
                return `${index ? ' <span>/</span> ' : ''}<span class="breadcrumb-item${isActive ? ' active' : ''}" onclick="navigateTo('${breadcrumbView}')">${label}</span>`;
            }).join('');
            trail.innerHTML = html;
        }

        /* =========================================================
   سیستم سوالات اختصاصی هر درس
========================================================= */


/*
   اطلاعات سوالات هر درس

   هر درس کلید مخصوص خودش را دارد.

   مثال:

   m1-p7-lesson4 = ریاضی هفتم
   m1-p8-lesson4 = ریاضی هشتم

   بنابراین اطلاعات این دو هیچ وقت با هم قاطی نمی‌شوند.
*/

const lessonQuestionsData = {

    /* =========================
       پایه هفتم
    ========================= */

    'm1-p7-lesson1': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson2': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson3': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson4': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson5': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson6': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson7': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p7-lesson8': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },


    /* =========================
       پایه هشتم
    ========================= */

    'm1-p8-lesson1': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson2': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson3': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson4': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson5': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson6': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson7': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p8-lesson8': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },


    /* =========================
       پایه نهم
    ========================= */

    'm1-p9-lesson1': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson2': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson3': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson4': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson5': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson6': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson7': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    },

    'm1-p9-lesson8': {
        textbook: [],
        firstTerm: [],
        secondTerm: []
    }

};


/* =========================================================
   ساخت کارت‌های داخل هر درس
========================================================= */

function lessonCards(lessonId, lessonName) {
    return `
        <p style="
            font-size:14px;
            color:var(--text-muted);
            margin-bottom:20px;
            text-align:center;
        ">
            محتوای آموزشی درس ${lessonName}
        </p>

        <div class="drilldown-grid"
             style="
                grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
                gap:20px;
             ">

            <!-- =========================
                 جزوه ها
            ========================== -->
            <div class="drilldown-card"
                 onclick="alert('بخش جزوه‌ها به‌زودی فعال می‌شود')">

                <svg class="topic-icon-svg"
                     onclick="event.stopPropagation(); if(isAdminMode) openIconPicker(event, this)"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">

                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>

                </svg>

                <h3 style="
                    font-size:18px;
                    font-weight:800;
                ">
                    جزوه‌ها
                </h3>

                <p style="
                    font-size:13px;
                    color:var(--text-muted);
                    margin-top:8px;
                ">
                    خلاصه درس، نکات مهم و جزوات آموزشی
                </p>

            </div>


            <!-- =========================
                 سوالات
            ========================== -->
            <div class="drilldown-card"
                onclick="openQuestionCategories(state.currentView, '${lessonName}')"س>

                <svg class="topic-icon-svg"
                     onclick="event.stopPropagation(); if(isAdminMode) openIconPicker(event, this)"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">

                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>

                </svg>

                <h3 style="
                    font-size:18px;
                    font-weight:800;
                ">
                    سوالات
                </h3>

                <p style="
                    font-size:13px;
                    color:var(--text-muted);
                    margin-top:8px;
                ">
                    سوالات متن کتاب و نمونه سوالات امتحانی
                </p>

            </div>


            <!-- =========================
                 فیلم های آموزشی
            ========================== -->
            <div class="drilldown-card"
                  onclick="openLessonVideos('${lessonId}', '${lessonName}')">

                 <svg class="topic-icon-svg video-card-icon"
                     data-video-icon="true"
                     onclick="event.stopPropagation(); if(isAdminMode) openIconPicker(event, this)"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">

                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>

                </svg>

                <h3 style="
                    font-size:18px;
                    font-weight:800;
                ">
                    فیلم‌های آموزشی
                </h3>

                <p style="
                    font-size:13px;
                    color:var(--text-muted);
                    margin-top:8px;
                ">
                    ویدیوهای تدریس و آموزش
                </p>

            </div>

        </div>
    `;
}



function openLessonQuestions(lessonKey, lessonName) {

    /*
       =====================================================
       صفحه انتخاب دسته سوالات یک درس
       متوسطه اول + متوسطه دوم
       =====================================================
    */

    const previousView = state.currentView;

    const container =
        document.getElementById('mainAppContent');

    if (!container) return;


    /*
       =====================================================
       بررسی اطلاعات درس
       =====================================================
    */

    if (
        typeof lessonQuestionsData !== 'undefined' &&
        !lessonQuestionsData[lessonKey]
    ) {

        lessonQuestionsData[lessonKey] = {

            textbook: [],

            firstTerm: [],

            secondTerm: []

        };

    }


    /*
       =====================================================
       صفحه سوالات
       =====================================================
    */

    container.innerHTML = `

        <section
            class="glass-card fade-in-up question-category-page"
        >


            <!-- ==============================
                 دکمه بازگشت
            =============================== -->

            <button
                class="question-back-btn"
                type="button"
                onclick="navigateTo('${previousView}')"
            >

                ←
                بازگشت به ${lessonName}

            </button>



            <!-- ==============================
                 عنوان
            =============================== -->

            <div class="question-category-header">

                <h2>

                    سوالات ${lessonName}

                </h2>


                <p>

                    نوع سوالات مورد نظر خود را انتخاب کنید

                </p>

            </div>



            <!-- ==============================
                 سه دسته سوال
            =============================== -->

            <div class="lesson-questions-grid">


                <!-- =========================================
                     سوالات متن کتاب
                ========================================== -->

                <div
                    class="lesson-question-card"
                    onclick="
    openQuestionCategory(
        '${escapeQuestionHTML(lessonKey)}',
        '${escapeQuestionHTML(lessonName)}',
        'textbook'
    )
"
                >

                    <div class="lesson-question-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >

                            <path
                                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
                            ></path>

                            <path
                                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
                            ></path>

                        </svg>

                    </div>


                    <div class="lesson-question-title">

                        سوالات متن کتاب

                    </div>

                </div>



                <!-- =========================================
                     نوبت اول
                ========================================== -->

                <div
                    class="lesson-question-card"
                    onclick="
                        showQuestionList(
                            '${lessonKey}',
                            '${lessonName}',
                            'firstTerm'
                        )
                    "
                >

                    <div class="lesson-question-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >

                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="2"
                            ></rect>

                            <line
                                x1="16"
                                y1="2"
                                x2="16"
                                y2="6"
                            ></line>

                            <line
                                x1="8"
                                y1="2"
                                x2="8"
                                y2="6"
                            ></line>

                            <line
                                x1="3"
                                y1="10"
                                x2="21"
                                y2="10"
                            ></line>

                        </svg>

                    </div>


                    <div class="lesson-question-title">

                        نوبت اول

                    </div>

                </div>



                <!-- =========================================
                     نوبت دوم
                ========================================== -->

                <div
                    class="lesson-question-card"
                    onclick="
                        showQuestionList(
                            '${lessonKey}',
                            '${lessonName}',
                            'secondTerm'
                        )
                    "
                >

                    <div class="lesson-question-icon">

                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >

                            <path
                                d="M12 2v20"
                            ></path>

                            <path
                                d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                            ></path>

                        </svg>

                    </div>


                    <div class="lesson-question-title">

                        نوبت دوم

                    </div>

                </div>

            </div>



            <!-- =================================================
                 دکمه مدیریت سوالات
                 
                 فقط در حالت مدیریت نمایش داده می‌شود
            ================================================== -->

            ${
                state.isAdmin
                ? `

                    <div
                        style="
                            margin-top:25px;
                            display:flex;
                            justify-content:center;
                        "
                    >

                        <button
                            type="button"

                            onclick="
                                showMiddle1QuestionManager(
                                    '${lessonKey}',
                                    '${lessonName}',
                                    'textbook'
                                )
                            "

                            style="
                                border:none;
                                padding:13px 22px;
                                border-radius:12px;
                                cursor:pointer;

                                background:#7c3aed;
                                color:#ffffff;

                                font-family:inherit;
                                font-size:15px;
                                font-weight:900;

                                box-shadow:
                                    0 8px 20px
                                    rgba(124,58,237,.20);

                                transition:
                                    transform .2s ease,
                                    opacity .2s ease;
                            "
                        >

                            ✏️ مدیریت سوالات این درس

                        </button>

                    </div>

                `
                : ''
            }


        </section>

    `;

}


/* =========================================================
   نمایش سوالات یک دسته
========================================================= */

function showQuestionList(lessonKey, lessonName, category) {

    const container = document.getElementById('mainAppContent');

    if (!container) return;


    let categoryTitle = '';


    if (category === 'textbook') {

        categoryTitle = 'سوالات متن کتاب';

    }

    else if (category === 'firstTerm') {

        categoryTitle = 'سوالات نوبت اول';

    }

    else if (category === 'secondTerm') {

        categoryTitle = 'سوالات نوبت دوم';

    }


    /*
       اطلاعات مخصوص همین درس
    */

    const lessonData =
        lessonQuestionsData[lessonKey] || {
            textbook: [],
            firstTerm: [],
            secondTerm: []
        };


    const questions =
        lessonData[category] || [];


    let questionsHTML = '';


    /*
       اگر هنوز سوالی ثبت نشده باشد
    */

    if (questions.length === 0) {

        questionsHTML = `

            <div style="
                text-align:center;
                padding:45px 20px;
                color:var(--text-muted);
            ">

                <div style="
                    width:70px;
                    height:70px;
                    margin:0 auto 18px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    border-radius:50%;
                    background:rgba(236,72,153,0.10);
                    color:var(--accent-pink);
                    font-size:30px;
                ">
                    ?
                </div>

                <h3 style="
                    color:var(--text-color);
                    margin-bottom:8px;
                    font-size:18px;
                ">
                    هنوز سوالی اضافه نشده است
                </h3>

                <p style="font-size:14px;">
                    سوالات مخصوص ${lessonName}
                    در این بخش قرار خواهند گرفت.
                </p>

            </div>

        `;

    }

    else {

        questionsHTML = questions.map((question, index) => `

            <div style="
                padding:16px;
                margin-bottom:12px;
                border:1px solid var(--card-border);
                border-radius:14px;
                background:rgba(236,72,153,0.04);
            ">

                <strong>
                    سوال ${index + 1}:
                </strong>

                <div style="margin-top:6px;">
                    ${question}
                </div>

            </div>

        `).join('');

    }


    container.innerHTML = `

        <section class="glass-card fade-in-up question-category-page">


            <button class="question-back-btn"
                    onclick="openLessonQuestions('${lessonKey}', '${lessonName}')" type="button">

                ←
                بازگشت به سوالات ${lessonName}

            </button>


            <div class="question-category-header">

                <h2>
                    ${categoryTitle}
                </h2>

                <p>
                    ${lessonName}
                </p>

            </div>


            <div class="question-content-box">

                ${questionsHTML}

                       </div>


            <!-- =========================================
                 مدیریت سوالات - مخصوص مدیر
            ========================================== -->

            ${
                state.isAdmin
                    ? `
                        <div
                            style="
                                display:flex;
                                justify-content:center;
                                margin-top:25px;
                            "
                        >

                            <button
                                type="button"

                                onclick="
                                    showMiddle1QuestionManager(
                                        '${lessonKey}',
                                        '${lessonName}',
                                        'textbook'
                                    )
                                "

                                style="
                                    border:none;
                                    padding:13px 24px;
                                    border-radius:12px;
                                    cursor:pointer;

                                    background:var(--primary);
                                    color:white;

                                    font-family:inherit;
                                    font-size:15px;
                                    font-weight:900;

                                    box-shadow:
                                        0 8px 20px
                                        rgba(0,0,0,.12);
                                "
                            >

                                ✏️ مدیریت سوالات این درس

                            </button>

                        </div>
                    `
                    : ''
            }


        </section>
    `;

}

function subjectCard(name, id, img, icon) {
    return `
        <div class="service-card" onclick="showLessonContent('${name}', '${id}')">
            <div style="position:relative; display:inline-block;">
                <svg class="topic-icon-svg" onclick="if(isAdminMode) openIconPicker(event, this)" viewBox="0 0 24 24">${icon}</svg>
                <span onclick="if(isAdminMode) deleteIcon(event, this.parentElement.querySelector('svg'))" 
                      style="display:none; position:absolute; top:-8px; right:-8px; width:20px; height:20px; background:red; color:#fff; border-radius:50%; text-align:center; line-height:20px; font-size:12px; cursor:pointer; font-weight:bold;"
                      class="icon-delete-btn">✕</span>
            </div>
            <div class="img-frame-container">
                <img src="${img}" class="zoom-img" alt="${name}" id="${id}" decoding="async" loading="lazy">
                <div class="img-upload-overlay" onclick="event.stopPropagation(); if(isAdminMode) triggerImageUpload('${id}')">تعویض عکس</div>
            </div>
            <h3 class="service-card-title" data-editable="${id}-name">${name}</h3>
        </div>
    `;
}


function deleteIcon(event, element) {

    event.stopPropagation();

    if (!isAdminMode) {
        return;
    }

    if (confirm('آیا مطمئن هستی که می‌خوای این آیکون رو مخفی کنی؟')) {

        element.style.display = 'none';

        element.setAttribute(
            'data-icon-hidden',
            'true'
        );

        saveIconState(element);
        saveAllEdits(false);

        console.log('آیکون مخفی شد و ذخیره شد.');
    }
}


function showLessonContent(lessonName, lessonId) {

    rememberView('content');

    const container = document.getElementById('mainAppContent');

    if (!container) return;


    // =====================================================
    // ذخیره درس فعلی
    // این شناسه باعث می‌شود سوالات هر درس کاملاً مستقل باشند
    // =====================================================

    window.currentLessonId = lessonId;
    window.currentLessonName = lessonName;


    container.innerHTML = `

        <section class="glass-card fade-in-up">

            <!-- عنوان درس -->
            <h2 class="card-title">

                <svg class="inline-icon topic-icon-svg"
                     onclick="if(isAdminMode) openIconPicker(event, this)"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">

                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>

                </svg>

                <span data-editable="${lessonId}-title">
                    ${lessonName}
                </span>

            </h2>


            <!-- توضیح -->
            <p style="
                font-size:14px;
                color:var(--text-muted);
                margin-bottom:20px;
                text-align:center;
            ">
                محتوای آموزشی درس ${lessonName}
            </p>


            <!-- =================================================
                 سه بخش اصلی درس
            ================================================== -->

            <div class="drilldown-grid"
                 style="
                    grid-template-columns:
                    repeat(auto-fit,minmax(250px,1fr));
                    gap:20px;
                 ">


                <!-- =============================================
                     جزوه‌ها
                ============================================== -->

                <div class="drilldown-card"
                     onclick="openLessonNotes('${lessonId}', '${lessonName}')">

                    <svg class="topic-icon-svg"
                         onclick="if(isAdminMode) openIconPicker(event, this)"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         stroke-linecap="round"
                         stroke-linejoin="round">

                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>

                    </svg>

                    <h3 style="
                        font-size:18px;
                        font-weight:800;
                    ">
                        جزوه‌ها
                    </h3>

                    <p style="
                        font-size:13px;
                        color:var(--text-muted);
                        margin-top:8px;
                    ">
                        خلاصه درس، نکات مهم و جزوات آموزشی
                    </p>

                </div>



                <!-- =============================================
                     فیلم‌های آموزشی
                ============================================== -->

                <div class="drilldown-card"
                     onclick="openLessonVideos('${lessonId}', '${lessonName}')">

                    <svg class="topic-icon-svg video-card-icon"
                        data-video-icon="true"
                         data-video-card-icon="true"
                         onclick="if(isAdminMode) openIconPicker(event, this)"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         stroke-linecap="round"
                         stroke-linejoin="round">

                        <circle cx="12" cy="12" r="9"></circle>
                        <polygon points="10 8 16 12 10 16 10 8"></polygon>

                    </svg>

                    <h3 style="
                        font-size:18px;
                        font-weight:800;
                    ">
                        فیلم‌های آموزشی
                    </h3>

                    <p style="
                        font-size:13px;
                        color:var(--text-muted);
                        margin-top:8px;
                    ">
                        ویدیوهای تدریس و آموزش
                    </p>

                </div>



                <!-- =============================================
                     سوالات
                ============================================== -->

                <div class="drilldown-card"
                     onclick="openQuestionCategories(window.currentLessonId, '${lessonName}')">

                    <svg class="topic-icon-svg"
                         onclick="if(isAdminMode) openIconPicker(event, this)"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         stroke-linecap="round"
                         stroke-linejoin="round">

                        <circle cx="12"
                                cy="12"
                                r="10">
                        </circle>

                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>

                        <line x1="12"
                              y1="17"
                              x2="12.01"
                              y2="17">
                        </line>

                    </svg>

                    <h3 style="
                        font-size:18px;
                        font-weight:800;
                    ">
                        سوالات
                    </h3>

                    <p style="
                        font-size:13px;
                        color:var(--text-muted);
                        margin-top:8px;
                    ">
                        سوالات متن کتاب و نمونه سوالات امتحانی
                    </p>

                </div>

            </div>

        </section>

    `;


    // =====================================================
    // به‌روزرسانی مسیر صفحه
    // =====================================================

    updateBreadcrumbs();


    // =====================================================
    // اسکرول به بالای صفحه
    // =====================================================

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}







/* =========================================================
   سیستم جدید سوالات:
   ابتدا انتخاب درس
   سپس نمایش محتوای همان درس
   ========================================================= */

/* =========================================================
   انتخاب درس‌های داخل بخش سوالات
   نسخه جدید
   ========================================================= */




/* =========================================================
   باز کردن یک درس داخلی
   ========================================================= */

function openQuestionChapter(
    chapterId,
    chapterTitle,
    category,
    parentLessonId,
    parentLessonName
) {

    const container =
        document.getElementById('mainAppContent');

    if (!container) return;


    /* =========================================
       ذخیره مسیر فعلی
    ========================================= */

    state.currentView = 'question-chapter';

    window.currentQuestionChapterId = chapterId;
    window.currentQuestionChapterTitle = chapterTitle;
    window.currentQuestionChapterCategory = category;

    window.currentLessonId = parentLessonId;
    window.currentLessonName = parentLessonName;
    window.currentQuestionCategory = category;


    /* =========================================
       دریافت اطلاعات ذخیره‌شده
    ========================================= */

    let data = getLessonQuestions(chapterId);

    if (!data || typeof data !== 'object') {
        data = {};
    }


    /* =========================================
       اگر این درس هنوز محتوایی ندارد
    ========================================= */

    if (!Array.isArray(data[category])) {

        data[category] = [
            {
                id: 'point_' + chapterId,
                question: '.',
                answer: ''
            }
        ];

        saveLessonQuestions(
            chapterId,
            data
        );
    }


    /* =========================================
       اگر آرایه خالی است
    ========================================= */

    if (data[category].length === 0) {

        data[category] = [
            {
                id: 'point_' + chapterId,
                question: '.',
                answer: ''
            }
        ];

        saveLessonQuestions(
            chapterId,
            data
        );
    }


    /* =========================================
       دریافت لیست سوالات
    ========================================= */

    const list = data[category] || [];

    let contentHTML = '';


    /* =========================================
       ساخت سوال + جواب
    ========================================= */

    list.forEach((item, index) => {

        const question =
            typeof item === 'string'
                ? item
                : (
                    item.question ||
                    item.text ||
                    '.'
                );

        const answer =
            typeof item === 'string'
                ? ''
                : (
                    item.answer ||
                    ''
                );


        contentHTML += `
            <div
                style="
                    margin-bottom:18px;
                    padding:18px;
                    border:1px solid var(--card-border);
                    border-radius:14px;
                    background:rgba(255,255,255,.12);
                "
            >

                <div
                    style="
                        font-weight:900;
                        font-size:16px;
                        line-height:2;
                        color:var(--text-color);
                    "
                >
                    سوال ${index + 1}
                </div>


                <div
                    style="
                        white-space:pre-wrap;
                        line-height:2;
                        font-size:16px;
                        color:var(--text-color);
                        margin-top:8px;
                    "
                >
                    ${escapeQuestionHTML(question)}
                </div>


                ${
                    answer
                    ?
                    `
                    <div
                        style="
                            margin-top:14px;
                            padding-top:12px;
                            border-top:1px dashed var(--card-border);
                        "
                    >

                        <div
                            style="
                                font-weight:900;
                                color:var(--accent-pink);
                                margin-bottom:6px;
                            "
                        >
                            پاسخ:
                        </div>


                        <div
                            style="
                                white-space:pre-wrap;
                                line-height:2;
                                font-size:15px;
                                color:var(--text-color);
                            "
                        >
                            ${escapeQuestionHTML(answer)}
                        </div>

                    </div>
                    `
                    :
                    ''
                }

            </div>
        `;
    });


    /* =========================================
       عنوان دسته
    ========================================= */

    let categoryTitle =
        'سوالات متن کتاب';

    if (category === 'first-term') {

        categoryTitle =
            'سوالات نوبت اول';

    }

    else if (category === 'second-term') {

        categoryTitle =
            'سوالات نوبت دوم';

    }


    /* =========================================
       نمایش صفحه
    ========================================= */

    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
            style="
                padding:25px;
            "
        >


            <!-- بازگشت -->

            <button
                type="button"
                onclick="
                    openQuestionCategory(
                        '${escapeQuestionHTML(parentLessonId)}',
                        '${escapeQuestionHTML(parentLessonName)}',
                        '${escapeQuestionHTML(category)}'
                    )
                "
                style="
                    border:none;
                    padding:10px 18px;
                    border-radius:10px;
                    cursor:pointer;
                    background:var(--primary);
                    color:white;
                    font-weight:800;
                    font-family:inherit;
                    margin-bottom:25px;
                "
            >
                ← بازگشت به فهرست درس‌ها
            </button>


            <!-- عنوان -->

            <div
                style="
                    text-align:center;
                    margin-bottom:25px;
                "
            >

                <h2
                    style="
                        margin:0;
                        font-size:23px;
                        font-weight:900;
                        color:var(--text-color);
                    "
                >
                    ${escapeQuestionHTML(chapterTitle)}
                </h2>


                <p
                    style="
                        margin-top:8px;
                        color:var(--text-muted);
                        font-size:13px;
                    "
                >
                    ${categoryTitle}
                </p>

            </div>


            <!-- =================================
                 محتوای سوالات
            ================================== -->

            <div
                style="
                    min-height:60px;
                "
            >

                ${contentHTML}

            </div>


            <!-- =================================
                 مدیریت سوالات برای مدیر
            ================================== -->

            ${
                state.isAdmin
                ?
                `

                <div
                    style="
                        margin-top:25px;
                    "
                >

                    <button
                        type="button"
                        onclick="
                            showQuestionAdminPanel(
                                '${escapeQuestionHTML(chapterId)}',
                                '${escapeQuestionHTML(chapterTitle)}'
                            )
                        "
                        style="
                            width:100%;
                            border:none;
                            padding:14px;
                            border-radius:12px;
                            cursor:pointer;
                            background:#7c3aed;
                            color:white;
                            font-family:inherit;
                            font-size:15px;
                            font-weight:900;
                        "
                    >
                        ✏️ مدیریت سوالات این درس
                    </button>

                </div>

                `
                :
                ''
            }

        </section>

    `;


    window.scrollTo({
        top:0,
        behavior:'smooth'
    });

}


/* =========================================================
   باز کردن یک درس داخلی
   ========================================================= */





/* =========================================================
   جزوه‌های هر درس
   ========================================================= */

function openLessonNotes(lessonId, lessonName) {

    alert(
        'بخش جزوه‌های درس ' +
        lessonName +
        ' هنوز فعال نشده است.'
    );

}



function openLessonVideos(lessonId, lessonName) {

    const container = document.getElementById('mainAppContent');

    if (!container) {
        return;
    }

    state.currentView = 'lesson-videos';

    const lessonKey = String(lessonId || '').trim();

    let lessonCount = lessonCounts[lessonKey];

    if (!lessonCount) {
        lessonCount = 0;
    }

    let cardsHTML = '';

    for (let i = 1; i <= lessonCount; i++) {

        const chapterId =
            `${lessonKey}__videos__chapter_${i}`;

            const chapterTitle =
                `جلسه ${i} - فیلم آموزشی ${lessonName}`;

        cardsHTML += `
            <div
                class="lesson-question-card"
                onclick="
                    openLessonVideoChapter(
                        '${escapeQuestionHTML(chapterId)}',
                        '${escapeQuestionHTML(chapterTitle)}',
                        '${escapeQuestionHTML(lessonKey)}',
                        '${escapeQuestionHTML(lessonName)}'
                    )
                "
            >

                <h3>
                    ${escapeQuestionHTML(chapterTitle)}
                </h3>

                <p>
                    برای مشاهده فیلم آموزشی وارد شوید
                </p>

            </div>
        `;
    }

    if (!cardsHTML) {

        cardsHTML = `
            <div style="
                text-align:center;
                padding:40px;
                color:#777;
            ">
                برای این کتاب درسی، فصلی ثبت نشده است.
            </div>
        `;

    }

    container.innerHTML = `

        <div style="
            max-width:1100px;
            margin:40px auto;
            padding:20px;
        ">

            <button
                type="button"
                onclick="
                    openLessonVideosBack(
                        '${escapeQuestionHTML(lessonKey)}',
                        '${escapeQuestionHTML(lessonName)}'
                    )
                "
                style="
                    padding:10px 18px;
                    border:none;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                    margin-bottom:25px;
                "
            >
                ← بازگشت
            </button>

            <h2 style="
                text-align:center;
                margin-bottom:30px;
            ">
                فیلم‌های آموزشی ${escapeQuestionHTML(lessonName)}
            </h2>

            <div
                class="lesson-questions-grid"
            >
                ${cardsHTML}
            </div>

        </div>
    `;
}

function openLessonVideosBack(lessonId, lessonName) {

    if (typeof openLessonDetail === 'function') {
        openLessonDetail(
            lessonId,
            lessonName
        );
        return;
    }

    if (typeof showLessonDetail === 'function') {
        showLessonDetail(
            lessonId,
            lessonName
        );
        return;
    }

    location.reload();
}

function openLessonVideoChapter(
    chapterId,
    chapterTitle,
    parentLessonId,
    parentLessonName
) {

    const container =
    document.getElementById('mainAppContent');

    if (!container) {
        return;
    }

    state.currentView = 'lesson-video-chapter';

    container.innerHTML = `

        <div style="
            max-width:1000px;
            margin:40px auto;
            padding:20px;
        ">

            <button
                type="button"
                onclick="
                    openLessonVideos(
                        '${escapeQuestionHTML(parentLessonId)}',
                        '${escapeQuestionHTML(parentLessonName)}'
                    )
                "
                style="
                    padding:10px 18px;
                    border:none;
                    border-radius:10px;
                    cursor:pointer;
                    font-weight:700;
                    margin-bottom:25px;
                "
            >
                ← بازگشت به فیلم‌ها
            </button>

            <h2 style="
                text-align:center;
                margin-bottom:30px;
            ">
                ${escapeQuestionHTML(chapterTitle)}
            </h2>

            <div style="
                text-align:center;
                padding:50px 20px;
                border-radius:18px;
                background:#f8fafc;
            ">

                <div style="
                    font-size:55px;
                    margin-bottom:15px;
                ">
                    🎬
                </div>

                <h3>
                    ${escapeQuestionHTML(chapterTitle)}
                </h3>

                <p ${videoUrl ? `
    <div style="
        width:100%;
        max-width:900px;
        margin:20px auto;
        background:#000;
        border-radius:16px;
        overflow:hidden;
    ">
        <iframe
            src="${videoUrl}"
            title="${escapeQuestionHTML(chapterTitle)}"
            allowfullscreen
            style="
                display:block;
                width:100%;
                aspect-ratio:16/9;
                border:0;
            "
        ></iframe>
    </div>
` : `
    <p style="
        margin-top:12px;
        color:var(--text-muted);
    ">
        فیلم آموزشی این جلسه هنوز توسط مدیر ثبت نشده است.
    </p>
`}
                </p>

            </div>

        </div>
    `;
}


function lessonContentPage(lessonName, lessonId) {
    return `
        <section class="glass-card fade-in-up">
            <h2 class="card-title">
                <svg class="inline-icon topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span data-editable="${lessonId}-title">${lessonName}</span>
            </h2>
            <p style="font-size:14px; color:var(--text-muted); margin-bottom:20px; text-align:center;">محتوای آموزشی درس ${lessonName}</p>
            <div class="drilldown-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                <div class="drilldown-card" onclick="alert('بخش جزوه‌های ${lessonName} به‌زودی فعال می‌شود')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <h3 style="font-size:18px; font-weight:800;">جزوه‌ها</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">خلاصه درس، نکات مهم و جزوات آموزشی ${lessonName}</p>
                </div>
                <div class="drilldown-card" onclick="alert('بخش فیلم‌های ${lessonName} به‌زودی فعال می‌شود')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    <h3 style="font-size:18px; font-weight:800;">فیلم‌های آموزشی</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">ویدیوهای تدریس و آموزش ${lessonName}</p>
                </div>
                <div class="drilldown-card" onclick="alert('بخش سوالات ${lessonName} به‌زودی فعال می‌شود')">
                    <svg class="topic-icon-svg" onclick="openIconPicker(event, this)" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <h3 style="font-size:18px; font-weight:800;">سوالات</h3>
                    <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">نمونه سوالات امتحانی و تمرین ${lessonName}</p>
                </div>
            </div>
        </section>
    `;
}


        document.addEventListener('DOMContentLoaded', function () {
            // کلیدهای قدیمیِ بدون شناسه دستگاه دیگر نباید روی نام فعلی اثر بگذارند.
            try {
                localStorage.removeItem('atrak_student_login_v1');
                localStorage.removeItem('atrak_student_last_username_v1');
            } catch (e) {}

            updateStudentLoginButton();

            const usernameInput = document.getElementById('studentUsernameInput');
            if (usernameInput) {
                const remembered = getStudentSession()?.username || getSavedStudentUsername();
                if (remembered) usernameInput.value = remembered;
                usernameInput.addEventListener('change', function () {
                    saveStudentUsername(this.value);
                });
            }
        });

        
        window.addEventListener('DOMContentLoaded', function () {
            restoreSupabaseAdminSession();
        });

window.addEventListener('storage', function (event) {
            if (event.key === STUDENT_LOGIN_STORAGE_KEY || event.key === STUDENT_LAST_USERNAME_KEY) {
                updateStudentLoginButton();
                const input = document.getElementById('studentUsernameInput');
                const session = getStudentSession();
                if (input) input.value = session ? session.username : '';
            }
        });

        function promptAdminLogin() {
            if (state.isAdmin) {
                supabaseAdminSignOut();
            } else {
                const emailInput = document.getElementById('adminEmailInput');
                const passwordInput = document.getElementById('adminPasswordInput');
                const error = document.getElementById('adminCodeError');
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';
                if (error) { error.style.display = 'none'; error.textContent = 'ایمیل یا رمز عبور نامعتبر است.'; }
                openModal('adminLoginModal');
                setTimeout(() => emailInput?.focus(), 50);
            }
        }

       async function supabaseAdminSignIn(email, password) {
    if (!isCloudStorageConfigured()) {
        throw new Error('اتصال Supabase تنظیم نشده است.');
    }

    const response = await fetch(
        SUPABASE_URL + '/auth/v1/token?grant_type=password',
        {
            method: 'POST',
            headers: {
                apikey: SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch (e) {}

    if (!response.ok || !data?.access_token || !data?.user?.id) {
        throw new Error(
            data?.error_description ||
            data?.msg ||
            'ایمیل یا رمز عبور اشتباه است.'
        );
    }

    const accessToken = data.access_token;

    // ذخیره نشست مدیر
    atrakAdminAccessToken = accessToken;

    try {
        sessionStorage.setItem(
            'atrak_admin_access_token',
            accessToken
        );
    } catch (e) {}

    return data.user;
}

        async function checkAdminCode() {
            const emailInput = document.getElementById('adminEmailInput');
            const passwordInput = document.getElementById('adminPasswordInput');
            const error = document.getElementById('adminCodeError');
            const button = document.querySelector('#adminLoginModal button[onclick="checkAdminCode()"]');
            const email = String(emailInput?.value || '').trim();
            const password = String(passwordInput?.value || '');
            if (!email || !password) {
                if (error) { error.textContent = 'ایمیل و رمز عبور را وارد کنید.'; error.style.display = 'block'; }
                return;
            }
            if (button) { button.disabled = true; button.textContent = 'در حال ورود...'; }
            if (error) error.style.display = 'none';
            try {
                await supabaseAdminSignIn(email, password);
                if (passwordInput) passwordInput.value = '';
                closeModal('adminLoginModal');
                toggleAdmin(true);
            } catch (err) {
                if (error) { error.textContent = err?.message || 'ورود ناموفق بود.'; error.style.display = 'block'; }
            } finally {
                if (button) { button.disabled = false; button.textContent = 'تایید و ورود'; }
            }
        }

        async function supabaseAdminSignOut() {
            const token = atrakAdminAccessToken;
            atrakAdminAccessToken = '';
            try { sessionStorage.removeItem('atrak_admin_access_token'); } catch (e) {}
            if (token && isCloudStorageConfigured()) {
                try {
                    await fetch(SUPABASE_URL + '/auth/v1/logout', {
                        method: 'POST',
                        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
                    });
                } catch (e) {}
            }
            toggleAdmin(false);
        }

        async function restoreSupabaseAdminSession() {
            let token = '';
            try { token = sessionStorage.getItem('atrak_admin_access_token') || ''; } catch (e) {}
            if (!token) return;
            try {
                const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
                    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token }
                });
                const user = response.ok ? await response.json() : null;
                if (!user?.id) throw new Error('session');
                const adminResponse = await fetch(
                    SUPABASE_URL + '/rest/v1/admins?id=eq.' + encodeURIComponent(user.id) + '&select=id&limit=1',
                    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token } }
                );
                const rows = adminResponse.ok ? await adminResponse.json() : [];
                if (!Array.isArray(rows) || rows.length !== 1) throw new Error('admin');
                atrakAdminAccessToken = token;
                toggleAdmin(true);
            } catch (e) {
                atrakAdminAccessToken = '';
                try { sessionStorage.removeItem('atrak_admin_access_token'); } catch (ignore) {}
            }
        }

      function preserveDynamicPositionsDuringAdminToggle() {
    /*
     * در نسخه نهایی، خود نوار مدیریت fixed است و دیگر layout صفحه را جابه‌جا نمی‌کند.
     * فقط مختصات ذخیره‌شده فعلی عناصر را قبل از تغییر حالت ثبت می‌کنیم.
     */
    try {
        const all = getAtrakDynamicElements();
        const byId = new Map(all.map(item => [item.id, item]));
        document.querySelectorAll('.atrak-dynamic-item[data-id]').forEach(el => {
            const item = byId.get(el.dataset.id);
            if (!item) return;
            const left = parseFloat(el.style.left);
            const top = parseFloat(el.style.top);
            const width = parseFloat(el.style.width);
            const height = parseFloat(el.style.height);
            if (Number.isFinite(left)) item.x = left;
            if (Number.isFinite(top)) item.y = top;
            if (Number.isFinite(width)) item.w = width;
            if (Number.isFinite(height)) item.h = height;
        });
        localStorage.setItem(ATRAK_DYNAMIC_STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
        console.warn('ثبت موقعیت عناصر قبل از تغییر حالت مدیریت انجام نشد:', e);
    }
}

function restoreDynamicPositionsAfterAdminToggle() {
    /*
     * چون layout دیگر با نمایش/مخفی شدن نوار مدیریت تغییر نمی‌کند،
     * تنها از داده ذخیره‌شده دوباره render می‌کنیم؛ هیچ y جدیدی محاسبه نمی‌شود.
     */
    requestAnimationFrame(() => renderAtrakDynamicElements());
}

      function toggleAdmin(status) {

    // قبل از خروج، مختصات ظاهری عناصر را نگه می‌داریم تا
    // حذف نوار مدیریت یا حذف contenteditable باعث جابه‌جایی آیکون نشود.
    if (!status) {
        preserveDynamicPositionsDuringAdminToggle();
    }

    // هر دو متغیر باید با هم هماهنگ باشند
    state.isAdmin = status;
    isAdminMode = status;

    if (status) {

        document.body.classList.add('admin-mode');

        enableAdminEditableFields();

        // نمایش دکمه‌های حذف آیکون
        document.querySelectorAll('.icon-delete-btn').forEach(btn => {
            btn.style.display = 'block';
        });

        // خیلی مهم:
        // وضعیت آیکون‌های ذخیره‌شده دوباره اعمال شود
        restoreIcons();

        alert('حالت مدیریت فعال شد! ...');

    } else {

        document.body.classList.remove('admin-mode');

        disableAdminEditableFields();

        // مخفی کردن دکمه‌های حذف آیکون
        document.querySelectorAll('.icon-delete-btn').forEach(btn => {
            btn.style.display = 'none';
        });

        // وضعیت ذخیره‌شده آیکون‌ها حفظ شود
        restoreIcons();

        // مختصات عناصر افزوده‌شده را بعد از تغییر چیدمان دوباره تثبیت کن.
        requestAnimationFrame(function () {
            requestAnimationFrame(restoreDynamicPositionsAfterAdminToggle);
        });
    }
}

        /* =========================================================
   فعال کردن ویرایش تمام متن‌های سایت در حالت مدیریت
   ========================================================= */

function enableAdminEditableFields() {

    const textTags = [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'div',
        'a',
        'button',
        'label',
        'li',
        'strong',
        'b',
        'small',
        'em',
        'td',
        'th',
        'caption',
        'figcaption'
    ];

    const selector = textTags.join(',');

    document.querySelectorAll(selector).forEach((el, index) => {

        /* عناصر مدیریتی خود پنل قابل ویرایش نباشند */
        if (
            el.closest('#adminBanner') ||
            el.closest('#adminLoginModal') ||
            el.closest('#questionAdminModal') ||
            el.closest('#questionEditorModal') ||
            el.closest('#iconPickerModal')
        ) {
            return;
        }

        /* عناصر بدون متن واقعی رد شوند */
        const text = el.innerText
            ? el.innerText.trim()
            : '';

        if (!text) {
            return;
        }

        /*
         * اگر قبلاً data-editable دارد،
         * همان شناسه اصلی خودش حفظ شود.
         */
        if (el.closest('[data-editable]') && !el.hasAttribute('data-editable')) {
            return;
        }

        if (!el.hasAttribute('data-editable')) {
            if (el.children.length > 0) {
                return;
            }

            /*
             * ساخت شناسه پایدار برای متن‌های جدید
             */
            const currentView =
                typeof state !== 'undefined' &&
                state.currentView
                    ? state.currentView
                    : 'default';

            const currentLesson =
                window.currentLessonId || '';

            /*
             * مسیر عنصر در DOM
             */
            let path = '';
            let node = el;

            while (
                node &&
                node !== document.body
            ) {

                let parent = node.parentElement;

                if (!parent) {
                    break;
                }

                const children =
                    Array.from(parent.children);

                const position =
                    children.indexOf(node);

                path =
                    node.tagName.toLowerCase() +
                    '-' +
                    position +
                    '/' +
                    path;

                node = parent;
            }

            /*
             * تبدیل شناسه به مقدار امن
             */
            const safeId =
                'auto-text-' +
                currentView +
                '-' +
                currentLesson +
                '-' +
                path
                    .replace(/[^a-zA-Z0-9_-]/g, '_');

            el.setAttribute(
                'data-editable',
                safeId
            );
        }

        /* فعال کردن ویرایش */
        el.setAttribute(
            'contenteditable',
            'true'
        );

        /* جلوگیری از اجرای لینک‌ها و دکمه‌ها هنگام ویرایش */
        if (!el.dataset.adminEditBound) {

            el.addEventListener(
                'focus',
                function () {

                    activeEditableElement = this;

                    updateFontSizeInput();
                }
            );

            el.addEventListener(
                'click',
                function (event) {

                    if (
                        document.body.classList.contains(
                            'admin-mode'
                        )
                    ) {

                        activeEditableElement = this;

                        updateFontSizeInput();

                        /*
                         * اگر در حال ویرایش متن هستیم،
                         * اجرای عملیات اصلی دکمه/لینک متوقف شود.
                         */
                        if (
                            this.tagName === 'BUTTON' ||
                            this.tagName === 'A'
                        ) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                },
                true
            );

            el.addEventListener(
                'keydown',
                function (event) {

                    /*
                     * جلوگیری از Enterهای بی‌نهایت
                     * داخل متن‌های تک‌خطی
                     */
                    if (
                        event.key === 'Enter' &&
                        (
                            this.tagName === 'BUTTON' ||
                            this.tagName === 'A' ||
                            this.tagName === 'SPAN'
                        )
                    ) {
                        event.preventDefault();
                    }
                }
            );

            el.addEventListener(
                'input',
                function () {
                    saveAllEdits(false);
                }
            );

            el.dataset.adminEditBound = 'true';
        }
    });

    /*
     * بعد از شناسایی متن‌های جدید،
     * تغییرات ذخیره‌شده روی آنها اعمال شود.
     */
    loadSavedEdits();
}

        function disableAdminEditableFields() {
            document.querySelectorAll('[data-editable]').forEach(el => {
                el.removeAttribute('contenteditable');
            });
        }

       function applyColorToActiveElement(color) {

    if (!activeEditableElement) {

        alert(
            'لطفاً ابتدا روی متن مورد نظر کلیک کنید.'
        );

        return;
    }

    // اعمال رنگ به متن
    activeEditableElement.style.color = color;
    saveAllEdits(false);

    // هماهنگ کردن رنگ‌پیکر
    const picker =
        document.getElementById(
            'adminColorPicker'
        );

    if (picker) {
        picker.value = color;
    }

}

        // ===============================
// تغییر اندازه متن در حالت مدیریت
// ===============================

function getActiveTextSize() {
    if (!activeEditableElement) {
        return 16;
    }

    const computedSize = window.getComputedStyle(activeEditableElement).fontSize;
    const size = parseFloat(computedSize);

    return Number.isFinite(size) ? size : 16;
}


function updateFontSizeInput() {
    const input = document.getElementById('adminFontSizeInput');

    if (!input) return;

    if (!activeEditableElement) {
        input.value = 16;
        return;
    }

    input.value = Math.round(getActiveTextSize());
}


function setActiveTextSize(value) {
    if (!activeEditableElement) {
        alert('لطفاً ابتدا روی متن مورد نظر کلیک کنید.');
        return;
    }

    let size = parseFloat(value);

    if (!Number.isFinite(size)) {
        size = 16;
    }

    // محدود کردن اندازه بین 8 تا 72 پیکسل
    size = Math.max(8, Math.min(72, size));

    activeEditableElement.style.fontSize = size + 'px';
    const textId = activeEditableElement.getAttribute('data-editable');
    if (textId) {
        let edits = {};
        try {
            edits = JSON.parse(localStorage.getItem('atrak_saved_edits') || '{}');
        } catch (e) {
            edits = {};
        }
        edits[textId] = edits[textId] || {};
        edits[textId].html = activeEditableElement.innerHTML;
        edits[textId].fontSize = size + 'px';
        edits[textId].color = activeEditableElement.style.color || '';
        localStorage.setItem('atrak_saved_edits', JSON.stringify(edits));
        syncStateToCloud();
    }

    const input = document.getElementById('adminFontSizeInput');

    if (input) {
        input.value = size;
    }
}


function changeActiveTextSize(amount) {
    if (!activeEditableElement) {
        alert('لطفاً ابتدا روی متن مورد نظر کلیک کنید.');
        return;
    }

    const currentSize = getActiveTextSize();

    setActiveTextSize(currentSize + amount);
}

      function applyColorToSelectedIcon(color) {
    if (!color || !targetIconSvgElement) {
        alert('ابتدا روی یک آیکون کلیک کنید.');
        return;
    }
    targetIconSvgElement.style.stroke = color;
    targetIconSvgElement.style.color = color;
    let icons = {};
    try { icons = JSON.parse(localStorage.getItem('atrak_saved_icons') || '{}') || {}; } catch(e) { icons = {}; }
    const key = getIconStorageKey(targetIconSvgElement);
    if (key) {
        icons[key] = {
            ...(icons[key] || {}),
            html: targetIconSvgElement.innerHTML,
            hidden: targetIconSvgElement.getAttribute('data-icon-hidden') === 'true' || targetIconSvgElement.style.display === 'none',
            color
        };
        localStorage.setItem('atrak_saved_icons', JSON.stringify(icons));
        syncStateToCloud();
    }
}

function applyIconColorToAll(color) {
    // سازگاری با کدهای قدیمی: دیگر همه آیکون‌ها را هم‌رنگ نمی‌کند.
    applyColorToSelectedIcon(color);
}

    function getIconStorageKey(svg) {
    if (!svg || !svg.classList.contains('topic-icon-svg')) {
        return null;
    }

    // 1. اگر آیکون داخل کارت خدمات یا کارت‌های پایه است،
    //    از شناسه عکس یا onclick همان کارت استفاده کن.
    const card = svg.closest('.service-card, .drilldown-card');

    if (card) {
        const img = card.querySelector('img');

        if (img && img.id) {
            return 'icon-card-img-' + img.id;
        }

        const onclickValue = card.getAttribute('onclick');

        if (onclickValue) {
            return 'icon-card-click-' + encodeURIComponent(onclickValue);
        }
    }

    // 2. اگر آیکون کنار یک متن قابل ویرایش است،
    //    از data-editable همان متن استفاده کن.
    const editable =
        svg.parentElement &&
        svg.parentElement.querySelector('[data-editable]');

    if (editable) {
        const editableKey = editable.getAttribute('data-editable');

        if (editableKey) {
            return 'icon-editable-' + editableKey;
        }
    }

    // 3. برای آیکون‌هایی که در کارت یا متن قابل ویرایش نیستند،
    //    یک کلید بر اساس ساختار خود محل آیکون بساز.
    //    این کلید به شماره آیکون در کل صفحه وابسته نیست.
    const parent = svg.parentElement;

    if (parent) {
        const siblings = Array.from(parent.children);
        const position = siblings.indexOf(svg);

        let parentKey = parent.id;

        if (!parentKey) {
            const className =
                typeof parent.className === 'string'
                    ? parent.className.trim().replace(/\s+/g, '-')
                    : '';

            parentKey = className || parent.tagName.toLowerCase();
        }

        return (
            'icon-parent-' +
            (state.currentView || 'home') +
            '-' +
            parentKey +
            '-' +
            position
        );
    }

    return null;
}

function getLegacyIconStorageKey(svg) {
    const directEditable = svg.closest('[data-editable]');
    if (directEditable && directEditable.getAttribute('data-editable')) {
        return 'ed-' + directEditable.getAttribute('data-editable');
    }

    const parent = svg.parentElement;
    const editable = parent && parent.querySelector('[data-editable]');
    if (editable && editable.getAttribute('data-editable')) {
        return 'ed-' + editable.getAttribute('data-editable');
    }

    const card = svg.closest('.service-card, .drilldown-card');
    if (!card) return null;

    const img = card.querySelector('img');
    if (img && img.id) return 'img-' + img.id;

    const cardEditable = card.querySelector('[data-editable]');
    if (cardEditable && cardEditable.getAttribute('data-editable')) {
        return 'ed-' + cardEditable.getAttribute('data-editable');
    }

    const onclickValue = card.getAttribute('onclick');
    return onclickValue ? 'card-' + encodeURIComponent(onclickValue) : null;
}

    function saveAllEdits(showMessage = true, syncCloud = true) {

    // ==========================================
    // 0. ثبت دقیق موقعیت و اندازه عناصر قابل افزودن
    //    قبل از ذخیره اصلی سایت
    // ==========================================
    // عناصر افزوده‌شده از سیستم «عناصر» باید دقیقاً در همان
    // مختصات فعلی ذخیره شوند؛ این بخش عمداً به خود عناصر دست نمی‌زند.
    try {
        const dynamicItems = getAtrakDynamicElements();
        const byId = new Map(dynamicItems.map(item => [item.id, item]));
        document.querySelectorAll('.atrak-dynamic-item[data-id]').forEach(el => {
            const id = el.dataset.id;
            const item = byId.get(id);
            if (!item) return;

            // فقط مقادیر واقعی فعلی را ثبت کن؛ هیچ موقعیت جدیدی محاسبه نمی‌شود.
            const left = parseFloat(el.style.left);
            const top = parseFloat(el.style.top);
            const width = parseFloat(el.style.width);
            const height = parseFloat(el.style.height);

            if (Number.isFinite(left)) item.x = Math.max(0, left);
            if (Number.isFinite(top)) item.y = Math.max(0, top);
            if (Number.isFinite(width)) item.w = Math.max(70, width);
            if (Number.isFinite(height)) item.h = Math.max(45, height);
        });
        localStorage.setItem(ATRAK_DYNAMIC_STORAGE_KEY, JSON.stringify(dynamicItems));
    } catch (dynamicSaveError) {
        console.warn('ذخیره موقعیت عناصر انجام نشد:', dynamicSaveError);
    }

    // ==========================================
    // 1. ابتدا اطلاعات قبلی متون رو بخون
    // ==========================================

    let edits = {};

    try {
        edits = JSON.parse(
            localStorage.getItem('atrak_saved_edits') || '{}'
        );
    } catch (e) {
        edits = {};
    }


    // ==========================================
    // 2. ذخیره متون قابل ویرایش
    // ==========================================

    document.querySelectorAll('[data-editable]').forEach(el => {

        const id = el.getAttribute('data-editable');

        if (!id) return;

        if (!edits[id]) {
            edits[id] = {};
        }

        edits[id] = {
            html: el.innerHTML,
            color: el.style.color || '',
            fontSize: el.style.fontSize || ''
        };

    });

    localStorage.setItem('atrak_saved_edits', JSON.stringify(edits));


    // ==========================================
    // 3. خواندن وضعیت قبلی آیکون‌ها
    // ==========================================

    let icons = {};

    try {
        icons = JSON.parse(
            localStorage.getItem('atrak_saved_icons') || '{}'
        );
    } catch (e) {
        icons = {};
    }


    // ==========================================
    // 4. ذخیره آیکون‌ها (با حفظ وضعیت مخفی قبلی)
    // ==========================================

    document.querySelectorAll('.topic-icon-svg').forEach(svg => {

    const key = getIconStorageKey(svg);

    if (!key) {
        console.warn('کلید آیکون پیدا نشد:', svg);
        return;
    }

    // وضعیت واقعی فعلی آیکون را ذخیره کن
    const isHidden =
        svg.getAttribute('data-icon-hidden') === 'true' ||
        svg.style.display === 'none';

    icons[key] = {
        html: svg.innerHTML,
        hidden: isHidden,
        color: svg.style.stroke || svg.style.color || ''
    };

});

    localStorage.setItem('atrak_saved_icons', JSON.stringify(icons));


    const cloudSave =
        syncCloud &&
        typeof state !== 'undefined' &&
        state &&
        state.isAdmin === true
            ? Promise.resolve(syncStateToCloud())
            : Promise.resolve();

    if (showMessage) {
        cloudSave.then(() => {
            alert('تمامی تغییرات با موفقیت ذخیره شدند!');
        });
    }

    return cloudSave;
}




      function loadSavedEdits() {

    // =========================
    // بازیابی تغییرات متن‌ها
    // =========================

    const saved = localStorage.getItem('atrak_saved_edits');

    if (saved) {

        try {

            const edits = JSON.parse(saved);

            Object.keys(edits).forEach(id => {

                const el = document.querySelector(
                    `[data-editable="${id}"]`
                );

                if (!el) return;

                // متن ذخیره شده
                if (edits[id].html !== undefined) {
                    el.innerHTML = edits[id].html;
                }

                // رنگ متن
                if (edits[id].color) {
                    el.style.color = edits[id].color;
                }

                // اندازه متن
                if (edits[id].fontSize) {
                    el.style.fontSize = edits[id].fontSize;
                }

            });

        } catch (e) {

            console.log(
                'خطا در بازیابی تنظیمات متن:',
                e
            );

        }

    }


    // =========================
    // بازیابی رنگ آیکون‌ها
    // =========================



    // =========================
    // هماهنگ کردن رنگ متن فعال
    // =========================

    if (activeEditableElement) {

        const color =
            activeEditableElement.style.color;

        const colorPicker =
            document.getElementById(
                'adminColorPicker'
            );

        if (colorPicker && color) {
            colorPicker.value = color;
        }

    }

}

        function loadSavedImages() {
    const savedImages = localStorage.getItem('atrak_saved_images');

    if (!savedImages) return;

    try {
        const images = JSON.parse(savedImages);

        Object.keys(images).forEach(imageId => {
            const img = document.getElementById(imageId);

            if (img && images[imageId]) {
                img.src = images[imageId];
            }
        });

    } catch (e) {
        console.log('خطا در بازیابی تصاویر:', e);
    }
}

        function generate100IconsList() {
            const container = document.getElementById('iconGridContainer');
            if (!container) return;
            container.innerHTML = '';

            iconLibrary100.forEach((svgInner, idx) => {
                const box = document.createElement('div');
                box.style.cssText = 'display:flex; align-items:center; justify-content:center; padding:10px; background:var(--card-bg); border:1px solid var(--card-border); border-radius:8px; cursor:pointer; transition:all 0.2s;';
               box.innerHTML = `<svg class="icon-library-preview" style="margin:0; width:28px; height:28px;" viewBox="0 0 24 24">${svgInner}</svg>`;
                box.onclick = () => selectIconForTarget(svgInner);
                box.onmouseover = () => box.style.background = 'var(--card-hover-bg)';
                box.onmouseout = () => box.style.background = 'var(--card-bg)';
                container.appendChild(box);
            });
        }
function openIconPicker(e, targetSvg) {
            e.stopPropagation();
            
            // اگه حالت مدیریت نیست، کاری نکن
            if (!state.isAdmin) {
                return;
            }
            
            targetIconSvgElement = targetSvg;
            openModal('iconPickerModal');
        }



        function selectIconForTarget(svgInner) {
            if (targetIconSvgElement) {
                targetIconSvgElement.innerHTML = svgInner;
                    saveIconState(targetIconSvgElement);
            }
            closeModal('iconPickerModal');
        }

      function triggerImageUpload(imageId) {
    if (!state.isAdmin) return;

    const uploader = document.getElementById('globalImageUploader');

    uploader.onchange = (evt) => {
        const file = evt.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            const img = document.getElementById(imageId);

            if (img) {
                const imageData = e.target.result;

                // نمایش عکس جدید
                img.src = imageData;

                // ذخیره دائمی عکس
                let savedImages = {};

                try {
                    savedImages = JSON.parse(
                        localStorage.getItem('atrak_saved_images') || '{}'
                    );
                } catch (e) {
                    savedImages = {};
                }

                savedImages[imageId] = imageData;

                localStorage.setItem(
                    'atrak_saved_images',
                    JSON.stringify(savedImages)
                );
                syncStateToCloud();

                // ذخیره فوری
                console.log('عکس ذخیره شد:', imageId);
            }
        };

        reader.readAsDataURL(file);

        // برای اینکه بتوان همان فایل را دوباره انتخاب کرد
        uploader.value = '';
    };

    uploader.click();
}

        /* =========================================================
           ورود دانش آموز و دسترسی دائمی به سامانه محتوا
           ذخیره محلی برای همان مرورگر/دستگاه
           ========================================================= */
        /*
           نام دانش‌آموز فقط روی همین مرورگر/دستگاه ذخیره می‌شود.
           هیچ‌کدام از این کلیدها وارد Supabase یا state مشترک سایت نمی‌شوند.
        */
      /* =========================================================
   ورود دانش آموز - نسخه ایزوله و امن
   هر مرورگر فقط نشست فعال خودش را نگه می دارد.
   نام بعد از خروج کاملاً پاک می شود.
   ========================================================= */

const STUDENT_LOGIN_STORAGE_KEY = 'atrak_student_login_v3';

/* ---------------------------------------------------------
   دریافت نشست فعال دانش آموز
   --------------------------------------------------------- */
function getStudentSession() {
    try {
        const raw = sessionStorage.getItem(STUDENT_LOGIN_STORAGE_KEY);

        if (!raw) {
            return null;
        }

        const data = JSON.parse(raw);

        if (
            !data ||
            typeof data.username !== 'string' ||
            !data.username.trim()
        ) {
            return null;
        }

        return {
            username: data.username.trim()
        };

    } catch (e) {
        return null;
    }
}


/* ---------------------------------------------------------
   آیا دانش آموز وارد شده است؟
   --------------------------------------------------------- */
function isStudentLoggedIn() {
    return !!getStudentSession();
}


/* ---------------------------------------------------------
   به‌روزرسانی کادر ورود در هدر
   فقط نشست فعال اجازه نمایش نام را دارد.
   --------------------------------------------------------- */
function updateStudentLoginButton() {

    const btn = document.getElementById('studentLoginBtn');
    const label = document.getElementById('studentLoginLabel');

    if (!btn || !label) {
        return;
    }

    const session = getStudentSession();

    if (session && session.username) {

        label.textContent = session.username;

        btn.title = 'حساب دانش آموز: ' + session.username;

        btn.dataset.studentName = session.username;

        btn.classList.add('student-logged-in');

    } else {

        /* بعد از خروج */
        label.textContent = 'ورود';

        btn.title = 'ورود دانش آموز';

        delete btn.dataset.studentName;

        btn.classList.remove('student-logged-in');
    }
}


/* ---------------------------------------------------------
   باز کردن پنجره ورود
   --------------------------------------------------------- */
function promptStudentLogin() {

    const session = getStudentSession();

    const usernameInput =
        document.getElementById('studentUsernameInput');

    const passwordInput =
        document.getElementById('studentPasswordInput');

    const error =
        document.getElementById('studentLoginError');

    const logoutBtn =
        document.getElementById('studentLogoutBtn');


    /* پاک کردن خطا */
    if (error) {
        error.style.display = 'none';
        error.textContent = '';
    }


    /*
       اگر کاربر همین الان وارد است،
       نام خودش نمایش داده می‌شود.

       اگر وارد نیست،
       فیلد نام کاملاً خالی خواهد بود.
    */
    if (usernameInput) {
        usernameInput.value =
            session ? session.username : '';
    }


    if (passwordInput) {
        passwordInput.value = '';
    }


    if (logoutBtn) {
        logoutBtn.style.display =
            session ? 'inline-flex' : 'none';
    }


    openModal('studentLoginModal');


    setTimeout(function () {

        if (session) {

            if (passwordInput) {
                passwordInput.focus();
            }

        } else {

            if (usernameInput) {
                usernameInput.focus();
            }
        }

    }, 60);
}


/* ---------------------------------------------------------
   ورود دانش آموز
   --------------------------------------------------------- */
function loginStudent() {

    const usernameInput =
        document.getElementById('studentUsernameInput');

    const passwordInput =
        document.getElementById('studentPasswordInput');

    const error =
        document.getElementById('studentLoginError');


    const username =
        (usernameInput ? usernameInput.value : '').trim();

    const password =
        passwordInput ? passwordInput.value : '';


    /* نام وارد نشده */
    if (!username) {

        if (error) {
            error.textContent =
                'لطفاً نام کاربری را وارد کنید.';

            error.style.display = 'block';
        }

        return;
    }


    /* بررسی رمز */
    if (password !== LMS_PASSCODE) {

        if (error) {
            error.textContent =
                'رمز عبور نادرست است.';

            error.style.display = 'block';
        }

        return;
    }


    /*
       فقط نشست همین کاربر در sessionStorage ذخیره می‌شود.

       نکته مهم:
       localStorage دیگر برای نام دانش‌آموز استفاده نمی‌شود.
       بنابراین نام قبلی به عنوان اطلاعات دائمی باقی نمی‌ماند.
    */
    try {

        sessionStorage.setItem(
            STUDENT_LOGIN_STORAGE_KEY,
            JSON.stringify({
                username: username,
                loginAt: Date.now()
            })
        );

    } catch (e) {

        if (error) {
            error.textContent =
                'ذخیره نشست ورود انجام نشد. دوباره تلاش کنید.';

            error.style.display = 'block';
        }

        return;
    }


    /* نمایش فوری نام در هدر */
    const loginButton =
        document.getElementById('studentLoginBtn');

    const loginLabel =
        document.getElementById('studentLoginLabel');


    if (loginLabel) {
        loginLabel.textContent = username;
    }


    if (loginButton) {

        loginButton.dataset.studentName = username;

        loginButton.title =
            'حساب دانش آموز: ' + username;

        loginButton.classList.add(
            'student-logged-in'
        );
    }


    updateStudentLoginButton();


    /* بستن پنجره ورود */
    closeModal('studentLoginModal');


    /* پیام دسترسی */
    showStudentLmsAccessNotice();


    /* رفتن به سامانه محتوا */
    navigateTo('lms-portal');


    /*
       اطمینان از اینکه اگر رندر صفحه
       هدر را دوباره ساخت، نام برگردد.
    */
    requestAnimationFrame(
        updateStudentLoginButton
    );

    setTimeout(
        updateStudentLoginButton,
        50
    );

    setTimeout(
        updateStudentLoginButton,
        250
    );
}


/* ---------------------------------------------------------
   پیام دسترسی سامانه محتوا
   --------------------------------------------------------- */
function showStudentLmsAccessNotice() {

    const notice =
        document.getElementById(
            'studentLmsAccessNotice'
        );

    if (!notice) {
        return;
    }


    notice.classList.remove('show');

    void notice.offsetWidth;

    notice.classList.add('show');


    clearTimeout(
        window.__studentLmsNoticeTimer
    );


    window.__studentLmsNoticeTimer =
        setTimeout(function () {

            notice.classList.remove('show');

        }, 6000);
}


/* ---------------------------------------------------------
   خروج کامل دانش آموز
   --------------------------------------------------------- */
function logoutStudent() {

    /*
       حذف کامل نشست فعلی
    */
    try {
        sessionStorage.removeItem(
            STUDENT_LOGIN_STORAGE_KEY
        );
    } catch (e) {}


    /*
       پاک کردن فوری نام از هدر
    */
    const loginButton =
        document.getElementById('studentLoginBtn');

    const loginLabel =
        document.getElementById('studentLoginLabel');


    if (loginLabel) {
        loginLabel.textContent = 'ورود';
    }


    if (loginButton) {

        loginButton.title =
            'ورود دانش آموز';

        delete loginButton.dataset.studentName;

        loginButton.classList.remove(
            'student-logged-in'
        );
    }


    /*
       پاک کردن فیلدهای فرم
    */
    const usernameInput =
        document.getElementById(
            'studentUsernameInput'
        );

    const passwordInput =
        document.getElementById(
            'studentPasswordInput'
        );

    const logoutBtn =
        document.getElementById(
            'studentLogoutBtn'
        );


    if (usernameInput) {
        usernameInput.value = '';
    }


    if (passwordInput) {
        passwordInput.value = '';
    }


    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }


    /*
       پاک کردن پیام خطا
    */
    const error =
        document.getElementById(
            'studentLoginError'
        );

    if (error) {
        error.textContent = '';
        error.style.display = 'none';
    }


    /*
       اطمینان نهایی
    */
    updateStudentLoginButton();


    /*
       بستن پنجره
    */
    closeModal('studentLoginModal');
}
        function isStudentProtectedView(viewKey) {
            if (!viewKey) return false;
            return viewKey === 'lms-portal' ||
                   viewKey === 'lms-theory' ||
                   viewKey === 'lms-theory-m1' ||
                   viewKey === 'lms-theory-m2' ||
                   viewKey === 'lms-kardanesh' ||
                   viewKey === 'lesson-videos' ||
                   viewKey === 'lesson-video-chapter' ||
                   viewKey === 'content' ||
                   /^m1-p[789]/.test(viewKey) ||
                   /^m2-/.test(viewKey);
        }

        function openLmsModal() {
            if (isStudentLoggedIn()) {
                navigateTo('lms-portal');
                return;
            }

            const error = document.getElementById('studentLoginError');
            if (error) {
                error.textContent = 'ابتدا از بخش «ورود» در هدر بالای صفحه وارد حساب دانش آموز شوید.';
                error.style.display = 'block';
            }
            promptStudentLogin();
        }

        function verifyLmsPasscode() {
            const val = document.getElementById('lmsPasscode').value;
            if (val === LMS_PASSCODE) {
                closeModal('passwordModal');
                navigateTo('lms-portal');
            } else {
                document.getElementById('passcodeError').style.display = 'block';
            }
        }

        function openModal(id) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'flex';
        }

        function closeModal(id) {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        }

        function toggleChatModal() {
            const chat = document.getElementById('chatModal');
            if (chat) chat.style.display = chat.style.display === 'flex' ? 'none' : 'flex';
        }

        function handleChatEnter(e) {
            if (e.key === 'Enter') sendChatMessage();
        }

        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const text = input.value.trim();
            if (!text) return;

            const body = document.getElementById('chatMessages');
            const userBubble = document.createElement('div');
            userBubble.className = 'msg-bubble msg-user';
            userBubble.innerText = text;
            body.appendChild(userBubble);

            input.value = '';
            body.scrollTop = body.scrollHeight;

            setTimeout(() => {
                const botBubble = document.createElement('div');
                botBubble.className = 'msg-bubble msg-bot';
                botBubble.innerText = 'پیام شما دریافت شد. کارشناسان ما به زودی با شما تماس خواهند گرفت. جهت مشاوره فوری با شماره ۰۹۹۰۵۱۱۷۰۱۷ تماس بگیرید.';
                body.appendChild(botBubble);
                body.scrollTop = body.scrollHeight;
            }, 1000);
        }

        function toggleFaq(faqItem) {
            faqItem.classList.toggle('open');
        }

        function initCarousel() {
            state.carouselIndex = 0;
            updateCarouselPosition();
        }

        function moveCarousel(direction) {
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            const totalSlides = track.children.length;
            state.carouselIndex = (state.carouselIndex + direction + totalSlides) % totalSlides;
            updateCarouselPosition();
        }

        function setSlide(index) {
            state.carouselIndex = index;
            updateCarouselPosition();
        }

        function updateCarouselPosition() {
            const track = document.getElementById('carouselTrack');
            if (!track) return;
            track.style.transform = `translateX(${state.carouselIndex * 100}%)`;

            const dots = document.querySelectorAll('#carouselDots .dot');
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === state.carouselIndex);
            });
        }
        (function(){
    function updateAtrakMobileHeaderOffsets(){
        if(!window.matchMedia('(max-width:700px)').matches) return;
        const main = document.querySelector('.top-navbar');
        const second = document.getElementById('atrakSecondNavbar');
        if(main){
            document.documentElement.style.setProperty(
                '--atrak-mobile-main-header-h',
                Math.ceil(main.getBoundingClientRect().height) + 'px'
            );
        }
        if(second){
            document.documentElement.style.setProperty(
                '--atrak-mobile-second-header-h',
                Math.ceil(second.getBoundingClientRect().height) + 'px'
            );
        }
    }
    window.addEventListener('load', updateAtrakMobileHeaderOffsets);
    window.addEventListener('resize', updateAtrakMobileHeaderOffsets);
    setTimeout(updateAtrakMobileHeaderOffsets, 150);
    setTimeout(updateAtrakMobileHeaderOffsets, 600);
})();
document.addEventListener("DOMContentLoaded", () => {

    const elements = document.querySelectorAll(".slide-up-stagger");

    elements.forEach((element, index) => {
        element.style.setProperty(
            "--stagger-delay",
            `${index * 100}ms`
        );
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.12
        }
    );

    elements.forEach((element) => {
        observer.observe(element);
    });

});
