/**
 * EcrioX - Client-Side Multi-PDF to JPG Converter
 * High-resolution rendering of PDF pages into JPEG images using PDF.js and JSZip.
 * Supports multi-file selection, document queueing, and ZIP batch download.
 * 100% private in-browser execution with zero server uploads.
 */

(function () {
  "use strict";

  const TOOL_ID = "pdf-to-jpg";
  const TOOL_CATEGORY = "pdf";

  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  let pdfList = []; // Array of { id, file, name, size, lastModified, pdfDoc, pageCount }
  let selectedPages = new Set(); // For single-doc mode
  let convertedImages = []; // Array of { docName, pageNum, dataUrl, blob, width, height }
  let zipBlobUrl = null;

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    pdfInfoTitle: document.getElementById("pdfInfoTitle"),
    pdfInfoPages: document.getElementById("pdfInfoPages"),
    pdfInfoSize: document.getElementById("pdfInfoSize"),
    docListSection: document.getElementById("docListSection"),
    docListContainer: document.getElementById("docListContainer"),
    resolutionSelect: document.getElementById("resolutionSelect"),
    qualitySelect: document.getElementById("qualitySelect"),
    pageSelectionSection: document.getElementById("pageSelectionSection"),
    selectAllPagesBtn: document.getElementById("selectAllPagesBtn"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    selectedCountBadge: document.getElementById("selectedCountBadge"),
    thumbnailGrid: document.getElementById("thumbnailGrid"),
    addMoreBtn: document.getElementById("addMoreBtn"),
    clearAllBtn: document.getElementById("clearAllBtn"),
    convertBtn: document.getElementById("convertBtn"),
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
      if (e.dataTransfer && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    });

    elements.fileInput.addEventListener("change", (e) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
      elements.fileInput.value = "";
    });

    if (elements.addMoreBtn) {
      elements.addMoreBtn.addEventListener("click", () => elements.fileInput.click());
    }

    if (elements.clearAllBtn) {
      elements.clearAllBtn.addEventListener("click", resetTool);
    }

    if (elements.selectAllPagesBtn) {
      elements.selectAllPagesBtn.addEventListener("click", selectAllPages);
    }

    if (elements.clearSelectionBtn) {
      elements.clearSelectionBtn.addEventListener("click", clearSelection);
    }

    if (elements.convertBtn) {
      elements.convertBtn.addEventListener("click", processConversion);
    }

    if (elements.downloadZipBtn) {
      elements.downloadZipBtn.addEventListener("click", downloadAllAsZip);
    }

    if (elements.convertAnotherBtn) {
      elements.convertAnotherBtn.addEventListener("click", resetTool);
    }

    // Support drag and drop on workspace controls
    if (elements.workspaceControls) {
      elements.workspaceControls.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      elements.workspaceControls.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }

    // Check URL transfer parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("transfer") === "1" && window.EcrioXHeroTransfer) {
      window.EcrioXHeroTransfer.getStoredFiles().then((transferredFiles) => {
        if (transferredFiles && transferredFiles.length > 0) {
          handleFiles(transferredFiles);
          try {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (e) {}
        }
      });
    }
  }

  async function handleFiles(fileListInput) {
    const rawFiles = Array.from(fileListInput);
    if (rawFiles.length === 0) return;

    let invalidCount = 0;
    let duplicateCount = 0;

    for (const file of rawFiles) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        invalidCount++;
        continue;
      }

      // Check duplicates
      const isDuplicate = pdfList.some(
        (item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified
      );
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const doc = await loadingTask.promise;

        pdfList.push({
          id: "pdf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
          file: file,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          pdfDoc: doc,
          pageCount: doc.numPages
        });

        if (window.EcrioXAnalytics) {
          window.EcrioXAnalytics.trackFileUpload(TOOL_ID, "pdf", file.size);
        }
      } catch (err) {
        console.error("Could not read PDF:", file.name, err);
        let msg = `Could not load ${file.name}. It may be encrypted or corrupted.`;
        if (err.name === "PasswordException") {
          msg = `${file.name} is password-protected. Please remove the password first.`;
        }
        if (window.EcrioXApp) {
          window.EcrioXApp.showToast(msg);
        }
      }
    }

    if (invalidCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${invalidCount} non-PDF file(s) were skipped.`);
    }

    if (duplicateCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${duplicateCount} duplicate file(s) were skipped.`);
    }

    renderWorkspace();
  }

  function renderWorkspace() {
    if (pdfList.length === 0) {
      elements.dropzone.style.display = "block";
      elements.workspaceControls.style.display = "none";
      elements.resultsBox.style.display = "none";
      return;
    }

    elements.dropzone.style.display = "none";
    elements.workspaceControls.style.display = "block";
    elements.resultsBox.style.display = "none";

    let totalPages = 0;
    let totalBytes = 0;

    elements.docListContainer.innerHTML = "";

    pdfList.forEach((item, index) => {
      totalPages += item.pageCount;
      totalBytes += item.size;

      const row = document.createElement("div");
      row.className = "pdf-file-row";
      row.style.cssText =
        "display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.9rem; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); gap: 0.75rem;";

      const infoDiv = document.createElement("div");
      infoDiv.style.cssText = "display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1;";

      const badge = document.createElement("span");
      badge.style.cssText =
        "background-color: var(--color-primary-light); color: var(--color-primary-dark); font-weight: 700; font-size: 0.75rem; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;";
      badge.textContent = index + 1;

      const textDiv = document.createElement("div");
      textDiv.style.cssText = "min-width: 0; flex: 1;";

      const nameEl = document.createElement("p");
      nameEl.style.cssText =
        "font-weight: 600; font-size: 0.9rem; margin: 0; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
      nameEl.textContent = item.name;

      const metaEl = document.createElement("p");
      metaEl.style.cssText = "font-size: 0.75rem; color: var(--text-muted); margin: 0.15rem 0 0 0;";
      metaEl.textContent = `${item.pageCount} page${item.pageCount > 1 ? "s" : ""} • ${formatBytes(item.size)}`;

      textDiv.appendChild(nameEl);
      textDiv.appendChild(metaEl);
      infoDiv.appendChild(badge);
      infoDiv.appendChild(textDiv);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-icon";
      removeBtn.style.cssText = "color: var(--color-danger); width: 28px; height: 28px; flex-shrink: 0;";
      removeBtn.title = "Remove document";
      removeBtn.innerHTML = "&times;";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeFile(item.id);
      });

      row.appendChild(infoDiv);
      row.appendChild(removeBtn);
      elements.docListContainer.appendChild(row);
    });

    elements.pdfInfoTitle.textContent =
      pdfList.length === 1 ? pdfList[0].name : `${pdfList.length} Documents`;
    elements.pdfInfoPages.textContent = `${totalPages} Page${totalPages > 1 ? "s" : ""}`;
    elements.pdfInfoSize.textContent = formatBytes(totalBytes);

    // If single document, show page selection grid
    if (pdfList.length === 1) {
      if (elements.pageSelectionSection) elements.pageSelectionSection.style.display = "block";
      selectedPages = new Set();
      for (let i = 1; i <= pdfList[0].pageCount; i++) selectedPages.add(i);
      if (elements.selectedCountBadge) {
        elements.selectedCountBadge.textContent = `${selectedPages.size} Selected`;
      }
      renderThumbnailSelectors(pdfList[0]);
      elements.convertBtn.textContent = `Convert ${selectedPages.size} Page${selectedPages.size > 1 ? "s" : ""} to JPG`;
    } else {
      if (elements.pageSelectionSection) elements.pageSelectionSection.style.display = "none";
      elements.convertBtn.textContent = `Convert All Pages (${totalPages}) to JPG`;
    }
  }

  function removeFile(id) {
    pdfList = pdfList.filter((item) => item.id !== id);
    renderWorkspace();
  }

  async function renderThumbnailSelectors(item) {
    if (!elements.thumbnailGrid) return;
    elements.thumbnailGrid.innerHTML = "";
    const total = item.pageCount;
    const maxPreviews = Math.min(total, 40);

    for (let pageNum = 1; pageNum <= maxPreviews; pageNum++) {
      const card = document.createElement("div");
      card.className = "page-select-card";
      card.dataset.pageNum = pageNum;
      card.style.cssText =
        "border: 2px solid var(--color-primary); border-radius: var(--radius-md); padding: 0.5rem; background-color: var(--color-primary-light); cursor: pointer; text-align: center; transition: var(--transition);";

      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "width: 100%; height: auto; max-height: 110px; object-fit: contain; display: block; margin: 0 auto 0.4rem;";

      const caption = document.createElement("span");
      caption.style.cssText =
        "font-size: 0.75rem; font-weight: 600; color: var(--text-main); display: block;";
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
          selectedPages.size === 0
            ? "Select at least 1 page"
            : `Convert ${selectedPages.size} Page${selectedPages.size > 1 ? "s" : ""} to JPG`;
      });

      item.pdfDoc.getPage(pageNum).then((page) => {
        const viewport = page.getViewport({ scale: 0.25 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport: viewport });
      });
    }

    if (total > 40) {
      const note = document.createElement("p");
      note.style.cssText =
        "font-size: 0.8rem; color: var(--text-muted); grid-column: 1 / -1; text-align: center; margin-top: 0.5rem;";
      note.textContent = `Showing first 40 page previews. All ${total} pages are selected by default.`;
      elements.thumbnailGrid.appendChild(note);
    }
  }

  function selectAllPages() {
    if (pdfList.length === 0) return;
    const doc = pdfList[0];
    selectedPages = new Set();
    for (let i = 1; i <= doc.pageCount; i++) selectedPages.add(i);
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

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const base64Str = parts[1];
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: "image/jpeg" });
  }

  async function processConversion() {
    if (pdfList.length === 0) return;

    const startTime = performance.now();
    elements.convertBtn.disabled = true;
    if (elements.addMoreBtn) elements.addMoreBtn.disabled = true;
    if (elements.clearAllBtn) elements.clearAllBtn.disabled = true;

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

    try {
      // Build tasks: { doc, pageNum }
      const tasks = [];
      if (pdfList.length === 1) {
        const doc = pdfList[0];
        const pages = Array.from(selectedPages).sort((a, b) => a - b);
        pages.forEach((p) => tasks.push({ doc: doc, pageNum: p }));
      } else {
        pdfList.forEach((doc) => {
          for (let p = 1; p <= doc.pageCount; p++) {
            tasks.push({ doc: doc, pageNum: p });
          }
        });
      }

      const totalTasks = tasks.length;
      if (totalTasks === 0) {
        alert("No pages to convert.");
        return;
      }

      for (let i = 0; i < totalTasks; i++) {
        const task = tasks[i];
        elements.progressText.textContent = `Rendering ${task.doc.name} - Page ${task.pageNum} (${i + 1} of ${totalTasks})...`;
        elements.progressBar.style.width = `${Math.min(95, Math.round(((i + 1) / totalTasks) * 92))}%`;

        const page = await task.doc.pdfDoc.getPage(task.pageNum);
        const viewport = page.getViewport({ scale: scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d", { alpha: false });

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const blob = dataUrlToBlob(dataUrl);

        convertedImages.push({
          docName: task.doc.name.replace(/\.[^/.]+$/, ""),
          pageNum: task.pageNum,
          dataUrl: dataUrl,
          blob: blob,
          width: canvas.width,
          height: canvas.height
        });
      }

      elements.progressBar.style.width = "98%";
      elements.progressText.textContent = "Preparing archive...";

      // Prepare ZIP archive in background
      if (typeof JSZip !== "undefined") {
        const zip = new JSZip();
        convertedImages.forEach((img, idx) => {
          const fileName =
            pdfList.length > 1
              ? `${img.docName}_page_${String(img.pageNum).padStart(3, "0")}.jpg`
              : `page_${String(img.pageNum).padStart(3, "0")}.jpg`;
          zip.file(fileName, img.blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        zipBlobUrl = URL.createObjectURL(zipBlob);
      }

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      elements.resultsCountText.textContent = `${convertedImages.length} JPG Image${convertedImages.length > 1 ? "s" : ""} Converted`;
      renderConvertedGallery();

      elements.progressBar.style.width = "100%";
      elements.progressContainer.style.display = "none";
      elements.workspaceControls.style.display = "none";
      elements.resultsBox.style.display = "block";

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Pages converted to JPG successfully!");
      }
    } catch (err) {
      console.error("PDF to JPG conversion error:", err);
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Conversion failed. Please verify PDF file integrity.");
      }
    } finally {
      elements.progressContainer.style.display = "none";
      elements.convertBtn.disabled = false;
      if (elements.addMoreBtn) elements.addMoreBtn.disabled = false;
      if (elements.clearAllBtn) elements.clearAllBtn.disabled = false;
    }
  }

  function renderConvertedGallery() {
    elements.convertedImagesGrid.innerHTML = convertedImages
      .map((img, idx) => {
        const titleText =
          pdfList.length > 1
            ? `${sanitizeFilename(img.docName, 18)} (Pg ${img.pageNum})`
            : `Page ${img.pageNum}`;

        return `
          <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem; text-align: center; box-shadow: var(--shadow-sm);">
            <div style="max-height: 180px; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 0.75rem; background-color: var(--bg-subtle);">
              <img src="${img.dataUrl}" alt="${titleText}" style="width: 100%; height: 180px; object-fit: contain; display: block;">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
              <strong style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${img.docName}">${titleText}</strong>
              <span>${img.width}&times;${img.height}px</span>
            </div>
            <button type="button" class="btn btn-sm btn-primary single-download-btn" data-index="${idx}" style="width: 100%;">
              Download JPG
            </button>
          </div>
        `;
      })
      .join("");

    elements.convertedImagesGrid.querySelectorAll(".single-download-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        downloadSingleImage(idx);
      });
    });
  }

  function downloadSingleImage(index) {
    const item = convertedImages[index];
    if (!item) return;

    const downloadFilename =
      pdfList.length > 1
        ? `${item.docName}_page_${item.pageNum}.jpg`
        : `${pdfList[0].name.replace(/\.[^/.]+$/, "")}_page_${item.pageNum}.jpg`;

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

    const zipName =
      pdfList.length > 1
        ? `ecriox_converted_pages_${Date.now()}.zip`
        : `${pdfList[0].name.replace(/\.[^/.]+$/, "")}_all_pages_jpg.zip`;

    const a = document.createElement("a");
    a.href = zipBlobUrl;
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "zip");
    }
  }

  function resetTool() {
    pdfList = [];
    selectedPages = new Set();
    convertedImages = [];
    if (zipBlobUrl) {
      URL.revokeObjectURL(zipBlobUrl);
      zipBlobUrl = null;
    }
    elements.fileInput.value = "";
    if (elements.thumbnailGrid) elements.thumbnailGrid.innerHTML = "";
    if (elements.convertedImagesGrid) elements.convertedImagesGrid.innerHTML = "";
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

  function sanitizeFilename(name, maxLen = 30) {
    if (!name) return "Document";
    return name.length > maxLen ? name.slice(0, maxLen - 3) + "..." : name;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();