/* =========================================================
   افتخارآفرینان مدرسه اترک
   ========================================================= */

const ATRAK_HONORS_STORAGE_KEY = 'atrak_honors_v1';


function escapeHonorsText(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* ---------------------------------------------------------
   دریافت دانش‌آموزان
   --------------------------------------------------------- */

function getAtrakHonors() {

    try {

        const saved =
            localStorage.getItem(
                ATRAK_HONORS_STORAGE_KEY
            );

        if (saved) {

            const parsed =
                JSON.parse(saved);

            if (Array.isArray(parsed)) {
                return parsed;
            }
        }

    } catch (error) {

        console.error(
            'خطا در دریافت افتخارآفرینان:',
            error
        );

    }

    return [];
}


/* ---------------------------------------------------------
   ذخیره افتخارآفرینان
   --------------------------------------------------------- */

async function saveAtrakHonors(honors) {

    const safeHonors =
        Array.isArray(honors)
            ? honors
            : [];

    localStorage.setItem(
        ATRAK_HONORS_STORAGE_KEY,
        JSON.stringify(safeHonors)
    );

    /*
     * ذخیره در Supabase
     * تا همه کاربران همان اطلاعات را ببینند.
     */

    if (
        typeof syncStateToCloud === 'function' &&
        typeof state !== 'undefined' &&
        state.isAdmin === true
    ) {
        await syncStateToCloud();
    }
}


/* ---------------------------------------------------------
   تبدیل عکس به حجم مناسب
   --------------------------------------------------------- */

function compressHonorImage(file) {

    return new Promise((resolve, reject) => {

        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('فایل انتخاب‌شده تصویر نیست.'));
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {

            const img = new Image();

            img.onload = function() {

                const maxSize = 700;

                let width = img.width;
                let height = img.height;

                if (width > height) {

                    if (width > maxSize) {
                        height =
                            Math.round(
                                height * maxSize / width
                            );

                        width = maxSize;
                    }

                } else {

                    if (height > maxSize) {
                        width =
                            Math.round(
                                width * maxSize / height
                            );

                        height = maxSize;
                    }
                }

                const canvas =
                    document.createElement('canvas');

                canvas.width = width;
                canvas.height = height;

                const ctx =
                    canvas.getContext('2d');

                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL(
                        'image/jpeg',
                        0.78
                    )
                );
            };

            img.onerror = function() {
                reject(
                    new Error('خواندن تصویر انجام نشد.')
                );
            };

            img.src = event.target.result;
        };

        reader.onerror = function() {
            reject(
                new Error('خواندن فایل انجام نشد.')
            );
        };

        reader.readAsDataURL(file);
    });
}


/* ---------------------------------------------------------
   نمایش چهار نفر اول در صفحه اصلی
   --------------------------------------------------------- */

