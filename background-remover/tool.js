/**
 * EcrioX Background Remover
 * 100% Client-Side AI Image Segmentation
 * Powered by Transformers.js (BRIA RMBG-1.4 & Xenova MODNet Fallback)
 */

import { AutoModel, AutoProcessor, RawImage, pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3';

// HuggingFace CDN configuration
env.allowLocalModels = false;

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const progressBanner = document.getElementById('progress-banner');
const progressFill = document.getElementById('progress-fill');
const progressStatus = document.getElementById('progress-status');
const progressDetails = document.getElementById('progress-details');
const progressPercent = document.getElementById('progress-percent');

const studioCard = document.getElementById('studio-card');
const imageName = document.getElementById('image-name');
const imageMeta = document.getElementById('image-meta');
const btnReset = document.getElementById('btn-reset');

const comparisonWrapper = document.getElementById('comparison-wrapper');
const sliderStage = document.getElementById('slider-stage');
const outputCanvas = document.getElementById('output-canvas');
const originalImg = document.getElementById('original-img');
const sliderOverlay = document.getElementById('slider-overlay');
const sliderHandle = document.getElementById('slider-handle');

const bgSwatches = document.querySelectorAll('.bg-swatch');
const customColorPicker = document.getElementById('custom-color-picker');
const backdropInput = document.getElementById('backdrop-input');

const btnCopy = document.getElementById('btn-copy');
const btnDownload = document.getElementById('btn-download');

// State
let rmbgModel = null;
let rmbgProcessor = null;
let modnetPipeline = null;
let currentFile = null;
let sourceImage = null;       // Original HTMLImageElement
let cutoutCanvas = null;      // Master canvas with transparent cutout at full resolution
let backdropImage = null;     // Optional custom backdrop HTMLImageElement
let activeBg = 'transparent'; // 'transparent' | hex color | 'backdrop'
let sliderPos = 50;           // Percentage
let isDraggingSlider = false;

// Initialize
initEvents();

function initEvents() {
  // Dropzone click & drag
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  // Reset button
  btnReset.addEventListener('click', resetStudio);

  // Background Options
  bgSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      bgSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      activeBg = swatch.getAttribute('data-bg');
      backdropImage = null;
      renderCompositedOutput();
    });
  });

  customColorPicker.addEventListener('input', (e) => {
    bgSwatches.forEach(s => s.classList.remove('active'));
    activeBg = e.target.value;
    backdropImage = null;
    renderCompositedOutput();
  });

  backdropInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          backdropImage = img;
          activeBg = 'backdrop';
          bgSwatches.forEach(s => s.classList.remove('active'));
          renderCompositedOutput();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Download & Copy buttons
  btnDownload.addEventListener('click', downloadHDResult);
  btnCopy.addEventListener('click', copyToClipboard);

  // Split Slider Interactions
  initSliderInteractions();
}

/**
 * Handle chosen image file with multi-tier AI inference
 */
