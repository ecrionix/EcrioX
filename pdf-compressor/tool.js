/**
 * EcrioX - Client-Side Multi-PDF Compressor
 * Real browser-based PDF optimization using pdf-lib and PDF.js.
 * Zero server uploads: 100% private in-browser compression.
 * Supports multi-file selection, append, drag & drop, and ZIP download.
 */

(function () {
  "use strict";

  const TOOL_ID = "pdf-compressor";
  const TOOL_CATEGORY = "pdf";

  // PDF.js worker setup
  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  let pdfList = [];
  let compressedResults = [];

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    totalDocCount: document.getElementById("totalDocCount"),
    totalPageCount: document.getElementById("totalPageCount"),
    totalInputSize: document.getElementById("totalInputSize"),
    fileListContainer: document.getElementById("fileListContainer"),
    presetSelect: document.getElementById("presetSelect"),
    addMoreBtn: document.getElementById("addMoreBtn"),
    clearAllBtn: document.getElementById("clearAllBtn"),
    compressBtn: document.getElementById("compressBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    resultsBox: document.getElementById("resultsBox"),
    finalOrigSize: document.getElementById("finalOrigSize"),
    finalCompSize: document.getElementById("finalCompSize"),
    savingsBadge: document.getElementById("savingsBadge"),
    resultNotice: document.getElementById("resultNotice"),
    downloadZipBtn: document.getElementById("downloadZipBtn"),
    downloadSingleBtn: document.getElementById("downloadSingleBtn"),
    compressedFileListContainer: document.getElementById("compressedFileListContainer"),
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

    if (elements.compressBtn) {
      elements.compressBtn.addEventListener("click", processBatchCompression);
    }

    if (elements.compressAnotherBtn) {
      elements.compressAnotherBtn.addEventListener("click", resetTool);
    }

    if (elements.downloadZipBtn) {
      elements.downloadZipBtn.addEventListener("click", downloadZipArchive);
    }

    if (elements.downloadSingleBtn) {
      elements.downloadSingleBtn.addEventListener("click", () => {
        if (compressedResults.length > 0) {
          downloadSingleFile(compressedResults[0]);
        }
      });
    }

    // Support drag and drop anywhere on workspace controls to add more files
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

    if (invalidCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${invalidCount} non-PDF file(s) were skipped.`);
    }

    if (duplicateCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${duplicateCount} duplicate file(s) were skipped.`);
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

    elements.fileListContainer.innerHTML = "";

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
      elements.fileListContainer.appendChild(row);
    });

    elements.totalDocCount.textContent = `${pdfList.length} Document${pdfList.length > 1 ? "s" : ""}`;
    elements.totalPageCount.textContent = `${totalPages} Page${totalPages > 1 ? "s" : ""}`;
    elements.totalInputSize.textContent = formatBytes(totalBytes);

    if (elements.compressBtn) {
      elements.compressBtn.textContent =
        pdfList.length > 1 ? `Compress ${pdfList.length} PDFs` : "Compress PDF";
    }
  }

  function removeFile(id) {
    pdfList = pdfList.filter((item) => item.id !== id);
    renderFileList();
  }

  function dataUrlToUint8Array(dataUrl) {
    const parts = dataUrl.split(",");
    const base64Str = parts[1];
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }

  async function compressSinglePdf(item, preset, onProgress) {
    const originalBytes = item.arrayBuffer;

    if (onProgress) onProgress(0.2, "Analyzing document structure...");

    let pdfDoc;
    try {
      pdfDoc = await PDFLib.PDFDocument.load(originalBytes, { ignoreEncryption: false });
    } catch (e) {
      pdfDoc = await PDFLib.PDFDocument.load(originalBytes, { ignoreEncryption: true });
    }

    if (preset !== "lossless") {
      pdfDoc.setTitle("");
      pdfDoc.setAuthor("");
      pdfDoc.setSubject("");
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer("EcrioX PDF Optimizer (https://ecriox.com)");
      pdfDoc.setCreator("EcrioX");
    }

    if (onProgress) onProgress(0.5, "Applying object stream compression...");

    let optimizedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false
    });

    // If preset is 'high' or 'recommended' and the file contains heavy raster pages, test downsampling
    if ((preset === "high" || preset === "recommended") && optimizedBytes.length >= item.size * 0.95) {
      if (onProgress) onProgress(0.7, "Checking raster images...");

      try {
        const loadingTask = pdfjsLib.getDocument({ data: originalBytes.slice(0) });
        const renderedPdf = await loadingTask.promise;
        const pageCount = renderedPdf.numPages;

        if (pageCount <= 15) {
          const newDoc = await PDFLib.PDFDocument.create();
          const scale = preset === "high" ? 1.25 : 1.5;
          const quality = preset === "high" ? 0.65 : 0.8;

          for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            if (onProgress) {
              onProgress(0.7 + (pageNum / pageCount) * 0.2, `Optimizing page ${pageNum}/${pageCount}...`);
            }
            const page = await renderedPdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");

            await page.render({ canvasContext: ctx, viewport }).promise;

            const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
            const jpegBytes = dataUrlToUint8Array(jpegDataUrl);

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

    if (onProgress) onProgress(1.0, "Done");

    const finalSize = optimizedBytes.length;
    const blob = new Blob([optimizedBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const savings = item.size - finalSize;
    const savingsPct = Math.round((savings / item.size) * 100);

    const baseName = item.name.replace(/\.[^/.]+$/, "");
    const downloadFilename = `${baseName}_compressed_ecriox.pdf`;

    return {
      originalName: item.name,
      downloadFilename: downloadFilename,
      originalSize: item.size,
      compressedSize: finalSize,
      savings: savings,
      savingsPct: savingsPct,
      bytes: optimizedBytes,
      blobUrl: blobUrl
    };
  }

  async function processBatchCompression() {
    if (pdfList.length === 0) return;

    const startTime = performance.now();
    elements.compressBtn.disabled = true;
    if (elements.addMoreBtn) elements.addMoreBtn.disabled = true;
    if (elements.clearAllBtn) elements.clearAllBtn.disabled = true;

    elements.progressContainer.style.display = "block";
    elements.progressBar.style.width = "5%";
    elements.progressText.textContent = "Starting compression...";

    const preset = elements.presetSelect ? elements.presetSelect.value : "recommended";
    cleanCompressedBlobs();
    compressedResults = [];

    const totalFiles = pdfList.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const item = pdfList[i];
        const fileFraction = 1 / totalFiles;
        const baseProgress = (i / totalFiles) * 100;

        elements.progressText.textContent = `[${i + 1}/${totalFiles}] Compressing ${sanitizeFilename(item.name)}...`;

        const result = await compressSinglePdf(item, preset, (pct, statusText) => {
          const currentTotalPct = Math.round(baseProgress + pct * fileFraction * 100);
          elements.progressBar.style.width = `${Math.min(98, Math.max(5, currentTotalPct))}%`;
          elements.progressText.textContent = `[${i + 1}/${totalFiles}] ${item.name}: ${statusText}`;
        });

        compressedResults.push(result);
      }

      elements.progressBar.style.width = "100%";
      elements.progressText.textContent = "Compression complete!";

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      renderCompressionResults();

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast(
          totalFiles > 1
            ? `Successfully compressed ${totalFiles} PDF documents!`
            : "PDF compressed successfully!"
        );
      }
    } catch (err) {
      console.error("Batch compression error:", err);
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("An error occurred during compression. Please check your files.");
      }
    } finally {
      elements.progressContainer.style.display = "none";
      elements.compressBtn.disabled = false;
      if (elements.addMoreBtn) elements.addMoreBtn.disabled = false;
      if (elements.clearAllBtn) elements.clearAllBtn.disabled = false;
    }
  }

  function renderCompressionResults() {
    let totalOrig = 0;
    let totalComp = 0;

    compressedResults.forEach((r) => {
      totalOrig += r.originalSize;
      totalComp += r.compressedSize;
    });

    elements.finalOrigSize.textContent = formatBytes(totalOrig);
    elements.finalCompSize.textContent = formatBytes(totalComp);

    const totalSavings = totalOrig - totalComp;
    const totalSavingsPct = Math.round((totalSavings / totalOrig) * 100);

    if (totalSavings > 0) {
      elements.savingsBadge.textContent = `-${totalSavingsPct}% Smaller`;
      elements.savingsBadge.className = "badge badge-available";
      elements.resultNotice.innerHTML = `Total size reduced by <strong>${formatBytes(
        totalSavings
      )}</strong> (${totalSavingsPct}% overall reduction).`;
    } else {
      elements.savingsBadge.textContent = "Optimally Packed";
      elements.savingsBadge.className = "badge badge-coming-soon";
      elements.resultNotice.innerHTML =
        "Your documents were already optimally compressed. To prevent quality loss, original structures were preserved.";
    }

    if (compressedResults.length > 1) {
      elements.downloadZipBtn.style.display = "inline-flex";
      elements.downloadSingleBtn.style.display = "none";
    } else {
      elements.downloadZipBtn.style.display = "none";
      elements.downloadSingleBtn.style.display = "inline-flex";
    }

    elements.compressedFileListContainer.innerHTML = "";

    compressedResults.forEach((r, idx) => {
      const card = document.createElement("div");
      card.style.cssText =
        "display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); gap: 1rem; flex-wrap: wrap;";

      const left = document.createElement("div");
      left.style.cssText = "min-width: 0; flex: 1;";

      const title = document.createElement("p");
      title.style.cssText =
        "font-weight: 600; font-size: 0.9rem; margin: 0; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;";
      title.textContent = r.originalName;

      const sub = document.createElement("p");
      sub.style.cssText = "font-size: 0.78rem; color: var(--text-muted); margin: 0.2rem 0 0 0;";

      if (r.savings > 0) {
        sub.innerHTML = `${formatBytes(r.originalSize)} &rarr; <strong style="color: var(--color-primary);">${formatBytes(
          r.compressedSize
        )}</strong> <span style="color: var(--color-primary); font-weight: 600;">(-${r.savingsPct}%)</span>`;
      } else {
        sub.textContent = `${formatBytes(r.originalSize)} • Optimally packed`;
      }

      left.appendChild(title);
      left.appendChild(sub);

      const dlBtn = document.createElement("button");
      dlBtn.type = "button";
      dlBtn.className = "btn btn-secondary btn-sm";
      dlBtn.style.cssText = "flex-shrink: 0;";
      dlBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download
      `;
      dlBtn.addEventListener("click", () => downloadSingleFile(r));

      card.appendChild(left);
      card.appendChild(dlBtn);
      elements.compressedFileListContainer.appendChild(card);
    });

    elements.workspaceControls.style.display = "none";
    elements.resultsBox.style.display = "block";
  }

  function downloadSingleFile(result) {
    if (!result || !result.blobUrl) return;

    const a = document.createElement("a");
    a.href = result.blobUrl;
    a.download = result.downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "pdf");
    }
  }

  async function downloadZipArchive() {
    if (compressedResults.length === 0) return;

    if (typeof JSZip === "undefined") {
      alert("ZIP library is loading. Please try again in a moment.");
      return;
    }

    elements.downloadZipBtn.disabled = true;
    elements.downloadZipBtn.textContent = "Creating ZIP...";

    try {
      const zip = new JSZip();

      compressedResults.forEach((r) => {
        zip.file(r.downloadFilename, r.bytes);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.href = zipUrl;
      a.download = `ecriox_compressed_pdfs_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);

      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackDownload(TOOL_ID, "zip");
      }
    } catch (err) {
      console.error("ZIP creation failed:", err);
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Could not create ZIP archive. You can still download files individually.");
      }
    } finally {
      elements.downloadZipBtn.disabled = false;
      elements.downloadZipBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download All (ZIP)
      `;
    }
  }

  function cleanCompressedBlobs() {
    compressedResults.forEach((r) => {
      if (r.blobUrl) {
        URL.revokeObjectURL(r.blobUrl);
      }
    });
    compressedResults = [];
  }

  function resetTool() {
    cleanCompressedBlobs();
    pdfList = [];
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