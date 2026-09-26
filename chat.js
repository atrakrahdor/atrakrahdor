(function () {
  // ۱. کلیدهای حافظه مرورگر
  const STORAGE_MSG = 'FINAL_CHAT_MESSAGES_LIST';
  const STORAGE_DATA = 'FINAL_CHAT_USER_DATA';

  // ۲. دریافت پیام‌ها و اطلاعات از حافظه
  let chatMessages = JSON.parse(localStorage.getItem(STORAGE_MSG)) || [];
  let userData = JSON.parse(localStorage.getItem(STORAGE_DATA)) || {
    step: 1,
    name: '',
    phone: '',
    messenger: '',
    messengerId: '',
    contactPref: ''
  };

  const logsEl = document.getElementById('chat-logs');
  const controlsEl = document.getElementById('chat-controls');

  if (!logsEl || !controlsEl) return;

  // ۳. تابع اصلی ثبت پیام (بدون هیچ شرطی مستقیم میره تو حافظه)
  function sendMsg(sender, text) {
    chatMessages.push({ sender: sender, text: text });
    localStorage.setItem(STORAGE_MSG, JSON.stringify(chatMessages));
    drawMessages();
  }

  function saveData() {
    localStorage.setItem(STORAGE_DATA, JSON.stringify(userData));
  }

  // ۴. چاپ کامل تمام پیام‌های موجود در حافظه
  function drawMessages() {
    logsEl.innerHTML = '';
    chatMessages.forEach(function (m) {
      const div = document.createElement('div');
      div.style.marginBottom = '8px';
      div.innerHTML = '<strong>' + m.sender + ':</strong> ' + m.text;
      logsEl.appendChild(div);
    });
    logsEl.scrollTop = logsEl.scrollHeight;
  }

  // ۵. مدیریت دکمه‌ها و ورودی‌ها
  function renderStepControls() {
    controlsEl.innerHTML = '';

    // مرحله ۱: نام و شماره
    if (userData.step === 1) {
      controlsEl.innerHTML = 
        '<input type="text" id="f-name" placeholder="نام و نام خانوادگی"><br>' +
        '<input type="tel" id="f-phone" placeholder="شماره تماس"><br>' +
        '<button id="btn-1">تأیید</button>';

      document.getElementById('btn-1').onclick = function () {
        const n = document.getElementById('f-name').value.trim();
        const p = document.getElementById('f-phone').value.trim();
        if (!n || !p) return alert('لطفاً اطلاعات را کامل وارد کنید.');

        userData.name = n;
        userData.phone = p;
        userData.step = 2;
        saveData();

        sendMsg('شما', n + ' - ' + p);
        sendMsg('مدیریت', 'پیام‌رسان مورد نظر خود را انتخاب کنید:');
        renderStepControls();
      };
    } 
    // مرحله ۲: انتخاب پیام‌رسان
    else if (userData.step === 2) {
      controlsEl.innerHTML = 
        '<button class="m-select" data-m="بله">بله</button> ' +
        '<button class="m-select" data-m="تلگرام">تلگرام</button> ' +
        '<button class="m-select" data-m="شاد">شاد</button>';

      const btns = controlsEl.querySelectorAll('.m-select');
      btns.forEach(function (b) {
        b.onclick = function () {
          const selectedM = this.getAttribute('data-m');
          userData.messenger = selectedM;
          userData.step = 2.5;
          saveData();

          sendMsg('شما', selectedM);
          sendMsg('مدیریت', 'آیدی خود در ' + selectedM + ' را وارد کنید:');
          renderStepControls();
        };
      });
    } 
    // مرحله ۲.۵: گرفتن آیدی
    else if (userData.step === 2.5) {
      controlsEl.innerHTML = 
        '<input type="text" id="f-id" placeholder="آیدی ' + userData.messenger + '"><br>' +
        '<button id="btn-2">تأیید آیدی</button>';

      document.getElementById('btn-2').onclick = function () {
        const idVal = document.getElementById('f-id').value.trim();
        if (!idVal) return alert('لطفاً آیدی را وارد کنید.');

        userData.messengerId = idVal;
        userData.step = 3;
        saveData();

        sendMsg('شما', idVal);
        sendMsg('مدیریت', 'ترجیح می‌دهید چگونه با شما در ارتباط باشیم؟');
        renderStepControls();
      };
    } 
    // مرحله ۳: نحوه ارتباط
    else if (userData.step === 3) {
      controlsEl.innerHTML = 
        '<button class="p-select" data-k="call" data-t="با شما تماس خواهیم گرفت">با شما تماس خواهیم گرفت</button><br>' +
        '<button class="p-select" data-k="messenger" data-t="به شما در پیام‌رسان انتخاب شده پیام خواهیم داد">به شما در پیام‌رسان انتخاب شده پیام خواهیم داد</button><br>' +
        '<button class="p-select" data-k="sms" data-t="به شما پیامک خواهیم داد">به شما پیامک خواهیم داد</button>';

      const pBtns = controlsEl.querySelectorAll('.p-select');
      pBtns.forEach(function (b) {
        b.onclick = function () {
          const key = this.getAttribute('data-k');
          const txt = this.getAttribute('data-t');

          userData.contactPref = key;
          userData.step = 4;
          saveData();

          sendMsg('شما', txt);

          let reply = '';
          if (key === 'messenger') {
            reply = 'مشاوران ما با شما در پیام‌رسان ' + userData.messenger + ' (آیدی: ' + userData.messengerId + ') در ارتباط خواهند بود.';
          } else if (key === 'call') {
            reply = 'مشاوران ما به زودی با شماره ' + userData.phone + ' تماس خواهند گرفت.';
          } else if (key === 'sms') {
            reply = 'پیامک‌های مربوطه به شماره ' + userData.phone + ' ارسال خواهد شد.';
          }

          sendMsg('مدیریت', userData.name + ' عزیز، اطلاعات شما ثبت شد. ' + reply);
          renderStepControls();
        };
      });
    } 
    // مرحله پایان
    else if (userData.step === 4) {
      controlsEl.innerHTML = '<span>اطلاعات شما با موفقیت ثبت شد.</span>';
    }
  }

  // اجرای اولیه هنگام لود یا رفرش صفحه
  drawMessages();

  if (chatMessages.length === 0) {
    sendMsg('مدیریت', 'لطفاً نام، نام خانوادگی و شماره تماس خود را وارد کنید:');
  }

  renderStepControls();
})();
