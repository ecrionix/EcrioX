/**
 * EcrioX - Client-Side Split PDF Utility
 * Extract pages, split by custom range, or separate every page using pdf-lib, PDF.js, and JSZip.
 * 100% private in-browser execution.
 */

(function () {
  "use strict";

  const TOOL_ID = "split-pdf";
  const TOOL_CATEGORY = "pdf";

  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  let currentFile = null;
  let pdfBuffer = null;
  let totalPages = 0;
  let selectedPages = new Set(); // 1-based page numbers
  let splitOutputBlob = null;
  let splitOutputUrl = null;
  let isZipOutput = false;

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    pdfInfoTitle: document.getElementById("pdfInfoTitle"),
    pdfInfoPages: document.getElementById("pdfInfoPages"),
    pdfInfoSize: document.getElementById("pdfInfoSize"),
    splitModeSelect: document.getElementById("splitModeSelect"),
    rangeInputGroup: document.getElementById("rangeInputGroup"),
    rangeInput: document.getElementById("rangeInput"),
    thumbnailGridGroup: document.getElementById("thumbnailGridGroup"),
    thumbnailGrid: document.getElementById("thumbnailGrid"),
    selectAllPagesBtn: document.getElementById("selectAllPagesBtn"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    selectedCountBadge: document.getElementById("selectedCountBadge"),
    splitBtn: document.getElementById("splitBtn"),
    resetBtn: document.getElementById("resetBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    resultsBox: document.getElementById("resultsBox"),
    resultSummary: document.getElementById("resultSummary"),
    resultDetails: document.getElementById("resultDetails"),
    downloadBtn: document.getElementById("downloadBtn"),
    splitAnotherBtn: document.getElementById("splitAnotherBtn")
  };

  function init() {
    if (!elements.dropzone || !elements.fileInput) return;

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackToolOpen(TOOL_ID, TOOL_CATEGORY);
    }

    elements.dropzone.addEventListener("click", () => elements.fileInput.click());
    elements.dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      elements.dropzone.classList.add("dragover");
    });
    elements.dropzone.addEventListener("dragleave", () => {
      elements.dropzone.classList.remove("dragover");
    });
    elements.dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      elements.dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    elements.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    elements.splitModeSelect.addEventListener("change", onModeChange);
    elements.rangeInput.addEventListener("input", onRangeInputChange);
    elements.selectAllPagesBtn.addEventListener("click", selectAllPages);
    elements.clearSelectionBtn.addEventListener("click", clearSelection);

    elements.splitBtn.addEventListener("click", processSplit);
    elements.downloadBtn.addEventListener("click", downloadSplitResult);
    elements.resetBtn.addEventListener("click", resetTool);
    elements.splitAnotherBtn.addEventListener("click", resetTool);
  }

  async function handleFile(file) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Please upload a valid PDF document.");
      }
      return;
    }

    currentFile = file;

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackFileUpload(TOOL_ID, "pdf", file.size);
    }

    try {
      pdfBuffer = await file.arrayBuffer();
      // Clone buffer before passing to PDF.js worker to prevent detachment
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer.slice(0) });
      const doc = await loadingTask.promise;
      totalPages = doc.numPages;

      elements.pdfInfoTitle.textContent = file.name;
      elements.pdfInfoPages.textContent = `${totalPages} Page${totalPages > 1 ? "s" : ""}`;
      elements.pdfInfoSize.textContent = formatBytes(file.size);

      elements.dropzone.style.display = "none";
      elements.workspaceControls.style.display = "block";
      elements.resultsBox.style.display = "none";

      // Default select all pages initially
      selectedPages = new Set();
      for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        selectedPages.add(i);
      }

      onModeChange();
      renderThumbnails(doc);
    } catch (err) {
      console.error("PDF read error:", err);
      let msg = "Could not open this PDF. The document may be corrupted or encrypted.";
      if (err.name === "PasswordException") {
        msg = "This PDF is password-protected. Please remove the password to split.";
      }
      if (window.EcrioXApp) window.EcrioXApp.showToast(msg);
      alert(msg);
    }
  }

  function onModeChange() {
    const mode = elements.splitModeSelect.value;
    if (mode === "select") {
      elements.rangeInputGroup.style.display = "block";
      elements.thumbnailGridGroup.style.display = "block";
      elements.rangeInput.placeholder = `e.g. 1-3, 5 (Max: ${totalPages})`;
      syncRangeInputFromSet();
    } else if (mode === "every") {
      elements.rangeInputGroup.style.display = "none";
      elements.thumbnailGridGroup.style.display = "none";
    }
    updateSplitButtonState();
  }

  async function renderThumbnails(doc) {
    elements.thumbnailGrid.innerHTML = "";
    const maxRender = Math.min(totalPages, 50); // Prevent browser memory overload on 500+ page docs

    for (let pageNum = 1; pageNum <= maxRender; pageNum++) {
      const card = document.createElement("div");
      card.className = `thumbnail-card ${selectedPages.has(pageNum) ? "selected" : ""}`;
      card.dataset.pageNum = pageNum;
      card.style.cssText =
        "border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem; background-color: var(--bg-surface); cursor: pointer; text-align: center; transition: var(--transition);";

      if (selectedPages.has(pageNum)) {
        card.style.borderColor = "var(--color-primary)";
        card.style.backgroundColor = "var(--color-primary-light)";
      }

      const canvas = document.createElement("canvas");
      canvas.style.cssText = "width: 100%; height: auto; max-height: 120px; object-fit: contain; display: block; margin: 0 auto 0.5rem;";

      const caption = document.createElement("span");
      caption.style.cssText = "font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: block;";
      caption.textContent = `Page ${pageNum}`;

      card.appendChild(canvas);
      card.appendChild(caption);
      elements.thumbnailGrid.appendChild(card);

      // Click to toggle
      card.addEventListener("click", () => {
        if (selectedPages.has(pageNum)) {
          selectedPages.delete(pageNum);
          card.style.borderColor = "var(--border-color)";
          card.style.backgroundColor = "var(--bg-surface)";
        } else {
          selectedPages.add(pageNum);
          card.style.borderColor = "var(--color-primary)";
          card.style.backgroundColor = "var(--color-primary-light)";
        }
        syncRangeInputFromSet();
        updateSplitButtonState();
      });

      // Render thumbnail asynchronously
      doc.getPage(pageNum).then((page) => {
        const viewport = page.getViewport({ scale: 0.3 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport: viewport });
      });
    }

    if (totalPages > 50) {
      const notice = document.createElement("p");
      notice.style.cssText = "font-size: 0.8rem; color: var(--text-muted); grid-column: 1 / -1; text-align: center; margin-top: 0.5rem;";
      notice.textContent = `Showing first 50 page previews. You can specify any page range up to ${totalPages} in the text box above.`;
      elements.thumbnailGrid.appendChild(notice);
    }

    updateSplitButtonState();
  }

  function syncRangeInputFromSet() {
    const sorted = Array.from(selectedPages).sort((a, b) => a - b);
    elements.rangeInput.value = formatRanges(sorted);
    elements.selectedCountBadge.textContent = `${sorted.length} Selected`;
  }

  function onRangeInputChange() {
    const parsed = parsePageRanges(elements.rangeInput.value, totalPages);
    if (parsed.valid) {
      selectedPages = new Set(parsed.pages);
      elements.selectedCountBadge.textContent = `${selectedPages.size} Selected`;
      // Update visual border of cards
      elements.thumbnailGrid.querySelectorAll(".thumbnail-card").forEach((card) => {
        const p = parseInt(card.dataset.pageNum, 10);
        if (selectedPages.has(p)) {
          card.style.borderColor = "var(--color-primary)";
          card.style.backgroundColor = "var(--color-primary-light)";
        } else {
          card.style.borderColor = "var(--border-color)";
          card.style.backgroundColor = "var(--bg-surface)";
        }
      });
    }
    updateSplitButtonState();
  }

  function selectAllPages() {
    selectedPages = new Set();
    for (let i = 1; i <= totalPages; i++) selectedPages.add(i);
    syncRangeInputFromSet();
    elements.thumbnailGrid.querySelectorAll(".thumbnail-card").forEach((c) => {
      c.style.borderColor = "var(--color-primary)";
      c.style.backgroundColor = "var(--color-primary-light)";
    });
    updateSplitButtonState();
  }

  function clearSelection() {
    selectedPages = new Set();
    syncRangeInputFromSet();
    elements.thumbnailGrid.querySelectorAll(".thumbnail-card").forEach((c) => {
      c.style.borderColor = "var(--border-color)";
      c.style.backgroundColor = "var(--bg-surface)";
    });
    updateSplitButtonState();
  }

  function updateSplitButtonState() {
    const mode = elements.splitModeSelect.value;
    if (mode === "every") {
      elements.splitBtn.disabled = false;
      elements.splitBtn.textContent = `Split into ${totalPages} Individual PDFs (ZIP)`;
    } else {
      const count = selectedPages.size;
      elements.splitBtn.disabled = count === 0;
      elements.splitBtn.textContent = count === 0 ? "Select at least 1 page" : `Extract ${count} Page${count > 1 ? "s" : ""}`;
    }
  }

  async function processSplit() {
    const mode = elements.splitModeSelect.value;
    const startTime = performance.now();

    elements.splitBtn.disabled = true;
    elements.resetBtn.disabled = true;
    elements.progressContainer.style.display = "block";
    elements.progressBar.style.width = "10%";
    elements.progressText.textContent = "Loading original PDF...";

    try {
      let rawBytes = pdfBuffer;
      if (!rawBytes || rawBytes.byteLength === 0) {
        rawBytes = await currentFile.arrayBuffer();
        pdfBuffer = rawBytes;
      }
      const srcDoc = await PDFLib.PDFDocument.load(rawBytes, { ignoreEncryption: true });

      if (mode === "every") {
        // Split every page into separate PDF bundled into a ZIP file
        isZipOutput = true;
        const zip = new JSZip();

        for (let i = 0; i < totalPages; i++) {
          elements.progressText.textContent = `Extracting page ${i + 1} of ${totalPages}...`;
          elements.progressBar.style.width = `${Math.round(((i + 1) / totalPages) * 85)}%`;

          const singleDoc = await PDFLib.PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
          singleDoc.addPage(copiedPage);

          const bytes = await singleDoc.save({ useObjectStreams: true });
          zip.file(`page_${String(i + 1).padStart(3, "0")}.pdf`, bytes);
        }

        elements.progressText.textContent = "Compressing ZIP archive...";
        elements.progressBar.style.width = "95%";

        const zipBlob = await zip.generateAsync({ type: "blob" });
        splitOutputBlob = zipBlob;
        if (splitOutputUrl) URL.revokeObjectURL(splitOutputUrl);
        splitOutputUrl = URL.createObjectURL(zipBlob);

        elements.resultSummary.textContent = `${totalPages} Individual PDFs Extracted`;
        elements.resultDetails.textContent = `All pages packaged into a single ZIP archive (${formatBytes(zipBlob.size)}).`;
      } else {
        // Extract selected pages into one new PDF
        isZipOutput = false;
        const pageIndices = Array.from(selectedPages)
          .sort((a, b) => a - b)
          .map((p) => p - 1); // 0-based for pdf-lib

        if (pageIndices.length === 0) {
          throw new Error("No pages selected for extraction.");
        }

        elements.progressText.textContent = `Extracting ${pageIndices.length} pages...`;
        elements.progressBar.style.width = "50%";

        const outDoc = await PDFLib.PDFDocument.create();
        outDoc.setProducer("EcrioX PDF Splitter (https://ecriox.com)");
        outDoc.setCreator("EcrioX");

        const copiedPages = await outDoc.copyPages(srcDoc, pageIndices);
        for (const page of copiedPages) {
          outDoc.addPage(page);
        }

        elements.progressText.textContent = "Finalizing PDF streams...";
        elements.progressBar.style.width = "90%";

        const pdfBytes = await outDoc.save({ useObjectStreams: true });
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        splitOutputBlob = blob;
        if (splitOutputUrl) URL.revokeObjectURL(splitOutputUrl);
        splitOutputUrl = URL.createObjectURL(blob);

        elements.resultSummary.textContent = `${pageIndices.length} Pages Extracted`;
        elements.resultDetails.textContent = `New PDF generated successfully (${formatBytes(pdfBytes.length)}).`;
      }

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      elements.progressBar.style.width = "100%";
      elements.progressContainer.style.display = "none";
      elements.resultsBox.style.display = "block";
      elements.splitBtn.disabled = false;
      elements.resetBtn.disabled = false;

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Pages extracted successfully!");
      }
    } catch (err) {
      console.error("Split error:", err);
      elements.progressContainer.style.display = "none";
      elements.splitBtn.disabled = false;
      elements.resetBtn.disabled = false;
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast(err.message || "Could not split this PDF. Please check your page selection.");
      }
    }
  }

  function downloadSplitResult() {
    if (!splitOutputUrl) return;

    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "document";
    const extension = isZipOutput ? "zip" : "pdf";
    const downloadFilename = `${baseName}_split_ecriox.${extension}`;

    const a = document.createElement("a");
    a.href = splitOutputUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, extension);
    }
  }

  function resetTool() {
    currentFile = null;
    pdfBuffer = null;
    totalPages = 0;
    selectedPages = new Set();
    splitOutputBlob = null;
    if (splitOutputUrl) {
      URL.revokeObjectURL(splitOutputUrl);
      splitOutputUrl = null;
    }
    elements.fileInput.value = "";
    elements.rangeInput.value = "";
    elements.thumbnailGrid.innerHTML = "";
    elements.workspaceControls.style.display = "none";
    elements.resultsBox.style.display = "none";
    elements.progressContainer.style.display = "none";
    elements.dropzone.style.display = "block";
  }

  function parsePageRanges(str, maxPages) {
    if (!str || !str.trim()) return { valid: false, pages: [] };
    const parts = str.split(",");
    const result = new Set();

    for (const rawPart of parts) {
      const part = rawPart.trim();
      if (!part) continue;

      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr.trim(), 10);
        const end = parseInt(endStr.trim(), 10);

        if (isNaN(start) || isNaN(end) || start < 1 || end < start || start > maxPages) {
          return { valid: false, pages: [] };
        }
        for (let i = start; i <= Math.min(end, maxPages); i++) {
          result.add(i);
        }
      } else {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 1 || num > maxPages) {
          return { valid: false, pages: [] };
        }
        result.add(num);
      }
    }

    return { valid: result.size > 0, pages: Array.from(result) };
  }

  function formatRanges(pages) {
    if (pages.length === 0) return "";
    const ranges = [];
    let start = pages[0];
    let prev = start;

    for (let i = 1; i < pages.length; i++) {
      if (pages[i] === prev + 1) {
        prev = pages[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = pages[i];
        prev = start;
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return ranges.join(", ");
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
