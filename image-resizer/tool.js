/**
 * EcrioX - Client-Side Image Resizer
 * High-quality bicubic/bilinear canvas image resampling with custom dimensions, presets, and aspect locking.
 * 100% private in-browser processing.
 */

(function () {
  "use strict";

  const TOOL_ID = "image-resizer";
  const TOOL_CATEGORY = "image";

  let currentFile = null;
  let originalImage = null;
  let resizedBlob = null;
  let resizedDataUrl = null;
  let lockAspectRatio = true;
  let originalAspect = 1.0;

  const PRESETS = {
    "ig-square": [1080, 1080],
    "ig-story": [1080, 1920],
    "yt-thumb": [1280, 720],
    "tw-post": [1200, 675],
    "fb-post": [1200, 630],
    "hd-1080": [1920, 1080],
    "hd-720": [1280, 720]
  };

  const elements = {
    dropzone: document.getElementById("dropzone"),
    fileInput: document.getElementById("fileInput"),
    workspaceControls: document.getElementById("workspaceControls"),
    origDimensionsText: document.getElementById("origDimensionsText"),
    origSizeText: document.getElementById("origSizeText"),
    origFormatText: document.getElementById("origFormatText"),
    widthInput: document.getElementById("widthInput"),
    heightInput: document.getElementById("heightInput"),
    lockAspectBtn: document.getElementById("lockAspectBtn"),
    lockIcon: document.getElementById("lockIcon"),
    presetSelect: document.getElementById("presetSelect"),
    formatSelect: document.getElementById("formatSelect"),
    qualityRange: document.getElementById("qualityRange"),
    qualityVal: document.getElementById("qualityVal"),
    qualityGroup: document.getElementById("qualityGroup"),
    resizeBtn: document.getElementById("resizeBtn"),
    resetBtn: document.getElementById("resetBtn"),
    resultsBox: document.getElementById("resultsBox"),
    finalDimensionsText: document.getElementById("finalDimensionsText"),
    finalSizeText: document.getElementById("finalSizeText"),
    previewImage: document.getElementById("previewImage"),
    downloadBtn: document.getElementById("downloadBtn"),
    resizeAnotherBtn: document.getElementById("resizeAnotherBtn")
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

    // Width/Height synchronization
    elements.widthInput.addEventListener("input", onWidthChange);
    elements.heightInput.addEventListener("input", onHeightChange);

    // Aspect ratio toggle
    elements.lockAspectBtn.addEventListener("click", toggleLockAspect);

    // Percentage quick buttons
    document.querySelectorAll(".percent-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const factor = parseFloat(btn.getAttribute("data-pct")) / 100;
        applyPercentage(factor);
      });
    });

    // Preset selector
    elements.presetSelect.addEventListener("change", onPresetChange);

    // Quality range label
    elements.qualityRange.addEventListener("input", (e) => {
      elements.qualityVal.textContent = e.target.value + "%";
    });

    // Format change (show/hide quality slider for PNG)
    elements.formatSelect.addEventListener("change", () => {
      elements.qualityGroup.style.display = elements.formatSelect.value === "image/png" ? "none" : "block";
    });

    elements.resizeBtn.addEventListener("click", processResize);
    elements.downloadBtn.addEventListener("click", downloadResizedImage);
    elements.resetBtn.addEventListener("click", resetTool);
    elements.resizeAnotherBtn.addEventListener("click", resetTool);
  }

  function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("Please upload an image file (JPEG, PNG, or WebP).");
      }
      return;
    }

    currentFile = file;

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackFileUpload(TOOL_ID, file.type, file.size);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      originalImage = new Image();
      originalImage.onload = () => {
        const w = originalImage.naturalWidth || originalImage.width;
        const h = originalImage.naturalHeight || originalImage.height;
        originalAspect = w / h;

        elements.origDimensionsText.textContent = `${w} × ${h} px`;
        elements.origSizeText.textContent = formatBytes(currentFile.size);
        elements.origFormatText.textContent = file.type.replace("image/", "").toUpperCase();

        elements.widthInput.value = w;
        elements.heightInput.value = h;

        elements.dropzone.style.display = "none";
        elements.workspaceControls.style.display = "block";
        elements.resultsBox.style.display = "none";

        // Initial preview
        processResize();
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function onWidthChange() {
    if (lockAspectRatio && originalAspect > 0) {
      const w = parseInt(elements.widthInput.value, 10);
      if (!isNaN(w) && w > 0) {
        elements.heightInput.value = Math.round(w / originalAspect);
      }
    }
  }

  function onHeightChange() {
    if (lockAspectRatio && originalAspect > 0) {
      const h = parseInt(elements.heightInput.value, 10);
      if (!isNaN(h) && h > 0) {
        elements.widthInput.value = Math.round(h * originalAspect);
      }
    }
  }

  function toggleLockAspect() {
    lockAspectRatio = !lockAspectRatio;
    elements.lockAspectBtn.setAttribute("aria-pressed", lockAspectRatio ? "true" : "false");
    elements.lockAspectBtn.className = lockAspectRatio ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary";
    elements.lockIcon.innerHTML = lockAspectRatio
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`;
  }

  function applyPercentage(factor) {
    if (!originalImage) return;
    const origW = originalImage.naturalWidth || originalImage.width;
    const origH = originalImage.naturalHeight || originalImage.height;
    elements.widthInput.value = Math.round(origW * factor);
    elements.heightInput.value = Math.round(origH * factor);
  }

  function onPresetChange() {
    const val = elements.presetSelect.value;
    if (val && PRESETS[val]) {
      const [w, h] = PRESETS[val];
      elements.widthInput.value = w;
      elements.heightInput.value = h;
    }
  }

  function processResize() {
    if (!originalImage || !currentFile) return;

    const startTime = performance.now();
    elements.resizeBtn.disabled = true;
    elements.resizeBtn.textContent = "Resizing...";

    const targetWidth = parseInt(elements.widthInput.value, 10);
    const targetHeight = parseInt(elements.heightInput.value, 10);

    if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
      if (window.EcrioXApp) window.EcrioXApp.showToast("Please enter valid width and height dimensions in pixels.");
      elements.resizeBtn.disabled = false;
      elements.resizeBtn.textContent = "Resize Image";
      return;
    }

    setTimeout(() => {
      try {
        let targetMime = elements.formatSelect.value;
        if (targetMime === "original") {
          targetMime = currentFile.type || "image/jpeg";
        }
        const quality = parseInt(elements.qualityRange.value, 10) / 100;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        // High quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // White background if JPEG
        if (targetMime === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

        canvas.toBlob(
          (blob) => {
            if (!blob) throw new Error("Canvas resize failed");

            resizedBlob = blob;
            if (resizedDataUrl) URL.revokeObjectURL(resizedDataUrl);
            resizedDataUrl = URL.createObjectURL(blob);

            const durationMs = performance.now() - startTime;
            if (window.EcrioXAnalytics) {
              window.EcrioXAnalytics.trackProcessingComplete(TOOL_ID, durationMs);
            }

            elements.previewImage.src = resizedDataUrl;
            elements.finalDimensionsText.textContent = `${targetWidth} × ${targetHeight} px`;
            elements.finalSizeText.textContent = formatBytes(blob.size);

            elements.resultsBox.style.display = "block";
            elements.resizeBtn.disabled = false;
            elements.resizeBtn.textContent = "Update Dimensions";

            if (window.EcrioXApp) {
              window.EcrioXApp.showToast("Image resized successfully!");
            }
          },
          targetMime,
          quality
        );
      } catch (err) {
        console.error("Resize error:", err);
        elements.resizeBtn.disabled = false;
        elements.resizeBtn.textContent = "Resize Image";
        if (window.EcrioXApp) {
          window.EcrioXApp.showToast("Could not resize image. Please try smaller dimensions.");
        }
      }
    }, 40);
  }

  function downloadResizedImage() {
    if (!resizedBlob || !resizedDataUrl) return;

    let ext = "jpg";
    if (resizedBlob.type === "image/png") ext = "png";
    if (resizedBlob.type === "image/webp") ext = "webp";

    const base = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "image";
    const w = elements.widthInput.value;
    const h = elements.heightInput.value;
    const downloadFilename = `${base}_${w}x${h}_ecriox.${ext}`;

    const a = document.createElement("a");
    a.href = resizedDataUrl;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackDownload(TOOL_ID, ext);
    }
  }

  function resetTool() {
    currentFile = null;
    originalImage = null;
    resizedBlob = null;
    if (resizedDataUrl) {
      URL.revokeObjectURL(resizedDataUrl);
      resizedDataUrl = null;
    }
    elements.fileInput.value = "";
    elements.workspaceControls.style.display = "none";
    elements.resultsBox.style.display = "none";
    elements.dropzone.style.display = "block";
    elements.resizeBtn.textContent = "Resize Image";
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
