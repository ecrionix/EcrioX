/**
 * EcrioX - Client-Side PDF to JPG Converter
 * High-resolution rendering of PDF pages into JPEG images using PDF.js and JSZip.
 * 100% private in-browser execution with individual or ZIP batch download.
 */

(function () {
  "use strict";

  const TOOL_ID = "pdf-to-jpg";
  const TOOL_CATEGORY = "pdf";

  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  let currentFile = null;
  let pdfDoc = null;
  let totalPages = 0;
  let selectedPages = new Set();
  let convertedImages = []; // Array of { pageNum, dataUrl, blob, width, height }
  let zipBlobUrl = null;

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    pdfInfoTitle: document.getElementById("pdfInfoTitle"),
    pdfInfoPages: document.getElementById("pdfInfoPages"),
    pdfInfoSize: document.getElementById("pdfInfoSize"),
    resolutionSelect: document.getElementById("resolutionSelect"),
    qualitySelect: document.getElementById("qualitySelect"),
    selectAllPagesBtn: document.getElementById("selectAllPagesBtn"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    selectedCountBadge: document.getElementById("selectedCountBadge"),
    thumbnailGrid: document.getElementById("thumbnailGrid"),
    convertBtn: document.getElementById("convertBtn"),
    resetBtn: document.getElementById("resetBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    resultsBox: document.getElementById("resultsBox"),
    resultsCountText: document.getElementById("resultsCountText"),
    downloadZipBtn: document.getElementById("downloadZipBtn"),
    convertedImagesGrid: document.getElementById("convertedImagesGrid"),
    convertAnotherBtn: document.getElementById("convertAnotherBtn")
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

    elements.selectAllPagesBtn.addEventListener("click", selectAllPages);
    elements.clearSelectionBtn.addEventListener("click", clearSelection);
    elements.convertBtn.addEventListener("click", processConversion);
    elements.downloadZipBtn.addEventListener("click", downloadAllAsZip);
    elements.resetBtn.addEventListener("click", resetTool);
    elements.convertAnotherBtn.addEventListener("click", resetTool);
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
      const buffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;

      elements.pdfInfoTitle.textContent = file.name;
      elements.pdfInfoPages.textContent = `${totalPages} Page${totalPages > 1 ? "s" : ""}`;
      elements.pdfInfoSize.textContent = formatBytes(file.size);

      elements.dropzone.style.display = "none";
      elements.workspaceControls.style.display = "block";
      elements.resultsBox.style.display = "none";

      // Select all pages by default
      selectedPages = new Set();
      for (let i = 1; i <= totalPages; i++) selectedPages.add(i);
      elements.selectedCountBadge.textContent = `${selectedPages.size} Selected`;

      renderThumbnailSelectors();
    } catch (err) {
      console.error("PDF read error:", err);
      let msg = "Could not open this PDF. The file may be password-protected or corrupted.";
      if (err.name === "PasswordException") {
        msg = "This PDF is password-protected. Please remove the password to convert.";
      }
      if (window.EcrioXApp) window.EcrioXApp.showToast(msg);
      alert(msg);
    }
  }

  async function renderThumbnailSelectors() {
    elements.thumbnailGrid.innerHTML = "";
    const maxPreviews = Math.min(totalPages, 40);

    for (let pageNum = 1; pageNum <= maxPreviews; pageNum++) {
      const card = document.createElement("div");
      card.className = "page-select-card";
      card.dataset.pageNum = pageNum;
      card.style.cssText =
        "border: 2px solid var(--color-primary); border-radius: var(--radius-md); padding: 0.5rem; background-color: var(--color-primary-light); cursor: pointer; text-align: center; transition: var(--transition);";

      const canvas = document.createElement("canvas");
      canvas.style.cssText = "width: 100%; height: auto; max-height: 110px; object-fit: contain; display: block; margin: 0 auto 0.4rem;";

      const caption = document.createElement("span");
      caption.style.cssText = "font-size: 0.75rem; font-weight: 600; color: var(--text-main); display: block;";
      caption.textContent = `Page ${pageNum}`;

      card.appendChild(canvas);
      card.appendChild(caption);
      elements.thumbnailGrid.appendChild(card);

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
        elements.selectedCountBadge.textContent = `${selectedPages.size} Selected`;
        elements.convertBtn.disabled = selectedPages.size === 0;
        elements.convertBtn.textContent =
          selectedPages.size === 0 ? "Select at least 1 page" : `Convert ${selectedPages.size} Page${selectedPages.size > 1 ? "s" : ""} to JPG`;
      });

      pdfDoc.getPage(pageNum).then((page) => {
        const viewport = page.getViewport({ scale: 0.25 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport: viewport });
      });
    }

    if (totalPages > 40) {
      const note = document.createElement("p");
      note.style.cssText = "font-size: 0.8rem; color: var(--text-muted); grid-column: 1 / -1; text-align: center; margin-top: 0.5rem;";
      note.textContent = `Showing first 40 page previews. All ${totalPages} pages are selected by default.`;
      elements.thumbnailGrid.appendChild(note);
    }

    elements.convertBtn.disabled = selectedPages.size === 0;
    elements.convertBtn.textContent = `Convert ${selectedPages.size} Page${selectedPages.size > 1 ? "s" : ""} to JPG`;
  }

  function selectAllPages() {
    selectedPages = new Set();
    for (let i = 1; i <= totalPages; i++) selectedPages.add(i);
    elements.selectedCountBadge.textContent = `${selectedPages.size} Selected`;
    elements.thumbnailGrid.querySelectorAll(".page-select-card").forEach((c) => {
      c.style.borderColor = "var(--color-primary)";
      c.style.backgroundColor = "var(--color-primary-light)";
    });
    elements.convertBtn.disabled = false;
    elements.convertBtn.textContent = `Convert ${selectedPages.size} Page${selectedPages.size > 1 ? "s" : ""} to JPG`;
  }

  function clearSelection() {
    selectedPages = new Set();
    elements.selectedCountBadge.textContent = `0 Selected`;
    elements.thumbnailGrid.querySelectorAll(".page-select-card").forEach((c) => {
      c.style.borderColor = "var(--border-color)";
      c.style.backgroundColor = "var(--bg-surface)";
    });
    elements.convertBtn.disabled = true;
    elements.convertBtn.textContent = "Select at least 1 page";
  }

  async function processConversion() {
    if (selectedPages.size === 0 || !pdfDoc) return;

    const startTime = performance.now();
    elements.convertBtn.disabled = true;
    elements.resetBtn.disabled = true;
    elements.progressContainer.style.display = "block";
    elements.progressBar.style.width = "5%";
    elements.progressText.textContent = "Initializing high-resolution renderer...";

    const scale = parseFloat(elements.resolutionSelect.value) || 1.5;
    const quality = parseFloat(elements.qualitySelect.value) || 0.92;

    convertedImages = [];
    if (zipBlobUrl) {
      URL.revokeObjectURL(zipBlobUrl);
      zipBlobUrl = null;
    }

    const pagesToRender = Array.from(selectedPages).sort((a, b) => a - b);
    const totalToRender = pagesToRender.length;

    try {
      for (let i = 0; i < totalToRender; i++) {
        const pageNum = pagesToRender[i];
        elements.progressText.textContent = `Rendering page ${pageNum} (${i + 1} of ${totalToRender})...`;
        elements.progressBar.style.width = `${Math.round(((i + 1) / totalToRender) * 90)}%`;

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d", { alpha: false });

        // Solid white background for JPEG export
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const blob = await fetch(dataUrl).then((res) => res.blob());

        convertedImages.push({
          pageNum: pageNum,
          dataUrl: dataUrl,
          blob: blob,
          width: canvas.width,
          height: canvas.height
        });
      }

      elements.progressBar.style.width = "98%";
      elements.progressText.textContent = "Building ZIP archive for batch download...";

      // Prepare ZIP archive in background
      const zip = new JSZip();
      convertedImages.forEach((img) => {
        zip.file(`page_${String(img.pageNum).padStart(3, "0")}.jpg`, img.blob);
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      zipBlobUrl = URL.createObjectURL(zipBlob);

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      // Render results gallery
      elements.resultsCountText.textContent = `${convertedImages.length} JPG Image${convertedImages.length > 1 ? "s" : ""} Converted`;
      renderConvertedGallery();

      elements.progressBar.style.width = "100%";
      elements.progressContainer.style.display = "none";
      elements.resultsBox.style.display = "block";
      elements.convertBtn.disabled = false;
      elements.resetBtn.disabled = false;

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Pages converted to JPG successfully!");
      }
    } catch (err) {
      console.error("PDF to JPG conversion error:", err);
      elements.progressContainer.style.display = "none";
      elements.convertBtn.disabled = false;
      elements.resetBtn.disabled = false;
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Conversion failed. Please verify PDF file integrity.");
      }
    }
  }

  function renderConvertedGallery() {
    elements.convertedImagesGrid.innerHTML = convertedImages
      .map((img) => {
        return `
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; text-align: center; box-shadow: var(--shadow-sm);">
            <div style="max-height: 180px; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 0.75rem; background-color: var(--bg-subtle);">
              <img src="${img.dataUrl}" alt="Page ${img.pageNum}" style="width: 100%; height: 180px; object-fit: contain; display: block;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
              <strong>Page ${img.pageNum}</strong>
              <span>${img.width}&times;${img.height}px</span>
            </div>
            <button type="button" class="btn btn-sm btn-primary single-download-btn" data-page="${img.pageNum}" style="width: 100%;">
              Download JPG
            </button>
          </div>
        `;
      })
      .join("");

    elements.convertedImagesGrid.querySelectorAll(".single-download-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pageNum = parseInt(btn.getAttribute("data-page"), 10);
        downloadSinglePage(pageNum);
      });
    });
  }

  function downloadSinglePage(pageNum) {
    const item = convertedImages.find((img) => img.pageNum === pageNum);
    if (!item) return;

    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "document";
    const downloadFilename = `${baseName}_page_${pageNum}.jpg`;

    const a = document.createElement("a");
    a.href = item.dataUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "jpg");
    }
  }

  function downloadAllAsZip() {
    if (!zipBlobUrl) return;

    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "document";
    const downloadFilename = `${baseName}_all_pages_jpg.zip`;

    const a = document.createElement("a");
    a.href = zipBlobUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "zip");
    }
  }

  function resetTool() {
    currentFile = null;
    pdfDoc = null;
    totalPages = 0;
    selectedPages = new Set();
    convertedImages = [];
    if (zipBlobUrl) {
      URL.revokeObjectURL(zipBlobUrl);
      zipBlobUrl = null;
    }
    elements.fileInput.value = "";
    elements.thumbnailGrid.innerHTML = "";
    elements.convertedImagesGrid.innerHTML = "";
    elements.workspaceControls.style.display = "none";
    elements.resultsBox.style.display = "none";
    elements.progressContainer.style.display = "none";
    elements.dropzone.style.display = "block";
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
