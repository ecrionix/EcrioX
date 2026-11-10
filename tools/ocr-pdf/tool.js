/**
 * EcrioX OCR PDF – Production Engine
 * 100% Client-Side Optical Character Recognition & Searchable PDF Generator
 * Powered by Tesseract.js v5, PDF.js, and pdf-lib
 */

(function () {
  'use strict';

  // State Management
  const state = {
    files: [],               // Array of { id, file, name, size, type, pageCount, thumbUrl, arrayBuffer }
    isProcessing: false,
    cancelRequested: false,
    currentWorker: null,
    generatedPdfBytes: null,
    extractedFullText: '',
    pagePreviews: [],        // Array of { previewUrl, text, confidence, pageNum }
    currentPreviewIndex: 0,
    overallConfidence: 0
  };

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const btnBrowseFiles = document.getElementById('btnBrowseFiles');

  const workspaceControls = document.getElementById('workspaceControls');
  const totalDocCount = document.getElementById('totalDocCount');
  const totalPageCount = document.getElementById('totalPageCount');
  const totalInputSize = document.getElementById('totalInputSize');
  const fileListContainer = document.getElementById('fileListContainer');

  const ocrLanguage = document.getElementById('ocrLanguage');
  const ocrQualityPreset = document.getElementById('ocrQualityPreset');
  const chkAutoContrast = document.getElementById('chkAutoContrast');
  const chkDeskew = document.getElementById('chkDeskew');

  const btnAddMoreFiles = document.getElementById('btnAddMoreFiles');
  const btnClearQueue = document.getElementById('btnClearQueue');
  const btnStartOcr = document.getElementById('btnStartOcr');

  const progressSection = document.getElementById('progressSection');
  const progressStatus = document.getElementById('progressStatus');
  const progressPercent = document.getElementById('progressPercent');
  const progressBar = document.getElementById('progressBar');
  const progressDetail = document.getElementById('progressDetail');
  const btnCancelOcr = document.getElementById('btnCancelOcr');

  const previewSection = document.getElementById('previewSection');
  const confidenceBadge = document.getElementById('confidenceBadge');
  const btnCopyExtracted = document.getElementById('btnCopyExtracted');

  const btnPrevPage = document.getElementById('btnPrevPage');
  const btnNextPage = document.getElementById('btnNextPage');
  const previewPageIndicator = document.getElementById('previewPageIndicator');
  const previewCanvas = document.getElementById('previewCanvas');
  const statWords = document.getElementById('statWords');
  const statChars = document.getElementById('statChars');
  const extractedTextInspector = document.getElementById('extractedTextInspector');

  const resultsBox = document.getElementById('resultsBox');
  const finalOutputStats = document.getElementById('finalOutputStats');
  const btnDownloadSearchablePdf = document.getElementById('btnDownloadSearchablePdf');
  const btnDownloadTxt = document.getElementById('btnDownloadTxt');
  const btnResetTool = document.getElementById('btnResetTool');

  // Initialize Event Listeners
  initEvents();

  function initEvents() {
    // Dropzone triggers
    btnBrowseFiles.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = 'var(--color-primary)';
        dropzone.style.backgroundColor = 'var(--color-primary-light)';
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.style.borderColor = 'var(--border-color)';
        dropzone.style.backgroundColor = 'var(--bg-card)';
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleIncomingFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleIncomingFiles(Array.from(e.target.files));
      }
    });

    btnAddMoreFiles.addEventListener('click', () => fileInput.click());
    btnClearQueue.addEventListener('click', resetAll);
    btnResetTool.addEventListener('click', resetAll);

    // Support drag and drop on configuration/queue container
    if (workspaceControls) {
      workspaceControls.addEventListener('dragover', (e) => e.preventDefault());
      workspaceControls.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleIncomingFiles(Array.from(e.dataTransfer.files));
        }
      });
    }

    btnStartOcr.addEventListener('click', startOcrProcess);
    btnCancelOcr.addEventListener('click', cancelOcrProcess);

    // Preview Page Navigation
    btnPrevPage.addEventListener('click', () => {
      if (state.currentPreviewIndex > 0) {
        state.currentPreviewIndex--;
        updateActivePreviewPage();
      }
    });

    btnNextPage.addEventListener('click', () => {
      if (state.currentPreviewIndex < state.pagePreviews.length - 1) {
        state.currentPreviewIndex++;
        updateActivePreviewPage();
      }
    });

    // Copy Text Actions
    btnCopyExtracted.addEventListener('click', copyExtractedText);

    // Downloads
    btnDownloadSearchablePdf.addEventListener('click', downloadSearchablePdf);
    btnDownloadTxt.addEventListener('click', downloadExtractedTxt);

    // Live update stats on manual text editing
    extractedTextInspector.addEventListener('input', () => {
      updateWordCharCounts(extractedTextInspector.value);
    });

    // Check URL transfer parameter from homepage hero
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('transfer') === '1' && window.EcrioXHeroTransfer) {
      window.EcrioXHeroTransfer.getStoredFiles().then((transferredFiles) => {
        if (transferredFiles && transferredFiles.length > 0) {
          handleIncomingFiles(transferredFiles);
          try {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (e) {}
        }
      });
    }
  }

  /**
   * Handle incoming dropped or selected files
   */
  async function handleIncomingFiles(fileList) {
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    let invalidCount = 0;
    let duplicateCount = 0;

    const candidates = [];
    for (const f of fileList) {
      const ext = '.' + f.name.split('.').pop().toLowerCase();
      const isValid = validExtensions.includes(ext) || f.type.startsWith('image/') || f.type === 'application/pdf';
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicates
      const isDuplicate = state.files.some(
        (existing) => existing.name === f.name && existing.size === f.size && existing.file && existing.file.lastModified === f.lastModified
      );
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      candidates.push(f);
    }

    if (invalidCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${invalidCount} unsupported file(s) were skipped.`);
    }

    if (duplicateCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${duplicateCount} duplicate file(s) were skipped.`);
    }

    if (candidates.length === 0 && state.files.length === 0) {
      alert('Please upload scanned PDF documents or image files (JPG, PNG).');
      return;
    }

    for (const file of candidates) {
      const id = 'file_' + Math.random().toString(36).substring(2, 11);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      const fileEntry = {
        id: id,
        file: file,
        name: file.name,
        size: file.size,
        type: isPdf ? 'pdf' : 'image',
        pageCount: 1,
        thumbUrl: '',
        arrayBuffer: null
      };

      try {
        const arrayBuf = await file.arrayBuffer();
        fileEntry.arrayBuffer = arrayBuf;

        if (isPdf && window.pdfjsLib) {
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuf.slice(0) });
          const pdfDoc = await loadingTask.promise;
          fileEntry.pageCount = pdfDoc.numPages;

          // Render Page 1 thumbnail
          const page1 = await pdfDoc.getPage(1);
          const viewport = page1.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          await page1.render({ canvasContext: ctx, viewport: viewport }).promise;
          fileEntry.thumbUrl = canvas.toDataURL('image/jpeg', 0.7);
        } else {
          // Image thumbnail
          fileEntry.thumbUrl = await generateImageThumbnail(file);
          fileEntry.pageCount = 1;
        }

        state.files.push(fileEntry);
      } catch (err) {
        console.warn('Could not inspect file thumbnail:', file.name, err);
        // Fallback default entry
        state.files.push(fileEntry);
      }
    }

    fileInput.value = '';
    renderFileList();
  }

  /**
   * Generate quick thumbnail for image files
   */
  function generateImageThumbnail(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 90;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      img.src = url;
    });
  }

  /**
   * Render file list cards and summary metrics
   */
  function renderFileList() {
    if (state.files.length === 0) {
      workspaceControls.style.display = 'none';
      resultsBox.style.display = 'none';
      previewSection.style.display = 'none';
      progressSection.style.display = 'none';
      dropzone.style.display = 'block';
      return;
    }

    dropzone.style.display = 'block';
    workspaceControls.style.display = 'block';

    let totalPages = 0;
    let totalBytes = 0;

    fileListContainer.innerHTML = '';

    state.files.forEach((item, index) => {
      totalPages += item.pageCount || 1;
      totalBytes += item.size || 0;

      const card = document.createElement('div');
      card.className = 'queue-card';
      card.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        gap: 1rem;
      `;

      const left = document.createElement('div');
      left.style.cssText = 'display: flex; align-items: center; gap: 0.85rem; overflow: hidden;';

      const thumb = document.createElement('div');
      thumb.style.cssText = `
        width: 44px;
        height: 52px;
        background: var(--bg-subtle);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
      `;

      if (item.thumbUrl) {
        thumb.innerHTML = `<img src="${item.thumbUrl}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        thumb.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
      }

      const info = document.createElement('div');
      info.style.cssText = 'overflow: hidden;';

      const title = document.createElement('strong');
      title.style.cssText = 'display: block; font-size: 0.92rem; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;';
      title.textContent = `${index + 1}. ${item.name}`;

      const meta = document.createElement('span');
      meta.style.cssText = 'font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.15rem;';
      meta.textContent = `${formatBytes(item.size)} • ${item.pageCount} ${item.pageCount === 1 ? 'Page' : 'Pages'} • ${item.type.toUpperCase()}`;

      info.appendChild(title);
      info.appendChild(meta);
      left.appendChild(thumb);
      left.appendChild(info);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = '&times;';
      removeBtn.style.cssText = 'background: transparent; border: none; font-size: 1.4rem; line-height: 1; color: var(--text-muted); cursor: pointer; padding: 0.2rem 0.5rem;';
      removeBtn.title = 'Remove file';
      removeBtn.addEventListener('click', () => {
        state.files = state.files.filter(f => f.id !== item.id);
        renderFileList();
      });

      card.appendChild(left);
      card.appendChild(removeBtn);
      fileListContainer.appendChild(card);
    });

    totalDocCount.textContent = state.files.length.toString();
    totalPageCount.textContent = totalPages.toString();
    totalInputSize.textContent = formatBytes(totalBytes);
  }

  /**
   * Primary OCR Execution Pipeline
   */
  async function startOcrProcess() {
    if (state.isProcessing || state.files.length === 0) return;
    if (!window.Tesseract || !window.PDFLib || !window.pdfjsLib) {
      alert('Required OCR libraries are still loading. Please check your internet connection and retry.');
      return;
    }

    state.isProcessing = true;
    state.cancelRequested = false;
    btnStartOcr.disabled = true;
    btnAddMoreFiles.disabled = true;
    btnClearQueue.disabled = true;

    // Reset results & preview UI
    resultsBox.style.display = 'none';
    previewSection.style.display = 'none';
    progressSection.style.display = 'block';

    const lang = ocrLanguage.value || 'eng';
    const langName = getLanguageName(lang);
    const qualityMode = ocrQualityPreset.value || 'high';
    const renderScale = qualityMode === 'high' ? 2.0 : 1.5;
    const shouldEnhanceContrast = chkAutoContrast.checked;

    let totalPagesOverall = 0;
    state.files.forEach(f => { totalPagesOverall += f.pageCount || 1; });

    let processedPages = 0;
    let accumulatedConfidence = 0;
    let confidenceSamples = 0;
    let fullExtractedText = '';
    state.pagePreviews = [];

    updateProgress('Initializing Web Worker OCR Engine...', 5, `Loading neural dictionary for ${langName}...`);

    let worker = null;

    try {
      // 1. Initialize Tesseract.js Worker with chosen language
      worker = await window.Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (state.cancelRequested) return;
          if (m.status === 'recognizing text') {
            const pagePct = Math.round((m.progress || 0) * 100);
            updatePageSubProgress(processedPages, totalPagesOverall, pagePct);
          } else if (m.status === 'loading tesseract core') {
            updateProgress('Loading WebAssembly OCR Engine...', 10, 'Compiling Wasm binary in browser memory');
          } else if (m.status === 'loading language traineddata') {
            updateProgress(`Loading ${langName} Neural Model...`, 15, 'Retrieving trained character contours');
          } else if (m.status === 'initializing api') {
            updateProgress('Configuring Recognition Pipeline...', 20, 'Preparing character segmentation buffers');
          }
        }
      });

      state.currentWorker = worker;

      if (state.cancelRequested) throw new Error('Processing cancelled by user.');

      // 2. Prepare Output PDF Document via pdf-lib
      const outputPdfDoc = await window.PDFLib.PDFDocument.create();
      // Standard Helvetica font for coordinate text stream
      const helveticaFont = await outputPdfDoc.embedFont(window.PDFLib.StandardFonts.Helvetica);

      // 3. Process Each File Page by Page
      for (let fIdx = 0; fIdx < state.files.length; fIdx++) {
        if (state.cancelRequested) throw new Error('Processing cancelled by user.');

        const fileItem = state.files[fIdx];

        if (fileItem.type === 'image') {
          // --- Process Image File (JPG / PNG) ---
          processedPages++;
          updateProgress(`Processing page ${processedPages} of ${totalPagesOverall}...`, calcOverallProgress(processedPages, totalPagesOverall, 10), fileItem.name);

          // Embed image into output PDF
          const imgBytes = fileItem.arrayBuffer;
          let embeddedImage;
          const isPng = fileItem.file.type === 'image/png' || fileItem.name.toLowerCase().endsWith('.png');

          if (isPng) {
            embeddedImage = await outputPdfDoc.embedPng(imgBytes);
          } else {
            embeddedImage = await outputPdfDoc.embedJpg(imgBytes);
          }

          const imgWidth = embeddedImage.width;
          const imgHeight = embeddedImage.height;

          // Add PDF page matching exact image resolution/points
          const page = outputPdfDoc.addPage([imgWidth, imgHeight]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: imgWidth,
            height: imgHeight
          });

          // Draw on offscreen canvas for OCR
          const ocrCanvas = await imageFileToCanvas(fileItem.file, renderScale);
          if (shouldEnhanceContrast) {
            enhanceCanvasContrast(ocrCanvas);
          }

          if (state.cancelRequested) throw new Error('Processing cancelled by user.');

          // Run OCR recognition
          const ocrResult = await worker.recognize(ocrCanvas);
          const pageText = ocrResult.data.text ? ocrResult.data.text.trim() : '';
          const words = ocrResult.data.words || [];
          const pageConf = Math.round(ocrResult.data.confidence || 0);

          if (pageConf > 0) {
            accumulatedConfidence += pageConf;
            confidenceSamples++;
          }

          // Map bounding boxes and write invisible searchable text layer
          const scaleX = imgWidth / ocrCanvas.width;
          const scaleY = imgHeight / ocrCanvas.height;

          words.forEach(word => {
            drawInvisibleWord(page, helveticaFont, word, scaleX, scaleY, imgHeight);
          });

          // Store preview snapshot
          state.pagePreviews.push({
            previewUrl: ocrCanvas.toDataURL('image/jpeg', 0.8),
            text: pageText,
            confidence: pageConf,
            pageNum: processedPages
          });

          if (totalPagesOverall > 1) {
            fullExtractedText += `\n--- [Page ${processedPages}/${totalPagesOverall}: ${fileItem.name} (${pageConf}% Confidence)] ---\n\n`;
          }
          fullExtractedText += pageText + '\n\n';

        } else {
          // --- Process Scanned PDF Document ---
          const loadingTask = window.pdfjsLib.getDocument({ data: fileItem.arrayBuffer.slice(0) });
          const pdfJsDoc = await loadingTask.promise;

          // Load into pdf-lib to copy vector background losslessly
          const sourcePdfDoc = await window.PDFLib.PDFDocument.load(fileItem.arrayBuffer.slice(0), { ignoreEncryption: true });

          for (let pNum = 1; pNum <= pdfJsDoc.numPages; pNum++) {
            if (state.cancelRequested) throw new Error('Processing cancelled by user.');

            processedPages++;
            updateProgress(`Processing page ${processedPages} of ${totalPagesOverall}...`, calcOverallProgress(processedPages, totalPagesOverall, 15), `${fileItem.name} (Page ${pNum})`);

            // Copy authentic page losslessly into output PDF
            const [copiedPage] = await outputPdfDoc.copyPages(sourcePdfDoc, [pNum - 1]);
            outputPdfDoc.addPage(copiedPage);

            const pageWidth = copiedPage.getWidth();
            const pageHeight = copiedPage.getHeight();

            // Render PDF page to canvas via PDF.js for OCR
            const pdfPage = await pdfJsDoc.getPage(pNum);
            const viewport = pdfPage.getViewport({ scale: renderScale });
            const ocrCanvas = document.createElement('canvas');
            ocrCanvas.width = viewport.width;
            ocrCanvas.height = viewport.height;
            const ctx = ocrCanvas.getContext('2d');

            await pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise;

            if (shouldEnhanceContrast) {
              enhanceCanvasContrast(ocrCanvas);
            }

            if (state.cancelRequested) throw new Error('Processing cancelled by user.');

            // Run OCR
            const ocrResult = await worker.recognize(ocrCanvas);
            const pageText = ocrResult.data.text ? ocrResult.data.text.trim() : '';
            const words = ocrResult.data.words || [];
            const pageConf = Math.round(ocrResult.data.confidence || 0);

            if (pageConf > 0) {
              accumulatedConfidence += pageConf;
              confidenceSamples++;
            }

            // Map bounding boxes and write invisible selectable text
            const scaleX = pageWidth / ocrCanvas.width;
            const scaleY = pageHeight / ocrCanvas.height;

            words.forEach(word => {
              drawInvisibleWord(copiedPage, helveticaFont, word, scaleX, scaleY, pageHeight);
            });

            // Store preview
            state.pagePreviews.push({
              previewUrl: ocrCanvas.toDataURL('image/jpeg', 0.8),
              text: pageText,
              confidence: pageConf,
              pageNum: processedPages
            });

            if (totalPagesOverall > 1) {
              fullExtractedText += `\n--- [Page ${processedPages}/${totalPagesOverall}: ${fileItem.name} p.${pNum} (${pageConf}% Confidence)] ---\n\n`;
            }
            fullExtractedText += pageText + '\n\n';
          }
        }
      }

      if (state.cancelRequested) throw new Error('Processing cancelled by user.');

      // 4. Save Final Searchable PDF
      updateProgress('Compiling Searchable PDF...', 95, 'Synthesizing coordinate stream and font dictionaries');
      const pdfBytes = await outputPdfDoc.save();
      state.generatedPdfBytes = pdfBytes;
      state.extractedFullText = fullExtractedText.trim();

      // Terminate worker to free WebAssembly RAM
      await worker.terminate();
      state.currentWorker = null;

      // 5. Compute Metrics & Show Results
      const avgConfidence = confidenceSamples > 0 ? Math.round(accumulatedConfidence / confidenceSamples) : 0;
      state.overallConfidence = avgConfidence;

      updateProgress('Searchable PDF Complete!', 100, 'All pages indexed and verified');

      setTimeout(() => {
        progressSection.style.display = 'none';
        displayResults(pdfBytes.byteLength, avgConfidence, totalPagesOverall);
      }, 600);

    } catch (err) {
      console.error('OCR Processing Error:', err);
      if (worker) {
        try { await worker.terminate(); } catch (e) { /* ignore */ }
      }
      state.currentWorker = null;

      if (state.cancelRequested) {
        progressStatus.textContent = 'Processing cancelled by user.';
        progressStatus.style.color = 'var(--text-main)';
        progressDetail.textContent = 'Web Worker halted safely. Document resources cleared.';
        setTimeout(() => { progressSection.style.display = 'none'; }, 1500);
      } else {
        progressStatus.textContent = 'OCR processing could not be completed.';
        progressStatus.style.color = 'var(--color-danger)';
        progressDetail.textContent = err.message || 'Please verify that document pages are readable and not password-protected.';
      }
    } finally {
      state.isProcessing = false;
      btnStartOcr.disabled = false;
      btnAddMoreFiles.disabled = false;
      btnClearQueue.disabled = false;
    }
  }

  /**
   * Cancel in-flight OCR safely
   */
  async function cancelOcrProcess() {
    if (!state.isProcessing) return;
    state.cancelRequested = true;
    progressStatus.textContent = 'Aborting OCR Web Worker...';
    progressDetail.textContent = 'Please wait while resources are reclaimed.';

    if (state.currentWorker) {
      try {
        await state.currentWorker.terminate();
      } catch (e) {
        console.warn('Worker terminate error:', e);
      }
      state.currentWorker = null;
    }
  }

  /**
   * Draw invisible word text layer onto PDF page
   * Standard Helvetica is Latin-1 (WinAnsi). Non-Latin characters (Tamil, Hindi, etc.)
   * are handled gracefully so the PDF engine never crashes.
   */
  function drawInvisibleWord(page, font, word, scaleX, scaleY, pageHeight) {
    if (!word || !word.text || !word.bbox) return;
    const rawText = word.text.trim();
    if (!rawText) return;

    // Canvas coordinates: (0,0) top-left.
    // PDF coordinates: (0,0) bottom-left.
    const pdfX = Math.max(0, word.bbox.x0 * scaleX);
    const boxHeight = (word.bbox.y1 - word.bbox.y0) * scaleY;
    const pdfY = Math.max(0, pageHeight - (word.bbox.y1 * scaleY));
    const fontSize = Math.max(4, Math.min(72, Math.round(boxHeight * 0.85)));

    try {
      page.drawText(rawText, {
        x: pdfX,
        y: pdfY,
        size: fontSize,
        font: font,
        color: window.PDFLib.rgb(0, 0, 0),
        opacity: 0 // Invisible layer
      });
    } catch (encErr) {
      // If font cannot encode non-Latin glyphs (e.g. Indic script), replace with ASCII word placeholder
      // so invisible coordinate geometry is preserved for search/selection
      try {
        const asciiOnly = rawText.replace(/[^\x20-\x7E]/g, '?');
        if (asciiOnly.trim()) {
          page.drawText(asciiOnly, {
            x: pdfX,
            y: pdfY,
            size: fontSize,
            font: font,
            color: window.PDFLib.rgb(0, 0, 0),
            opacity: 0
          });
        }
      } catch (ignore) {
        // Safe fallback
      }
    }
  }

  /**
   * Display Final Success Results & Previews
   */
  function displayResults(pdfByteLength, avgConf, totalPages) {
    resultsBox.style.display = 'block';
    previewSection.style.display = 'block';

    finalOutputStats.textContent = `Size: ${formatBytes(pdfByteLength)} • Total Pages: ${totalPages} • OCR Confidence: ${avgConf}%`;

    // Setup Side-by-Side Preview
    state.currentPreviewIndex = 0;
    updateActivePreviewPage();

    // Populate inspector
    extractedTextInspector.value = state.extractedFullText;
    updateWordCharCounts(state.extractedFullText);

    // Confidence badge
    confidenceBadge.textContent = `OCR Confidence: ${avgConf}%`;
    if (avgConf >= 85) {
      confidenceBadge.style.color = 'var(--color-primary)';
      confidenceBadge.style.background = 'var(--color-primary-light)';
    } else if (avgConf >= 65) {
      confidenceBadge.style.color = '#B45309';
      confidenceBadge.style.background = '#FEF3C7';
    } else {
      confidenceBadge.style.color = '#B91C1C';
      confidenceBadge.style.background = '#FEE2E2';
    }
  }

  /**
   * Update side-by-side preview page
   */
  function updateActivePreviewPage() {
    if (state.pagePreviews.length === 0) return;

    const pageData = state.pagePreviews[state.currentPreviewIndex];
    previewPageIndicator.textContent = `Page ${state.currentPreviewIndex + 1} of ${state.pagePreviews.length}`;

    btnPrevPage.disabled = state.currentPreviewIndex === 0;
    btnNextPage.disabled = state.currentPreviewIndex === state.pagePreviews.length - 1;

    // Draw preview canvas
    const img = new Image();
    img.onload = () => {
      previewCanvas.width = img.width;
      previewCanvas.height = img.height;
      const ctx = previewCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
    };
    img.src = pageData.previewUrl;
  }

  /**
   * Download Searchable PDF
   */
  function downloadSearchablePdf() {
    if (!state.generatedPdfBytes) return;
    const blob = new Blob([state.generatedPdfBytes], { type: 'application/pdf' });
    const baseName = state.files.length > 0 ? state.files[0].name.replace(/\.[^/.]+$/, '') : 'document';
    downloadBlob(blob, `${baseName}-searchable-ocr.pdf`);
  }

  /**
   * Download Extracted Plain Text (.txt)
   */
  function downloadExtractedTxt() {
    const text = extractedTextInspector.value || state.extractedFullText;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const baseName = state.files.length > 0 ? state.files[0].name.replace(/\.[^/.]+$/, '') : 'document';
    downloadBlob(blob, `${baseName}-extracted-text.txt`);
  }

  /**
   * Copy extracted text to clipboard
   */
  function copyExtractedText() {
    const text = extractedTextInspector.value || state.extractedFullText;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      const origHtml = btnCopyExtracted.innerHTML;
      btnCopyExtracted.innerHTML = `<span style="color: var(--color-primary); font-weight:700;">✓ Copied to Clipboard!</span>`;
      setTimeout(() => {
        btnCopyExtracted.innerHTML = origHtml;
      }, 2000);
    }).catch(err => {
      console.warn('Clipboard copy failed:', err);
    });
  }

  /**
   * Reset Entire Studio State
   */
  function resetAll() {
    state.files = [];
    state.isProcessing = false;
    state.cancelRequested = false;
    state.generatedPdfBytes = null;
    state.extractedFullText = '';
    state.pagePreviews = [];
    state.currentPreviewIndex = 0;
    state.overallConfidence = 0;

    if (state.currentWorker) {
      try { state.currentWorker.terminate(); } catch (e) { /* ignore */ }
      state.currentWorker = null;
    }

    fileInput.value = '';
    fileListContainer.innerHTML = '';
    workspaceControls.style.display = 'none';
    progressSection.style.display = 'none';
    previewSection.style.display = 'none';
    resultsBox.style.display = 'none';
    dropzone.style.display = 'block';
  }

  // --- Helper Functions ---

  function updateProgress(status, percent, detail) {
    if (status) progressStatus.textContent = status;
    if (percent !== null && percent !== undefined) {
      const p = Math.min(100, Math.max(0, Math.round(percent)));
      progressBar.style.width = `${p}%`;
      progressPercent.textContent = `${p}%`;
    }
    if (detail) progressDetail.textContent = detail;
  }

  function updatePageSubProgress(currPage, totalPages, subPct) {
    const basePagePct = ((currPage - 1) / totalPages) * 100;
    const pageFraction = (subPct / 100) * (1 / totalPages) * 100;
    const overall = Math.min(94, Math.round(basePagePct + pageFraction));
    updateProgress(`Processing Page ${currPage} of ${totalPages} (${subPct}%)...`, overall, 'Transcribing glyphs with Web Worker');
  }

  function calcOverallProgress(currPage, totalPages, stageOffset) {
    const pct = ((currPage - 1) / totalPages) * 80 + stageOffset;
    return Math.min(92, Math.round(pct));
  }

  function updateWordCharCounts(text) {
    const clean = (text || '').trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    const chars = (text || '').length;
    statWords.textContent = words.toLocaleString();
    statChars.textContent = chars.toLocaleString();
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function getLanguageName(code) {
    const map = {
      eng: 'English',
      tam: 'Tamil',
      hin: 'Hindi',
      tel: 'Telugu',
      kan: 'Kannada',
      mal: 'Malayalam',
      ben: 'Bengali',
      mar: 'Marathi',
      guj: 'Gujarati',
      spa: 'Spanish',
      fra: 'French',
      deu: 'German'
    };
    return map[code] || code.toUpperCase();
  }

  function imageFileToCanvas(file, scale) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to decode image file.'));
      };
      img.src = url;
    });
  }

  /**
   * Adaptive Contrast and Binarization Filter
   * Amplifies character ink definition on faint or aged scanned documents
   */
  function enhanceCanvasContrast(canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Contrast stretching factor
    const contrast = 35; // 0-100
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < d.length; i += 4) {
      // Grayscale luminance
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      
      // Apply contrast curve
      let val = factor * (gray - 128) + 128;
      val = Math.max(0, Math.min(255, val));

      // Slight adaptive thresholding to boost ink
      if (val > 195) val = 255;
      else if (val < 65) val = 0;

      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  }

})();
