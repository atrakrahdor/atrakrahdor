/* =========================================================
   lms-fix.js
   اصلاحیه بخش سوالات سامانه محتوا (LMS)
 
   این فایل باید در index.html «بعد از supabase.js» بارگذاری شود.
 
   مشکلاتی که حل می‌کند:
   1) سوالاتی که مدیر از داخل صفحه‌ی هر درس ذخیره می‌کرد، زیر شناسه‌ی
      «همان درس» در Supabase ذخیره می‌شد، ولی صفحه‌ی عمومی از شناسه‌ی
      «کتاب» می‌خواند؛ برای همین فقط داخل پنل مدیریت دیده می‌شد.
   2) عنوان و توضیح کارت‌های درس‌ها فقط در localStorage مرورگر مدیر
      ذخیره می‌شد و به Supabase نمی‌رفت.
   3) هر تغییر ذخیره‌شده توسط مدیر، با Realtime صفحه‌ی همه‌ی کاربران را
      به صفحه‌ی اصلی برمی‌گرداند.
   4) بعد از F5 کاربر از صفحه‌ی سوالات به صفحه‌ی اصلی می‌پرید.
   5) متن‌های ویرایش‌شده‌ی داخل صفحه‌ی سوالات بعد از ساخت صفحه
      دوباره اعمال نمی‌شدند.
   ========================================================= */
