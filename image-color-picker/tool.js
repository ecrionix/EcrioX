/**
 * EcrioX - Image Color Picker & Eyedropper
 * Pixel inspection, 10x magnifier loupe, multi-space color conversion (HEX, RGB, HSL, CMYK),
 * dominant palette clustering, and history tracking.
 */
(function() {
  'use strict';

  const fileInput = document.getElementById('file-input');
  const btnSample = document.getElementById('btn-sample-img');
  const btnEyeDropper = document.getElementById('btn-eyedropper');
  const canvasWrapper = document.getElementById('canvas-wrapper');
  const dropZone = document.getElementById('drop-zone');
  const canvas = document.getElementById('image-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const loupeContainer = document.getElementById('loupe-container');
  const loupeCanvas = document.getElementById('loupe-canvas');
  const loupeCtx = loupeCanvas.getContext('2d');
  loupeCtx.imageSmoothingEnabled = false;

  // Active color preview & code values
  const activePreview = document.getElementById('active-preview');
  const activeHexBadge = document.getElementById('active-hex-badge');
  const valHex = document.getElementById('val-hex');
  const valRgb = document.getElementById('val-rgb');
  const valHsl = document.getElementById('val-hsl');
  const valCmyk = document.getElementById('val-cmyk');

  const paletteGrid = document.getElementById('palette-grid');
  const historyGrid = document.getElementById('history-grid');
  const btnClearHistory = document.getElementById('btn-clear-history');

  let currentImage = null;
  const historyColors = [];

  // --- COLOR MATH HELPERS ---
  function rgbToHex(r, g, b) {
    const toHex = c => Math.round(c).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  function rgbToCmyk(r, g, b) {
    if (r === 0 && g === 0 && b === 0) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }
    const c1 = 1 - (r / 255);
    const m1 = 1 - (g / 255);
    const y1 = 1 - (b / 255);
    const k = Math.min(c1, Math.min(m1, y1));
    const c = (c1 - k) / (1 - k);
    const m = (m1 - k) / (1 - k);
    const y = (y1 - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function updateColorUI(r, g, b) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    const cmyk = rgbToCmyk(r, g, b);

    activePreview.style.backgroundColor = hex;
    activeHexBadge.textContent = hex;

    // Check luminance to choose text badge contrast
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    activeHexBadge.style.color = lum > 140 ? '#000000' : '#ffffff';
    activeHexBadge.style.background = lum > 140 ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';

    valHex.textContent = hex;
    valRgb.textContent = `rgb(${r}, ${g}, ${b})`;
    valHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    valCmyk.textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

    addToHistory(hex);
  }

  function addToHistory(hex) {
    if (historyColors.includes(hex)) return;
    historyColors.unshift(hex);
    if (historyColors.length > 14) historyColors.pop();

    historyGrid.innerHTML = '';
    historyColors.forEach(h => {
      const btn = document.createElement('button');
      btn.className = 'history-btn';
      btn.style.backgroundColor = h;
      btn.title = h;
      btn.addEventListener('click', () => {
        const rgb = hexToRgb(h);
        updateColorUI(rgb.r, rgb.g, rgb.b);
      });
      historyGrid.appendChild(btn);
    });
  }

  btnClearHistory.addEventListener('click', () => {
    historyColors.length = 0;
    historyGrid.innerHTML = '';
  });

  // --- IMAGE RENDERING ON CANVAS ---
  function loadImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      currentImage = img;
      dropZone.style.display = 'none';
      canvas.style.display = 'block';

      // Set canvas dimensions
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Extract Dominant Palette
      extractDominantPalette();

      // Sample center pixel
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      samplePixel(centerX, centerY);
    };
    img.src = src;
  }

  function samplePixel(x, y) {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    updateColorUI(pixel[0], pixel[1], pixel[2]);
  }

  // --- DOMINANT PALETTE EXTRACTION ---
  function extractDominantPalette() {
    paletteGrid.innerHTML = '';
    const sampleW = Math.min(100, canvas.width);
    const sampleH = Math.min(100, canvas.height);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = sampleW;
    thumbCanvas.height = sampleH;
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(canvas, 0, 0, sampleW, sampleH);

    const imgData = thumbCtx.getImageData(0, 0, sampleW, sampleH).data;
    const colorCounts = {};

    // Quantize by grouping RGB into chunks of 32
    for (let i = 0; i < imgData.length; i += 4) {
      const alpha = imgData[i + 3];
      if (alpha < 128) continue; // skip transparent

      const r = Math.round(imgData[i] / 24) * 24;
      const g = Math.round(imgData[i + 1] / 24) * 24;
      const b = Math.round(imgData[i + 2] / 24) * 24;
      const hex = rgbToHex(Math.min(255, r), Math.min(255, g), Math.min(255, b));

      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    const sorted = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
    const palette = sorted.slice(0, 12);

    palette.forEach(hex => {
      const btn = document.createElement('button');
      btn.className = 'swatch-btn';
      btn.style.backgroundColor = hex;
      btn.title = hex;
      btn.addEventListener('click', () => {
        const rgb = hexToRgb(hex);
        updateColorUI(rgb.r, rgb.g, rgb.b);
      });
      paletteGrid.appendChild(btn);
    });
  }

  // --- LOUPE / MAGNIFIER LOGIC ---
  function handlePointerMove(e) {
    if (!currentImage) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      loupeContainer.style.display = 'none';
      return;
    }

    // Exact canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor((clientX - rect.left) * scaleX);
    const canvasY = Math.floor((clientY - rect.top) * scaleY);

    if (canvasX < 0 || canvasY < 0 || canvasX >= canvas.width || canvasY >= canvas.height) {
      loupeContainer.style.display = 'none';
      return;
    }

    // Render Loupe
    loupeContainer.style.display = 'block';
    
    // Position loupe offset relative to container
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    let loupeLeft = clientX - wrapperRect.left + 20;
    let loupeTop = clientY - wrapperRect.top - 120;

    // Flip if near right/top edges
    if (loupeLeft + 130 > wrapperRect.width) loupeLeft -= 150;
    if (loupeTop < 10) loupeTop += 130;

    loupeContainer.style.left = `${loupeLeft}px`;
    loupeContainer.style.top = `${loupeTop}px`;

    // Draw 10x magnified patch onto loupe canvas
    // Sample a 12x12 area centered at cursor
    const patchSize = 12;
    const halfPatch = patchSize / 2;
    const sx = Math.max(0, Math.min(canvas.width - patchSize, canvasX - halfPatch));
    const sy = Math.max(0, Math.min(canvas.height - patchSize, canvasY - halfPatch));

    loupeCtx.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
    loupeCtx.drawImage(canvas, sx, sy, patchSize, patchSize, 0, 0, loupeCanvas.width, loupeCanvas.height);
  }

  function handleCanvasClick(e) {
    if (!currentImage) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = Math.floor((clientX - rect.left) * scaleX);
    const canvasY = Math.floor((clientY - rect.top) * scaleY);

    samplePixel(canvasX, canvasY);
  }

  canvas.addEventListener('mousemove', handlePointerMove);
  canvas.addEventListener('mouseleave', () => { loupeContainer.style.display = 'none'; });
  canvas.addEventListener('click', handleCanvasClick);

  canvas.addEventListener('touchmove', (e) => {
    handlePointerMove(e);
    handleCanvasClick(e);
  }, { passive: true });
  canvas.addEventListener('touchend', () => { loupeContainer.style.display = 'none'; });

  // --- FILE HANDLING ---
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => loadImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  });

  dropZone.addEventListener('click', () => fileInput.click());

  // Drag and drop
  ['dragenter', 'dragover'].forEach(name => {
    canvasWrapper.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });
  ['dragleave', 'drop'].forEach(name => {
    canvasWrapper.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });
  canvasWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => loadImage(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  });

  // Clipboard Paste Support
  window.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = ev => loadImage(ev.target.result);
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  });

  // Sample Image Generator
  btnSample.addEventListener('click', () => {
    // Generate a vibrant colorful test canvas
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 640;
    sampleCanvas.height = 420;
    const sCtx = sampleCanvas.getContext('2d');

    // Gradient background
    const grad = sCtx.createLinearGradient(0, 0, 640, 420);
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(0.3, '#7c3aed');
    grad.addColorStop(0.6, '#db2777');
    grad.addColorStop(1, '#ea580c');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 640, 420);

    // Some colorful geometric cards
    sCtx.fillStyle = '#10b981';
    sCtx.beginPath();
    sCtx.arc(160, 210, 80, 0, Math.PI * 2);
    sCtx.fill();

    sCtx.fillStyle = '#f59e0b';
    sCtx.beginPath();
    sCtx.roundRect(300, 130, 160, 160, 20);
    sCtx.fill();

    sCtx.fillStyle = '#06b6d4';
    sCtx.beginPath();
    sCtx.arc(520, 210, 60, 0, Math.PI * 2);
    sCtx.fill();

    loadImage(sampleCanvas.toDataURL());
  });

  // Native Screen Eyedropper API
  btnEyeDropper.addEventListener('click', async () => {
    if (!window.EyeDropper) {
      alert('The Screen Eyedropper is supported in Chromium browsers (Chrome, Edge, Opera). You can still click anywhere on any uploaded image below!');
      return;
    }
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        const rgb = hexToRgb(result.sRGBHex);
        updateColorUI(rgb.r, rgb.g, rgb.b);
      }
    } catch (err) {
      // User canceled eyedropper
    }
  });

  // Copy Buttons
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const textToCopy = document.getElementById(targetId).textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = original; }, 1800);
        });
      }
    });
  });

  // Load default sample on initial page load
  btnSample.click();
})();
