/**
 * EcrioX Cryptographic Hash Generator
 * Real-time hardware-accelerated Web Crypto API hashing.
 */

(function () {
  'use strict';

  const txtInput = document.getElementById('txtHashInput');
  const btnSample = document.getElementById('btnHashSample');
  const btnClear = document.getElementById('btnHashClear');
  const statInputInfo = document.getElementById('statInputInfo');

  const outSha256 = document.getElementById('outSha256');
  const outSha512 = document.getElementById('outSha512');
  const outSha384 = document.getElementById('outSha384');
  const outSha1 = document.getElementById('outSha1');

  const casingRadios = document.querySelectorAll('input[name="hashCasing"]');
  const copyButtons = document.querySelectorAll('.btn-copy-hash');

  async function computeHash(algo, buffer) {
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getCasing() {
    const checked = document.querySelector('input[name="hashCasing"]:checked');
    return checked ? checked.value : 'lower';
  }

  async function calculate() {
    const text = txtInput.value;
    const casing = getCasing();

    // Stats
    const charCount = text.length;
    const byteCount = new Blob([text]).size;
    statInputInfo.textContent = `${charCount.toLocaleString()} character${charCount === 1 ? '' : 's'} | ${byteCount.toLocaleString()} byte${byteCount === 1 ? '' : 's'}`;

    if (!text) {
      outSha256.value = '';
      outSha512.value = '';
      outSha384.value = '';
      outSha1.value = '';
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const [sha256, sha512, sha384, sha1] = await Promise.all([
        computeHash('SHA-256', data),
        computeHash('SHA-512', data),
        computeHash('SHA-384', data),
        computeHash('SHA-1', data)
      ]);

      const format = str => casing === 'upper' ? str.toUpperCase() : str.toLowerCase();

      outSha256.value = format(sha256);
      outSha512.value = format(sha512);
      outSha384.value = format(sha384);
      outSha1.value = format(sha1);
    } catch (err) {
      console.error('Hashing error:', err);
      if (window.EcrioXApp) {
        EcrioXApp.showToast('Error computing hash: ' + err.message, 'error');
      }
    }
  }

  // Event Listeners
  txtInput.addEventListener('input', calculate);

  casingRadios.forEach(radio => {
    radio.addEventListener('change', calculate);
  });

  btnSample.addEventListener('click', () => {
    txtInput.value = 'EcrioX – One Platform. Endless Possibilities.';
    calculate();
  });

  btnClear.addEventListener('click', () => {
    txtInput.value = '';
    calculate();
    txtInput.focus();
  });

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (!targetInput || !targetInput.value) {
        if (window.EcrioXApp) EcrioXApp.showToast('No hash to copy', 'error');
        return;
      }

      navigator.clipboard.writeText(targetInput.value).then(() => {
        if (window.EcrioXApp) EcrioXApp.showToast('Hash copied to clipboard!');
      }).catch(() => {
        targetInput.select();
        document.execCommand('copy');
        if (window.EcrioXApp) EcrioXApp.showToast('Hash copied to clipboard!');
      });
    });
  });

  // Calculate empty initially
  calculate();
})();
