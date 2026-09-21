'use strict';

/* =========================================================
   ATRAK COMMENTS
   نسخه بازنویسی‌شده
   ========================================================= */

const ATRAK_COMMENTS_KEY = 'atrak_comments_v40';
const ATRAK_COMMENTS_TABLE = 'site_comments';
const ATRAK_COMMENTS_MAX = 2000;

let atrakCommentsRoot = null;
let atrakCommentsObserver = null;
let atrakCommentsRefreshTimer = null;
let atrakCommentsRefreshToken = 0;
let atrakCommentsBoundForm = null;
let atrakCommentsBoundRoot = null;


/* =========================================================
   ابزارهای عمومی
   ========================================================= */

function atrakCommentsEsc(value) {

    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function atrakCommentsGetRoot() {

    return document.getElementById('atrak-comments-root');
}


function atrakCommentsGetPageKey() {

    const root = atrakCommentsGetRoot();

    if (!root) {
        return '';
    }

    return (
        root.getAttribute('data-page-key') ||
        'unknown-page'
    );
}


function atrakCommentsIsAdmin() {

    try {

        if (
            typeof state !== 'undefined' &&
            state
        ) {
            return !!state.isAdmin;
        }

    } catch (error) {}

    try {

        return document.body.classList.contains('admin-mode');

    } catch (error) {

        return false;
    }
}


function atrakCommentsGetName() {

    try {

        if (
            typeof getSavedStudentUsername === 'function'
        ) {

            const value =
                String(
                    getSavedStudentUsername() || ''
                ).trim();

            if (value) {
                return value;
            }
        }

    } catch (error) {}


    try {

        if (
            typeof getStudentSession === 'function'
        ) {

            const session =
                getStudentSession();

            if (
                session &&
                session.username
            ) {

                return String(
                    session.username
                ).trim();
            }
        }

    } catch (error) {}


    return 'ناشناس';
}


function atrakCommentsCreateId() {

    return (
        'c_' +
        Date.now().toString(36) +
        '_' +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


function atrakCommentsFormatDate(value) {

    try {

        return new Date(value).toLocaleString(
            'fa-IR',
            {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }
        );

    } catch (error) {

        return '';
    }
}


function atrakCommentsMessage(
    root,
    text,
    error
) {

    if (!root) {
        return;
    }

    const element =
        root.querySelector(
            '#atrak-comment-status'
        );

    if (!element) {
        return;
    }

    element.textContent = text || '';

    element.className =
        'atrak-comment-status' +
        (error ? ' error' : '');
}


/* =========================================================
   Local Storage
   ========================================================= */

function atrakCommentsReadLocal() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    ATRAK_COMMENTS_KEY
                ) || '[]'
            );

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        return [];
    }
}


function atrakCommentsWriteLocal(items) {

    try {

        localStorage.setItem(
            ATRAK_COMMENTS_KEY,
            JSON.stringify(items)
        );

    } catch (error) {

        console.error(
            'ذخیره محلی نظرات ناموفق بود:',
            error
        );
    }
}


/* =========================================================
   Supabase
   ========================================================= */

function atrakCommentsConfigured() {

    return (
        typeof SUPABASE_URL === 'string' &&
        SUPABASE_URL.trim() !== '' &&
        typeof SUPABASE_ANON_KEY === 'string' &&
        SUPABASE_ANON_KEY.trim() !== ''
    );
}


async function atrakCommentsRest(
    path,
    options
) {

    if (!atrakCommentsConfigured()) {

        throw new Error(
            'Supabase تنظیم نشده است.'
        );
    }

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            function () {
                controller.abort();
            },
            7000
        );


    try {

        const requestOptions =
            options || {};


        const headers =
            Object.assign(
                {
                    'apikey':
                        SUPABASE_ANON_KEY,

                    'Content-Type':
                        'application/json'
                },

                requestOptions.headers || {}
            );


        const response =
            await fetch(
                SUPABASE_URL +
                '/rest/v1/' +
                path,

                Object.assign(
                    {},
                    requestOptions,

                    {
                        headers: headers,
                        signal: controller.signal
                    }
                )
            );


        const text =
            await response.text();


        let data = null;


        try {

            data =
                text
                    ? JSON.parse(text)
                    : null;

        } catch (error) {

            data = text;
        }


        if (!response.ok) {

            console.error(
                'Supabase Comments Error:',
                {
                    status:
                        response.status,

                    data:
                        data
                }
            );


            throw new Error(
                data &&
                data.message
                    ? data.message
                    : 'Supabase ' +
                      response.status
            );
        }


        return data;

    } finally {

        clearTimeout(timeout);
    }
}


