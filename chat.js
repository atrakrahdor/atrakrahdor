// ۱. بازیابی داده‌ها یا ایجاد ساختار اولیه
const userData = JSON.parse(localStorage.getItem('chat_user_data')) || {
  name: '',
  phone: '',
  messenger: '',
  messengerId: '',
  contactPref: '',
  step: 1
};

// دریافت تاریخچه پیام‌ها از حافظه
let chatHistory = JSON.parse(localStorage.getItem('chat_history')) || [];

const logs = document.getElementById('chat-logs');
const controls = document.getElementById('chat-controls');

// تابع افزودن و ذخیره پیام
function addMessage(sender, text) {
  // رندر پیام در صفحه
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  logs.appendChild(msg);

  // ذخیره در تاریخچه
  chatHistory.push({ sender, text });
  localStorage.setItem('chat_history', JSON.stringify(chatHistory));
}

// تابع ذخیره وضعیت کاربر
function saveUserData() {
  localStorage.setItem('chat_user_data', JSON.stringify(userData));
}

// بازیابی و نمایش پیام‌های قبلی هنگام رفرش
function loadHistory() {
  logs.innerHTML = '';
  chatHistory.forEach(item => {
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${item.sender}:</strong> ${item.text}`;
    logs.appendChild(msg);
  });
}

// شروع و کنترل مراحل چت
function initChat() {
  loadHistory();

  // اگر پیامی از قبل ثبت نشده، پیام اول شروع شود
  if (chatHistory.length === 0) {
    step1_GetUserInfo();
  } else {
    // بازگرداندن کنترل‌ها بر اساس آخرین مرحله کاربر
    restoreLastStep();
  }
}

// مرحله ۱: دریافت نام و تماس
function step1_GetUserInfo() {
  userData.step = 1;
  saveUserData();
  
  addMessage('سیستم', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
  renderStep1Controls();
}

function renderStep1Controls() {
  controls.innerHTML = `
    <input type="text" id="input-name" placeholder="نام و نام خانوادگی"><br>
    <input type="tel" id="input-phone" placeholder="شماره تماس"><br>
    <button id="btn-step1">تأیید</button>
  `;

  document.getElementById('btn-step1').onclick = function() {
    const name = document.getElementById('input-name').value.trim();
    const phone = document.getElementById('input-phone').value.trim();

    if (!name || !phone) {
      alert('لطفاً همه موارد را پر کنید.');
      return;
    }

    userData.name = name;
    userData.phone = phone;
    saveUserData();

    addMessage('شما', `${name} - ${phone}`);
    step2_SelectMessenger();
  };
}

// مرحله ۲: انتخاب پیام‌رسان
function step2_SelectMessenger() {
  userData.step = 2;
  saveUserData();

  addMessage('سیستم', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');
  renderStep2Controls();
}

function renderStep2Controls() {
  controls.innerHTML = `
    <button class="btn-m" data-name="بله">بله</button>
    <button class="btn-m" data-name="تلگرام">تلگرام</button>
    <button class="btn-m" data-name="شاد">شاد</button>
  `;

  controls.querySelectorAll('.btn-m').forEach(btn => {
    btn.onclick = function() {
      userData.messenger = this.getAttribute('data-name');
      saveUserData();

      addMessage('شما', userData.messenger);
      step2_GetMessengerId();
    };
  });
}

// مرحله ۲ تکمیلی: آیدی پیام‌رسان
function step2_GetMessengerId() {
  userData.step = 2.5;
  saveUserData();

  addMessage('سیستم', `آیدی خود در ${userData.messenger} را وارد کنید:`);
  renderMessengerIdControls();
}

function renderMessengerIdControls() {
  controls.innerHTML = `
    <input type="text" id="input-id" placeholder="آیدی ${userData.messenger}"><br>
    <button id="btn-step2-id">تأیید آیدی</button>
  `;

  document.getElementById('btn-step2-id').onclick = function() {
    const idVal = document.getElementById('input-id').value.trim();
    if (!idVal) {
      alert('لطفاً آیدی را وارد کنید.');
      return;
    }

    userData.messengerId = idVal;
    saveUserData();

    addMessage('شما', idVal);
    step3_SelectContactPref();
  };
}

// مرحله ۳: نحوه ارتباط
function step3_SelectContactPref() {
  userData.step = 3;
  saveUserData();

  addMessage('سیستم', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');
  renderStep3Controls();
}

function renderStep3Controls() {
  controls.innerHTML = `
    <button class="btn-pref" data-pref="call">با شما تماس خواهیم گرفت</button><br>
    <button class="btn-pref" data-pref="messenger">به شما در پیام‌رسان انتخاب شده پیام خواهیم داد</button><br>
    <button class="btn-pref" data-pref="sms">به شما پیامک خواهیم داد</button>
  `;

  controls.querySelectorAll('.btn-pref').forEach(btn => {
    btn.onclick = function() {
      userData.contactPref = this.getAttribute('data-pref');
      saveUserData();

      addMessage('شما', this.innerText);
      finishProcess();
    };
  });
}

// پایان فرایند
function finishProcess() {
  userData.step = 4;
  saveUserData();
  controls.innerHTML = '';

  let replyText = '';
  if (userData.contactPref === 'messenger') {
    replyText = `مشاوران ما با شما در پیام‌رسان ${userData.messenger} در ارتباط خواهند بود.`;
  } else if (userData.contactPref === 'call') {
    replyText = `مشاوران ما به زودی با شماره ${userData.phone} تماس خواهند گرفت.`;
  } else if (userData.contactPref === 'sms') {
    replyText = `پیامک‌های مربوطه به شماره ${userData.phone} ارسال خواهد شد.`;
  }

  addMessage('سیستم', `${userData.name} عزیز، اطلاعات شما ثبت شد. ${replyText}`);
}

// بازیابی فرم در صورت رفرش وسط کار
function restoreLastStep() {
  if (userData.step === 1) renderStep1Controls();
  else if (userData.step === 2) renderStep2Controls();
  else if (userData.step === 2.5) renderMessengerIdControls();
  else if (userData.step === 3) renderStep3Controls();
  else controls.innerHTML = '';
}

// اجرا در زمان بارگذاری صفحه
initChat();
