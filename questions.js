  window.addEventListener('load', function() {
    setTimeout(function() {
        restoreIcons();
        loadSavedEdits();
    }, 100);
});

/* =========================================================
   سیستم کامل مدیریت سوالات
   نسخه مستقل برای هر درس و هر نوبت
========================================================= */

const QUESTION_STORAGE_KEY = 'atrak_questions_v1';


/* =========================================================
   دریافت بانک سوالات
========================================================= */

function getAllQuestionsData() {

    try {

        const saved =
            localStorage.getItem(QUESTION_STORAGE_KEY);

        if (!saved) {
            return {};
        }

        const data = JSON.parse(saved);

        return data && typeof data === 'object'
            ? data
            : {};

    } catch (error) {

        console.error(
            'خطا در خواندن سوالات:',
            error
        );

        return {};
    }
}


/* =========================================================
   ذخیره کل بانک سوالات
========================================================= */

function saveAllQuestionsData(data) {

    try {

        localStorage.setItem(
            QUESTION_STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            'خطا در ذخیره سوالات:',
            error
        );

        alert(
            'ذخیره سوالات انجام نشد.'
        );

        return false;
    }
}


/* =========================================================
   دریافت سوالات یک درس
========================================================= */

function getLessonQuestions(lessonId) {

    const allData =
        getAllQuestionsData();

    if (!allData[lessonId]) {

        allData[lessonId] = {

            textbook: [],

            'first-term': [],

            'second-term': []

        };

    }

    if (!Array.isArray(allData[lessonId].textbook)) {
        allData[lessonId].textbook = [];
    }

    if (!Array.isArray(allData[lessonId]['first-term'])) {
        allData[lessonId]['first-term'] = [];
    }

    if (!Array.isArray(allData[lessonId]['second-term'])) {
        allData[lessonId]['second-term'] = [];
    }

    return allData[lessonId];
}


/* =========================================================
   ذخیره سوالات یک درس
========================================================= */

function saveLessonQuestions(
    lessonId,
    lessonQuestions
) {

    const allData =
        getAllQuestionsData();

    allData[lessonId] =
        lessonQuestions;

    return saveAllQuestionsData(
        allData
    );
}


/* =========================================================
   عنوان دسته سوال
========================================================= */

function getQuestionCategoryTitle(category) {

    if (category === 'textbook') {
        return 'سوالات متن کتاب';
    }

    if (category === 'first-term') {
        return 'نوبت اول';
    }

    if (category === 'second-term') {
        return 'نوبت دوم';
    }

    return 'سوالات';
}


/* =========================================================
   HTML امن
========================================================= */

