/**
 * EcrioX HEIC to JPG / PNG Converter
 * 100% Client-Side Conversion powered by heic2any & JSZip
 */

(function () {
  'use strict';

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const formatSelect = document.getElementById('format-select');
  const qualityGroup = document.getElementById('quality-group');
  const qualitySlider = document.getElementById('quality-slider');
  const qualityDisplay = document.getElementById('quality-display');
  const resizeSelect = document.getElementById('resize-select');
  const btnAddMore = document.getElementById('btn-add-more');

  const batchActionBar = document.getElementById('batch-action-bar');
  const queueSummary = document.getElementById('queue-summary');
  const queueSize = document.getElementById('queue-size');
  const btnClearAll = document.getElementById('btn-clear-all');
  const btnConvertAll = document.getElementById('btn-convert-all');
  const btnDownloadZip = document.getElementById('btn-download-zip');

  const batchProgressCard = document.getElementById('batch-progress-card');
  const batchProgressStatus = document.getElementById('batch-progress-status');
  const batchProgressPercent = document.getElementById('batch-progress-percent');
  const batchProgressFill = document.getElementById('batch-progress-fill');
  const batchProgressDetails = document.getElementById('batch-progress-details');

  const queueGrid = document.getElementById('queue-grid');

  // State
  let queue = []; // Array of items: { id, file, originalName, originalSize, status, convertedBlob, convertedUrl, width, height, error }
  let isConverting = false;

  initEvents();

  function initEvents() {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFilesToQueue(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFilesToQueue(Array.from(e.target.files));
      }
    });

    btnAddMore.addEventListener('click', () => fileInput.click());
    btnClearAll.addEventListener('click', clearQueue);
    btnConvertAll.addEventListener('click', convertAll);
    btnDownloadZip.addEventListener('click', downloadAllZip);

    // Format & Quality Controls
    formatSelect.addEventListener('change', (e) => {
      qualityGroup.style.display = e.target.value === 'image/jpeg' ? 'flex' : 'none';
    });

    qualitySlider.addEventListener('input', (e) => {
      qualityDisplay.textContent = e.target.value + '%';
    });
  }

  /**
   * Add files to queue
   */
  function addFilesToQueue(files) {
    const validFiles = files.filter(f => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ['heic', 'heif'].includes(ext) || f.type.includes('heic') || f.type.includes('heif');
    });

    if (validFiles.length === 0 && files.length > 0) {
      // Allow any image file if user uploaded with general extension
      files.forEach(f => {
        if (f.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png)$/i.test(f.name)) {
          validFiles.push(f);
        }
      });
    }

    if (validFiles.length === 0) {
      alert('Please select valid .heic or .heif iPhone photos.');
      return;
    }

    validFiles.forEach(file => {
      // Avoid duplicate file names if same size
      if (queue.some(item => item.originalName === file.name && item.originalSize === file.size)) {
        return;
      }

      const item = {
        id: 'img_' + Math.random().toString(36).substr(2, 9),
        file: file,
        originalName: file.name,
        originalSize: file.size,
        status: 'queued', // 'queued' | 'converting' | 'done' | 'error'
        convertedBlob: null,
        convertedUrl: null,
        width: null,
        height: null,
        error: null
      };

      queue.push(item);
    });

    fileInput.value = '';
    updateQueueUI();
  }

  /**
   * Update Queue Display
   */
  function updateQueueUI() {
    if (queue.length === 0) {
      batchActionBar.style.display = 'none';
      batchProgressCard.style.display = 'none';
      btnDownloadZip.style.display = 'none';
      queueGrid.innerHTML = '';
      return;
    }

    batchActionBar.style.display = 'flex';

    // Summary calculation
    const totalBytes = queue.reduce((sum, item) => sum + item.originalSize, 0);
    const convertedCount = queue.filter(item => item.status === 'done').length;

    queueSummary.textContent = `${queue.length} photo${queue.length === 1 ? '' : 's'} in queue`;
    queueSize.textContent = `(${formatBytes(totalBytes)})`;

    if (convertedCount > 0) {
      btnDownloadZip.style.display = 'inline-flex';
    } else {
      btnDownloadZip.style.display = 'none';
    }

    renderQueueCards();
  }

  /**
   * Render or update image cards in queue
   */
  function renderQueueCards() {
    queueGrid.innerHTML = '';

    queue.forEach(item => {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.id = `card_${item.id}`;

      let thumbHtml = '';
      if (item.convertedUrl) {
        thumbHtml = `<img src="${item.convertedUrl}" alt="${escapeHtml(item.originalName)} preview">`;
      } else {
        thumbHtml = `
          <div class="image-thumb-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        `;
      }

      let statusBadge = '';
      if (item.status === 'queued') {
        statusBadge = `<span class="status-badge queued">Queued</span>`;
      } else if (item.status === 'converting') {
        statusBadge = `<span class="status-badge converting">Converting...</span>`;
      } else if (item.status === 'done') {
        statusBadge = `<span class="status-badge done">✓ Ready</span>`;
      } else if (item.status === 'error') {
        statusBadge = `<span class="status-badge error">Failed</span>`;
      }

      let metaDetails = `<span>Original: ${formatBytes(item.originalSize)}</span>`;
      if (item.status === 'done' && item.convertedBlob) {
        const diff = item.convertedBlob.size - item.originalSize;
        const diffPct = Math.round((Math.abs(diff) / item.originalSize) * 100);
        const sign = diff > 0 ? `+${diffPct}%` : `-${diffPct}%`;
        metaDetails = `
          <div>
            <span>${formatBytes(item.convertedBlob.size)}</span>
            <span style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700; margin-left: 4px;">(${sign})</span>
          </div>
          <span style="color: var(--text-subtle);">${item.width || ''} × ${item.height || ''}</span>
        `;
      }

      let actionsHtml = '';
      if (item.status === 'done' && item.convertedBlob) {
        const ext = formatSelect.value === 'image/jpeg' ? 'jpg' : 'png';
        actionsHtml = `
          <button class="btn btn-sm btn-primary" onclick="window.downloadItem('${item.id}')" style="flex: 1; padding: 0.45rem 0.75rem;">
            Download .${ext.toUpperCase()}
          </button>
          <button class="btn btn-sm btn-secondary" onclick="window.removeItem('${item.id}')" title="Remove" style="padding: 0.45rem 0.65rem;">
            ✕
          </button>
        `;
      } else if (item.status === 'converting') {
        actionsHtml = `
          <div style="font-size: 0.8rem; color: var(--color-primary); font-weight: 600; text-align: center; width: 100%;">
            Decoding WebAssembly...
          </div>
        `;
      } else {
        actionsHtml = `
          <button class="btn btn-sm btn-secondary" onclick="window.convertSingle('${item.id}')" style="flex: 1; padding: 0.45rem 0.75rem;">
            Convert
          </button>
          <button class="btn btn-sm btn-secondary" onclick="window.removeItem('${item.id}')" title="Remove" style="padding: 0.45rem 0.65rem;">
            ✕
          </button>
        `;
      }

      card.innerHTML = `
        <div class="image-thumb-box">${thumbHtml}</div>
        <div class="image-card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <div class="image-card-title" title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName)}</div>
            ${statusBadge}
          </div>
          <div class="image-card-meta">${metaDetails}</div>
          ${item.error ? `<div style="font-size: 0.75rem; color: var(--color-danger);">${escapeHtml(item.error)}</div>` : ''}
          <div class="image-card-actions">${actionsHtml}</div>
        </div>
      `;

      queueGrid.appendChild(card);
    });
  }

  /**
   * Convert all queued items
   */
  async function convertAll() {
    if (isConverting) return;
    const queuedItems = queue.filter(it => it.status === 'queued' || it.status === 'error');
    if (queuedItems.length === 0) return;

    isConverting = true;
    batchProgressCard.style.display = 'block';
    btnConvertAll.disabled = true;

    const totalToConvert = queuedItems.length;
    let completedCount = 0;

    for (let i = 0; i < queuedItems.length; i++) {
      const item = queuedItems[i];
      const pct = Math.round(((completedCount) / totalToConvert) * 100);
      updateBatchProgress(`Converting ${i + 1} of ${totalToConvert}: ${item.originalName}`, pct, 'Processing in browser WebAssembly');

      await processItemConversion(item);
      completedCount++;

      const updatedPct = Math.round(((completedCount) / totalToConvert) * 100);
      updateBatchProgress(`Converted ${completedCount} of ${totalToConvert} photos`, updatedPct, 'Done');
    }

    isConverting = false;
    btnConvertAll.disabled = false;
    setTimeout(() => {
      batchProgressCard.style.display = 'none';
    }, 1500);

    updateQueueUI();
  }

  /**
   * Convert a single item
   */
  async function processItemConversion(item) {
    item.status = 'converting';
    renderQueueCards();

    const targetType = formatSelect.value;
    const quality = targetType === 'image/jpeg' ? (parseInt(qualitySlider.value, 10) / 100) : 1.0;
    const resizeVal = resizeSelect.value;

    try {
      // 1. Genuine decode with heic2any
      let resultBlob;
      if (window.heic2any) {
        const rawRes = await window.heic2any({
          blob: item.file,
          toType: targetType,
          quality: quality
        });
        resultBlob = Array.isArray(rawRes) ? rawRes[0] : rawRes;
      } else {
        throw new Error('HEIC decoder is initializing. Please retry in a moment.');
      }

      // 2. Load into Image to inspect dimensions & handle optional resize
      const img = await loadImageFromBlob(resultBlob);
      const originalW = img.naturalWidth;
      const originalH = img.naturalHeight;

      let targetW = originalW;
      let targetH = originalH;

      if (resizeVal === '0.75') {
        targetW = Math.round(originalW * 0.75);
        targetH = Math.round(originalH * 0.75);
      } else if (resizeVal === '0.5') {
        targetW = Math.round(originalW * 0.5);
        targetH = Math.round(originalH * 0.5);
      } else if (resizeVal === '1920' && (originalW > 1920 || originalH > 1920)) {
        if (originalW > originalH) {
          targetW = 1920;
          targetH = Math.round((1920 / originalW) * originalH);
        } else {
          targetH = 1920;
          targetW = Math.round((1920 / originalH) * originalW);
        }
      }

      // If dimensions need scaling, re-render to canvas
      if (targetW !== originalW || targetH !== originalH) {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);

        resultBlob = await new Promise(resolve => canvas.toBlob(resolve, targetType, quality));
      }

      item.convertedBlob = resultBlob;
      item.convertedUrl = URL.createObjectURL(resultBlob);
      item.width = targetW;
      item.height = targetH;
      item.status = 'done';
      item.error = null;

    } catch (err) {
      console.error('HEIC conversion failed for', item.originalName, err);
      item.status = 'error';
      item.error = err.message || 'Corrupted or unsupported HEIC stream.';
    }

    renderQueueCards();
  }

  /**
   * Helper to download a single item
   */
  window.downloadItem = function (id) {
    const item = queue.find(it => it.id === id);
    if (!item || !item.convertedBlob) return;

    const baseName = item.originalName.replace(/\.[^/.]+$/, '');
    const ext = formatSelect.value === 'image/jpeg' ? 'jpg' : 'png';
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = `${baseName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Helper to convert a single item
   */
  window.convertSingle = async function (id) {
    const item = queue.find(it => it.id === id);
    if (!item || isConverting) return;
    await processItemConversion(item);
    updateQueueUI();
  };

  /**
   * Helper to remove a single item
   */
  window.removeItem = function (id) {
    const idx = queue.findIndex(it => it.id === id);
    if (idx !== -1) {
      if (queue[idx].convertedUrl) {
        URL.revokeObjectURL(queue[idx].convertedUrl);
      }
      queue.splice(idx, 1);
      updateQueueUI();
    }
  };

  /**
   * Clear all items in queue
   */
  function clearQueue() {
    queue.forEach(item => {
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    });
    queue = [];
    updateQueueUI();
  }

  /**
   * Download All Converted Images in a single ZIP archive
   */
  async function downloadAllZip() {
    const readyItems = queue.filter(it => it.status === 'done' && it.convertedBlob);
    if (readyItems.length === 0 || !window.JSZip) return;

    const zip = new window.JSZip();
    const ext = formatSelect.value === 'image/jpeg' ? 'jpg' : 'png';

    readyItems.forEach((item, index) => {
      const baseName = item.originalName.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}.${ext}`;
      zip.file(fileName, item.convertedBlob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecriox-converted-photos.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Batch progress UI helper
   */
  function updateBatchProgress(status, percent, details) {
    batchProgressStatus.textContent = status;
    batchProgressPercent.textContent = percent + '%';
    batchProgressFill.style.width = percent + '%';
    if (details) batchProgressDetails.textContent = details;
  }

  function loadImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to render decoded image'));
      };
      img.src = url;
    });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