async function handleSelectedFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file (JPG, PNG, or WebP).');
    return;
  }

  currentFile = file;
  dropzone.style.display = 'none';
  progressBanner.style.display = 'block';
  studioCard.style.display = 'none';

  updateProgress('Preparing image and AI engine...', 5, 'Initializing browser memory');

  try {
    // 1. Read file as Image
    const dataUrl = await readFileAsDataURL(file);
    sourceImage = await loadImage(dataUrl);

    // Update metadata preview
    imageName.textContent = file.name;
    imageMeta.textContent = `${sourceImage.naturalWidth} × ${sourceImage.naturalHeight} px (${formatBytes(file.size)})`;

    // Set original image in comparison slider
    originalImg.src = dataUrl;

    let maskResult = null;

    // TIER 1: Primary Model - BRIA RMBG-1.4 via AutoModel + AutoProcessor
    try {
      if (!rmbgModel || !rmbgProcessor) {
        updateProgress('Loading Neural Model (briaai/RMBG-1.4)...', 15, 'Downloading quantized ONNX weights (~44MB, cached locally)');

        rmbgModel = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
          config: { model_type: 'custom' },
          quantized: true,
          progress_callback: (info) => {
            if (info.status === 'progress' && info.total) {
              const pct = Math.min(85, Math.round((info.loaded / info.total) * 75) + 10);
              updateProgress(
                `Downloading AI model: ${info.file || 'weights'}...`,
                pct,
                `${Math.round(info.loaded / 1024 / 1024)}MB / ${Math.round(info.total / 1024 / 1024)}MB`
              );
            } else if (info.status === 'ready') {
              updateProgress('Neural network ready. Loading image processor...', 88, 'Configuring tensor normalization');
            }
          }
        });

        rmbgProcessor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
          config: {
            do_normalize: true,
            do_pad: false,
            do_rescale: true,
            do_resize: true,
            image_mean: [0.5, 0.5, 0.5],
            feature_extractor_type: 'ImageFeatureExtractor',
            image_std: [1, 1, 1],
            resample: 2,
            rescale_factor: 0.00392156862745098,
            size: { width: 1024, height: 1024 }
          }
        });
      }

      updateProgress('Detecting subject and computing alpha mask...', 92, 'Running local neural inference');
      const rawImage = await RawImage.fromURL(dataUrl);
      const { pixel_values } = await rmbgProcessor(rawImage);
      const { output } = await rmbgModel({ input: pixel_values });
      maskResult = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(rawImage.width, rawImage.height);

    } catch (rmbgErr) {
      console.warn('BRIA RMBG-1.4 failed, trying MODNet fallback:', rmbgErr);

      // TIER 2: Secondary Fallback - Xenova/modnet (lightweight 6.6MB matting model)
      try {
        updateProgress('Switching to lightweight AI matting model (MODNet)...', 40, 'Fallback model download (~6.6MB)');
        if (!modnetPipeline) {
          modnetPipeline = await pipeline('image-segmentation', 'Xenova/modnet', {
            quantized: true,
            progress_callback: (info) => {
              if (info.status === 'progress' && info.total) {
                const pct = Math.min(85, Math.round((info.loaded / info.total) * 75) + 10);
                updateProgress('Downloading MODNet weights...', pct, `${Math.round(info.loaded / 1024 / 1024)}MB / ${Math.round(info.total / 1024 / 1024)}MB`);
              }
            }
          });
        }
        updateProgress('Segmenting foreground with MODNet...', 90, 'Computing alpha matte');
        const rawImage = await RawImage.fromURL(dataUrl);
        maskResult = await modnetPipeline(rawImage);
      } catch (modnetErr) {
        console.warn('MODNet fallback failed, attempting local canvas color segmentation:', modnetErr);

        // TIER 3: Local Canvas segmentation fallback (no network/WASM required)
        updateProgress('Performing edge-aware color segmentation...', 80, 'Browser-native canvas processing');
        maskResult = computeCanvasMask(sourceImage);
      }
    }

    updateProgress('Generating high-resolution transparent cutout...', 98, 'Applying alpha channel');

    // 4. Build Full-Resolution Transparent Cutout Canvas
    buildCutoutCanvas(sourceImage, maskResult);

    // 5. Render to UI
    renderCompositedOutput();

    // Show Studio
    progressBanner.style.display = 'none';
    studioCard.style.display = 'block';

    // Reset slider to 50%
    setSliderPosition(50);

  } catch (err) {
    console.error('Error during background removal:', err);
    progressStatus.textContent = 'Failed to process image: ' + (err.message || 'Unknown error');
    progressStatus.style.color = 'var(--color-danger)';
    progressDetails.textContent = 'Please check your internet connection or try a different image format (PNG/JPG).';

    setTimeout(() => {
      dropzone.style.display = 'block';
    }, 3500);
  }
}

/**
 * Composite the raw segmentation mask onto the full-resolution source image
 */
function buildCutoutCanvas(img, mask) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  cutoutCanvas = document.createElement('canvas');
  cutoutCanvas.width = width;
  cutoutCanvas.height = height;
  const ctx = cutoutCanvas.getContext('2d', { willReadFrequently: true });

  // 1. Draw source image at full resolution
  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  // 2. Extract mask alpha data
  if (mask && typeof mask.toCanvas === 'function') {
    const maskCanvas = mask.toCanvas();
    const tempMaskCanvas = document.createElement('canvas');
    tempMaskCanvas.width = width;
    tempMaskCanvas.height = height;
    const maskCtx = tempMaskCanvas.getContext('2d');
    maskCtx.drawImage(maskCanvas, 0, 0, width, height);
    const maskData = maskCtx.getImageData(0, 0, width, height).data;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i + 3] = maskData[i]; // Grayscale R channel
    }
  } else if (mask && mask.data) {
    // RawImage or Uint8Array
    const maskData = mask.data;
    const isSingleChannel = maskData.length === width * height;
    for (let i = 0; i < width * height; i++) {
      pixels[i * 4 + 3] = isSingleChannel ? maskData[i] : maskData[i * 4];
    }
  } else if (mask instanceof ImageData) {
    const maskData = mask.data;
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i + 3] = maskData[i + 3];
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Client-side canvas fallback mask generator
 * Detects background color based on perimeter pixels and computes smooth alpha distance
 */
