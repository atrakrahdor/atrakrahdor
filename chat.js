// ==========================================
// ۱. مدیریت کلیدهای حافظه و آرایه‌ها
// ==========================================
const STORAGE_KEY_MESSAGES = 'chat_app_messages_v1';
const STORAGE_KEY_USERDATA = 'chat_app_userdata_v1';

// بارگیری مستقیم از مرورگر
let messagesList = JSON.parse(localStorage.getItem(STORAGE_KEY_MESSAGES)) || [];
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY_USERDATA)) || {
  step: 1,
  name: '',
  phone: '',
  messenger: '',
  messengerId: '',
  contactPref: ''
};

const logsContainer = document.getElementById('chat-logs');
const controlsContainer = document.getElementById('chat-controls');

// ==========================================
// ۲. تابع قطعی ذخیره و رندر پیام
// ==========================================
function pushMessage(sender, text) {
  // ۱. اضافه به آرایه
  messagesList.push({ sender, text });
  
  // ۲. ذخیره فوری در حافظه دستگاه
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messagesList));
  
  // ۳. نمایش در صفحه
  renderLogs();
}

function updateAppData(newData) {
  appData = { ...appData, ...newData };
  localStorage.setItem(STORAGE_KEY_USERDATA, JSON.stringify(appData));
}

// ==========================================
// ۳. رندر پیام‌ها بر اساس حافظه (حتی بعد رفرش)
// ==========================================
function renderLogs() {
  logsContainer.innerHTML = '';
  messagesList.forEach(item => {
    const el = document.createElement('div');
    el.style.marginBottom = '8px';
    el.innerHTML = `<strong>${item.sender}:</strong> ${item.text}`;
    logsContainer.appendChild(el);
  });
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

// ==========================================
// ۴. منطق مراحل فرم چت
// ==========================================
function startChatApp() {
  // نمایش پیام‌های گذشته
  renderLogs();

  // اگر بار اول است، پیام اولیه داده شود
  if (messagesList.length === 0) {
    pushMessage('مدیریت', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
  }

  // نمایش کنترل‌های ورودی بر اساس آخرین مرحله
  renderControlsForCurrentStep();
}

function renderControlsForCurrentStep() {
  controlsContainer.innerHTML = '';

  if (appData.step === 1) {
    controlsContainer.innerHTML = `
      <input type="text" id="inp-name" placeholder="نام و نام خانوادگی"><br>
      <input type="tel" id="inp-phone" placeholder="شماره تماس"><br>
      <button onclick="handleStep1()">تأیید</button>
    `;
  } 
  else if (appData.step === 2) {
    controlsContainer.innerHTML = `
      <button onclick="handleStep2('بله')">بله</button>
      <button onclick="handleStep2('تلگرام')">تلگرام</button>
      <button onclick="handleStep2('شاد')">شاد</button>
    `;
  } 
  else if (appData.step === 2.5) {
    controlsContainer.innerHTML = `
      <input type="text" id="inp-id" placeholder="آیدی ${appData.messenger}"><br>
      <button onclick="handleStep2Id()">تأیید آیدی</button>
    `;
  } 
  else if (appData.step === 3) {
    controlsContainer.innerHTML = `
      <button onclick="handleStep3('call', 'با شما تماس خواهیم گرفت')">با شما تماس خواهیم گرفت</button><br>
      <button onclick="handleStep3('messenger', 'به شما در پیام‌رسان انتخاب شده پیام خواهیم داد')">به شما در پیام‌رسان انتخاب شده پیام خواهیم داد</button><br>
      <button onclick="handleStep3('sms', 'به شما پیامک خواهیم داد')">به شما پیامک خواهیم داد</button>
    `;
  } 
  else if (appData.step === 4) {
    controlsContainer.innerHTML = '<em>فرم با موفقیت ثبت شد.</em>';
  }
}

// ==========================================
// ۵. اکشن‌های دکمه‌ها و فرم‌ها
// ==========================================
window.handleStep1 = function() {
  const name = document.getElementById('inp-name').value.trim();
  const phone = document.getElementById('inp-phone').value.trim();

  if (!name || !phone) {
    alert('لطفاً همه موارد را وارد کنید.');
    return;
  }

  // ذخیره پیام کاربر
  pushMessage('شما', `${name} - ${phone}`);
  
  // بروزرسانی دیتای کاربر و مرحله بعدی
  updateAppData({ name, phone, step: 2 });
  
  // پیام مدیریت
  pushMessage('مدیریت', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');
  
  renderControlsForCurrentStep();
};

window.handleStep2 = function(messengerName) {
  // ذخیره پیام کاربر
  pushMessage('شما', messengerName);

  updateAppData({ messenger: messengerName, step: 2.5 });

  // پیام مدیریت
  pushMessage('مدیریت', `آیدی خود در ${messengerName} را وارد کنید:`);

  renderControlsForCurrentStep();
};

window.handleStep2Id = function() {
  const messengerId = document.getElementById('inp-id').value.trim();
  if (!messengerId) {
    alert('لطفاً آیدی را وارد کنید.');
    return;
  }

  // ذخیره پیام کاربر
  pushMessage('شما', messengerId);

  updateAppData({ messengerId, step: 3 });

  // پیام مدیریت
  pushMessage('مدیریت', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');

  renderControlsForCurrentStep();
};

window.handleStep3 = function(prefKey, prefText) {
  // ذخیره پیام کاربر
  pushMessage('شما', prefText);

  updateAppData({ contactPref: prefKey, step: 4 });

  // ساخت پیام پاسخ مدیریت
  let reply = '';
  if (prefKey === 'messenger') {
    reply = `مشاوران ما با شما در پیام‌رسان ${appData.messenger} (آیدی: ${appData.messengerId}) در ارتباط خواهند بود.`;
  } else if (prefKey === 'call') {
    reply = `مشاوران ما به زودی با شماره ${appData.phone} تماس خواهند گرفت.`;
  } else if (prefKey === 'sms') {
    reply = `پیامک‌های مربوطه به شماره ${appData.phone} ارسال خواهد شد.`;
  }

  // پیام پاسخ نهایی مدیریت
  pushMessage('مدیریت', `${appData.name} عزیز، اطلاعات شما ثبت شد. ${reply}`);

  renderControlsForCurrentStep();
};

// اجرای اصلی
startChatApp();
