/**
 * EcrioX UUID / GUID Generator
 * Cryptographically random RFC 4122 v4 UUID generator.
 */

(function () {
  'use strict';

  const numQuantity = document.getElementById('numQuantity');
  const chkHyphens = document.getElementById('chkHyphens');
  const chkBraces = document.getElementById('chkBraces');
  const btnGenerate = document.getElementById('btnGenerate');
  const btnCopyAll = document.getElementById('btnCopyAll');
  const btnDownload = document.getElementById('btnDownload');
  const uuidContainer = document.getElementById('uuidContainer');
  const caseRadios = document.querySelectorAll('input[name="optCase"]');

  let currentUUIDs = [];

  function generateV4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback RFC 4122 v4
    const rnd = new Uint8Array(16);
    crypto.getRandomValues(rnd);
    rnd[6] = (rnd[6] & 0x0f) | 0x40; // Version 4
    rnd[8] = (rnd[8] & 0x3f) | 0x80; // Variant 10xx
    const hex = Array.from(rnd, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function formatUUID(raw, isUpper, hasHyphens, hasBraces) {
    let str = raw;
    if (!hasHyphens) {
      str = str.replace(/-/g, '');
    }
    if (isUpper) {
      str = str.toUpperCase();
    } else {
      str = str.toLowerCase();
    }
    if (hasBraces) {
      str = `{${str}}`;
    }
    return str;
  }

  function getCasing() {
    const checked = document.querySelector('input[name="optCase"]:checked');
    return checked && checked.value === 'upper';
  }

  function generate() {
    const qty = parseInt(numQuantity.value, 10) || 5;
    const isUpper = getCasing();
    const hasHyphens = chkHyphens.checked;
    const hasBraces = chkBraces.checked;

    currentUUIDs = [];
    for (let i = 0; i < qty; i++) {
      const raw = generateV4();
      const formatted = formatUUID(raw, isUpper, hasHyphens, hasBraces);
      currentUUIDs.push(formatted);
    }

    render();
  }

  function render() {
    if (!currentUUIDs.length) {
      uuidContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No UUIDs generated yet.</div>';
      return;
    }

    uuidContainer.innerHTML = currentUUIDs.map((uuid, idx) => `
      <div class="uuid-item">
        <span class="uuid-val">${uuid}</span>
        <button type="button" class="btn btn-sm btn-secondary btn-copy-single" data-index="${idx}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Copy</button>
      </div>
    `).join('');

    // Attach click listeners to individual copy buttons
    const singleCopyBtns = uuidContainer.querySelectorAll('.btn-copy-single');
    singleCopyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const val = currentUUIDs[idx];
        if (val) {
          navigator.clipboard.writeText(val).then(() => {
            if (window.EcrioXApp) EcrioXApp.showToast('UUID copied to clipboard!');
          }).catch(() => {
            if (window.EcrioXApp) EcrioXApp.showToast('Copied!', 'success');
          });
        }
      });
    });
  }

  // Event Listeners
  btnGenerate.addEventListener('click', generate);
  numQuantity.addEventListener('change', generate);
  chkHyphens.addEventListener('change', generate);
  chkBraces.addEventListener('change', generate);
  caseRadios.forEach(radio => radio.addEventListener('change', generate));

  btnCopyAll.addEventListener('click', () => {
    if (!currentUUIDs.length) return;
    const allText = currentUUIDs.join('\n');
    navigator.clipboard.writeText(allText).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast(`Copied all ${currentUUIDs.length} UUIDs to clipboard!`);
    }).catch(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Copied all UUIDs!', 'success');
    });
  });

  btnDownload.addEventListener('click', () => {
    if (!currentUUIDs.length) return;
    const allText = currentUUIDs.join('\n');
    const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `uuids-${currentUUIDs.length}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded uuids-${currentUUIDs.length}.txt`);
  });

  // Init
  generate();
})();
