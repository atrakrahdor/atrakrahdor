// ذخیره اطلاعات کاربر
const userData = {
  name: '',
  phone: '',
  messenger: '',
  messengerId: '',
  contactPref: ''
};

const logs = document.getElementById('chat-logs');
const controls = document.getElementById('chat-controls');

// تابع کمکی برای افزودن پیام به چت
function addMessage(sender, text) {
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  logs.appendChild(msg);
}

// شروع چت
step1_GetUserInfo();

// مرحله ۱: دریافت نام و شماره تماس
function step1_GetUserInfo() {
  addMessage('سیستم', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
  
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
    
    addMessage('شما', `${name} - ${phone}`);
    step2_SelectMessenger();
  };
}

// مرحله ۲: انتخاب پیام‌رسان (بله، تلگرام، شاد)
function step2_SelectMessenger() {
  addMessage('سیستم', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');

  controls.innerHTML = `
    <button class="btn-m" data-name="بله">بله</button>
    <button class="btn-m" data-name="تلگرام">تلگرام</button>
    <button class="btn-m" data-name="شاد">شاد</button>
  `;

  const buttons = controls.querySelectorAll('.btn-m');
  buttons.forEach(btn => {
    btn.onclick = function() {
      userData.messenger = this.getAttribute('data-name');
      addMessage('شما', userData.messenger);
      step2_GetMessengerId();
    };
  });
}

// مرحله ۲ تکمیلی: دریافت آیدی پیام‌رسان
function step2_GetMessengerId() {
  addMessage('سیستم', `آیدی خود در ${userData.messenger} را وارد کنید:`);

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
    addMessage('شما', idVal);
    step3_SelectContactPref();
  };
}

// مرحله ۳: انتخاب نحوه ارتباط
function step3_SelectContactPref() {
  addMessage('سیستم', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');

  controls.innerHTML = `
    <button class="btn-pref" data-pref="call">با شما تماس خواهیم گرفت</button><br>
    <button class="btn-pref" data-pref="messenger">به شما در پیام‌رسان انتخاب شده پیام خواهیم داد</button><br>
    <button class="btn-pref" data-pref="sms">به شما پیامک خواهیم داد</button>
  `;

  const buttons = controls.querySelectorAll('.btn-pref');
  buttons.forEach(btn => {
    btn.onclick = function() {
      userData.contactPref = this.getAttribute('data-pref');
      addMessage('شما', this.innerText);
      finishProcess();
    };
  });
}

// مرحله نهایی: ارسال پیام و پاسخ به کاربر
function finishProcess() {
  controls.innerHTML = ''; // پاکسازی کنترل‌ها

  // ۱. ساخت پیام کامل اطلاعات برای ارسال به شما (در کنسول یا سرور)
  const fullReport = `
--- اطلاعات فرم جدید ---
نام: ${userData.name}
شماره: ${userData.phone}
پیام‌رسان: ${userData.messenger}
آیدی پیام‌رسان: ${userData.messengerId}
نحوه تماس: ${userData.contactPref}
  `;
  
  console.log(fullReport); // ارسال برای شما (می‌توانید به سرور یا تلگرام بفرستید)

  // ۲. نمایش پاسخ هوشمند به کاربر
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