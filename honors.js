/* =========================================================
   افتخارآفرینان اترک  —  نسخه اصلاح‌شده
   این فایل را به‌طور کامل جایگزین honors.js قبلی کنید.
   ========================================================= */
 
const ATRAK_HONORS_KEY = 'atrak_honors_v1';
const ATRAK_HONORS_HOME_LIMIT = 4;   // تعداد کارت در صفحه اصلی
 
 
/* ---------- ابزارهای کمکی ---------- */
 
function atrakHonorEscape(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
 
function atrakHonorIsAdmin() {
    return (typeof state !== 'undefined' && state && state.isAdmin === true);
}
 
/* عکس را کوچک و فشرده می‌کند تا حافظه مرورگر پر نشود */
function atrakHonorCompressImage(file, maxSize, quality) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
 
        reader.onerror = function () { reject(new Error('خواندن فایل ناموفق بود.')); };
 
        reader.onload = function (e) {
            const img = new Image();
 
            img.onerror = function () { reject(new Error('فایل انتخاب‌شده عکس معتبر نیست.')); };
 
            img.onload = function () {
                /* برش مربعی از وسط عکس (برای قاب دایره‌ای) */
                const side = Math.min(img.width, img.height);
                const sx = (img.width - side) / 2;
                const sy = (img.height - side) / 2;
                const out = Math.min(maxSize, side);
 
                const canvas = document.createElement('canvas');
                canvas.width = out;
                canvas.height = out;
 
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, out, out);
                ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
 
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
 
            img.src = e.target.result;
        };
 
        reader.readAsDataURL(file);
    });
}
 
 
/* ---------- خواندن / ذخیره ---------- */
 
function getAtrakHonors() {
    try {
        const list = JSON.parse(localStorage.getItem(ATRAK_HONORS_KEY) || '[]');
        return Array.isArray(list) ? list : [];
    } catch (error) {
        return [];
    }
}
 
async function saveAtrakHonors(list) {
    /* اگر حافظه پر باشد خطا می‌دهد؛ در saveAtrakHonor مدیریت می‌شود */
    localStorage.setItem(ATRAK_HONORS_KEY, JSON.stringify(list));
 
    if (typeof syncStateToCloud === 'function') {
        await syncStateToCloud();
    }
}
 
 
/* ---------- نمایش کارت‌ها ---------- */
 
function renderAtrakHonors(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
 
    const isHome = (containerId === 'atrakHonorsHomeGrid');
    const all = getAtrakHonors();
    const students = isHome ? all.slice(0, ATRAK_HONORS_HOME_LIMIT) : all;
 
    if (!students.length) {
        container.innerHTML = `
            <div class="atrak-honors-empty">
                هنوز افتخارآفرینی ثبت نشده است.
            </div>
        `;
        return;
    }
 
    container.innerHTML = students.map(function (student, i) {
        const fullName = atrakHonorEscape(student.firstName) + ' ' + atrakHonorEscape(student.lastName);
 
        return `
        <article class="atrak-honor-card" style="--i:${i}">
            <div class="atrak-honor-photo-wrap">
                <img src="${atrakHonorEscape(student.photo)}"
                     alt="${fullName}"
                     class="atrak-honor-photo"
                     loading="lazy" decoding="async">
            </div>
 
            <div class="atrak-honor-name">${fullName}</div>
            <div class="atrak-honor-university">${atrakHonorEscape(student.university)}</div>
 
            ${atrakHonorIsAdmin() ? `
                <button type="button" class="atrak-honor-delete"
                        onclick="deleteAtrakHonor(${Number(student.id)})">
                    حذف
                </button>` : ''}
        </article>`;
    }).join('');
}
 
function atrakHonorsRerenderAll() {
    if (document.getElementById('atrakHonorsHomeGrid')) renderAtrakHonors('atrakHonorsHomeGrid');
    if (document.getElementById('atrakHonorsPageGrid')) renderAtrakHonors('atrakHonorsPageGrid');
}
 
 
/* ---------- پنجره افزودن (فقط مدیر) ---------- */
 
