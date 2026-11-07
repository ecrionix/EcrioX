/**
 * EcrioX - PNG to WebP Converter
 * Pure client-side batch canvas re-encoding with transparency preservation and JSZip download.
 */
(function() {
  'use strict';

  // Elements
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const qualityRange = document.getElementById('quality-range');
  const qualityVal = document.getElementById('quality-val');
  const resizeSelect = document.getElementById('resize-select');
  const chkAlpha = document.getElementById('chk-preserve-alpha');

  const queueContainer = document.getElementById('queue-container');
  const queueList = document.getElementById('queue-list');
  const queueCountEl = document.getElementById('queue-count');
  const btnClearQueue = document.getElementById('btn-clear-queue');

  const batchHeadline = document.getElementById('batch-stats-headline');
  const batchSub = document.getElementById('batch-stats-sub');
  const btnDownloadAll = document.getElementById('btn-download-all');

  // Items State
  let items = []; // { id, file, img, originalSize, webpBlob, webpSize, width, height, outName }
  let nextId = 1;

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  qualityRange.addEventListener('input', () => {
    qualityVal.textContent = `${qualityRange.value}%`;
  });

  // Re-convert on settings change (debounced)
  let reconvertTimeout = null;
  function scheduleReconvert() {
    clearTimeout(reconvertTimeout);
    reconvertTimeout = setTimeout(() => {
      items.forEach(item => convertItem(item, false));
    }, 300);
  }

  qualityRange.addEventListener('change', scheduleReconvert);
  resizeSelect.addEventListener('change', scheduleReconvert);
  chkAlpha.addEventListener('change', scheduleReconvert);

  // File loading
  function handleFiles(fileList) {
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;

    queueContainer.style.display = 'block';

    validFiles.forEach(file => {
      const id = nextId++;
      const item = {
        id,
        file,
        img: null,
        originalSize: file.size,
        webpBlob: null,
        webpSize: 0,
        width: 0,
        height: 0,
        outName: file.name.replace(/\.[^/.]+$/, "") + '.webp'
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          item.img = img;
          item.width = img.naturalWidth;
          item.height = img.naturalHeight;
          items.push(item);
          renderQueueItemDOM(item);
          convertItem(item, true);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Convert single item via canvas
  function convertItem(item, isNew = false) {
    if (!item.img) return;

    const quality = parseFloat(qualityRange.value) / 100;
    const resizeVal = resizeSelect.value;
    const preserveAlpha = chkAlpha.checked;

    let targetW = item.width;
    let targetH = item.height;

    if (resizeVal !== 'original') {
      const maxDim = parseInt(resizeVal, 10);
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }
    }

    const c = document.createElement('canvas');
    c.width = targetW;
    c.height = targetH;
    const ctx = c.getContext('2d');

    if (!preserveAlpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(item.img, 0, 0, targetW, targetH);

    c.toBlob((blob) => {
      if (!blob) return;
      item.webpBlob = blob;
      item.webpSize = blob.size;
      updateQueueItemDOM(item);
      updateBatchSummary();
    }, 'image/webp', quality);
  }

  // DOM for item
  function renderQueueItemDOM(item) {
    const el = document.createElement('div');
    el.className = 'queue-item';
    el.id = `queue-item-${item.id}`;

    el.innerHTML = `
      <div class="queue-thumb-info">
        <img class="queue-thumb" src="${item.img.src}" alt="${item.file.name}">
        <div class="queue-meta">
          <span class="queue-name" title="${item.file.name}">${item.file.name}</span>
          <span class="queue-dims">${item.width} &times; ${item.height} px</span>
        </div>
      </div>
      <div class="queue-sizes">
        <span style="color: var(--text-muted);">${formatBytes(item.originalSize)}</span>
        <span style="color: var(--text-subtle);">&rarr;</span>
        <span style="font-weight: 700; color: var(--color-primary);" id="size-webp-${item.id}">Converting...</span>
        <span class="saving-badge" id="badge-saving-${item.id}" style="display: none;">-0%</span>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button type="button" class="btn btn-secondary" id="btn-download-${item.id}" style="padding: 0.45rem 0.85rem; font-size: 0.85rem;" disabled>
          Download WebP
        </button>
        <button type="button" id="btn-remove-${item.id}" style="background: none; border: none; color: var(--text-subtle); cursor: pointer; padding: 0.25rem;" title="Remove">
          &times;
        </button>
      </div>
    `;

    queueList.appendChild(el);

    // Event listeners
    el.querySelector(`#btn-remove-${item.id}`).addEventListener('click', () => {
      items = items.filter(i => i.id !== item.id);
      el.remove();
      if (!items.length) {
        queueContainer.style.display = 'none';
      }
      updateBatchSummary();
    });

    el.querySelector(`#btn-download-${item.id}`).addEventListener('click', () => {
      if (!item.webpBlob) return;
      downloadBlob(item.webpBlob, item.outName);
    });

    queueCountEl.textContent = items.length;
  }

  function updateQueueItemDOM(item) {
    const sizeEl = document.getElementById(`size-webp-${item.id}`);
    const badgeEl = document.getElementById(`badge-saving-${item.id}`);
    const dlBtn = document.getElementById(`btn-download-${item.id}`);

    if (sizeEl) sizeEl.textContent = formatBytes(item.webpSize);
    if (dlBtn) dlBtn.disabled = false;

    if (badgeEl) {
      const savedBytes = item.originalSize - item.webpSize;
      const pct = Math.round((savedBytes / item.originalSize) * 100);
      if (pct > 0) {
        badgeEl.textContent = `-${pct}%`;
        badgeEl.style.display = 'inline-block';
        badgeEl.style.background = 'rgba(16, 185, 129, 0.15)';
        badgeEl.style.color = '#059669';
      } else {
        badgeEl.textContent = `+${Math.abs(pct)}%`;
        badgeEl.style.display = 'inline-block';
        badgeEl.style.background = 'rgba(239, 68, 68, 0.15)';
        badgeEl.style.color = '#dc2626';
      }
    }
  }

  function updateBatchSummary() {
    queueCountEl.textContent = items.length;
    if (!items.length) {
      queueContainer.style.display = 'none';
      return;
    }

    let totalOrig = 0;
    let totalWebp = 0;
    let readyCount = 0;

    items.forEach(i => {
      totalOrig += i.originalSize;
      if (i.webpBlob) {
        totalWebp += i.webpSize;
        readyCount++;
      }
    });

    const totalSaved = totalOrig - totalWebp;
    const totalPct = totalOrig > 0 ? Math.round((totalSaved / totalOrig) * 100) : 0;

    if (readyCount === items.length) {
      batchHeadline.textContent = `All ${items.length} images converted successfully!`;
      batchSub.innerHTML = `Original: <strong>${formatBytes(totalOrig)}</strong> &bull; WebP: <strong>${formatBytes(totalWebp)}</strong> (Saved <strong>${Math.max(0, totalPct)}%</strong>)`;
      btnDownloadAll.disabled = false;
    } else {
      batchHeadline.textContent = `Converting ${readyCount} / ${items.length} images...`;
      btnDownloadAll.disabled = true;
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Batch ZIP Download
  btnDownloadAll.addEventListener('click', async () => {
    if (!items.length || !window.JSZip) return;

    btnDownloadAll.disabled = true;
    const originalText = btnDownloadAll.textContent;
    btnDownloadAll.textContent = 'Packaging ZIP...';

    try {
      const zip = new window.JSZip();
      items.forEach(item => {
        if (item.webpBlob) {
          zip.file(item.outName, item.webpBlob);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'ecriox_webp_images.zip');

      btnDownloadAll.textContent = 'Downloaded!';
      setTimeout(() => {
        btnDownloadAll.textContent = originalText;
        btnDownloadAll.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      alert('Error creating ZIP archive: ' + err.message);
      btnDownloadAll.textContent = originalText;
      btnDownloadAll.disabled = false;
    }
  });

  btnClearQueue.addEventListener('click', () => {
    items = [];
    queueList.innerHTML = '';
    queueContainer.style.display = 'none';
  });

  // Event Listeners for Upload
  fileInput.addEventListener('change', (e) => {
    if (e.target.files) handleFiles(e.target.files);
    fileInput.value = '';
  });

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  });

})();