(function () {
    'use strict';
    console.log('[lms-fix] v6 بارگذاری شد');
 
    var LOCATION_KEY = 'atrak_last_lms_location_v1';
 
    /* ---------------------------------------------------------
       ابزارهای کمکی
       --------------------------------------------------------- */
 
    function esc(value) {
        if (typeof escapeQuestionHTML === 'function') {
            return escapeQuestionHTML(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
 
    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }
 
    // صفحاتی که با innerHTML ساخته می‌شوند و داخل views نیستند
    function isDynamicView() {
        try {
            return !!state.currentView &&
                state.currentView !== 'home' &&
                !views[state.currentView];
        } catch (e) {
            return false;
        }
    }
 
    /* ---------------------------------------------------------
       ذخیره و بازیابی محل کاربر (برای F5)
       --------------------------------------------------------- */
 
    var initialLocation = null;
    try {
        initialLocation = JSON.parse(sessionStorage.getItem(LOCATION_KEY) || 'null');
    } catch (e) {
        initialLocation = null;
    }
 
    function saveLocation(loc) {
        try { sessionStorage.setItem(LOCATION_KEY, JSON.stringify(loc)); } catch (e) {}
    }
 
    function clearLocation() {
        try { sessionStorage.removeItem(LOCATION_KEY); } catch (e) {}
    }
 
    // وقتی کاربر به یک صفحه‌ی معمولی می‌رود، محل ذخیره‌شده پاک شود
    (function wrapNavigation() {
        var originalNavigate = window.navigateTo;
        if (typeof originalNavigate === 'function') {
            window.navigateTo = function () {
                return originalNavigate.apply(this, arguments);
            };
        }
 
        var originalRender = window.renderCurrentView;
        if (typeof originalRender === 'function') {
            window.renderCurrentView = function () {
                var result = originalRender.apply(this, arguments);
                if (!isDynamicView()) {
                    if (state.currentView && state.currentView !== 'home') {
                        saveLocation({ t: 'view', view: state.currentView });
                    } else {
                        clearLocation();
                    }
                }
                return result;
            };
        }
    })();
 
    var restored = false;
 
    async function restoreLocationOnce() {
        if (restored) return;
        restored = true;
 
        var loc = initialLocation;
        if (!loc || !loc.t) return;
 
        // اگر مدیر بوده، صبر کن نشست مدیر برگردد (حداکثر ۴ ثانیه)
        var hasToken = false;
        try { hasToken = !!sessionStorage.getItem('atrak_admin_access_token'); } catch (e) {}
        if (hasToken) {
            for (var i = 0; i < 40 && !(state && state.isAdmin); i++) {
                await sleep(100);
            }
        }
 
        var allowed = (state && state.isAdmin) ||
            (typeof isStudentLoggedIn === 'function' && isStudentLoggedIn());
        var needsLogin = loc.t !== 'view' ||
            (typeof isStudentProtectedView === 'function' && isStudentProtectedView(loc.view));
        console.log('[lms-fix] بازگشت به صفحه‌ی قبلی:', loc, 'allowed=', allowed);
        if (needsLogin && !allowed) return;
 
        try {
            if (loc.t === 'view') {
                if (views[loc.view]) {
                    state.currentView = loc.view;
                    renderCurrentView();
                }
            } else if (loc.t === 'chapter') {
                await window.openQuestionChapter(
                    loc.chapterId, loc.chapterTitle, loc.category,
                    loc.lessonId, loc.lessonName,
                    { silent: true }
                );
            } else if (loc.t === 'cat') {
                window.openQuestionCategory(loc.lessonId, loc.lessonName, loc.category);
            } else if (loc.t === 'cats') {
                window.openQuestionCategories(loc.lessonId, loc.lessonName);
            }
        } catch (e) {
            console.warn('بازگشت به صفحه‌ی قبلی انجام نشد:', e);
        }
    }
 
    /* ---------------------------------------------------------
       متن تیره روی زمینه‌ی تیره (حالت شب)
       منبع رنگ هرچه باشد (inline، کلاس، پیست از Word و ...) بر اساس
       «رنگ نهایی» بررسی می‌شود و فقط در حالت شب روشن‌تر نمایش داده می‌شود.
       چیزی در متن ذخیره‌شده تغییر نمی‌کند.
       --------------------------------------------------------- */
 
    (function injectInkStyle() {
        var st = document.createElement('style');
        st.textContent = '[data-theme="dark"] .atrak-ink-fix{color:var(--text-color,#f5f0ff)!important;}';
        document.head.appendChild(st);
    })();
 
    function parseRgba(text) {
        var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s\/]+([\d.]+))?/.exec(String(text || ''));
        return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
    }
 
    function lumOf(c) {
        return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    }
 
    function backgroundLum(el) {
        var node = el;
        while (node && node.nodeType === 1) {
            var c = parseRgba(getComputedStyle(node).backgroundColor);
            if (c && c.a >= 0.6) return lumOf(c);
            node = node.parentElement;
        }
        return 0; // پس‌زمینه‌ی صفحه در حالت شب تیره است
    }
 
    function normalizeInk() {
        if (!isDynamicView()) return 0;
        var root = document.getElementById('mainAppContent');
        if (!root) return 0;
 
        var dark = document.body.getAttribute('data-theme') === 'dark';
        var count = 0;
 
        root.querySelectorAll('*').forEach(function (el) {
            el.classList.remove('atrak-ink-fix');
            if (!dark) return;
 
            if (el.closest('[data-lms-control], button, input, textarea, select, .atrak-dynamic-item')) return;
 
            var hasText = Array.prototype.some.call(el.childNodes, function (n) {
                return n.nodeType === 3 && n.nodeValue.trim();
            });
            if (!hasText) return;
 
            var c = parseRgba(getComputedStyle(el).color);
            if (!c) return;
 
            var spread = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
            if (spread <= 60 && lumOf(c) < 0.42 && backgroundLum(el) < 0.5) {
                el.classList.add('atrak-ink-fix');
                count++;
            }
        });
 
        if (count) console.log('[lms-fix] متن‌های تیره‌ی اصلاح‌شده در حالت شب:', count);
        return count;
    }
 
    var inkTimer = null;
    function scheduleInkNormalize() {
        clearTimeout(inkTimer);
        inkTimer = setTimeout(normalizeInk, 250);
    }
 
    (function watchContent() {
        function start() {
            var root = document.getElementById('mainAppContent');
            if (root && typeof MutationObserver !== 'undefined') {
                new MutationObserver(scheduleInkNormalize).observe(root, {
                    subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'color']
                });
            }
            if (typeof MutationObserver !== 'undefined') {
                new MutationObserver(scheduleInkNormalize).observe(document.body, {
                    attributes: true, attributeFilter: ['data-theme']
                });
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    })();
 
    /* ---------------------------------------------------------
       بعد از ساخته شدن هر صفحه‌ی پویا:
       متن‌های ویرایش‌شده دوباره اعمال شوند
       --------------------------------------------------------- */
 
    function afterDynamicRender() {
        try {
            var root = document.getElementById('mainAppContent');
 
            // شناسه‌ی متن‌ها برای همه ساخته می‌شود؛ فقط مدیر می‌تواند ویرایش کند
            if (typeof enableAdminEditableFields === 'function') enableAdminEditableFields();
            if (!state.isAdmin && typeof disableAdminEditableFields === 'function') {
                disableAdminEditableFields();
            }
 
            if (typeof loadSavedImages === 'function') loadSavedImages();
 
            // دکمه‌های کنترلی نباید قابل ویرایش متنی باشند
            if (root) {
                root.querySelectorAll('[data-lms-control]').forEach(function (el) {
                    el.removeAttribute('contenteditable');
                    el.removeAttribute('data-editable');
                });
            }
 
            snapshotBaseline();
            applyPageEdits(false);
            scheduleInkNormalize();
        } catch (e) {
            console.warn('اعمال متن‌های ذخیره‌شده روی صفحه انجام نشد:', e);
        }
    }
 
    /* ---------------------------------------------------------
       ذخیره‌ی متن‌های ویرایش‌شده‌ی صفحه‌های سوالات
       در یک رکورد کوچک و جدا (به‌جای رکورد سنگین main که تایم‌اوت می‌داد)
       --------------------------------------------------------- */
 
    var PAGE_EDIT_PREFIX = 'lms_edits_';
    var baseline = {};
    var pageEditsCache = {};
    var pageSaveTimer = null;
    var pendingPage = null;
 
    function pageKey() {
        var v = state.currentView;
        if (v === 'question-chapter' && window.currentQuestionChapterId) {
            return 'chapter__' + window.currentQuestionChapterId;
        }
        if (v === 'question-chapters' && window.currentLessonId) {
            return 'cat__' + window.currentLessonId + '__' + (window.currentQuestionCategory || '');
        }
        if (v === 'question-categories' && window.currentLessonId) {
            return 'cats__' + window.currentLessonId;
        }
        return null;
    }
 
    function pageRowId(key) {
        return PAGE_EDIT_PREFIX + encodeURIComponent(key);
    }
 
    function pageElements() {
        var root = document.getElementById('mainAppContent');
        if (!root) return [];
        return Array.prototype.slice.call(root.querySelectorAll('[data-editable]'))
            .filter(function (el) { return !el.hasAttribute('data-lms-control'); });
    }
 
    function snapshotBaseline() {
        baseline = {};
        pageElements().forEach(function (el) {
            baseline[el.getAttribute('data-editable')] = el.innerHTML;
        });
    }
 
    // فقط متن‌هایی که نسبت به حالت اولیه تغییر کرده‌اند
    function collectPageEdits() {
        var edits = {};
        pageElements().forEach(function (el) {
            var id = el.getAttribute('data-editable');
            var changed = el.innerHTML !== baseline[id] || el.style.color || el.style.fontSize;
            if (changed) {
                edits[id] = {
                    html: el.innerHTML,
                    color: el.style.color || '',
                    fontSize: el.style.fontSize || ''
                };
            }
        });
        return edits;
    }
 
    function stripLocalEdits() {
        try {
            var all = JSON.parse(localStorage.getItem('atrak_saved_edits') || '{}');
            var changed = false;
 
            pageElements().forEach(function (el) {
                var id = el.getAttribute('data-editable');
                if (id in all) { delete all[id]; changed = true; }
            });
 
            // متن‌های قدیمیِ صفحه‌های سوالات که در رکورد main جمع شده‌اند
            Object.keys(all).forEach(function (id) {
                if (/^auto-text-question-(chapter|chapters|categories)-/.test(id)) {
                    delete all[id];
                    changed = true;
                }
            });
 
            if (changed) localStorage.setItem('atrak_saved_edits', JSON.stringify(all));
        } catch (e) {}
    }
 
    async function writePageEdits(key, edits) {
        var response = await fetch(
            SUPABASE_URL + '/rest/v1/site_state?on_conflict=id',
            {
                method: 'POST',
                headers: getSupabaseWriteHeaders(),
                keepalive: JSON.stringify(edits).length < 50000,
                body: JSON.stringify({
                    id: pageRowId(key),
                    data: { schemaVersion: 1, updatedAt: String(Date.now()), edits: edits }
                })
            }
        );
        if (!response.ok) {
            var details = await response.text().catch(function () { return ''; });
            throw new Error('ذخیره‌ی متن صفحه ناموفق بود: ' + response.status + ' ' + details);
        }
        pageEditsCache[key] = edits;
        return true;
    }
 
    async function flushPageEdits() {
        clearTimeout(pageSaveTimer);
        var job = pendingPage;
        pendingPage = null;
        if (!job) return true;
        try {
            await writePageEdits(job.key, job.edits);
            console.log('[lms-fix] متن صفحه ذخیره شد:', job.key);
            return true;
        } catch (e) {
            console.error('[lms-fix]', e);
            return false;
        }
    }
 
    function schedulePageEdits(key, edits) {
        pendingPage = { key: key, edits: edits };
        clearTimeout(pageSaveTimer);
        pageSaveTimer = setTimeout(flushPageEdits, 1200);
    }
 
    async function fetchPageEdits(key) {
        var response = await fetch(
            SUPABASE_URL + '/rest/v1/site_state?select=data&id=eq.' +
            encodeURIComponent(pageRowId(key)),
            { headers: { apikey: SUPABASE_ANON_KEY }, cache: 'no-store' }
        );
        if (!response.ok) throw new Error('status ' + response.status);
        var rows = await response.json();
        var data = rows[0] && rows[0].data;
        return (data && data.edits && typeof data.edits === 'object') ? data.edits : {};
    }
 
    async function applyPageEdits(useCache) {
        var key = pageKey();
        if (!key) return;
 
        try {
            var edits = (useCache && pageEditsCache[key]) ? pageEditsCache[key] : await fetchPageEdits(key);
            pageEditsCache[key] = edits;
 
            // اگر کاربر در این فاصله صفحه را عوض کرده، چیزی اعمال نشود
            if (pageKey() !== key) return;
 
            var root = document.getElementById('mainAppContent');
            if (!root) return;
 
            Object.keys(edits).forEach(function (id) {
                var el;
                try { el = root.querySelector('[data-editable="' + id.replace(/"/g, '\\"') + '"]'); } catch (e) { el = null; }
                if (!el || document.activeElement === el) return;
                var item = edits[id] || {};
                if (item.html !== undefined) el.innerHTML = item.html;
                if (item.color) el.style.color = item.color;
                if (item.fontSize) el.style.fontSize = item.fontSize;
            });
        } catch (e) {
            console.warn('[lms-fix] دریافت متن‌های صفحه انجام نشد:', e);
        }
    }
 
    // ذخیره‌ی متن‌ها: روی صفحه‌های سوالات به رکورد جدا می‌رود
    (function wrapSaveAllEdits() {
        var originalSave = window.saveAllEdits;
        if (typeof originalSave !== 'function') return;
 
        window.saveAllEdits = function (showMessage, syncCloud) {
            var key = pageKey();
            if (!key) return originalSave.apply(this, arguments);
 
            var self = this;
            var isAdmin = state.isAdmin === true;
            var edits = isAdmin ? collectPageEdits() : {};
 
            // نسخه‌ی محلی را بدون متن‌های این صفحه نگه دار و رکورد main را سنگین نکن
            var result = originalSave.call(self, false, false);
            if (isAdmin) stripLocalEdits();
 
            if (!isAdmin) return result;
 
            if (showMessage) {
                pendingPage = { key: key, edits: edits };
                return flushPageEdits().then(function (ok) {
                    alert(ok ? 'تمامی تغییرات با موفقیت ذخیره شدند!'
                             : 'ذخیره در سرور انجام نشد. Console را بررسی کنید.');
                });
            }
 
            schedulePageEdits(key, edits);
            return result;
        };
 
        window.addEventListener('pagehide', function () {
            if (pendingPage) flushPageEdits();
        });
    })();
 
    // رکورد main را پشت سر هم نفرست (هر حرف یک درخواست سنگین بود)
    (function debounceMainSync() {
        var originalSync = window.syncStateToCloud;
        if (typeof originalSync !== 'function') return;
 
        var timer = null;
        var waiters = [];
 
        window.syncStateToCloud = function () {
            return new Promise(function (resolve) {
                waiters.push(resolve);
                clearTimeout(timer);
                timer = setTimeout(function () {
                    var list = waiters;
                    waiters = [];
                    try {
                        var sizes = {};
                        ['atrak_saved_edits', 'atrak_saved_icons', 'atrak_saved_images',
                         'atrak_dynamic_elements_v1', 'atrak_comments_v39', 'atrak_honors_v1']
                            .forEach(function (k) {
                                sizes[k] = Math.round((localStorage.getItem(k) || '').length / 1024) + ' KB';
                            });
                        console.log('[lms-fix] حجم داده‌های رکورد main:', sizes);
                    } catch (e) {}
                    Promise.resolve(originalSync()).then(
                        function () { list.forEach(function (f) { f(); }); },
                        function () { list.forEach(function (f) { f(); }); }
                    );
                }, 1500);
            });
        };
    })();
 
    /* ---------------------------------------------------------
       ۱) صفحه‌ی سوالات یک درس (openQuestionChapter)
          خواندن از همان شناسه‌ای که پنل مدیریت در آن ذخیره می‌کند
       --------------------------------------------------------- */
 
    function categoryTitleOf(category) {
        if (category === 'first-term') return 'سوالات نوبت اول';
        if (category === 'second-term') return 'سوالات نوبت دوم';
        return 'سوالات متن کتاب';
    }
 
    async function loadChapterData(chapterId, parentLessonId, category) {
        function hasItems(d) {
            return d && typeof d === 'object' &&
                Array.isArray(d[category]) && d[category].length > 0;
        }
 
        // اول: سوالاتی که برای همین درس ذخیره شده‌اند
        var data = await loadQuestionsLessonFromCloud(chapterId);
        if (hasItems(data)) return data;
 
        // اگر برای این بخش چیزی نبود، سوالات ذخیره‌شده‌ی کل کتاب را نشان بده
        if (parentLessonId && parentLessonId !== chapterId) {
            var lessonData = await loadQuestionsLessonFromCloud(parentLessonId);
            if (hasItems(lessonData)) return lessonData;
        }
        return (data && typeof data === 'object') ? data : {};
    }
 
    function buildQuestionsHTML(list) {
        var html = '';
        list.forEach(function (item, index) {
            var question = typeof item === 'string'
                ? item
                : (item && (item.question || item.text)) || '.';
            var answer = typeof item === 'string' ? '' : ((item && item.answer) || '');
 
            html +=
                '<div style="margin-bottom:18px;padding:18px;border:1px solid var(--card-border);' +
                'border-radius:14px;background:rgba(255,255,255,.12);">' +
                '<div style="font-weight:900;font-size:14px;color:var(--accent-pink);">سوال ' + (index + 1) + '</div>' +
                '<div style="white-space:pre-wrap;line-height:2;font-size:16px;color:var(--text-color);margin-top:8px;">' +
                esc(question) + '</div>' +
                (answer
                    ? '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--card-border);">' +
                      '<div style="font-weight:900;color:var(--accent-pink);margin-bottom:6px;">پاسخ:</div>' +
                      '<div style="white-space:pre-wrap;line-height:2;font-size:15px;color:var(--text-color);">' +
                      esc(answer) + '</div></div>'
                    : '') +
                '</div>';
        });
        return html;
    }
 
    window.openQuestionChapter = async function (
        chapterId, chapterTitle, category, parentLessonId, parentLessonName, options
    ) {
        var container = document.getElementById('mainAppContent');
        if (!container) return;
 
        var silent = !!(options && options.silent);
 
        state.currentView = 'question-chapter';
 
        window.currentQuestionChapterId = chapterId;
        window.currentQuestionChapterTitle = chapterTitle;
        window.currentQuestionChapterCategory = category;
        window.currentLessonId = parentLessonId;
        window.currentLessonName = parentLessonName;
        window.currentQuestionCategory = category;
 
        saveLocation({
            t: 'chapter',
            chapterId: chapterId,
            chapterTitle: chapterTitle,
            category: category,
            lessonId: parentLessonId,
            lessonName: parentLessonName
        });
 
        var data;
        var loadError = null;
        try {
            data = await loadChapterData(chapterId, parentLessonId, category);
        } catch (error) {
            console.error('دریافت سوالات این درس ناموفق بود:', error);
            loadError = error;
            data = {};
        }
 
        // اگر کاربر در همین فاصله صفحه را عوض کرده، چیزی نساز
        if (state.currentView !== 'question-chapter' ||
            window.currentQuestionChapterId !== chapterId) {
            return;
        }
 
        var list = Array.isArray(data[category]) ? data[category] : [];
 
        var bodyHTML = loadError
            ? '<div style="text-align:center;padding:30px;color:var(--text-muted);">' +
              'دریافت سوالات از سرور انجام نشد. اینترنت خود را بررسی کنید.<br><br>' +
              '<button type="button" id="lmsRetryBtn" data-lms-control="1" ' +
              'style="border:none;padding:10px 20px;border-radius:10px;cursor:pointer;' +
              'background:var(--primary);color:#fff;font-family:inherit;font-weight:800;">تلاش دوباره</button></div>'
            : (list.length
                ? buildQuestionsHTML(list)
                : '<div style="text-align:center;padding:30px;color:var(--text-muted);">' +
                  'هنوز سوالی برای این بخش ثبت نشده است.</div>');
 
        container.innerHTML =
            '<section class="glass-card fade-in-up" style="padding:25px;">' +
            '<button type="button" id="lmsBackBtn" data-lms-control="1" ' +
            'style="border:none;padding:10px 18px;border-radius:10px;cursor:pointer;' +
            'background:var(--primary);color:white;font-weight:800;font-family:inherit;margin-bottom:25px;">' +
            '← بازگشت به فهرست درس‌ها</button>' +
            '<div style="text-align:center;margin-bottom:25px;">' +
            '<h2 style="margin:0;font-size:23px;font-weight:900;color:var(--text-color);">' +
            esc(chapterTitle) + '</h2>' +
            '<p style="margin-top:8px;color:var(--text-muted);font-size:13px;">' +
            esc(categoryTitleOf(category)) + '</p></div>' +
            '<div style="min-height:60px;">' + bodyHTML + '</div>' +
            (state.isAdmin
                ? '<div style="margin-top:25px;">' +
                  '<button type="button" id="lmsAdminBtn" data-lms-control="1" ' +
                  'style="width:100%;border:none;padding:14px;border-radius:12px;cursor:pointer;' +
                  'background:#7c3aed;color:white;font-family:inherit;font-size:15px;font-weight:900;">' +
                  '✏️ مدیریت سوالات این درس</button></div>'
                : '') +
            '</section>';
 
        var back = document.getElementById('lmsBackBtn');
        if (back) {
            back.addEventListener('click', function () {
                window.openQuestionCategory(parentLessonId, parentLessonName, category);
            });
        }
 
        var retry = document.getElementById('lmsRetryBtn');
        if (retry) {
            retry.addEventListener('click', function () {
                window.openQuestionChapter(
                    chapterId, chapterTitle, category, parentLessonId, parentLessonName
                );
            });
        }
 
        var adminBtn = document.getElementById('lmsAdminBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', function () {
                // پنل مدیریت روی همان بخشی باز می‌شود که کاربر داخلش است
                window.showQuestionAdminPanel(chapterId, chapterTitle, category);
            });
        }
 
        afterDynamicRender();
 
        if (typeof updateBreadcrumbs === 'function') {
            try { updateBreadcrumbs(); } catch (e) {}
        }
 
        if (!silent) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
 
    /* ---------------------------------------------------------
       ۲) پنل مدیریت: باز شدن روی بخش درست + تازه شدن صفحه بعد از بستن
       --------------------------------------------------------- */
 
    (function wrapAdminPanel() {
        var originalShow = window.showQuestionAdminPanel;
        if (typeof originalShow === 'function') {
            window.showQuestionAdminPanel = async function (lessonId, lessonName, initialCategory) {
                await originalShow.call(this, lessonId, lessonName);
                if (initialCategory && initialCategory !== 'textbook' &&
                    typeof renderQuestionAdminCategory === 'function') {
                    renderQuestionAdminCategory(lessonId, lessonName, initialCategory);
                }
            };
        }
 
        var originalClose = window.closeQuestionAdminPanel;
        if (typeof originalClose === 'function') {
            window.closeQuestionAdminPanel = function () {
                originalClose.apply(this, arguments);
 
                // بعد از بستن پنل، صفحه‌ی پشت آن با آخرین سوالات ذخیره‌شده تازه شود
                if (state.currentView === 'question-chapter' && window.currentQuestionChapterId) {
                    window.openQuestionChapter(
                        window.currentQuestionChapterId,
                        window.currentQuestionChapterTitle,
                        window.currentQuestionChapterCategory,
                        window.currentLessonId,
                        window.currentLessonName,
                        { silent: true }
                    );
                }
            };
        }
    })();
 
    /* ---------------------------------------------------------
       ۳) ذخیره‌ی محل در صفحه‌های فهرست سوالات
       --------------------------------------------------------- */
 
    (function wrapCategoryPages() {
        var originalCategory = window.openQuestionCategory;
        if (typeof originalCategory === 'function') {
            window.openQuestionCategory = function (lessonId, lessonName, category) {
                var result = originalCategory.apply(this, arguments);
                saveLocation({ t: 'cat', lessonId: lessonId, lessonName: lessonName, category: category });
                setTimeout(afterDynamicRender, 0);
                return result;
            };
        }
 
        var originalCategories = window.openQuestionCategories;
        if (typeof originalCategories === 'function') {
            window.openQuestionCategories = function (lessonId, lessonName) {
                var result = originalCategories.apply(this, arguments);
                saveLocation({ t: 'cats', lessonId: lessonId, lessonName: lessonName });
                return result;
            };
        }
    })();
 
    /* ---------------------------------------------------------
       ۴) عنوان و توضیح کارت‌ها: ذخیره در Supabase برای همه
       --------------------------------------------------------- */
 
    window.saveQuestionChapterSettings = function (settings) {
        localStorage.setItem('atrak_question_chapter_settings', JSON.stringify(settings));
 
        if (state.isAdmin && typeof saveQuestionChapterSettingsToCloud === 'function') {
            return saveQuestionChapterSettingsToCloud(settings);
        }
        return Promise.resolve(false);
    };
 
    window.editQuestionChapterText = async function (
        lessonId, lessonName, category, chapterId, defaultTitle
    ) {
        if (!state.isAdmin) return;
 
        // آخرین نسخه‌ی سرور را بگیر تا تنظیمات دیگران پاک نشود
        try { await loadQuestionChapterSettingsFromCloud(); } catch (e) {}
 
        var current = getQuestionChapterText(lessonId, category, chapterId, defaultTitle);
 
        var newTitle = prompt('عنوان این بخش را وارد کنید:', current.title);
        if (newTitle === null) return;
 
        var newDescription = prompt('توضیح زیر عنوان را وارد کنید:', current.description);
        if (newDescription === null) return;
 
        var settings = getQuestionChapterSettings();
        var key = lessonId + '__' + category + '__' + chapterId;
 
        settings[key] = {
            title: newTitle.trim() || defaultTitle,
            description: newDescription.trim() || 'برای مشاهده سوالات وارد شوید'
        };
 
        await window.saveQuestionChapterSettings(settings);
 
        window.openQuestionCategory(lessonId, lessonName, category);
    };
 
    /* ---------------------------------------------------------
       ۵) Realtime: تغییرات را بدون پرت کردن کاربر به صفحه‌ی اصلی اعمال کن
       --------------------------------------------------------- */
 
    window.applyCloudStateAfterRealtime = function () {
        try {
            state.theme = localStorage.getItem('atrak_theme') || state.theme;
            applyTheme(state.theme);
 
            // صفحه‌های پویا (مثل سوالات) از نو ساخته نمی‌شوند؛
            // فقط متن‌های ذخیره‌شده روی همان صفحه اعمال می‌شود.
            if (!isDynamicView()) {
                renderCurrentView();
            }
 
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
    };
 
    var rtStarted = false;
    var rtClient = null;
    var rtChannel = null;
 
    function onSiteStateChange(payload) {
        var row = payload && payload.new;
        if (!row || typeof row.id !== 'string') return;
 
        var id = row.id;
 
        // ----- تنظیمات و متن‌های کلی سایت -----
        if (id === SUPABASE_ROW_ID) {
            var incoming = row.data;
            if (!incoming || typeof incoming !== 'object') return;
 
            var incomingAt = Number(incoming.updatedAt || 0);
            var localAt = Number(localStorage.getItem('atrak_state_updated_at') || 0);
            if (incomingAt && localAt >= incomingAt) return;
 
            scheduleRealtimeSiteRefresh();
            return;
        }
 
        // مدیر تغییرِ خودش را دوباره دریافت نکند
        if (state && state.isAdmin === true) return;
 
        // ----- عنوان و توضیح کارت‌های درس‌ها -----
        if (id === ATRAK_QCHAPTER_ROW_ID) {
            loadQuestionChapterSettingsFromCloud().then(function () {
                if (state.currentView === 'question-chapters' &&
                    window.currentLessonId && window.currentQuestionCategory) {
                    var y = window.scrollY;
                    window.openQuestionCategory(
                        window.currentLessonId,
                        window.currentLessonName,
                        window.currentQuestionCategory
                    );
                    requestAnimationFrame(function () {
                        window.scrollTo({ top: y, behavior: 'auto' });
                    });
                }
            });
            return;
        }
 
        // ----- متن‌های ویرایش‌شده‌ی صفحه‌های سوالات -----
        if (id.indexOf(PAGE_EDIT_PREFIX) === 0) {
            var key = pageKey();
            if (key && id === pageRowId(key)) applyPageEdits(false);
            return;
        }
 
        // ----- سوالات یک درس -----
        if (id.indexOf(ATRAK_QLESSON_PREFIX) === 0) {
            loadQuestionsBankFromCloud().then(function () {
                if (state.currentView === 'question-chapter' && window.currentQuestionChapterId) {
                    var y = window.scrollY;
                    window.openQuestionChapter(
                        window.currentQuestionChapterId,
                        window.currentQuestionChapterTitle,
                        window.currentQuestionChapterCategory,
                        window.currentLessonId,
                        window.currentLessonName,
                        { silent: true }
                    ).then(function () {
                        window.scrollTo({ top: y, behavior: 'auto' });
                    });
                }
            });
        }
    }
 
    // main.js این تابع را در آخرین مرحله‌ی بارگذاری سایت صدا می‌زند؛
    // بنابراین همین‌جا بهترین زمان بازگرداندن کاربر به صفحه‌ی قبلی است.
    window.startAtrakRealtime = async function () {
        restoreLocationOnce();
 
        if (rtStarted || !isCloudStorageConfigured()) return;
 
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.warn('کتابخانه Supabase برای Realtime بارگذاری نشده است.');
            return;
        }
 
        rtStarted = true;
 
        try {
            rtClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 
            rtChannel = rtClient
                .channel('atrak-site-state-realtime')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'site_state' },
                    onSiteStateChange
                )
                .subscribe(function (status) {
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Supabase Realtime فعال شد!');
                    } else {
                        console.warn('وضعیت اتصال Realtime:', status);
                    }
                });
        } catch (error) {
            rtStarted = false;
            console.error('❌ خطا در راه‌اندازی Realtime:', error);
        }
    };
})();
 
/* =========================================================
   دکمه‌ی لینک فایل (Google Drive) داخل صفحه‌ی سوالات هر درس
 
   برای اضافه کردن دکمه به یک درس دیگر، فقط یک خط به
   DRIVE_BUTTONS اضافه کنید:
     '<شناسه‌ی درس>__questions__<دسته>__chapter_<شماره درس>': 'لینک'
   دسته: textbook (متن کتاب) | first-term | second-term
   ========================================================= */
(function () {
    'use strict';
 
    var DRIVE_BUTTONS = {
        // ریاضی هفتم - سوالات متن کتاب - درس ۱
        'm1-p7-lesson4__questions__textbook__chapter_1':
            'https://drive.google.com/file/d/1X_fDDsD4-Fxk2V9kFa61gqH5sbI92FkL/view?usp=sharing'
    };
 
    var BTN_ID = 'driveLinkBtnWrap';
 
    function injectDriveButton() {
        try {
            var chapterId = window.currentQuestionChapterId;
            var url = chapterId && DRIVE_BUTTONS[chapterId];
            var container = document.getElementById('mainAppContent');
            if (!url || !container || document.getElementById(BTN_ID)) return;
            if (state.currentView !== 'question-chapter') return;
 
            var body = container.querySelector('section > div[style*="min-height"]');
            if (!body) return;
 
            var wrap = document.createElement('div');
            wrap.id = BTN_ID;
            wrap.setAttribute('data-lms-control', '1');
            wrap.style.cssText = 'text-align:center;margin:-8px 0 22px;';
            wrap.innerHTML =
                '<a href="' + url + '" target="_blank" rel="noopener noreferrer" ' +
                'style="display:inline-flex;align-items:center;gap:8px;padding:9px 20px;' +
                'border-radius:999px;border:1.5px solid var(--primary);color:var(--primary);' +
                'background:transparent;font-family:inherit;font-size:14px;font-weight:800;' +
                'text-decoration:none;cursor:pointer;transition:background .2s,color .2s;" ' +
                'onmouseover="this.style.background=\'var(--primary)\';this.style.color=\'#fff\'" ' +
                'onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--primary)\'">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
                'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
                '<polyline points="7 10 12 15 17 10"></polyline>' +
                '<line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
                '<span>مشاهده و دانلود فایل سوالات با جواب</span></a>';
 
            body.parentNode.insertBefore(wrap, body);
        } catch (e) {
            console.warn('افزودن دکمه‌ی لینک فایل انجام نشد:', e);
        }
    }
 
    var original = window.openQuestionChapter;
    if (typeof original !== 'function') return;
 
    window.openQuestionChapter = async function () {
        var result = await original.apply(this, arguments);
        injectDriveButton();
        return result;
    };
})();