function computeCanvasMask(img) {
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample perimeter pixels to identify background color
  let rBg = 0, gBg = 0, bBg = 0, samples = 0;
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 50))) {
    // Top border
    let idx = (0 * width + x) * 4;
    rBg += data[idx]; gBg += data[idx + 1]; bBg += data[idx + 2]; samples++;
    // Bottom border
    idx = ((height - 1) * width + x) * 4;
    rBg += data[idx]; gBg += data[idx + 1]; bBg += data[idx + 2]; samples++;
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 50))) {
    // Left border
    let idx = (y * width + 0) * 4;
    rBg += data[idx]; gBg += data[idx + 1]; bBg += data[idx + 2]; samples++;
    // Right border
    idx = (y * width + (width - 1)) * 4;
    rBg += data[idx]; gBg += data[idx + 1]; bBg += data[idx + 2]; samples++;
  }
  rBg = rBg / samples;
  gBg = gBg / samples;
  bBg = bBg / samples;

  const thresholdLow = 25;
  const thresholdHigh = 75;

  const alphaData = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - rBg;
    const dg = data[i + 1] - gBg;
    const db = data[i + 2] - bBg;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    let alpha = 255;
    if (dist < thresholdLow) {
      alpha = 0;
    } else if (dist < thresholdHigh) {
      alpha = Math.round(((dist - thresholdLow) / (thresholdHigh - thresholdLow)) * 255);
    }
    alphaData[i / 4] = alpha;
  }

  return {
    width: width,
    height: height,
    data: alphaData
  };
}

/**
 * Render the cutout composited with the selected background onto outputCanvas
 */
function renderCompositedOutput() {
  if (!cutoutCanvas) return;

  const width = cutoutCanvas.width;
  const height = cutoutCanvas.height;

  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  if (activeBg === 'transparent') {
    // Transparent alpha cutout
    ctx.drawImage(cutoutCanvas, 0, 0);
    comparisonWrapper.className = 'comparison-wrapper checkerboard-bg';
  } else if (activeBg === 'backdrop' && backdropImage) {
    comparisonWrapper.className = 'comparison-wrapper';
    // Draw backdrop scaled to cover canvas
    drawCoverImage(ctx, backdropImage, width, height);
    ctx.drawImage(cutoutCanvas, 0, 0);
  } else {
    // Solid color background
    comparisonWrapper.className = 'comparison-wrapper';
    ctx.fillStyle = activeBg;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(cutoutCanvas, 0, 0);
  }
}

/**
 * Draw an image covering the canvas like object-fit: cover
 */
function drawCoverImage(ctx, img, canvasW, canvasH) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = canvasW / canvasH;
  let renderW, renderH, offsetX, offsetY;

  if (imgRatio > canvasRatio) {
    renderH = canvasH;
    renderW = canvasH * imgRatio;
    offsetX = (canvasW - renderW) / 2;
    offsetY = 0;
  } else {
    renderW = canvasW;
    renderH = canvasW / imgRatio;
    offsetX = 0;
    offsetY = (canvasH - renderH) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
}

/**
 * Update Progress UI
 */
function updateProgress(status, percent, details) {
  progressStatus.textContent = status;
  progressPercent.textContent = percent + '%';
  progressFill.style.width = percent + '%';
  if (details) progressDetails.textContent = details;
}

/**
 * Reset Studio back to upload state
 */
function resetStudio() {
  studioCard.style.display = 'none';
  progressBanner.style.display = 'none';
  dropzone.style.display = 'block';
  fileInput.value = '';
  currentFile = null;
  sourceImage = null;
  cutoutCanvas = null;
  backdropImage = null;
  activeBg = 'transparent';
  bgSwatches.forEach(s => s.classList.remove('active'));
  document.querySelector('.bg-swatch.transparent')?.classList.add('active');
}

/**
 * Download High-Resolution Cutout PNG
 */
function downloadHDResult() {
  if (!outputCanvas) return;

  outputCanvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'photo';
    a.download = `ecriox-cutout-${baseName}.png`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Copy Result Image to Clipboard
 */
async function copyToClipboard() {
  if (!outputCanvas) return;

  try {
    outputCanvas.toBlob(async (blob) => {
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      const originalText = btnCopy.innerHTML;
      btnCopy.innerHTML = `<span style="color: var(--color-success); font-weight:700;">✓ Copied!</span>`;
      setTimeout(() => {
        btnCopy.innerHTML = originalText;
      }, 2000);
    }, 'image/png');
  } catch (err) {
    console.warn('Clipboard copy error:', err);
    alert('Clipboard copy is not supported in this browser. Please use the Download button.');
  }
}

/**
 * Split Comparison Slider Drag & Touch Logic
 */
function initSliderInteractions() {
  function handleSliderMove(e) {
    if (!isDraggingSlider && e.type !== 'click') return;

    const rect = sliderStage.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percent);
  }

  function startDrag(e) {
    isDraggingSlider = true;
    handleSliderMove(e);
    e.preventDefault();
  }

  function stopDrag() {
    isDraggingSlider = false;
  }

  sliderStage.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', handleSliderMove);
  window.addEventListener('mouseup', stopDrag);

  sliderStage.addEventListener('touchstart', startDrag, { passive: false });
  window.addEventListener('touchmove', handleSliderMove, { passive: false });
  window.addEventListener('touchend', stopDrag);
}

function setSliderPosition(percent) {
  sliderPos = percent;
  sliderOverlay.style.width = `${percent}%`;
  sliderHandle.style.left = `${percent}%`;
}

// Helpers
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
