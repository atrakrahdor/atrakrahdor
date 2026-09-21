/* =========================================================
   کنترل منوهای هدر دوم
   باز شدن با کلیک
   بسته شدن فقط با کلیک بیرون
========================================================= */

(function () {

    function initSecondNavbarMenus() {

        const dropdowns =
            document.querySelectorAll('.second-nav-dropdown');

        if (!dropdowns.length) return;


        dropdowns.forEach(function (dropdown) {

            const button =
                dropdown.querySelector(
                    '.second-nav-dropdown-btn'
                );

            if (!button) return;


            button.addEventListener('click', function (event) {

                event.preventDefault();
                event.stopPropagation();


                const isOpen =
                    dropdown.classList.contains('menu-open');


                dropdowns.forEach(function (item) {

                    item.classList.remove('menu-open');

                });


                if (!isOpen) {

                    dropdown.classList.add('menu-open');

                }

            });

        });


        document.addEventListener('click', function (event) {

            if (
                event.target.closest(
                    '.second-nav-dropdown'
                )
            ) {
                return;
            }


            dropdowns.forEach(function (dropdown) {

                dropdown.classList.remove('menu-open');

            });

        });

    }


    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initSecondNavbarMenus
        );

    } else {

        initSecondNavbarMenus();

    }

})();
/* =========================================================
   منوی هدر دوم اترک
========================================================= */

function toggleAtrakDropdown(id) {
    const target = document.getElementById(id);
    if (!target) return;

    const isOpen = target.classList.contains('open');

    document.querySelectorAll('.atrak-second-dropdown').forEach(function (item) {
        item.classList.remove('open');
        item.querySelectorAll('.atrak-services-menu, .atrak-remote-menu, .atrak-maghta-menu')
            .forEach(function(menu) {
                menu.style.removeProperty('position');
                menu.style.removeProperty('top');
                menu.style.removeProperty('left');
                menu.style.removeProperty('right');
                menu.style.removeProperty('max-height');
                menu.style.removeProperty('overflow-y');
            });
    });

    if (isOpen) return;

    target.classList.add('open');

    if (window.matchMedia('(max-width:700px)').matches) {
        requestAnimationFrame(function () {
            const button = target.querySelector('.atrak-second-dropdown-button');
            const menu = target.querySelector('.atrak-services-menu, .atrak-remote-menu, .atrak-maghta-menu');
            if (!button || !menu) return;

            const rect = button.getBoundingClientRect();

            menu.style.position = 'fixed';
            menu.style.top = Math.round(rect.bottom + 6) + 'px';
            menu.style.left = '8px';
            menu.style.right = 'auto';
            menu.style.maxHeight = 'calc(100vh - ' + Math.round(rect.bottom + 16) + 'px)';
            menu.style.overflowY = 'auto';
            menu.style.zIndex = '999999';
        });
    }
}

/* =========================================================
   کلیک بیرون از منو
   فقط اینجا منو بسته می‌شود
========================================================= */

document.addEventListener(
    'click',
    function (event) {

        if (
            event.target.closest(
                '.atrak-second-dropdown'
            )
        ) {
            return;
        }


        document
            .querySelectorAll(
                '.atrak-second-dropdown'
            )
            .forEach(function (item) {

                item.classList.remove('open');

            });

    }
);
/* =========================================================
   اسکرول نرم و مدرن سایت
   هر حرکت اسکرول ≈ نصف حالت عادی
   ========================================================= */


/* =========================================================
   بازگشت نرم به ابتدای صفحه
   ========================================================= */

function scrollToPageTop() {

    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });

}


/* =========================================================
   نمایش / مخفی کردن فلش
   ========================================================= */

window.addEventListener('scroll', function () {

    const button = document.getElementById('floatingTopButton');

    if (!button) return;

    if (window.scrollY > 350) {

        button.classList.add('show');

    } else {

        button.classList.remove('show');

    }

}, {
    passive: true
});