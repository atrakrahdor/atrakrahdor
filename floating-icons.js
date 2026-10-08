/* =========================================================
   آیکون‌های شناور پس‌زمینه سایت اترک
   - بدون نیاز به ویرایش CSS یا HTML (استایل خودش را تزریق می‌کند)
   - پشت تمام محتوا، غیرقابل کلیک، سبک و با پشتیبانی از حالت شب
   ========================================================= */
(function () {
    'use strict';

    /* ---------- تنظیمات (می‌توانید عوض کنید) ---------- */
    var CONFIG = {
        desktopCols: 5,        // تعداد ستون در دسکتاپ
        desktopRows: 3,        // تعداد ردیف در دسکتاپ   (۵×۳ = ۱۵ آیکون)
        mobileCols: 3,         // تعداد ستون در موبایل
        mobileRows: 3,         // تعداد ردیف در موبایل   (۳×۳ = ۹ آیکون)
        mobileBreakpoint: 700, // عرض (px) که زیرش حالت موبایل است
        minSize: 30,           // کوچک‌ترین اندازه آیکون (px)
        maxSize: 58,           // بزرگ‌ترین اندازه آیکون (px)
        opacityLight: 0.22,    // شفافیت در حالت روز
        opacityDark: 0.32,     // شفافیت در حالت شب
        colors: ['#ec4899', '#a855f7', '#6d28d9', '#f472b6']
    };

    /* ---------- آیکون‌های آموزشی (SVG خطی) ---------- */
    var ICONS = [
        /* کتاب باز */
        '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
        /* کلاه فارغ‌التحصیلی */
        '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
        /* مداد */
        '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/><path d="m15 5 4 4"/>',
        /* لامپ ایده */
        '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.8.7 1 1.5 1 2.3h6c0-.8.2-1.6 1-2.3A7 7 0 0 0 12 2z"/>',
        /* اتم */
        '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
        /* ماشین‌حساب */
        '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
        /* جام */
        '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
        /* ستاره */
        '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
        /* لپ‌تاپ */
        '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
        /* کره زمین */
        '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
        /* مدال */
        '<circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 2h4l2 5 2-5h4l-2.5 7.5"/>',
        /* موشک */
        '<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.7-2.1-.8-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-4 12 12 0 0 1 11-6c0 3-1 8-6 11a22 22 0 0 1-4 2z"/>',
        /* درخشش */
        '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"/>'
    ];

    /* ---------- استایل (یک‌بار تزریق می‌شود) ---------- */
    function injectStyle() {
        if (document.getElementById('atrakFloatIconsStyle')) return;

        var css = [
            '#atrakFloatIcons{position:fixed;inset:0;width:100%;height:100%;overflow:hidden;',
            'pointer-events:none;z-index:-1;}',

            '.atrak-fi{position:absolute;line-height:0;',
            'opacity:var(--fi-o,.22);',
            'animation:atrakFiFloat var(--fi-t,14s) ease-in-out infinite alternate;',
            'animation-delay:var(--fi-d,0s);will-change:translate,rotate;}',

            '.atrak-fi svg{width:100%;height:100%;display:block;fill:none;stroke:currentColor;',
            'stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;',
            'animation:atrakFiPulse var(--fi-p,6s) ease-in-out infinite alternate;',
            'animation-delay:var(--fi-d,0s);}',

            'body[data-theme="dark"] #atrakFloatIcons .atrak-fi{',
            'opacity:var(--fi-od,.32);filter:drop-shadow(0 0 8px currentColor);}',

            '@keyframes atrakFiFloat{',
            '0%{translate:0 0;rotate:0deg;}',
            '100%{translate:var(--fi-dx,20px) var(--fi-dy,-40px);rotate:var(--fi-r,25deg);}}',

            '@keyframes atrakFiPulse{',
            '0%{transform:scale(.88);}100%{transform:scale(1.12);}}',

            '@media (prefers-reduced-motion:reduce){',
            '.atrak-fi,.atrak-fi svg{animation:none!important;}}'
        ].join('');

        var style = document.createElement('style');
        style.id = 'atrakFloatIconsStyle';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ---------- ابزار تصادفی ---------- */
    function rand(min, max) { return min + Math.random() * (max - min); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    /* ---------- ساخت لایه ---------- */
    var currentMode = '';

    function build() {
        var isMobile = window.innerWidth < CONFIG.mobileBreakpoint;
        var mode = isMobile ? 'm' : 'd';
        if (mode === currentMode && document.getElementById('atrakFloatIcons')) return;
        currentMode = mode;

        var old = document.getElementById('atrakFloatIcons');
        if (old) old.remove();

        var cols = isMobile ? CONFIG.mobileCols : CONFIG.desktopCols;
        var rows = isMobile ? CONFIG.mobileRows : CONFIG.desktopRows;
        var sizeMax = isMobile ? Math.round(CONFIG.maxSize * 0.75) : CONFIG.maxSize;
        var sizeMin = isMobile ? Math.round(CONFIG.minSize * 0.8) : CONFIG.minSize;

        var layer = document.createElement('div');
        layer.id = 'atrakFloatIcons';
        layer.setAttribute('aria-hidden', 'true');

        /* آیکون‌ها را بُر می‌زنیم تا تکرار پشت‌سرهم نداشته باشیم */
        var pool = ICONS.slice().sort(function () { return Math.random() - 0.5; });
        var n = 0;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                /* هر سلول شبکه یک آیکون با جابه‌جایی تصادفی؛ پخش یکنواخت و طبیعی */
                var left = ((c + rand(0.15, 0.85)) / cols) * 100;
                var top  = ((r + rand(0.15, 0.85)) / rows) * 100;
                var size = Math.round(rand(sizeMin, sizeMax));

                var el = document.createElement('div');
                el.className = 'atrak-fi';
                el.style.left = left.toFixed(1) + '%';
                el.style.top = top.toFixed(1) + '%';
                el.style.width = size + 'px';
                el.style.height = size + 'px';
                el.style.color = pick(CONFIG.colors);

                el.style.setProperty('--fi-o', CONFIG.opacityLight);
                el.style.setProperty('--fi-od', CONFIG.opacityDark);
                el.style.setProperty('--fi-t', rand(11, 20).toFixed(1) + 's');
                el.style.setProperty('--fi-p', rand(4, 8).toFixed(1) + 's');
                el.style.setProperty('--fi-d', '-' + rand(0, 15).toFixed(1) + 's');
                el.style.setProperty('--fi-dx', Math.round(rand(-40, 40)) + 'px');
                el.style.setProperty('--fi-dy', Math.round(rand(-70, -25)) + 'px');
                el.style.setProperty('--fi-r', Math.round(rand(-35, 35)) + 'deg');

                el.innerHTML =
                    '<svg viewBox="0 0 24 24" focusable="false">' +
                    pool[n % pool.length] +
                    '</svg>';

                layer.appendChild(el);
                n++;
            }
        }

        document.body.insertBefore(layer, document.body.firstChild);
    }

    /* ---------- اجرا ---------- */
    function init() {
        injectStyle();
        build();

        var timer;
        window.addEventListener('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(build, 250);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
