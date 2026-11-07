/**
 * EcrioX Remove Duplicate Lines
 * High-speed client-side text deduplication and sorting.
 */

(function () {
  'use strict';

  const txtInput = document.getElementById('txtDedupeInput');
  const txtOutput = document.getElementById('txtDedupeOutput');
  const chkCaseSensitive = document.getElementById('chkCaseSensitive');
  const chkTrim = document.getElementById('chkTrim');
  const chkRemoveEmpty = document.getElementById('chkRemoveEmpty');
  const selSort = document.getElementById('selSort');

  const btnSample = document.getElementById('btnSample');
  const btnClear = document.getElementById('btnClear');
  const btnDedupe = document.getElementById('btnDedupe');
  const btnCopy = document.getElementById('btnCopy');
  const btnDownload = document.getElementById('btnDownload');

  const lblInputStats = document.getElementById('lblInputStats');
  const lblRemovedStats = document.getElementById('lblRemovedStats');

  function deduplicate() {
    const rawText = txtInput.value;
    if (!rawText) {
      txtOutput.value = '';
      lblInputStats.textContent = '0 lines';
      lblRemovedStats.textContent = '0 duplicates removed';
      return;
    }

    const isCase = chkCaseSensitive.checked;
    const isTrim = chkTrim.checked;
    const isRemoveEmpty = chkRemoveEmpty.checked;
    const sortMode = selSort.value;

    let lines = rawText.split(/\r?\n/);
    const originalCount = lines.length;

    if (isTrim) {
      lines = lines.map(line => line.trim());
    }

    if (isRemoveEmpty) {
      lines = lines.filter(line => line.length > 0);
    }

    const seen = new Set();
    const uniqueLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const key = isCase ? line : line.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLines.push(line);
      }
    }

    // Sorting
    if (sortMode === 'az') {
      uniqueLines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: isCase ? 'case' : 'base' }));
    } else if (sortMode === 'za') {
      uniqueLines.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: isCase ? 'case' : 'base' }));
    }

    txtOutput.value = uniqueLines.join('\n');

    const duplicatesRemoved = lines.length - uniqueLines.length;
    lblInputStats.textContent = `${originalCount.toLocaleString()} original line${originalCount === 1 ? '' : 's'}`;
    lblRemovedStats.textContent = `${duplicatesRemoved.toLocaleString()} duplicate${duplicatesRemoved === 1 ? '' : 's'} removed`;
  }

  // Event Listeners
  txtInput.addEventListener('input', deduplicate);
  chkCaseSensitive.addEventListener('change', deduplicate);
  chkTrim.addEventListener('change', deduplicate);
  chkRemoveEmpty.addEventListener('change', deduplicate);
  selSort.addEventListener('change', deduplicate);
  btnDedupe.addEventListener('click', deduplicate);

  btnSample.addEventListener('click', () => {
    txtInput.value = [
      'apple',
      'banana',
      'orange',
      'apple',
      'BANANA',
      'grape',
      'orange',
      'watermelon',
      'apple',
      'banana',
      'strawberry'
    ].join('\n');
    deduplicate();
  });

  btnClear.addEventListener('click', () => {
    txtInput.value = '';
    deduplicate();
    txtInput.focus();
  });

  btnCopy.addEventListener('click', () => {
    if (!txtOutput.value) {
      if (window.EcrioXApp) EcrioXApp.showToast('No deduplicated output to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(txtOutput.value).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Copied unique lines to clipboard!');
    }).catch(() => {
      txtOutput.select();
      document.execCommand('copy');
      if (window.EcrioXApp) EcrioXApp.showToast('Copied unique lines to clipboard!');
    });
  });

  btnDownload.addEventListener('click', () => {
    const content = txtOutput.value;
    if (!content) {
      if (window.EcrioXApp) EcrioXApp.showToast('No output to download', 'error');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'unique-lines.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    if (window.EcrioXApp) EcrioXApp.showToast('Downloaded unique-lines.txt');
  });

  // Init
  deduplicate();
})();
