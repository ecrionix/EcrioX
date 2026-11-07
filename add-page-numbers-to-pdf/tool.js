/**
 * EcrioX - Add Page Numbers to PDF
 * Pure client-side PDF pagination with pdfjs-dist and pdf-lib
 */
(function() {
  'use strict';

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Elements
  const dropZone = document.getElementById('pdf-drop-zone');
  const fileInput = document.getElementById('pdf-file-input');
  const changeFileInput = document.getElementById('change-file-input');
  const previewStageContainer = document.getElementById('preview-stage-container');
  const fileNameEl = document.getElementById('pdf-file-name');
  const pageCountEl = document.getElementById('pdf-page-count');
  const previewCanvas = document.getElementById('pdf-preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  const previewMockBadge = document.getElementById('preview-mock-badge');
  const previewStage = document.getElementById('preview-stage');

  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const pageIndicator = document.getElementById('page-indicator');

  const posBtns = document.querySelectorAll('.pos-btn');
  const selectFormat = document.getElementById('select-format');
  const chkSkipCover = document.getElementById('chk-skip-cover');
  const inputStartNum = document.getElementById('input-start-num');
  const selectFontSize = document.getElementById('select-font-size');
  const selectFontFamily = document.getElementById('select-font-family');
  const selectColor = document.getElementById('select-color');

  const btnDownload = document.getElementById('btn-process-download');
  const btnLabel = document.getElementById('btn-process-label');
  const spinner = document.getElementById('processing-spinner');

  // State
  let currentFile = null;
  let rawPdfBuffer = null;
  let pdfJsDoc = null;
  let totalPages = 0;
  let currentPageNum = 1;
  let activePosition = 'bottom-center'; // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right

  // Roman numeral converter
  function toRoman(num, lower = false) {
    if (isNaN(num) || num <= 0) return num.toString();
    const lookup = { M:1000, CM:900, D:500, CD:400, C:100, XC:90, L:50, XL:40, X:10, IX:9, V:5, IV:4, I:1 };
    let roman = '';
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i;
        num -= lookup[i];
      }
    }
    return lower ? roman.toLowerCase() : roman;
  }

  function formatPageString(pageIdx0) {
    const skipCover = chkSkipCover.checked;
    if (skipCover && pageIdx0 === 0) {
      return '';
    }

    const startNum = parseInt(inputStartNum.value, 10) || 1;
    const effectiveIndex = skipCover ? (pageIdx0 - 1) : pageIdx0;
    const n = startNum + effectiveIndex;
    const total = skipCover ? (totalPages - 1) : totalPages;
    const format = selectFormat.value;

    switch (format) {
      case 'page-n-of-total':
        return `Page ${n} of ${total}`;
      case 'n-slash-total':
        return `${n} / ${total}`;
      case 'number-only':
        return `${n}`;
      case 'dash-n-dash':
        return `- ${n} -`;
      case 'roman-upper':
        return toRoman(n, false);
      case 'roman-lower':
        return toRoman(n, true);
      default:
        return `Page ${n} of ${total}`;
    }
  }

  // Update Mock Badge Overlay on Preview
  function updateMockBadge() {
    if (!pdfJsDoc) return;

    const text = formatPageString(currentPageNum - 1);
    if (!text) {
      previewMockBadge.style.display = 'none';
      return;
    }

    previewMockBadge.style.display = 'block';
    previewMockBadge.textContent = text;

    // Reset styles
    previewMockBadge.style.left = '';
    previewMockBadge.style.right = '';
    previewMockBadge.style.top = '';
    previewMockBadge.style.bottom = '';
    previewMockBadge.style.transform = '';

    const margin = 20;

    switch (activePosition) {
      case 'top-left':
        previewMockBadge.style.left = `${margin}px`;
        previewMockBadge.style.top = `${margin}px`;
        previewMockBadge.style.transform = 'none';
        break;
      case 'top-center':
        previewMockBadge.style.left = '50%';
        previewMockBadge.style.top = `${margin}px`;
        previewMockBadge.style.transform = 'translateX(-50%)';
        break;
      case 'top-right':
        previewMockBadge.style.right = `${margin}px`;
        previewMockBadge.style.top = `${margin}px`;
        previewMockBadge.style.transform = 'none';
        break;
      case 'bottom-left':
        previewMockBadge.style.left = `${margin}px`;
        previewMockBadge.style.bottom = `${margin}px`;
        previewMockBadge.style.transform = 'none';
        break;
      case 'bottom-center':
        previewMockBadge.style.left = '50%';
        previewMockBadge.style.bottom = `${margin}px`;
        previewMockBadge.style.transform = 'translateX(-50%)';
        break;
      case 'bottom-right':
        previewMockBadge.style.right = `${margin}px`;
        previewMockBadge.style.bottom = `${margin}px`;
        previewMockBadge.style.transform = 'none';
        break;
    }
  }

  // Render Page via PDF.js
  async function renderPreviewPage(pageNo) {
    if (!pdfJsDoc) return;
    try {
      const page = await pdfJsDoc.getPage(pageNo);
      // Determine viewport scale to fit standard box nicely (~480px width)
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(480, window.innerWidth - 80);
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      previewCanvas.width = viewport.width;
      previewCanvas.height = viewport.height;

      await page.render({
        canvasContext: previewCtx,
        viewport: viewport
      }).promise;

      pageIndicator.textContent = `Page ${pageNo} / ${totalPages}`;
      btnPrevPage.disabled = (pageNo <= 1);
      btnNextPage.disabled = (pageNo >= totalPages);

      updateMockBadge();
    } catch (err) {
      console.error('Error rendering preview page:', err);
    }
  }

  // Load PDF file
  async function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF document.');
      return;
    }
    currentFile = file;
    fileNameEl.textContent = file.name;

    try {
      rawPdfBuffer = await file.arrayBuffer();
      // Load with pdf.js
      const loadingTask = window.pdfjsLib.getDocument({ data: rawPdfBuffer.slice(0) });
      pdfJsDoc = await loadingTask.promise;
      totalPages = pdfJsDoc.numPages;
      pageCountEl.textContent = `(${totalPages} page${totalPages === 1 ? '' : 's'})`;

      currentPageNum = 1;
      dropZone.style.display = 'none';
      previewStageContainer.style.display = 'flex';
      btnDownload.disabled = false;

      await renderPreviewPage(currentPageNum);
    } catch (err) {
      alert('Failed to load PDF: ' + err.message);
    }
  }

  // File Event Listeners
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });
  changeFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // Navigation
  btnPrevPage.addEventListener('click', () => {
    if (currentPageNum > 1) {
      currentPageNum--;
      renderPreviewPage(currentPageNum);
    }
  });
  btnNextPage.addEventListener('click', () => {
    if (currentPageNum < totalPages) {
      currentPageNum++;
      renderPreviewPage(currentPageNum);
    }
  });

  // Position Buttons
  posBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      posBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePosition = btn.getAttribute('data-pos');
      updateMockBadge();
    });
  });

  // Settings inputs
  selectFormat.addEventListener('change', updateMockBadge);
  chkSkipCover.addEventListener('change', updateMockBadge);
  inputStartNum.addEventListener('input', updateMockBadge);

  // --- PDF COMPILATION & DOWNLOAD ---
  btnDownload.addEventListener('click', async () => {
    if (!rawPdfBuffer || !window.PDFLib) return;

    btnDownload.disabled = true;
    btnLabel.textContent = 'Processing PDF...';
    spinner.style.display = 'block';

    try {
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      // Load raw buffer copy
      const pdfDoc = await PDFDocument.load(rawPdfBuffer.slice(0));

      // Font selection
      let font;
      const fontChoice = selectFontFamily.value;
      if (fontChoice === 'TimesRoman') {
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      } else if (fontChoice === 'Courier') {
        font = await pdfDoc.embedFont(StandardFonts.Courier);
      } else {
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      const fontSize = parseInt(selectFontSize.value, 10) || 11;
      
      // Color selection
      let textColor = rgb(0, 0, 0);
      if (selectColor.value === 'gray') textColor = rgb(0.35, 0.35, 0.35);
      else if (selectColor.value === 'blue') textColor = rgb(0.15, 0.39, 0.92);

      const pages = pdfDoc.getPages();
      const margin = 36; // 0.5 inch (36 pt)

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageText = formatPageString(i);
        if (!pageText) continue; // skip cover if configured

        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(pageText, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x = 0;
        let y = 0;

        switch (activePosition) {
          case 'top-left':
            x = margin;
            y = height - margin - textHeight;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - margin - textHeight;
            break;
          case 'top-right':
            x = width - margin - textWidth;
            y = height - margin - textHeight;
            break;
          case 'bottom-left':
            x = margin;
            y = margin;
            break;
          case 'bottom-center':
            x = (width - textWidth) / 2;
            y = margin;
            break;
          case 'bottom-right':
            x = width - margin - textWidth;
            y = margin;
            break;
        }

        page.drawText(pageText, {
          x,
          y,
          size: fontSize,
          font,
          color: textColor
        });
      }

      // Save modified document
      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      const baseName = (currentFile ? currentFile.name : 'document').replace(/\.pdf$/i, '');
      downloadLink.href = downloadUrl;
      downloadLink.download = `${baseName}_numbered.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);

      btnLabel.textContent = 'Success! Downloaded';
      setTimeout(() => {
        btnLabel.textContent = 'Add Page Numbers & Download';
        btnDownload.disabled = false;
        spinner.style.display = 'none';
      }, 2500);
    } catch (err) {
      console.error('Failed to process PDF:', err);
      alert('An error occurred while stamping page numbers: ' + err.message);
      btnLabel.textContent = 'Add Page Numbers & Download';
      btnDownload.disabled = false;
      spinner.style.display = 'none';
    }
  });

})();