/* =========================================================
   دریافت نظرات از Supabase
   ========================================================= */

async function atrakCommentsFetchCloud(
    pageKey
) {

    let filter =
        '&status=eq.approved';


    if (
        atrakCommentsIsAdmin()
    ) {

        filter =
            '&status=in.(approved,pending)';
    }


    return await atrakCommentsRest(
        ATRAK_COMMENTS_TABLE +
        '?page_key=eq.' +
        encodeURIComponent(pageKey) +
        filter +
        '&order=created_at.desc&select=*',
        {
            method: 'GET'
        }
    );
}


/* =========================================================
   ثبت نظر در Supabase
   ========================================================= */

async function atrakCommentsInsertCloud(
    row
) {

    return await atrakCommentsRest(
        ATRAK_COMMENTS_TABLE,
        {
            method: 'POST',

            headers: {
                'Prefer':
                    'return=minimal'
            },

            body:
                JSON.stringify(row)
        }
    );
}


/* =========================================================
   تأیید / رد نظر
   ========================================================= */

async function atrakCommentsModerateCloud(
    commentId,
    status
) {

    return await atrakCommentsRest(

        ATRAK_COMMENTS_TABLE +
        '?id=eq.' +
        encodeURIComponent(commentId),

        {
            method: 'PATCH',

            headers: {
                'Prefer':
                    'return=minimal'
            },

            body:
                JSON.stringify({
                    status: status
                })
        }
    );
}


/* =========================================================
   دریافت اطلاعات
   ========================================================= */

async function atrakCommentsGetItems(
    pageKey
) {

    try {

        const cloud =
            await atrakCommentsFetchCloud(
                pageKey
            );


        const items =
            Array.isArray(cloud)
                ? cloud
                : [];


        atrakCommentsWriteLocal(
            items
        );


        return {
            items: items,
            cloud: true
        };


    } catch (error) {

        console.error(
            'دریافت نظرات از Supabase ناموفق بود:',
            error
        );


        const local =
            atrakCommentsReadLocal()
                .filter(
                    function (item) {

                        return (
                            item &&
                            item.page_key ===
                                pageKey
                        );
                    }
                );


        return {
            items: local,
            cloud: false,
            error: error
        };
    }
}


/* =========================================================
   ساخت HTML نظر
   ========================================================= */

function atrakCommentsItemHTML(
    item,
    showAdminButtons
) {

    let adminHTML = '';


    if (showAdminButtons) {

        adminHTML =

            '<div class="atrak-admin-actions">' +

                '<button ' +
                    'type="button" ' +
                    'class="atrak-approve" ' +
                    'data-c-action="approved" ' +
                    'data-c-id="' +
                    atrakCommentsEsc(item.id) +
                    '">' +
                    'تأیید و انتشار' +
                '</button>' +

                '<button ' +
                    'type="button" ' +
                    'class="atrak-reject" ' +
                    'data-c-action="rejected" ' +
                    'data-c-id="' +
                    atrakCommentsEsc(item.id) +
                    '">' +
                    'رد نظر' +
                '</button>' +

            '</div>';
    }


    return (

        '<article class="atrak-comment-item">' +

            '<div class="atrak-comment-head">' +

                '<span class="atrak-comment-author">' +
                    atrakCommentsEsc(
                        item.author_name ||
                        'ناشناس'
                    ) +
                '</span>' +

                '<span class="atrak-comment-date">' +
                    atrakCommentsEsc(
                        atrakCommentsFormatDate(
                            item.created_at
                        )
                    ) +
                '</span>' +

            '</div>' +

            '<div class="atrak-comment-text">' +
                atrakCommentsEsc(
                    item.content || ''
                ) +
            '</div>' +

            adminHTML +

        '</article>'
    );
}


/* =========================================================
   نمایش نظرات
   ========================================================= */

