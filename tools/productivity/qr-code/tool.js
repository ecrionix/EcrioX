/**
 * EcrioX QR Code Generator
 * Client-side QR matrix rendering with custom styling, sizes, and formats.
 */

(function () {
  'use strict';

  const typeTabs = document.querySelectorAll('.tab-qr-type');
  const formUrl = document.getElementById('formUrl');
  const formText = document.getElementById('formText');
  const formWifi = document.getElementById('formWifi');

  const txtUrl = document.getElementById('txtUrl');
  const txtFreeText = document.getElementById('txtFreeText');
  const txtWifiSsid = document.getElementById('txtWifiSsid');
  const txtWifiPass = document.getElementById('txtWifiPass');
  const selWifiType = document.getElementById('selWifiType');

  const colForeground = document.getElementById('colForeground');
  const colBackground = document.getElementById('colBackground');
  const selSize = document.getElementById('selSize');

  const canvas = document.getElementById('qrCanvas');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnCopyImage = document.getElementById('btnCopyImage');

  let activeType = 'url'; // 'url', 'text', 'wifi'

  function getPayload() {
    if (activeType === 'url') {
      return txtUrl.value.trim() || 'https://ecriox.com/';
    } else if (activeType === 'text') {
      return txtFreeText.value.trim() || 'EcrioX – One Platform. Endless Possibilities.';
    } else if (activeType === 'wifi') {
      const ssid = txtWifiSsid.value.trim();
      const pass = txtWifiPass.value;
      const type = selWifiType.value;
      if (!ssid) return 'WIFI:S:MyNetwork;;';
      return `WIFI:T:${type};S:${ssid};P:${pass};;`;
    }
    return 'https://ecriox.com/';
  }

  function renderQR() {
    const payload = getPayload();
    const fg = colForeground.value || '#000000';
    const bg = colBackground.value || '#ffffff';

    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
      QRCode.toCanvas(canvas, payload, {
        width: 280,
        margin: 2,
        color: {
          dark: fg,
          light: bg
        },
        errorCorrectionLevel: 'M'
      }, function (error) {
        if (error) console.error('QR Code render error:', error);
      });
    } else {
      // Fallback message on canvas if script blocked
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = fg;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading QR Engine...', canvas.width / 2, canvas.height / 2);
    }
  }

  // Switch content types
  typeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeType = tab.getAttribute('data-type');
      typeTabs.forEach(t => {
        t.className = t === tab ? 'btn btn-sm btn-primary tab-qr-type' : 'btn btn-sm btn-secondary tab-qr-type';
      });

      formUrl.style.display = activeType === 'url' ? 'block' : 'none';
      formText.style.display = activeType === 'text' ? 'block' : 'none';
      formWifi.style.display = activeType === 'wifi' ? 'block' : 'none';

      renderQR();
    });
  });

  // Inputs
  txtUrl.addEventListener('input', renderQR);
  txtFreeText.addEventListener('input', renderQR);
  txtWifiSsid.addEventListener('input', renderQR);
  txtWifiPass.addEventListener('input', renderQR);
  selWifiType.addEventListener('change', renderQR);
  colForeground.addEventListener('input', renderQR);
  colBackground.addEventListener('input', renderQR);

  // Download High-Resolution PNG
  btnDownloadPng.addEventListener('click', () => {
    const exportSize = parseInt(selSize.value, 10) || 512;
    const payload = getPayload();
    const fg = colForeground.value || '#000000';
    const bg = colBackground.value || '#ffffff';

    const exportCanvas = document.createElement('canvas');
    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
      QRCode.toCanvas(exportCanvas, payload, {
        width: exportSize,
        margin: 2,
        color: { dark: fg, light: bg },
        errorCorrectionLevel: 'H'
      }, function (err) {
        if (err) return;
        const link = document.createElement('a');
        link.download = `qrcode-${activeType}-${exportSize}px.png`;
        link.href = exportCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${link.download}`);
      });
    }
  });

  // Copy Image to Clipboard
  btnCopyImage.addEventListener('click', () => {
    canvas.toBlob(blob => {
      if (!blob) return;
      try {
        navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]).then(() => {
          if (window.EcrioXApp) EcrioXApp.showToast('QR Code image copied to clipboard!');
        }).catch(err => {
          if (window.EcrioXApp) EcrioXApp.showToast('Please right-click the image to copy', 'error');
        });
      } catch (e) {
        if (window.EcrioXApp) EcrioXApp.showToast('Right-click image to copy', 'error');
      }
    });
  });

  // Init after library load
  window.addEventListener('load', () => {
    setTimeout(renderQR, 100);
  });
})();
