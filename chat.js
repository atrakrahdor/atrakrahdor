// ۱. ساختار ذخیره‌سازی جامع
const CHAT_STORAGE_KEY = 'my_chat_history_data';
const USER_DATA_KEY = 'my_chat_user_info';

let chatHistory = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || [];
let userData = JSON.parse(localStorage.getItem(USER_DATA_KEY)) || {
  name: '',
  phone: '',
  messenger: '',
  messengerId: '',
  contactPref: '',
  step: 1
};

const logs = document.getElementById('chat-logs');
const controls = document.getElementById('chat-controls');

// ۲. تابع اصلی ثبت و نمایش تمام پیام‌ها (مدیریت + کاربر)
function saveAndRenderMessage(sender, text) {
  // اضافه به آرایه اصلی
  chatHistory.push({ sender, text, time: new Date().getTime() });
  
  // ذخیره لحظه‌ای در حافظه مرورگر
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatHistory));

  // رندر در صفحه
  renderSingleMessage(sender, text);
}

function renderSingleMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `msg-item msg-${sender === 'شما' ? 'user' : 'admin'}`;
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  logs.appendChild(msg);
  logs.scrollTop = logs.scrollHeight;
}

// ۳. بازیابی کامل همه پیام‌ها هنگام رفرش
function loadAllHistory() {
  logs.innerHTML = '';
  chatHistory.forEach(item => {
    renderSingleMessage(item.sender, item.text);
  });
}

function saveUserData() {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// ۴. مدیریت مراحل فرم چت
function initChat() {
  loadAllHistory();

  if (chatHistory.length === 0) {
    step1_GetUserInfo();
  } else {
    restoreStepControls();
  }
}

function step1_GetUserInfo() {
  userData.step = 1;
  saveUserData();
  
  saveAndRenderMessage('مدیریت', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
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
      alert('لطفاً تمامی موارد را پر کنید.');
      return;
    }

    userData.name = name;
    userData.phone = phone;
    saveUserData();

    // ذخیره پیام کاربر
    saveAndRenderMessage('شما', `${name} - ${phone}`);
    step2_SelectMessenger();
  };
}

function step2_SelectMessenger() {
  userData.step = 2;
  saveUserData();

  saveAndRenderMessage('مدیریت', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');
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
      const selectedMessenger = this.getAttribute('data-name');
      userData.messenger = selectedMessenger;
      saveUserData();

      // ذخیره پیام کاربر
      saveAndRenderMessage('شما', selectedMessenger);
      step2_GetMessengerId();
    };
  });
}

function step2_GetMessengerId() {
  userData.step = 2.5;
  saveUserData();

  saveAndRenderMessage('مدیریت', `آیدی خود در ${userData.messenger} را وارد کنید:`);
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

    // ذخیره پیام کاربر
    saveAndRenderMessage('شما', idVal);
    step3_SelectContactPref();
  };
}

function step3_SelectContactPref() {
  userData.step = 3;
  saveUserData();

  saveAndRenderMessage('مدیریت', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');
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
      const prefText = this.innerText;
      userData.contactPref = this.getAttribute('data-pref');
      saveUserData();

      // ذخیره پیام کاربر
      saveAndRenderMessage('شما', prefText);
      finishProcess();
    };
  });
}

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

  saveAndRenderMessage('مدیریت', `${userData.name} عزیز، اطلاعات شما ثبت شد. ${replyText}`);
}

function restoreStepControls() {
  if (userData.step === 1) renderStep1Controls();
  else if (userData.step === 2) renderStep2Controls();
  else if (userData.step === 2.5) renderMessengerIdControls();
  else if (userData.step === 3) renderStep3Controls();
  else controls.innerHTML = '';
}

// شروع برنامه
initChat();
