(function () {
  // ۱. کلیدهای ذخیره‌سازی اختصاصی
  const KEY_MESSAGES = 'my_custom_chat_messages';
  const KEY_STATE = 'my_custom_chat_state';

  // ۲. بارگیری از حافظه مرورگر
  let messages = JSON.parse(localStorage.getItem(KEY_MESSAGES)) || [];
  let state = JSON.parse(localStorage.getItem(KEY_STATE)) || {
    step: 1,
    name: '',
    phone: '',
    messenger: '',
    messengerId: '',
    contactPref: ''
  };

  // گرفتن عناصر از صفحه یا پیدا کردن دایرکت آن‌ها
  const logsEl = document.getElementById('chat-logs');
  const controlsEl = document.getElementById('chat-controls');

  if (!logsEl || !controlsEl) {
    console.error('خطا: عناصر chat-logs یا chat-controls در صفحه پیدا نشدند.');
    return;
  }

  // ۳. تابع ذخیره و نمایش پیام
  function addMessage(sender, text) {
    messages.push({ sender, text });
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(messages));
    renderMessages();
  }

  function updateState(newState) {
    state = Object.assign({}, state, newState);
    localStorage.setItem(KEY_STATE, JSON.stringify(state));
  }

  // ۴. رندر کامل پیام‌ها از روی حافظه
  function renderMessages() {
    logsEl.innerHTML = '';
    messages.forEach(function (m) {
      const div = document.createElement('div');
      div.style.marginBottom = '6px';
      div.innerHTML = '<strong>' + m.sender + ':</strong> ' + m.text;
      logsEl.appendChild(div);
    });
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  // ۵. مدیریت فرم‌ها و ورودی‌ها
  function renderControls() {
    controlsEl.innerHTML = '';

    if (state.step === 1) {
      controlsEl.innerHTML = 
        '<input type="text" id="m-name" placeholder="نام و نام خانوادگی"><br>' +
        '<input type="tel" id="m-phone" placeholder="شماره تماس"><br>' +
        '<button id="btn-s1">تأیید</button>';

      document.getElementById('btn-s1').onclick = function () {
        const name = document.getElementById('m-name').value.trim();
        const phone = document.getElementById('m-phone').value.trim();
        if (!name || !phone) return alert('لطفاً همه فیلدها را پر کنید.');

        addMessage('شما', name + ' - ' + phone);
        updateState({ name: name, phone: phone, step: 2 });
        addMessage('مدیریت', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');
        renderControls();
      };
    } 
    else if (state.step === 2) {
      controlsEl.innerHTML = 
        '<button class="m-btn" data-v="بله">بله</button> ' +
        '<button class="m-btn" data-v="تلگرام">تلگرام</button> ' +
        '<button class="m-btn" data-v="شاد">شاد</button>';

      const btns = controlsEl.querySelectorAll('.m-btn');
      btns.forEach(function (btn) {
        btn.onclick = function () {
          const val = this.getAttribute('data-v');
          addMessage('شما', val);
          updateState({ messenger: val, step: 2.5 });
          addMessage('مدیریت', 'آیدی خود در ' + val + ' را وارد کنید:');
          renderControls();
        };
      });
    } 
    else if (state.step === 2.5) {
      controlsEl.innerHTML = 
        '<input type="text" id="m-id" placeholder="آیدی ' + state.messenger + '"><br>' +
        '<button id="btn-s2">تأیید آیدی</button>';

      document.getElementById('btn-s2').onclick = function () {
        const idVal = document.getElementById('m-id').value.trim();
        if (!idVal) return alert('لطفاً آیدی را وارد کنید.');

        addMessage('شما', idVal);
        updateState({ messengerId: idVal, step: 3 });
        addMessage('مدیریت', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');
        renderControls();
      };
    } 
    else if (state.step === 3) {
      controlsEl.innerHTML = 
        '<button class="p-btn" data-k="call" data-t="با شما تماس خواهیم گرفت">با شما تماس خواهیم گرفت</button><br>' +
        '<button class="p-btn" data-k="messenger" data-t="به شما در پیام‌رسان انتخاب شده پیام خواهیم داد">به شما در پیام‌رسان انتخاب شده پیام خواهیم داد</button><br>' +
        '<button class="p-btn" data-k="sms" data-t="به شما پیامک خواهیم داد">به شما پیامک خواهیم داد</button>';

      const pBtns = controlsEl.querySelectorAll('.p-btn');
      pBtns.forEach(function (btn) {
        btn.onclick = function () {
          const key = this.getAttribute('data-k');
          const text = this.getAttribute('data-t');

          addMessage('شما', text);
          updateState({ contactPref: key, step: 4 });

          let reply = '';
          if (key === 'messenger') {
            reply = 'مشاوران ما با شما در پیام‌رسان ' + state.messenger + ' (آیدی: ' + state.messengerId + ') در ارتباط خواهند بود.';
          } else if (key === 'call') {
            reply = 'مشاوران ما به زودی با شماره ' + state.phone + ' تماس خواهند گرفت.';
          } else if (key === 'sms') {
            reply = 'پیامک‌های مربوطه به شماره ' + state.phone + ' ارسال خواهد شد.';
          }

          addMessage('مدیریت', state.name + ' عزیز، اطلاعات شما ثبت شد. ' + reply);
          renderControls();
        };
      });
    } 
    else if (state.step === 4) {
      controlsEl.innerHTML = '<span>اطلاعات شما با موفقیت ثبت گردید.</span>';
    }
  }

  // ۶. شروع و بازیابی چت
  renderMessages();
  if (messages.length === 0) {
    addMessage('مدیریت', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
  }
  renderControls();
})();
