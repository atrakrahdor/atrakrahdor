/* =========================================================
   nav-fix.js  —  ناوبری یکپارچه و دقیق سایت اترک

   این فایل باید «آخرین» اسکریپت پروژه در index.html باشد.

   مشکل قبلی:
   • صفحه‌های پویا (سوالات، فیلم‌ها، جزوه‌ها، ...) داخل views نبودند؛
     renderCurrentView برای آن‌ها «صفحه اصلی» را نشان می‌داد و دکمه‌ی بک
     کاربر را به صفحه‌ی اول می‌فرستاد.
   • بعضی صفحه‌ها اصلاً در تاریخچه ثبت نمی‌شدند (currentView عوض نمی‌شد).
   • دکمه‌های «بازگشت» داخل صفحه‌ها با location.reload() یا با برگرداندن
     HTML ذخیره‌شده کار می‌کردند و تاریخچه را به‌هم می‌ریختند.
   • تاریخچه در localStorage مشترک بین تب‌ها بود و بعد از باز کردن دوباره‌ی
     سایت با صفحه‌ی نمایش‌داده‌شده هماهنگ نبود.

   راه‌حل:
   هر صفحه (ثابت یا پویا) به‌صورت یک «ورودی» با راه‌ساز خودش
   (نام تابع بازکننده + آرگومان‌ها) در یک پشته‌ی تاریخچه ثبت می‌شود.
   بک / فوروارد / بک مرورگر / دکمه‌های «بازگشت» داخل صفحه / F5
   همه از همین یک پشته استفاده می‌کنند و صفحه را با همان راه‌ساز
   دوباره می‌سازند.
   ========================================================= */
