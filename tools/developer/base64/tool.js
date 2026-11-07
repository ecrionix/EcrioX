/**
 * EcrioX Base64 Encoder & Decoder
 * Client-side UTF-8 and URL-safe Base64 processing engine.
 */

(function () {
  'use strict';

  // DOM Elements
  const btnModeEncode = document.getElementById('btnModeEncode');
  const btnModeDecode = document.getElementById('btnModeDecode');
  const chkUrlSafe = document.getElementById('chkUrlSafe');
  const btnSample = document.getElementById('btnSample');
  const btnClear = document.getElementById('btnClear');
  const btnConvert = document.getElementById('btnConvert');
  const btnPasteInput = document.getElementById('btnPasteInput');
  const btnCopy = document.getElementById('btnCopy');
  const btnDownload = document.getElementById('btnDownload');
  const txtInput = document.getElementById('txtInput');
  const txtOutput = document.getElementById('txtOutput');
  const lblInputTitle = document.getElementById('lblInputTitle');
  const lblOutputTitle = document.getElementById('lblOutputTitle');
  const statInputChars = document.getElementById('statInputChars');
  const statInputBytes = document.getElementById('statInputBytes');
  const statOutputChars = document.getElementById('statOutputChars');
  const statOutputBytes = document.getElementById('statOutputBytes');

  let mode = 'encode'; // 'encode' or 'decode'

  // UTF-8 Helpers
  function utf8ToBase64(str) {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      // Fallback
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    }
  }

  function base64ToUtf8(str) {
    try {
      const binary = atob(str);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      // Fallback
      return decodeURIComponent(
        Array.prototype.map.call(atob(str), function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
    }
  }

  function toUrlSafe(b64) {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromUrlSafe(b64) {
    let str = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return str;
  }

  function getByteLength(str) {
    return new Blob([str]).size;
  }

  function updateMetrics() {
    const inVal = txtInput.value;
    const inChars = inVal.length;
    const inBytes = getByteLength(inVal);
    statInputChars.textContent = `${inChars.toLocaleString()} character${inChars === 1 ? '' : 's'}`;
    statInputBytes.textContent = `${inBytes.toLocaleString()} byte${inBytes === 1 ? '' : 's'}`;

    const outVal = txtOutput.value;
    const outChars = outVal.length;
    const outBytes = getByteLength(outVal);
    statOutputChars.textContent = `${outChars.toLocaleString()} character${outChars === 1 ? '' : 's'}`;
    statOutputBytes.textContent = `${outBytes.toLocaleString()} byte${outBytes === 1 ? '' : 's'}`;
  }

  function process() {
    const input = txtInput.value;
    const isUrlSafe = chkUrlSafe.checked;

    if (!input) {
      txtOutput.value = '';
      updateMetrics();
      return;
    }

    try {
      if (mode === 'encode') {
        let b64 = utf8ToBase64(input);
        if (isUrlSafe) {
          b64 = toUrlSafe(b64);
        }
        txtOutput.value = b64;
      } else {
        // Decode
        let cleanInput = input.trim();
        if (isUrlSafe || cleanInput.includes('-') || cleanInput.includes('_')) {
          cleanInput = fromUrlSafe(cleanInput);
        }
        // Remove spaces and newlines if user pasted formatted block
        cleanInput = cleanInput.replace(/\s+/g, '');
        const decoded = base64ToUtf8(cleanInput);
        txtOutput.value = decoded;
      }
    } catch (err) {
      txtOutput.value = `Error: Invalid input for ${mode === 'encode' ? 'encoding' : 'decoding'}.\nDetails: ${err.message}`;
    }

    updateMetrics();
  }

  function setMode(newMode) {
    mode = newMode;
    if (mode === 'encode') {
      btnModeEncode.classList.add('active');
      btnModeDecode.classList.remove('active');
      lblInputTitle.textContent = 'Input Text (UTF-8)';
      lblOutputTitle.textContent = 'Base64 Output';
      txtInput.placeholder = 'Type or paste plain text here...';
      txtOutput.placeholder = 'Base64 result will appear here...';
    } else {
      btnModeDecode.classList.add('active');
      btnModeEncode.classList.remove('active');
      lblInputTitle.textContent = 'Input Base64 String';
      lblOutputTitle.textContent = 'Decoded Text (UTF-8)';
      txtInput.placeholder = 'Paste Base64 string here...';
      txtOutput.placeholder = 'Decoded plain text will appear here...';
    }
    process();
  }

  // Event Listeners
  btnModeEncode.addEventListener('click', () => setMode('encode'));
  btnModeDecode.addEventListener('click', () => setMode('decode'));
  chkUrlSafe.addEventListener('change', process);
  txtInput.addEventListener('input', process);
  btnConvert.addEventListener('click', process);

  btnClear.addEventListener('click', () => {
    txtInput.value = '';
    txtOutput.value = '';
    updateMetrics();
    txtInput.focus();
  });

  btnSample.addEventListener('click', () => {
    if (mode === 'encode') {
      txtInput.value = 'Hello EcrioX! 🚀 One Platform. Endless Possibilities. (UTF-8 test: café, München, 日本語)';
    } else {
      txtInput.value = 'SGVsbG8gRWNyaW9YISDwn5qAIE9uZSBQbGF0Zm9ybS4gRW5kbGVzcyBQb3NzaWJpbGl0aWVzLiAoVVRGLTggdGVzdDogY2Fmw6ksIE3DvG5jaGVuLCDml6XmnKzoqZ4p';
    }
    process();
  });

  btnPasteInput.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      txtInput.value = text;
      process();
      if (window.EcrioXApp) EcrioXApp.showToast('Pasted from clipboard');
    } catch (e) {
      if (window.EcrioXApp) EcrioXApp.showToast('Please press Ctrl+V to paste', 'error');
    }
  });

  btnCopy.addEventListener('click', () => {
    if (!txtOutput.value) {
      if (window.EcrioXApp) EcrioXApp.showToast('Nothing to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(txtOutput.value).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Copied result to clipboard!');
    }).catch(() => {
      txtOutput.select();
      document.execCommand('copy');
      if (window.EcrioXApp) EcrioXApp.showToast('Copied result to clipboard!');
    });
  });

  btnDownload.addEventListener('click', () => {
    const content = txtOutput.value;
    if (!content) {
      if (window.EcrioXApp) EcrioXApp.showToast('No output to download', 'error');
      return;
    }
    const filename = mode === 'encode' ? 'base64-encoded.txt' : 'base64-decoded.txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${filename}`);
  });

  // Init
  updateMetrics();
})();
