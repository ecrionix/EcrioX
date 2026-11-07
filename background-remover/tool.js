/**
 * EcrioX Background Remover
 * 100% Client-Side AI Image Segmentation powered by Transformers.js (BRIA RMBG-1.4)
 */

import { pipeline, env, RawImage } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

// Configuration: load from HuggingFace Hub CDN
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
let segmenter = null;
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
 * Handle chosen image file
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

  updateProgress('Preparing image and AI model...', 5, 'Starting worker');

  try {
    // 1. Read file as Image
    const dataUrl = await readFileAsDataURL(file);
    sourceImage = await loadImage(dataUrl);

    // Update metadata preview
    imageName.textContent = file.name;
    imageMeta.textContent = `${sourceImage.naturalWidth} × ${sourceImage.naturalHeight} px (${formatBytes(file.size)})`;

    // Set original image in slider
    originalImg.src = dataUrl;

    // 2. Initialize or reuse AI Model
    if (!segmenter) {
      updateProgress('Loading AI Segmentation Model (briaai/RMBG-1.4)...', 15, 'Downloading model weights (~40MB, cached in browser)');
      
      segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        progress_callback: (info) => {
          if (info.status === 'progress' && info.total) {
            const pct = Math.min(90, Math.round((info.loaded / info.total) * 100));
            updateProgress(
              `Downloading AI model: ${info.file || 'weights'}...`,
              pct,
              `${Math.round(info.loaded / 1024 / 1024)}MB / ${Math.round(info.total / 1024 / 1024)}MB`
            );
          } else if (info.status === 'ready') {
            updateProgress('Model initialized. Segmenting image...', 92, 'Executing neural network');
          }
        }
      });
    }

    updateProgress('Detecting foreground subject and cutting background...', 95, 'Computing alpha mask');

    // 3. Process Segmentation
    const rawImage = await RawImage.fromURL(dataUrl);
    const mask = await segmenter(rawImage);

    // 4. Build Full-Resolution Transparent Cutout Canvas
    buildCutoutCanvas(sourceImage, mask);

    // 5. Render to UI
    renderCompositedOutput();

    // Show Studio
    progressBanner.style.display = 'none';
    studioCard.style.display = 'block';

    // Reset slider to 50%
    setSliderPosition(50);

  } catch (err) {
    console.error('Error during background removal:', err);
    progressStatus.textContent = 'Failed to remove background. ' + (err.message || 'Please try another image.');
    progressStatus.style.color = 'var(--color-danger)';
    progressDetails.textContent = 'Ensure WebGPU or WebAssembly is enabled in your browser.';
    
    // Allow re-trying
    setTimeout(() => {
      dropzone.style.display = 'block';
    }, 2500);
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

  // 2. Render the AI mask into a temp canvas scaled to exact full resolution
  const maskCanvas = mask.toCanvas();
  const tempMaskCanvas = document.createElement('canvas');
  tempMaskCanvas.width = width;
  tempMaskCanvas.height = height;
  const maskCtx = tempMaskCanvas.getContext('2d');
  maskCtx.drawImage(maskCanvas, 0, 0, width, height);

  const maskData = maskCtx.getImageData(0, 0, width, height).data;

  // 3. Apply the mask grayscale value to the alpha channel
  const pixels = imgData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const alphaVal = maskData[i]; // Grayscale R channel of mask
    pixels[i + 3] = alphaVal;
  }

  ctx.putImageData(imgData, 0, 0);
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
