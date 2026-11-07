/**
 * EcrioX - Client-Side Merge PDF Utility
 * Merge multiple PDF documents in custom order using pdf-lib and PDF.js.
 * 100% private in-browser execution.
 */

(function () {
  "use strict";

  const TOOL_ID = "merge-pdf";
  const TOOL_CATEGORY = "pdf";

  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  let pdfList = []; // Array of { file, pageCount, arrayBuffer }
  let mergedPdfBytes = null;
  let mergedBlobUrl = null;

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    fileListContainer: document.getElementById("fileListContainer"),
    totalDocCount: document.getElementById("totalDocCount"),
    totalPageCount: document.getElementById("totalPageCount"),
    totalInputSize: document.getElementById("totalInputSize"),
    addMoreBtn: document.getElementById("addMoreBtn"),
    clearAllBtn: document.getElementById("clearAllBtn"),
    mergeBtn: document.getElementById("mergeBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    resultsBox: document.getElementById("resultsBox"),
    finalOutputSize: document.getElementById("finalOutputSize"),
    finalDocCount: document.getElementById("finalDocCount"),
    downloadBtn: document.getElementById("downloadBtn"),
    mergeAnotherBtn: document.getElementById("mergeAnotherBtn")
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    elements.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
      }
    });

    elements.addMoreBtn.addEventListener("click", () => elements.fileInput.click());
    elements.clearAllBtn.addEventListener("click", resetTool);
    elements.mergeBtn.addEventListener("click", processMerge);
    elements.downloadBtn.addEventListener("click", downloadMergedPdf);
    elements.mergeAnotherBtn.addEventListener("click", resetTool);
  }

  async function handleFiles(files) {
    const validPdfFiles = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (validPdfFiles.length === 0) {
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Please upload valid PDF files.");
      }
      return;
    }

    for (const file of validPdfFiles) {
      try {
        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const doc = await loadingTask.promise;

        pdfList.push({
          file: file,
          name: file.name,
          size: file.size,
          pageCount: doc.numPages,
          arrayBuffer: buffer
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

    renderFileList();
  }

  function renderFileList() {
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

    elements.fileListContainer.innerHTML = pdfList
      .map((item, idx) => {
        totalPages += item.pageCount;
        totalBytes += item.size;

        return `
          <div class="pdf-item-row" data-index="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.75rem; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.875rem; flex: 1; min-width: 0;">
              <div style="width: 2rem; height: 2rem; border-radius: var(--radius-full); background-color: var(--color-primary-light); color: var(--color-primary); font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${idx + 1}
              </div>
              <div style="min-width: 0;">
                <h5 style="font-size: 0.95rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.name)}</h5>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${item.pageCount} Page${item.pageCount > 1 ? "s" : ""} &bull; ${formatBytes(item.size)}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
              <button type="button" class="btn btn-sm btn-secondary move-up-btn" data-index="${idx}" title="Move Up" ${idx === 0 ? "disabled style='opacity:0.4;'" : ""}>&uarr;</button>
              <button type="button" class="btn btn-sm btn-secondary move-down-btn" data-index="${idx}" title="Move Down" ${idx === pdfList.length - 1 ? "disabled style='opacity:0.4;'" : ""}>&darr;</button>
              <button type="button" class="btn btn-sm btn-secondary remove-btn" data-index="${idx}" title="Remove" style="color: var(--color-danger);">&#10005;</button>
            </div>
          </div>
        `;
      })
      .join("");

    elements.totalDocCount.textContent = `${pdfList.length} Document${pdfList.length > 1 ? "s" : ""}`;
    elements.totalPageCount.textContent = `${totalPages} Page${totalPages > 1 ? "s" : ""}`;
    elements.totalInputSize.textContent = formatBytes(totalBytes);

    // Attach listeners
    elements.fileListContainer.querySelectorAll(".move-up-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-index"), 10);
        if (i > 0) {
          const temp = pdfList[i];
          pdfList[i] = pdfList[i - 1];
          pdfList[i - 1] = temp;
          renderFileList();
        }
      });
    });

    elements.fileListContainer.querySelectorAll(".move-down-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-index"), 10);
        if (i < pdfList.length - 1) {
          const temp = pdfList[i];
          pdfList[i] = pdfList[i + 1];
          pdfList[i + 1] = temp;
          renderFileList();
        }
      });
    });

    elements.fileListContainer.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-index"), 10);
        pdfList.splice(i, 1);
        renderFileList();
      });
    });

    // Merge button enabled only if at least 2 files
    elements.mergeBtn.disabled = pdfList.length < 2;
    if (pdfList.length < 2) {
      elements.mergeBtn.textContent = "Upload at least 2 PDFs to Merge";
    } else {
      elements.mergeBtn.textContent = `Merge ${pdfList.length} Documents`;
    }
  }

  async function processMerge() {
    if (pdfList.length < 2) {
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Please add at least 2 PDF files to merge.");
      }
      return;
    }

    const startTime = performance.now();
    elements.mergeBtn.disabled = true;
    elements.clearAllBtn.disabled = true;
    elements.addMoreBtn.disabled = true;
    elements.progressContainer.style.display = "block";
    elements.progressBar.style.width = "10%";
    elements.progressText.textContent = "Creating new combined document...";

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();
      mergedPdf.setProducer("EcrioX PDF Merger (https://ecriox.com)");
      mergedPdf.setCreator("EcrioX");

      const totalFiles = pdfList.length;

      for (let i = 0; i < totalFiles; i++) {
        const currentItem = pdfList[i];
        elements.progressText.textContent = `Merging file ${i + 1} of ${totalFiles}: ${currentItem.name}...`;
        elements.progressBar.style.width = `${Math.round(((i + 1) / totalFiles) * 85)}%`;

        const srcDoc = await PDFLib.PDFDocument.load(currentItem.arrayBuffer, {
          ignoreEncryption: false
        });
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());

        for (const page of copiedPages) {
          mergedPdf.addPage(page);
        }
      }

      elements.progressText.textContent = "Finalizing merged PDF streams...";
      elements.progressBar.style.width = "95%";

      mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });

      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      if (mergedBlobUrl) URL.revokeObjectURL(mergedBlobUrl);
      mergedBlobUrl = URL.createObjectURL(blob);

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      elements.progressBar.style.width = "100%";
      elements.progressContainer.style.display = "none";
      elements.resultsBox.style.display = "block";
      elements.finalOutputSize.textContent = formatBytes(mergedPdfBytes.length);
      elements.finalDocCount.textContent = `${totalFiles} Documents combined into 1`;

      elements.mergeBtn.disabled = false;
      elements.clearAllBtn.disabled = false;
      elements.addMoreBtn.disabled = false;

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("PDFs merged successfully!");
      }
    } catch (err) {
      console.error("Merging error:", err);
      elements.progressContainer.style.display = "none";
      elements.mergeBtn.disabled = false;
      elements.clearAllBtn.disabled = false;
      elements.addMoreBtn.disabled = false;
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("An error occurred while merging your PDFs. Please check if any file is encrypted.");
      }
    }
  }

  function downloadMergedPdf() {
    if (!mergedBlobUrl) return;

    const downloadFilename = `merged_document_ecriox.pdf`;
    const a = document.createElement("a");
    a.href = mergedBlobUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "pdf");
    }
  }

  function resetTool() {
    pdfList = [];
    mergedPdfBytes = null;
    if (mergedBlobUrl) {
      URL.revokeObjectURL(mergedBlobUrl);
      mergedBlobUrl = null;
    }
    elements.fileInput.value = "";
    elements.fileListContainer.innerHTML = "";
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

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
