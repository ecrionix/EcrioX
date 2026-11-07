/**
 * EcrioX - Image Metadata Viewer & Remover
 * Pure client-side binary EXIF parser (TIFF/JPEG APP1) and canvas pixel sanitizer.
 */
(function() {
  'use strict';

  const dropZone = document.getElementById('meta-drop-zone');
  const fileInput = document.getElementById('meta-file-input');
  const previewWrapper = document.getElementById('preview-wrapper');
  const previewImg = document.getElementById('meta-preview-img');
  const btnStrip = document.getElementById('btn-strip-meta');
  const btnSample = document.getElementById('btn-load-sample-meta');

  const privacyBanner = document.getElementById('privacy-banner');
  const privacyTitle = document.getElementById('privacy-title');
  const privacyDesc = document.getElementById('privacy-desc');
  const privacyBadge = document.getElementById('privacy-badge');
  const metaTable = document.getElementById('meta-table');

  let currentFile = null;
  let currentImgObj = null;

  // --- BINARY EXIF PARSER ---
  function parseExif(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    if (dataView.byteLength < 4) return null;

    // Check JPEG SOI (0xFFD8)
    if (dataView.getUint16(0) !== 0xFFD8) {
      return null; // Not a standard JPEG
    }

    let offset = 2;
    const length = dataView.byteLength;

    while (offset < length) {
      if (dataView.getUint8(offset) !== 0xFF) break;
      const marker = dataView.getUint8(offset + 1);

      // APP1 Marker for EXIF is 0xFFE1
      if (marker === 0xE1) {
        return readApp1Exif(dataView, offset + 4);
      } else {
        // Move to next marker
        const markerLength = dataView.getUint16(offset + 2);
        offset += 2 + markerLength;
      }
    }
    return null;
  }

  function readApp1Exif(view, startOffset) {
    // Check "Exif\0\0" header (0x45 0x78 0x69 0x66 0x00 0x00)
    const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
    for (let i = 0; i < 6; i++) {
      if (view.getUint8(startOffset + i) !== exifHeader[i]) {
        return null; // Not valid Exif header
      }
    }

    const tiffOffset = startOffset + 6;
    const byteOrder = view.getUint16(tiffOffset);
    const littleEndian = (byteOrder === 0x4949); // 'II'

    if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
      return null; // Invalid TIFF magic 42
    }

    const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian);
    if (firstIfdOffset < 8) return null;

    const tags = {};

    function readTagValue(entryOffset) {
      const type = view.getUint16(entryOffset + 2, littleEndian);
      const count = view.getUint32(entryOffset + 4, littleEndian);
      const valOffset = view.getUint32(entryOffset + 8, littleEndian);

      // Type 2: ASCII string
      if (type === 2) {
        const strOffset = count > 4 ? tiffOffset + valOffset : entryOffset + 8;
        let str = '';
        for (let i = 0; i < count - 1; i++) {
          str += String.fromCharCode(view.getUint8(strOffset + i));
        }
        return str.trim();
      }

      // Type 3: SHORT (16-bit)
      if (type === 3) {
        return view.getUint16(entryOffset + 8, littleEndian);
      }

      // Type 4: LONG (32-bit)
      if (type === 4) {
        return view.getUint32(entryOffset + 8, littleEndian);
      }

      // Type 5: RATIONAL (two 32-bit uints: num/denom)
      if (type === 5) {
        const offset = tiffOffset + valOffset;
        if (count === 1) {
          const num = view.getUint32(offset, littleEndian);
          const den = view.getUint32(offset + 4, littleEndian);
          return den ? (num / den) : 0;
        } else {
          const arr = [];
          for (let i = 0; i < count; i++) {
            const num = view.getUint32(offset + i * 8, littleEndian);
            const den = view.getUint32(offset + i * 8 + 4, littleEndian);
            arr.push(den ? (num / den) : 0);
          }
          return arr;
        }
      }

      return null;
    }

    function readIfd(ifdOffset) {
      const numEntries = view.getUint16(ifdOffset, littleEndian);
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdOffset + 2 + (i * 12);
        const tagId = view.getUint16(entryOffset, littleEndian);
        tags[tagId] = readTagValue(entryOffset);
      }
    }

    readIfd(tiffOffset + firstIfdOffset);

    // Read Exif sub-IFD (tag 0x8769)
    if (tags[0x8769]) {
      readIfd(tiffOffset + tags[0x8769]);
    }

    // Read GPS sub-IFD (tag 0x8825)
    const gpsTags = {};
    if (tags[0x8825]) {
      const gpsIfdOffset = tiffOffset + tags[0x8825];
      const numEntries = view.getUint16(gpsIfdOffset, littleEndian);
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = gpsIfdOffset + 2 + (i * 12);
        const tagId = view.getUint16(entryOffset, littleEndian);
        gpsTags[tagId] = readTagValue(entryOffset);
      }
    }

    return { tags, gpsTags };
  }

  function dmsToDecimal(dms, ref) {
    if (!Array.isArray(dms) || dms.length < 3) return null;
    let dec = dms[0] + (dms[1] / 60) + (dms[2] / 3600);
    if (ref === 'S' || ref === 'W') dec = -dec;
    return parseFloat(dec.toFixed(6));
  }

  // --- RENDER METADATA UI ---
  function displayMetadata(file, exifData) {
    currentFile = file;
    btnStrip.disabled = false;

    let rows = [];

    // Basic file info
    rows.push(`<tr class="meta-section-hdr"><td colspan="2">File & Format Overview</td></tr>`);
    rows.push(`<tr><th>File Name</th><td>${file.name}</td></tr>`);
    rows.push(`<tr><th>File Size</th><td>${(file.size / 1024).toFixed(1)} KB (${file.size.toLocaleString()} bytes)</td></tr>`);
    rows.push(`<tr><th>MIME Type</th><td>${file.type || 'image/jpeg'}</td></tr>`);

    if (currentImgObj) {
      rows.push(`<tr><th>Resolution</th><td>${currentImgObj.naturalWidth} &times; ${currentImgObj.naturalHeight} pixels</td></tr>`);
    }

    let hasGps = false;
    let hasCameraInfo = false;

    if (exifData && exifData.tags) {
      const t = exifData.tags;
      const g = exifData.gpsTags || {};

      // Camera & Lens
      const make = t[0x010F];
      const model = t[0x0110];
      const lens = t[0xA434];
      const software = t[0x0131];

      if (make || model || lens || software) {
        hasCameraInfo = true;
        rows.push(`<tr class="meta-section-hdr"><td colspan="2">Camera & Hardware</td></tr>`);
        if (make) rows.push(`<tr><th>Device Make</th><td>${make}</td></tr>`);
        if (model) rows.push(`<tr><th>Device Model</th><td>${model}</td></tr>`);
        if (lens) rows.push(`<tr><th>Lens Model</th><td>${lens}</td></tr>`);
        if (software) rows.push(`<tr><th>Software</th><td>${software}</td></tr>`);
      }

      // Exposure Settings
      const exposureTime = t[0x829A];
      const fNumber = t[0x829D];
      const iso = t[0x8827];
      const focalLength = t[0x920A];

      if (exposureTime || fNumber || iso || focalLength) {
        rows.push(`<tr class="meta-section-hdr"><td colspan="2">Exposure & Optics</td></tr>`);
        if (fNumber) rows.push(`<tr><th>Aperture</th><td>f/${fNumber}</td></tr>`);
        if (exposureTime) rows.push(`<tr><th>Shutter Speed</th><td>${exposureTime < 1 ? `1/${Math.round(1/exposureTime)}s` : `${exposureTime}s`}</td></tr>`);
        if (iso) rows.push(`<tr><th>ISO Sensitivity</th><td>ISO ${iso}</td></tr>`);
        if (focalLength) rows.push(`<tr><th>Focal Length</th><td>${focalLength} mm</td></tr>`);
      }

      // Date & Time
      const dt = t[0x9003] || t[0x0132];
      if (dt) {
        rows.push(`<tr class="meta-section-hdr"><td colspan="2">Date & Timestamp</td></tr>`);
        rows.push(`<tr><th>Original Date</th><td>${dt}</td></tr>`);
      }

      // GPS
      if (g[0x0002] && g[0x0004]) {
        hasGps = true;
        const lat = dmsToDecimal(g[0x0002], g[0x0001]);
        const lon = dmsToDecimal(g[0x0004], g[0x0003]);
        const alt = g[0x0006];

        rows.push(`<tr class="meta-section-hdr" style="color: #dc2626 !important;"><td colspan="2">GPS Location (High Risk)</td></tr>`);
        rows.push(`<tr><th>Latitude</th><td>${lat} &deg; (${g[0x0001] || 'N'})</td></tr>`);
        rows.push(`<tr><th>Longitude</th><td>${lon} &deg; (${g[0x0003] || 'W'})</td></tr>`);
        if (alt) rows.push(`<tr><th>Altitude</th><td>${alt.toFixed(1)} meters above sea level</td></tr>`);
        rows.push(`<tr><th>Map Coordinates</th><td><a href="https://maps.google.com/?q=${lat},${lon}" target="_blank" rel="noopener" style="color: var(--color-primary); font-weight:700;">View on Google Maps &rarr;</a></td></tr>`);
      }
    }

    if (!hasCameraInfo && !hasGps) {
      rows.push(`<tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No EXIF, camera, or GPS headers detected in this file. The image is clean!</td></tr>`);
    }

    metaTable.innerHTML = `<tbody>${rows.join('')}</tbody>`;

    // Privacy Banner Evaluation
    privacyBanner.className = 'privacy-risk-banner';
    if (hasGps) {
      privacyBanner.classList.add('risk-high');
      privacyTitle.textContent = 'High Privacy Risk: Exact GPS Location Found!';
      privacyDesc.textContent = 'This image embeds precise geographic coordinates. Anyone downloading it can pinpoint where you snapped it.';
      privacyBadge.textContent = 'High Risk (GPS)';
      privacyBadge.style.background = '#dc2626';
      privacyBadge.style.color = '#ffffff';
    } else if (hasCameraInfo) {
      privacyBanner.classList.add('risk-medium');
      privacyTitle.textContent = 'Medium Privacy Risk: Hardware & Timestamp Found';
      privacyDesc.textContent = 'This image contains device serials, camera model, and capture date. Consider cleaning before sharing.';
      privacyBadge.textContent = 'Medium Risk';
      privacyBadge.style.background = '#d97706';
      privacyBadge.style.color = '#ffffff';
    } else {
      privacyBanner.classList.add('risk-safe');
      privacyTitle.textContent = 'Safe: No Sensitive EXIF Headers Found';
      privacyDesc.textContent = 'This photo does not contain embedded geolocation or personal camera metadata.';
      privacyBadge.textContent = 'Safe';
      privacyBadge.style.background = '#059669';
      privacyBadge.style.color = '#ffffff';
    }
  }

  // --- FILE PROCESSING ---
  function processFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;
      const exifData = parseExif(buffer);

      // Create image object for canvas sanitization & preview
      const img = new Image();
      img.onload = () => {
        currentImgObj = img;
        previewImg.src = img.src;
        previewWrapper.style.display = 'block';
        displayMetadata(file, exifData);
      };
      const blob = new Blob([buffer], { type: file.type });
      img.src = URL.createObjectURL(blob);
    };
    reader.readAsArrayBuffer(file);
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  });

  // --- STRIP METADATA (CANVAS RE-ENCODE) ---
  btnStrip.addEventListener('click', () => {
    if (!currentImgObj) return;

    btnStrip.disabled = true;
    const origText = btnStrip.textContent;
    btnStrip.textContent = 'Cleaning & Stripping EXIF...';

    const canvas = document.createElement('canvas');
    canvas.width = currentImgObj.naturalWidth;
    canvas.height = currentImgObj.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImgObj, 0, 0);

    const isPng = currentFile && currentFile.type === 'image/png';
    const mime = isPng ? 'image/png' : 'image/jpeg';
    const quality = 0.95;

    canvas.toBlob((cleanBlob) => {
      if (!cleanBlob) {
        alert('Failed to clean image.');
        btnStrip.textContent = origText;
        btnStrip.disabled = false;
        return;
      }

      const url = URL.createObjectURL(cleanBlob);
      const a = document.createElement('a');
      const baseName = (currentFile ? currentFile.name : 'image').replace(/\.[^/.]+$/, "");
      const ext = isPng ? 'png' : 'jpg';
      a.href = url;
      a.download = `${baseName}_clean.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      btnStrip.textContent = 'Successfully Cleaned & Downloaded!';
      btnStrip.classList.add('btn-success');
      setTimeout(() => {
        btnStrip.textContent = origText;
        btnStrip.classList.remove('btn-success');
        btnStrip.disabled = false;
      }, 2500);
    }, mime, quality);
  });

  // Sample Photo Loader for testing
  btnSample.addEventListener('click', () => {
    // Generate sample image with mock metadata display
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 640;
    sampleCanvas.height = 480;
    const sCtx = sampleCanvas.getContext('2d');

    const grad = sCtx.createLinearGradient(0, 0, 640, 480);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#334155');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 640, 480);

    sCtx.fillStyle = '#38bdf8';
    sCtx.font = 'bold 24px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('EcrioX Sample Geotagged Photo', 320, 230);
    sCtx.font = '16px sans-serif';
    sCtx.fillStyle = '#94a3b8';
    sCtx.fillText('Camera: Apple iPhone 15 Pro • GPS: New Delhi, India', 320, 270);

    const mockExif = {
      tags: {
        0x010F: "Apple",
        0x0110: "iPhone 15 Pro",
        0xA434: "iPhone 15 Pro back triple camera 24mm f/1.78",
        0x0131: "iOS 18.2",
        0x829A: 0.008, // 1/125s
        0x829D: 1.78,
        0x8827: 80,
        0x920A: 6.86,
        0x9003: "2026:03:15 14:32:09"
      },
      gpsTags: {
        0x0001: "N",
        0x0002: [28, 36, 50.4], // 28.6140° N
        0x0003: "E",
        0x0004: [77, 12, 32.4], // 77.2090° E
        0x0006: 216.5
      }
    };

    sampleCanvas.toBlob(blob => {
      const mockFile = new File([blob], "iphone_sample_travel.jpg", { type: "image/jpeg" });
      const img = new Image();
      img.onload = () => {
        currentImgObj = img;
        previewImg.src = img.src;
        previewWrapper.style.display = 'block';
        displayMetadata(mockFile, mockExif);
      };
      img.src = sampleCanvas.toDataURL();
    }, 'image/jpeg');
  });

})();