function escapeQuestionHTML(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* =========================================================
   باز کردن پنل مدیریت سوالات
========================================================= */

function openQuestionAdminPanel() {

    /* =====================================================
       بررسی حالت مدیریت
    ===================================================== */

    if (
        typeof state !== 'undefined' &&
        !state.isAdmin
    ) {

        alert(
            'ابتدا وارد حالت مدیریت شوید.'
        );

        return;

    }


    /* =====================================================
       دریافت درس فعلی
    ===================================================== */

    let lessonId =
        window.currentLessonId || '';


    let lessonName =
        window.currentLessonName || '';


    /* =====================================================
       اگر متغیرهای window خالی بودند،
       از state.currentView کمک می‌گیریم
    ===================================================== */

    if (
        !lessonId &&
        typeof state !== 'undefined' &&
        state.currentView
    ) {

        lessonId =
            state.currentView;

    }


    /* =====================================================
       تلاش برای پیدا کردن نام درس از صفحه
    ===================================================== */

    if (!lessonName) {

        const titleElement =
            document.querySelector(
                '[data-editable$="-title"]'
            );


        if (
            titleElement &&
            titleElement.textContent.trim()
        ) {

            lessonName =
                titleElement.textContent.trim();

        }

    }


    /* =====================================================
       اگر هنوز نام درس پیدا نشده
    ===================================================== */

    if (!lessonName) {

        lessonName =
            'درس فعلی';

    }


    /* =====================================================
       بررسی نهایی
    ===================================================== */

    if (!lessonId) {

        alert(
            'شناسه درس فعلی پیدا نشد. ابتدا وارد یک درس شوید.'
        );

        return;

    }


    /* =====================================================
       باز کردن پنل مدیریت
    ===================================================== */

    showQuestionAdminPanel(
        lessonId,
        lessonName
    );

}


/* =========================================================
   نمایش پنل مدیریت
========================================================= */

function showQuestionAdminPanel(
    lessonId,
    lessonName
) {

    let modal =
        document.getElementById(
            'questionAdminModal'
        );


    if (!modal) {

        modal =
            document.createElement('div');

        modal.id =
            'questionAdminModal';

        modal.className =
            'modal-overlay';

        document.body.appendChild(
            modal
        );
    }


    const questions =
        getLessonQuestions(
            lessonId
        );


    modal.innerHTML = `

        <div class="modal-box"
             style="
                width:min(850px,95vw);
                max-height:90vh;
                overflow-y:auto;
                text-align:right;
             ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                margin-bottom:20px;
                flex-wrap:wrap;
            ">

                <div>

                    <h3 style="
                        font-size:20px;
                        color:var(--primary-purple);
                        margin-bottom:6px;
                    ">
                        📝 مدیریت سوالات
                    </h3>

                    <div style="
                        font-size:13px;
                        color:var(--text-muted);
                    ">
                        درس: ${escapeQuestionHTML(lessonName)}
                    </div>

                    <div style="
                        font-size:11px;
                        color:var(--text-muted);
                        margin-top:4px;
                    ">
                        شناسه درس: ${escapeQuestionHTML(lessonId)}
                    </div>

                </div>

                <button
                    class="btn-primary"
                    style="
                        background:#6b7280;
                        padding:8px 16px;
                    "
                    onclick="closeQuestionAdminPanel()" type="button">
                    بستن
                </button>

            </div>


            <!-- =====================================
                 انتخاب بخش
            ====================================== -->

            <div style="
                display:grid;
                grid-template-columns:
                repeat(3,1fr);
                gap:10px;
                margin-bottom:20px;
            ">

                <button
                    id="qaTabTextbook"
                    class="btn-primary"
                    onclick="
                        renderQuestionAdminCategory(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            'textbook'
                        )
                    " type="button">
                    📖 سوالات متن کتاب
                </button>


                <button
                    id="qaTabFirst"
                    class="btn-primary"
                    style="background:#2563eb;"
                    onclick="
                        renderQuestionAdminCategory(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            'first-term'
                        )
                    " type="button">
                    📅 نوبت اول
                </button>


                <button
                    id="qaTabSecond"
                    class="btn-primary"
                    style="background:#059669;"
                    onclick="
                        renderQuestionAdminCategory(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            'second-term'
                        )
                    " type="button">
                    📅 نوبت دوم
                </button>

            </div>


            <div id="questionAdminContent"></div>

        </div>

    `;


    modal.style.display =
        'flex';


    renderQuestionAdminCategory(
        lessonId,
        lessonName,
        'textbook'
    );
}


/* =========================================================
   بستن پنل مدیریت سوالات
========================================================= */

function closeQuestionAdminPanel() {

    const modal =
        document.getElementById(
            'questionAdminModal'
        );

    if (modal) {

        modal.style.display =
            'none';
    }
}


/* =========================================================
   نمایش سوالات یک دسته در پنل
========================================================= */

function renderQuestionAdminCategory(
    lessonId,
    lessonName,
    category
) {

    const container =
        document.getElementById(
            'questionAdminContent'
        );


    if (!container) {
        return;
    }


    /* =====================================================
       یکسان‌سازی نام دسته سوال
    ===================================================== */

    let safeCategory =
        String(category || '').trim();


    if (
        safeCategory === 'firstTerm' ||
        safeCategory === 'first-term' ||
        safeCategory === 'first_term'
    ) {

        safeCategory = 'first-term';

    }


    else if (
        safeCategory === 'secondTerm' ||
        safeCategory === 'second-term' ||
        safeCategory === 'second_term'
    ) {

        safeCategory = 'second-term';

    }


    else {

        safeCategory = 'textbook';

    }


    /* =====================================================
       دریافت سوالات درس
    ===================================================== */

    const lessonQuestions =
        getLessonQuestions(
            lessonId
        ) || {};


    /* =====================================================
       پیدا کردن آرایه صحیح سوالات
    ===================================================== */

    let list = [];


    if (safeCategory === 'textbook') {

        if (
            Array.isArray(
                lessonQuestions.textbook
            )
        ) {

            list =
                lessonQuestions.textbook;

        }

    }


    else if (safeCategory === 'first-term') {

        /*
           ابتدا ساختار جدید
        */

        if (
            Array.isArray(
                lessonQuestions['first-term']
            )
        ) {

            list =
                lessonQuestions['first-term'];

        }

        /*
           سپس ساختار قدیمی
        */

        else if (
            Array.isArray(
                lessonQuestions.firstTerm
            )
        ) {

            list =
                lessonQuestions.firstTerm;

        }

    }


    else if (safeCategory === 'second-term') {

        /*
           ابتدا ساختار جدید
        */

        if (
            Array.isArray(
                lessonQuestions['second-term']
            )
        ) {

            list =
                lessonQuestions['second-term'];

        }

        /*
           سپس ساختار قدیمی
        */

        else if (
            Array.isArray(
                lessonQuestions.secondTerm
            )
        ) {

            list =
                lessonQuestions.secondTerm;

        }

    }


    /* =====================================================
       عنوان بخش
    ===================================================== */

    let title = 'سوالات';


    if (safeCategory === 'textbook') {

        title =
            'سوالات متن کتاب';

    }

    else if (safeCategory === 'first-term') {

        title =
            'سوالات نوبت اول';

    }

    else if (safeCategory === 'second-term') {

        title =
            'سوالات نوبت دوم';

    }


    /* =====================================================
       ساخت صفحه مدیریت
    ===================================================== */

    container.innerHTML = `

        <div
            style="
                background:rgba(236,72,153,.07);
                border:1px solid var(--card-border);
                border-radius:16px;
                padding:18px;
            "
        >

            <!-- =========================================
                 سربرگ
            ========================================== -->

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    margin-bottom:18px;
                    flex-wrap:wrap;
                "
            >

                <div>

                    <h4
                        style="
                            font-size:18px;
                            color:var(--text-color);
                            margin:0;
                        "
                    >
                        ${title}
                    </h4>


                    <div
                        style="
                            font-size:12px;
                            color:var(--text-muted);
                            margin-top:5px;
                        "
                    >
                        تعداد سوالات:
                        ${list.length}
                    </div>

                </div>


                <!-- =====================================
                     افزودن سوال
                ====================================== -->

                <button
                    class="btn-primary"
                    type="button"
                    style="
                        background:#059669;
                        padding:9px 18px;
                    "
                    onclick="
                        openQuestionEditor(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            '${safeCategory}',
                            null
                        )
                    "
                >

                    ➕ افزودن سوال

                </button>

            </div>


            <!-- =========================================
                 لیست سوالات
            ========================================== -->

            <div id="questionAdminList">

                ${
                    list.length === 0

                    ?

                    `
                    <div
                        style="
                            text-align:center;
                            padding:35px 15px;
                            color:var(--text-muted);
                            background:rgba(255,255,255,.15);
                            border-radius:14px;
                        "
                    >

                        <div
                            style="
                                font-size:38px;
                                margin-bottom:10px;
                            "
                        >
                            📝
                        </div>


                        هنوز سوالی در این بخش ثبت نشده است.


                        <br>


                        <span
                            style="
                                font-size:12px;
                                margin-top:8px;
                                display:inline-block;
                            "
                        >
                            برای افزودن سوال روی
                            «افزودن سوال» بزنید.
                        </span>

                    </div>
                    `

                    :

                    list.map(
                        (item, index) => {

                            const questionText =
                                typeof item === 'string'
                                    ? item
                                    : (
                                        item.question ||
                                        item.text ||
                                        ''
                                    );


                            const answerText =
                                typeof item === 'string'
                                    ? ''
                                    : (
                                        item.answer ||
                                        ''
                                    );


                            const questionId =
                                typeof item === 'object' &&
                                item.id
                                    ? item.id
                                    : index;


                            return `

                                <div
                                    style="
                                        background:var(--card-bg);
                                        border:1px solid var(--card-border);
                                        border-radius:14px;
                                        padding:15px;
                                        margin-bottom:12px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            gap:10px;
                                            align-items:flex-start;
                                        "
                                    >

                                        <!-- شماره -->

                                        <div
                                            style="
                                                font-weight:800;
                                                color:var(--accent-pink);
                                                min-width:30px;
                                            "
                                        >
                                            ${index + 1}.
                                        </div>


                                        <!-- متن سوال -->

                                        <div
                                            style="
                                                flex:1;
                                                min-width:0;
                                            "
                                        >

                                            <div
                                                style="
                                                    font-weight:700;
                                                    line-height:1.9;
                                                    color:var(--text-color);
                                                    white-space:pre-wrap;
                                                "
                                            >
                                                ${escapeQuestionHTML(
                                                    questionText
                                                )}
                                            </div>


                                            ${
                                                answerText
                                                    ?

                                                    `
                                                    <div
                                                        style="
                                                            margin-top:8px;
                                                            padding:10px;
                                                            background:rgba(16,185,129,.08);
                                                            border-radius:10px;
                                                            font-size:13px;
                                                            line-height:1.9;
                                                            color:var(--text-muted);
                                                            white-space:pre-wrap;
                                                        "
                                                    >

                                                        <strong>
                                                            پاسخ:
                                                        </strong>

                                                        ${escapeQuestionHTML(
                                                            answerText
                                                        )}

                                                    </div>
                                                    `

                                                    :

                                                    ''
                                            }

                                        </div>


                                        <!-- دکمه‌ها -->

                                        <div
                                            style="
                                                display:flex;
                                                gap:6px;
                                                flex-wrap:wrap;
                                            "
                                        >

                                            <!-- ویرایش -->

                                            <button
                                                type="button"
                                                style="
                                                    border:none;
                                                    border-radius:8px;
                                                    padding:7px 10px;
                                                    cursor:pointer;
                                                    background:#2563eb;
                                                    color:white;
                                                "
                                                onclick="
                                                    openQuestionEditor(
                                                        '${escapeQuestionHTML(lessonId)}',
                                                        '${escapeQuestionHTML(lessonName)}',
                                                        '${safeCategory}',
                                                        '${escapeQuestionHTML(String(questionId))}'
                                                    )
                                                "
                                            >
                                                ✏️
                                            </button>


                                            <!-- حذف -->

                                            <button
                                                type="button"
                                                style="
                                                    border:none;
                                                    border-radius:8px;
                                                    padding:7px 10px;
                                                    cursor:pointer;
                                                    background:#dc2626;
                                                    color:white;
                                                "
                                                onclick="
                                                    deleteQuestion(
                                                        '${escapeQuestionHTML(lessonId)}',
                                                        '${safeCategory}',
                                                        '${escapeQuestionHTML(String(questionId))}',
                                                        '${escapeQuestionHTML(lessonName)}'
                                                    )
                                                "
                                            >
                                                🗑️
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            `;

                        }
                    ).join('')
                }

            </div>

        </div>

    `;
}


/* =========================================================
   ویرایش / افزودن سوال
========================================================= */

function openQuestionEditor(
    lessonId,
    lessonName,
    category,
    questionId
) {

    const lessonQuestions =
        getLessonQuestions(
            lessonId
        );


    const list =
        lessonQuestions[category] || [];


    let existing = null;


    if (questionId) {

        existing =
            list.find(
                item =>
                    item.id === questionId
            );
    }


    let modal =
        document.getElementById(
            'questionEditorModal'
        );


    if (!modal) {

        modal =
            document.createElement('div');

        modal.id =
            'questionEditorModal';

        modal.className =
            'modal-overlay';

        document.body.appendChild(
            modal
        );
    }


    const title =
        existing
            ? 'ویرایش سوال'
            : 'افزودن سوال جدید';


    modal.innerHTML = `

        <div class="modal-box"
             style="
                width:min(650px,95vw);
                text-align:right;
             ">

            <h3 style="
                font-size:19px;
                color:var(--primary-purple);
                margin-bottom:6px;
            ">
                ${title}
            </h3>


            <p style="
                font-size:13px;
                color:var(--text-muted);
                margin-bottom:18px;
            ">
                ${escapeQuestionHTML(lessonName)}
                —
                ${getQuestionCategoryTitle(category)}
            </p>


            <label style="
                display:block;
                font-weight:700;
                margin-bottom:8px;
            ">
                متن سوال
            </label>


            <textarea
                id="questionEditorText"
                placeholder="متن سوال را وارد کنید..."
                style="
                    width:100%;
                    min-height:130px;
                    resize:vertical;
                    padding:13px;
                    border:2px solid var(--card-border);
                    border-radius:12px;
                    background:rgba(255,255,255,.6);
                    color:var(--text-color);
                    font-family:inherit;
                    font-size:14px;
                    line-height:2;
                    outline:none;
                "
            >${existing ? escapeQuestionHTML(existing.question) : ''}</textarea>


            <label style="
                display:block;
                font-weight:700;
                margin-top:18px;
                margin-bottom:8px;
            ">
                پاسخ سوال
                <span style="
                    font-size:11px;
                    color:var(--text-muted);
                    font-weight:400;
                ">
                    (اختیاری)
                </span>
            </label>


            <textarea
                id="questionEditorAnswer"
                placeholder="پاسخ سوال را وارد کنید..."
                style="
                    width:100%;
                    min-height:110px;
                    resize:vertical;
                    padding:13px;
                    border:2px solid var(--card-border);
                    border-radius:12px;
                    background:rgba(255,255,255,.6);
                    color:var(--text-color);
                    font-family:inherit;
                    font-size:14px;
                    line-height:2;
                    outline:none;
                "
            >${existing ? escapeQuestionHTML(existing.answer || '') : ''}</textarea>


            <div style="
                display:flex;
                justify-content:center;
                gap:10px;
                margin-top:20px;
                flex-wrap:wrap;
            ">

                <button
                    class="btn-primary"
                    onclick="
                        saveQuestionFromEditor(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            '${category}',
                            '${questionId || ''}'
                        )
                    " type="button">
                    💾 ذخیره سوال
                </button>


                <button
                    class="btn-primary"
                    style="background:#6b7280;"
                    onclick="
                        closeQuestionEditor()
                    " type="button">
                    انصراف
                </button>

            </div>

        </div>

    `;


    modal.style.display =
        'flex';


    setTimeout(
        () => {

            const textarea =
                document.getElementById(
                    'questionEditorText'
                );

            if (textarea) {
                textarea.focus();
            }

        },
        50
    );
}


/* =========================================================
   ذخیره سوال از ویرایشگر
========================================================= */

/* =========================================================
   ذخیره نهایی سوال
   سازگار با متن کتاب / نوبت اول / نوبت دوم
========================================================= */

function saveQuestionFromEditor(
    lessonId,
    lessonName,
    category,
    questionId
) {

    /* =====================================================
       بررسی ورودی سوال
    ===================================================== */

    const questionInput =
        document.getElementById(
            'questionEditorText'
        );


    const answerInput =
        document.getElementById(
            'questionEditorAnswer'
        );


    if (!questionInput) {

        alert(
            'خطا: کادر متن سوال پیدا نشد.'
        );

        return;

    }


    const question =
        questionInput.value.trim();


    const answer =
        answerInput
            ? answerInput.value.trim()
            : '';


    if (!question) {

        alert(
            'لطفاً متن سوال را وارد کنید.'
        );

        questionInput.focus();

        return;

    }


    /* =====================================================
       یکسان‌سازی دسته سوال
    ===================================================== */

    let safeCategory =
        String(category || '').trim();


    if (
        safeCategory === 'firstTerm' ||
        safeCategory === 'first-term' ||
        safeCategory === 'first_term'
    ) {

        safeCategory =
            'first-term';

    }


    else if (
        safeCategory === 'secondTerm' ||
        safeCategory === 'second-term' ||
        safeCategory === 'second_term'
    ) {

        safeCategory =
            'second-term';

    }


    else {

        safeCategory =
            'textbook';

    }


    /* =====================================================
       دریافت اطلاعات فعلی درس
    ===================================================== */

    const lessonQuestions =
        getLessonQuestions(
            lessonId
        );


    if (
        !lessonQuestions ||
        typeof lessonQuestions !== 'object'
    ) {

        alert(
            'اطلاعات سوالات این درس پیدا نشد.'
        );

        return;

    }


    /* =====================================================
       اطمینان از وجود هر سه دسته
    ===================================================== */

    if (
        !Array.isArray(
            lessonQuestions.textbook
        )
    ) {

        lessonQuestions.textbook = [];

    }


    if (
        !Array.isArray(
            lessonQuestions['first-term']
        )
    ) {

        lessonQuestions['first-term'] = [];

    }


    if (
        !Array.isArray(
            lessonQuestions['second-term']
        )
    ) {

        lessonQuestions['second-term'] = [];

    }


    /* =====================================================
       انتخاب لیست صحیح
    ===================================================== */

    const list =
        lessonQuestions[
            safeCategory
        ];


    /* =====================================================
       ویرایش سوال موجود
    ===================================================== */

    if (questionId) {

        const index =
            list.findIndex(
                item =>
                    String(item.id) ===
                    String(questionId)
            );


        if (index !== -1) {

            const oldQuestion =
                list[index];


            list[index] = {

                ...oldQuestion,

                question:
                    question,

                answer:
                    answer

            };

        }


        else {

            /*
               اگر شناسه پیدا نشد،
               سوال را به عنوان سوال جدید اضافه می‌کنیم.
            */

            list.push({

                id:
                    'q_' +
                    Date.now() +
                    '_' +
                    Math.random()
                        .toString(36)
                        .slice(2, 8),

                question:
                    question,

                answer:
                    answer,

                createdAt:
                    new Date().toISOString()

            });

        }

    }


    /* =====================================================
       افزودن سوال جدید
    ===================================================== */

    else {

        list.push({

            id:
                'q_' +
                Date.now() +
                '_' +
                Math.random()
                    .toString(36)
                    .slice(2, 8),

            question:
                question,

            answer:
                answer,

            createdAt:
                new Date().toISOString()

        });

    }


    /* =====================================================
       ذخیره دائمی
    ===================================================== */

    const saved =
        saveLessonQuestions(
            lessonId,
            lessonQuestions
        );


    if (!saved) {

        alert(
            'ذخیره سوال انجام نشد.'
        );

        return;

    }


    /* =====================================================
       بستن پنجره
    ===================================================== */

    closeQuestionEditor();


    /* =====================================================
       نمایش مجدد همان دسته
    ===================================================== */

    renderQuestionAdminCategory(
        lessonId,
        lessonName,
        safeCategory
    );


    /* =====================================================
       پیام موفقیت
    ===================================================== */

    alert(

        questionId

            ? 'سوال با موفقیت ویرایش شد.'

            : 'سوال با موفقیت اضافه شد.'

    );

}


/* =========================================================
   حذف سوال
========================================================= */

function deleteQuestion(
    lessonId,
    category,
    questionId,
    lessonName
) {

    const confirmed =
        confirm(
            'آیا مطمئن هستید که می‌خواهید این سوال حذف شود؟'
        );


    if (!confirmed) {
        return;
    }


    const lessonQuestions =
        getLessonQuestions(
            lessonId
        );


    const list =
        lessonQuestions[category] || [];


    lessonQuestions[category] =
        list.filter(
            item =>
                item.id !== questionId
        );


    if (
        saveLessonQuestions(
            lessonId,
            lessonQuestions
        )
    ) {

        renderQuestionAdminCategory(
            lessonId,
            lessonName,
            category
        );

    }
}


/* =========================================================
   بستن ویرایشگر
========================================================= */

function closeQuestionEditor() {

    const modal =
        document.getElementById(
            'questionEditorModal'
        );


    if (modal) {

        modal.style.display =
            'none';
    }
}


/* =========================================================
   نمایش سوالات برای کاربر
========================================================= */

/* =========================================================
   باز کردن بخش سوالات یک درس
   سپس نمایش 15 درس داخلی
   ========================================================= */

/* =========================================================
   باز کردن بخش سوالات یک درس
   نسخه نهایی و مقاوم در برابر تغییر شناسه
   ========================================================= */

/* =========================================================
   باز کردن بخش سوالات یک کتاب
   ساخت تعداد درس‌ها بر اساس پایه و کتاب
   ========================================================= */


function getQuestionChapterSettings() {
    try {
        return JSON.parse(
            localStorage.getItem('atrak_question_chapter_settings') || '{}'
        );
    } catch (e) {
        return {};
    }
}

function saveQuestionChapterSettings(settings) {
    localStorage.setItem(
        'atrak_question_chapter_settings',
        JSON.stringify(settings)
    );
}

function getQuestionChapterText(
    lessonId,
    category,
    chapterId,
    defaultTitle
) {
    const settings = getQuestionChapterSettings();

    const key = `${lessonId}__${category}__${chapterId}`;

    return {
        title:
            settings[key]?.title ||
            defaultTitle,

        description:
            settings[key]?.description ||
            'برای مشاهده سوالات وارد شوید'
    };
}

function editQuestionChapterText(
    lessonId,
    lessonName,
    category,
    chapterId,
    defaultTitle
) {
    if (!state.isAdmin) {
        return;
    }

    const current = getQuestionChapterText(
        lessonId,
        category,
        chapterId,
        defaultTitle
    );

    const newTitle = prompt(
        'عنوان این بخش را وارد کنید:',
        current.title
    );

    if (newTitle === null) {
        return;
    }

    const newDescription = prompt(
        'توضیح زیر عنوان را وارد کنید:',
        current.description
    );

    if (newDescription === null) {
        return;
    }

    const settings = getQuestionChapterSettings();

    const key = `${lessonId}__${category}__${chapterId}`;

    settings[key] = {
        title:
            newTitle.trim() ||
            defaultTitle,

        description:
            newDescription.trim() ||
            'برای مشاهده سوالات وارد شوید'
    };

    saveQuestionChapterSettings(settings);

    openQuestionCategory(
        lessonId,
        lessonName,
        category
    );
}

function openQuestionCategory(
    lessonId,
    lessonName,
    category
) {

    const container =
        document.getElementById(
            'mainAppContent'
        );

    if (!container) {
        return;
    }


    /* =====================================================
       یکسان‌سازی دسته سوالات
    ===================================================== */

    let safeCategory =
        String(category || '').trim();


    if (
        safeCategory === 'firstTerm' ||
        safeCategory === 'first_term' ||
        safeCategory === 'first-term'
    ) {

        safeCategory = 'first-term';

    }

    else if (
        safeCategory === 'secondTerm' ||
        safeCategory === 'second_term' ||
        safeCategory === 'second-term'
    ) {

        safeCategory = 'second-term';

    }

    else {

        safeCategory = 'textbook';

    }


    /* =====================================================
       عنوان دسته
    ===================================================== */

    let categoryTitle =
        'سوالات متن کتاب';


    if (
        safeCategory === 'first-term'
    ) {

        categoryTitle =
            'سوالات نوبت اول';

    }

    else if (
        safeCategory === 'second-term'
    ) {

        categoryTitle =
            'سوالات نوبت دوم';

    }


    /* =====================================================
       ذخیره وضعیت
    ===================================================== */

    state.currentView =
        'question-chapters';

    window.currentLessonId =
        lessonId;

    window.currentLessonName =
        lessonName;

    window.currentQuestionCategory =
        safeCategory;


    /* =====================================================
       تشخیص پایه و کتاب
    ===================================================== */

    const lessonKey =
        String(lessonId || '').trim();


    let grade = '';
    let subject = '';


    if (lessonKey.includes('m1-p7-')) {
    grade = 'هفتم';

} else if (lessonKey.includes('m1-p8-')) {
    grade = 'هشتم';

} else if (lessonKey.includes('m1-p9-')) {
    grade = 'نهم';

} else if (lessonKey.includes('m2-p10-')) {
    grade = 'دهم';

} else if (lessonKey.includes('m2-p11-')) {
    grade = 'یازدهم';

} else if (lessonKey.includes('m2-p12-')) {
    grade = 'دوازدهم';
}



    /* -----------------------------------------------------
       تشخیص شماره کتاب
    ----------------------------------------------------- */

    const subjectMatch =
        lessonKey.match(
            /lesson(\d+)/
        );


    if (
        subjectMatch
    ) {

        const subjectNumber =
            Number(
                subjectMatch[1]
            );


        const subjects = {

            1: 'قرآن',

            2: 'پیام‌های آسمانی',

            3: 'فارسی',

            4: 'ریاضی',

            5: 'علوم',

            6: 'مطالعات اجتماعی',

            7: 'عربی',

            8: 'انگلیسی'

        };


        subject =
            subjects[
                subjectNumber
            ] || lessonName;

    }

    else {

        subject =
            lessonName;

    }


    /* =====================================================
       تعداد درس‌های هر کتاب بر اساس پایه
    ===================================================== */

    const lessonCounts = window.lessonCounts = {

    /* =====================================================
       متوسطه اول
    ===================================================== */

    /* ---------- پایه هفتم ---------- */
    'm1-p7-lesson1': 12, // قرآن
    'm1-p7-lesson2': 15, // پیام‌های آسمانی
    'm1-p7-lesson3': 17, // فارسی
    'm1-p7-lesson4': 9,  // ریاضی
    'm1-p7-lesson5': 15, // علوم
    'm1-p7-lesson6': 24, // مطالعات اجتماعی
    'm1-p7-lesson7': 20, // عربی
    'm1-p7-lesson8': 8,  // انگلیسی

    /* ---------- پایه هشتم ---------- */
    'm1-p8-lesson1': 12, // قرآن
    'm1-p8-lesson2': 15, // پیام‌های آسمانی
    'm1-p8-lesson3': 17, // فارسی
    'm1-p8-lesson4': 9,  // ریاضی
    'm1-p8-lesson5': 15, // علوم
    'm1-p8-lesson6': 24, // مطالعات اجتماعی
    'm1-p8-lesson7': 10, // عربی
    'm1-p8-lesson8': 7,  // انگلیسی

    /* ---------- پایه نهم ---------- */
    'm1-p9-lesson1': 11, // قرآن
    'm1-p9-lesson2': 12, // پیام‌های آسمانی
    'm1-p9-lesson3': 17, // فارسی
    'm1-p9-lesson4': 8,  // ریاضی
    'm1-p9-lesson5': 15, // علوم
    'm1-p9-lesson6': 24, // مطالعات اجتماعی
    'm1-p9-lesson7': 10, // عربی
    'm1-p9-lesson8': 6,  // انگلیسی


    /* =====================================================
       متوسطه دوم - رشته ریاضی
    ===================================================== */

    /* ---------- دهم ریاضی ---------- */
    'm2-p10-riazi-riazi': 7,
    'm2-p10-riazi-fizik': 5,
    'm2-p10-riazi-shimi': 3,
    'm2-p10-riazi-hendese': 4,
    'm2-p10-riazi-azmayesh': 12,
    'm2-p10-riazi-farsi': 20,
    'm2-p10-riazi-din': 12,
    'm2-p10-riazi-english': 4,
    'm2-p10-riazi-arabi': 8,
    'm2-p10-riazi-joghrafia': 10,

    /* ---------- یازدهم ریاضی ---------- */
    'm2-p11-riazi-hesaban': 5,
    'm2-p11-riazi-hendese': 3,
    'm2-p11-riazi-amar': 4,
    'm2-p11-riazi-fizik': 4,
    'm2-p11-riazi-shimi': 3,
    'm2-p11-riazi-azmayesh': 3,
    'm2-p11-riazi-zamin': 7,
    'm2-p11-riazi-din': 12,
    'm2-p11-riazi-arabi': 7,
    'm2-p11-riazi-farsi': 20,
    'm2-p11-riazi-tarikh': 26,
    'm2-p11-riazi-english': 3,
    'm2-p11-riazi-mohit': 7,

    /* ---------- دوازدهم ریاضی ---------- */
    'm2-p12-riazi-hesaban': 5,
    'm2-p12-riazi-hendese': 3,
    'm2-p12-riazi-gosaste': 3,
    'm2-p12-riazi-shimi': 4,
    'm2-p12-riazi-fizik': 6,
    'm2-p12-riazi-din': 12,
    'm2-p12-riazi-english': 3,
    'm2-p12-riazi-arabi': 4,
    'm2-p12-riazi-farsi': 20,
    'm2-p12-riazi-hoviat': 10,
    'm2-p12-riazi-salamat': 14,


    /* =====================================================
       متوسطه دوم - رشته تجربی
    ===================================================== */

    /* ---------- دهم تجربی ---------- */
    'm2-p10-tajrobi-riazi': 7,
    'm2-p10-tajrobi-fizik': 4,
    'm2-p10-tajrobi-shimi': 3,
    'm2-p10-tajrobi-zist': 7,
    'm2-p10-tajrobi-azmayesh': 12,
    'm2-p10-tajrobi-farsi': 20,
    'm2-p10-tajrobi-din': 12,
    'm2-p10-tajrobi-english': 4,
    'm2-p10-tajrobi-arabi': 8,
    'm2-p10-tajrobi-joghrafia': 10,

    /* ---------- یازدهم تجربی ---------- */
    'm2-p11-tajrobi-zist': 9,
    'm2-p11-tajrobi-riazi': 7,
    'm2-p11-tajrobi-fizik': 3,
    'm2-p11-tajrobi-shimi': 3,
    'm2-p11-tajrobi-azmayesh': 3,
    'm2-p11-tajrobi-zamin': 7,
    'm2-p11-tajrobi-din': 12,
    'm2-p11-tajrobi-farsi': 20,
    'm2-p11-tajrobi-arabi': 7,
    'm2-p11-tajrobi-english': 7,
    'm2-p11-tajrobi-tarikh': 26,
    'm2-p11-tajrobi-mohit': 7,

    /* ---------- دوازدهم تجربی ---------- */
    'm2-p12-tajrobi-zist': 12,
    'm2-p12-tajrobi-riazi': 7,
    'm2-p12-tajrobi-fizik': 4,
    'm2-p12-tajrobi-shimi': 4,
    'm2-p12-tajrobi-din': 10,
    'm2-p12-tajrobi-english': 3,
    'm2-p12-tajrobi-arabi': 4,
    'm2-p12-tajrobi-farsi': 20,
    'm2-p12-tajrobi-hoviat': 10,
    'm2-p12-tajrobi-salamat': 14,


    /* =====================================================
       متوسطه دوم - رشته انسانی
    ===================================================== */

    /* ---------- دهم انسانی ---------- */
    'm2-p10-ensani-din': 12,
    'm2-p10-ensani-riazi': 4,
    'm2-p10-ensani-jame': 16,
    'm2-p10-ensani-mantegh': 10,
    'm2-p10-ensani-eghtesad': 14,
    'm2-p10-ensani-fonoon': 12,
    'm2-p10-ensani-farsi': 20,
    'm2-p10-ensani-english': 4,
    'm2-p10-ensani-arabi': 8,
    'm2-p10-ensani-tarikh': 16,
    'm2-p10-ensani-joghrafia': 10,

    /* ---------- یازدهم انسانی ---------- */
    'm2-p11-ensani-falsafe': 11,
    'm2-p11-ensani-jame': 15,
    'm2-p11-ensani-ravanshenasi': 8,
    'm2-p11-ensani-fonoon': 12,
    'm2-p11-ensani-farsi': 20,
    'm2-p11-ensani-din': 18,
    'm2-p11-ensani-tarikh': 16,
    'm2-p11-ensani-joghrafia': 11,
    'm2-p11-ensani-riazi': 3,
    'm2-p11-ensani-english': 3,
    'm2-p11-ensani-arabi': 7,
    'm2-p11-ensani-mohit': 7,

    /* ---------- دوازدهم انسانی ---------- */
    'm2-p12-ensani-falsafe': 12,
    'm2-p12-ensani-jame': 10,
    'm2-p12-ensani-fonoon': 12,
    'm2-p12-ensani-din': 13,
    'm2-p12-ensani-tarikh': 12,
    'm2-p12-ensani-joghrafia': 6,
    'm2-p12-ensani-riazi': 3,
    'm2-p12-ensani-farsi': 20,
    'm2-p12-ensani-arabi': 5,
    'm2-p12-ensani-english': 3,
    'm2-p12-ensani-salamat': 14

};


    let lessonCount =
        lessonCounts[lessonKey];


    /* =====================================================
       اگر کتاب ناشناخته بود
    ===================================================== */

    if (
        !lessonCount
    ) {

        lessonCount = 0;

    }


    /* =====================================================
       ساخت لیست درس‌ها
    ===================================================== */

    let chapters = [];


    /* =====================================================
       فارسی:
       ستایش + 17 درس + نیایش
    ===================================================== */

    if (
        subject === 'فارسی'
    ) {

        chapters.push({

            id: 'setayesh',

            title:
                `سوالات ستایش ${grade} همراه با جواب`

        });


        for (
            let i = 1;
            i <= 18;
            i++
        ) {

            chapters.push({

                id: i,

                title:
                    `سوالات درس ${i} فارسی ${grade} همراه با جواب`

            });

        }


        chapters.push({

            id: 'niayesh',

            title:
                `سوالات نیایش ${grade} همراه با جواب`

        });

    }


    /* =====================================================
       تمام کتاب‌های معمولی
    ===================================================== */

    else {

        for (
            let i = 1;
            i <= lessonCount;
            i++
        ) {

            chapters.push({

                id: i,

                title:
                    `سوالات درس ${i} ${subject} ${grade} همراه با جواب`

            });

        }

    }


    /* =====================================================
       اگر هیچ درسی پیدا نشد
    ===================================================== */

    if (
        chapters.length === 0
    ) {

        chapters.push({

            id: 'main',

            title:
                `سوالات ${lessonName} همراه با جواب`

        });

    }


    /* =====================================================
       ساخت کارت‌ها
    ===================================================== */

    let cardsHTML = '';


    chapters.forEach(
        (
            chapter,
            index
        ) => {

            const chapterText = getQuestionChapterText(
    lessonId,
    safeCategory,
    chapter.id,
    chapter.title
);


        const chapterId =
            `${lessonId}__questions__${safeCategory}__chapter_${chapter.id}`;


        cardsHTML += `

            <div
                class="drilldown-card"

                onclick="
    openQuestionChapter(
        '${escapeQuestionHTML(chapterId)}',
        '${escapeQuestionHTML(chapterText.title)}',
        '${escapeQuestionHTML(safeCategory)}',
        '${escapeQuestionHTML(lessonId)}',
        '${escapeQuestionHTML(lessonName)}'
        
    )
"

                style="
                    cursor:pointer;
                    min-height:150px;
                    display:flex;
                    flex-direction:column;
                    justify-content:center;
                    align-items:center;
                    text-align:center;
                    transition:
                        transform .2s ease,
                        box-shadow .2s ease;
                "
            >

                <div
                    style="
                        width:58px;
                        height:58px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        margin-bottom:12px;
                        background:
                            rgba(236,72,153,.10);
                        color:var(--accent-pink);
                        font-size:25px;
                        font-weight:900;
                    "
                >
                    ${index + 1}
                </div>


                <h3
                    style="
                        margin:0;
                        font-size:17px;
                        font-weight:900;
                        color:var(--text-color);
                        line-height:1.8;
                    "
                >
                    ${escapeQuestionHTML(
                        chapter.title
                    )}
                </h3>


                <p
                    style="
                        margin-top:7px;
                        font-size:12px;
                        color:var(--text-muted);
                    "
                >
                   ${escapeQuestionHTML(chapterText.description)}
                </p>

            </div>

        `;

    });


    /* =====================================================
       نمایش صفحه
    ===================================================== */

    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
            style="
                padding:25px;
            "
        >


            <button
                type="button"

                onclick="
                    openLessonQuestions(
                        '${escapeQuestionHTML(lessonId)}',
                        '${escapeQuestionHTML(lessonName)}'
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
                    margin-bottom:20px;
                "
            >

                ← بازگشت

            </button>


            <div
                style="
                    text-align:center;
                    margin-bottom:28px;
                "
            >

                <div
                    style="
                        width:72px;
                        height:72px;
                        margin:0 auto 15px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:
                            rgba(236,72,153,.10);
                        font-size:34px;
                    "
                >
                    📚
                </div>


                <h2
                    style="
                        margin:0;
                        font-size:24px;
                        font-weight:900;
                        color:var(--text-color);
                    "
                >

                    ${escapeQuestionHTML(
                        categoryTitle
                    )}

                </h2>


                <p
                    style="
                        margin-top:8px;
                        color:var(--text-muted);
                        font-size:14px;
                    "
                >

                    ${escapeQuestionHTML(
                        lessonName
                    )}

                </p>


                <p
                    style="
                        margin-top:6px;
                        color:var(--text-muted);
                        font-size:12px;
                    "
                >

                    درس مورد نظر خود را انتخاب کنید

                </p>

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(220px,1fr)
                        );
                    gap:18px;
                "
            >

                ${cardsHTML}

            </div>


        </section>

    `;


    /* =====================================================
       رفتن به ابتدای صفحه
    ===================================================== */

    window.scrollTo({

        top:0,

        behavior:'smooth'

    });

}


/* =========================================================
   باز کردن یک درس داخلی از بخش سوالات
   ========================================================= */




/* =========================================================
   صفحه سه دسته سوالات
========================================================= */

/* =========================================================
   صفحه سه دسته سوالات
   نسخه نهایی
   ========================================================= */

function openQuestionCategories(
    lessonId,
    lessonName
) {

    /* =====================================================
       اگر فقط اسم درس ارسال شده باشد
       مثل:
       openQuestionCategories('علوم')
       ===================================================== */

    if (
        lessonName === undefined ||
        lessonName === null ||
        lessonName === ''
    ) {

        lessonName = lessonId;

        const name =
            String(lessonName || '').trim();

        if (name.includes('علوم')) {
            lessonId = 'm1-p7-lesson5';
        }

        else if (name.includes('ریاضی')) {
            lessonId = 'm1-p7-lesson4';
        }

        else if (name.includes('فارسی')) {
            lessonId = 'm1-p7-lesson3';
        }

        else if (
            name.includes('پیام‌های آسمانی') ||
            name.includes('پیام های آسمانی')
        ) {
            lessonId = 'm1-p7-lesson2';
        }

        else if (name.includes('مطالعات اجتماعی')) {
            lessonId = 'm1-p7-lesson6';
        }

        else if (name.includes('عربی')) {
            lessonId = 'm1-p7-lesson7';
        }

        else if (name.includes('قرآن')) {
            lessonId = 'm1-p7-lesson1';
        }

        else {
            lessonId = '';
        }

    }


    const container =
        document.getElementById(
            'mainAppContent'
        );

    if (!container) {
        return;
    }


    /* =====================================================
       ذخیره مسیر
    ===================================================== */

    state.currentView =
        'question-categories';

    window.currentLessonId =
        lessonId;

    window.currentLessonName =
        lessonName;


    /* =====================================================
       نمایش صفحه
    ===================================================== */

    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
        >

            <h2
                class="card-title"
                style="
                    justify-content:center;
                    text-align:center;
                "
            >

                سوالات درس
                ${escapeQuestionHTML(
                    lessonName
                )}

            </h2>


            <p
                style="
                    text-align:center;
                    color:var(--text-muted);
                    font-size:14px;
                    margin-bottom:25px;
                "
            >
                یکی از بخش‌های زیر را انتخاب کنید
            </p>


            <div
                class="drilldown-grid"
                style="
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(230px,1fr)
                        );
                    gap:20px;
                "
            >


                <!-- =================================
                     سوالات متن کتاب
                ================================== -->

                <div
                    class="drilldown-card"

                    onclick="
                        openQuestionCategory(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            'textbook'
                        )
                    "
                >

                    <svg
                        class="topic-icon-svg"
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


                    <h3
                        style="
                            font-size:18px;
                            font-weight:800;
                        "
                    >
                        سوالات متن کتاب
                    </h3>


                    <p
                        style="
                            font-size:13px;
                            color:var(--text-muted);
                            margin-top:8px;
                        "
                    >
                        سوالات و پاسخ‌های متن کتاب
                    </p>

                </div>


                <!-- =================================
                     نوبت اول
                ================================== -->

                <div
                    class="drilldown-card"

                    onclick="
                        openQuestionCategory(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            'first-term'
                        )
                    "
                >

                    <svg
                        class="topic-icon-svg"
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


                    <h3
                        style="
                            font-size:18px;
                            font-weight:800;
                        "
                    >
                        نوبت اول
                    </h3>


                    <p
                        style="
                            font-size:13px;
                            color:var(--text-muted);
                            margin-top:8px;
                        "
                    >
                        نمونه سوالات امتحان نوبت اول
                    </p>

                </div>


                <!-- =================================
                     نوبت دوم
                ================================== -->

                <div
                    class="drilldown-card"

                    onclick="
                        openQuestionCategory(
                            '${escapeQuestionHTML(lessonId)}',
                            '${escapeQuestionHTML(lessonName)}',
                            'second-term'
                        )
                    "
                >

                    <svg
                        class="topic-icon-svg"
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


                    <h3
                        style="
                            font-size:18px;
                            font-weight:800;
                        "
                    >
                        نوبت دوم
                    </h3>


                    <p
                        style="
                            font-size:13px;
                            color:var(--text-muted);
                            margin-top:8px;
                        "
                    >
                        نمونه سوالات امتحان نوبت دوم
                    </p>

                </div>


            </div>


            ${
                state.isAdmin
                ?
                `

                <div
                    style="
                        text-align:center;
                        margin-top:25px;
                    "
                >

                    <button
                        class="btn-primary"

                        style="
                            background:#7c3aed;
                        "

                        onclick="
                            openQuestionAdminPanel()
                        "
                     type="button">

                        📝 مدیریت سوالات این درس

                    </button>

                </div>

                `
                :
                ''
            }


        </section>

    `;


    updateBreadcrumbs();


    window.scrollTo({
        top:0,
        behavior:'smooth'
    });

}


/* =========================================================
   باز کردن دوباره دسته سوالات بعد از F5
========================================================= */

function restoreQuestionStateAfterReload() {

    if (
        window.currentLessonId &&
        window.currentLessonName &&
        window.currentQuestionCategory
    ) {

        openQuestionCategory(
            window.currentLessonId,
            window.currentLessonName,
            window.currentQuestionCategory
        );
    }
}


/* =========================================================
   بستن مودال با کلیک بیرون
========================================================= */

document.addEventListener(
    'click',
    function(event) {

        const adminModal =
            document.getElementById(
                'questionAdminModal'
            );

        const editorModal =
            document.getElementById(
                'questionEditorModal'
            );


        if (
            adminModal &&
            event.target === adminModal
        ) {

            closeQuestionAdminPanel();

        }


        if (
            editorModal &&
            event.target === editorModal
        ) {

            closeQuestionEditor();

        }

    }
);
/* =========================================================
   سیستم نهایی مدیریت سوالات متوسطه اول
   نسخه مستقل و ذخیره دائمی
   ========================================================= */


/* =========================================================
   تنظیمات ذخیره‌سازی
   ========================================================= */

const FINAL_M1_QUESTIONS_KEY =
    'atrak_middle1_questions';


/* =========================================================
   دریافت کل سوالات ذخیره‌شده
   ========================================================= */

function finalGetM1Questions() {

    try {

        const saved =
            localStorage.getItem(
                FINAL_M1_QUESTIONS_KEY
            );

        if (!saved) {
            return {};
        }

        const parsed =
            JSON.parse(saved);

        if (
            !parsed ||
            typeof parsed !== 'object'
        ) {
            return {};
        }

        return parsed;

    } catch (error) {

        console.error(
            'خطا در خواندن سوالات:',
            error
        );

        return {};
    }
}


/* =========================================================
   ذخیره کل سوالات
   ========================================================= */

function finalSaveM1Questions(data) {

    try {

        localStorage.setItem(
            FINAL_M1_QUESTIONS_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {

        console.error(
            'خطا در ذخیره سوالات:',
            error
        );

        alert(
            'ذخیره سوالات انجام نشد.'
        );

        return false;
    }
}


/* =========================================================
   کلید اختصاصی هر درس و هر دسته
   ========================================================= */

function finalM1QuestionKey(
    lessonKey,
    category
) {

    return (
        String(lessonKey) +
        '__' +
        String(category)
    );
}


/* =========================================================
   دریافت سوالات یک درس
   ========================================================= */

function finalGetLessonQuestions(
    lessonKey,
    category
) {

    const saved =
        finalGetM1Questions();

    const key =
        finalM1QuestionKey(
            lessonKey,
            category
        );

    if (
        Object.prototype.hasOwnProperty.call(
            saved,
            key
        )
    ) {

        return Array.isArray(saved[key])
            ? saved[key]
            : [];
    }


    /*
       اگر قبلاً اطلاعات اولیه
       در lessonQuestionsData وجود داشته
       از آن استفاده می‌کنیم.
    */

    try {

        if (
            typeof lessonQuestionsData !==
            'undefined' &&

            lessonQuestionsData[lessonKey] &&

            Array.isArray(
                lessonQuestionsData[lessonKey][category]
            )
        ) {

            return lessonQuestionsData[
                lessonKey
            ][category];

        }

    } catch (error) {

        console.log(
            'اطلاعات اولیه سوالات موجود نیست.'
        );
    }


    return [];
}


/* =========================================================
   ذخیره سوالات یک درس و یک دسته
   ========================================================= */

function finalSaveLessonQuestions(
    lessonKey,
    category,
    questions
) {

    const saved =
        finalGetM1Questions();

    const key =
        finalM1QuestionKey(
            lessonKey,
            category
        );

    saved[key] =
        Array.isArray(questions)
            ? questions
            : [];

    return finalSaveM1Questions(
        saved
    );
}


/* =========================================================
   عنوان دسته
   ========================================================= */

function finalQuestionCategoryTitle(
    category
) {

    if (category === 'textbook') {

        return 'سوالات متن کتاب';

    }

    if (category === 'firstTerm') {

        return 'سوالات نوبت اول';

    }

    if (category === 'secondTerm') {

        return 'سوالات نوبت دوم';

    }

    return 'سوالات';
}


/* =========================================================
   امن کردن متن
   ========================================================= */

function finalEscapeHTML(text) {

    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/* =========================================================
   صفحه انتخاب سه دسته سوالات
   ========================================================= */

window.openLessonQuestions =
function(
    lessonKey,
    lessonName
) {

    const container =
        document.getElementById(
            'mainAppContent'
        );

    if (!container) {
        return;
    }


    const previousView =
        state.currentView;


    /*
       اطمینان از وجود اطلاعات درس
    */

    try {

        if (
            typeof lessonQuestionsData !==
            'undefined'
        ) {

            if (
                !lessonQuestionsData[lessonKey]
            ) {

                lessonQuestionsData[
                    lessonKey
                ] = {

                    textbook: [],

                    firstTerm: [],

                    secondTerm: []

                };

            }

        }

    } catch (error) {}


    container.innerHTML = `

        <section
            class="glass-card fade-in-up question-category-page"
            style="
                padding:25px;
            "
        >


            <!-- =====================================
                 بازگشت
            ====================================== -->

            <button
                type="button"

                onclick="
                    navigateTo('${finalEscapeHTML(previousView)}')
                "

                style="
                    border:none;
                    padding:10px 18px;
                    border-radius:10px;
                    cursor:pointer;

                    background:var(--primary);
                    color:white;

                    font-family:inherit;
                    font-weight:800;

                    margin-bottom:25px;
                "
            >

                ← بازگشت به ${finalEscapeHTML(lessonName)}

            </button>



            <!-- =====================================
                 عنوان
            ====================================== -->

            <div
                style="
                    text-align:center;
                    margin-bottom:30px;
                "
            >

                <h2
                    style="
                        margin:0;
                        font-size:25px;
                        font-weight:900;
                    "
                >

                    سوالات ${finalEscapeHTML(lessonName)}

                </h2>


                <p
                    style="
                        margin-top:9px;
                        color:var(--text-muted);
                    "
                >

                    نوع سوالات مورد نظر را انتخاب کنید

                </p>

            </div>



            <!-- =====================================
                 سه کارت
            ====================================== -->

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(220px,1fr)
                        );

                    gap:20px;
                "
            >


                <!-- =================================
                     متن کتاب
                ================================== -->

                <div
                    style="
                        border:1px solid var(--card-border);
                        border-radius:18px;
                        padding:25px;
                        text-align:center;
                        background:var(--card-bg);
                    "
                >

                    <div
                        onclick="
                            showQuestionList(
                                '${lessonKey}',
                                '${finalEscapeHTML(lessonName)}',
                                'textbook'
                            )
                        "

                        style="
                            cursor:pointer;
                        "
                    >

                        <div
                            style="
                                width:70px;
                                height:70px;

                                margin:0 auto 15px;

                                display:flex;
                                align-items:center;
                                justify-content:center;

                                border-radius:18px;

                                background:
                                    rgba(236,72,153,.10);

                                color:var(--accent-pink);
                            "
                        >

                            <svg
                                viewBox="0 0 24 24"
                                width="40"
                                height="40"

                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >

                                <path
                                    d="
                                    M4 19.5
                                    A2.5 2.5 0 0 1
                                    6.5 17H20
                                    "
                                ></path>

                                <path
                                    d="
                                    M6.5 2H20v20H6.5
                                    A2.5 2.5 0 0 1
                                    4 19.5v-15
                                    A2.5 2.5 0 0 1
                                    6.5 2z
                                    "
                                ></path>

                            </svg>

                        </div>


                        <h3
                            style="
                                margin:0;
                                font-size:18px;
                                font-weight:900;
                            "
                        >

                            سوالات متن کتاب

                        </h3>


                        <p
                            style="
                                margin-top:8px;
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >

                            سوالات مربوط به متن کتاب

                        </p>

                    </div>


                    ${
                        state.isAdmin
                        ? `

                            <button
                                type="button"

                                onclick="
                                    showMiddle1QuestionManager(
                                        '${lessonKey}',
                                        '${finalEscapeHTML(lessonName)}',
                                        'textbook'
                                    )
                                "

                                style="
                                    width:100%;
                                    margin-top:15px;

                                    border:none;
                                    padding:11px;

                                    border-radius:10px;

                                    cursor:pointer;

                                    background:#7c3aed;
                                    color:white;

                                    font-family:inherit;
                                    font-weight:800;
                                "
                            >

                                ✏️ مدیریت

                            </button>

                        `
                        : ''
                    }

                </div>



                <!-- =================================
                     نوبت اول
                ================================== -->

                <div
                    style="
                        border:1px solid var(--card-border);
                        border-radius:18px;
                        padding:25px;
                        text-align:center;
                        background:var(--card-bg);
                    "
                >

                    <div
                        onclick="
                            showQuestionList(
                                '${lessonKey}',
                                '${finalEscapeHTML(lessonName)}',
                                'firstTerm'
                            )
                        "

                        style="
                            cursor:pointer;
                        "
                    >

                        <div
                            style="
                                width:70px;
                                height:70px;

                                margin:0 auto 15px;

                                display:flex;
                                align-items:center;
                                justify-content:center;

                                border-radius:18px;

                                background:
                                    rgba(236,72,153,.10);

                                color:var(--accent-pink);
                            "
                        >

                            <svg
                                viewBox="0 0 24 24"
                                width="40"
                                height="40"

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


                        <h3
                            style="
                                margin:0;
                                font-size:18px;
                                font-weight:900;
                            "
                        >

                            نوبت اول

                        </h3>


                        <p
                            style="
                                margin-top:8px;
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >

                            نمونه سوالات امتحان نوبت اول

                        </p>

                    </div>


                    ${
                        state.isAdmin
                        ? `

                            <button
                                type="button"

                                onclick="
                                    showMiddle1QuestionManager(
                                        '${lessonKey}',
                                        '${finalEscapeHTML(lessonName)}',
                                        'firstTerm'
                                    )
                                "

                                style="
                                    width:100%;
                                    margin-top:15px;

                                    border:none;
                                    padding:11px;

                                    border-radius:10px;

                                    cursor:pointer;

                                    background:#7c3aed;
                                    color:white;

                                    font-family:inherit;
                                    font-weight:800;
                                "
                            >

                                ✏️ مدیریت

                            </button>

                        `
                        : ''
                    }

                </div>



                <!-- =================================
                     نوبت دوم
                ================================== -->

                <div
                    style="
                        border:1px solid var(--card-border);
                        border-radius:18px;
                        padding:25px;
                        text-align:center;
                        background:var(--card-bg);
                    "
                >

                    <div
                        onclick="
                            showQuestionList(
                                '${lessonKey}',
                                '${finalEscapeHTML(lessonName)}',
                                'secondTerm'
                            )
                        "

                        style="
                            cursor:pointer;
                        "
                    >

                        <div
                            style="
                                width:70px;
                                height:70px;

                                margin:0 auto 15px;

                                display:flex;
                                align-items:center;
                                justify-content:center;

                                border-radius:18px;

                                background:
                                    rgba(236,72,153,.10);

                                color:var(--accent-pink);
                            "
                        >

                            <svg
                                viewBox="0 0 24 24"
                                width="40"
                                height="40"

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
                                    d="
                                    M17 5H9.5
                                    a3.5 3.5 0 0 0 0 7h5
                                    a3.5 3.5 0 0 1 0 7H6
                                    "
                                ></path>

                            </svg>

                        </div>


                        <h3
                            style="
                                margin:0;
                                font-size:18px;
                                font-weight:900;
                            "
                        >

                            نوبت دوم

                        </h3>


                        <p
                            style="
                                margin-top:8px;
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >

                            نمونه سوالات امتحان نوبت دوم

                        </p>

                    </div>


                    ${
                        state.isAdmin
                        ? `

                            <button
                                type="button"

                                onclick="
                                    showMiddle1QuestionManager(
                                        '${lessonKey}',
                                        '${finalEscapeHTML(lessonName)}',
                                        'secondTerm'
                                    )
                                "

                                style="
                                    width:100%;
                                    margin-top:15px;

                                    border:none;
                                    padding:11px;

                                    border-radius:10px;

                                    cursor:pointer;

                                    background:#7c3aed;
                                    color:white;

                                    font-family:inherit;
                                    font-weight:800;
                                "
                            >

                                ✏️ مدیریت

                            </button>

                        `
                        : ''
                    }

                </div>


            </div>

        </section>

    `;

};


/* =========================================================
   نمایش سوالات یک دسته
   ========================================================= */

window.showQuestionList =
function(
    lessonKey,
    lessonName,
    category
) {

    const container =
        document.getElementById(
            'mainAppContent'
        );

    if (!container) {
        return;
    }


    const title =
        finalQuestionCategoryTitle(
            category
        );


    const questions =
        finalGetLessonQuestions(
            lessonKey,
            category
        );


    let content = '';


    if (
        !questions ||
        questions.length === 0
    ) {

        content = `

            <div
                style="
                    text-align:center;
                    padding:45px 20px;
                "
            >

                <div
                    style="
                        font-size:45px;
                        margin-bottom:15px;
                    "
                >
                    📝
                </div>


                <h3>
                    هنوز سوالی ثبت نشده است
                </h3>


                <p
                    style="
                        color:var(--text-muted);
                        margin-top:8px;
                    "
                >

                    برای این بخش هنوز سوالی اضافه نشده است.

                </p>

            </div>

        `;

    }

    else {

        content =
            questions
                .map(
                    (question, index) => {

                        const text =
                            typeof question ===
                            'string'
                                ? question
                                : (
                                    question.text ||
                                    ''
                                );

                        return `

                            <div
                                style="
                                    padding:18px;

                                    margin-bottom:14px;

                                    border:
                                        1px solid
                                        var(--card-border);

                                    border-radius:14px;

                                    background:
                                        var(--card-bg);
                                "
                            >

                                <div
                                    style="
                                        font-weight:900;
                                        margin-bottom:8px;
                                    "
                                >

                                    سوال ${index + 1}

                                </div>


                                <div
                                    style="
                                        line-height:2;
                                        white-space:pre-wrap;
                                    "
                                >

                                    ${finalEscapeHTML(text)}

                                </div>

                            </div>

                        `;
                    }
                )
                .join('');

    }


    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
            style="
                padding:25px;
            "
        >

            <button
                type="button"

                onclick="
                    openLessonQuestions(
                        '${lessonKey}',
                        '${finalEscapeHTML(lessonName)}'
                    )
                "

                style="
                    border:none;
                    padding:10px 18px;
                    border-radius:10px;
                    cursor:pointer;

                    background:var(--primary);
                    color:white;

                    font-family:inherit;
                    font-weight:800;

                    margin-bottom:25px;
                "
            >

                ← بازگشت

            </button>


            <div
                style="
                    text-align:center;
                    margin-bottom:25px;
                "
            >

                <h2
                    style="
                        margin:0;
                        font-size:24px;
                        font-weight:900;
                    "
                >

                    ${title}

                </h2>


                <p
                    style="
                        margin-top:8px;
                        color:var(--text-muted);
                    "
                >

                    ${finalEscapeHTML(lessonName)}

                </p>

            </div>


            ${content}


            ${
                state.isAdmin
                ? `

                    <button
                        type="button"

                        onclick="
                            showMiddle1QuestionManager(
                                '${lessonKey}',
                                '${finalEscapeHTML(lessonName)}',
                                '${category}'
                            )
                        "

                        style="
                            width:100%;
                            margin-top:20px;

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

                        ✏️ ویرایش سوالات این بخش

                    </button>

                `
                : ''
            }

        </section>

    `;

};


/* =========================================================
   پنل مدیریت سوالات
   ========================================================= */

window.showMiddle1QuestionManager =
function(
    lessonKey,
    lessonName,
    category
) {

    if (!state.isAdmin) {

        alert(
            'ابتدا وارد حالت مدیریت شوید.'
        );

        return;
    }


    const container =
        document.getElementById(
            'mainAppContent'
        );

    if (!container) {
        return;
    }


    const title =
        finalQuestionCategoryTitle(
            category
        );


    const questions =
        finalGetLessonQuestions(
            lessonKey,
            category
        );


    let rowsHTML = '';


    if (
        questions &&
        questions.length > 0
    ) {

        rowsHTML =
            questions
                .map(
                    (question, index) => {

                        const text =
                            typeof question ===
                            'string'
                                ? question
                                : (
                                    question.text ||
                                    ''
                                );

                        return finalCreateQuestionRow(
                            text,
                            index
                        );

                    }
                )
                .join('');

    }


    if (!rowsHTML) {

        rowsHTML = `

            <div
                id="finalEmptyQuestions"
                style="
                    text-align:center;
                    padding:35px 20px;

                    border:
                        2px dashed
                        var(--card-border);

                    border-radius:15px;

                    margin-bottom:15px;
                "
            >

                <div
                    style="
                        font-size:40px;
                        margin-bottom:10px;
                    "
                >
                    📝
                </div>


                <strong>
                    هنوز سوالی ثبت نشده است
                </strong>


                <p
                    style="
                        color:var(--text-muted);
                        margin-top:8px;
                    "
                >

                    از دکمه «افزودن سوال جدید»
                    استفاده کنید.

                </p>

            </div>

        `;

    }


    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
            style="
                padding:25px;
            "
        >

            <!-- ===============================
                 عنوان
            ================================= -->

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;

                    gap:15px;

                    flex-wrap:wrap;

                    margin-bottom:25px;
                "
            >

                <div>

                    <h2
                        style="
                            margin:0;
                            font-size:24px;
                            font-weight:900;
                        "
                    >

                        مدیریت ${title}

                    </h2>


                    <p
                        style="
                            margin-top:8px;
                            color:var(--text-muted);
                        "
                    >

                        ${finalEscapeHTML(lessonName)}

                    </p>

                </div>


                <button
                    type="button"

                    onclick="
                        openLessonQuestions(
                            '${lessonKey}',
                            '${finalEscapeHTML(lessonName)}'
                        )
                    "

                    style="
                        border:none;
                        padding:10px 18px;
                        border-radius:10px;

                        cursor:pointer;

                        background:var(--primary);
                        color:white;

                        font-family:inherit;
                        font-weight:800;
                    "
                >

                    ← بازگشت

                </button>

            </div>



            <!-- ===============================
                 لیست سوالات
            ================================= -->

            <div
                id="finalM1QuestionEditor"
            >

                ${rowsHTML}

            </div>



            <!-- ===============================
                 افزودن
            ================================= -->

            <button
                type="button"

                onclick="
                    finalAddQuestionRow()
                "

                style="
                    width:100%;

                    margin-top:10px;

                    border:none;

                    padding:14px;

                    border-radius:12px;

                    cursor:pointer;

                    background:#16a34a;
                    color:white;

                    font-family:inherit;

                    font-size:15px;
                    font-weight:900;
                "
            >

                ＋ افزودن سوال جدید

            </button>



            <!-- ===============================
                 ذخیره
            ================================= -->

            <button
                type="button"

                onclick="
                    finalSaveCurrentQuestionCategory(
                        '${lessonKey}',
                        '${finalEscapeHTML(lessonName)}',
                        '${category}'
                    )
                "

                style="
                    width:100%;

                    margin-top:12px;

                    border:none;

                    padding:15px;

                    border-radius:12px;

                    cursor:pointer;

                    background:#065f46;
                    color:white;

                    font-family:inherit;

                    font-size:16px;
                    font-weight:900;
                "
            >

                💾 ذخیره سوالات

            </button>

        </section>

    `;

};


/* =========================================================
   ساخت ردیف سوال
   ========================================================= */

function finalCreateQuestionRow(
    text,
    index
) {

    return `

        <div
            class="final-m1-question-row"

            style="
                padding:18px;

                margin-bottom:14px;

                border:
                    1px solid
                    var(--card-border);

                border-radius:14px;

                background:
                    var(--card-bg);
            "
        >

            <div
                style="
                    display:flex;

                    justify-content:space-between;

                    align-items:center;

                    gap:10px;

                    margin-bottom:10px;
                "
            >

                <strong>
                    سوال ${index + 1}
                </strong>


                <button
                    type="button"

                    onclick="
                        finalDeleteQuestionRow(this)
                    "

                    style="
                        border:none;

                        padding:7px 12px;

                        border-radius:8px;

                        cursor:pointer;

                        background:#dc2626;
                        color:white;

                        font-family:inherit;
                        font-weight:800;
                    "
                >

                    🗑 حذف

                </button>

            </div>


            <textarea
                class="final-m1-question-input" aria-label="متن سوال"

                placeholder="متن سوال را بنویسید..."

                style="
                    width:100%;

                    min-height:95px;

                    resize:vertical;

                    box-sizing:border-box;

                    padding:12px;

                    border-radius:10px;

                    border:
                        1px solid
                        var(--card-border);

                    background:
                        var(--input-bg,
                        var(--card-bg));

                    color:
                        var(--text-color);

                    font-family:inherit;

                    font-size:15px;

                    line-height:1.9;
                "
            >${finalEscapeHTML(text)}</textarea>

        </div>

    `;
}


/* =========================================================
   افزودن سوال
   ========================================================= */

window.finalAddQuestionRow =
function() {

    const editor =
        document.getElementById(
            'finalM1QuestionEditor'
        );

    if (!editor) {
        return;
    }


    const empty =
        document.getElementById(
            'finalEmptyQuestions'
        );

    if (empty) {
        empty.remove();
    }


    const rows =
        editor.querySelectorAll(
            '.final-m1-question-row'
        );


    const index =
        rows.length;


    editor.insertAdjacentHTML(
        'beforeend',

        finalCreateQuestionRow(
            '',
            index
        )
    );

};


/* =========================================================
   حذف سوال
   ========================================================= */

window.finalDeleteQuestionRow =
function(button) {

    const row =
        button.closest(
            '.final-m1-question-row'
        );

    if (!row) {
        return;
    }


    const confirmed =
        confirm(
            'آیا مطمئن هستید که می‌خواهید این سوال حذف شود؟'
        );


    if (!confirmed) {
        return;
    }


    row.remove();


    finalUpdateQuestionNumbers();

};


/* =========================================================
   شماره‌گذاری مجدد
   ========================================================= */

function finalUpdateQuestionNumbers() {

    const rows =
        document.querySelectorAll(
            '.final-m1-question-row'
        );


    rows.forEach(
        (row, index) => {

            const title =
                row.querySelector(
                    'strong'
                );

            if (title) {

                title.textContent =
                    'سوال ' +
                    (index + 1);

            }

        }
    );

}


/* =========================================================
   ذخیره نهایی دسته فعلی
   ========================================================= */

window.finalSaveCurrentQuestionCategory =
function(
    lessonKey,
    lessonName,
    category
) {

    const rows =
        document.querySelectorAll(
            '.final-m1-question-row'
        );


    const questions = [];


    rows.forEach(
        row => {

            const input =
                row.querySelector(
                    '.final-m1-question-input'
                );

            if (!input) {
                return;
            }


            const text =
                input.value.trim();


            if (text !== '') {

                questions.push({

                    text: text

                });

            }

        }
    );


    /*
       ذخیره در localStorage
    */

    const saved =
        finalSaveLessonQuestions(
            lessonKey,
            category,
            questions
        );


    if (!saved) {
        return;
    }


    /*
       همزمان حافظه فعلی سایت هم به‌روزرسانی شود
    */

    try {

        if (
            typeof lessonQuestionsData !==
            'undefined'
        ) {

            if (
                !lessonQuestionsData[lessonKey]
            ) {

                lessonQuestionsData[
                    lessonKey
                ] = {

                    textbook: [],
                    firstTerm: [],
                    secondTerm: []

                };

            }


            lessonQuestionsData[
                lessonKey
            ][category] =
                questions;

        }

    } catch (error) {}


    alert(
        'سوالات با موفقیت ذخیره شدند و بعد از F5 نیز باقی می‌مانند.'
    );


    /*
       بعد از ذخیره، همان بخش سوالات نمایش داده شود
    */

    window.showQuestionList(
        lessonKey,
        lessonName,
        category
    );

};


/* =========================================================
   بازیابی سوالات بعد از F5
   ========================================================= */

function finalRestoreM1Questions() {

    const saved =
        finalGetM1Questions();


    if (
        !saved ||
        typeof saved !== 'object'
    ) {

        return;
    }


    try {

        if (
            typeof lessonQuestionsData ===
            'undefined'
        ) {

            return;

        }


        Object.keys(saved)
            .forEach(
                storageKey => {

                    const parts =
                        storageKey.split(
                            '__'
                        );


                    if (
                        parts.length < 2
                    ) {

                        return;

                    }


                    const category =
                        parts.pop();


                    const lessonKey =
                        parts.join('__');


                    if (
                        !lessonQuestionsData[
                            lessonKey
                        ]
                    ) {

                        lessonQuestionsData[
                            lessonKey
                        ] = {

                            textbook: [],
                            firstTerm: [],
                            secondTerm: []

                        };

                    }


                    lessonQuestionsData[
                        lessonKey
                    ][category] =

                        Array.isArray(
                            saved[storageKey]
                        )

                        ? saved[storageKey]

                        : [];

                }
            );

    } catch (error) {

        console.error(
            'خطا در بازیابی سوالات:',
            error
        );

    }

}


/* =========================================================
   بازیابی هنگام باز شدن سایت
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function() {

        finalRestoreM1Questions();

    }
);


/* =========================================================
   بازیابی هنگام load
   ========================================================= */

window.addEventListener(
    'load',
    function() {

        finalRestoreM1Questions();

    }
);


/* =========================================================
   پایان سیستم نهایی
   ========================================================= */

   /* =========================================================
   سیستم نهایی و مستقل سوالات متوسطه اول
   نسخه اصلاح شده
   ========================================================= */

(function () {

    'use strict';

    /* ---------------------------------------------------------
       تنظیمات
       --------------------------------------------------------- */

    const STORAGE_KEY = 'MIDDLE1_QUESTIONS_FINAL_V3';

    const CATEGORIES = {
        textbook: 'سوالات متن کتاب',
        firstTerm: 'نوبت اول',
        secondTerm: 'نوبت دوم'
    };

    const normalizeCategory = function (category) {

        if (!category) {
            return 'textbook';
        }

        const value = String(category).trim();

        if (
            value === 'first-term' ||
            value === 'first_term' ||
            value === 'firstTerm'
        ) {
            return 'firstTerm';
        }

        if (
            value === 'second-term' ||
            value === 'second_term' ||
            value === 'secondTerm'
        ) {
            return 'secondTerm';
        }

        return 'textbook';
    };


    /* ---------------------------------------------------------
       ساختار ذخیره سازی
       --------------------------------------------------------- */

    function getAllQuestions() {

        try {

            const raw =
                localStorage.getItem(STORAGE_KEY);

            if (!raw) {
                return {};
            }

            const data =
                JSON.parse(raw);

            if (
                !data ||
                typeof data !== 'object' ||
                Array.isArray(data)
            ) {
                return {};
            }

            return data;

        } catch (error) {

            console.error(
                'خطا در خواندن سوالات:',
                error
            );

            return {};
        }
    }


    function saveAllQuestions(data) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {

            console.error(
                'خطا در ذخیره سوالات:',
                error
            );

            alert(
                'ذخیره سوالات انجام نشد.'
            );

            return false;
        }
    }


    function createLessonStructure(data, lessonKey) {

        if (
            !data[lessonKey] ||
            typeof data[lessonKey] !== 'object' ||
            Array.isArray(data[lessonKey])
        ) {

            data[lessonKey] = {
                textbook: [],
                firstTerm: [],
                secondTerm: []
            };
        }

        if (!Array.isArray(data[lessonKey].textbook)) {
            data[lessonKey].textbook = [];
        }

        if (!Array.isArray(data[lessonKey].firstTerm)) {
            data[lessonKey].firstTerm = [];
        }

        if (!Array.isArray(data[lessonKey].secondTerm)) {
            data[lessonKey].secondTerm = [];
        }

        return data[lessonKey];
    }


    /* ---------------------------------------------------------
       تبدیل متن به HTML امن
       --------------------------------------------------------- */

    function escapeHTML(value) {

        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    /* ---------------------------------------------------------
       دریافت سوالات
       --------------------------------------------------------- */

    window.finalGetLessonQuestions = function (
        lessonKey,
        category
    ) {

        const safeCategory =
            normalizeCategory(category);

        const data =
            getAllQuestions();

        const lesson =
            createLessonStructure(
                data,
                lessonKey
            );

        return Array.isArray(
            lesson[safeCategory]
        )
            ? lesson[safeCategory]
            : [];
    };


    /* ---------------------------------------------------------
       ذخیره سوالات
       --------------------------------------------------------- */

    window.finalSaveLessonQuestions = function (
        lessonKey,
        category,
        questions
    ) {

        const safeCategory =
            normalizeCategory(category);

        const data =
            getAllQuestions();

        const lesson =
            createLessonStructure(
                data,
                lessonKey
            );

        lesson[safeCategory] =
            Array.isArray(questions)
                ? questions.map(function (item) {

                    if (
                        typeof item === 'string'
                    ) {
                        return {
                            text: item
                        };
                    }

                    return {
                        text:
                            String(
                                item &&
                                item.text
                                    ? item.text
                                    : ''
                            )
                    };

                }).filter(function (item) {

                    return (
                        item.text.trim() !== ''
                    );

                })
                : [];

        return saveAllQuestions(data);
    };


    /* ---------------------------------------------------------
       ساخت یک ردیف سوال
       --------------------------------------------------------- */

    function createQuestionRow(
        text,
        index
    ) {

        return `
            <div
                class="m1-final-question-row"
                style="
                    width:100%;
                    box-sizing:border-box;
                    margin-bottom:15px;
                    padding:16px;
                    border:1px solid var(--card-border);
                    border-radius:14px;
                    background:var(--card-bg);
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        gap:10px;
                        margin-bottom:10px;
                    "
                >

                    <strong
                        class="m1-question-number"
                        style="
                            font-size:16px;
                        "
                    >
                        سوال ${index + 1}
                    </strong>

                    <button
                        type="button"
                        class="m1-delete-question"
                        style="
                            border:none;
                            padding:7px 12px;
                            border-radius:8px;
                            cursor:pointer;
                            background:#dc2626;
                            color:white;
                            font-family:inherit;
                            font-weight:800;
                        "
                    >
                        🗑 حذف
                    </button>

                </div>


                <textarea
                    class="m1-question-input" aria-label="متن سوال"
                    placeholder="متن سوال را بنویسید..."
                    style="
                        display:block;
                        width:100%;
                        min-height:100px;
                        box-sizing:border-box;
                        resize:vertical;
                        padding:12px;
                        border-radius:10px;
                        border:1px solid var(--card-border);
                        background:var(--input-bg, var(--card-bg));
                        color:var(--text-color);
                        font-family:inherit;
                        font-size:15px;
                        line-height:2;
                        outline:none;
                    "
                >${escapeHTML(text)}</textarea>

            </div>
        `;
    }


    /* ---------------------------------------------------------
       شماره گذاری سوالات
       --------------------------------------------------------- */

    function updateQuestionNumbers() {

        const rows =
            document.querySelectorAll(
                '.m1-final-question-row'
            );

        rows.forEach(function (
            row,
            index
        ) {

            const number =
                row.querySelector(
                    '.m1-question-number'
                );

            if (number) {

                number.textContent =
                    'سوال ' +
                    (index + 1);
            }
        });
    }


    /* ---------------------------------------------------------
       پنل مدیریت سوالات
       --------------------------------------------------------- */

    window.showMiddle1QuestionManager =
    function (
        lessonKey,
        lessonName,
        category
    ) {

        const safeCategory =
            normalizeCategory(category);

        const container =
            document.getElementById(
                'mainAppContent'
            );

        if (!container) {

            console.error(
                'mainAppContent پیدا نشد.'
            );

            return;
        }


        /* بررسی مدیریت */

        if (
            typeof state !== 'undefined' &&
            state &&
            state.isAdmin === false
        ) {

            alert(
                'ابتدا وارد حالت مدیریت شوید.'
            );

            return;
        }


        const questions =
            window.finalGetLessonQuestions(
                lessonKey,
                safeCategory
            );


        let rowsHTML = '';


        if (
            questions &&
            questions.length
        ) {

            rowsHTML =
                questions.map(
                    function (
                        question,
                        index
                    ) {

                        const text =
                            typeof question === 'string'
                                ? question
                                : (
                                    question &&
                                    question.text
                                        ? question.text
                                        : ''
                                );

                        return createQuestionRow(
                            text,
                            index
                        );
                    }
                ).join('');

        }


        if (!rowsHTML) {

            rowsHTML = `

                <div
                    id="m1-final-empty"
                    style="
                        text-align:center;
                        padding:35px 20px;
                        margin-bottom:15px;
                        border:2px dashed var(--card-border);
                        border-radius:15px;
                    "
                >

                    <div
                        style="
                            font-size:42px;
                            margin-bottom:10px;
                        "
                    >
                        📝
                    </div>

                    <strong>
                        هنوز سوالی ثبت نشده است
                    </strong>

                    <p
                        style="
                            color:var(--text-muted);
                            margin-top:8px;
                        "
                    >
                        برای اضافه کردن سوال،
                        روی «افزودن سوال جدید» بزنید.
                    </p>

                </div>
            `;
        }


        const lessonNameSafe =
            escapeHTML(lessonName);


        container.innerHTML = `

            <section
                class="glass-card fade-in-up"
                style="
                    padding:25px;
                "
            >

                <!-- عنوان -->

                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:15px;
                        flex-wrap:wrap;
                        margin-bottom:25px;
                    "
                >

                    <div>

                        <h2
                            style="
                                margin:0;
                                font-size:24px;
                                font-weight:900;
                            "
                        >
                            مدیریت
                            ${escapeHTML(
                                CATEGORIES[safeCategory]
                            )}
                        </h2>

                        <p
                            style="
                                margin-top:8px;
                                color:var(--text-muted);
                            "
                        >
                            ${lessonNameSafe}
                        </p>

                    </div>


                    <button
                        type="button"
                        id="m1-question-back"
                        style="
                            border:none;
                            padding:10px 18px;
                            border-radius:10px;
                            cursor:pointer;
                            background:var(--primary);
                            color:white;
                            font-family:inherit;
                            font-weight:800;
                        "
                    >
                        ← بازگشت
                    </button>

                </div>


                <!-- لیست سوالات -->

                <div
                    id="m1-final-question-editor"
                >
                    ${rowsHTML}
                </div>


                <!-- افزودن سوال -->

                <button
                    type="button"
                    id="m1-add-question"
                    style="
                        width:100%;
                        margin-top:10px;
                        border:none;
                        padding:14px;
                        border-radius:12px;
                        cursor:pointer;
                        background:#16a34a;
                        color:white;
                        font-family:inherit;
                        font-size:15px;
                        font-weight:900;
                    "
                >
                    ＋ افزودن سوال جدید
                </button>


                <!-- ذخیره -->

                <button
                    type="button"
                    id="m1-save-questions"
                    style="
                        width:100%;
                        margin-top:12px;
                        border:none;
                        padding:15px;
                        border-radius:12px;
                        cursor:pointer;
                        background:#065f46;
                        color:white;
                        font-family:inherit;
                        font-size:16px;
                        font-weight:900;
                    "
                >
                    💾 ذخیره سوالات
                </button>

            </section>
        `;


        /* -----------------------------------------------------
           بازگشت
           ----------------------------------------------------- */

        const backButton =
            document.getElementById(
                'm1-question-back'
            );

        if (backButton) {

            backButton.onclick =
            function () {

                if (
                    typeof window.openLessonQuestions ===
                    'function'
                ) {

                    window.openLessonQuestions(
                        lessonKey,
                        lessonName
                    );

                }
            };
        }


        /* -----------------------------------------------------
           افزودن سوال
           ----------------------------------------------------- */

        const addButton =
            document.getElementById(
                'm1-add-question'
            );

        if (addButton) {

            addButton.onclick =
            function () {

                const editor =
                    document.getElementById(
                        'm1-final-question-editor'
                    );

                if (!editor) {
                    return;
                }


                const empty =
                    document.getElementById(
                        'm1-final-empty'
                    );

                if (empty) {
                    empty.remove();
                }


                const rows =
                    editor.querySelectorAll(
                        '.m1-final-question-row'
                    );


                editor.insertAdjacentHTML(
                    'beforeend',
                    createQuestionRow(
                        '',
                        rows.length
                    )
                );


                updateQuestionNumbers();


                const newRows =
                    editor.querySelectorAll(
                        '.m1-final-question-row'
                    );


                const lastRow =
                    newRows[
                        newRows.length - 1
                    ];


                if (lastRow) {

                    const input =
                        lastRow.querySelector(
                            '.m1-question-input'
                        );

                    if (input) {

                        input.focus();

                        lastRow.scrollIntoView({
                            behavior:'smooth',
                            block:'center'
                        });
                    }
                }
            };
        }


        /* -----------------------------------------------------
           حذف سوال
           ----------------------------------------------------- */

        const editor =
            document.getElementById(
                'm1-final-question-editor'
            );


        if (editor) {

            editor.addEventListener(
                'click',
                function (event) {

                    const deleteButton =
                        event.target.closest(
                            '.m1-delete-question'
                        );

                    if (!deleteButton) {
                        return;
                    }


                    const row =
                        deleteButton.closest(
                            '.m1-final-question-row'
                        );

                    if (!row) {
                        return;
                    }


                    if (
                        !confirm(
                            'آیا مطمئن هستید که می‌خواهید این سوال حذف شود؟'
                        )
                    ) {
                        return;
                    }


                    row.remove();

                    updateQuestionNumbers();


                    const remaining =
                        editor.querySelectorAll(
                            '.m1-final-question-row'
                        );


                    if (!remaining.length) {

                        editor.insertAdjacentHTML(
                            'beforeend',
                            `
                                <div
                                    id="m1-final-empty"
                                    style="
                                        text-align:center;
                                        padding:35px 20px;
                                        margin-bottom:15px;
                                        border:2px dashed var(--card-border);
                                        border-radius:15px;
                                    "
                                >
                                    <div
                                        style="
                                            font-size:42px;
                                            margin-bottom:10px;
                                        "
                                    >
                                        📝
                                    </div>

                                    <strong>
                                        هنوز سوالی ثبت نشده است
                                    </strong>

                                    <p
                                        style="
                                            color:var(--text-muted);
                                            margin-top:8px;
                                        "
                                    >
                                        برای اضافه کردن سوال،
                                        روی «افزودن سوال جدید» بزنید.
                                    </p>
                                </div>
                            `
                        );
                    }

                }
            );
        }


        /* -----------------------------------------------------
           ذخیره سوالات
           ----------------------------------------------------- */

        const saveButton =
            document.getElementById(
                'm1-save-questions'
            );


        if (saveButton) {

            saveButton.onclick =
            function () {

                const rows =
                    document.querySelectorAll(
                        '#m1-final-question-editor .m1-final-question-row'
                    );


                const questions = [];


                rows.forEach(
                    function (row) {

                        const input =
                            row.querySelector(
                                '.m1-question-input'
                            );

                        if (!input) {
                            return;
                        }


                        const text =
                            input.value.trim();


                        if (text !== '') {

                            questions.push({
                                text: text
                            });
                        }

                    }
                );


                const success =
                    window.finalSaveLessonQuestions(
                        lessonKey,
                        safeCategory,
                        questions
                    );


                if (!success) {
                    return;
                }


                alert(
                    'سوالات با موفقیت ذخیره شدند.\n\nاطلاعات حتی بعد از F5 نیز باقی می‌مانند.'
                );


                /* دوباره همان صفحه را باز کن */

                window.showMiddle1QuestionManager(
                    lessonKey,
                    lessonName,
                    safeCategory
                );

            };
        }

    };


    /* ---------------------------------------------------------
       سازگاری با توابع قبلی
       --------------------------------------------------------- */

    window.finalAddQuestionRow =
    function () {

        const button =
            document.getElementById(
                'm1-add-question'
            );

        if (button) {
            button.click();
        }
    };


    window.finalDeleteQuestionRow =
    function (button) {

        if (!button) {
            return;
        }

        const row =
            button.closest(
                '.m1-final-question-row'
            );

        if (!row) {
            return;
        }

        const deleteButton =
            row.querySelector(
                '.m1-delete-question'
            );

        if (deleteButton) {
            deleteButton.click();
        }
    };


    /* ---------------------------------------------------------
       بازیابی اطلاعات
       --------------------------------------------------------- */

    window.finalRestoreM1Questions =
    function () {

        try {

            const data =
                getAllQuestions();


            if (
                typeof lessonQuestionsData ===
                'undefined'
            ) {
                return;
            }


            Object.keys(data).forEach(
                function (lessonKey) {

                    const lesson =
                        createLessonStructure(
                            data,
                            lessonKey
                        );


                    lessonQuestionsData[
                        lessonKey
                    ] = {

                        textbook:
                            lesson.textbook,

                        firstTerm:
                            lesson.firstTerm,

                        secondTerm:
                            lesson.secondTerm
                    };

                }
            );

        } catch (error) {

            console.error(
                'خطا در بازیابی سوالات متوسطه اول:',
                error
            );
        }
    };


    /* ---------------------------------------------------------
       تبدیل اطلاعات قدیمی به سیستم جدید
       --------------------------------------------------------- */

    function migrateOldQuestions() {

        try {

            const current =
                getAllQuestions();


            let changed = false;


            if (
                typeof lessonQuestionsData !==
                'undefined' &&
                lessonQuestionsData &&
                typeof lessonQuestionsData ===
                'object'
            ) {

                Object.keys(
                    lessonQuestionsData
                ).forEach(
                    function (lessonKey) {

                        const oldLesson =
                            lessonQuestionsData[
                                lessonKey
                            ];


                        if (
                            !oldLesson ||
                            typeof oldLesson !==
                            'object'
                        ) {
                            return;
                        }


                        const lesson =
                            createLessonStructure(
                                current,
                                lessonKey
                            );


                        [
                            'textbook',
                            'firstTerm',
                            'secondTerm'
                        ].forEach(
                            function (category) {

                                if (
                                    Array.isArray(
                                        oldLesson[
                                            category
                                        ]
                                    ) &&
                                    oldLesson[
                                        category
                                    ].length
                                ) {

                                    if (
                                        !lesson[
                                            category
                                        ].length
                                    ) {

                                        lesson[
                                            category
                                        ] =
                                            oldLesson[
                                                category
                                            ];

                                        changed = true;
                                    }
                                }

                            }
                        );

                    }
                );
            }


            if (changed) {

                saveAllQuestions(
                    current
                );
            }

        } catch (error) {

            console.error(
                'خطا در انتقال سوالات قدیمی:',
                error
            );
        }
    }


    /* ---------------------------------------------------------
       اجرا هنگام آماده شدن سایت
       --------------------------------------------------------- */

    function initializeM1Questions() {

        migrateOldQuestions();

        window.finalRestoreM1Questions();

    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeM1Questions
        );

    } else {

        initializeM1Questions();
    }


    window.addEventListener(
        'load',
        function () {

            window.finalRestoreM1Questions();

        }
    );


    /* ---------------------------------------------------------
       پایان
       --------------------------------------------------------- */

    console.log(
        '✅ سیستم نهایی سوالات متوسطه اول فعال شد.'
    );

})();
/* ============================================================
   سیستم نهایی نمایش سوالات متوسطه اول
   اتصال واقعی:
   سوالات متن کتاب
   نوبت اول
   نوبت دوم

   هر درس کاملاً مستقل است.
   ============================================================ */

(function () {

    'use strict';


    /* ============================================================
       تنظیمات
       ============================================================ */

    const M1_FINAL_STORAGE =
        'MIDDLE1_QUESTIONS_FINAL_V3';


    /* ============================================================
       یکسان‌سازی نام دسته‌ها
       ============================================================ */

    function normalizeM1Category(category) {

        const value =
            String(category || '').trim();


        if (
            value === 'first-term' ||
            value === 'first_term' ||
            value === 'firstTerm'
        ) {

            return 'firstTerm';
        }


        if (
            value === 'second-term' ||
            value === 'second_term' ||
            value === 'secondTerm'
        ) {

            return 'secondTerm';
        }


        return 'textbook';
    }


    /* ============================================================
       عنوان دسته
       ============================================================ */

    function getM1CategoryTitle(category) {

        const safe =
            normalizeM1Category(category);


        if (safe === 'textbook') {

            return 'سوالات متن کتاب';
        }


        if (safe === 'firstTerm') {

            return 'نوبت اول';
        }


        if (safe === 'secondTerm') {

            return 'نوبت دوم';
        }


        return 'سوالات';
    }


    /* ============================================================
       خواندن بانک سوالات
       ============================================================ */

    function readM1Questions() {

        try {

            const raw =
                localStorage.getItem(
                    M1_FINAL_STORAGE
                );


            if (!raw) {

                return {};
            }


            const data =
                JSON.parse(raw);


            if (
                !data ||
                typeof data !== 'object' ||
                Array.isArray(data)
            ) {

                return {};
            }


            return data;

        } catch (error) {

            console.error(
                'خطا در خواندن بانک سوالات متوسطه اول:',
                error
            );


            return {};
        }
    }


    /* ============================================================
       ذخیره بانک سوالات
       ============================================================ */

    function writeM1Questions(data) {

        try {

            localStorage.setItem(
                M1_FINAL_STORAGE,
                JSON.stringify(data)
            );


            return true;

        } catch (error) {

            console.error(
                'خطا در ذخیره بانک سوالات متوسطه اول:',
                error
            );


            alert(
                'ذخیره سوالات انجام نشد.'
            );


            return false;
        }
    }


    /* ============================================================
       کلید اختصاصی درس + دسته
       ============================================================ */

    function getM1QuestionKey(
        lessonKey,
        category
    ) {

        return (
            String(lessonKey) +
            '__' +
            normalizeM1Category(category)
        );
    }


    /* ============================================================
       دریافت سوالات
       ============================================================ */

    function getM1Questions(
        lessonKey,
        category
    ) {

        const safeCategory =
            normalizeM1Category(category);


        const data =
            readM1Questions();


        const key =
            getM1QuestionKey(
                lessonKey,
                safeCategory
            );


        if (
            Object.prototype.hasOwnProperty.call(
                data,
                key
            )
        ) {

            return Array.isArray(
                data[key]
            )
                ? data[key]
                : [];
        }


        /*
         * پشتیبانی از اطلاعات اولیه سایت
         */

        try {

            if (
                typeof lessonQuestionsData !==
                'undefined' &&
                lessonQuestionsData &&
                lessonQuestionsData[lessonKey]
            ) {

                const oldData =
                    lessonQuestionsData[
                        lessonKey
                    ];


                const oldCategory =
                    oldData[safeCategory];


                if (
                    Array.isArray(
                        oldCategory
                    )
                ) {

                    return oldCategory;
                }


                /*
                 * پشتیبانی از نام قدیمی
                 */

                const oldDashCategory =
                    safeCategory === 'firstTerm'
                        ? 'first-term'
                        : safeCategory === 'secondTerm'
                            ? 'second-term'
                            : 'textbook';


                if (
                    Array.isArray(
                        oldData[
                            oldDashCategory
                        ]
                    )
                ) {

                    return oldData[
                        oldDashCategory
                    ];
                }
            }

        } catch (error) {

            console.warn(
                'اطلاعات اولیه سوالات پیدا نشد.'
            );
        }


        return [];
    }


    /* ============================================================
       ذخیره سوالات
       ============================================================ */

    function saveM1Questions(
        lessonKey,
        category,
        questions
    ) {

        const safeCategory =
            normalizeM1Category(category);


        const data =
            readM1Questions();


        const key =
            getM1QuestionKey(
                lessonKey,
                safeCategory
            );


        data[key] =
            Array.isArray(questions)
                ? questions.map(
                    function (question) {

                        if (
                            typeof question ===
                            'string'
                        ) {

                            return {
                                text: question
                            };
                        }


                        return {
                            text:
                                String(
                                    question &&
                                    question.text
                                        ? question.text
                                        : ''
                                )
                        };

                    }
                ).filter(
                    function (question) {

                        return (
                            question.text
                                .trim() !== ''
                        );
                    }
                )
                : [];


        return writeM1Questions(
            data
        );
    }


    /* ============================================================
       HTML امن
       ============================================================ */

    function escapeM1HTML(value) {

        return String(value || '')
            .replace(
                /&/g,
                '&amp;'
            )
            .replace(
                /</g,
                '&lt;'
            )
            .replace(
                />/g,
                '&gt;'
            )
            .replace(
                /"/g,
                '&quot;'
            )
            .replace(
                /'/g,
                '&#039;'
            );
    }


    /* ============================================================
       نمایش سوالات برای دانش‌آموز
       ============================================================ */

    window.openM1QuestionList =
    function (
        lessonKey,
        lessonName,
        category
    ) {

        const container =
            document.getElementById(
                'mainAppContent'
            );


        if (!container) {

            console.error(
                'mainAppContent پیدا نشد.'
            );

            return;
        }


        const safeCategory =
            normalizeM1Category(
                category
            );


        const title =
            getM1CategoryTitle(
                safeCategory
            );


        const questions =
            getM1Questions(
                lessonKey,
                safeCategory
            );


        state.currentView =
            'questions';


        let questionsHTML =
            '';


        if (
            questions &&
            questions.length > 0
        ) {

            questionsHTML =
                questions.map(
                    function (
                        question,
                        index
                    ) {

                        const text =
                            typeof question ===
                            'string'
                                ? question
                                : (
                                    question &&
                                    question.text
                                        ? question.text
                                        : ''
                                );


                        return `

                            <div
                                class="glass-card"
                                style="
                                    padding:18px;
                                    margin-bottom:15px;
                                    border-radius:15px;
                                "
                            >

                                <div
                                    style="
                                        display:flex;
                                        align-items:flex-start;
                                        gap:12px;
                                    "
                                >

                                    <div
                                        style="
                                            min-width:36px;
                                            height:36px;
                                            border-radius:50%;
                                            display:flex;
                                            align-items:center;
                                            justify-content:center;
                                            background:var(--primary);
                                            color:white;
                                            font-weight:900;
                                        "
                                    >
                                        ${index + 1}
                                    </div>


                                    <div
                                        style="
                                            flex:1;
                                            line-height:2;
                                            font-size:15px;
                                            color:var(--text-color);
                                            white-space:pre-wrap;
                                            word-break:break-word;
                                        "
                                    >
                                        ${escapeM1HTML(text)}
                                    </div>

                                </div>

                            </div>
                        `;
                    }
                ).join('');

        } else {

            questionsHTML = `

                <div
                    class="glass-card"
                    style="
                        padding:45px 20px;
                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:55px;
                            margin-bottom:15px;
                        "
                    >
                        📝
                    </div>


                    <h3
                        style="
                            margin:0 0 10px;
                            font-size:20px;
                        "
                    >
                        هنوز سوالی ثبت نشده است
                    </h3>


                    <p
                        style="
                            color:var(--text-muted);
                            margin:0;
                        "
                    >
                        برای این بخش هنوز سوالی اضافه نشده است.
                    </p>

                </div>
            `;
        }


        container.innerHTML = `

            <section
                class="glass-card fade-in-up"
                style="
                    padding:25px;
                "
            >

                <button
                    type="button"
                    id="m1-student-question-back"
                    style="
                        border:none;
                        padding:10px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        background:var(--primary);
                        color:white;
                        font-family:inherit;
                        font-weight:800;
                        margin-bottom:25px;
                    "
                >
                    ← بازگشت به ${escapeM1HTML(lessonName)}
                </button>


                <div
                    style="
                        text-align:center;
                        margin-bottom:30px;
                    "
                >

                    <h2
                        style="
                            margin:0;
                            font-size:25px;
                            font-weight:900;
                        "
                    >
                        ${escapeM1HTML(title)}
                    </h2>


                    <p
                        style="
                            margin:10px 0 0;
                            color:var(--text-muted);
                        "
                    >
                        درس
                        ${escapeM1HTML(lessonName)}
                    </p>

                </div>


                <div
                    style="
                        max-width:900px;
                        margin:0 auto;
                    "
                >
                    ${questionsHTML}
                </div>

            </section>
        `;


        const back =
            document.getElementById(
                'm1-student-question-back'
            );


        if (back) {

            back.onclick =
            function () {

                if (
                    typeof window.openLessonQuestions ===
                    'function'
                ) {

                    window.openLessonQuestions(
                        lessonKey,
                        lessonName
                    );

                } else {

                    if (
                        typeof window.openLesson ===
                        'function'
                    ) {

                        window.openLesson(
                            lessonKey,
                            lessonName
                        );
                    }
                }
            };
        }


        window.scrollTo({
            top:0,
            behavior:'smooth'
        });
    };


    /* ============================================================
       صفحه سه دسته سوالات
       ============================================================ */

    window.openLessonQuestions =
    function (
        lessonKey,
        lessonName
    ) {

        const container =
            document.getElementById(
                'mainAppContent'
            );


        if (!container) {

            return;
        }


        state.currentView =
            'questions';


        container.innerHTML = `

            <section
                class="glass-card fade-in-up"
                style="
                    padding:25px;
                "
            >

                <button
                    type="button"
                    id="m1-questions-back"
                    style="
                        border:none;
                        padding:10px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        background:var(--primary);
                        color:white;
                        font-family:inherit;
                        font-weight:800;
                        margin-bottom:25px;
                    "
                >
                    ← بازگشت
                </button>


                <div
                    style="
                        text-align:center;
                        margin-bottom:30px;
                    "
                >

                    <h2
                        style="
                            margin:0;
                            font-size:26px;
                            font-weight:900;
                        "
                    >
                        سوالات درس
                    </h2>


                    <p
                        style="
                            margin-top:10px;
                            color:var(--text-muted);
                        "
                    >
                        ${escapeM1HTML(lessonName)}
                    </p>

                </div>


                <div
                    class="drilldown-grid"
                    style="
                        grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(220px,1fr)
                        );
                        gap:20px;
                    "
                >

                    <!-- سوالات متن کتاب -->

                    <div
                        class="drilldown-card"
                        style="
                            cursor:pointer;
                            text-align:center;
                        "
                        onclick="
    openQuestionCategory(
        '${escapeM1HTML(lessonKey)}',
        '${escapeM1HTML(lessonName)}',
        'textbook'
    )
"
                    >

                        <svg
                            class="topic-icon-svg"
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


                        <h3>
                            سوالات متن کتاب
                        </h3>


                        <p
                            style="
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >
                            سوالات و پاسخ‌های متن کتاب
                        </p>

                    </div>


                    <!-- نوبت اول -->

                    <div
                        class="drilldown-card"
                        style="
                            cursor:pointer;
                            text-align:center;
                        "
                        onclick="
                            openM1QuestionList(
                                '${escapeM1HTML(lessonKey)}',
                                '${escapeM1HTML(lessonName)}',
                                'firstTerm'
                            )
                        "
                    >

                        <svg
                            class="topic-icon-svg"
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


                        <h3>
                            نوبت اول
                        </h3>


                        <p
                            style="
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >
                            نمونه سوالات امتحان نوبت اول
                        </p>

                    </div>


                    <!-- نوبت دوم -->

                    <div
                        class="drilldown-card"
                        style="
                            cursor:pointer;
                            text-align:center;
                        "
                        onclick="
                            openM1QuestionList(
                                '${escapeM1HTML(lessonKey)}',
                                '${escapeM1HTML(lessonName)}',
                                'secondTerm'
                            )
                        "
                    >

                        <svg
                            class="topic-icon-svg"
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


                        <h3>
                            نوبت دوم
                        </h3>


                        <p
                            style="
                                color:var(--text-muted);
                                font-size:13px;
                            "
                        >
                            نمونه سوالات امتحان نوبت دوم
                        </p>

                        <button
    type="button"
    onclick="
        event.stopPropagation();
        editQuestionChapterText(
            '${escapeQuestionHTML(lessonId)}',
            '${escapeQuestionHTML(lessonName)}',
            '${escapeQuestionHTML(safeCategory)}',
            '${escapeQuestionHTML(chapter.id)}',
            '${escapeQuestionHTML(chapter.title)}'
        );
    "
    style="
        margin-top:12px;
        padding:6px 12px;
        border:none;
        border-radius:8px;
        background:var(--primary-color);
        color:#fff;
        font-size:12px;
        font-weight:800;
        cursor:pointer;
    "
>
    ✏️ ویرایش
</button>

                    </div>

                </div>

            </section>
        `;


        const back =
            document.getElementById(
                'm1-questions-back'
            );


        if (back) {

            back.onclick =
            function () {

                if (
                    typeof window.openLesson ===
                    'function'
                ) {

                    window.openLesson(
                        lessonKey,
                        lessonName
                    );
                }
            };
        }


        window.scrollTo({
            top:0,
            behavior:'smooth'
        });
    };


    /* ============================================================
       مدیریت سوالات
       ============================================================ */

    window.showMiddle1QuestionManager =
    function (
        lessonKey,
        lessonName,
        category
    ) {

        const container =
            document.getElementById(
                'mainAppContent'
            );


        if (!container) {

            return;
        }


        const safeCategory =
            normalizeM1Category(
                category
            );


        const title =
            getM1CategoryTitle(
                safeCategory
            );


        let questions =
            getM1Questions(
                lessonKey,
                safeCategory
            );


        container.innerHTML = `

            <section
                class="glass-card fade-in-up"
                style="
                    padding:25px;
                "
            >

                <button
                    type="button"
                    id="m1-admin-back"
                    style="
                        border:none;
                        padding:10px 18px;
                        border-radius:10px;
                        cursor:pointer;
                        background:var(--primary);
                        color:white;
                        font-family:inherit;
                        font-weight:800;
                        margin-bottom:25px;
                    "
                >
                    ← بازگشت
                </button>


                <div
                    style="
                        text-align:center;
                        margin-bottom:25px;
                    "
                >

                    <h2
                        style="
                            margin:0;
                            font-size:24px;
                            font-weight:900;
                        "
                    >
                        مدیریت ${escapeM1HTML(title)}
                    </h2>


                    <p
                        style="
                            margin-top:8px;
                            color:var(--text-muted);
                        "
                    >
                        درس ${escapeM1HTML(lessonName)}
                    </p>

                </div>


                <div
                    id="m1-admin-question-list"
                ></div>


                <button
                    type="button"
                    id="m1-admin-add"
                    style="
                        width:100%;
                        border:none;
                        padding:14px;
                        border-radius:12px;
                        cursor:pointer;
                        background:#16a34a;
                        color:white;
                        font-family:inherit;
                        font-size:15px;
                        font-weight:900;
                        margin-top:10px;
                    "
                >
                    ＋ افزودن سوال جدید
                </button>


                <button
                    type="button"
                    id="m1-admin-save"
                    style="
                        width:100%;
                        border:none;
                        padding:15px;
                        border-radius:12px;
                        cursor:pointer;
                        background:#065f46;
                        color:white;
                        font-family:inherit;
                        font-size:16px;
                        font-weight:900;
                        margin-top:12px;
                    "
                >
                    💾 ذخیره سوالات
                </button>

            </section>
        `;


        const listContainer =
            document.getElementById(
                'm1-admin-question-list'
            );


        function renderAdminQuestions() {

            if (!listContainer) {
                return;
            }


            questions =
                Array.isArray(questions)
                    ? questions
                    : [];


            if (!questions.length) {

                listContainer.innerHTML = `

                    <div
                        id="m1-admin-empty"
                        style="
                            text-align:center;
                            padding:35px 15px;
                            border:2px dashed var(--card-border);
                            border-radius:15px;
                            color:var(--text-muted);
                            margin-bottom:15px;
                        "
                    >

                        <div
                            style="
                                font-size:45px;
                                margin-bottom:10px;
                            "
                        >
                            📝
                        </div>


                        <strong>
                            هنوز سوالی ثبت نشده است
                        </strong>

                    </div>
                `;

                return;
            }


            listContainer.innerHTML =
                questions.map(
                    function (
                        question,
                        index
                    ) {

                        const text =
                            typeof question ===
                            'string'
                                ? question
                                : (
                                    question &&
                                    question.text
                                        ? question.text
                                        : ''
                                );


                        return `

                            <div
                                class="m1-admin-question"
                                data-index="${index}"
                                style="
                                    padding:16px;
                                    border:1px solid var(--card-border);
                                    border-radius:14px;
                                    margin-bottom:15px;
                                    background:var(--card-bg);
                                "
                            >

                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        align-items:center;
                                        gap:10px;
                                        margin-bottom:10px;
                                    "
                                >

                                    <strong>
                                        سوال ${index + 1}
                                    </strong>


                                    <button
                                        type="button"
                                        class="m1-admin-delete"
                                        data-index="${index}"
                                        style="
                                            border:none;
                                            padding:7px 12px;
                                            border-radius:8px;
                                            cursor:pointer;
                                            background:#dc2626;
                                            color:white;
                                            font-family:inherit;
                                            font-weight:800;
                                        "
                                    >
                                        🗑 حذف
                                    </button>

                                </div>


                                <textarea
                                    class="m1-admin-input" aria-label="متن سوال"
                                    data-index="${index}"
                                    style="
                                        width:100%;
                                        min-height:100px;
                                        box-sizing:border-box;
                                        resize:vertical;
                                        padding:12px;
                                        border-radius:10px;
                                        border:1px solid var(--card-border);
                                        background:var(--input-bg, var(--card-bg));
                                        color:var(--text-color);
                                        font-family:inherit;
                                        font-size:15px;
                                        line-height:2;
                                    "
                                    placeholder="متن سوال را بنویسید..."
                                >${escapeM1HTML(text)}</textarea>

                            </div>
                        `;
                    }
                ).join('');
        }


        renderAdminQuestions();


        /* ========================================================
           افزودن سوال
           ======================================================== */

        const addButton =
            document.getElementById(
                'm1-admin-add'
            );


        if (addButton) {

            addButton.onclick =
            function () {

                questions.push({
                    text:''
                });


                renderAdminQuestions();


                const inputs =
                    listContainer.querySelectorAll(
                        '.m1-admin-input'
                    );


                if (inputs.length) {

                    const last =
                        inputs[
                            inputs.length - 1
                        ];


                    last.focus();


                    last.scrollIntoView({
                        behavior:'smooth',
                        block:'center'
                    });
                }
            };
        }


        /* ========================================================
           حذف سوال
           ======================================================== */

        if (listContainer) {

            listContainer.addEventListener(
                'click',
                function (event) {

                    const button =
                        event.target.closest(
                            '.m1-admin-delete'
                        );


                    if (!button) {
                        return;
                    }


                    const index =
                        Number(
                            button.dataset.index
                        );


                    if (
                        !Number.isInteger(index) ||
                        index < 0 ||
                        index >= questions.length
                    ) {
                        return;
                    }


                    if (
                        !confirm(
                            'آیا از حذف این سوال مطمئن هستید؟'
                        )
                    ) {
                        return;
                    }


                    questions.splice(
                        index,
                        1
                    );


                    renderAdminQuestions();
                }
            );
        }


        /* ========================================================
           ذخیره
           ======================================================== */

        const saveButton =
            document.getElementById(
                'm1-admin-save'
            );


        if (saveButton) {

            saveButton.onclick =
            function () {

                const inputs =
                    listContainer.querySelectorAll(
                        '.m1-admin-input'
                    );


                const finalQuestions =
                    [];


                inputs.forEach(
                    function (input) {

                        const text =
                            input.value.trim();


                        if (text !== '') {

                            finalQuestions.push({
                                text:text
                            });
                        }
                    }
                );


                const success =
                    saveM1Questions(
                        lessonKey,
                        safeCategory,
                        finalQuestions
                    );


                if (!success) {

                    return;
                }


                questions =
                    finalQuestions;


                alert(
                    'سوالات با موفقیت ذخیره شدند.'
                );


                renderAdminQuestions();
            };
        }


        /* ========================================================
           بازگشت
           ======================================================== */

        const backButton =
            document.getElementById(
                'm1-admin-back'
            );


        if (backButton) {

            backButton.onclick =
            function () {

                if (
                    typeof window.openLessonQuestions ===
                    'function'
                ) {

                    window.openLessonQuestions(
                        lessonKey,
                        lessonName
                    );
                }
            };
        }
    };


    /* ============================================================
       اتصال دکمه‌های قدیمی مدیریت
       ============================================================ */

    window.openQuestionManager =
    function (
        lessonKey,
        lessonName,
        category
    ) {

        window.showMiddle1QuestionManager(
            lessonKey,
            lessonName,
            category
        );
    };


    /* ============================================================
       توابع کمکی عمومی
       ============================================================ */

    window.getM1FinalQuestions =
        getM1Questions;


    window.saveM1FinalQuestions =
        saveM1Questions;


    /* ============================================================
       مهاجرت اطلاعات قدیمی
       ============================================================ */

    function migrateM1OldData() {

        try {

            const data =
                readM1Questions();


            let changed =
                false;


            if (
                typeof lessonQuestionsData !==
                'undefined' &&
                lessonQuestionsData
            ) {

                Object.keys(
                    lessonQuestionsData
                ).forEach(
                    function (lessonKey) {

                        const old =
                            lessonQuestionsData[
                                lessonKey
                            ];


                        if (
                            !old ||
                            typeof old !==
                            'object'
                        ) {
                            return;
                        }


                        [
                            'textbook',
                            'firstTerm',
                            'secondTerm'
                        ].forEach(
                            function (category) {

                                const key =
                                    getM1QuestionKey(
                                        lessonKey,
                                        category
                                    );


                                if (
                                    Object.prototype.hasOwnProperty.call(
                                        data,
                                        key
                                    )
                                ) {
                                    return;
                                }


                                let list =
                                    old[category];


                                if (
                                    !Array.isArray(list)
                                ) {

                                    const oldName =
                                        category ===
                                        'firstTerm'
                                            ? 'first-term'
                                            : category ===
                                              'secondTerm'
                                                ? 'second-term'
                                                : 'textbook';


                                    list =
                                        old[
                                            oldName
                                        ];
                                }


                                if (
                                    Array.isArray(
                                        list
                                    ) &&
                                    list.length
                                ) {

                                    data[key] =
                                        list;

                                    changed =
                                        true;
                                }
                            }
                        );
                    }
                );
            }


            if (changed) {

                writeM1Questions(
                    data
                );
            }

        } catch (error) {

            console.error(
                'خطا در انتقال اطلاعات قدیمی:',
                error
            );
        }
    }


    /* ============================================================
       اجرای اولیه
       ============================================================ */

    function initializeM1FinalSystem() {

        migrateM1OldData();

        console.log(
            '✅ سیستم نهایی سوالات متوسطه اول فعال شد.'
        );
    }


    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            initializeM1FinalSystem
        );

    } else {

        initializeM1FinalSystem();
    }


})();

/* =========================================================
   سیستم فیلم‌های آموزشی - نسخه امن
   متوسطه اول + متوسطه دوم
   ========================================================= */

window._lessonVideosPreviousHTML = null;
window._lessonVideosPreviousView = null;


/* =========================================================
   لیست فیلم‌های یک کتاب
   ========================================================= */

function openLessonVideos(lessonId, lessonName) {

    const container =
        document.getElementById('mainAppContent');

    if (!container) {
        return;
    }

    const lessonKey =
        String(lessonId || '').trim();

    const title =
        String(lessonName || '').trim();

    if (!lessonKey) {
        return;
    }

    rememberView('lesson-videos');

   const videoSessionCounts = {
    'm1-p7-lesson1': 12,
    'm1-p7-lesson2': 14,
    'm1-p7-lesson3': 17,
    'm1-p7-lesson4': 9,
    'm1-p7-lesson5': 15,
    'm1-p7-lesson6': 24,
    'm1-p7-lesson7': 20,
    'm1-p7-lesson8': 10,

    'm1-p8-lesson1': 12,
    'm1-p8-lesson2': 15,
    'm1-p8-lesson3': 17,
    'm1-p8-lesson4': 9,
    'm1-p8-lesson5': 15,
    'm1-p8-lesson6': 24,
    'm1-p8-lesson7': 10,
    'm1-p8-lesson8': 7,

    'm1-p9-lesson1': 11,
    'm1-p9-lesson2': 12,
    'm1-p9-lesson3': 17,
    'm1-p9-lesson4': 8,
    'm1-p9-lesson5': 15,
    'm1-p9-lesson6': 24,
    'm1-p9-lesson7': 10,
    'm1-p9-lesson8': 6
};

const lessonCount = Number(videoSessionCounts[lessonKey]) || 0;

    let cardsHTML = '';

    for (
        let i = 1;
        i <= lessonCount;
        i++
    ) {

        const chapterId =
            lessonKey +
            '__videos__chapter_' +
            i;

        const chapterTitle =
    'جلسه ' +
    i +
    ' - فیلم آموزشی ' +
    title;

        cardsHTML += `

            <div
                class="video-lesson-card"
                style="
                    display:flex !important;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    min-height:180px;
                    padding:25px;
                    cursor:pointer;
                    border-radius:20px;
                    background:var(--card-bg);
                    border:1px solid var(--card-border);
                    box-sizing:border-box;
                "
                onclick="
                    openLessonVideoChapter(
                        '${escapeQuestionHTML(chapterId)}',
                        '${escapeQuestionHTML(chapterTitle)}',
                        '${escapeQuestionHTML(lessonKey)}',
                        '${escapeQuestionHTML(title)}'
                    )
                "
            >

                <div
                    style="
                        font-size:45px;
                        margin-bottom:15px;
                    "
                >
                    🎬
                </div>

                <h3
                    style="
                        margin:0;
                        text-align:center;
                        font-size:17px;
                        font-weight:800;
                        line-height:1.8;
                    "
                >
                    ${escapeQuestionHTML(chapterTitle)}
                </h3>

                <p
                    style="
                        margin:10px 0 0;
                        color:var(--text-muted);
                        font-size:13px;
                        text-align:center;
                    "
                >
                  ورود به فیلم جلسه ${i}
                </p>

            </div>

        `;
    }

    if (!cardsHTML) {

        cardsHTML = `

            <div
                style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:45px 20px;
                    background:var(--card-bg);
                    border:1px solid var(--card-border);
                    border-radius:20px;
                "
            >

                <div
                    style="
                        font-size:55px;
                        margin-bottom:15px;
                    "
                >
                    🎬
                </div>

                <h3>
                    فیلم‌های آموزشی
                    ${escapeQuestionHTML(title)}
                </h3>

                <p
                    style="
                        margin-top:10px;
                        color:var(--text-muted);
                    "
                >
                    برای این کتاب هنوز درسی ثبت نشده است.
                </p>

            </div>

        `;
    }

    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
            style="
                width:100%;
                margin-top:25px;
            "
        >

            <button
                type="button"
                class="question-back-btn"
                onclick="
                    openLessonVideosBack(
                        '${escapeQuestionHTML(lessonKey)}',
                        '${escapeQuestionHTML(title)}'
                    )
                "
            >
                ← بازگشت
            </button>

            <div
                class="question-category-header"
            >

                <h2>
                    فیلم‌های آموزشی
                    ${escapeQuestionHTML(title)}
                </h2>

                <p>
                    درس مورد نظر را برای مشاهده فیلم انتخاب کنید
                </p>

            </div>

            <div
                class="video-lessons-grid"
                style="
                    display:grid !important;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(230px, 1fr)
                        ) !important;
                    gap:20px;
                    margin-top:25px;
                "
            >
                ${cardsHTML}
            </div>

        </section>

    `;
}


/* =========================================================
   بازگشت از لیست فیلم‌ها به صفحه همان درس
   ========================================================= */

function openLessonVideosBack(
    lessonId,
    lessonName
) {

    const container =
        document.getElementById('mainAppContent');

    if (!container) {
        location.reload();
        return;
    }


    /* اگر صفحه قبلی ذخیره شده، همان را برگردان */

    if (
        window._lessonVideosPreviousHTML !== null
    ) {

        container.innerHTML =
            window._lessonVideosPreviousHTML;

        state.currentView =
            window._lessonVideosPreviousView ||
            'home';


        window._lessonVideosPreviousHTML =
            null;

        window._lessonVideosPreviousView =
            null;


        window.currentLessonId =
            String(lessonId || '').trim();

        window.currentLessonName =
            String(lessonName || '').trim();


        /* اگر مدیریت فعال بود، قابلیت‌های مدیریت دوباره فعال شوند */

        if (
            state.isAdmin &&
            typeof enableAdminEditableFields === 'function'
        ) {
            enableAdminEditableFields();
        }

        return;
    }


    location.reload();
}


/* =========================================================
   ورود به فیلم یک درس
   ========================================================= */

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

    window.currentVideoChapterId =
        chapterId;

    window.currentLessonId =
        parentLessonId;

    window.currentLessonName =
        parentLessonName;

    rememberView('lesson-video-chapter');


    /* =========================================
       لینک فیلم‌های آموزشی
       ========================================= */

    const videoLinks = {

        /* پایه هفتم - انگلیسی - جلسات ۱ تا ۱۰ */
        'm1-p7-lesson8__videos__chapter_1': 'https://www.aparat.com/video/video/embed/videohash/aoag54k/vt/frame',
        'm1-p7-lesson8__videos__chapter_2': 'https://www.aparat.com/video/video/embed/videohash/vbx3sl7/vt/frame',
        'm1-p7-lesson8__videos__chapter_3': 'https://www.aparat.com/video/video/embed/videohash/msp72jb/vt/frame',
        'm1-p7-lesson8__videos__chapter_4': 'https://www.aparat.com/video/video/embed/videohash/fxl2761/vt/frame',
        'm1-p7-lesson8__videos__chapter_5': 'https://www.aparat.com/video/video/embed/videohash/rui27sr/vt/frame',
        'm1-p7-lesson8__videos__chapter_6': 'https://www.aparat.com/video/video/embed/videohash/saw8193/vt/frame',
        'm1-p7-lesson8__videos__chapter_7': 'https://www.aparat.com/video/video/embed/videohash/ufyc871/vt/frame',
        'm1-p7-lesson8__videos__chapter_8': 'https://www.aparat.com/video/video/embed/videohash/nbe8yg7/vt/frame',
        'm1-p7-lesson8__videos__chapter_9': 'https://www.aparat.com/video/video/embed/videohash/ojrc8fe/vt/frame',
        'm1-p7-lesson8__videos__chapter_10': 'https://www.aparat.com/video/video/embed/videohash/zbb316l/vt/frame',

        /* پایه هفتم - پیام‌های آسمانی - جلسات ۱ تا ۱۴ */
        'm1-p7-lesson2__videos__chapter_1': 'https://www.aparat.com/video/video/embed/videohash/oon5289/vt/frame',
        'm1-p7-lesson2__videos__chapter_2': 'https://www.aparat.com/video/video/embed/videohash/falb891/vt/frame',
        'm1-p7-lesson2__videos__chapter_3': 'https://www.aparat.com/video/video/embed/videohash/ygc5loa/vt/frame',
        'm1-p7-lesson2__videos__chapter_4': 'https://www.aparat.com/video/video/embed/videohash/uwbgahh/vt/frame',
        'm1-p7-lesson2__videos__chapter_5': 'https://www.aparat.com/video/video/embed/videohash/jpt9608/vt/frame',
        'm1-p7-lesson2__videos__chapter_6': 'https://www.aparat.com/video/video/embed/videohash/ksbe1x8/vt/frame',
        'm1-p7-lesson2__videos__chapter_7': 'https://www.aparat.com/video/video/embed/videohash/ieox882/vt/frame',
        'm1-p7-lesson2__videos__chapter_8': 'https://www.aparat.com/video/video/embed/videohash/aliy844/vt/frame',
        'm1-p7-lesson2__videos__chapter_9': 'https://www.aparat.com/video/video/embed/videohash/giw20w9/vt/frame',
        'm1-p7-lesson2__videos__chapter_10': 'https://www.aparat.com/video/video/embed/videohash/wux0yvh/vt/frame',
        'm1-p7-lesson2__videos__chapter_11': 'https://www.aparat.com/video/video/embed/videohash/ocn5j97/vt/frame',
        'm1-p7-lesson2__videos__chapter_12': 'https://www.aparat.com/video/video/embed/videohash/hoj83wg/vt/frame',
        'm1-p7-lesson2__videos__chapter_13': 'https://www.aparat.com/video/video/embed/videohash/mjr3k81/vt/frame',
        'm1-p7-lesson2__videos__chapter_14': 'https://www.aparat.com/video/video/embed/videohash/exl0ys3/vt/frame'

    };


    const videoUrl =
        videoLinks[chapterId] || '';

    container.innerHTML = `

        <section
            class="glass-card fade-in-up"
            style="
                width:100%;
                margin-top:25px;
            "
        >

            <button
                type="button"
                class="question-back-btn"
                onclick="
                    openLessonVideos(
                        '${escapeQuestionHTML(parentLessonId)}',
                        '${escapeQuestionHTML(parentLessonName)}'
                    )
                "
            >
                ← بازگشت به فیلم‌ها
            </button>


            <div
                class="question-category-header"
            >

                <h2>
                    ${escapeQuestionHTML(chapterTitle)}
                </h2>

                <p>
                    فیلم آموزشی
                </p>

            </div>


            ${
                videoUrl
                ?
                `

                <div
                    style="
                        width:100%;
                        max-width:900px;
                        margin:20px auto;
                        background:#000;
                        border-radius:16px;
                        overflow:hidden;
                        box-shadow:0 10px 30px rgba(0,0,0,0.25);
                    "
                >

                    <iframe
                        src="${videoUrl}"
                        title="${escapeQuestionHTML(chapterTitle)}"
                        allow="autoplay; fullscreen"
                        allowfullscreen
                        style="
                            display:block;
                            width:100%;
                            aspect-ratio:16 / 9;
                            border:0;
                        "
                    ></iframe>

                    

                </div>

                `
                :
                `

                <div
                    style="
                        min-height:250px;
                        display:flex;
                        flex-direction:column;
                        align-items:center;
                        justify-content:center;
                        text-align:center;
                        background:var(--card-bg);
                        border:1px solid var(--card-border);
                        border-radius:20px;
                        padding:40px 20px;
                        margin-top:20px;
                    "
                >

                    <div
                        style="
                            font-size:70px;
                            margin-bottom:20px;
                        "
                    >
                        🎬
                    </div>

                    <h3>
                        ${escapeQuestionHTML(chapterTitle)}
                    </h3>

                    <p
                        style="
                            margin-top:12px;
                            color:var(--text-muted);
                        "
                    >
                        فیلم آموزشی این جلسه هنوز توسط مدیر ثبت نشده است.
                    </p>

                </div>

                `
            }

        </section>

    `;

}

/* =========================================================
   کنترل نوار ناوبری هنگام اسکرول
   ========================================================= */

const mainHeader =
    document.querySelector('.top-navbar');

const pageNavigationBar =
    document.querySelector('.page-navigation-bar');


function updateCompactNavigation() {
    if (!mainHeader || !pageNavigationBar) {
        return;
    }

    /* در موبایل هدر شفاف همیشه قابل مشاهده بماند. */
    if (window.matchMedia('(max-width:700px)').matches) {
        pageNavigationBar.classList.remove('header-hidden');
        return;
    }

    const headerHeight = mainHeader.offsetHeight;

    if (window.scrollY > headerHeight) {
        pageNavigationBar.classList.add('header-hidden');
    } else {
        pageNavigationBar.classList.remove('header-hidden');
    }
}

/* هنگام اسکرول */
window.addEventListener(
    'scroll',
    updateCompactNavigation,
    { passive: true }
);


/* هنگام بارگذاری */
window.addEventListener(
    'load',
    updateCompactNavigation
);


/* هنگام تغییر اندازه صفحه */
window.addEventListener(
    'resize',
    updateCompactNavigation
);

/* =========================================================
   کنترل هدر دوم هنگام اسکرول
   ========================================================= */

(function () {

    const secondNavbar =
        document.getElementById('atrakSecondNavbar') ||
        document.getElementById('secondMainNavbar');

    if (!secondNavbar) return;


    function updateSecondNavbarOnScroll() {

        if (window.matchMedia('(max-width:700px)').matches) {
            secondNavbar.classList.remove('second-nav-scrolled');
            return;
        }

        if (window.scrollY > 35) {

            secondNavbar.classList.add(
                'second-nav-scrolled'
            );

        } else {

            secondNavbar.classList.remove(
                'second-nav-scrolled'
            );

        }
    }


    window.addEventListener(
        'scroll',
        updateSecondNavbarOnScroll,
        { passive: true }
    );


    window.addEventListener(
        'load',
        updateSecondNavbarOnScroll
    );

})();


/* جای منوی بازشده در موبایل با اسکرول/تغییر اندازه به‌روز شود */
(function(){
    function repositionOpenAtrakDropdowns(){
        if (!window.matchMedia('(max-width:700px)').matches) return;
        document.querySelectorAll('.atrak-second-dropdown.open').forEach(function(target){
            const button = target.querySelector('.atrak-second-dropdown-button');
            const menu = target.querySelector('.atrak-services-menu, .atrak-remote-menu, .atrak-maghta-menu');
            if(!button || !menu) return;
            const rect = button.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = Math.round(rect.bottom + 6) + 'px';
            menu.style.left = '8px';
            menu.style.right = 'auto';
            menu.style.zIndex = '999999';
        });
    }
    window.addEventListener('resize', repositionOpenAtrakDropdowns, {passive:true});
    window.addEventListener('scroll', repositionOpenAtrakDropdowns, {passive:true});
})();

/* =========================================================
   پیام موقت برای بخش‌هایی که فعلاً فعال نیستند
   ========================================================= */

function secondNavMessage(type) {
    /* مسیرهای واقعی هدر دوم؛ این تابع برای سازگاری با کدهای قبلی باقی مانده است. */
    const routeMap = {
        school: 'school',
        history: 'distance-history',
        online: 'online-school',
        faq: 'faq'
    };

    const route = routeMap[type];
    if (route && views[route]) {
        navigateTo(route);
        return;
    }

    if (typeof showToast === 'function') {
        showToast('این بخش در دسترس نیست.');
    }
}

/* =========================================================
   باز و بسته شدن منوهای هدر دوم با کلیک
   ========================================================= */

(function () {

    const dropdowns =
        document.querySelectorAll(
            '.second-nav-dropdown'
        );

    if (!dropdowns.length) return;


    dropdowns.forEach(function (dropdown) {

        const button =
            dropdown.querySelector(
                '.second-nav-dropdown-btn'
            );

        if (!button) return;


        /* ---------------------------------------------
           کلیک روی دکمه
           --------------------------------------------- */

        button.addEventListener('click', function (event) {

            event.preventDefault();

            event.stopPropagation();


            const wasOpen =
                dropdown.classList.contains(
                    'menu-open'
                );


            /* اول همه منوها بسته شوند */
            dropdowns.forEach(function (item) {

                item.classList.remove(
                    'menu-open'
                );

            });


            /* اگر قبلاً بسته بود، بازش کن */
            if (!wasOpen) {

                dropdown.classList.add(
                    'menu-open'
                );

            }

        });


        /* ---------------------------------------------
           کلیک داخل خود منو
           منو را نبند
           --------------------------------------------- */

        const menus =
            dropdown.querySelectorAll(
                '.second-services-menu, .second-remote-menu'
            );


        menus.forEach(function (menu) {

            menu.addEventListener(
                'click',
                function (event) {

                    event.stopPropagation();

                }
            );

        });

    });


    /* ---------------------------------------------
       کلیک بیرون از منو = بستن
       --------------------------------------------- */

    document.addEventListener(
        'click',
        function (event) {

            const clickedInsideDropdown =
                event.target.closest(
                    '.second-nav-dropdown'
                );


            if (!clickedInsideDropdown) {

                dropdowns.forEach(function (dropdown) {

                    dropdown.classList.remove(
                        'menu-open'
                    );

                });

            }

        }
    );

})();
