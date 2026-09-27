// ماژول فرم چت درون پوشه chat.js
const STORAGE_MSG = 'FORM_CHAT_MESSAGES_MODULAR';
const STORAGE_DATA = 'FORM_CHAT_USER_DATA_MODULAR';

let messages = JSON.parse(localStorage.getItem(STORAGE_MSG)) || [];
let userData = JSON.parse(localStorage.getItem(STORAGE_DATA)) || {
  step: 1,
  name: '',
  phone: '',
  messenger: '',
  messengerId: '',
  contactPref: ''
};

let logsEl = null;
let controlsEl = null;

function sendMsg(sender, text) {
  messages.push({ sender, text });
  localStorage.setItem(STORAGE_MSG, JSON.stringify(messages));
  renderMessages();
}

function saveData() {
  localStorage.setItem(STORAGE_DATA, JSON.stringify(userData));
}

function renderMessages() {
  if (!logsEl) return;
  logsEl.innerHTML = '';
  messages.forEach(m => {
    const div = document.createElement('div');
    div.className = `form-msg ${m.sender === 'شما' ? 'form-msg-user' : 'form-msg-system'}`;
    div.innerHTML = `<strong>${m.sender}:</strong> ${m.text}`;
    logsEl.appendChild(div);
  });
  logsEl.scrollTop = logsEl.scrollHeight;
}

function renderControls() {
  if (!controlsEl) return;
  controlsEl.innerHTML = '';

  if (userData.step === 1) {
    controlsEl.innerHTML = `
      <input type="text" id="fc-name" placeholder="نام و نام خانوادگی">
      <input type="tel" id="fc-phone" placeholder="شماره تماس">
      <button id="fc-btn1">تأیید و ادامه</button>
    `;

    document.getElementById('fc-btn1').onclick = () => {
      const n = document.getElementById('fc-name').value.trim();
      const p = document.getElementById('fc-phone').value.trim();
      if (!n || !p) return alert('لطفاً نام و شماره تماس را وارد کنید.');

      userData.name = n;
      userData.phone = p;
      userData.step = 2;
      saveData();

      sendMsg('شما', `${n} - ${p}`);
      sendMsg('سیستم', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');
      renderControls();
    };
  } 
  else if (userData.step === 2) {
    controlsEl.innerHTML = `
      <button class="fc-mbtn" data-m="بله">بله</button>
      <button class="fc-mbtn" data-m="تلگرام">تلگرام</button>
      <button class="fc-mbtn" data-m="شاد">شاد</button>
    `;

    controlsEl.querySelectorAll('.fc-mbtn').forEach(btn => {
      btn.onclick = function () {
        const m = this.getAttribute('data-m');
        userData.messenger = m;
        userData.step = 2.5;
        saveData();

        sendMsg('شما', m);
        sendMsg('سیستم', `آیدی خود در ${m} را وارد کنید:`);
        renderControls();
      };
    });
  } 
  else if (userData.step === 2.5) {
    controlsEl.innerHTML = `
      <input type="text" id="fc-id" placeholder="آیدی ${userData.messenger}">
      <button id="fc-btn2">ثبت آیدی</button>
    `;

    document.getElementById('fc-btn2').onclick = () => {
      const idVal = document.getElementById('fc-id').value.trim();
      if (!idVal) return alert('لطفاً آیدی را وارد کنید.');

      userData.messengerId = idVal;
      userData.step = 3;
      saveData();

      sendMsg('شما', idVal);
      sendMsg('سیستم', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');
      renderControls();
    };
  } 
  else if (userData.step === 3) {
    controlsEl.innerHTML = `
      <button class="fc-pbtn" data-k="call" data-t="با شما تماس خواهیم گرفت">با شما تماس خواهیم گرفت</button>
      <button class="fc-pbtn" data-k="messenger" data-t="به شما در پیام‌رسان انتخاب شده پیام خواهیم داد">به شما در پیام‌رسان انتخاب شده پیام خواهیم داد</button>
      <button class="fc-pbtn" data-k="sms" data-t="به شما پیامک خواهیم داد">به شما پیامک خواهیم داد</button>
    `;

    controlsEl.querySelectorAll('.fc-pbtn').forEach(btn => {
      btn.onclick = function () {
        const key = this.getAttribute('data-k');
        const txt = this.getAttribute('data-t');

        userData.contactPref = key;
        userData.step = 4;
        saveData();

        sendMsg('شما', txt);

        let reply = '';
        if (key === 'messenger') {
          reply = `مشاوران ما با شما در پیام‌رسان ${userData.messenger} (آیدی: ${userData.messengerId}) در ارتباط خواهند بود.`;
        } else if (key === 'call') {
          reply = `مشاوران ما به زودی با شماره ${userData.phone} تماس خواهند گرفت.`;
        } else if (key === 'sms') {
          reply = `پیامک‌های مربوطه به شماره ${userData.phone} ارسال خواهد شد.`;
        }

        sendMsg('سیستم', `${userData.name} عزیز، اطلاعات شما ثبت شد. ${reply}`);
        renderControls();
      };
    });
  } 
  else if (userData.step === 4) {
    controlsEl.innerHTML = '<div style="text-align:center; color:#28a745; font-size:12px; padding:5px;">اطلاعات شما با موفقیت ثبت گردید.</div>';
  }
}

export function initFormChat(logsContainerId = 'form-chat-logs', controlsContainerId = 'form-chat-controls') {
  logsEl = document.getElementById(logsContainerId);
  controlsEl = document.getElementById(controlsContainerId);

  if (!logsEl || !controlsEl) return;

  renderMessages();

  if (messages.length === 0) {
    sendMsg('سیستم', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
  }

  renderControls();
}
