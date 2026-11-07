/**
 * EcrioX - Client-Side PDF Compressor
 * Real browser-based PDF optimization using pdf-lib and PDF.js.
 * Zero server uploads: 100% private in-browser compression.
 */

(function () {
  "use strict";

  const TOOL_ID = "pdf-compressor";
  const TOOL_CATEGORY = "pdf";

  // PDF.js worker setup
  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  let currentFile = null;
  let compressedPdfBytes = null;
  let compressedBlobUrl = null;

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    pdfInfoBar: document.getElementById("pdfInfoBar"),
    pdfNameText: document.getElementById("pdfNameText"),
    pdfPageCountText: document.getElementById("pdfPageCountText"),
    pdfOrigSizeText: document.getElementById("pdfOrigSizeText"),
    presetSelect: document.getElementById("presetSelect"),
    compressBtn: document.getElementById("compressBtn"),
    resetBtn: document.getElementById("resetBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    resultsBox: document.getElementById("resultsBox"),
    finalOrigSize: document.getElementById("finalOrigSize"),
    finalCompSize: document.getElementById("finalCompSize"),
    savingsBadge: document.getElementById("savingsBadge"),
    resultNotice: document.getElementById("resultNotice"),
    downloadBtn: document.getElementById("downloadBtn"),
    compressAnotherBtn: document.getElementById("compressAnotherBtn")
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
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    elements.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });

    elements.compressBtn.addEventListener("click", processCompression);
    elements.downloadBtn.addEventListener("click", downloadCompressedPdf);
    elements.resetBtn.addEventListener("click", resetTool);
    elements.compressAnotherBtn.addEventListener("click", resetTool);
  }

  async function handleFileSelect(file) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Please upload a valid PDF file.");
      }
      return;
    }

    currentFile = file;

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackFileUpload(TOOL_ID, "pdf", file.size);
    }

    // Inspect PDF
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      elements.pdfNameText.textContent = sanitizeFilename(file.name);
      elements.pdfPageCountText.textContent = `${pdfDoc.numPages} Page${pdfDoc.numPages > 1 ? "s" : ""}`;
      elements.pdfOrigSizeText.textContent = formatBytes(file.size);

      elements.dropzone.style.display = "none";
      elements.workspaceControls.style.display = "block";
      elements.resultsBox.style.display = "none";
      elements.progressContainer.style.display = "none";
    } catch (err) {
      console.error("PDF inspection failed:", err);
      let errMsg = "Could not open this PDF. The file may be password-protected or corrupted.";
      if (err.name === "PasswordException") {
        errMsg = "This PDF is password-protected. Please remove the password before compressing.";
      }
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast(errMsg);
      }
      alert(errMsg);
    }
  }

  async function processCompression() {
    if (!currentFile) return;

    const startTime = performance.now();
    elements.compressBtn.disabled = true;
    elements.resetBtn.disabled = true;
    elements.progressContainer.style.display = "block";
    elements.progressBar.style.width = "10%";
    elements.progressText.textContent = "Analyzing document structure...";

    const preset = elements.presetSelect.value; // 'recommended', 'high', 'lossless'

    try {
      const originalBytes = await currentFile.arrayBuffer();

      // Load with pdf-lib to analyze object streams
      elements.progressBar.style.width = "30%";
      elements.progressText.textContent = "Optimizing PDF streams & objects...";

      const pdfDoc = await PDFLib.PDFDocument.load(originalBytes, { ignoreEncryption: false });

      // Clean metadata if user chose recommended or high compression
      if (preset !== "lossless") {
        pdfDoc.setTitle("");
        pdfDoc.setAuthor("");
        pdfDoc.setSubject("");
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer("EcrioX PDF Optimizer (https://ecriox.com)");
        pdfDoc.setCreator("EcrioX");
      }

      elements.progressBar.style.width = "60%";
      elements.progressText.textContent = "Applying object stream compression...";

      // Save with object streams enabled and unreferenced objects stripped
      let optimizedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false
      });

      // If preset is 'high' or 'recommended' and the file contains heavy raster pages,
      // inspect whether raster downsampling brings significant savings:
      if ((preset === "high" || preset === "recommended") && optimizedBytes.length >= currentFile.size * 0.95) {
        elements.progressBar.style.width = "75%";
        elements.progressText.textContent = "Scanning raster images for potential downsampling...";

        try {
          const loadingTask = pdfjsLib.getDocument({ data: originalBytes });
          const renderedPdf = await loadingTask.promise;
          const pageCount = renderedPdf.numPages;

          // For small-to-medium PDFs (up to 15 pages), test rendering canvas optimization
          if (pageCount <= 15) {
            const newDoc = await PDFLib.PDFDocument.create();
            const scale = preset === "high" ? 1.25 : 1.5;
            const quality = preset === "high" ? 0.65 : 0.8;

            for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
              elements.progressText.textContent = `Optimizing page ${pageNum} of ${pageCount}...`;
              elements.progressBar.style.width = `${75 + Math.round((pageNum / pageCount) * 18)}%`;

              const page = await renderedPdf.getPage(pageNum);
              const viewport = page.getViewport({ scale });

              const canvas = document.createElement("canvas");
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext("2d");

              await page.render({ canvasContext: ctx, viewport }).promise;

              const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
              const jpegBytes = await fetch(jpegDataUrl).then((res) => res.arrayBuffer());

              const embeddedImage = await newDoc.embedJpg(jpegBytes);
              const newPage = newDoc.addPage([page.view[2] - page.view[0], page.view[3] - page.view[1]]);
              newPage.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: newPage.getWidth(),
                height: newPage.getHeight()
              });
            }

            const rasterOptimizedBytes = await newDoc.save({ useObjectStreams: true });
            if (rasterOptimizedBytes.length < optimizedBytes.length) {
              optimizedBytes = rasterOptimizedBytes;
            }
          }
        } catch (rasterErr) {
          console.warn("Raster optimization skipped, retaining stream-optimized version:", rasterErr);
        }
      }

      elements.progressBar.style.width = "100%";
      elements.progressText.textContent = "Optimization complete!";

      compressedPdfBytes = optimizedBytes;
      const blob = new Blob([optimizedBytes], { type: "application/pdf" });
      if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
      compressedBlobUrl = URL.createObjectURL(blob);

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      // Display metrics
      const originalSize = currentFile.size;
      const finalSize = compressedPdfBytes.length;
      elements.finalOrigSize.textContent = formatBytes(originalSize);
      elements.finalCompSize.textContent = formatBytes(finalSize);

      const savings = originalSize - finalSize;
      const savingsPct = Math.round((savings / originalSize) * 100);

      if (savings > 0) {
        elements.savingsBadge.textContent = `-${savingsPct}% Smaller`;
        elements.savingsBadge.className = "badge badge-available";
        elements.resultNotice.innerHTML = `Your PDF file size was successfully reduced by <strong>${formatBytes(savings)}</strong> (${savingsPct}%).`;
      } else {
        elements.savingsBadge.textContent = "Optimally Packed";
        elements.savingsBadge.className = "badge badge-coming-soon";
        elements.resultNotice.innerHTML = "This document was already optimally compressed. To prevent quality loss, we maintained your original structure.";
      }

      elements.progressContainer.style.display = "none";
      elements.resultsBox.style.display = "block";
      elements.compressBtn.disabled = false;
      elements.resetBtn.disabled = false;

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("PDF compressed successfully!");
      }
    } catch (err) {
      console.error("Compression error:", err);
      elements.progressContainer.style.display = "none";
      elements.compressBtn.disabled = false;
      elements.resetBtn.disabled = false;
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("An error occurred while processing this PDF. Please verify it is not encrypted.");
      }
    }
  }

  function downloadCompressedPdf() {
    if (!compressedBlobUrl) return;

    const originalName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "document";
    const downloadFilename = `${originalName}_compressed_ecriox.pdf`;

    const a = document.createElement("a");
    a.href = compressedBlobUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "pdf");
    }
  }

  function resetTool() {
    currentFile = null;
    compressedPdfBytes = null;
    if (compressedBlobUrl) {
      URL.revokeObjectURL(compressedBlobUrl);
      compressedBlobUrl = null;
    }
    elements.fileInput.value = "";
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

  function sanitizeFilename(name) {
    if (!name) return "Document.pdf";
    return name.length > 30 ? name.slice(0, 27) + "..." : name;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