(function () {
    'use strict';
    if (window.AtrakNav) return;

    var STORE_KEY = 'atrak_nav_v2';       // sessionStorage (مخصوص هر تب)
    var OLD_STORE_KEY = 'atrak_navigation_history_v1';
    var MAX_ENTRIES = 60;
    var SENTINEL = 'atrakNav';

    /* تابع‌هایی که یک «صفحه‌ی کامل» داخل #mainAppContent می‌سازند.
       مقدار true یعنی فقط برای دانش‌آموز/مدیر واردشده در دسترس است. */
    var PAGE_OPENERS = {
        openQuestionCategories: true,
        openQuestionCategory: true,
        openQuestionChapter: true,
        openLessonQuestions: true,
        showQuestionList: true,
        openM1QuestionList: true,
        showLessonContent: true,
        openLessonVideos: true,
        openLessonVideoChapter: true,
        openLessonNotes: true,
        openAtrakNews: false
    };

    var stack = [];          // ورودی‌ها: {k, fn, args, sig, cv, scroll}
    var idx = 0;             // اندیس صفحه‌ی فعلی
    var ready = true;        // آیا پشته با چیزی که روی صفحه است هماهنگ است؟
    var restoreCancelled = false;
    var restoreStarted = false;
    var savedForRestore = null;

    var busy = 0;            // پنجره‌ی «این تغییر محتوا کار خود ماست»
    var syncDepth = 0;       // فراخوانی تو در توی بازکننده‌ها
    var replaying = 0;       // در حال بازسازی یک ورودی از تاریخچه
    var contentSets = 0;     // تعداد دفعاتی که محتوای اصلی عوض شده
    var dirty = false;       // صفحه‌ای ثبت‌نشده (مثلاً پنل مدیریت) روی صفحه است

    var browserHistoryOk = true;

    /* ---------------------------------------------------------
       ابزارهای کمکی
       --------------------------------------------------------- */

    function $(id) { return document.getElementById(id); }

    function homeEntry() {
        return { k: 'home', fn: null, args: [], sig: 'v:home', cv: 'home', scroll: 0 };
    }

    function isPrimitive(v) {
        return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
    }

    function cleanArgs(list) {
        var out = [];
        for (var i = 0; i < list.length; i++) out.push(isPrimitive(list[i]) ? (list[i] == null ? null : list[i]) : null);
        while (out.length && out[out.length - 1] === null) out.pop();
        return out;
    }

    function sigOf(fn, args) {
        return fn ? ('f:' + fn + ':' + JSON.stringify(args)) : null;
    }

    function allowed() {
        try {
            return !!(state && state.isAdmin) ||
                (typeof isStudentLoggedIn === 'function' && isStudentLoggedIn());
        } catch (e) { return false; }
    }

    function needsLogin(entry) {
        if (!entry) return false;
        if (entry.fn) return PAGE_OPENERS[entry.fn] !== false;
        try {
            return typeof isStudentProtectedView === 'function' && isStudentProtectedView(entry.k);
        } catch (e) { return false; }
    }

    function toast(msg) {
        if (typeof showToast === 'function') { try { showToast(msg); } catch (e) {} }
    }

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ---------------------------------------------------------
       ذخیره و خواندن (برای F5)
       --------------------------------------------------------- */

    function persist() {
        try {
            var slim = stack.map(function (e) {
                return { k: e.k, fn: e.fn, args: e.args, cv: e.cv, scroll: e.scroll || 0 };
            });
            sessionStorage.setItem(STORE_KEY, JSON.stringify({ v: 2, idx: idx, stack: slim }));
        } catch (e) { /* ذخیره‌سازی در دسترس نیست */ }
    }

    function readStore() {
        try {
            var raw = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
            if (!raw || raw.v !== 2 || !Array.isArray(raw.stack) || !raw.stack.length) return null;
            var list = [];
            raw.stack.forEach(function (e) {
                if (!e || typeof e.k !== 'string') return;
                var args = Array.isArray(e.args) ? e.args : [];
                if (e.fn) {
                    if (!Object.prototype.hasOwnProperty.call(PAGE_OPENERS, e.fn)) return;
                } else if (e.k !== 'home' && !(typeof views !== 'undefined' && views[e.k])) {
                    return;
                }
                list.push({
                    k: e.k, fn: e.fn || null, args: args,
                    sig: e.fn ? sigOf(e.fn, args) : 'v:' + e.k,
                    cv: e.cv || e.k, scroll: Number(e.scroll) || 0
                });
            });
            if (!list.length) return null;
            if (list[0].fn || list[0].k !== 'home') list.unshift(homeEntry());
            var i = Math.max(0, Math.min(Number(raw.idx) || 0, list.length - 1));
            return { stack: list, idx: i };
        } catch (e) { return null; }
    }

    /* ---------------------------------------------------------
       دکمه‌های قبلی / بعدی در هدر
       --------------------------------------------------------- */

    function updateButtons() {
        var b = $('btnBack');
        var f = $('btnForward');
        if (b) b.disabled = !(idx > 0 || dirty);
        if (f) f.disabled = !(idx < stack.length - 1);
    }

    function mirrorState() {
        try {
            state.history = stack.map(function (e) { return e.fn || e.k; });
            state.historyIndex = idx;
        } catch (e) {}
    }

    function afterNav() {
        mirrorState();
        persist();
        updateButtons();
        ensureSentinel();
    }

    /* ---------------------------------------------------------
       ثبت یک صفحه در پشته
       --------------------------------------------------------- */

    function ensureReady() {
        if (ready) return;
        // کاربر قبل از بازگردانی خودکار، خودش جایی رفته: صفحه‌ی نمایش‌داده‌شده «خانه» است.
        stack = [homeEntry()];
        idx = 0;
        ready = true;
        restoreCancelled = true;
    }

    /* data: {k, fn, args, sig, cv} ؛ leaveScroll: اسکرول صفحه‌ای که ترک می‌شود */
    function commit(data, leaveScroll) {
        ensureReady();
        var cur = stack[idx];
        if (cur) cur.scroll = leaveScroll || 0;

        // همان صفحه‌ی فعلی (تازه‌سازی): ورودی جدید نمی‌سازیم
        if (cur && cur.sig === data.sig) {
            cur.args = data.args;
            cur.cv = data.cv;
            dirty = false;
            afterNav();
            return 'refresh';
        }

        // صفحه‌ای که قبلاً در تاریخچه بوده (مثلاً دکمه‌ی «بازگشت» داخل صفحه یا مسیر
        // breadcrumb): یعنی کاربر به عقب برگشته، نه این‌که صفحه‌ی جدیدی باز کرده.
        for (var j = idx - 1; j >= 0; j--) {
            if (stack[j].sig === data.sig) {
                stack.length = j + 1;
                idx = j;
                stack[j].args = data.args;
                stack[j].cv = data.cv;
                dirty = false;
                afterNav();
                return 'back';
            }
        }

        stack.length = idx + 1;                    // آینده‌ی قبلی حذف می‌شود
        stack.push({ k: data.k, fn: data.fn, args: data.args, sig: data.sig, cv: data.cv, scroll: 0 });
        if (stack.length > MAX_ENTRIES) stack.splice(1, 1);   // «خانه» همیشه اولین ورودی می‌ماند
        idx = stack.length - 1;
        dirty = false;
        afterNav();
        return 'push';
    }

    /* ---------------------------------------------------------
       ساخت دوباره‌ی یک ورودی از تاریخچه
       --------------------------------------------------------- */

    var origRender = window.renderCurrentView;      // نسخه‌ی نهایی (با لایه‌ی lms-fix)

    function renderPassThrough() {
        busy++;
        try { return origRender.apply(window, arguments); }
        finally { busy--; }
    }

    function holdBusy(promise) {
        // تا پایان کار بازکننده‌ی ناهمگام، تغییر محتوا «کار خود ماست»
        busy++;
        var released = false;
        function release() { if (!released) { released = true; busy--; } }
        var timer = setTimeout(release, 15000);
        promise.then(function () { clearTimeout(timer); release(); },
                     function () { clearTimeout(timer); release(); });
    }

    function replay(entry, opts) {
        opts = opts || {};
        var result;
        replaying++;
        busy++;
        try {
            if (entry.fn) {
                var f = window[entry.fn];
                if (typeof f !== 'function') throw new Error('بازکننده‌ی صفحه پیدا نشد: ' + entry.fn);
                var args = (entry.args || []).slice();
                if (entry.fn === 'openQuestionChapter') {
                    while (args.length < 5) args.push(null);
                    args[5] = { silent: true };
                }
                result = f.apply(window, args);
            } else {
                state.currentView = entry.k;
                result = origRender.call(window);
            }
        } catch (err) {
            busy--;
            throw err;
        } finally {
            replaying--;
        }
        var p = Promise.resolve(result);
        var released = false;
        function release() { if (!released) { released = true; busy--; } }
        var timer = setTimeout(release, 15000);
        return p.then(function (v) { clearTimeout(timer); release(); return v; },
                      function (e) { clearTimeout(timer); release(); throw e; });
    }

    function restoreScroll(y) {
        var top = Number(y) || 0;
        try { window.scrollTo({ top: top, behavior: 'instant' }); } catch (e) { window.scrollTo(0, top); }
        setTimeout(function () {
            try { window.scrollTo({ top: top, behavior: 'instant' }); } catch (e) { window.scrollTo(0, top); }
        }, 150);
    }

    function fallbackHome() {
        stack = [homeEntry()];
        idx = 0;
        dirty = false;
        try {
            return replay(stack[0]).then(function () { afterNav(); restoreScroll(0); });
        } catch (e) {
            afterNav();
            return Promise.resolve();
        }
    }

    /* رفتن به ورودی t از پشته */
    function moveTo(t) {
        ensureReady();
        if (t < 0 || t >= stack.length) return Promise.resolve();

        var cur = stack[idx];
        if (cur) cur.scroll = window.scrollY || 0;

        // صفحه‌ی نیازمند ورود، ولی کاربر دیگر وارد نیست: به نزدیک‌ترین صفحه‌ی عمومی قبل از آن برو
        if (needsLogin(stack[t]) && !allowed()) {
            var k = t;
            while (k > 0 && needsLogin(stack[k])) k--;
            stack.length = k + 1;
            t = k;
        }

        var entry = stack[t];
        idx = t;
        dirty = false;
        afterNav();

        var p;
        try {
            p = replay(entry);
        } catch (err) {
            return failEntry(t, err);
        }
        return p.then(function () {
            restoreScroll(entry.scroll);
            afterNav();
        }, function (err) { return failEntry(t, err); });
    }

    function failEntry(t, err) {
        try { console.warn('[nav-fix] بازسازی صفحه ناموفق بود:', err); } catch (e) {}
        // ورودی خراب حذف می‌شود و به ورودی سالم قبلی می‌رویم
        stack.splice(t, 1);
        idx = Math.max(0, Math.min(t - 1, stack.length - 1));
        if (!stack.length || (stack[0].fn || stack[0].k !== 'home')) stack.unshift(homeEntry());
        var entry = stack[idx];
        afterNav();
        try {
            return replay(entry).then(function () { restoreScroll(entry.scroll); afterNav(); },
                                      function () { return fallbackHome(); });
        } catch (e2) { return fallbackHome(); }
    }

    /* ---------------------------------------------------------
       عملیات عمومی: back / forward / refresh
       --------------------------------------------------------- */

    function canBack() { return ready ? (idx > 0 || dirty) : true; }

    function back() {
        ensureReady();
        // صفحه‌ای ثبت‌نشده (مثل پنل مدیریت) روی صفحه است: به صفحه‌ی ثبت‌شده‌ی زیرِ آن برگرد
        if (dirty) {
            dirty = false;
            return moveTo(idx);
        }
        if (idx > 0) return moveTo(idx - 1);
        return Promise.resolve();
    }

    function forward() {
        ensureReady();
        if (idx < stack.length - 1) return moveTo(idx + 1);
        return Promise.resolve();
    }

    function refreshCurrent() {
        if (!ready || dirty) return Promise.resolve();
        var cur = stack[idx];
        if (!cur) return Promise.resolve();
        var y = window.scrollY || 0;
        try {
            return replay(cur).then(function () { restoreScroll(y); }, function () {});
        } catch (e) { return Promise.resolve(); }
    }

    /* ---------------------------------------------------------
       جایگزین navigateTo (صفحه‌های ثابت)
       --------------------------------------------------------- */

    function goStatic(viewKey) {
        var leave = window.scrollY || 0;
        commit({ k: viewKey, fn: null, args: [], sig: 'v:' + viewKey, cv: viewKey }, leave);
        state.currentView = viewKey;
        renderPassThrough();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.navigateTo = function (viewKey) {
        /* خدمات روی همان بخش خدمات صفحه‌ی اصلی باز می‌شود */
        if (viewKey === 'services') {
            goStatic('home');
            setTimeout(function () {
                var services = document.getElementById('homeServicesGrid');
                if (services) services.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 140);
            return;
        }

        if (!views[viewKey]) {
            toast('این صفحه در حال حاضر در دسترس نیست.');
            return;
        }

        if (isStudentProtectedView(viewKey) && !isStudentLoggedIn()) {
            promptStudentLogin();
            var error = document.getElementById('studentLoginError');
            if (error) {
                error.textContent = 'ابتدا از بخش «ورود» در هدر بالای صفحه وارد حساب دانش آموز شوید.';
                error.style.display = 'block';
            }
            return;
        }

        goStatic(viewKey);
    };

    window.navGoBack = function () { return back(); };
    window.navGoForward = function () { return forward(); };
    window.updateNavHistoryButtons = updateButtons;

    /* هر جای سایت که renderCurrentView را مستقیم صدا بزند (Realtime، تغییر تم، ...)
       صفحه‌ی پویا به صفحه‌ی اصلی تبدیل نمی‌شود و صفحه‌ی ثابتِ جدید هم ثبت می‌شود. */
    window.renderCurrentView = function () {
        if (busy > 0 || replaying > 0 || !ready) return renderPassThrough.apply(this, arguments);

        var cur = stack[idx];
        var key = state.currentView;

        if (cur && cur.fn && key === cur.cv) {
            if (dirty) return;            // مثلاً پنل مدیریت باز است؛ آن را خراب نکن
            return refreshCurrent();      // تازه‌سازی همان صفحه‌ی پویا
        }

        if (views[key] && (!cur || cur.sig !== 'v:' + key)) {
            commit({ k: key, fn: null, args: [], sig: 'v:' + key, cv: key }, window.scrollY || 0);
        }
        return renderPassThrough.apply(this, arguments);
    };

    /* ---------------------------------------------------------
       پوشاندن بازکننده‌های صفحه‌های پویا
       --------------------------------------------------------- */

    function wrapOpener(name) {
        var orig = window[name];
        if (typeof orig !== 'function' || orig.__atrakNav) return;

        var wrapped = function () {
            var args = Array.prototype.slice.call(arguments);

            // بازسازی از تاریخچه یا فراخوانی تو در توی بازکننده‌ها: ثبت جدید نداریم
            if (replaying > 0 || syncDepth > 0) return orig.apply(this, args);

            var leave = window.scrollY || 0;
            var cvBefore = state.currentView;
            var setsBefore = contentSets;
            var result;

            syncDepth++;
            busy++;
            try {
                result = orig.apply(this, args);
            } catch (err) {
                busy--;
                throw err;
            } finally {
                syncDepth--;
            }

            var thenable = !!(result && typeof result.then === 'function');
            if (thenable) { busy--; holdBusy(Promise.resolve(result)); }
            else { busy--; }

            var navigated = thenable || contentSets !== setsBefore || state.currentView !== cvBefore;
            if (navigated) {
                var clean = cleanArgs(args);
                commit({
                    k: name, fn: name, args: clean, sig: sigOf(name, clean),
                    cv: state.currentView
                }, leave);
            }
            return result;
        };
        wrapped.__atrakNav = true;
        window[name] = wrapped;
    }

    Object.keys(PAGE_OPENERS).forEach(wrapOpener);

    /* «بازگشت از فیلم‌ها» قبلاً location.reload() می‌کرد (= صفحه اصلی) */
    (function () {
        var origBack = window.openLessonVideosBack;
        window.openLessonVideosBack = function () {
            if (canBack()) return back();
            if (typeof origBack === 'function') return origBack.apply(this, arguments);
        };
    })();

    /* ---------------------------------------------------------
       تشخیص صفحه‌ی ثبت‌نشده (مثل پنل‌های مدیریت)
       هر تغییر محتوای اصلی که «کار ما» نباشد، یعنی صفحه‌ی ثبت‌نشده.
       --------------------------------------------------------- */

    (function hookContent() {
        var container = $('mainAppContent');
        if (!container) return;
        var desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        if (!desc || !desc.set) return;
        Object.defineProperty(container, 'innerHTML', {
            configurable: true,
            get: function () { return desc.get.call(this); },
            set: function (value) {
                contentSets++;
                dirty = busy > 0 ? false : true;
                desc.set.call(this, value);
                updateButtons();
            }
        });
    })();

    /* ---------------------------------------------------------
       دکمه‌های «← بازگشت» داخل صفحه‌ها = دقیقاً همان بک تاریخچه
       --------------------------------------------------------- */

    document.addEventListener('click', function (e) {
        if (!e.target || !e.target.closest) return;
        var btn = e.target.closest('button, a, [role="button"]');
        var container = $('mainAppContent');
        if (!btn || !container || !container.contains(btn)) return;
        if (btn.hasAttribute('data-nav-native')) return;
        if (dirty || !ready || idx <= 0) return;

        var text = (btn.textContent || '').replace(/\s+/g, ' ').trim();
        if (!/^[←➔→⬅↩\s]*بازگشت/.test(text)) return;
        if (/صفحه اصلی|خانه/.test(text)) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        back();
    }, true);

    /* ---------------------------------------------------------
       دکمه‌ی بک / فوروارد مرورگر و موبایل
       --------------------------------------------------------- */

    function stateObj(kind) { var o = {}; o[SENTINEL] = kind; return o; }

    function ensureSentinel() {
        if (!browserHistoryOk) return;
        try {
            if (!history.state || history.state[SENTINEL] !== 'top') {
                history.pushState(stateObj('top'), '');
            }
        } catch (e) { browserHistoryOk = false; }
    }

    function initBrowserHistory() {
        try {
            var st = history.state;
            if (!(st && st[SENTINEL] === 'top')) {
                history.replaceState(stateObj('base'), '');
                history.pushState(stateObj('top'), '');
            }
        } catch (e) { browserHistoryOk = false; return; }

        window.addEventListener('popstate', function (ev) {
            if (!browserHistoryOk) return;
            var kind = ev.state && ev.state[SENTINEL];
            if (kind === 'top') return;       // فوروارد مرورگر روی نگهبان: نادیده

            if (canBack() && (kind === 'base' || kind == null)) {
                back();
                ensureSentinel();     // idempotent: فقط اگر نگهبان نبود اضافه می‌کند
            } else if (kind === 'base') {
                // در صفحه‌ی اصلیِ ریشه هستیم: بگذار کاربر از سایت خارج شود
                try { history.back(); } catch (e) {}
            }
        });
    }

    /* ---------------------------------------------------------
       بازگردانی بعد از F5 (با کل تاریخچه)
       --------------------------------------------------------- */

    async function restoreOnLoad() {
        if (restoreStarted) return;
        restoreStarted = true;
        if (ready || !savedForRestore) { ready = true; return; }

        var entry = stack[idx];

        // اگر مدیر بوده، صبر کن نشست مدیر برگردد (حداکثر ۴ ثانیه)
        var hasToken = false;
        try { hasToken = !!sessionStorage.getItem('atrak_admin_access_token'); } catch (e) {}
        if (hasToken) {
            for (var i = 0; i < 40 && !(state && state.isAdmin); i++) await sleep(100);
        }

        if (restoreCancelled || ready) return;   // کاربر خودش جای دیگری رفته

        if (!entry || (!entry.fn && entry.k === 'home')) {
            ready = true; afterNav(); return;
        }

        if (needsLogin(entry) && !allowed()) {
            stack = [homeEntry()]; idx = 0; ready = true; afterNav(); return;
        }

        ready = true;
        try {
            await replay(entry);
            restoreScroll(entry.scroll);
            afterNav();
        } catch (err) {
            try { console.warn('[nav-fix] بازگردانی بعد از F5 ناموفق بود:', err); } catch (e) {}
            await failEntry(idx, err);
        }
    }

    /* main.js پس از بارگذاری کامل سایت، startAtrakRealtime را صدا می‌زند؛
       همان‌جا بهترین زمان بازگردانی صفحه است. */
    (function () {
        var origStart = window.startAtrakRealtime;
        window.startAtrakRealtime = async function () {
            try { await restoreOnLoad(); } catch (e) { console.warn('[nav-fix]', e); }
            if (typeof origStart === 'function') return origStart.apply(this, arguments);
        };
    })();

    /* ---------------------------------------------------------
       راه‌اندازی
       --------------------------------------------------------- */

    try { localStorage.removeItem(OLD_STORE_KEY); } catch (e) {}

    var loaded = readStore();
    if (loaded && (loaded.idx > 0 || loaded.stack.length > 1)) {
        stack = loaded.stack;
        idx = loaded.idx;
        savedForRestore = loaded;
        ready = false;             // تا بازگردانی کامل شود (یا کاربر خودش حرکت کند)
    } else {
        stack = [homeEntry()];
        idx = 0;
        ready = true;
    }

    // اگر هیچ‌وقت startAtrakRealtime صدا زده نشد، بعد از چند ثانیه خودمان بازگردانی کنیم
    window.addEventListener('load', function () {
        setTimeout(function () { restoreOnLoad(); }, 6000);
    });

    initBrowserHistory();
    mirrorState();
    updateButtons();

    window.AtrakNav = {
        back: back,
        forward: forward,
        refreshCurrent: refreshCurrent,
        restoreOnLoad: restoreOnLoad,
        get stack() { return stack.map(function (e) { return e.sig; }); },
        get index() { return idx; },
        get dirty() { return dirty; }
    };

    console.log('[nav-fix] ناوبری یکپارچه فعال شد');
})();
