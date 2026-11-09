/**
 * EcrioX Professional Online PDF Workspace
 * 100% Client-Side PDF Viewing, Editing, Electronic Signing, Annotation, and Export
 * Powered by PDF.js & PDF-Lib
 */

(function () {
  'use strict';

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // DOM Elements - Landing
  const landingView = document.getElementById('landing-view');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const btnStartBlank = document.getElementById('btn-start-blank');

  // DOM Elements - Studio
  const editorStudio = document.getElementById('editor-studio');
  const btnCloseStudio = document.getElementById('btn-close-studio');
  const docTitleText = document.getElementById('doc-title-text');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const zoomLevelText = document.getElementById('zoom-level-text');
  const btnFitWidth = document.getElementById('btn-fit-width');
  const btnPrintDoc = document.getElementById('btn-print-doc');
  const btnExportPdf = document.getElementById('btn-export-pdf');

  // Ribbon Tools
  const ribbonTools = document.querySelectorAll('.ribbon-tool-btn[data-tool]');
  const imageUploadInput = document.getElementById('image-upload-input');
  const btnAddBlankPage = document.getElementById('btn-add-blank-page');
  const btnRotateAllPages = document.getElementById('btn-rotate-all-pages');
  const totalPagesCounter = document.getElementById('total-pages-counter');

  // Viewport & Sidebars
  const thumbnailsContainer = document.getElementById('thumbnails-container');
  const studioViewport = document.getElementById('studio-viewport');

  // Properties Inspector
  const propFontFamily = document.getElementById('prop-font-family');
  const propFontSize = document.getElementById('prop-font-size');
  const propFontSizeVal = document.getElementById('prop-font-size-val');
  const propCustomColor = document.getElementById('prop-custom-color');
  const propBgFill = document.getElementById('prop-bg-fill');
  const propStrokeWidth = document.getElementById('prop-stroke-width');
  const propStrokeVal = document.getElementById('prop-stroke-val');
  const propOpacity = document.getElementById('prop-opacity');
  const propOpacityVal = document.getElementById('prop-opacity-val');

  // Modals
  const modalSignature = document.getElementById('modal-signature');
  const btnCloseSigModal = document.getElementById('btn-close-sig-modal');
  const btnCancelSig = document.getElementById('btn-cancel-sig');
  const btnApplySig = document.getElementById('btn-apply-sig');
  const tabSigDraw = document.getElementById('tab-sig-draw');
  const tabSigType = document.getElementById('tab-sig-type');
  const tabSigUpload = document.getElementById('tab-sig-upload');
  const sigModeDrawPane = document.getElementById('sig-mode-draw-pane');
  const sigModeTypePane = document.getElementById('sig-mode-type-pane');
  const sigModeUploadPane = document.getElementById('sig-mode-upload-pane');
  const sigDrawCanvas = document.getElementById('sig-draw-canvas');
  const btnClearSigPad = document.getElementById('btn-clear-sig-pad');
  const sigTypeInput = document.getElementById('sig-type-input');
  const sigCursivePreview = document.getElementById('sig-cursive-preview');
  const sigUploadBox = document.getElementById('sig-upload-box');
  const sigFileInput = document.getElementById('sig-file-input');

  const modalWatermark = document.getElementById('modal-watermark');
  const btnCloseWmModal = document.getElementById('btn-close-wm-modal');
  const btnCancelWm = document.getElementById('btn-cancel-wm');
  const btnApplyWm = document.getElementById('btn-apply-wm');
  const wmTextInput = document.getElementById('wm-text-input');
  const wmAngleSelect = document.getElementById('wm-angle-select');
  const wmOpacitySlider = document.getElementById('wm-opacity-slider');
  const wmOpacityVal = document.getElementById('wm-opacity-val');

  const modalPageNumbers = document.getElementById('modal-page-numbers');
  const btnClosePnModal = document.getElementById('btn-close-pn-modal');
  const btnCancelPn = document.getElementById('btn-cancel-pn');
  const btnApplyPn = document.getElementById('btn-apply-pn');
  const pnPositionSelect = document.getElementById('pn-position-select');
  const pnFormatSelect = document.getElementById('pn-format-select');
  const pnStartNum = document.getElementById('pn-start-num');

  // Application State
  let originalPdfBytes = null;
  let pdfDocProxy = null;
  let docFileName = 'document.pdf';
  let zoomLevel = 1.0; // 1.0 = 100%
  let activeTool = 'select'; // 'select' | 'text' | 'sign' | 'highlight' | 'draw' | 'rect' | 'circle' | 'line' | 'redact'
  let currentColor = '#000000';
  let currentStrokeWidth = 3;
  let currentOpacity = 1.0;
  let selectedObject = null;

  // Pages Array
  // Each entry: { pageIndex, originalPageIndex, rotation: 0, width, height, domObjects: [], overlayDataUrl: null }
  let pageModels = [];
  let activePageIndex = 0;
  let isScrollObserving = false;

  // Signature creation state
  let currentSigMode = 'draw';
  let currentSigColor = '#000000';
  let isDrawingSig = false;
  let activeSignatureDataUrl = null;
  let signatureStash = null;

  // Watermark & Page Numbers Settings
  let watermarkConfig = null;
  let pageNumberConfig = null;

  // History Undo/Redo Stacks
  let historyStack = [];
  let redoStack = [];

  init();

  function init() {
    initLandingEvents();
    initStudioEvents();
    initSignatureEvents();
    initWatermarkEvents();
    initPageNumberEvents();
  }

  // ==========================================
  // LANDING & FILE LOADING
  // ==========================================
  function initLandingEvents() {
    const hash = (window.location.hash || '').toLowerCase();
    const action = (new URLSearchParams(window.location.search).get('action') || '').toLowerCase();
    if (hash === '#sign' || action === 'sign') {
      const heroTitle = document.querySelector('#landing-view h1');
      if (heroTitle) heroTitle.textContent = 'Sign PDF Online Free';
      const heroBadge = document.querySelector('#landing-view .badge');
      if (heroBadge) heroBadge.textContent = 'ELECTRONIC SIGNATURE WORKSPACE • 100% PRIVATE';
      const dropzonePrompt = document.querySelector('#dropzone h3');
      if (dropzonePrompt) dropzonePrompt.innerHTML = 'Drop your PDF here to sign, or <span style="color: var(--color-primary); text-decoration: underline;">browse files</span>';
    }

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
        loadPdfFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        loadPdfFile(e.target.files[0]);
      }
      fileInput.value = '';
    });

    btnStartBlank.addEventListener('click', createBlankDocument);

    // Check URL transfer parameter from homepage hero
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('transfer') === '1' && window.EcrioXHeroTransfer) {
      window.EcrioXHeroTransfer.getStoredFiles().then((transferredFiles) => {
        if (transferredFiles && transferredFiles.length > 0) {
          loadPdfFile(transferredFiles[0]);
          try {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (e) {}
        }
      });
    }
  }

  /**
   * Load PDF File from disk
   */
  async function loadPdfFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document (.pdf).');
      return;
    }

    docFileName = file.name;
    docTitleText.textContent = docFileName;

    try {
      const buffer = await file.arrayBuffer();
      originalPdfBytes = new Uint8Array(buffer);

      pdfDocProxy = await window.pdfjsLib.getDocument({ data: originalPdfBytes.slice() }).promise;
      const count = pdfDocProxy.numPages;

      pageModels = [];
      for (let i = 1; i <= count; i++) {
        const page = await pdfDocProxy.getPage(i);
        const vp = page.getViewport({ scale: 1.0 });
        pageModels.push({
          pageNumber: i,
          originalPageIndex: i - 1,
          rotation: vp.rotation || 0,
          width: vp.width,
          height: vp.height,
          domObjects: []
        });
      }

      openStudio();

    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('Could not open PDF file. It may be corrupted or encrypted with a password.');
    }
  }

  /**
   * Start a blank PDF Document (US Letter: 612 x 792 pt)
   */
  async function createBlankDocument() {
    docFileName = 'blank-document.pdf';
    docTitleText.textContent = docFileName;

    // Create minimal blank PDF using PDF-Lib
    const pdfDoc = await window.PDFLib.PDFDocument.create();
    pdfDoc.addPage([612, 792]);
    originalPdfBytes = await pdfDoc.save();

    pdfDocProxy = await window.pdfjsLib.getDocument({ data: originalPdfBytes.slice() }).promise;

    pageModels = [{
      pageNumber: 1,
      originalPageIndex: 0,
      rotation: 0,
      width: 612,
      height: 792,
      domObjects: []
    }];

    openStudio();
  }

  /**
   * Transition to Editor Studio
   */
  function openStudio() {
    editorStudio.classList.add('open');
    document.body.style.overflow = 'hidden';
    totalPagesCounter.textContent = pageModels.length;

    zoomLevel = 1.0;
    activePageIndex = 0;
    updateZoomDisplay();
    renderAllPages();
    renderThumbnails();
    setActivePage(0);
    initViewportScrollObserver();
    selectTool('select');

    // Handle deep-linked action from homepage (e.g. #sign, #watermark, #rotate, #text)
    const targetAction = (window.location.hash.replace('#', '') || new URLSearchParams(window.location.search).get('action') || '').toLowerCase();
    if (targetAction === 'sign') {
      setTimeout(() => openSignatureModal(), 350);
    } else if (targetAction === 'watermark') {
      setTimeout(() => modalWatermark.classList.add('open'), 350);
    } else if (targetAction === 'rotate') {
      setTimeout(() => rotateAllPages(), 350);
    } else if (targetAction === 'text') {
      selectTool('text');
    }
  }

  /**
   * Close Studio and return to landing view
   */
  function closeStudio() {
    if (confirm('Exit editor? Any unsaved changes will be lost.')) {
      editorStudio.classList.remove('open');
      document.body.style.overflow = '';
      studioViewport.innerHTML = '';
      thumbnailsContainer.innerHTML = '';
      fileInput.value = '';
    }
  }

  // ==========================================
  // STUDIO WORKSPACE EVENTS
  // ==========================================
  function initStudioEvents() {
    btnCloseStudio.addEventListener('click', closeStudio);

    // Zoom Controls
    btnZoomIn.addEventListener('click', () => setZoom(zoomLevel + 0.15));
    btnZoomOut.addEventListener('click', () => setZoom(zoomLevel - 0.15));
    btnFitWidth.addEventListener('click', fitToWidth);

    // Undo / Redo
    btnUndo.addEventListener('click', triggerUndo);
    btnRedo.addEventListener('click', triggerRedo);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (!editorStudio.classList.contains('open')) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) triggerRedo();
        else triggerUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        triggerRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // If an annotation object is selected and user is not typing in a text field
        if (selectedObject && document.activeElement !== selectedObject) {
          e.preventDefault();
          removeDomObject(selectedObject);
        }
      } else if (e.key === 'Escape') {
        selectTool('select');
      }
    });

    // Tool Ribbon Selection
    ribbonTools.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.getAttribute('data-tool');
        if (tool === 'sign') {
          openSignatureModal();
        } else if (tool === 'image') {
          imageUploadInput.click();
        } else if (tool === 'watermark') {
          modalWatermark.classList.add('open');
        } else if (tool === 'page-numbers') {
          modalPageNumbers.classList.add('open');
        } else {
          selectTool(tool);
        }
      });
    });

    // Insert Image from local drive
    imageUploadInput.addEventListener('change', handleImageInsertion);

    // Blank Page & Page Rotation
    btnAddBlankPage.addEventListener('click', insertBlankPage);
    btnRotateAllPages.addEventListener('click', rotateAllPages);

    // Properties Inspector Inputs
    propFontSize.addEventListener('input', (e) => {
      propFontSizeVal.textContent = e.target.value;
      if (selectedObject && selectedObject.classList.contains('editable-text-box')) {
        selectedObject.style.fontSize = e.target.value + 'px';
      }
    });

    propFontFamily.addEventListener('change', (e) => {
      if (selectedObject && selectedObject.classList.contains('editable-text-box')) {
        selectedObject.style.fontFamily = e.target.value;
      }
    });

    propCustomColor.addEventListener('input', (e) => {
      currentColor = e.target.value;
      if (selectedObject && selectedObject.classList.contains('editable-text-box')) {
        selectedObject.style.color = currentColor;
      }
    });

    document.querySelectorAll('.color-swatch-dot[data-color]').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch-dot[data-color]').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentColor = dot.getAttribute('data-color');
        propCustomColor.value = currentColor;
        if (selectedObject && selectedObject.classList.contains('editable-text-box')) {
          selectedObject.style.color = currentColor;
        }
      });
    });

    propBgFill.addEventListener('change', (e) => {
      if (selectedObject && selectedObject.classList.contains('editable-text-box')) {
        selectedObject.style.backgroundColor = e.target.value;
      }
    });

    propStrokeWidth.addEventListener('input', (e) => {
      currentStrokeWidth = parseInt(e.target.value, 10);
      propStrokeVal.textContent = currentStrokeWidth;
    });

    propOpacity.addEventListener('input', (e) => {
      currentOpacity = parseInt(e.target.value, 10) / 100;
      propOpacityVal.textContent = e.target.value;
      if (selectedObject) {
        selectedObject.style.opacity = currentOpacity;
      }
    });

    // Print & Export
    btnPrintDoc.addEventListener('click', printDocument);
    btnExportPdf.addEventListener('click', exportPdfDocument);
  }

  /**
   * Tool Switcher
   */
  function selectTool(toolName) {
    activeTool = toolName;
    ribbonTools.forEach(btn => {
      if (btn.getAttribute('data-tool') === toolName) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Update cursor across all page overlays
    const overlays = document.querySelectorAll('.page-overlay-canvas');
    overlays.forEach(canvas => {
      if (toolName === 'text') canvas.style.cursor = 'text';
      else if (['draw', 'highlight'].includes(toolName)) canvas.style.cursor = 'crosshair';
      else if (['rect', 'circle', 'line', 'redact'].includes(toolName)) canvas.style.cursor = 'crosshair';
      else canvas.style.cursor = 'default';
    });
  }

  // ==========================================
  // ACTIVE PAGE MANAGEMENT & SCROLL TRACKING
  // ==========================================
  function setActivePage(index) {
    if (!pageModels || pageModels.length === 0) return;
    const boundedIndex = Math.max(0, Math.min(index, pageModels.length - 1));
    activePageIndex = boundedIndex;

    // Highlight thumbnail in left sidebar
    const thumbCards = thumbnailsContainer.querySelectorAll('.thumb-card');
    thumbCards.forEach((card, idx) => {
      if (idx === boundedIndex) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Subtle emerald highlight on active page container
    const stageContainers = studioViewport.querySelectorAll('.page-stage-container');
    stageContainers.forEach((cont, idx) => {
      if (idx === boundedIndex) {
        cont.style.boxShadow = '0 0 0 2px var(--color-primary), 0 8px 30px rgba(0,0,0,0.25)';
      } else {
        cont.style.boxShadow = '0 8px 30px rgba(0,0,0,0.25)';
      }
    });
  }

  function initViewportScrollObserver() {
    if (isScrollObserving) return;
    isScrollObserving = true;

    let scrollTimer = null;
    studioViewport.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!editorStudio.classList.contains('open') || pageModels.length === 0) return;
        const vpRect = studioViewport.getBoundingClientRect();
        const vpCenterY = vpRect.top + vpRect.height / 2;

        let bestIndex = 0;
        let minDiff = Infinity;

        pageModels.forEach((_, idx) => {
          const el = document.getElementById(`page-container-${idx}`);
          if (el) {
            const r = el.getBoundingClientRect();
            const elCenterY = r.top + r.height / 2;
            const diff = Math.abs(elCenterY - vpCenterY);
            if (diff < minDiff) {
              minDiff = diff;
              bestIndex = idx;
            }
          }
        });

        if (bestIndex !== activePageIndex) {
          setActivePage(bestIndex);
        }
      }, 80);
    }, { passive: true });
  }

  // ==========================================
  // PAGE RENDERING & THUMBNAILS
  // ==========================================
  async function renderAllPages() {
    // Preserve any user drawings across zooms
    pageModels.forEach((model, pIdx) => {
      const existingCanvas = document.querySelector(`#page-container-${pIdx} .page-overlay-canvas`);
      if (existingCanvas) {
        try {
          const dUrl = existingCanvas.toDataURL('image/png');
          if (dUrl && dUrl.length > 2500) {
            model.overlayDataUrl = dUrl;
          }
        } catch (e) {}
      }
    });

    studioViewport.innerHTML = '';

    for (let pIdx = 0; pIdx < pageModels.length; pIdx++) {
      const model = pageModels[pIdx];
      const pageContainer = document.createElement('div');
      pageContainer.className = 'page-stage-container';
      pageContainer.id = `page-container-${pIdx}`;
      pageContainer.dataset.pageIndex = pIdx;

      // Scale dimensions
      const scaledW = Math.round(model.width * zoomLevel);
      const scaledH = Math.round(model.height * zoomLevel);

      pageContainer.style.width = `${scaledW}px`;
      pageContainer.style.height = `${scaledH}px`;
      if (pIdx === activePageIndex) {
        pageContainer.style.boxShadow = '0 0 0 2px var(--color-primary), 0 8px 30px rgba(0,0,0,0.25)';
      }

      pageContainer.addEventListener('mousedown', () => setActivePage(pIdx));
      pageContainer.addEventListener('click', () => setActivePage(pIdx));

      // 1. Base PDF Canvas
      const baseCanvas = document.createElement('canvas');
      baseCanvas.className = 'page-pdf-canvas';
      baseCanvas.width = scaledW * 1.5; // High-DPI scale
      baseCanvas.height = scaledH * 1.5;
      pageContainer.appendChild(baseCanvas);

      // Render PDF page into baseCanvas
      renderPdfPageCanvas(model, baseCanvas, zoomLevel * 1.5);

      // 2. Annotation & Drawing Overlay Canvas
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'page-overlay-canvas';
      overlayCanvas.width = scaledW;
      overlayCanvas.height = scaledH;
      overlayCanvas.style.width = `${scaledW}px`;
      overlayCanvas.style.height = `${scaledH}px`;
      pageContainer.appendChild(overlayCanvas);

      // Restore drawing if existed
      if (model.overlayDataUrl) {
        const prevImg = new Image();
        prevImg.onload = () => {
          const oCtx = overlayCanvas.getContext('2d');
          oCtx.drawImage(prevImg, 0, 0, scaledW, scaledH);
        };
        prevImg.src = model.overlayDataUrl;
      }

      initOverlayDrawing(overlayCanvas, pIdx);

      // 3. Interactive DOM Object Layer (text boxes, placed signatures, images)
      const domLayer = document.createElement('div');
      domLayer.className = 'dom-object-layer';
      domLayer.id = `dom-layer-${pIdx}`;
      pageContainer.appendChild(domLayer);

      // Re-populate any existing objects on this page
      model.domObjects.forEach(objData => {
        renderDomObject(objData, domLayer, pIdx);
      });

      studioViewport.appendChild(pageContainer);
    }
  }

  /**
   * Render single page with PDF.js
   */
  async function renderPdfPageCanvas(model, canvas, scale) {
    if (!pdfDocProxy || model.originalPageIndex === undefined) {
      // Blank page - draw white canvas
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    try {
      const page = await pdfDocProxy.getPage(model.originalPageIndex + 1);
      const viewport = page.getViewport({ scale: scale, rotation: model.rotation });
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
    } catch (err) {
      console.error('Error rendering page canvas:', err);
    }
  }

  /**
   * Render Left Sidebar Thumbnails
   */
  async function renderThumbnails() {
    thumbnailsContainer.innerHTML = '';

    for (let pIdx = 0; pIdx < pageModels.length; pIdx++) {
      const model = pageModels[pIdx];
      const card = document.createElement('div');
      card.className = `thumb-card ${pIdx === activePageIndex ? 'active' : ''}`;
      card.dataset.pageIndex = pIdx;

      const canvasBox = document.createElement('div');
      canvasBox.className = 'thumb-canvas-box';

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 120;
      thumbCanvas.height = 150;
      canvasBox.appendChild(thumbCanvas);

      // Render thumbnail with PDF.js at small scale
      if (pdfDocProxy && model.originalPageIndex !== undefined) {
        pdfDocProxy.getPage(model.originalPageIndex + 1).then(page => {
          const vp = page.getViewport({ scale: 0.25, rotation: model.rotation });
          thumbCanvas.width = vp.width;
          thumbCanvas.height = vp.height;
          const ctx = thumbCanvas.getContext('2d');
          page.render({ canvasContext: ctx, viewport: vp });
        }).catch(() => {});
      } else {
        const ctx = thumbCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
      }

      const footer = document.createElement('div');
      footer.className = 'thumb-footer';
      footer.innerHTML = `
        <span>Page ${pIdx + 1}</span>
        <div style="display:flex; gap:2px;">
          <button class="thumb-mini-btn" title="Rotate 90°" onclick="event.stopPropagation(); window.rotatePage(${pIdx})">↻</button>
          <button class="thumb-mini-btn" title="Duplicate" onclick="event.stopPropagation(); window.duplicatePage(${pIdx})">⧉</button>
          <button class="thumb-mini-btn" title="Delete" onclick="event.stopPropagation(); window.deletePage(${pIdx})">🗑️</button>
        </div>
      `;

      card.appendChild(canvasBox);
      card.appendChild(footer);

      card.addEventListener('click', () => {
        setActivePage(pIdx);
        document.getElementById(`page-container-${pIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      thumbnailsContainer.appendChild(card);
    }
  }

  // ==========================================
  // OVERLAY DRAWING (PEN, HIGHLIGHT, SHAPES)
  // ==========================================
  function initOverlayDrawing(canvas, pageIndex) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let startX = 0, startY = 0;

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    }

    function onPointerDown(e) {
      if (activeTool === 'select') return;

      const pt = getCoords(e);
      startX = pt.x;
      startY = pt.y;

      if (activeTool === 'text') {
        createTextObjectAt(pageIndex, pt.x, pt.y);
        selectTool('select');
        return;
      }

      if (['draw', 'highlight', 'rect', 'circle', 'line', 'redact'].includes(activeTool)) {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(startX, startY);

        if (activeTool === 'highlight') {
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)'; // Semi-transparent yellow
          ctx.lineWidth = 18;
          ctx.lineCap = 'round';
        } else if (activeTool === 'draw') {
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = currentStrokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }

    function onPointerMove(e) {
      if (!isDrawing) return;
      const pt = getCoords(e);

      if (activeTool === 'draw' || activeTool === 'highlight') {
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }

    function onPointerUp(e) {
      if (!isDrawing) return;
      isDrawing = false;
      const pt = getCoords(e);

      if (activeTool === 'rect') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.strokeRect(startX, startY, pt.x - startX, pt.y - startY);
      } else if (activeTool === 'circle') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentStrokeWidth;
        const radius = Math.sqrt(Math.pow(pt.x - startX, 2) + Math.pow(pt.y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === 'line') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else if (activeTool === 'redact') {
        // Redaction: permanently fill black rectangle
        createRedactionBox(pageIndex, Math.min(startX, pt.x), Math.min(startY, pt.y), Math.abs(pt.x - startX), Math.abs(pt.y - startY));
        selectTool('select');
      }
    }

    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    canvas.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  // ==========================================
  // DOM ANNOTATION OBJECTS (TEXT, SIGNATURES, IMAGES)
  // ==========================================
  function createTextObjectAt(pageIndex, x, y) {
    const domLayer = document.getElementById(`dom-layer-${pageIndex}`);
    if (!domLayer) return;

    const pointX = Math.round(x / zoomLevel);
    const pointY = Math.round(y / zoomLevel);

    const objData = {
      id: 'txt_' + Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: pointX,
      y: pointY,
      text: 'Type text here...',
      fontSize: parseInt(propFontSize.value, 10) || 16,
      fontFamily: propFontFamily.value || 'Helvetica, Arial, sans-serif',
      color: currentColor,
      bgColor: propBgFill.value
    };

    pageModels[pageIndex].domObjects.push(objData);
    renderDomObject(objData, domLayer, pageIndex);
    setActivePage(pageIndex);
  }

  function createRedactionBox(pageIndex, x, y, w, h) {
    const domLayer = document.getElementById(`dom-layer-${pageIndex}`);
    if (!domLayer || w < 5 || h < 5) return;

    const pointX = Math.round(x / zoomLevel);
    const pointY = Math.round(y / zoomLevel);
    const pointW = Math.round(w / zoomLevel);
    const pointH = Math.round(h / zoomLevel);

    const objData = {
      id: 'redact_' + Math.random().toString(36).substr(2, 9),
      type: 'redact',
      x: pointX,
      y: pointY,
      width: pointW,
      height: pointH
    };

    pageModels[pageIndex].domObjects.push(objData);
    renderDomObject(objData, domLayer, pageIndex);
    setActivePage(pageIndex);
  }

  function renderDomObject(objData, domLayer, pageIndex) {
    if (objData.type === 'text') {
      const box = document.createElement('div');
      box.className = 'editable-text-box';
      box.contentEditable = true;
      box.spellcheck = false;
      box.id = objData.id;
      box.style.left = `${Math.round(objData.x * zoomLevel)}px`;
      box.style.top = `${Math.round(objData.y * zoomLevel)}px`;
      box.style.fontSize = `${Math.round((objData.fontSize || 16) * zoomLevel)}px`;
      box.style.fontFamily = objData.fontFamily;
      box.style.color = objData.color;
      box.style.backgroundColor = objData.bgColor || 'transparent';
      box.textContent = objData.text;

      // Close button
      const delBtn = document.createElement('div');
      delBtn.className = 'delete-obj-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'Remove';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeDomObject(box);
      });
      box.appendChild(delBtn);

      box.addEventListener('focus', () => { selectedObject = box; setActivePage(pageIndex); });
      box.addEventListener('input', () => { objData.text = box.textContent; });

      makeElementDraggable(box, objData, pageIndex);
      domLayer.appendChild(box);

    } else if (objData.type === 'signature' || objData.type === 'image') {
      const box = document.createElement('div');
      box.className = 'placed-signature-box';
      box.id = objData.id;
      box.style.left = `${Math.round(objData.x * zoomLevel)}px`;
      box.style.top = `${Math.round(objData.y * zoomLevel)}px`;
      box.style.width = `${Math.round((objData.width || 180) * zoomLevel)}px`;
      box.style.height = `${Math.round((objData.height || 70) * zoomLevel)}px`;

      const img = document.createElement('img');
      img.src = objData.dataUrl;
      img.draggable = false;
      box.appendChild(img);

      const delBtn = document.createElement('div');
      delBtn.className = 'delete-obj-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'Remove';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeDomObject(box);
      });
      box.appendChild(delBtn);

      // Resizing handle for signatures & images
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-obj-handle';
      resizeHandle.title = 'Drag to resize signature';
      box.appendChild(resizeHandle);

      box.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedObject = box;
        setActivePage(pageIndex);
      });

      makeElementDraggable(box, objData, pageIndex);
      makeElementResizable(box, resizeHandle, objData, pageIndex);
      domLayer.appendChild(box);

    } else if (objData.type === 'redact') {
      const box = document.createElement('div');
      box.className = 'placed-redaction-box';
      box.id = objData.id;
      box.style.left = `${Math.round(objData.x * zoomLevel)}px`;
      box.style.top = `${Math.round(objData.y * zoomLevel)}px`;
      box.style.width = `${Math.round((objData.width || 100) * zoomLevel)}px`;
      box.style.height = `${Math.round((objData.height || 30) * zoomLevel)}px`;

      const delBtn = document.createElement('div');
      delBtn.className = 'delete-obj-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'Remove';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeDomObject(box);
      });
      box.appendChild(delBtn);

      box.addEventListener('click', () => { selectedObject = box; setActivePage(pageIndex); });
      makeElementDraggable(box, objData, pageIndex);
      domLayer.appendChild(box);
    }
  }

  function removeDomObject(domEl) {
    const parentContainer = domEl.closest('.page-stage-container');
    if (!parentContainer) return;
    const pageIndex = parseInt(parentContainer.dataset.pageIndex, 10);
    const id = domEl.id;

    if (pageModels[pageIndex]) {
      pageModels[pageIndex].domObjects = pageModels[pageIndex].domObjects.filter(obj => obj.id !== id);
    }
    domEl.remove();
    selectedObject = null;
  }

  /**
   * Universal Dragging Helper for DOM annotation boxes
   */
  function makeElementDraggable(el, objData, pageIndex) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let origLeft = 0, origTop = 0;

    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('delete-obj-btn')) return;
      if (e.target.classList.contains('resize-obj-handle')) return;
      // If user is editing text inside, don't drag immediately
      if (document.activeElement === el && el.isContentEditable) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseInt(el.style.left || '0', 10);
      origTop = parseInt(el.style.top || '0', 10);
      setActivePage(pageIndex);
      e.stopPropagation();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newX = origLeft + dx;
      const newY = origTop + dy;

      const model = pageModels[pageIndex];
      const maxW = (model ? model.width : 612) * zoomLevel;
      const maxH = (model ? model.height : 792) * zoomLevel;
      const clampedX = Math.max(0, Math.min(newX, maxW - 20));
      const clampedY = Math.max(0, Math.min(newY, maxH - 20));

      el.style.left = `${clampedX}px`;
      el.style.top = `${clampedY}px`;
      objData.x = Math.round(clampedX / zoomLevel);
      objData.y = Math.round(clampedY / zoomLevel);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * Resizing Helper with aspect ratio preservation
   */
  function makeElementResizable(el, handle, objData, pageIndex) {
    let isResizing = false;
    let startX = 0, startY = 0;
    let origW = 0, origH = 0;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      origW = parseInt(el.style.width || '180', 10);
      origH = parseInt(el.style.height || '70', 10);
      setActivePage(pageIndex);
      e.stopPropagation();
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const aspectRatio = origW / Math.max(1, origH);
      const newW = Math.max(40, origW + dx);
      const newH = Math.round(newW / aspectRatio);

      el.style.width = `${newW}px`;
      el.style.height = `${newH}px`;
      objData.width = Math.round(newW / zoomLevel);
      objData.height = Math.round(newH / zoomLevel);
    });

    window.addEventListener('mouseup', () => {
      isResizing = false;
    });
  }

  // ==========================================
  // ELECTRONIC SIGNATURE STUDIO
  // ==========================================
  function initSignatureEvents() {
    // Mode Tabs
    tabSigDraw.addEventListener('click', () => setSigMode('draw'));
    tabSigType.addEventListener('click', () => setSigMode('type'));
    tabSigUpload.addEventListener('click', () => setSigMode('upload'));

    // Draw Pad Canvas
    const ctx = sigDrawCanvas.getContext('2d');
    sigDrawCanvas.width = 480;
    sigDrawCanvas.height = 180;

    function getSigCoords(e) {
      const rect = sigDrawCanvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (cx - rect.left) * (sigDrawCanvas.width / rect.width),
        y: (cy - rect.top) * (sigDrawCanvas.height / rect.height)
      };
    }

    sigDrawCanvas.addEventListener('mousedown', (e) => {
      isDrawingSig = true;
      const pt = getSigCoords(e);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.strokeStyle = currentSigColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    });

    sigDrawCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawingSig) return;
      const pt = getSigCoords(e);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    });

    window.addEventListener('mouseup', () => { isDrawingSig = false; });

    // Touch Support for Signature Pad
    sigDrawCanvas.addEventListener('touchstart', (e) => {
      isDrawingSig = true;
      const pt = getSigCoords(e);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.strokeStyle = currentSigColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      e.preventDefault();
    }, { passive: false });

    sigDrawCanvas.addEventListener('touchmove', (e) => {
      if (!isDrawingSig) return;
      const pt = getSigCoords(e);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      e.preventDefault();
    }, { passive: false });

    btnClearSigPad.addEventListener('click', () => {
      ctx.clearRect(0, 0, sigDrawCanvas.width, sigDrawCanvas.height);
    });

    // Signature Colors
    document.querySelectorAll('.color-swatch-dot[data-sig-color]').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch-dot[data-sig-color]').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentSigColor = dot.getAttribute('data-sig-color');
        sigCursivePreview.style.color = currentSigColor;
      });
    });

    // Cursive Type Input
    sigTypeInput.addEventListener('input', (e) => {
      sigCursivePreview.textContent = e.target.value || 'Your Signature';
    });

    document.querySelectorAll('.sig-font-picker').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sig-font-picker').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sigCursivePreview.style.fontFamily = btn.getAttribute('data-font');
      });
    });

    // Upload Signature
    sigUploadBox.addEventListener('click', () => sigFileInput.click());
    sigFileInput.addEventListener('change', handleSigFileChosen);

    // Apply Signature
    btnApplySig.addEventListener('click', applySignatureToDocument);
    btnCancelSig.addEventListener('click', () => modalSignature.classList.remove('open'));
    btnCloseSigModal.addEventListener('click', () => modalSignature.classList.remove('open'));
  }

  function setSigMode(mode) {
    currentSigMode = mode;
    tabSigDraw.className = `btn btn-sm ${mode === 'draw' ? 'btn-primary' : 'btn-secondary'}`;
    tabSigType.className = `btn btn-sm ${mode === 'type' ? 'btn-primary' : 'btn-secondary'}`;
    tabSigUpload.className = `btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-secondary'}`;

    sigModeDrawPane.style.display = mode === 'draw' ? 'block' : 'none';
    sigModeTypePane.style.display = mode === 'type' ? 'block' : 'none';
    sigModeUploadPane.style.display = mode === 'upload' ? 'block' : 'none';
  }

  function openSignatureModal() {
    modalSignature.classList.add('open');
    setSigMode('draw');
  }

  function handleSigFileChosen(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        // Automatic white-background removal for uploaded signature scans
        removeWhiteBackground(ev.target.result).then(cleanDataUrl => {
          activeSignatureDataUrl = cleanDataUrl;
          sigUploadBox.innerHTML = `<img src="${cleanDataUrl}" style="max-height: 120px; max-width: 100%;">`;
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function removeWhiteBackground(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth || img.width;
          c.height = img.naturalHeight || img.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const d = imgData.data;

          // Key out light background pixels (RGB > 215)
          for (let i = 0; i < d.length; i += 4) {
            const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (brightness > 215) {
              d[i + 3] = 0; // Transparent
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch (err) {
          console.warn('Could not key out background:', err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  /**
   * Apply signature to document
   */
  async function applySignatureToDocument() {
    let signatureUrl = null;

    if (currentSigMode === 'draw') {
      const ctx = sigDrawCanvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, sigDrawCanvas.width, sigDrawCanvas.height);
      let hasStrokes = false;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 15) {
          hasStrokes = true;
          break;
        }
      }
      if (!hasStrokes) {
        alert('Please draw your signature on the pad before applying.');
        return;
      }
      signatureUrl = sigDrawCanvas.toDataURL('image/png');
    } else if (currentSigMode === 'type') {
      const text = (sigTypeInput.value || '').trim();
      if (!text) {
        alert('Please enter your name to generate a cursive signature.');
        return;
      }
      const font = sigCursivePreview.style.fontFamily || "'Dancing Script', cursive";
      const measureCanvas = document.createElement('canvas');
      const measureCtx = measureCanvas.getContext('2d');
      measureCtx.font = `56px ${font}`;
      const textMetrics = measureCtx.measureText(text);
      const measuredWidth = Math.max(340, Math.ceil(textMetrics.width) + 60);
      const canvasHeight = 140;

      const c = document.createElement('canvas');
      c.width = measuredWidth;
      c.height = canvasHeight;
      const ctx = c.getContext('2d');
      ctx.font = `56px ${font}`;
      ctx.fillStyle = currentSigColor || '#000000';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 30, canvasHeight / 2);
      signatureUrl = c.toDataURL('image/png');
    } else if (currentSigMode === 'upload') {
      signatureUrl = activeSignatureDataUrl;
      if (!signatureUrl) {
        alert('Please select or upload a signature image first.');
        return;
      }
    }

    if (!signatureUrl) {
      alert('Please draw, type, or upload a signature first.');
      return;
    }

    signatureStash = signatureUrl;
    modalSignature.classList.remove('open');

    // Place signature in target active page
    const targetIdx = (activePageIndex >= 0 && activePageIndex < pageModels.length) ? activePageIndex : 0;
    const targetModel = pageModels[targetIdx];
    const domLayer = document.getElementById(`dom-layer-${targetIdx}`);

    if (domLayer && targetModel) {
      const sigW = 180;
      const sigH = 70;
      // Position signature near bottom-right quadrant of the page
      const posX = Math.round(Math.max(20, (targetModel.width - sigW) / 2));
      const posY = Math.round(Math.max(20, (targetModel.height * 0.72) - (sigH / 2)));

      const objData = {
        id: 'sig_' + Math.random().toString(36).substr(2, 9),
        type: 'signature',
        x: posX,
        y: posY,
        width: sigW,
        height: sigH,
        dataUrl: signatureUrl
      };

      targetModel.domObjects.push(objData);
      renderDomObject(objData, domLayer, targetIdx);
      setActivePage(targetIdx);
      document.getElementById(`page-container-${targetIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    selectTool('select');
  }

  // ==========================================
  // IMAGE INSERTION
  // ==========================================
  function handleImageInsertion(e) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawDataUrl = ev.target.result;
        ensureCompatibleImageDataUrl(rawDataUrl).then(cleanDataUrl => {
          const targetIdx = (activePageIndex >= 0 && activePageIndex < pageModels.length) ? activePageIndex : 0;
          const targetModel = pageModels[targetIdx];
          const domLayer = document.getElementById(`dom-layer-${targetIdx}`);
          if (domLayer && targetModel) {
            const w = 180;
            const h = 130;
            const objData = {
              id: 'img_' + Math.random().toString(36).substr(2, 9),
              type: 'image',
              x: Math.round((targetModel.width - w) / 2),
              y: Math.round((targetModel.height - h) / 2),
              width: w,
              height: h,
              dataUrl: cleanDataUrl
            };
            targetModel.domObjects.push(objData);
            renderDomObject(objData, domLayer, targetIdx);
            setActivePage(targetIdx);
          }
        });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  }

  function ensureCompatibleImageDataUrl(dataUrl) {
    return new Promise((resolve) => {
      if (dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // ==========================================
  // WATERMARK & PAGE NUMBER DIALOGS
  // ==========================================
  function initWatermarkEvents() {
    wmOpacitySlider.addEventListener('input', (e) => {
      wmOpacityVal.textContent = e.target.value;
    });

    btnApplyWm.addEventListener('click', () => {
      watermarkConfig = {
        text: wmTextInput.value || 'CONFIDENTIAL',
        angle: parseInt(wmAngleSelect.value, 10),
        opacity: parseInt(wmOpacitySlider.value, 10) / 100
      };
      modalWatermark.classList.remove('open');
      alert(`Watermark "${watermarkConfig.text}" configured and will be applied to all pages on PDF export!`);
    });

    btnCancelWm.addEventListener('click', () => modalWatermark.classList.remove('open'));
    btnCloseWmModal.addEventListener('click', () => modalWatermark.classList.remove('open'));
  }

  function initPageNumberEvents() {
    btnApplyPn.addEventListener('click', () => {
      pageNumberConfig = {
        position: pnPositionSelect.value,
        format: pnFormatSelect.value,
        startNum: parseInt(pnStartNum.value, 10) || 1
      };
      modalPageNumbers.classList.remove('open');
      alert(`Page numbers configured and will be added to all pages on PDF export!`);
    });

    btnCancelPn.addEventListener('click', () => modalPageNumbers.classList.remove('open'));
    btnClosePnModal.addEventListener('click', () => modalPageNumbers.classList.remove('open'));
  }

  // ==========================================
  // PAGE MANAGEMENT (ROTATE, DUPLICATE, DELETE, BLANK)
  // ==========================================
  window.rotatePage = function (index) {
    if (pageModels[index]) {
      pageModels[index].rotation = (pageModels[index].rotation + 90) % 360;
      const tmp = pageModels[index].width;
      pageModels[index].width = pageModels[index].height;
      pageModels[index].height = tmp;
      renderAllPages();
      renderThumbnails();
      setActivePage(index);
    }
  };

  window.duplicatePage = function (index) {
    if (pageModels[index]) {
      const clone = JSON.parse(JSON.stringify(pageModels[index]));
      clone.domObjects.forEach(obj => {
        obj.id = 'dup_' + Math.random().toString(36).substr(2, 9);
      });
      pageModels.splice(index + 1, 0, clone);
      totalPagesCounter.textContent = pageModels.length;
      renderAllPages();
      renderThumbnails();
      setActivePage(index + 1);
    }
  };

  window.deletePage = function (index) {
    if (pageModels.length <= 1) {
      alert('Document must contain at least one page.');
      return;
    }
    if (confirm(`Delete Page ${index + 1}?`)) {
      pageModels.splice(index, 1);
      if (activePageIndex >= pageModels.length) {
        activePageIndex = pageModels.length - 1;
      }
      totalPagesCounter.textContent = pageModels.length;
      renderAllPages();
      renderThumbnails();
      setActivePage(activePageIndex);
    }
  };

  function insertBlankPage() {
    pageModels.push({
      pageNumber: pageModels.length + 1,
      rotation: 0,
      width: 612,
      height: 792,
      domObjects: []
    });
    totalPagesCounter.textContent = pageModels.length;
    renderAllPages();
    renderThumbnails();
    setActivePage(pageModels.length - 1);
  }

  function rotateAllPages() {
    pageModels.forEach(m => {
      m.rotation = (m.rotation + 90) % 360;
      const tmp = m.width;
      m.width = m.height;
      m.height = tmp;
    });
    renderAllPages();
    renderThumbnails();
    setActivePage(activePageIndex);
  }

  // ==========================================
  // ZOOM & VIEWPORT
  // ==========================================
  function setZoom(newZoom) {
    zoomLevel = Math.max(0.5, Math.min(2.5, Math.round(newZoom * 100) / 100));
    updateZoomDisplay();
    renderAllPages();
  }

  function updateZoomDisplay() {
    zoomLevelText.textContent = `${Math.round(zoomLevel * 100)}%`;
  }

  function fitToWidth() {
    if (pageModels.length === 0) return;
    const viewportWidth = studioViewport.clientWidth - 80;
    const firstPageWidth = pageModels[0].width;
    setZoom(viewportWidth / firstPageWidth);
  }

  // ==========================================
  // UNDO & REDO
  // ==========================================
  function triggerUndo() {
    // Basic undo notification
    console.log('Undo triggered');
  }

  function triggerRedo() {
    console.log('Redo triggered');
  }

  // ==========================================
  // PRINT & EXPORT ENGINE (PDF-LIB)
  // ==========================================
  function printDocument() {
    window.print();
  }

  /**
   * Complete PDF Generation & Export Engine
   */
  async function exportPdfDocument() {
    if (!pageModels || pageModels.length === 0 || !window.PDFLib) {
      alert('No document is currently loaded or PDF engine is not ready.');
      return;
    }

    btnExportPdf.disabled = true;
    const originalBtnText = btnExportPdf.innerHTML;
    btnExportPdf.innerHTML = `
      <svg style="width:16px;height:16px;display:inline-block;vertical-align:middle;animation:spin 1s linear infinite;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      Exporting PDF...
    `;

    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;
      const exportPdf = await PDFDocument.create();

      // Load original PDF to copy base pages if present
      let sourcePdf = null;
      if (originalPdfBytes && originalPdfBytes.length > 0) {
        try {
          sourcePdf = await PDFDocument.load(originalPdfBytes.slice(), { ignoreEncryption: true });
        } catch (e1) {
          console.warn('PDF-Lib standard load with ignoreEncryption failed, trying permissive mode:', e1);
          try {
            sourcePdf = await PDFDocument.load(originalPdfBytes.slice(), { ignoreEncryption: true, throwOnInvalidObject: false });
          } catch (e2) {
            console.error('Failed to load source PDF in PDF-Lib:', e2);
          }
        }
      }

      const helveticaFont = await exportPdf.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await exportPdf.embedFont(StandardFonts.HelveticaBold);

      // Iterate across all configured pages
      for (let pIdx = 0; pIdx < pageModels.length; pIdx++) {
        const model = pageModels[pIdx];
        let targetPage = null;

        if (sourcePdf && model.originalPageIndex !== undefined && model.originalPageIndex < sourcePdf.getPageCount()) {
          try {
            const [copiedPage] = await exportPdf.copyPages(sourcePdf, [model.originalPageIndex]);
            targetPage = exportPdf.addPage(copiedPage);
          } catch (copyErr) {
            console.warn(`Could not copy page ${model.originalPageIndex}:`, copyErr);
          }
        }

        if (!targetPage) {
          targetPage = exportPdf.addPage([model.width, model.height]);
        }

        // Apply page rotation
        if (model.rotation !== undefined) {
          targetPage.setRotation(degrees(model.rotation));
        }

        const pageSize = targetPage.getSize();
        const pdfW = pageSize.width;
        const pdfH = pageSize.height;

        // Scaling factors from model coordinates to PDF points
        const scaleX = pdfW / model.width;
        const scaleY = pdfH / model.height;

        // 1. Burn Overlay Canvas (Drawings, Highlights, Lines, Shapes)
        let overlayDataUrl = model.overlayDataUrl;
        const overlayCanvas = document.querySelector(`#page-container-${pIdx} .page-overlay-canvas`);
        if (overlayCanvas) {
          try {
            const currentUrl = overlayCanvas.toDataURL('image/png');
            if (currentUrl && currentUrl.length > 2500) {
              overlayDataUrl = currentUrl;
            }
          } catch (e) {}
        }

        if (overlayDataUrl && overlayDataUrl.length > 2500) {
          try {
            const overlayBytes = dataUrlToUint8Array(overlayDataUrl);
            const embeddedOverlay = await exportPdf.embedPng(overlayBytes);
            targetPage.drawImage(embeddedOverlay, {
              x: 0,
              y: 0,
              width: pdfW,
              height: pdfH
            });
          } catch (drawErr) {
            console.warn('Error embedding overlay canvas:', drawErr);
          }
        }

        // 2. Burn DOM Objects (Text, Signatures, Redactions, Images)
        for (const obj of model.domObjects) {
          const objW = (obj.width || 180) * scaleX;
          const objH = (obj.height || 70) * scaleY;
          const pdfX = obj.x * scaleX;
          const pdfY = pdfH - ((obj.y + (obj.height || 70)) * scaleY);

          if (obj.type === 'text') {
            const fontSizePt = Math.max(6, Math.round((obj.fontSize || 16) * 0.75 * scaleY));
            const textY = pdfH - ((obj.y + (obj.fontSize || 16) * 0.9) * scaleY);

            // If background whiteout fill is set
            if (obj.bgColor && obj.bgColor !== 'transparent') {
              const bgRgb = hexToRgb(obj.bgColor);
              const textWidthEst = Math.max(60, ((obj.text || '').length * (fontSizePt * 0.6)));
              targetPage.drawRectangle({
                x: pdfX,
                y: pdfY,
                width: textWidthEst,
                height: (obj.fontSize || 16) * scaleY * 1.3,
                color: rgb(bgRgb.r, bgRgb.g, bgRgb.b)
              });
            }

            const textRgb = hexToRgb(obj.color || '#000000');
            targetPage.drawText(obj.text || '', {
              x: pdfX,
              y: textY,
              size: fontSizePt,
              font: helveticaFont,
              color: rgb(textRgb.r, textRgb.g, textRgb.b)
            });

          } else if (obj.type === 'signature' || obj.type === 'image') {
            if (obj.dataUrl) {
              try {
                const imgBytes = dataUrlToUint8Array(obj.dataUrl);
                let embeddedImg;
                if (obj.dataUrl.startsWith('data:image/jpeg') || obj.dataUrl.startsWith('data:image/jpg')) {
                  embeddedImg = await exportPdf.embedJpg(imgBytes);
                } else {
                  embeddedImg = await exportPdf.embedPng(imgBytes);
                }

                targetPage.drawImage(embeddedImg, {
                  x: pdfX,
                  y: pdfY,
                  width: objW,
                  height: objH
                });
              } catch (imgErr) {
                console.error('Error embedding signature/image:', imgErr);
              }
            }

          } else if (obj.type === 'redact') {
            targetPage.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: objW,
              height: objH,
              color: rgb(0, 0, 0)
            });
          }
        }

        // 3. Apply Watermark if active
        if (watermarkConfig && watermarkConfig.text) {
          targetPage.drawText(watermarkConfig.text, {
            x: pdfW / 4,
            y: pdfH / 2,
            size: 48,
            font: helveticaBold,
            color: rgb(0.5, 0.5, 0.5),
            rotate: degrees(watermarkConfig.angle || -45),
            opacity: watermarkConfig.opacity || 0.2
          });
        }

        // 4. Apply Page Numbers if active
        if (pageNumberConfig) {
          const n = pageNumberConfig.startNum + pIdx;
          const total = pageNumberConfig.startNum + pageModels.length - 1;
          const text = pageNumberConfig.format.replace('{n}', n).replace('{total}', total);

          let pnX = pdfW / 2 - 25;
          let pnY = 25;

          if (pageNumberConfig.position === 'bottom-right') pnX = pdfW - 80;
          else if (pageNumberConfig.position === 'top-center') pnY = pdfH - 25;
          else if (pageNumberConfig.position === 'top-right') { pnX = pdfW - 80; pnY = pdfH - 25; }

          targetPage.drawText(text, {
            x: pnX,
            y: pnY,
            size: 10,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3)
          });
        }
      }

      // 5. Save and trigger download
      btnExportPdf.textContent = 'Saving PDF...';
      const exportedBytes = await exportPdf.save();
      const blob = new Blob([exportedBytes], { type: 'application/pdf' });

      const baseName = docFileName.replace(/\.[^/.]+$/, '') || 'document';
      const outputFilename = `ecriox-signed-${baseName}.pdf`;

      downloadBlob(blob, outputFilename);

      btnExportPdf.innerHTML = '✓ Download Started!';
      setTimeout(() => {
        btnExportPdf.disabled = false;
        btnExportPdf.innerHTML = originalBtnText;
      }, 2500);

    } catch (err) {
      console.error('Export error caught:', err);
      alert('Could not export PDF: ' + err.message);
      btnExportPdf.disabled = false;
      btnExportPdf.innerHTML = originalBtnText;
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 60000);
  }

  function dataUrlToUint8Array(dataUrl) {
    const commaIdx = dataUrl.indexOf(',');
    const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255
    };
  }

})();
