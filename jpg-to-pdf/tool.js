/**
 * EcrioX - Client-Side JPG to PDF Converter
 * Converts and binds multiple images (JPG, PNG, WebP) into a standardized PDF document.
 * 100% private in-browser execution using pdf-lib.
 */

(function () {
  "use strict";

  const TOOL_ID = "jpg-to-pdf";
  const TOOL_CATEGORY = "pdf";

  let imageList = []; // Array of { file, name, size, dataUrl, width, height }
  let generatedPdfBytes = null;
  let generatedBlobUrl = null;

  const PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612.0, 792.0]
  };

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    imageListContainer: document.getElementById("imageListContainer"),
    totalImageCount: document.getElementById("totalImageCount"),
    totalImageSize: document.getElementById("totalImageSize"),
    pageSizeSelect: document.getElementById("pageSizeSelect"),
    orientationSelect: document.getElementById("orientationSelect"),
    marginSelect: document.getElementById("marginSelect"),
    fitSelect: document.getElementById("fitSelect"),
    addMoreBtn: document.getElementById("addMoreBtn"),
    clearAllBtn: document.getElementById("clearAllBtn"),
    convertBtn: document.getElementById("convertBtn"),
    progressContainer: document.getElementById("progressContainer"),
    progressBar: document.getElementById("progressBar"),
    progressText: document.getElementById("progressText"),
    resultsBox: document.getElementById("resultsBox"),
    finalPageCount: document.getElementById("finalPageCount"),
    finalPdfSize: document.getElementById("finalPdfSize"),
    downloadBtn: document.getElementById("downloadBtn"),
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    elements.fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
      }
      elements.fileInput.value = "";
    });

    elements.addMoreBtn.addEventListener("click", () => elements.fileInput.click());
    elements.clearAllBtn.addEventListener("click", resetTool);
    elements.convertBtn.addEventListener("click", processConversion);
    elements.downloadBtn.addEventListener("click", downloadPdf);
    elements.convertAnotherBtn.addEventListener("click", resetTool);

    // Support drag and drop on workspace controls to add more images
    if (elements.workspaceControls) {
      elements.workspaceControls.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
      elements.workspaceControls.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(Array.from(e.dataTransfer.files));
        }
      });
    }
  }

  async function handleFiles(files) {
    let invalidCount = 0;
    let duplicateCount = 0;

    for (const file of files) {
      const isValid = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
      if (!isValid) {
        invalidCount++;
        continue;
      }

      // Check duplicates
      const isDuplicate = imageList.some(
        (item) => item.name === file.name && item.size === file.size && item.file.lastModified === file.lastModified
      );
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        const dimensions = await getImageDimensions(dataUrl);

        imageList.push({
          file: file,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          dataUrl: dataUrl,
          width: dimensions.width,
          height: dimensions.height
        });

        if (window.EcrioXAnalytics) {
          window.EcrioXAnalytics.trackFileUpload(TOOL_ID, file.type || "image/jpeg", file.size);
        }
      } catch (err) {
        console.error("Error loading image:", file.name, err);
      }
    }

    if (invalidCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${invalidCount} non-image file(s) were skipped.`);
    }

    if (duplicateCount > 0 && window.EcrioXApp) {
      window.EcrioXApp.showToast(`${duplicateCount} duplicate image(s) were skipped.`);
    }

    renderImageList();
  }

  function renderImageList() {
    if (imageList.length === 0) {
      elements.dropzone.style.display = "block";
      elements.workspaceControls.style.display = "none";
      elements.resultsBox.style.display = "none";
      return;
    }

    elements.dropzone.style.display = "none";
    elements.workspaceControls.style.display = "block";
    elements.resultsBox.style.display = "none";

    let totalBytes = 0;
    elements.imageListContainer.innerHTML = imageList
      .map((item, idx) => {
        totalBytes += item.size;
        return `
          <div class="image-item-card" data-index="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.75rem; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem; min-width: 0; flex: 1;">
              <span style="width: 1.75rem; height: 1.75rem; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                ${idx + 1}
              </span>
              <img src="${item.dataUrl}" alt="Preview" style="width: 48px; height: 48px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color); flex-shrink: 0;">
              <div style="min-width: 0;">
                <h5 style="font-size: 0.95rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.name)}</h5>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${item.width} &times; ${item.height}px &bull; ${formatBytes(item.size)}</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
              <button type="button" class="btn btn-sm btn-secondary move-up-btn" data-index="${idx}" title="Move Up" ${idx === 0 ? "disabled style='opacity:0.4;'" : ""}>&uarr;</button>
              <button type="button" class="btn btn-sm btn-secondary move-down-btn" data-index="${idx}" title="Move Down" ${idx === imageList.length - 1 ? "disabled style='opacity:0.4;'" : ""}>&darr;</button>
              <button type="button" class="btn btn-sm btn-secondary remove-btn" data-index="${idx}" title="Remove" style="color: var(--color-danger);">&#10005;</button>
            </div>
          </div>
        `;
      })
      .join("");

    elements.totalImageCount.textContent = `${imageList.length} Image${imageList.length > 1 ? "s" : ""}`;
    elements.totalImageSize.textContent = formatBytes(totalBytes);

    // Wire up row buttons
    elements.imageListContainer.querySelectorAll(".move-up-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-index"), 10);
        if (i > 0) {
          const t = imageList[i];
          imageList[i] = imageList[i - 1];
          imageList[i - 1] = t;
          renderImageList();
        }
      });
    });

    elements.imageListContainer.querySelectorAll(".move-down-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-index"), 10);
        if (i < imageList.length - 1) {
          const t = imageList[i];
          imageList[i] = imageList[i + 1];
          imageList[i + 1] = t;
          renderImageList();
        }
      });
    });

    elements.imageListContainer.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.getAttribute("data-index"), 10);
        imageList.splice(i, 1);
        renderImageList();
      });
    });

    elements.convertBtn.disabled = imageList.length === 0;
    elements.convertBtn.textContent = `Convert ${imageList.length} Image${imageList.length > 1 ? "s" : ""} to PDF`;
  }

  async function processConversion() {
    if (imageList.length === 0) return;

    const startTime = performance.now();
    elements.convertBtn.disabled = true;
    elements.clearAllBtn.disabled = true;
    elements.addMoreBtn.disabled = true;
    elements.progressContainer.style.display = "block";
    elements.progressBar.style.width = "10%";
    elements.progressText.textContent = "Creating PDF document...";

    const pageSizeMode = elements.pageSizeSelect.value; // 'a4', 'letter', 'fit'
    const orientationMode = elements.orientationSelect.value; // 'auto', 'portrait', 'landscape'
    const margin = parseInt(elements.marginSelect.value, 10); // 0, 20, 40
    const fitMode = elements.fitSelect.value; // 'contain', 'fill'

    try {
      const pdfDoc = await PDFLib.PDFDocument.create();
      pdfDoc.setProducer("EcrioX JPG to PDF Converter (https://ecriox.com)");
      pdfDoc.setCreator("EcrioX");

      const total = imageList.length;

      for (let i = 0; i < total; i++) {
        const item = imageList[i];
        elements.progressText.textContent = `Embedding image ${i + 1} of ${total}: ${item.name}...`;
        elements.progressBar.style.width = `${Math.round(((i + 1) / total) * 85)}%`;

        // Normalize image to JPEG/PNG bytes using canvas (guarantees format compatibility for WebP/GIF/BMP too)
        const imageBytes = await convertToJpegBytes(item.dataUrl);
        const embeddedImage = await pdfDoc.embedJpg(imageBytes);

        let imgWidth = embeddedImage.width;
        let imgHeight = embeddedImage.height;

        // Determine Page Dimensions
        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSizeMode !== "fit") {
          const std = PAGE_SIZES[pageSizeMode] || PAGE_SIZES.a4;
          let isLandscape = false;

          if (orientationMode === "landscape") {
            isLandscape = true;
          } else if (orientationMode === "auto" && imgWidth > imgHeight) {
            isLandscape = true;
          }

          pageWidth = isLandscape ? std[1] : std[0];
          pageHeight = isLandscape ? std[0] : std[1];
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate placement with margins and fit mode
        const availWidth = Math.max(1, pageWidth - margin * 2);
        const availHeight = Math.max(1, pageHeight - margin * 2);

        let drawWidth = availWidth;
        let drawHeight = availHeight;
        let drawX = margin;
        let drawY = margin;

        if (fitMode === "contain" || pageSizeMode === "fit") {
          const imgAspect = imgWidth / imgHeight;
          const boxAspect = availWidth / availHeight;

          if (imgAspect > boxAspect) {
            drawWidth = availWidth;
            drawHeight = availWidth / imgAspect;
          } else {
            drawHeight = availHeight;
            drawWidth = availHeight * imgAspect;
          }

          // Center on page
          drawX = margin + (availWidth - drawWidth) / 2;
          drawY = margin + (availHeight - drawHeight) / 2;
        }

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight
        });
      }

      elements.progressText.textContent = "Finalizing PDF document...";
      elements.progressBar.style.width = "95%";

      generatedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
      const blob = new Blob([generatedPdfBytes], { type: "application/pdf" });
      if (generatedBlobUrl) URL.revokeObjectURL(generatedBlobUrl);
      generatedBlobUrl = URL.createObjectURL(blob);

      const durationMs = performance.now() - startTime;
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
      }

      elements.progressBar.style.width = "100%";
      elements.progressContainer.style.display = "none";
      elements.resultsBox.style.display = "block";
      elements.finalPageCount.textContent = `${total} Page${total > 1 ? "s" : ""} Generated`;
      elements.finalPdfSize.textContent = `PDF File Size: ${formatBytes(generatedPdfBytes.length)}`;

      elements.convertBtn.disabled = false;
      elements.clearAllBtn.disabled = false;
      elements.addMoreBtn.disabled = false;

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("PDF created successfully!");
      }
    } catch (err) {
      console.error("Conversion error:", err);
      elements.progressContainer.style.display = "none";
      elements.convertBtn.disabled = false;
      elements.clearAllBtn.disabled = false;
      elements.addMoreBtn.disabled = false;
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Could not convert images to PDF. Please try again.");
      }
    }
  }

  function downloadPdf() {
    if (!generatedBlobUrl) return;

    const downloadFilename = `images_converted_ecriox.pdf`;
    const a = document.createElement("a");
    a.href = generatedBlobUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, "pdf");
    }
  }

  function resetTool() {
    imageList = [];
    generatedPdfBytes = null;
    if (generatedBlobUrl) {
      URL.revokeObjectURL(generatedBlobUrl);
      generatedBlobUrl = null;
    }
    elements.fileInput.value = "";
    elements.imageListContainer.innerHTML = "";
    elements.workspaceControls.style.display = "none";
    elements.resultsBox.style.display = "none";
    elements.progressContainer.style.display = "none";
    elements.dropzone.style.display = "block";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      img.onerror = () => resolve({ width: 800, height: 600 });
      img.src = dataUrl;
    });
  }

  function convertToJpegBytes(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");

        // White background for transparent PNG/WebP conversions
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error("Image conversion failed"));
            const buffer = await blob.arrayBuffer();
            resolve(buffer);
          },
          "image/jpeg",
          0.92
        );
      };
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
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
