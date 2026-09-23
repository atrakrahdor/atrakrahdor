/* =========================================================
   افتخارآفرینان اترک
   ========================================================= */

const ATRAK_HONORS_KEY = 'atrak_honors_v1';


function getAtrakHonors() {
    try {
        return JSON.parse(
            localStorage.getItem(ATRAK_HONORS_KEY) || '[]'
        );
    } catch (error) {
        return [];
    }
}


async function saveAtrakHonors(list) {

    localStorage.setItem(
        ATRAK_HONORS_KEY,
        JSON.stringify(list)
    );

    if (typeof syncStateToCloud === 'function') {
        await syncStateToCloud();
    }
}


function renderAtrakHonors(containerId) {

    const container =
        document.getElementById(containerId);

    if (!container) return;

    const students =
        getAtrakHonors();

   if (!students.length) {

    container.innerHTML = `
      <div id="atrak-honors">
    <div class="atrak-test-honor-card"></div>
    <div class="atrak-test-honor-card"></div>
    <div class="atrak-test-honor-card"></div>
    <div class="atrak-test-honor-card"></div>
</div>
    `;

    return;
}


    container.innerHTML =
        students.map((student, index) => `

            <article class="atrak-honor-card">

                <div class="atrak-honor-photo-wrap">

                    <img
                        src="${student.photo}"
                        alt="${student.firstName} ${student.lastName}"
                        class="atrak-honor-photo"
                    >

                </div>

                <div class="atrak-honor-name">
                    ${student.firstName} ${student.lastName}
                </div>

                <div class="atrak-honor-university">
                    ${student.university}
                </div>

                ${
                    state.isAdmin
                    ?
                    `
                    <button
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

        `).join('');
}


function openAtrakHonorAdmin() {

    const oldModal =
        document.getElementById(
            'atrakHonorModal'
        );

    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement('div');

    modal.id =
        'atrakHonorModal';

    modal.className =
        'atrak-honor-modal-overlay';


    modal.innerHTML = `

        <div class="atrak-honor-modal">

            <button
                class="atrak-honor-close"
                onclick="document.getElementById('atrakHonorModal').remove()"
            >
                ×
            </button>

            <h2>
                افزودن دانش‌آموز
            </h2>

            <label>
                عکس دانش‌آموز
                <input
                    type="file"
                    id="atrakHonorPhoto"
                    accept="image/*"
                >
            </label>

            <label>
                نام
                <input
                    type="text"
                    id="atrakHonorFirstName"
                    placeholder="نام"
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
                دانشگاه
                <input
                    type="text"
                    id="atrakHonorUniversity"
                    placeholder="نام دانشگاه"
                >
            </label>

            <button
                class="atrak-honor-save"
                onclick="saveAtrakHonor()"
            >
                ذخیره دانش‌آموز
            </button>

        </div>

    `;

    document.body.appendChild(modal);
}


async function saveAtrakHonor() {

    const photoInput =
        document.getElementById(
            'atrakHonorPhoto'
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
        !photoInput.files[0] ||
        !firstName ||
        !lastName ||
        !university
    ) {

        alert(
            'لطفاً همه اطلاعات را کامل وارد کنید.'
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload = async function(event) {

        const students =
            getAtrakHonors();


        students.push({

            id: Date.now(),

            photo:
                event.target.result,

            firstName,

            lastName,

            university

        });


        await saveAtrakHonors(
            students
        );


        const modal =
            document.getElementById(
                'atrakHonorModal'
            );

        if (modal) {
            modal.remove();
        }


        renderAtrakHonors(
            'atrakHonorsHomeGrid'
        );

        renderAtrakHonors(
            'atrakHonorsPageGrid'
        );
    };


    reader.readAsDataURL(
        photoInput.files[0]
    );
}


async function deleteAtrakHonor(index) {

    if (!state.isAdmin) return;


    const students =
        getAtrakHonors();


    students.splice(
        index,
        1
    );


    await saveAtrakHonors(
        students
    );


    renderAtrakHonors(
        'atrakHonorsPageGrid'
    );

    renderAtrakHonors(
        'atrakHonorsHomeGrid'
    );
}
/* =========================================================
   اجرای افتخارات بعد از آماده شدن کامل سایت
   ========================================================= */

function refreshAtrakHonors() {

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


    const adminBox =
        document.getElementById(
            'atrakHonorsAdminBox'
        );

    if (adminBox) {

        adminBox.style.display =
            (
                typeof state !== 'undefined' &&
                state.isAdmin
            )
            ? 'flex'
            : 'none';
    }
}


window.addEventListener(
    'load',
    function () {

        setTimeout(
            refreshAtrakHonors,
            300
        );

    }
);