function openAtrakHonorAdmin() {
    if (!atrakHonorIsAdmin()) return;
 
    const old = document.getElementById('atrakHonorModal');
    if (old) old.remove();
 
    const modal = document.createElement('div');
    modal.id = 'atrakHonorModal';
    modal.className = 'atrak-honor-modal-overlay';
 
    modal.innerHTML = `
        <div class="atrak-honor-modal">
 
            <button type="button" class="atrak-honor-modal-close"
                    onclick="document.getElementById('atrakHonorModal').remove()">×</button>
 
            <h2>افزودن افتخارآفرین</h2>
 
            <div class="atrak-honor-form">
 
                <div class="atrak-honor-preview" id="atrakHonorPreview">عکس</div>
 
                <label>
                    عکس دانش‌آموز
                    <input type="file" id="atrakHonorPhoto" accept="image/*">
                </label>
 
                <label>
                    نام
                    <input type="text" id="atrakHonorFirstName" placeholder="نام">
                </label>
 
                <label>
                    نام خانوادگی
                    <input type="text" id="atrakHonorLastName" placeholder="نام خانوادگی">
                </label>
 
                <label>
                    دانشگاه / رتبه
                    <input type="text" id="atrakHonorUniversity" placeholder="مثلاً: دانشگاه تهران">
                </label>
 
                <button type="button" class="atrak-honors-save-btn" id="atrakHonorSaveBtn"
                        onclick="saveAtrakHonor()">
                    ذخیره
                </button>
            </div>
        </div>
    `;
 
    /* کلیک روی بیرون پنجره = بستن */
    modal.addEventListener('mousedown', function (e) {
        if (e.target === modal) modal.remove();
    });
 
    document.body.appendChild(modal);
 
    /* پیش‌نمایش دایره‌ای عکس */
    const fileInput = document.getElementById('atrakHonorPhoto');
    fileInput.addEventListener('change', function () {
        const f = fileInput.files[0];
        const box = document.getElementById('atrakHonorPreview');
        if (!f || !box) return;
        const url = URL.createObjectURL(f);
        box.innerHTML = '<img src="' + url + '" alt="">';
    });
}
 
 
async function saveAtrakHonor() {
    if (!atrakHonorIsAdmin()) return;
 
    const photoInput = document.getElementById('atrakHonorPhoto');
    const firstName  = document.getElementById('atrakHonorFirstName').value.trim();
    const lastName   = document.getElementById('atrakHonorLastName').value.trim();
    const university = document.getElementById('atrakHonorUniversity').value.trim();
    const btn        = document.getElementById('atrakHonorSaveBtn');
 
    if (!photoInput.files[0] || !firstName || !lastName || !university) {
        alert('لطفاً همه اطلاعات (عکس، نام، نام خانوادگی، دانشگاه) را کامل وارد کنید.');
        return;
    }
 
    if (btn) { btn.disabled = true; btn.textContent = 'در حال ذخیره...'; }
 
    try {
        const photo = await atrakHonorCompressImage(photoInput.files[0], 500, 0.82);
 
        const students = getAtrakHonors();
        students.push({
            id: Date.now(),
            photo: photo,
            firstName: firstName,
            lastName: lastName,
            university: university
        });
 
        await saveAtrakHonors(students);
 
        const modal = document.getElementById('atrakHonorModal');
        if (modal) modal.remove();
 
        atrakHonorsRerenderAll();
 
    } catch (error) {
        console.error('خطا در ذخیره افتخارآفرین:', error);
        alert('ذخیره انجام نشد: ' + (error && error.message ? error.message : 'حافظه مرورگر پر است یا عکس مشکل دارد.'));
        if (btn) { btn.disabled = false; btn.textContent = 'ذخیره'; }
    }
}
 
 
async function deleteAtrakHonor(id) {
    if (!atrakHonorIsAdmin()) return;
    if (!confirm('این افتخارآفرین حذف شود؟')) return;
 
    const students = getAtrakHonors().filter(function (s) {
        return Number(s.id) !== Number(id);
    });
 
    await saveAtrakHonors(students);
    atrakHonorsRerenderAll();
}
 
 
/* ---------- اجرای بعد از آماده شدن سایت ---------- */
 
function refreshAtrakHonors() {
    atrakHonorsRerenderAll();
 
    const adminBox = document.getElementById('atrakHonorsAdminBox');
    if (adminBox) {
        adminBox.style.display = atrakHonorIsAdmin() ? 'flex' : 'none';
    }
}
 
window.addEventListener('load', function () {
    setTimeout(refreshAtrakHonors, 300);
});
 
