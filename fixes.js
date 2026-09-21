(function () {
    function refreshStudentNameEverywhere() {
        try {
            if (typeof updateStudentLoginButton === 'function') {
                updateStudentLoginButton();
            }
            var session = typeof getStudentSession === 'function' ? getStudentSession() : null;
            var remembered = session ? session.username : (typeof getSavedStudentUsername === 'function' ? getSavedStudentUsername() : '');
            var input = document.getElementById('studentUsernameInput');
            if (input && remembered && document.activeElement !== input) input.value = remembered;
        } catch (e) {}
    }

    function setupSequentialScroll() {
        var container = document.getElementById('mainAppContent');
        if (!container || typeof IntersectionObserver === 'undefined') return;
        var elements = container.querySelectorAll('.service-card, .glass-card, .info-card, .content-card');
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-visible');
                    entry.target.classList.add('scroll-visible-v2');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
        Array.prototype.forEach.call(elements, function (el, index) {
            if (el.dataset.atrakSequentialScroll === '1') return;
            el.dataset.atrakSequentialScroll = '1';
            el.classList.add('scroll-reveal');
            el.classList.add('scroll-reveal-v2');
            el.style.setProperty('--scroll-delay', Math.min(index * 90, 630) + 'ms');
            observer.observe(el);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        refreshStudentNameEverywhere();
        setTimeout(refreshStudentNameEverywhere, 150);
        setTimeout(refreshStudentNameEverywhere, 600);
        setTimeout(setupSequentialScroll, 120);
    });
    window.addEventListener('pageshow', refreshStudentNameEverywhere);
    window.addEventListener('popstate', refreshStudentNameEverywhere);
    window.addEventListener('storage', refreshStudentNameEverywhere);

    // بعد از جابه‌جایی بین صفحات داخلی سایت، فقط یک بار وضعیت لازم را تازه می‌کنیم.
    ['navigateTo', 'goBack', 'goForward'].forEach(function (fnName) {
        var original = window[fnName];
        if (typeof original === 'function' && !original.__atrakV19Wrapped) {
            var wrapped = function () {
                var result = original.apply(this, arguments);
                setTimeout(refreshStudentNameEverywhere, 0);
                setTimeout(setupSequentialScroll, 40);
                return result;
            };
            wrapped.__atrakV19Wrapped = true;
            window[fnName] = wrapped;
        }
    });

})();
