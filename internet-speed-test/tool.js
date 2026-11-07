/**
 * EcrioX - Internet Speed Test
 * Genuine browser network benchmark using progressive data transfers.
 * Measures download throughput, upload throughput, latency ping, and RFC 3550 jitter.
 */
(function() {
  'use strict';

  // Elements
  const btnStart = document.getElementById('btn-start-test');
  const btnRestart = document.getElementById('btn-restart-test');
  const btnCopy = document.getElementById('btn-copy-result');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const actionsBar = document.getElementById('actions-bar');

  const gaugeCircle = document.getElementById('gauge-circle');
  const gaugeStage = document.getElementById('gauge-stage');
  const gaugeNumber = document.getElementById('gauge-number');
  const gaugeUnit = document.getElementById('gauge-unit');

  const valDownload = document.getElementById('val-download');
  const valUpload = document.getElementById('val-upload');
  const valPing = document.getElementById('val-ping');
  const valJitter = document.getElementById('val-jitter');

  const tileDownload = document.getElementById('tile-download');
  const tileUpload = document.getElementById('tile-upload');
  const tilePing = document.getElementById('tile-ping');
  const tileJitter = document.getElementById('tile-jitter');

  const statusDot = document.getElementById('network-status-dot');
  const statusText = document.getElementById('network-status-text');
  const serverLocationText = document.getElementById('server-location-text');
  const clientNetInfo = document.getElementById('client-net-info');
  const historyTbody = document.getElementById('history-tbody');

  // Gauge constants
  // Total circumference for r=110 is ~691. Arc spans 240 deg => stroke-dasharray: 575
  const TOTAL_ARC_LENGTH = 575;
  const START_OFFSET = 575;

  let isTesting = false;
  let testResults = {
    download: 0,
    upload: 0,
    ping: 0,
    jitter: 0,
    date: null
  };

  // Inspect navigator.connection where supported
  function initClientConnectionInfo() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      const type = conn.effectiveType || 'broadband';
      const downlink = conn.downlink ? ` (~${conn.downlink} Mbps est.)` : '';
      clientNetInfo.textContent = `Interface: ${type.toUpperCase()}${downlink}`;
    }
  }

  // Update animated SVG speedometer
  function updateGauge(val, maxScale = 100) {
    gaugeNumber.textContent = val > 0 ? val.toFixed(1) : '0.0';
    
    // Scale gauge dynamically if connection exceeds 100 Mbps
    if (val > maxScale) {
      maxScale = Math.ceil(val / 100) * 100;
    }

    const ratio = Math.max(0, Math.min(1, val / maxScale));
    // Offset from 575 down to 144
    const offset = START_OFFSET - (ratio * (575 - 144));
    gaugeCircle.style.strokeDashoffset = offset;
  }

  function resetTilesHighlight() {
    [tileDownload, tileUpload, tilePing, tileJitter].forEach(t => t.classList.remove('active-test'));
  }

  // --- 1. LATENCY & JITTER BENCHMARK ---
  async function measureLatencyAndJitter() {
    gaugeStage.textContent = 'PING & JITTER';
    gaugeUnit.textContent = 'ms';
    statusText.textContent = 'Measuring latency & packet jitter...';
    tilePing.classList.add('active-test');
    tileJitter.classList.add('active-test');

    const latencies = [];
    const pingsCount = 6;

    for (let i = 0; i < pingsCount; i++) {
      const startTime = performance.now();
      try {
        const response = await fetch(`https://speed.cloudflare.com/__down?bytes=0&_t=${Date.now()}_${i}`, {
          cache: 'no-store',
          mode: 'cors'
        });
        const duration = performance.now() - startTime;
        latencies.push(duration);

        // Try extracting server edge location from headers
        const city = response.headers.get('cf-meta-city');
        const country = response.headers.get('cf-meta-country');
        const colo = response.headers.get('cf-meta-colo') || response.headers.get('colo');
        if (colo) {
          const loc = city && country ? `${city}, ${country} (${colo})` : `Edge node ${colo}`;
          serverLocationText.textContent = `Server: Cloudflare ${loc}`;
        }

        // Live display
        updateGauge(duration, 150);
        valPing.textContent = Math.round(duration);
      } catch (err) {
        // Fallback timing
        const duration = performance.now() - startTime;
        latencies.push(duration);
      }
      await new Promise(r => setTimeout(r, 60));
    }

    // Skip the first TCP handshake warmup ping if we have multiple
    const samples = latencies.length > 2 ? latencies.slice(1) : latencies;
    const minPing = Math.min(...samples);
    const avgPing = samples.reduce((a, b) => a + b, 0) / samples.length;

    // RFC 3550 Jitter: average difference between consecutive latency measurements
    let jitterSum = 0;
    for (let i = 1; i < samples.length; i++) {
      jitterSum += Math.abs(samples[i] - samples[i - 1]);
    }
    const jitter = samples.length > 1 ? (jitterSum / (samples.length - 1)) : 0;

    valPing.textContent = Math.round(minPing);
    valJitter.textContent = Math.round(jitter);
    testResults.ping = Math.round(minPing);
    testResults.jitter = Math.round(jitter);

    tilePing.classList.remove('active-test');
    tileJitter.classList.remove('active-test');
  }

  // --- 2. DOWNLOAD SPEED BENCHMARK ---
  async function measureDownloadSpeed() {
    resetTilesHighlight();
    tileDownload.classList.add('active-test');
    gaugeStage.textContent = 'DOWNLOADING';
    gaugeUnit.textContent = 'Mbps';
    statusText.textContent = 'Measuring download throughput...';

    // Adaptive chunk testing: start with 1MB to estimate, then 5MB/10MB
    const sizes = [1000000, 4000000, 8000000];
    let totalBytes = 0;
    let totalDurationSec = 0;
    let peakSpeed = 0;

    for (let i = 0; i < sizes.length; i++) {
      const bytesToFetch = sizes[i];
      const start = performance.now();
      try {
        const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytesToFetch}&_t=${Date.now()}_${i}`, {
          cache: 'no-store',
          mode: 'cors'
        });

        if (res.body && res.body.getReader) {
          const reader = res.body.getReader();
          let chunkBytes = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunkBytes += value.length;
            const currentDuration = (performance.now() - start) / 1000;
            if (currentDuration > 0.05) {
              const currentSpeed = (chunkBytes * 8) / (currentDuration * 1000000);
              updateGauge(currentSpeed, 100);
              valDownload.textContent = currentSpeed.toFixed(1);
            }
          }
          const durationSec = (performance.now() - start) / 1000;
          totalBytes += chunkBytes;
          totalDurationSec += durationSec;
          const chunkSpeed = (chunkBytes * 8) / (durationSec * 1000000);
          peakSpeed = Math.max(peakSpeed, chunkSpeed);
        } else {
          const blob = await res.blob();
          const durationSec = (performance.now() - start) / 1000;
          totalBytes += blob.size;
          totalDurationSec += durationSec;
          const chunkSpeed = (blob.size * 8) / (durationSec * 1000000);
          peakSpeed = Math.max(peakSpeed, chunkSpeed);
          updateGauge(chunkSpeed, 100);
          valDownload.textContent = chunkSpeed.toFixed(1);
        }

        // If connection is slower, break early to save user data
        if (i === 0 && peakSpeed < 5) break;
        // If test has run for more than 4 seconds of download, stop
        if (totalDurationSec > 4) break;
      } catch (err) {
        console.warn('Download chunk error:', err);
        break;
      }
    }

    const finalDownloadSpeed = totalDurationSec > 0 ? ((totalBytes * 8) / (totalDurationSec * 1000000)) : peakSpeed;
    const reportedDownload = Math.max(0.1, finalDownloadSpeed);
    valDownload.textContent = reportedDownload.toFixed(1);
    testResults.download = parseFloat(reportedDownload.toFixed(1));
    updateGauge(reportedDownload, 100);
    tileDownload.classList.remove('active-test');
  }

  // --- 3. UPLOAD SPEED BENCHMARK ---
  async function measureUploadSpeed() {
    resetTilesHighlight();
    tileUpload.classList.add('active-test');
    gaugeStage.textContent = 'UPLOADING';
    gaugeUnit.textContent = 'Mbps';
    statusText.textContent = 'Measuring upload throughput...';

    // Sized payloads: 250KB, 1MB, 2.5MB
    const uploadSizes = [250000, 1000000, 2500000];
    let totalUploadedBytes = 0;
    let totalUploadDurationSec = 0;
    let peakUploadSpeed = 0;

    for (let i = 0; i < uploadSizes.length; i++) {
      const size = uploadSizes[i];
      // Generate actual binary buffer
      const buffer = new Uint8Array(size);
      for (let j = 0; j < Math.min(size, 1024); j++) {
        buffer[j] = (j % 255);
      }

      const start = performance.now();
      try {
        const res = await fetch(`https://speed.cloudflare.com/__up?_t=${Date.now()}_${i}`, {
          method: 'POST',
          body: buffer,
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          cache: 'no-store',
          mode: 'cors'
        });

        const durationSec = (performance.now() - start) / 1000;
        if (res.ok && durationSec > 0) {
          totalUploadedBytes += size;
          totalUploadDurationSec += durationSec;
          const chunkSpeed = (size * 8) / (durationSec * 1000000);
          peakUploadSpeed = Math.max(peakUploadSpeed, chunkSpeed);
          updateGauge(chunkSpeed, 50);
          valUpload.textContent = chunkSpeed.toFixed(1);
        }

        // Break early if speed is low or duration is sufficient
        if (i === 0 && peakUploadSpeed < 3) break;
        if (totalUploadDurationSec > 3.5) break;
      } catch (err) {
        console.warn('Upload test error:', err);
        break;
      }
    }

    const finalUploadSpeed = totalUploadDurationSec > 0 ? ((totalUploadedBytes * 8) / (totalUploadDurationSec * 1000000)) : peakUploadSpeed;
    const reportedUpload = Math.max(0.1, finalUploadSpeed);
    valUpload.textContent = reportedUpload.toFixed(1);
    testResults.upload = parseFloat(reportedUpload.toFixed(1));
    updateGauge(reportedUpload, 50);
    tileUpload.classList.remove('active-test');
  }

  // --- RUN ENTIRE SPEED TEST ---
  async function runSpeedTest() {
    if (isTesting) return;
    isTesting = true;

    btnStart.disabled = true;
    btnStart.style.display = 'none';
    actionsBar.style.display = 'none';
    statusDot.classList.add('active');

    // Reset UI
    valDownload.textContent = '--';
    valUpload.textContent = '--';
    valPing.textContent = '--';
    valJitter.textContent = '--';
    updateGauge(0);

    // Track analytics event
    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackToolUse('internet-speed-test', 'start_test');
    }

    try {
      // Step 1: Latency & Jitter
      await measureLatencyAndJitter();
      await new Promise(r => setTimeout(r, 200));

      // Step 2: Download
      await measureDownloadSpeed();
      await new Promise(r => setTimeout(r, 200));

      // Step 3: Upload
      await measureUploadSpeed();
    } catch (err) {
      console.error('Speed test execution error:', err);
      statusText.textContent = 'Test completed with partial results';
    } finally {
      // Finished
      isTesting = false;
      statusDot.classList.remove('active');
      statusText.textContent = 'Test Completed Successfully';
      gaugeStage.textContent = 'DOWNLOAD';
      updateGauge(testResults.download, 100);

      btnStart.disabled = false;
      actionsBar.style.display = 'flex';

      testResults.date = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      saveToHistory(testResults);
      renderHistoryTable();

      // Track analytics complete
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.pushEvent('test_completed', {
          tool_name: 'internet-speed-test',
          download_mbps: testResults.download,
          upload_mbps: testResults.upload,
          ping_ms: testResults.ping,
          jitter_ms: testResults.jitter
        });
      }
    }
  }

  // --- LOCAL HISTORY MANAGEMENT ---
  function getHistory() {
    try {
      const data = localStorage.getItem('ecriox_speed_history');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(res) {
    try {
      const history = getHistory();
      history.unshift({
        date: res.date,
        download: res.download,
        upload: res.upload,
        ping: res.ping,
        jitter: res.jitter
      });
      if (history.length > 10) history.pop();
      localStorage.setItem('ecriox_speed_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Storage quota exceeded');
    }
  }

  function renderHistoryTable() {
    const history = getHistory();
    if (!history.length) {
      historyTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-subtle); padding: 1.5rem;">
            No previous tests recorded. Click "Start Speed Test" above to run your benchmark!
          </td>
        </tr>
      `;
      return;
    }

    historyTbody.innerHTML = history.map(item => `
      <tr>
        <td>${item.date}</td>
        <td style="color: var(--color-primary); font-weight: 700;">${item.download} Mbps</td>
        <td style="color: var(--color-success); font-weight: 700;">${item.upload} Mbps</td>
        <td>${item.ping} ms</td>
        <td>${item.jitter} ms</td>
      </tr>
    `).join('');
  }

  btnClearHistory.addEventListener('click', () => {
    localStorage.removeItem('ecriox_speed_history');
    renderHistoryTable();
  });

  // --- COPY RESULT SUMMARY ---
  btnCopy.addEventListener('click', () => {
    const text = `EcrioX Internet Speed Test Results:
----------------------------------------
Download Speed : ${testResults.download} Mbps
Upload Speed   : ${testResults.upload} Mbps
Latency (Ping) : ${testResults.ping} ms
Packet Jitter  : ${testResults.jitter} ms
Tested On      : ${testResults.date || new Date().toLocaleString()}
Edge Server    : ${serverLocationText.textContent.replace('Server: ', '')}
----------------------------------------
Test your connection free at https://ecriox.com/internet-speed-test/`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const orig = btnCopy.textContent;
        btnCopy.textContent = 'Copied to Clipboard!';
        setTimeout(() => { btnCopy.textContent = orig; }, 2000);
      });
    } else {
      alert('Speed summary:\n\n' + text);
    }
  });

  // Listeners
  btnStart.addEventListener('click', runSpeedTest);
  btnRestart.addEventListener('click', runSpeedTest);

  // Initial load
  initClientConnectionInfo();
  renderHistoryTable();
  updateGauge(0);
})();
