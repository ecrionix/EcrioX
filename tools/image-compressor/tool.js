/**
 * EcrioX - Client-Side Image Compressor & Optimizer
 * 100% in-browser Canvas compression. Zero data transmitted over the network.
 */

(function () {
  "use strict";

  const TOOL_ID = "image-compressor";
  const TOOL_CATEGORY = "image";

  let currentFile = null;
  let originalImage = null;
  let compressedBlob = null;
  let compressedDataUrl = null;

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    qualityRange: document.getElementById("qualityRange"),
    qualityVal: document.getElementById("qualityVal"),
    outputFormat: document.getElementById("outputFormat"),
    maxWidthInput: document.getElementById("maxWidthInput"),
    compressBtn: document.getElementById("compressBtn"),
    resultsBox: document.getElementById("resultsBox"),
    origSizeText: document.getElementById("origSizeText"),
    compSizeText: document.getElementById("compSizeText"),
    savingsBadge: document.getElementById("savingsBadge"),
    previewImage: document.getElementById("previewImage"),
    downloadBtn: document.getElementById("downloadBtn"),
    resetBtn: document.getElementById("resetBtn")
  };

  function init() {
    if (!elements.dropzone || !elements.fileInput) return;

    // Analytics: Tool Opened
    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackToolOpen(TOOL_ID, TOOL_CATEGORY);
    }

    // Drag and Drop
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

    // Quality slider label
    elements.qualityRange.addEventListener("input", (e) => {
      elements.qualityVal.textContent = e.target.value + "%";
    });

    // Compress Action
    elements.compressBtn.addEventListener("click", processCompression);

    // Download Action
    elements.downloadBtn.addEventListener("click", downloadCompressedImage);

    // Reset
    elements.resetBtn.addEventListener("click", resetTool);
  }

  function handleFileSelect(file) {
    if (!file.type.match(/^image\/(jpeg|png|webp)/i)) {
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Please upload a valid image file (JPEG, PNG, or WebP).");
      }
      return;
    }

    currentFile = file;

    // Analytics: File Upload (Safe: only format & size bracket, NO filenames)
    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackFileUpload(TOOL_ID, file.type, file.size);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage = new Image();
      originalImage.onload = () => {
        elements.maxWidthInput.value = originalImage.width;
        elements.origSizeText.textContent = formatBytes(currentFile.size);
        elements.workspaceControls.style.display = "block";
        elements.dropzone.style.display = "none";
        // Auto-run compression at default 80%
        processCompression();
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function processCompression() {
    if (!originalImage || !currentFile) return;

    const startTime = performance.now();
    elements.compressBtn.disabled = true;
    elements.compressBtn.textContent = "Compressing...";

    setTimeout(() => {
      try {
        const quality = parseInt(elements.qualityRange.value, 10) / 100;
        let targetFormat = elements.outputFormat.value;
        if (targetFormat === "original") {
          targetFormat = currentFile.type || "image/jpeg";
        }

        // Calculate aspect-ratio dimensions
        let targetWidth = parseInt(elements.maxWidthInput.value, 10) || originalImage.width;
        let targetHeight = originalImage.height;

        if (targetWidth < originalImage.width) {
          const ratio = targetWidth / originalImage.width;
          targetHeight = Math.round(originalImage.height * ratio);
        } else {
          targetWidth = originalImage.width;
          targetHeight = originalImage.height;
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        // Maintain transparent canvas if PNG and output is PNG
        if (targetFormat === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error("Canvas compression failed");
            }
            compressedBlob = blob;
            compressedDataUrl = URL.createObjectURL(blob);

            const durationMs = performance.now() - startTime;
            if (window.EcrioXAnalytics) {
              window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
            }

            // Update UI
            elements.compSizeText.textContent = formatBytes(blob.size);
            const savingsPercent = Math.max(
              0,
              Math.round(((currentFile.size - blob.size) / currentFile.size) * 100)
            );
            elements.savingsBadge.textContent = `-${savingsPercent}% Reduction`;
            elements.savingsBadge.className =
              savingsPercent > 0 ? "badge badge-available" : "badge badge-coming-soon";

            elements.previewImage.src = compressedDataUrl;
            elements.resultsBox.style.display = "block";

            elements.compressBtn.disabled = false;
            elements.compressBtn.textContent = "Update Compression";

            if (window.EcrioXApp) {
              window.EcrioXApp.showToast("Image compressed successfully!");
            }
          },
          targetFormat,
          quality
        );
      } catch (err) {
        console.error("Compression error:", err);
        elements.compressBtn.disabled = false;
        elements.compressBtn.textContent = "Compress Image";
        if (window.EcrioXApp) {
          window.EcrioXApp.showToast("Could not compress this image. Please try another.");
        }
      }
    }, 50);
  }

  function downloadCompressedImage() {
    if (!compressedBlob) return;

    let extension = "jpg";
    if (compressedBlob.type === "image/png") extension = "png";
    if (compressedBlob.type === "image/webp") extension = "webp";

    const link = document.createElement("a");
    link.href = compressedDataUrl;
    link.download = `ecriox_compressed.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Analytics: Download
    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, extension);
    }
  }

  function resetTool() {
    currentFile = null;
    originalImage = null;
    compressedBlob = null;
    if (compressedDataUrl) {
      URL.revokeObjectURL(compressedDataUrl);
      compressedDataUrl = null;
    }
    elements.fileInput.value = "";
    elements.workspaceControls.style.display = "none";
    elements.resultsBox.style.display = "none";
    elements.dropzone.style.display = "block";
    elements.compressBtn.textContent = "Compress Image";
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