function renderAtrakHonorsHome() {

    const grid =
        document.getElementById(
            'atrakHonorsHomeGrid'
        );

    if (!grid) return;

    const honors =
        getAtrakHonors().slice(0, 4);

    if (!honors.length) {

        grid.innerHTML = `
            <div class="atrak-honors-empty">
                هنوز دانش‌آموزی به این بخش اضافه نشده است.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        honors.map(renderAtrakHonorCard).join('');
}


/* ---------------------------------------------------------
   کارت دانش‌آموز
   --------------------------------------------------------- */

function renderAtrakHonorCard(student) {

    return `
        <article class="atrak-honor-card">

            <div class="atrak-honor-photo-wrap">

                <img
                    class="atrak-honor-photo"
                    src="${escapeHonorsText(student.photo)}"
                    alt="${escapeHonorsText(student.firstName + ' ' + student.lastName)}"
                    decoding="async"
                    loading="lazy"
                >

            </div>

            <div class="atrak-honor-name">
                ${escapeHonorsText(student.firstName)}
                ${escapeHonorsText(student.lastName)}
            </div>

            <div class="atrak-honor-university">
                ${escapeHonorsText(student.university)}
            </div>

        </article>
    `;
}


/* ---------------------------------------------------------
   صفحه کامل افتخارآفرینان
   --------------------------------------------------------- */

function renderAtrakHonorsPage() {

    const grid =
        document.getElementById(
            'atrakHonorsPageGrid'
        );

    if (!grid) return;

    const honors =
        getAtrakHonors();

    if (!honors.length) {

        grid.innerHTML = `
            <div class="atrak-honors-empty">
                هنوز افتخارآفرینی ثبت نشده است.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        honors.map((student, index) => {

            return `
                <article class="atrak-honor-card">

                    <div class="atrak-honor-photo-wrap">

                        <img
                            class="atrak-honor-photo"
                            src="${escapeHonorsText(student.photo)}"
                            alt="${escapeHonorsText(student.firstName + ' ' + student.lastName)}"
                            decoding="async"
                            loading="lazy"
                        >

                    </div>

                    <div class="atrak-honor-name">
                        ${escapeHonorsText(student.firstName)}
                        ${escapeHonorsText(student.lastName)}
                    </div>

                    <div class="atrak-honor-university">
                        ${escapeHonorsText(student.university)}
                    </div>

                    ${
                        state.isAdmin
                        ?
                        `
                        <button
                            type="button"
                            class="atrak-honor-delete"
                            onclick="deleteAtrakHonor(${index})"
                        >
                            حذف
                        </button>
                        `
                        :
                        ''
                    }

                </article>
            `;

        }).join('');
}


/* ---------------------------------------------------------
   صفحه افتخارات
   --------------------------------------------------------- */

views['honors'] = `

<section class="atrak-honors-page">

    <div class="atrak-honors-page-header">

        <h1>
            افتخارآفرینان مدرسه آموزش از راه دور اترک
        </h1>

        <p>
            دانش‌آموزان موفق و افتخارآفرین مدرسه اترک
        </p>

    </div>


    ${
        state.isAdmin
        ?
        `
        <div class="atrak-honors-admin-box">

            <button
                type="button"
                class="atrak-honors-add-btn"
                onclick="openAtrakHonorAdmin()"
            >
                ＋ افزودن دانش‌آموز
            </button>

        </div>
        `
        :
        ''
    }


    <div
        id="atrakHonorsPageGrid"
        class="atrak-honors-grid"
    ></div>

</section>

`;


/* ---------------------------------------------------------
   فرم افزودن دانش‌آموز
   --------------------------------------------------------- */

function openAtrakHonorAdmin() {

    if (!state.isAdmin) {

        alert(
            'ابتدا وارد حالت مدیریت شوید.'
        );

        return;
    }

    let modal =
        document.getElementById(
            'atrakHonorAdminModal'
        );

    if (!modal) {

        modal =
            document.createElement('div');

        modal.id =
            'atrakHonorAdminModal';

        modal.className =
            'atrak-honor-modal-overlay';

        document.body.appendChild(modal);
    }


    modal.innerHTML = `

        <div class="atrak-honor-modal">

            <button
                type="button"
                class="atrak-honor-modal-close"
                onclick="closeAtrakHonorAdmin()"
            >
                ×
            </button>


            <h2>
                افزودن دانش‌آموز
            </h2>


            <div class="atrak-honor-form">

                <label>
                    عکس دانش‌آموز

                    <input
                        type="file"
                        id="atrakHonorPhotoInput"
                        accept="image/*"
                    >
                </label>


                <label>
                    نام

                    <input
                        type="text"
                        id="atrakHonorFirstName"
                        placeholder="نام دانش‌آموز"
                    >
                </label>


                <label>
                    نام خانوادگی

                    <input
                        type="text"
                        id="atrakHonorLastName"
                        placeholder="نام خانوادگی"
                    >
                </label>


                <label>
                    نام دانشگاه

                    <input
                        type="text"
                        id="atrakHonorUniversity"
                        placeholder="نام دانشگاه"
                    >
                </label>


                <button
                    type="button"
                    class="atrak-honors-save-btn"
                    onclick="saveAtrakHonorFromAdmin()"
                >
                    ذخیره دانش‌آموز
                </button>

            </div>

        </div>

    `;

    modal.style.display = 'flex';
}


/* ---------------------------------------------------------
   بستن فرم
   --------------------------------------------------------- */

function closeAtrakHonorAdmin() {

    const modal =
        document.getElementById(
            'atrakHonorAdminModal'
        );

    if (modal) {
        modal.remove();
    }
}


/* ---------------------------------------------------------
   ذخیره دانش‌آموز جدید
   --------------------------------------------------------- */

async function saveAtrakHonorFromAdmin() {

    if (!state.isAdmin) {
        alert('دسترسی مدیریت لازم است.');
        return;
    }


    const photoInput =
        document.getElementById(
            'atrakHonorPhotoInput'
        );

    const firstName =
        document.getElementById(
            'atrakHonorFirstName'
        ).value.trim();

    const lastName =
        document.getElementById(
            'atrakHonorLastName'
        ).value.trim();

    const university =
        document.getElementById(
            'atrakHonorUniversity'
        ).value.trim();


    if (
        !photoInput.files.length ||
        !firstName ||
        !lastName ||
        !university
    ) {

        alert(
            'لطفاً عکس، نام، نام خانوادگی و دانشگاه را کامل وارد کنید.'
        );

        return;
    }


    try {

        const photo =
            await compressHonorImage(
                photoInput.files[0]
            );


        const honors =
            getAtrakHonors();


        honors.push({

            id:
                'honor-' +
                Date.now(),

            photo,

            firstName,

            lastName,

            university

        });


        await saveAtrakHonors(
            honors
        );


        closeAtrakHonorAdmin();

        renderAtrakHonorsPage();

        renderAtrakHonorsHome();


        alert(
            'دانش‌آموز با موفقیت اضافه شد.'
        );


    } catch (error) {

        console.error(
            error
        );

        alert(
            'ذخیره عکس دانش‌آموز انجام نشد.'
        );
    }
}


/* ---------------------------------------------------------
   حذف دانش‌آموز
   --------------------------------------------------------- */

async function deleteAtrakHonor(index) {

    if (!state.isAdmin) return;

    if (
        !confirm(
            'آیا از حذف این دانش‌آموز مطمئن هستید؟'
        )
    ) {
        return;
    }


    const honors =
        getAtrakHonors();

    honors.splice(
        index,
        1
    );


    await saveAtrakHonors(
        honors
    );


    renderAtrakHonorsPage();

    renderAtrakHonorsHome();
}


/* ---------------------------------------------------------
   بعد از ساخته شدن صفحات
   --------------------------------------------------------- */

function initAtrakHonors() {

    renderAtrakHonorsHome();

    if (
        state.currentView === 'honors'
    ) {
        renderAtrakHonorsPage();
    }
}


window.addEventListener(
    'load',
    function() {

        setTimeout(
            initAtrakHonors,
            100
        );

    }
);