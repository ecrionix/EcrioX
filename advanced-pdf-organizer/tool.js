/* Advanced PDF Organizer – tool.js */
(() => {
  'use strict';

  // ---- Global State ----
  const state = {
    // Array of original PDF ArrayBuffers (one entry per uploaded document)
    originalDocs: [],
    // pdf-lib PDFDocument instances for each original file (lazy-loaded)
    originalPdfLibDocs: [],
    // Page descriptors – order of pages currently displayed
    // { docIdx: number, pageIdx: number, rotation: 0|90|180|270 }
    pageList: [],
    // Selection – Set of indices (into pageList)
    selected: new Set(),
    // History stack for undo/redo (array of pageList snapshots)
    history: [],
    historyPos: -1,
    // UI elements
    fileInput: document.getElementById('fileInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    themeToggle: document.getElementById('themeToggle'),
    toolbar: document.getElementById('toolbar'),
    workspace: document.getElementById('workspace'),
    thumbContainer: document.getElementById('thumbContainer'),
    bottomBar: document.getElementById('bottomBar'),
    totalInfo: document.getElementById('totalPagesInfo'),
    selectedInfo: document.getElementById('selectedPagesInfo'),
    resetBtn: document.getElementById('resetBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    // Toolbar buttons
    selectAllBtn: document.getElementById('selectAllBtn'),
    deselectAllBtn: document.getElementById('deselectAllBtn'),
    rotateLeftBtn: document.getElementById('rotateLeftBtn'),
    rotateRightBtn: document.getElementById('rotateRightBtn'),
    duplicateBtn: document.getElementById('duplicateBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    extractBtn: document.getElementById('extractBtn'),
    insertBtn: document.getElementById('insertBtn'),
    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    // Toast container (created on demand)
    toast: null,
  };

  // ---- Utility Functions ----
  const showToast = (msg, duration = 3000) => {
    if (!state.toast) {
      const div = document.createElement('div');
      div.className = 'toast';
      document.body.appendChild(div);
      state.toast = div;
    }
    state.toast.textContent = msg;
    state.toast.classList.add('show');
    setTimeout(() => state.toast.classList.remove('show'), duration);
  };

  const updateInfoBars = () => {
    state.totalInfo.textContent = `Total pages: ${state.pageList.length}`;
    state.selectedInfo.textContent = `Selected: ${state.selected.size}`;
    // Enable/disable toolbar based on selection
    const anySel = state.selected.size > 0;
    state.rotateLeftBtn.disabled = !anySel;
    state.rotateRightBtn.disabled = !anySel;
    state.duplicateBtn.disabled = !anySel;
    state.deleteBtn.disabled = !anySel;
    state.extractBtn.disabled = !anySel;
    state.undoBtn.disabled = state.historyPos <= 0;
    state.redoBtn.disabled = state.historyPos >= state.history.length - 1;
    state.resetBtn.disabled = state.historyPos <= 0;
    state.downloadBtn.disabled = state.pageList.length === 0;
  };

  const pushHistory = () => {
    // Truncate redo branch
    if (state.historyPos < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyPos + 1);
    }
    // Deep copy pageList (array of plain objects)
    const snapshot = state.pageList.map(p => ({...p}));
    state.history.push(snapshot);
    state.historyPos++;
    updateInfoBars();
  };

  const applySnapshot = (snapshot) => {
    state.pageList = snapshot.map(p => ({...p}));
    state.selected.clear();
    renderThumbnails();
    updateInfoBars();
  };

  const undo = () => {
    if (state.historyPos > 0) {
      state.historyPos--;
      applySnapshot(state.history[state.historyPos]);
    }
  };
  const redo = () => {
    if (state.historyPos < state.history.length - 1) {
      state.historyPos++;
      applySnapshot(state.history[state.historyPos]);
    }
  };

  // Render thumbnail for a given page index (in pageList)
  const renderThumbnail = async (pageDescriptor, containerDiv) => {
    const {docIdx, pageIdx, rotation} = pageDescriptor;
    const pdfData = state.originalDocs[docIdx];
    const loadingTask = pdfjsLib.getDocument({data: pdfData});
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIdx + 1); // 1‑based
    const viewport = page.getViewport({scale: 1});
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 120 / viewport.width; // fit width 120px
    const scaledViewport = page.getViewport({scale});
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const renderContext = {canvasContext: ctx, viewport: scaledViewport};
    await page.render(renderContext).promise;
    // Apply rotation visual cue if needed
    if (rotation !== 0) {
      const rotCanvas = document.createElement('canvas');
      const rotCtx = rotCanvas.getContext('2d');
      if (rotation % 180 === 0) {
        rotCanvas.width = canvas.width;
        rotCanvas.height = canvas.height;
      } else {
        rotCanvas.width = canvas.height;
        rotCanvas.height = canvas.width;
      }
      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      containerDiv.appendChild(rotCanvas);
    } else {
      containerDiv.appendChild(canvas);
    }
  };

  // Full re‑render of thumbnail grid
  const renderThumbnails = async () => {
    state.thumbContainer.innerHTML = '';
    const fragments = document.createDocumentFragment();
    for (let i = 0; i < state.pageList.length; i++) {
      const desc = state.pageList[i];
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'thumb';
      if (state.selected.has(i)) thumbDiv.classList.add('selected');
      thumbDiv.dataset.index = i;

      // Page number badge
      const badge = document.createElement('div');
      badge.className = 'page-number';
      badge.textContent = i + 1;
      thumbDiv.appendChild(badge);

      // Selection checkbox (click toggles selection)
      const selBox = document.createElement('input');
      selBox.type = 'checkbox';
      selBox.className = 'select-box';
      selBox.checked = state.selected.has(i);
      selBox.addEventListener('change', (e) => {
        const idx = Number(thumbDiv.dataset.index);
        if (e.target.checked) state.selected.add(idx);
        else state.selected.delete(idx);
        thumbDiv.classList.toggle('selected', state.selected.has(idx));
        updateInfoBars();
      });
      thumbDiv.appendChild(selBox);

      // Render thumbnail (async, but we do not await each to keep UI responsive)
      renderThumbnail(desc, thumbDiv).catch(err => console.error('Render error', err));

      fragments.appendChild(thumbDiv);
    }
    state.thumbContainer.appendChild(fragments);
    // Initialise Sortable for drag‑and‑drop reorder
    if (state.sortable) state.sortable.destroy();
    state.sortable = Sortable.create(state.thumbContainer, {
      animation: 150,
      handle: '.thumb',
      onEnd: (evt) => {
        const {oldIndex, newIndex} = evt;
        if (oldIndex === newIndex) return;
        const moved = state.pageList.splice(oldIndex, 1)[0];
        state.pageList.splice(newIndex, 0, moved);
        // Update selection set indices (simplify: clear selections after reorder)
        state.selected.clear();
        renderThumbnails();
        pushHistory();
      },
    });
    updateInfoBars();
  };

  // ---- Core Operations ----
  const rotateSelected = (dir) => {
    // dir = -1 (left) or +1 (right)
    const delta = dir === -1 ? -90 : 90;
    state.selected.forEach(idx => {
      const p = state.pageList[idx];
      p.rotation = (p.rotation + delta + 360) % 360;
    });
    renderThumbnails();
    pushHistory();
  };

  const deleteSelected = () => {
    if (state.selected.size === 0) return;
    if (!confirm('Delete selected pages? This action cannot be undone.')) return;
    const newList = [];
    state.pageList.forEach((p, i) => {
      if (!state.selected.has(i)) newList.push(p);
    });
    state.pageList = newList;
    state.selected.clear();
    renderThumbnails();
    pushHistory();
  };

  const duplicateSelected = () => {
    if (state.selected.size === 0) return;
    // Insert duplicate right after each original (process in descending order to keep indices stable)
    const indices = Array.from(state.selected).sort((a,b)=>b-a);
    indices.forEach(idx => {
      const orig = state.pageList[idx];
      const copy = {...orig, rotation: orig.rotation}; // shallow copy sufficient
      state.pageList.splice(idx + 1, 0, copy);
    });
    state.selected.clear();
    renderThumbnails();
    pushHistory();
  };

  const extractSelected = async () => {
    if (state.selected.size === 0) return;
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (const idx of state.selected) {
      const {docIdx, pageIdx, rotation} = state.pageList[idx];
      const srcPdf = await loadPdfLibDoc(docIdx);
      const [copied] = await pdfDoc.copyPages(srcPdf, [pageIdx]);
      const page = copied;
      if (rotation !== 0) page.setRotation(PDFLib.Rotation.fromDegrees(rotation));
      pdfDoc.addPage(page);
    }
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], {type: 'application/pdf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'extracted.pdf'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    showToast('Extracted PDF downloaded');
  };

  const insertPdf = async () => {
    const insertInput = document.createElement('input');
    insertInput.type = 'file';
    insertInput.accept = 'application/pdf';
    insertInput.multiple = false;
    insertInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const arrayBuffer = await file.arrayBuffer();
      const srcIdx = state.originalDocs.length;
      state.originalDocs.push(arrayBuffer);
      // Load it to get page count
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      // Insert all pages after currently selected page (or at end)
      const insertPos = state.selected.size ? Math.max(...state.selected) + 1 : state.pageList.length;
      for (let i = 0; i < numPages; i++) {
        state.pageList.splice(insertPos + i, 0, {docIdx: srcIdx, pageIdx: i, rotation: 0});
      }
      renderThumbnails();
      pushHistory();
      showToast('Inserted PDF pages');
    };
    insertInput.click();
  };

  const resetChanges = () => {
    if (!confirm('Reset all changes to original order?')) return;
    // Re‑initialize from originalDocs
    state.pageList = [];
    state.originalDocs.forEach((buf, docIdx) => {
      const loadingTask = pdfjsLib.getDocument({data: buf});
      loadingTask.promise.then(pdf => {
        const num = pdf.numPages;
        for (let i = 0; i < num; i++) {
          state.pageList.push({docIdx, pageIdx: i, rotation: 0});
        }
        if (docIdx === state.originalDocs.length - 1) {
          renderThumbnails();
          state.history = [];
          state.historyPos = -1;
          pushHistory();
        }
      });
    });
  };

  const downloadPdf = async () => {
    if (state.pageList.length === 0) return alert('No pages to export');
    const pdfDoc = await PDFLib.PDFDocument.create();
    for (const desc of state.pageList) {
      const srcPdf = await loadPdfLibDoc(desc.docIdx);
      const [copied] = await pdfDoc.copyPages(srcPdf, [desc.pageIdx]);
      const page = copied;
      if (desc.rotation !== 0) page.setRotation(PDFLib.Rotation.fromDegrees(desc.rotation));
      pdfDoc.addPage(page);
    }
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], {type: 'application/pdf'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organized.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    showToast('PDF downloaded');
  };

  // Lazy load pdf-lib document for a given original index
  const loadPdfLibDoc = async (docIdx) => {
    if (state.originalPdfLibDocs[docIdx]) return state.originalPdfLibDocs[docIdx];
    const bytes = state.originalDocs[docIdx];
    const pdf = await PDFLib.PDFDocument.load(bytes);
    state.originalPdfLibDocs[docIdx] = pdf;
    return pdf;
  };

  // ---- Event Listeners ----
  state.uploadBtn.addEventListener('click', () => state.fileInput.click());
  state.fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const docIdx = state.originalDocs.length;
      state.originalDocs.push(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      for (let i = 0; i < numPages; i++) {
        state.pageList.push({docIdx, pageIdx: i, rotation: 0});
      }
    }
    // UI reveal
    state.toolbar.style.display = 'flex';
    state.workspace.style.display = 'block';
    state.bottomBar.style.display = 'flex';
    renderThumbnails();
    pushHistory();
    e.target.value = '';
  });

  // Theme toggle
  state.themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
  });

  // Toolbar button actions
  state.selectAllBtn.addEventListener('click', () => {
    state.pageList.forEach((_, i) => state.selected.add(i));
    renderThumbnails();
    updateInfoBars();
  });
  state.deselectAllBtn.addEventListener('click', () => {
    state.selected.clear();
    renderThumbnails();
    updateInfoBars();
  });
  state.rotateLeftBtn.addEventListener('click', () => rotateSelected(-1));
  state.rotateRightBtn.addEventListener('click', () => rotateSelected(1));
  state.deleteBtn.addEventListener('click', deleteSelected);
  state.duplicateBtn.addEventListener('click', duplicateSelected);
  state.extractBtn.addEventListener('click', extractSelected);
  state.insertBtn.addEventListener('click', insertPdf);
  state.undoBtn.addEventListener('click', undo);
  state.redoBtn.addEventListener('click', redo);
  state.resetBtn.addEventListener('click', resetChanges);
  state.downloadBtn.addEventListener('click', downloadPdf);

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (state.historyPos > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Keyboard shortcuts (basic)
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return; // ignore when typing
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.shiftKey ? redo() : undo();
    }
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      state.selectAllBtn.click();
    }
    if (e.key === 'Delete') {
      state.deleteBtn.click();
    }
    if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
      state.rotateRightBtn.click();
    }
    if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      state.rotateLeftBtn.click();
    }
  });

  // Initial UI hide (already hidden via inline style)
})();
