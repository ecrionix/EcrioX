/**
 * EcrioX - Advanced PDF Organizer
 * Professional, client-side PDF page management engine
 * Powered by PDF.js, pdf-lib, and SortableJS
 */

(() => {
  'use strict';

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // --- STATE ---
  const state = {
    // Array of original PDF file objects & ArrayBuffers: { id, name, buffer, pdfJsDoc, pdfLibDoc }
    documents: [],
    // Logical list of pages in current workspace sequence
    // Each item: { id: string, docIdx: number, pageIdx: number, rotation: number, originalDocName: string }
    pageList: [],
    // Selected page IDs: Set<string>
    selectedIds: new Set(),
    // Last clicked page index for Shift-selection
    lastClickedIdx: -1,
    // History stack for Undo / Redo (array of pageList copies)
    history: [],
    historyIndex: -1,
    isProcessing: false,
    sortableInstance: null
  };

  // --- DOM ELEMENTS ---
  const els = {
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    browseBtn: document.getElementById('browseBtn'),
    insertFileInput: document.getElementById('insertFileInput'),
    workspace: document.getElementById('organizerWorkspace'),
    thumbContainer: document.getElementById('thumbContainer'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingStatusText: document.getElementById('loadingStatusText'),
    toast: document.getElementById('toastNotification'),
    
    // Toolbar buttons
    selectAllBtn: document.getElementById('selectAllBtn'),
    deselectAllBtn: document.getElementById('deselectAllBtn'),
    rotateLeftBtn: document.getElementById('rotateLeftBtn'),
    rotateRightBtn: document.getElementById('rotateRightBtn'),
    duplicateBtn: document.getElementById('duplicateBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    extractBtn: document.getElementById('extractBtn'),
    insertBtn: document.getElementById('insertBtn'),
    reverseBtn: document.getElementById('reverseBtn'),
    sortBtn: document.getElementById('sortBtn'),
    deleteBlankBtn: document.getElementById('deleteBlankBtn'),
    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    zoomSlider: document.getElementById('zoomSlider'),

    // Bottom dock
    totalPagesInfo: document.getElementById('totalPagesInfo'),
    selectedPagesInfo: document.getElementById('selectedPagesInfo'),
    resetBtn: document.getElementById('resetBtn'),
    downloadSelectedBtn: document.getElementById('downloadSelectedBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    downloadBtnText: document.getElementById('downloadBtnText')
  };

  // Unique ID generator for pages
  let uidCounter = 0;
  function generatePageId() {
    return 'pg_' + (++uidCounter) + '_' + Date.now().toString(36);
  }

  // --- TOAST NOTIFICATION ---
  let toastTimer = null;
  function showToast(message, duration = 3000) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.style.display = 'none';
    }, duration);
  }

  // --- HISTORY & UNDO / REDO ---
  function pushHistoryState() {
    // If not at the end of history, truncate redo branch
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    // Deep clone current pageList
    const snapshot = state.pageList.map(p => ({ ...p }));
    state.history.push(snapshot);
    // Limit history stack size to 35 steps
    if (state.history.length > 35) {
      state.history.shift();
    } else {
      state.historyIndex++;
    }
    updateToolbarState();
  }

  function applyHistoryState(index) {
    if (index < 0 || index >= state.history.length) return;
    state.historyIndex = index;
    const snapshot = state.history[index];
    state.pageList = snapshot.map(p => ({ ...p }));
    // Filter selection to existing pages
    const currentIdSet = new Set(state.pageList.map(p => p.id));
    for (const id of state.selectedIds) {
      if (!currentIdSet.has(id)) state.selectedIds.delete(id);
    }
    renderThumbnailsGrid();
    updateToolbarState();
  }

  function undo() {
    if (state.historyIndex > 0) {
      applyHistoryState(state.historyIndex - 1);
      showToast('Undo successful');
    }
  }

  function redo() {
    if (state.historyIndex < state.history.length - 1) {
      applyHistoryState(state.historyIndex + 1);
      showToast('Redo successful');
    }
  }

  // --- FILE INGESTION & DOCUMENT LOADING ---
  async function loadPdfFiles(files, isInsertion = false) {
    if (!files || files.length === 0) return;
    
    els.loadingOverlay.style.display = 'flex';
    els.loadingStatusText.textContent = `Reading ${files.length} document${files.length > 1 ? 's' : ''}...`;

    try {
      const newPages = [];

      for (let f = 0; f < files.length; f++) {
        const file = files[f];
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) continue;

        els.loadingStatusText.textContent = `Loading ${file.name} (${f + 1} of ${files.length})...`;
        const buffer = await file.arrayBuffer();

        // Check encryption / password protection gracefully
        let pdfJsDoc;
        try {
          const loadingTask = window.pdfjsLib.getDocument({ data: buffer.slice(0) });
          pdfJsDoc = await loadingTask.promise;
        } catch (err) {
          if (err.name === 'PasswordException' || (err.message && err.message.includes('password'))) {
            alert(`File "${file.name}" is password-protected or encrypted. Please remove password protection before organizing.`);
            continue;
          } else {
            console.warn(`Could not parse ${file.name}:`, err);
            alert(`Could not open "${file.name}". The document may be corrupted or malformed.`);
            continue;
          }
        }

        const docIdx = state.documents.length;
        state.documents.push({
          id: 'doc_' + docIdx,
          name: file.name,
          buffer: buffer,
          pdfJsDoc: pdfJsDoc,
          pdfLibDoc: null, // lazy loaded
          pageCount: pdfJsDoc.numPages
        });

        for (let p = 0; p < pdfJsDoc.numPages; p++) {
          newPages.push({
            id: generatePageId(),
            docIdx: docIdx,
            pageIdx: p,
            rotation: 0,
            originalDocName: file.name
          });
        }
      }

      if (state.documents.length === 0) {
        els.loadingOverlay.style.display = 'none';
        return;
      }

      if (isInsertion && state.pageList.length > 0) {
        // Insert after currently selected page, or at end
        let insertIndex = state.pageList.length;
        if (state.selectedIds.size > 0) {
          for (let i = state.pageList.length - 1; i >= 0; i--) {
            if (state.selectedIds.has(state.pageList[i].id)) {
              insertIndex = i + 1;
              break;
            }
          }
        }
        state.pageList.splice(insertIndex, 0, ...newPages);
        showToast(`Inserted ${newPages.length} pages from PDF`);
      } else {
        state.pageList.push(...newPages);
      }

      // Switch view to workspace
      els.dropzone.style.display = 'none';
      els.workspace.style.display = 'flex';

      // Push initial history state
      pushHistoryState();

      // Render grid
      await renderThumbnailsGrid();
      showToast(`Loaded ${state.pageList.length} pages total`);

    } catch (err) {
      console.error('File load error:', err);
      alert('An error occurred while loading PDF documents: ' + err.message);
    } finally {
      els.loadingOverlay.style.display = 'none';
    }
  }

  // --- RENDERING THUMBNAILS ---
  async function renderThumbnailsGrid() {
    if (!els.thumbContainer) return;
    els.thumbContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < state.pageList.length; i++) {
      const pageItem = state.pageList[i];
      const card = createPageCardElement(pageItem, i);
      fragment.appendChild(card);
    }

    els.thumbContainer.appendChild(fragment);
    initSortable();
    updateToolbarState();

    // Render individual canvases asynchronously
    for (let i = 0; i < state.pageList.length; i++) {
      const pageItem = state.pageList[i];
      renderPageCanvas(pageItem);
    }
  }

  function createPageCardElement(pageItem, index) {
    const card = document.createElement('div');
    card.className = 'page-card' + (state.selectedIds.has(pageItem.id) ? ' selected' : '');
    card.dataset.id = pageItem.id;
    card.dataset.index = index;

    // Header bar (Page number & Checkbox)
    const header = document.createElement('div');
    header.className = 'card-header-bar';
    
    const badge = document.createElement('span');
    badge.className = 'card-num-badge';
    badge.textContent = `Page ${index + 1}`;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'card-checkbox';
    checkbox.checked = state.selectedIds.has(pageItem.id);
    checkbox.title = 'Select Page';
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSelectPage(pageItem.id, index, e.shiftKey, true);
    });

    header.appendChild(badge);
    header.appendChild(checkbox);

    // Canvas Viewport
    const viewport = document.createElement('div');
    viewport.className = 'card-canvas-viewport';

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'card-canvas-container';
    canvasContainer.id = `canvas_wrap_${pageItem.id}`;
    canvasContainer.style.transform = `rotate(${pageItem.rotation}deg)`;

    const canvas = document.createElement('canvas');
    canvas.id = `canvas_${pageItem.id}`;
    canvasContainer.appendChild(canvas);
    viewport.appendChild(canvasContainer);

    // Hover Quick Action Bar
    const hoverActions = document.createElement('div');
    hoverActions.className = 'card-hover-actions';

    // Quick Rotate Left
    const btnRotL = document.createElement('button');
    btnRotL.type = 'button';
    btnRotL.className = 'quick-action-btn';
    btnRotL.title = 'Rotate 90° Left';
    btnRotL.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`;
    btnRotL.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateSinglePage(pageItem.id, -90);
    });

    // Quick Rotate Right
    const btnRotR = document.createElement('button');
    btnRotR.type = 'button';
    btnRotR.className = 'quick-action-btn';
    btnRotR.title = 'Rotate 90° Right';
    btnRotR.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`;
    btnRotR.addEventListener('click', (e) => {
      e.stopPropagation();
      rotateSinglePage(pageItem.id, 90);
    });

    // Quick Duplicate
    const btnDup = document.createElement('button');
    btnDup.type = 'button';
    btnDup.className = 'quick-action-btn';
    btnDup.title = 'Duplicate Page';
    btnDup.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    btnDup.addEventListener('click', (e) => {
      e.stopPropagation();
      duplicateSinglePage(pageItem.id);
    });

    // Quick Delete
    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'quick-action-btn quick-delete';
    btnDel.title = 'Delete Page';
    btnDel.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    btnDel.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSinglePage(pageItem.id);
    });

    hoverActions.appendChild(btnRotL);
    hoverActions.appendChild(btnRotR);
    hoverActions.appendChild(btnDup);
    hoverActions.appendChild(btnDel);
    viewport.appendChild(hoverActions);

    // Footer info
    const footer = document.createElement('div');
    footer.className = 'card-footer-info';
    
    const srcDocLabel = document.createElement('span');
    srcDocLabel.style.overflow = 'hidden';
    srcDocLabel.style.textOverflow = 'ellipsis';
    srcDocLabel.style.whiteSpace = 'nowrap';
    srcDocLabel.style.maxWidth = '100px';
    srcDocLabel.title = pageItem.originalDocName;
    srcDocLabel.textContent = pageItem.originalDocName;

    const dragHint = document.createElement('div');
    dragHint.className = 'card-drag-hint';
    dragHint.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`;

    footer.appendChild(srcDocLabel);
    footer.appendChild(dragHint);

    card.appendChild(header);
    card.appendChild(viewport);
    card.appendChild(footer);

    // Card click event for selection
    card.addEventListener('click', (e) => {
      const isMulti = e.ctrlKey || e.metaKey;
      const isRange = e.shiftKey;
      toggleSelectPage(pageItem.id, index, isRange, isMulti);
    });

    return card;
  }

  async function renderPageCanvas(pageItem) {
    const canvas = document.getElementById(`canvas_${pageItem.id}`);
    if (!canvas) return;

    const docObj = state.documents[pageItem.docIdx];
    if (!docObj || !docObj.pdfJsDoc) return;

    try {
      const page = await docObj.pdfJsDoc.getPage(pageItem.pageIdx + 1);
      // Base thumbnail target resolution (width: 280px for crisp Retina display)
      const unscaledViewport = page.getViewport({ scale: 1 });
      const targetWidth = 280;
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale: scale });

      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.warn(`Error rendering thumbnail for page ${pageItem.id}:`, err);
    }
  }

  // --- SORTABLE DRAG AND DROP ---
  function initSortable() {
    if (state.sortableInstance) {
      state.sortableInstance.destroy();
    }
    if (!window.Sortable || !els.thumbContainer) return;

    state.sortableInstance = new window.Sortable(els.thumbContainer, {
      animation: 180,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      handle: '.page-card',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt;
        if (oldIndex === newIndex) return;

        // Sync state.pageList with the new order
        const [movedItem] = state.pageList.splice(oldIndex, 1);
        state.pageList.splice(newIndex, 0, movedItem);

        // Update all page number badges in the DOM without full re-render
        syncPageNumberBadges();
        pushHistoryState();
      }
    });
  }

  function syncPageNumberBadges() {
    const cards = els.thumbContainer.querySelectorAll('.page-card');
    cards.forEach((card, idx) => {
      card.dataset.index = idx;
      const badge = card.querySelector('.card-num-badge');
      if (badge) badge.textContent = `Page ${idx + 1}`;
    });
  }

  // --- SELECTION LOGIC ---
  function toggleSelectPage(id, index, isRange = false, isMulti = false) {
    if (isRange && state.lastClickedIdx !== -1) {
      // Range selection between lastClickedIdx and index
      const start = Math.min(state.lastClickedIdx, index);
      const end = Math.max(state.lastClickedIdx, index);
      for (let i = start; i <= end; i++) {
        if (state.pageList[i]) state.selectedIds.add(state.pageList[i].id);
      }
    } else if (isMulti) {
      // Toggle single item in multi-select
      if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
      } else {
        state.selectedIds.add(id);
      }
      state.lastClickedIdx = index;
    } else {
      // Single selection: if already sole selection, clear; otherwise select only this
      if (state.selectedIds.has(id) && state.selectedIds.size === 1) {
        state.selectedIds.clear();
      } else {
        state.selectedIds.clear();
        state.selectedIds.add(id);
      }
      state.lastClickedIdx = index;
    }

    updateSelectionUI();
    updateToolbarState();
  }

  function selectAllPages() {
    state.pageList.forEach(p => state.selectedIds.add(p.id));
    updateSelectionUI();
    updateToolbarState();
  }

  function deselectAllPages() {
    state.selectedIds.clear();
    updateSelectionUI();
    updateToolbarState();
  }

  function updateSelectionUI() {
    const cards = els.thumbContainer.querySelectorAll('.page-card');
    cards.forEach(card => {
      const id = card.dataset.id;
      const isSel = state.selectedIds.has(id);
      card.classList.toggle('selected', isSel);
      const chk = card.querySelector('.card-checkbox');
      if (chk) chk.checked = isSel;
    });
  }

  function updateToolbarState() {
    const totalCount = state.pageList.length;
    const selCount = state.selectedIds.size;

    // Bottom badges
    els.totalPagesInfo.textContent = totalCount;
    els.selectedPagesInfo.textContent = selCount;

    // Toolbar buttons state
    const hasSelection = selCount > 0;
    const hasPages = totalCount > 0;

    els.rotateLeftBtn.disabled = !hasSelection;
    els.rotateRightBtn.disabled = !hasSelection;
    els.duplicateBtn.disabled = !hasSelection;
    els.deleteBtn.disabled = !hasSelection;
    els.extractBtn.disabled = !hasSelection;

    els.selectAllBtn.disabled = !hasPages;
    els.deselectAllBtn.disabled = !hasSelection;
    els.reverseBtn.disabled = totalCount < 2;
    els.sortBtn.disabled = totalCount < 2;
    els.deleteBlankBtn.disabled = !hasPages;

    els.undoBtn.disabled = state.historyIndex <= 0;
    els.redoBtn.disabled = state.historyIndex >= state.history.length - 1;

    els.resetBtn.disabled = state.historyIndex <= 0;
    els.downloadBtn.disabled = !hasPages;

    if (selCount > 0) {
      els.downloadSelectedBtn.style.display = 'inline-block';
      els.downloadSelectedBtn.textContent = `Download Selected (${selCount})`;
    } else {
      els.downloadSelectedBtn.style.display = 'none';
    }
  }

  // --- PAGE OPERATIONS ---
  function rotateSinglePage(id, deltaDegrees) {
    const pageItem = state.pageList.find(p => p.id === id);
    if (!pageItem) return;
    pageItem.rotation = (pageItem.rotation + deltaDegrees + 360) % 360;
    const wrap = document.getElementById(`canvas_wrap_${id}`);
    if (wrap) wrap.style.transform = `rotate(${pageItem.rotation}deg)`;
    pushHistoryState();
  }

  function rotateSelectedPages(deltaDegrees) {
    if (state.selectedIds.size === 0) return;
    state.selectedIds.forEach(id => {
      const pageItem = state.pageList.find(p => p.id === id);
      if (pageItem) {
        pageItem.rotation = (pageItem.rotation + deltaDegrees + 360) % 360;
        const wrap = document.getElementById(`canvas_wrap_${id}`);
        if (wrap) wrap.style.transform = `rotate(${pageItem.rotation}deg)`;
      }
    });
    pushHistoryState();
    showToast(`Rotated ${state.selectedIds.size} page(s)`);
  }

  function deleteSinglePage(id) {
    if (state.pageList.length <= 1) {
      alert('Cannot delete the last remaining page of the document.');
      return;
    }
    const idx = state.pageList.findIndex(p => p.id === id);
    if (idx === -1) return;
    state.pageList.splice(idx, 1);
    state.selectedIds.delete(id);
    renderThumbnailsGrid();
    pushHistoryState();
    showToast('Deleted 1 page');
  }

  function deleteSelectedPages() {
    if (state.selectedIds.size === 0) return;
    if (state.selectedIds.size >= state.pageList.length) {
      alert('Cannot delete all pages. At least 1 page must remain in the document.');
      return;
    }
    const count = state.selectedIds.size;
    if (!confirm(`Delete ${count} selected page(s)?`)) return;

    state.pageList = state.pageList.filter(p => !state.selectedIds.has(p.id));
    state.selectedIds.clear();
    renderThumbnailsGrid();
    pushHistoryState();
    showToast(`Deleted ${count} page(s)`);
  }

  function duplicateSinglePage(id) {
    const idx = state.pageList.findIndex(p => p.id === id);
    if (idx === -1) return;
    const src = state.pageList[idx];
    const copy = {
      ...src,
      id: generatePageId()
    };
    state.pageList.splice(idx + 1, 0, copy);
    renderThumbnailsGrid();
    pushHistoryState();
    showToast('Duplicated 1 page');
  }

  function duplicateSelectedPages() {
    if (state.selectedIds.size === 0) return;
    // Process in descending index order so inserted pages don't shift subsequent targets
    const selectedIndices = [];
    state.pageList.forEach((p, idx) => {
      if (state.selectedIds.has(p.id)) selectedIndices.push(idx);
    });

    selectedIndices.sort((a, b) => b - a);

    selectedIndices.forEach(idx => {
      const src = state.pageList[idx];
      const copy = {
        ...src,
        id: generatePageId()
      };
      state.pageList.splice(idx + 1, 0, copy);
    });

    renderThumbnailsGrid();
    pushHistoryState();
    showToast(`Duplicated ${selectedIndices.length} page(s)`);
  }

  function reverseAllPages() {
    if (state.pageList.length < 2) return;
    state.pageList.reverse();
    renderThumbnailsGrid();
    pushHistoryState();
    showToast('Reversed all pages');
  }

  function sortOriginalSequence() {
    if (state.pageList.length < 2) return;
    state.pageList.sort((a, b) => {
      if (a.docIdx !== b.docIdx) return a.docIdx - b.docIdx;
      return a.pageIdx - b.pageIdx;
    });
    renderThumbnailsGrid();
    pushHistoryState();
    showToast('Restored original document sequence');
  }

  async function deleteBlankPages() {
    if (state.pageList.length === 0) return;

    els.loadingOverlay.style.display = 'flex';
    els.loadingStatusText.textContent = 'Scanning document for blank pages...';

    try {
      const blankPageIds = [];

      for (let i = 0; i < state.pageList.length; i++) {
        const item = state.pageList[i];
        const docObj = state.documents[item.docIdx];
        if (!docObj || !docObj.pdfJsDoc) continue;

        const page = await docObj.pdfJsDoc.getPage(item.pageIdx + 1);
        const textContent = await page.getTextContent();
        
        // If text items exist, it's not a blank page
        if (textContent.items.length > 0) continue;

        // Render small 100px test canvas to check visual raster emptiness
        const viewport = page.getViewport({ scale: 100 / page.getViewport({ scale: 1 }).width });
        const testCanvas = document.createElement('canvas');
        testCanvas.width = viewport.width;
        testCanvas.height = viewport.height;
        const ctx = testCanvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        // Sample pixels to verify near 100% white luminance
        const imgData = ctx.getImageData(0, 0, testCanvas.width, testCanvas.height);
        const data = imgData.data;
        let nonWhitePixels = 0;
        const totalPixels = data.length / 4;

        for (let p = 0; p < data.length; p += 4) {
          const r = data[p], g = data[p + 1], b = data[p + 2], a = data[p + 3];
          if (a > 30 && (r < 240 || g < 240 || b < 240)) {
            nonWhitePixels++;
          }
        }

        const ratio = nonWhitePixels / totalPixels;
        if (ratio < 0.005) { // less than 0.5% non-white content
          blankPageIds.push({ id: item.id, num: i + 1 });
        }
      }

      els.loadingOverlay.style.display = 'none';

      if (blankPageIds.length === 0) {
        alert('No blank pages detected. All pages contain text or visual content.');
        return;
      }

      if (blankPageIds.length >= state.pageList.length) {
        alert(`Detected ${blankPageIds.length} blank page(s), but deleting all of them would empty the document.`);
        return;
      }

      const listStr = blankPageIds.map(b => b.num).join(', ');
      if (!confirm(`Detected ${blankPageIds.length} blank page(s) (Page ${listStr}). Delete them now?`)) {
        return;
      }

      const blankIdSet = new Set(blankPageIds.map(b => b.id));
      state.pageList = state.pageList.filter(p => !blankIdSet.has(p.id));
      state.selectedIds.clear();
      renderThumbnailsGrid();
      pushHistoryState();
      showToast(`Removed ${blankPageIds.length} blank page(s)`);

    } catch (err) {
      console.error('Blank page scan error:', err);
      alert('Error during blank page detection: ' + err.message);
    } finally {
      els.loadingOverlay.style.display = 'none';
    }
  }

  function resetAllChanges() {
    if (state.history.length === 0) return;
    if (!confirm('Reset all changes and revert to the original uploaded document state?')) return;
    applyHistoryState(0);
    showToast('Reset to original state');
  }

  // --- PDF EXPORT ENGINE (pdf-lib) ---
  async function loadPdfLibDoc(docIdx) {
    const docObj = state.documents[docIdx];
    if (docObj.pdfLibDoc) return docObj.pdfLibDoc;

    const pdfLibDoc = await window.PDFLib.PDFDocument.load(docObj.buffer.slice(0), {
      ignoreEncryption: true
    });
    docObj.pdfLibDoc = pdfLibDoc;
    return pdfLibDoc;
  }

  async function exportPdf(pagesToExport, outputFilename) {
    if (!pagesToExport || pagesToExport.length === 0) {
      alert('No pages selected to export.');
      return;
    }

    els.loadingOverlay.style.display = 'flex';
    els.loadingStatusText.textContent = `Compiling ${pagesToExport.length} page(s) into PDF...`;

    try {
      const mergedPdf = await window.PDFLib.PDFDocument.create();

      // Group consecutive pages by source document index for fast batch copying
      for (let i = 0; i < pagesToExport.length; i++) {
        const item = pagesToExport[i];
        els.loadingStatusText.textContent = `Processing page ${i + 1} of ${pagesToExport.length}...`;

        const srcDoc = await loadPdfLibDoc(item.docIdx);
        const [copiedPage] = await mergedPdf.copyPages(srcDoc, [item.pageIdx]);

        // Apply rotation
        if (item.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          const finalRotation = (currentRotation + item.rotation + 360) % 360;
          copiedPage.setRotation(window.PDFLib.degrees(finalRotation));
        }

        mergedPdf.addPage(copiedPage);
      }

      els.loadingStatusText.textContent = 'Generating PDF binary...';
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = outputFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Delayed revocation prevents Chromium stream abort
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);

      showToast(`Exported "${outputFilename}" successfully!`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to export PDF: ' + err.message);
    } finally {
      els.loadingOverlay.style.display = 'none';
    }
  }

  function handleDownloadOrganized() {
    const baseName = state.documents[0] ? state.documents[0].name.replace(/\.[^/.]+$/, '') : 'document';
    const filename = `${baseName}_organized_ecriox.pdf`;
    exportPdf(state.pageList, filename);
  }

  function handleDownloadSelected() {
    if (state.selectedIds.size === 0) return;
    const selectedPages = state.pageList.filter(p => state.selectedIds.has(p.id));
    const baseName = state.documents[0] ? state.documents[0].name.replace(/\.[^/.]+$/, '') : 'document';
    const filename = `${baseName}_extracted_ecriox.pdf`;
    exportPdf(selectedPages, filename);
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Browse button triggers file input
    els.browseBtn.addEventListener('click', () => els.fileInput.click());
    els.dropzone.addEventListener('click', (e) => {
      if (e.target !== els.browseBtn) els.fileInput.click();
    });

    // File input change
    els.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        loadPdfFiles(Array.from(e.target.files), false);
      }
      els.fileInput.value = '';
    });

    // Insert file input change
    els.insertFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        loadPdfFiles(Array.from(e.target.files), true);
      }
      els.insertFileInput.value = '';
    });

    // Drag and drop onto initial dropzone
    els.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.dropzone.classList.add('dragover');
    });
    els.dropzone.addEventListener('dragleave', () => {
      els.dropzone.classList.remove('dragover');
    });
    els.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      els.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        loadPdfFiles(Array.from(e.dataTransfer.files), false);
      }
    });

    // Drag and drop files directly into active workspace
    window.addEventListener('dragover', (e) => {
      if (els.workspace.style.display !== 'none') {
        e.preventDefault();
      }
    });
    window.addEventListener('drop', (e) => {
      if (els.workspace.style.display !== 'none') {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
          if (files.length > 0) {
            e.preventDefault();
            loadPdfFiles(files, true);
          }
        }
      }
    });

    // Toolbar actions
    els.selectAllBtn.addEventListener('click', selectAllPages);
    els.deselectAllBtn.addEventListener('click', deselectAllPages);
    els.rotateLeftBtn.addEventListener('click', () => rotateSelectedPages(-90));
    els.rotateRightBtn.addEventListener('click', () => rotateSelectedPages(90));
    els.duplicateBtn.addEventListener('click', duplicateSelectedPages);
    els.deleteBtn.addEventListener('click', deleteSelectedPages);
    els.extractBtn.addEventListener('click', handleDownloadSelected);
    els.insertBtn.addEventListener('click', () => els.insertFileInput.click());
    els.reverseBtn.addEventListener('click', reverseAllPages);
    els.sortBtn.addEventListener('click', sortOriginalSequence);
    els.deleteBlankBtn.addEventListener('click', deleteBlankPages);
    els.undoBtn.addEventListener('click', undo);
    els.redoBtn.addEventListener('click', redo);

    // Zoom slider
    els.zoomSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      document.documentElement.style.setProperty('--thumb-width', `${val}px`);
    });

    // Bottom dock actions
    els.resetBtn.addEventListener('click', resetAllChanges);
    els.downloadSelectedBtn.addEventListener('click', handleDownloadSelected);
    els.downloadBtn.addEventListener('click', handleDownloadOrganized);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
               ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
      }
      // Select All: Ctrl+A / Cmd+A
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        if (state.pageList.length > 0) {
          e.preventDefault();
          selectAllPages();
        }
      }
      // Delete: Delete or Backspace
      else if (e.key === 'Delete' || (e.key === 'Backspace' && (e.ctrlKey || e.metaKey))) {
        if (state.selectedIds.size > 0) {
          e.preventDefault();
          deleteSelectedPages();
        }
      }
      // Rotate Left: [
      else if (e.key === '[') {
        if (state.selectedIds.size > 0) {
          e.preventDefault();
          rotateSelectedPages(-90);
        }
      }
      // Rotate Right: ]
      else if (e.key === ']') {
        if (state.selectedIds.size > 0) {
          e.preventDefault();
          rotateSelectedPages(90);
        }
      }
    });

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (state.historyIndex > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Check URL transfer parameter from homepage hero
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('transfer') === '1' && window.EcrioXHeroTransfer) {
      window.EcrioXHeroTransfer.getStoredFiles().then((transferredFiles) => {
        if (transferredFiles && transferredFiles.length > 0) {
          loadPdfFiles(transferredFiles, false);
          try {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (e) {}
        }
      });
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', setupEventListeners);
})();
