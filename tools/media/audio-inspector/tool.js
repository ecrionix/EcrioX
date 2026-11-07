/**
 * EcrioX Audio Inspector & Volume Booster
 * Client-side Web Audio API decoding, waveform rendering, and WAV export.
 */

(function () {
  'use strict';

  const audioDropzone = document.getElementById('audioDropzone');
  const audioFileInput = document.getElementById('audioFileInput');
  const audioWorkspace = document.getElementById('audioWorkspace');

  const lblAudioFileName = document.getElementById('lblAudioFileName');
  const canvasWaveform = document.getElementById('canvasWaveform');
  const metaDuration = document.getElementById('metaDuration');
  const metaSampleRate = document.getElementById('metaSampleRate');
  const metaChannels = document.getElementById('metaChannels');
  const metaFileSize = document.getElementById('metaFileSize');

  const rngGain = document.getElementById('rngGain');
  const lblGainVal = document.getElementById('lblGainVal');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnStop = document.getElementById('btnStop');
  const btnResetFile = document.getElementById('btnResetFile');
  const btnExportWav = document.getElementById('btnExportWav');

  let audioCtx = null;
  let decodedBuffer = null;
  let currentSource = null;
  let gainNode = null;
  let isPlaying = false;
  let startTime = 0;
  let pauseOffset = 0;
  let currentFile = null;

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function drawWaveform(buffer) {
    const canvas = canvasWaveform;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Get channel 0 data
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = '#2563eb';

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;

      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const barHeight = Math.max(1, (max - min) * amp);
      const y = (height - barHeight) / 2;

      ctx.fillRect(i, y, 1, barHeight);
    }
  }

  async function loadAudioFile(file) {
    currentFile = file;
    initAudioContext();

    lblAudioFileName.textContent = file.name;
    metaFileSize.textContent = formatFileSize(file.size);

    if (window.EcrioXApp) EcrioXApp.showToast('Decoding audio file in browser...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      metaDuration.textContent = formatTime(decodedBuffer.duration);
      metaSampleRate.textContent = `${decodedBuffer.sampleRate.toLocaleString()} Hz`;
      metaChannels.textContent = decodedBuffer.numberOfChannels === 1 ? '1 (Mono)' : `${decodedBuffer.numberOfChannels} (Stereo)`;

      drawWaveform(decodedBuffer);

      audioDropzone.style.display = 'none';
      audioWorkspace.style.display = 'block';

      if (window.EcrioXApp) EcrioXApp.showToast('Audio loaded successfully!');
    } catch (err) {
      console.error('Audio decode error:', err);
      if (window.EcrioXApp) {
        EcrioXApp.showToast('Failed to decode audio file. Format may be unsupported.', 'error');
      }
    }
  }

  function play() {
    if (!decodedBuffer) return;
    initAudioContext();

    if (isPlaying) return;

    currentSource = audioCtx.createBufferSource();
    currentSource.buffer = decodedBuffer;

    gainNode = audioCtx.createGain();
    const gainPct = parseFloat(rngGain.value) || 100;
    gainNode.gain.setValueAtTime(gainPct / 100, audioCtx.currentTime);

    currentSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    currentSource.onended = () => {
      isPlaying = false;
      pauseOffset = 0;
      btnPlayPause.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.4rem;"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play`;
    };

    currentSource.start(0, pauseOffset);
    startTime = audioCtx.currentTime - pauseOffset;
    isPlaying = true;

    btnPlayPause.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.4rem;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
  }

  function pause() {
    if (!isPlaying || !currentSource) return;
    pauseOffset = audioCtx.currentTime - startTime;
    currentSource.stop();
    isPlaying = false;
    btnPlayPause.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.4rem;"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play`;
  }

  function stop() {
    if (isPlaying && currentSource) {
      currentSource.stop();
    }
    isPlaying = false;
    pauseOffset = 0;
    btnPlayPause.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.4rem;"><polygon points="5 3 19 12 5 21 5 3"/></svg> Play`;
  }

  // AudioBuffer to 16-bit PCM WAV File Writer
  function audioBufferToWav(buffer, gainMultiplier) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const samples = buffer.length;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataByteCount = samples * blockAlign;
    const bufferByteLength = 44 + dataByteCount;
    const arrayBuffer = new ArrayBuffer(bufferByteLength);
    const view = new DataView(arrayBuffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataByteCount, true);
    writeString(8, 'WAVE');

    // "fmt " sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // 16 for PCM
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataByteCount, true);

    // Write interleaved 16-bit PCM audio samples with gain applied
    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < samples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i] * gainMultiplier;
        // Clip clamping
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  // Event Listeners
  audioDropzone.addEventListener('click', () => audioFileInput.click());

  audioFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadAudioFile(e.target.files[0]);
    }
  });

  audioDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioDropzone.classList.add('dragover');
  });

  audioDropzone.addEventListener('dragleave', () => {
    audioDropzone.classList.remove('dragover');
  });

  audioDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    audioDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadAudioFile(e.dataTransfer.files[0]);
    }
  });

  rngGain.addEventListener('input', () => {
    const val = rngGain.value;
    lblGainVal.textContent = `${val}% ${val === '100' ? '(Normal)' : val > 100 ? `(${((val - 100) / 100 + 1).toFixed(1)}x Boost)` : '(Quiet)'}`;
    if (gainNode && isPlaying) {
      gainNode.gain.setValueAtTime(val / 100, audioCtx.currentTime);
    }
  });

  btnPlayPause.addEventListener('click', () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  });

  btnStop.addEventListener('click', stop);

  btnResetFile.addEventListener('click', () => {
    stop();
    audioWorkspace.style.display = 'none';
    audioDropzone.style.display = 'block';
    audioFileInput.value = '';
    decodedBuffer = null;
  });

  btnExportWav.addEventListener('click', () => {
    if (!decodedBuffer) return;
    const gainPct = parseFloat(rngGain.value) || 100;
    const gainMultiplier = gainPct / 100;

    if (window.EcrioXApp) EcrioXApp.showToast('Encoding WAV file...');

    const wavBlob = audioBufferToWav(decodedBuffer, gainMultiplier);
    const link = document.createElement('a');
    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'audio';
    link.download = `${baseName}-boosted-${gainPct}pct.wav`;
    link.href = URL.createObjectURL(wavBlob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${link.download}`);
  });
})();
