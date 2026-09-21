 document.getElementById('deleteIconButton').addEventListener('click', function() {

    if (typeof targetIconSvgElement !== 'undefined' &&
        targetIconSvgElement !== null) {

        // فقط مخفی کردن آیکون
        targetIconSvgElement.style.display = 'none';

        // ثبت اینکه این آیکون مخفی شده است
        targetIconSvgElement.setAttribute(
            'data-icon-hidden',
            'true'
        );

        // ذخیره وضعیت
        saveIconState(targetIconSvgElement);
        saveAllEdits(false);

        // بستن پنجره
        if (typeof closeModal === 'function') {
            closeModal('iconPickerModal');
        }

        targetIconSvgElement = null;

        console.log("آیکون مخفی شد و ذخیره شد.");

    } else {

        alert("لطفاً ابتدا روی یک آیکون کلیک کنید.");

    }
});
 window.addEventListener('load', function() {
       loadSavedEdits();
   });