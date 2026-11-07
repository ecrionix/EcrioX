/**
 * EcrioX Image to Text OCR
 * 100% Client-Side Optical Character Recognition powered by Tesseract.js v5
 */

(function () {
  'use strict';

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  const ocrProgressBox = document.getElementById('ocr-progress-box');
  const ocrProgressStatus = document.getElementById('ocr-progress-status');
  const ocrProgressFill = document.getElementById('ocr-progress-fill');
  const ocrProgressPercent = document.getElementById('ocr-progress-percent');
  const ocrProgressDetails = document.getElementById('ocr-progress-details');

  const ocrStudio = document.getElementById('ocr-studio');
  const currentImageName = document.getElementById('current-image-name');
  const languageSelect = document.getElementById('language-select');
  const filterCanvas = document.getElementById('filter-canvas');

  const btnFilterGrayscale = document.getElementById('btn-filter-grayscale');
  const btnFilterContrast = document.getElementById('btn-filter-contrast');
  const btnFilterThreshold = document.getElementById('btn-filter-threshold');
  const btnRotateCw = document.getElementById('btn-rotate-cw');
  const btnFilterReset = document.getElementById('btn-filter-reset');

  const btnUploadNew = document.getElementById('btn-upload-new');
  const btnRunOcr = document.getElementById('btn-run-ocr');

  const ocrResultText = document.getElementById('ocr-result-text');
  const btnClearFormat = document.getElementById('btn-clear-format');
  const statWords = document.getElementById('stat-words');
  const statChars = document.getElementById('stat-chars');
  const statLines = document.getElementById('stat-lines');
  const statConfidence = document.getElementById('stat-confidence');

  const btnCopyText = document.getElementById('btn-copy-text');
  const btnDownloadTxt = document.getElementById('btn-download-txt');

  // State
  let imageFiles = [];          // Array of chosen Files
  let currentFileIndex = 0;
  let sourceImage = null;       // Currently active HTMLImageElement
  let filterState = {
    grayscale: false,
    contrast: false,
    threshold: false,
    rotation: 0 // 0, 90, 180, 270
  };
  let isProcessing = false;

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
        handleIncomingFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleIncomingFiles(Array.from(e.target.files));
      }
    });

    btnUploadNew.addEventListener('click', () => {
      fileInput.value = '';
      dropzone.style.display = 'block';
      ocrStudio.style.display = 'none';
      ocrProgressBox.style.display = 'none';
      sourceImage = null;
      imageFiles = [];
    });

    // Filters
    btnFilterGrayscale.addEventListener('click', () => {
      filterState.grayscale = !filterState.grayscale;
      btnFilterGrayscale.classList.toggle('active', filterState.grayscale);
      renderFilteredCanvas();
    });

    btnFilterContrast.addEventListener('click', () => {
      filterState.contrast = !filterState.contrast;
      btnFilterContrast.classList.toggle('active', filterState.contrast);
      renderFilteredCanvas();
    });

    btnFilterThreshold.addEventListener('click', () => {
      filterState.threshold = !filterState.threshold;
      btnFilterThreshold.classList.toggle('active', filterState.threshold);
      renderFilteredCanvas();
    });

    btnRotateCw.addEventListener('click', () => {
      filterState.rotation = (filterState.rotation + 90) % 360;
      renderFilteredCanvas();
    });

    btnFilterReset.addEventListener('click', () => {
      filterState = { grayscale: false, contrast: false, threshold: false, rotation: 0 };
      btnFilterGrayscale.classList.remove('active');
      btnFilterContrast.classList.remove('active');
      btnFilterThreshold.classList.remove('active');
      renderFilteredCanvas();
    });

    // OCR Action
    btnRunOcr.addEventListener('click', runOcrExtraction);

    // Text Output Helpers
    ocrResultText.addEventListener('input', updateTextStatistics);
    btnClearFormat.addEventListener('click', cleanExcessSpacing);
    btnCopyText.addEventListener('click', copyExtractedText);
    btnDownloadTxt.addEventListener('click', downloadAsTxt);
  }

  /**
   * Handle incoming image files
   */
  async function handleIncomingFiles(files) {
    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      alert('Please upload a valid image file (JPG, PNG, WebP, or BMP).');
      return;
    }

    imageFiles = validImages;
    currentFileIndex = 0;

    await loadActiveImage();
  }

  /**
   * Load the currently active image from the queue
   */
  async function loadActiveImage() {
    const file = imageFiles[currentFileIndex];
    if (!file) return;

    currentImageName.textContent = imageFiles.length > 1
      ? `[${currentFileIndex + 1}/${imageFiles.length}] ${file.name}`
      : file.name;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      sourceImage = await loadImage(dataUrl);

      // Reset filters for new image
      filterState = { grayscale: false, contrast: false, threshold: false, rotation: 0 };
      btnFilterGrayscale.classList.remove('active');
      btnFilterContrast.classList.remove('active');
      btnFilterThreshold.classList.remove('active');

      renderFilteredCanvas();

      dropzone.style.display = 'none';
      ocrProgressBox.style.display = 'none';
      ocrStudio.style.display = 'block';

    } catch (err) {
      console.error('Error loading image:', err);
      alert('Could not load image. Please try another file.');
    }
  }

  /**
   * Render sourceImage onto filterCanvas with active preprocessing filters
   */
  function renderFilteredCanvas() {
    if (!sourceImage) return;

    const originalW = sourceImage.naturalWidth;
    const originalH = sourceImage.naturalHeight;
    const isSideways = filterState.rotation === 90 || filterState.rotation === 270;

    const canvasW = isSideways ? originalH : originalW;
    const canvasH = isSideways ? originalW : originalH;

    filterCanvas.width = canvasW;
    filterCanvas.height = canvasH;

    const ctx = filterCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Apply Rotation
    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((filterState.rotation * Math.PI) / 180);
    ctx.drawImage(sourceImage, -originalW / 2, -originalH / 2);
    ctx.restore();

    // Pixel manipulation for Grayscale, Contrast, and Threshold
    if (filterState.grayscale || filterState.contrast || filterState.threshold) {
      const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
      const d = imgData.data;

      const contrastFactor = filterState.contrast ? 1.7 : 1.0;
      const contrastOffset = 128 * (1 - contrastFactor);

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // 1. Grayscale
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (filterState.grayscale) {
          r = g = b = gray;
        }

        // 2. Contrast
        if (filterState.contrast) {
          r = Math.min(255, Math.max(0, r * contrastFactor + contrastOffset));
          g = Math.min(255, Math.max(0, g * contrastFactor + contrastOffset));
          b = Math.min(255, Math.max(0, b * contrastFactor + contrastOffset));
          gray = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        // 3. Threshold (Binarization)
        if (filterState.threshold) {
          const val = gray > 130 ? 255 : 0;
          r = g = b = val;
        }

        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }

      ctx.putImageData(imgData, 0, 0);
    }
  }

  /**
   * Run Tesseract OCR on current canvas or all queued images
   */
  async function runOcrExtraction() {
    if (isProcessing || !window.Tesseract) return;
    isProcessing = true;

    ocrProgressBox.style.display = 'block';
    btnRunOcr.disabled = true;

    const lang = languageSelect.value;
    updateOcrProgress('Initializing Web Worker OCR engine...', 10, `Language: ${lang}`);

    let totalExtractedText = '';
    let accumulatedConfidence = 0;
    let confidenceCount = 0;

    try {
      const worker = await window.Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 100);
            updateOcrProgress('Recognizing text in Web Worker...', p, `Transcribing character contours (${p}%)`);
          } else if (m.status) {
            updateOcrProgress(`Status: ${m.status}...`, 25, 'Downloading/loading trained language dictionary');
          }
        }
      });

      for (let idx = 0; idx < imageFiles.length; idx++) {
        currentFileIndex = idx;
        await loadActiveImage();

        updateOcrProgress(`Processing image ${idx + 1} of ${imageFiles.length}...`, 50, imageFiles[idx].name);

        const ret = await worker.recognize(filterCanvas);
        const text = ret.data.text ? ret.data.text.trim() : '';
        const confidence = Math.round(ret.data.confidence || 0);

        if (confidence > 0) {
          accumulatedConfidence += confidence;
          confidenceCount++;
        }

        if (imageFiles.length > 1) {
          totalExtractedText += `\n--- [Image ${idx + 1}/${imageFiles.length}: ${imageFiles[idx].name} (Confidence: ${confidence}%)] ---\n\n`;
          totalExtractedText += text + '\n';
        } else {
          totalExtractedText = text;
        }
      }

      await worker.terminate();

      ocrResultText.value = totalExtractedText.trim();
      updateTextStatistics();

      if (confidenceCount > 0) {
        const avgConf = Math.round(accumulatedConfidence / confidenceCount);
        statConfidence.textContent = `${avgConf}%`;
      }

      updateOcrProgress('OCR transcription complete!', 100, 'Text ready');
      setTimeout(() => {
        ocrProgressBox.style.display = 'none';
      }, 1200);

    } catch (err) {
      console.error('OCR Error:', err);
      ocrProgressStatus.textContent = 'OCR processing encountered an issue.';
      ocrProgressStatus.style.color = 'var(--color-danger)';
      ocrProgressDetails.textContent = err.message || 'Please check that the image is valid and readable.';
    } finally {
      isProcessing = false;
      btnRunOcr.disabled = false;
    }
  }

  /**
   * Live statistics counter
   */
  function updateTextStatistics() {
    const text = ocrResultText.value;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const lines = text.trim() ? text.split('\n').length : 0;

    statWords.textContent = words.toLocaleString();
    statChars.textContent = chars.toLocaleString();
    statLines.textContent = lines.toLocaleString();
  }

  /**
   * Strip redundant line breaks & clean spacing
   */
  function cleanExcessSpacing() {
    let text = ocrResultText.value;
    // Replace 3+ consecutive line breaks with 2
    text = text.replace(/\n{3,}/g, '\n\n');
    // Trim line ends
    text = text.split('\n').map(l => l.trimEnd()).join('\n');
    ocrResultText.value = text.trim();
    updateTextStatistics();
  }

  /**
   * Copy text to clipboard
   */
  function copyExtractedText() {
    const text = ocrResultText.value;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      const origHtml = btnCopyText.innerHTML;
      btnCopyText.innerHTML = `<span style="color: var(--color-success); font-weight:700;">✓ Copied!</span>`;
      setTimeout(() => {
        btnCopyText.innerHTML = origHtml;
      }, 1800);
    }).catch(err => {
      console.warn('Clipboard write failed:', err);
    });
  }

  /**
   * Download text as .txt file
   */
  function downloadAsTxt() {
    const text = ocrResultText.value;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecriox-extracted-text.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper to update progress UI
   */
  function updateOcrProgress(status, percent, details) {
    ocrProgressStatus.textContent = status;
    ocrProgressPercent.textContent = percent + '%';
    ocrProgressFill.style.width = percent + '%';
    if (details) ocrProgressDetails.textContent = details;
  }

  // Helpers
  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

})();