async function atrakCommentsRefresh() {

    const root =
        atrakCommentsGetRoot();


    if (!root) {
        return;
    }


    const pageKey =
        atrakCommentsGetPageKey();


    if (!pageKey || pageKey === 'home') {
        return;
    }


    const token =
        ++atrakCommentsRefreshToken;


    const result =
        await atrakCommentsGetItems(
            pageKey
        );


    if (
        token !==
            atrakCommentsRefreshToken
    ) {
        return;
    }


    if (!root.isConnected) {
        return;
    }


    const items =
        Array.isArray(result.items)
            ? result.items
            : [];


    const approved =
        items.filter(
            function (item) {

                return (
                    item &&
                    item.status ===
                        'approved'
                );
            }
        );


    const pending =
        items.filter(
            function (item) {

                return (
                    item &&
                    item.status ===
                        'pending'
                );
            }
        );


    const approvedList =
        root.querySelector(
            '#atrak-approved-list'
        );


    const pendingList =
        root.querySelector(
            '#atrak-pending-list'
        );


    const adminPanel =
        root.querySelector(
            '#atrak-admin-comments'
        );


    const author =
        root.querySelector(
            '#atrak-comment-author'
        );


    if (author) {

        author.textContent =
            atrakCommentsGetName();
    }


    if (approvedList) {

        if (approved.length) {

            approvedList.innerHTML =
                approved
                    .map(
                        function (item) {

                            return (
                                atrakCommentsItemHTML(
                                    item,
                                    false
                                )
                            );
                        }
                    )
                    .join('');

        } else {

            approvedList.innerHTML =
                '<div class="atrak-empty">' +
                'هنوز نظری برای این بخش منتشر نشده است.' +
                '</div>';
        }
    }


    if (adminPanel) {

        adminPanel.hidden =
            !atrakCommentsIsAdmin();


        if (
            atrakCommentsIsAdmin() &&
            pendingList
        ) {

            if (pending.length) {

                pendingList.innerHTML =
                    pending
                        .map(
                            function (item) {

                                return (
                                    atrakCommentsItemHTML(
                                        item,
                                        true
                                    )
                                );
                            }
                        )
                        .join('');

            } else {

                pendingList.innerHTML =
                    '<div class="atrak-empty">' +
                    'نظر در انتظار بررسی وجود ندارد.' +
                    '</div>';
            }
        }
    }


    if (result.cloud) {

        atrakCommentsMessage(
            root,
            'نظرات این بخش آماده است.',
            false
        );

    } else {

        atrakCommentsMessage(
            root,
            'نظرات محلی نمایش داده شدند؛ اتصال Supabase برای همگام‌سازی بررسی شود.',
            true
        );
    }


    atrakCommentsBind(root, pageKey);
}


/* =========================================================
   جلوگیری از خروج صفحه هنگام ثبت فرم
   ========================================================= */

function atrakCommentsBind(
    root,
    pageKey
) {

    const form =
        root.querySelector(
            '#atrak-comment-form'
        );


    if (!form) {
        return;
    }


    /*
     * اگر همین فرم قبلاً متصل شده،
     * دوباره listener ایجاد نمی‌کنیم.
     */

    if (
        atrakCommentsBoundForm === form
    ) {

        return;
    }


    atrakCommentsBoundForm =
        form;

    atrakCommentsBoundRoot =
        root;


    form.addEventListener(
        'submit',
        async function (event) {

            /*
             * بسیار مهم:
             * هیچ submit معمولی فرم
             * اجازه اجرا ندارد.
             */

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            const input =
                form.querySelector(
                    '#atrak-comment-input'
                );


            const button =
                form.querySelector(
                    'button[type="submit"]'
                ) ||
                form.querySelector(
                    'button'
                );


            if (!input || !button) {

                console.error(
                    'فیلد یا دکمه ثبت نظر پیدا نشد.'
                );

                return;
            }


            const content =
                String(
                    input.value || ''
                ).trim();


            if (!content) {

                atrakCommentsMessage(
                    root,
                    'لطفاً متن نظر را وارد کنید.',
                    true
                );

                input.focus();

                return;
            }


            if (
                content.length >
                ATRAK_COMMENTS_MAX
            ) {

                atrakCommentsMessage(
                    root,
                    'متن نظر بیش از حد طولانی است.',
                    true
                );

                return;
            }


           const row = {
    page_key: pageKey,
    commenter_name: atrakCommentsGetName() || 'ناشناس',
    content: content,
    status: 'pending',
    created_at: new Date().toISOString()
};


            button.disabled =
                true;


            atrakCommentsMessage(
                root,
                'در حال ثبت نظر...',
                false
            );


            let cloudSaved =
                false;


            try {

                await
                    atrakCommentsInsertCloud(
                        row
                    );


                cloudSaved =
                    true;


                console.log(
                    'نظر با موفقیت ثبت شد.',
                    row
                );


            } catch (error) {

                console.error(
                    'ثبت نظر در Supabase ناموفق بود:',
                    error
                );


                /*
                 * اگر Supabase در دسترس نبود،
                 * نسخه محلی نگه داشته می‌شود.
                 */

                const local =
                    atrakCommentsReadLocal();


                local.unshift(row);


                atrakCommentsWriteLocal(
                    local
                );
            }


            /*
             * فقط فرم را پاک می‌کنیم.
             *
             * هیچ refresh
             * هیچ renderCurrentView
             * هیچ location
             * هیچ تغییر صفحه
             * اینجا انجام نمی‌شود.
             */

            input.value = '';


            button.disabled =
                false;


            if (cloudSaved) {

                atrakCommentsMessage(
                    root,
                    'نظر شما ثبت شد و پس از تأیید مدیریت منتشر می‌شود.',
                    false
                );

            } else {

                atrakCommentsMessage(
                    root,
                    'نظر روی این دستگاه ذخیره شد؛ اتصال Supabase برقرار نشد.',
                    true
                );
            }


            /*
             * جلوگیری مضاعف از رفتار submit
             */

            return false;

        },
        true
    );


    /*
     * دکمه‌های مدیریت
     */

    root.addEventListener(
        'click',
        async function (event) {

            const button =
                event.target.closest(
                    '[data-c-action]'
                );


            if (!button) {
                return;
            }


            if (
                !atrakCommentsIsAdmin()
            ) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();


            const commentId =
                button.getAttribute(
                    'data-c-id'
                );


            const status =
                button.getAttribute(
                    'data-c-action'
                );


            if (
                !commentId ||
                !status
            ) {
                return;
            }


            atrakCommentsMessage(
                root,
                'در حال ذخیره تصمیم مدیریت...',
                false
            );


            try {

                await
                    atrakCommentsModerateCloud(
                        commentId,
                        status
                    );


                /*
                 * فقط بعد از عملیات مدیریت
                 * لیست را دوباره می‌خوانیم.
                 */

                await
                    atrakCommentsRefresh();


            } catch (error) {

                console.error(
                    'مدیریت نظر در Supabase ناموفق بود:',
                    error
                );


                const local =
                    atrakCommentsReadLocal();


                const updated =
                    local.map(
                        function (item) {

                            if (
                                String(item.id) ===
                                String(commentId)
                            ) {

                                return Object.assign(
                                    {},
                                    item,
                                    {
                                        status:
                                            status
                                    }
                                );
                            }


                            return item;
                        }
                    );


                atrakCommentsWriteLocal(
                    updated
                );


                await
                    atrakCommentsRefresh();


                atrakCommentsMessage(
                    root,
                    'تصمیم مدیریت روی این دستگاه ذخیره شد؛ اتصال Supabase برقرار نشد.',
                    true
                );
            }

        },
        true
    );
}


