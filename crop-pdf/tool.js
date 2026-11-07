/**
 * EcrioX - Crop PDF
 * Interactive visual marquee crop box and PDFLib CropBox/MediaBox compilation.
 */
(function() {
  'use strict';

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Elements
  const dropZone = document.getElementById('crop-drop-zone');
  const fileInput = document.getElementById('crop-file-input');
  const changeFileInput = document.getElementById('change-crop-file');
  const stageContainer = document.getElementById('crop-stage-container');
  const fileNameEl = document.getElementById('crop-file-name');
  const pageCountEl = document.getElementById('crop-page-count');
  const stage = document.getElementById('crop-stage');
  const canvas = document.getElementById('crop-pdf-canvas');
  const ctx = canvas.getContext('2d');
  const cropBox = document.getElementById('crop-box');

  const btnPrev = document.getElementById('btn-crop-prev');
  const btnNext = document.getElementById('btn-crop-next');
  const pageIndicator = document.getElementById('crop-page-indicator');

  const lblMarginLeft = document.getElementById('lbl-margin-left');
  const lblMarginRight = document.getElementById('lbl-margin-right');
  const lblMarginTop = document.getElementById('lbl-margin-top');
  const lblMarginBottom = document.getElementById('lbl-margin-bottom');

  const btnReset = document.getElementById('btn-preset-reset');
  const btnTrim5 = document.getElementById('btn-preset-margins');
  const btnTopHalf = document.getElementById('btn-preset-half-top');
  const btnBottomHalf = document.getElementById('btn-preset-half-bottom');

  const btnDownload = document.getElementById('btn-crop-download');
  const btnLabel = document.getElementById('btn-crop-label');
  const spinner = document.getElementById('crop-spinner');

  // State
  let currentFile = null;
  let rawPdfBuffer = null;
  let pdfJsDoc = null;
  let totalPages = 0;
  let currentPageNum = 1;

  // Normalized crop bounds (0 to 1)
  let cropState = {
    x: 0,      // left offset ratio
    y: 0,      // top offset ratio
    w: 1,      // width ratio
    h: 1       // height ratio
  };

  // Drag state
  let isDragging = false;
  let dragMode = null; // 'move' or handle name: 'nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'
  let startPointerX = 0;
  let startPointerY = 0;
  let startCropBox = { left: 0, top: 0, width: 0, height: 0 };

  // Update Crop Box DOM element from cropState
  function renderCropBoxDOM() {
    const stageW = canvas.offsetWidth;
    const stageH = canvas.offsetHeight;
    if (!stageW || !stageH) return;

    const left = cropState.x * stageW;
    const top = cropState.y * stageH;
    const width = cropState.w * stageW;
    const height = cropState.h * stageH;

    cropBox.style.left = `${left}px`;
    cropBox.style.top = `${top}px`;
    cropBox.style.width = `${width}px`;
    cropBox.style.height = `${height}px`;

    // Margin percentages
    const ml = Math.round(cropState.x * 100);
    const mr = Math.round((1 - (cropState.x + cropState.w)) * 100);
    const mt = Math.round(cropState.y * 100);
    const mb = Math.round((1 - (cropState.y + cropState.h)) * 100);

    lblMarginLeft.textContent = `${ml}%`;
    lblMarginRight.textContent = `${mr}%`;
    lblMarginTop.textContent = `${mt}%`;
    lblMarginBottom.textContent = `${mb}%`;
  }

  function setCropNormalized(x, y, w, h) {
    x = Math.max(0, Math.min(0.9, x));
    y = Math.max(0, Math.min(0.9, y));
    w = Math.max(0.05, Math.min(1 - x, w));
    h = Math.max(0.05, Math.min(1 - y, h));

    cropState = { x, y, w, h };
    renderCropBoxDOM();
  }

  // --- RENDER CURRENT PAGE ---
  async function renderPage(pageNo) {
    if (!pdfJsDoc) return;
    try {
      const page = await pdfJsDoc.getPage(pageNo);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(480, window.innerWidth - 80);
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      pageIndicator.textContent = `Page ${pageNo} / ${totalPages}`;
      btnPrev.disabled = (pageNo <= 1);
      btnNext.disabled = (pageNo >= totalPages);

      renderCropBoxDOM();
    } catch (err) {
      console.error('Error rendering crop page:', err);
    }
  }

  // --- FILE HANDLING ---
  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }
    currentFile = file;
    fileNameEl.textContent = file.name;

    try {
      rawPdfBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: rawPdfBuffer.slice(0) });
      pdfJsDoc = await loadingTask.promise;
      totalPages = pdfJsDoc.numPages;
      pageCountEl.textContent = `(${totalPages} page${totalPages === 1 ? '' : 's'})`;

      currentPageNum = 1;
      dropZone.style.display = 'none';
      stageContainer.style.display = 'flex';
      btnDownload.disabled = false;

      // Default to 5% inset crop
      cropState = { x: 0.05, y: 0.05, w: 0.9, h: 0.9 };

      await renderPage(currentPageNum);
    } catch (err) {
      alert('Failed to load PDF: ' + err.message);
    }
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });
  changeFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });

  // Page Nav
  btnPrev.addEventListener('click', () => {
    if (currentPageNum > 1) {
      currentPageNum--;
      renderPage(currentPageNum);
    }
  });
  btnNext.addEventListener('click', () => {
    if (currentPageNum < totalPages) {
      currentPageNum++;
      renderPage(currentPageNum);
    }
  });

  // --- PRESET ACTIONS ---
  btnReset.addEventListener('click', () => setCropNormalized(0, 0, 1, 1));
  btnTrim5.addEventListener('click', () => setCropNormalized(0.05, 0.05, 0.9, 0.9));
  btnTopHalf.addEventListener('click', () => setCropNormalized(0, 0, 1, 0.5));
  btnBottomHalf.addEventListener('click', () => setCropNormalized(0, 0.5, 1, 0.5));

  // --- INTERACTIVE DRAG & RESIZE ENGINE ---
  function onPointerDown(e) {
    if (!pdfJsDoc) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const handle = e.target.getAttribute('data-handle');
    if (handle) {
      dragMode = handle;
    } else if (e.target === cropBox || cropBox.contains(e.target)) {
      dragMode = 'move';
    } else {
      return;
    }

    isDragging = true;
    startPointerX = clientX;
    startPointerY = clientY;

    startCropBox = {
      left: cropBox.offsetLeft,
      top: cropBox.offsetTop,
      width: cropBox.offsetWidth,
      height: cropBox.offsetHeight
    };

    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startPointerX;
    const dy = clientY - startPointerY;

    const stageW = canvas.offsetWidth;
    const stageH = canvas.offsetHeight;

    let newLeft = startCropBox.left;
    let newTop = startCropBox.top;
    let newWidth = startCropBox.width;
    let newHeight = startCropBox.height;

    const minSize = 24;

    if (dragMode === 'move') {
      newLeft = Math.max(0, Math.min(stageW - newWidth, startCropBox.left + dx));
      newTop = Math.max(0, Math.min(stageH - newHeight, startCropBox.top + dy));
    } else {
      // Handles
      if (dragMode.includes('e')) {
        newWidth = Math.max(minSize, Math.min(stageW - startCropBox.left, startCropBox.width + dx));
      }
      if (dragMode.includes('s')) {
        newHeight = Math.max(minSize, Math.min(stageH - startCropBox.top, startCropBox.height + dy));
      }
      if (dragMode.includes('w')) {
        const potentialW = startCropBox.width - dx;
        if (potentialW >= minSize && startCropBox.left + dx >= 0) {
          newLeft = startCropBox.left + dx;
          newWidth = potentialW;
        }
      }
      if (dragMode.includes('n')) {
        const potentialH = startCropBox.height - dy;
        if (potentialH >= minSize && startCropBox.top + dy >= 0) {
          newTop = startCropBox.top + dy;
          newHeight = potentialH;
        }
      }
    }

    // Set normalized
    setCropNormalized(
      newLeft / stageW,
      newTop / stageH,
      newWidth / stageW,
      newHeight / stageH
    );
  }

  function onPointerUp() {
    isDragging = false;
    dragMode = null;
  }

  stage.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  stage.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  // Window resize re-render
  window.addEventListener('resize', () => {
    if (pdfJsDoc) renderCropBoxDOM();
  });

  // --- PDF-LIB CROP & DOWNLOAD ---
  btnDownload.addEventListener('click', async () => {
    if (!rawPdfBuffer || !window.PDFLib) return;

    btnDownload.disabled = true;
    btnLabel.textContent = 'Cropping PDF...';
    spinner.style.display = 'block';

    try {
      const { PDFDocument } = window.PDFLib;
      const pdfDoc = await PDFDocument.load(rawPdfBuffer.slice(0));
      const pages = pdfDoc.getPages();

      const scope = document.querySelector('input[name="crop-scope"]:checked').value;
      const pagesToCrop = scope === 'all' ? pages : [pages[currentPageNum - 1]];

      pagesToCrop.forEach(page => {
        const { width, height } = page.getSize();

        // PDF coordinate system: origin (0, 0) is at bottom-left
        const pdfX = cropState.x * width;
        const pdfY = (1 - (cropState.y + cropState.h)) * height;
        const pdfW = cropState.w * width;
        const pdfH = cropState.h * height;

        // Apply both MediaBox and CropBox
        page.setCropBox(pdfX, pdfY, pdfW, pdfH);
        page.setMediaBox(pdfX, pdfY, pdfW, pdfH);
      });

      const croppedBytes = await pdfDoc.save();
      const blob = new Blob([croppedBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const baseName = (currentFile ? currentFile.name : 'document').replace(/\.pdf$/i, '');
      link.href = downloadUrl;
      link.download = `${baseName}_cropped.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      btnLabel.textContent = 'Success! Downloaded';
      setTimeout(() => {
        btnLabel.textContent = 'Crop PDF & Download';
        btnDownload.disabled = false;
        spinner.style.display = 'none';
      }, 2500);
    } catch (err) {
      console.error('Failed to crop PDF:', err);
      alert('An error occurred during cropping: ' + err.message);
      btnLabel.textContent = 'Crop PDF & Download';
      btnDownload.disabled = false;
      spinner.style.display = 'none';
    }
  });

})();
