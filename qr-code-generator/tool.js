/**
 * EcrioX Custom QR Code Generator
 * Full-featured generator supporting 9 data types, custom colors, center logos, PNG and SVG export.
 */

(function () {
  'use strict';

  // DOM Elements
  const typeButtons = document.querySelectorAll('.qr-type-btn');
  const forms = {
    url: document.getElementById('formUrl'),
    text: document.getElementById('formText'),
    wifi: document.getElementById('formWifi'),
    whatsapp: document.getElementById('formWhatsapp'),
    vcard: document.getElementById('formVcard'),
    email: document.getElementById('formEmail'),
    phone: document.getElementById('formPhone'),
    sms: document.getElementById('formSms'),
    location: document.getElementById('formLocation')
  };

  // Specific Form Inputs
  const inputUrl = document.getElementById('inputUrl');
  const inputText = document.getElementById('inputText');
  const inputWifiSsid = document.getElementById('inputWifiSsid');
  const inputWifiPassword = document.getElementById('inputWifiPassword');
  const selWifiAuth = document.getElementById('selWifiAuth');
  const chkWifiHidden = document.getElementById('chkWifiHidden');
  const inputWaPhone = document.getElementById('inputWaPhone');
  const inputWaMsg = document.getElementById('inputWaMsg');
  const inputVcFirst = document.getElementById('inputVcFirst');
  const inputVcLast = document.getElementById('inputVcLast');
  const inputVcPhone = document.getElementById('inputVcPhone');
  const inputVcEmail = document.getElementById('inputVcEmail');
  const inputVcOrg = document.getElementById('inputVcOrg');
  const inputVcTitle = document.getElementById('inputVcTitle');
  const inputEmailTo = document.getElementById('inputEmailTo');
  const inputEmailSub = document.getElementById('inputEmailSub');
  const inputEmailBody = document.getElementById('inputEmailBody');
  const inputPhoneNum = document.getElementById('inputPhoneNum');
  const inputSmsNum = document.getElementById('inputSmsNum');
  const inputSmsBody = document.getElementById('inputSmsBody');
  const inputLocLat = document.getElementById('inputLocLat');
  const inputLocLng = document.getElementById('inputLocLng');

  // Customization
  const colForeground = document.getElementById('colForeground');
  const colBackground = document.getElementById('colBackground');
  const selCorrection = document.getElementById('selCorrection');
  const selSize = document.getElementById('selSize');
  const inputLogoFile = document.getElementById('inputLogoFile');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');

  // Preview & Actions
  const previewCanvas = document.getElementById('previewCanvas');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnDownloadSvg = document.getElementById('btnDownloadSvg');
  const btnCopyImage = document.getElementById('btnCopyImage');
  const btnResetAll = document.getElementById('btnResetAll');

  let activeType = 'url';
  let uploadedLogo = null;

  function cleanPhone(num) {
    return (num || '').replace(/[^0-9+]/g, '');
  }

  function getPayload() {
    switch (activeType) {
      case 'url': {
        let val = inputUrl.value.trim();
        if (!val) val = 'https://ecriox.com/';
        if (!/^https?:\/\//i.test(val)) val = 'https://' + val;
        return val;
      }
      case 'text': {
        return inputText.value.trim() || 'EcrioX – One Platform. Endless Possibilities.';
      }
      case 'wifi': {
        const ssid = (inputWifiSsid.value || '').trim() || 'EcrioX_Guest_WiFi';
        const pass = inputWifiPassword.value || '';
        const auth = selWifiAuth.value || 'WPA';
        const hidden = chkWifiHidden.checked ? 'true' : 'false';
        return `WIFI:T:${auth};S:${ssid};P:${pass};H:${hidden};;`;
      }
      case 'whatsapp': {
        const phone = cleanPhone(inputWaPhone.value) || '15551234567';
        const msg = inputWaMsg.value.trim();
        return msg ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/${phone}`;
      }
      case 'vcard': {
        const first = inputVcFirst.value.trim() || 'John';
        const last = inputVcLast.value.trim() || 'Doe';
        const phone = inputVcPhone.value.trim() || '+1-555-0199';
        const email = inputVcEmail.value.trim() || 'john.doe@example.com';
        const org = inputVcOrg.value.trim() || 'EcrioX';
        const title = inputVcTitle.value.trim() || 'Member';
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${last};${first};;;`,
          `FN:${first} ${last}`,
          `ORG:${org}`,
          `TITLE:${title}`,
          `TEL;TYPE=CELL:${phone}`,
          `EMAIL:${email}`,
          'URL:https://ecriox.com/',
          'END:VCARD'
        ].join('\n');
      }
      case 'email': {
        const to = inputEmailTo.value.trim() || 'contact@example.com';
        const sub = inputEmailSub.value.trim();
        const body = inputEmailBody.value.trim();
        let query = [];
        if (sub) query.push(`subject=${encodeURIComponent(sub)}`);
        if (body) query.push(`body=${encodeURIComponent(body)}`);
        return query.length ? `mailto:${to}?${query.join('&')}` : `mailto:${to}`;
      }
      case 'phone': {
        const num = cleanPhone(inputPhoneNum.value) || '+15552345678';
        return `tel:${num}`;
      }
      case 'sms': {
        const num = cleanPhone(inputSmsNum.value) || '+15551234567';
        const body = inputSmsBody.value.trim();
        return body ? `sms:${num}?body=${encodeURIComponent(body)}` : `sms:${num}`;
      }
      case 'location': {
        const lat = inputLocLat.value.trim() || '37.7749';
        const lng = inputLocLng.value.trim() || '-122.4194';
        return `https://www.google.com/maps?q=${lat},${lng}`;
      }
      default:
        return 'https://ecriox.com/';
    }
  }

  function getCorrectionLevel() {
    if (uploadedLogo) return 'H'; // Highest recovery for center logos
    return selCorrection.value || 'M';
  }

  function drawLogoOnCanvas(targetCanvas, callback) {
    if (!uploadedLogo) {
      if (callback) callback();
      return;
    }

    const ctx = targetCanvas.getContext('2d');
    const width = targetCanvas.width;
    const height = targetCanvas.height;

    // Logo size: 22% of QR width
    const logoSize = Math.floor(width * 0.22);
    const logoX = (width - logoSize) / 2;
    const logoY = (height - logoSize) / 2;

    // Draw background white card badge for logo
    const pad = Math.floor(logoSize * 0.12);
    ctx.fillStyle = colBackground.value || '#ffffff';
    ctx.fillRect(logoX - pad, logoY - pad, logoSize + (pad * 2), logoSize + (pad * 2));

    ctx.drawImage(uploadedLogo, logoX, logoY, logoSize, logoSize);
    if (callback) callback();
  }

  function renderQR() {
    const payload = getPayload();
    const fg = colForeground.value || '#000000';
    const bg = colBackground.value || '#ffffff';
    const correction = getCorrectionLevel();

    if (typeof QRCode === 'undefined' || !QRCode.toCanvas) {
      return;
    }

    QRCode.toCanvas(previewCanvas, payload, {
      width: 300,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: correction
    }, function (err) {
      if (err) {
        console.error('QR Render error:', err);
        return;
      }
      drawLogoOnCanvas(previewCanvas);
    });
  }

  // Type Switcher
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      activeType = btn.getAttribute('data-type');
      Object.keys(forms).forEach(key => {
        if (forms[key]) {
          forms[key].style.display = key === activeType ? 'block' : 'none';
        }
      });

      renderQR();
    });
  });

  // Attach live update listeners to all inputs
  const allInputs = document.querySelectorAll('.type-form input, .type-form textarea, .type-form select');
  allInputs.forEach(el => {
    el.addEventListener('input', renderQR);
    el.addEventListener('change', renderQR);
  });

  colForeground.addEventListener('input', renderQR);
  colBackground.addEventListener('input', renderQR);
  selCorrection.addEventListener('change', renderQR);

  // Logo file upload handler
  inputLogoFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        uploadedLogo = img;
        btnRemoveLogo.style.display = 'inline-block';
        selCorrection.value = 'H';
        renderQR();
        if (window.EcrioXApp) EcrioXApp.showToast('Logo attached with Level H error correction');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  btnRemoveLogo.addEventListener('click', () => {
    uploadedLogo = null;
    inputLogoFile.value = '';
    btnRemoveLogo.style.display = 'none';
    renderQR();
    if (window.EcrioXApp) EcrioXApp.showToast('Logo removed');
  });

  // Download PNG
  btnDownloadPng.addEventListener('click', () => {
    const exportSize = parseInt(selSize.value, 10) || 600;
    const payload = getPayload();
    const fg = colForeground.value || '#000000';
    const bg = colBackground.value || '#ffffff';
    const correction = getCorrectionLevel();

    const exportCanvas = document.createElement('canvas');
    QRCode.toCanvas(exportCanvas, payload, {
      width: exportSize,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: correction
    }, function (err) {
      if (err) return;
      drawLogoOnCanvas(exportCanvas, () => {
        const link = document.createElement('a');
        link.download = `qrcode-${activeType}-${exportSize}px.png`;
        link.href = exportCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${link.download}`);
      });
    });
  });

  // Download SVG
  btnDownloadSvg.addEventListener('click', () => {
    const payload = getPayload();
    const fg = colForeground.value || '#000000';
    const bg = colBackground.value || '#ffffff';
    const correction = getCorrectionLevel();

    if (QRCode.toString) {
      QRCode.toString(payload, {
        type: 'svg',
        margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: correction
      }, function (err, svgString) {
        if (err || !svgString) return;
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `qrcode-${activeType}.svg`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${link.download}`);
      });
    }
  });

  // Copy Image to Clipboard
  btnCopyImage.addEventListener('click', () => {
    previewCanvas.toBlob(blob => {
      if (!blob) return;
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          if (window.EcrioXApp) EcrioXApp.showToast('QR Code image copied to clipboard!');
        }).catch(() => {
          if (window.EcrioXApp) EcrioXApp.showToast('Please right-click the QR preview to copy', 'error');
        });
      } catch (e) {
        if (window.EcrioXApp) EcrioXApp.showToast('Right-click QR code to copy', 'error');
      }
    });
  });

  // Reset
  btnResetAll.addEventListener('click', () => {
    inputUrl.value = 'https://ecriox.com/';
    inputText.value = '';
    inputWifiSsid.value = '';
    inputWifiPassword.value = '';
    inputWaPhone.value = '';
    inputWaMsg.value = '';
    inputVcFirst.value = '';
    inputVcLast.value = '';
    inputVcPhone.value = '';
    inputVcEmail.value = '';
    inputEmailTo.value = '';
    inputPhoneNum.value = '';
    inputSmsNum.value = '';
    inputLocLat.value = '';
    inputLocLng.value = '';
    colForeground.value = '#000000';
    colBackground.value = '#ffffff';
    selCorrection.value = 'M';
    uploadedLogo = null;
    inputLogoFile.value = '';
    btnRemoveLogo.style.display = 'none';

    // Switch back to URL tab
    typeButtons[0].click();
    renderQR();
    if (window.EcrioXApp) EcrioXApp.showToast('Reset to default');
  });

  // Init
  window.addEventListener('load', () => {
    setTimeout(renderQR, 100);
  });
})();