/* =========================================================
   شروع سیستم
   ========================================================= */

function atrakCommentsSchedule() {

    clearTimeout(
        atrakCommentsRefreshTimer
    );


    atrakCommentsRefreshTimer =
        setTimeout(
            function () {

                atrakCommentsRefresh();

            },
            150
        );
}


/* =========================================================
   تشخیص تغییر صفحه
   ========================================================= */

function atrakCommentsObserve() {

    const main =
        document.getElementById(
            'mainAppContent'
        );


    if (
        !main ||
        atrakCommentsObserver
    ) {
        return;
    }


    atrakCommentsObserver =
        new MutationObserver(
            function (mutations) {

                let changed =
                    false;


                for (
                    const mutation
                    of mutations
                ) {

                    if (
                        mutation.type ===
                        'childList'
                    ) {

                        changed =
                            true;

                        break;
                    }
                }


                if (changed) {

                    /*
                     * اگر صفحه واقعاً عوض شده باشد،
                     * listener قبلی مربوط به root قبلی است.
                     */

                    const currentRoot =
                        atrakCommentsGetRoot();


                    if (
                        currentRoot !==
                        atrakCommentsBoundRoot
                    ) {

                        atrakCommentsBoundForm =
                            null;

                        atrakCommentsBoundRoot =
                            null;

                        atrakCommentsSchedule();
                    }
                }
            }
        );


    atrakCommentsObserver.observe(
        main,
        {
            childList: true,
            subtree: true
        }
    );
}


/* =========================================================
   توابع قابل استفاده توسط سایت
   ========================================================= */

window.atrakRefreshComments =
    function () {

        atrakCommentsSchedule();
    };


window.atrakBindCommentsCurrentPage =
    function () {

        atrakCommentsSchedule();
    };


/* =========================================================
   شروع
   ========================================================= */

function atrakCommentsStart() {

    console.log(
        '✅ comments.js با موفقیت بارگذاری شد.'
    );


    atrakCommentsObserve();


    setTimeout(
        function () {

            atrakCommentsSchedule();

        },
        200
    );
}


if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        atrakCommentsStart,
        {
            once: true
        }
    );

} else {

    atrakCommentsStart();
}


window.addEventListener(
    'online',
    function () {

        atrakCommentsSchedule();

    }
);