/**
 * EcrioX - Wi-Fi Analyzer & Network Quality Lab
 * Browser network telemetry, signal dBm classification, spectrum overlap canvas, and RF troubleshooting.
 */
(function() {
  'use strict';

  // Tabs
  const tabBtns = document.querySelectorAll('.analyzer-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-tab'));
      if (target) target.classList.add('active');
      if (btn.getAttribute('data-tab') === 'tab-manual') {
        renderSpectrum();
      }
    });
  });

  // --- MODE A: LIVE BROWSER TELEMETRY ---
  const teleType = document.getElementById('tele-effective-type');
  const teleDownlink = document.getElementById('tele-downlink');
  const teleRtt = document.getElementById('tele-rtt');
  const teleSaveData = document.getElementById('tele-save-data');

  function updateBrowserTelemetry() {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      teleType.textContent = (conn.effectiveType || '4G').toUpperCase();
      teleDownlink.textContent = conn.downlink ? conn.downlink.toFixed(1) : '10.0';
      teleRtt.textContent = conn.rtt ? Math.round(conn.rtt) : '50';
      teleSaveData.textContent = conn.saveData ? 'Enabled' : 'Off';

      conn.addEventListener('change', updateBrowserTelemetry);
    } else {
      teleType.textContent = 'Active';
      teleDownlink.textContent = '--';
      teleRtt.textContent = '--';
      teleSaveData.textContent = 'Unsupported';
    }
  }
  updateBrowserTelemetry();

  // --- MODE B: MANUAL WI-FI ANALYSIS ENGINE ---
  const inputDbm = document.getElementById('input-dbm');
  const labelDbm = document.getElementById('label-dbm-val');
  const selectBand = document.getElementById('select-band');
  const selectChannel = document.getElementById('select-channel');
  const selectEnvironment = document.getElementById('select-environment');

  const meterBars = document.getElementById('meter-bars');
  const verdictBadge = document.getElementById('verdict-badge');
  const verdictDesc = document.getElementById('verdict-desc');
  const recommendationsList = document.getElementById('recommendations-list');

  const spectrumCanvas = document.getElementById('spectrum-canvas');
  const sCtx = spectrumCanvas.getContext('2d');
  const spectrumTitle = document.getElementById('spectrum-title');
  const specChannelBadge = document.getElementById('spec-channel-badge');
  const spectrumNote = document.getElementById('spectrum-note');

  // Channels per band
  const CHANNELS_BY_BAND = {
    '2.4': [
      { ch: 1, label: 'Channel 1 (2412 MHz - Recommended)' },
      { ch: 2, label: 'Channel 2 (2417 MHz - Overlapping)' },
      { ch: 3, label: 'Channel 3 (2422 MHz - Overlapping)' },
      { ch: 4, label: 'Channel 4 (2427 MHz - Overlapping)' },
      { ch: 5, label: 'Channel 5 (2432 MHz - Overlapping)' },
      { ch: 6, label: 'Channel 6 (2437 MHz - Recommended)' },
      { ch: 7, label: 'Channel 7 (2442 MHz - Overlapping)' },
      { ch: 8, label: 'Channel 8 (2447 MHz - Overlapping)' },
      { ch: 9, label: 'Channel 9 (2452 MHz - Overlapping)' },
      { ch: 10, label: 'Channel 10 (2457 MHz - Overlapping)' },
      { ch: 11, label: 'Channel 11 (2462 MHz - Recommended)' }
    ],
    '5': [
      { ch: 36, label: 'Channel 36 (5180 MHz - UNII-1 Indoor)' },
      { ch: 40, label: 'Channel 40 (5200 MHz - UNII-1 Indoor)' },
      { ch: 44, label: 'Channel 44 (5220 MHz - UNII-1 Indoor)' },
      { ch: 48, label: 'Channel 48 (5240 MHz - UNII-1 Indoor)' },
      { ch: 149, label: 'Channel 149 (5745 MHz - UNII-3 High Power)' },
      { ch: 153, label: 'Channel 153 (5765 MHz - UNII-3 High Power)' },
      { ch: 157, label: 'Channel 157 (5785 MHz - UNII-3 High Power)' },
      { ch: 161, label: 'Channel 161 (5805 MHz - UNII-3 High Power)' }
    ],
    '6': [
      { ch: 1, label: 'Channel 1 (5955 MHz - PSC)' },
      { ch: 33, label: 'Channel 33 (6115 MHz - PSC)' },
      { ch: 65, label: 'Channel 65 (6275 MHz - PSC)' },
      { ch: 97, label: 'Channel 97 (6435 MHz - PSC)' },
      { ch: 129, label: 'Channel 129 (6595 MHz - PSC)' },
      { ch: 161, label: 'Channel 161 (6755 MHz - PSC)' }
    ]
  };

  function populateChannels() {
    const band = selectBand.value;
    const channels = CHANNELS_BY_BAND[band] || [];
    selectChannel.innerHTML = '';
    channels.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.ch;
      opt.textContent = c.label;
      selectChannel.appendChild(opt);
    });
    evaluateSignal();
  }

  function evaluateSignal() {
    const dbm = parseInt(inputDbm.value, 10);
    labelDbm.textContent = `${dbm} dBm`;

    const band = selectBand.value;
    const ch = parseInt(selectChannel.value, 10);
    const env = selectEnvironment.value;

    specChannelBadge.textContent = `CH ${ch} (${band} GHz)`;

    // Classification table:
    // -30 to -50: Excellent
    // -51 to -60: Very good
    // -61 to -67: Good
    // -68 to -75: Fair
    // Below -75: Weak
    let classification = '';
    let badgeClass = '';
    let desc = '';
    let activeBars = 1;

    if (dbm >= -50) {
      classification = 'Excellent';
      badgeClass = 'class-excellent';
      activeBars = 5;
      desc = 'Peak wireless signal strength. Delivers maximum theoretical link negotiation speeds, zero frame retransmissions, and optimal performance for 4K/8K video streaming and low-latency gaming.';
    } else if (dbm >= -60) {
      classification = 'Very Good';
      badgeClass = 'class-very-good';
      activeBars = 4;
      desc = 'Strong and dependable wireless connectivity. Ideal for uninterrupted HD video conferences (Zoom, Teams), simultaneous multi-device streaming, and large cloud file backups.';
    } else if (dbm >= -67) {
      classification = 'Good';
      badgeClass = 'class-good';
      activeBars = 3;
      desc = 'Meets the industry minimum standard for reliable VoIP calls and web browsing. Occasional throughput fluctuation may occur during heavy concurrent household usage.';
    } else if (dbm >= -75) {
      classification = 'Fair';
      badgeClass = 'class-fair';
      activeBars = 2;
      desc = 'Marginal signal boundary. Data rates drop considerably due to packet retransmissions. Audio calls may exhibit minor jitter and web pages take longer to load.';
    } else {
      classification = 'Weak';
      badgeClass = 'class-weak';
      activeBars = 1;
      desc = 'Critical Wi-Fi dead spot. Excessive packet loss, high latency spikes, and frequent disconnects will occur. Consider relocating closer to the access point or deploying a mesh satellite.';
    }

    // Update Meter Bars
    const bars = meterBars.querySelectorAll('.signal-bar');
    bars.forEach((bar, idx) => {
      if (idx < activeBars) {
        bar.classList.add('active');
        if (activeBars === 5) bar.style.background = '#10b981';
        else if (activeBars === 4) bar.style.background = '#06b6d4';
        else if (activeBars === 3) bar.style.background = '#2563eb';
        else if (activeBars === 2) bar.style.background = '#f59e0b';
        else bar.style.background = '#ef4444';
      } else {
        bar.classList.remove('active');
        bar.style.background = '';
      }
    });

    // Update Verdict Badge & Text
    verdictBadge.className = `signal-classification-badge ${badgeClass}`;
    verdictBadge.textContent = `${classification} (${dbm} dBm)`;
    verdictDesc.textContent = desc;

    // Generate Targeted Recommendations
    generateRecommendations(dbm, band, ch, env);

    // Redraw Spectrum
    renderSpectrum();
  }

  function generateRecommendations(dbm, band, ch, env) {
    const recs = [];

    if (band === '2.4') {
      if (ch !== 1 && ch !== 6 && ch !== 11) {
        recs.push(`<strong>Switch to Channel 1, 6, or 11 immediately:</strong> You have selected Channel ${ch}, which overlaps simultaneously with adjacent channels. Switching to standard non-overlapping channels (1, 6, or 11) prevents destructive co-channel packet collisions.`);
      } else {
        recs.push(`<strong>Standard Channel Choice:</strong> Channel ${ch} is non-overlapping in 2.4 GHz. If congestion persists from neighbor routers, test switching between 1, 6, and 11.`);
      }
      if (dbm >= -65) {
        recs.push(`<strong>Move high-speed devices to 5 GHz:</strong> Since your signal is strong enough, connect laptops, smart TVs, and consoles to your router's 5 GHz band to unlock 3x higher throughput.`);
      }
    } else if (band === '5') {
      recs.push(`<strong>Clean 5 GHz Spectrum:</strong> Channel ${ch} provides wider channel bonding without Bluetooth or microwave oven interference.`);
      if (env === 'brick' || env === 'multistory') {
        recs.push(`<strong>High-frequency wall attenuation:</strong> 5 GHz signals lose 8–12 dBm through dense brick or concrete walls. If signal falls below -70 dBm in other rooms, consider adding a Wi-Fi 6 mesh node connected via Ethernet backhaul.`);
      }
    } else if (band === '6') {
      recs.push(`<strong>Ultra-Wide 6 GHz Band:</strong> Zero legacy Wi-Fi 4/5 interference. Keep devices within line-of-sight of the router for maximum multi-gigabit throughput.`);
    }

    if (dbm < -70) {
      recs.push(`<strong>Router repositioning recommended:</strong> Elevate your Wi-Fi router to 1.5–2 meters above floor level. Avoid placing it in closed cabinets, behind metal appliances, or adjacent to heavy reflective mirrors.`);
    }

    recs.push(`<strong>Avoid cheap single-band Wi-Fi range extenders:</strong> Half-duplex repeaters cut available bandwidth in half. If expanding coverage across multiple floors, choose a tri-band mesh system with dedicated wireless or wired backhaul.`);

    recommendationsList.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
  }

  // --- INTERACTIVE SPECTRUM OVERLAP CANVAS ---
  function renderSpectrum() {
    const band = selectBand.value;
    const selectedCh = parseInt(selectChannel.value, 10);

    const w = spectrumCanvas.width;
    const h = spectrumCanvas.height;
    sCtx.clearRect(0, 0, w, h);

    // Background grid lines
    sCtx.strokeStyle = 'rgba(150, 150, 150, 0.15)';
    sCtx.lineWidth = 1;
    for (let y = 30; y < h - 30; y += 30) {
      sCtx.beginPath();
      sCtx.moveTo(40, y);
      sCtx.lineTo(w - 20, y);
      sCtx.stroke();
    }

    // Baseline
    const baseY = h - 35;
    sCtx.strokeStyle = 'rgba(150, 150, 150, 0.4)';
    sCtx.beginPath();
    sCtx.moveTo(30, baseY);
    sCtx.lineTo(w - 15, baseY);
    sCtx.stroke();

    if (band === '2.4') {
      spectrumTitle.textContent = '2.4 GHz Spectrum: Why Only Channels 1, 6, and 11 Do Not Overlap';
      spectrumNote.innerHTML = 'Each 2.4 GHz channel spans 20 MHz, but channels are spaced only 5 MHz apart. Intermediate channels overlap heavily. Active selection: <strong>CH ' + selectedCh + '</strong>.';

      // Draw channels 1 to 11
      const startX = 60;
      const stepX = (w - 120) / 10;
      const bellWidth = stepX * 4; // 20 MHz spans 4 steps (4 * 5MHz)

      for (let i = 1; i <= 11; i++) {
        const cx = startX + (i - 1) * stepX;
        const isSelected = (i === selectedCh);
        const isRec = (i === 1 || i === 6 || i === 11);

        // Draw parabolic bell curve
        sCtx.beginPath();
        sCtx.moveTo(cx - bellWidth / 2, baseY);
        sCtx.bezierCurveTo(
          cx - bellWidth / 4, baseY - (isSelected ? 110 : 80),
          cx + bellWidth / 4, baseY - (isSelected ? 110 : 80),
          cx + bellWidth / 2, baseY
        );

        if (isSelected) {
          sCtx.fillStyle = 'rgba(37, 99, 235, 0.35)';
          sCtx.fill();
          sCtx.strokeStyle = '#2563eb';
          sCtx.lineWidth = 3;
        } else if (isRec) {
          sCtx.fillStyle = 'rgba(16, 185, 129, 0.1)';
          sCtx.fill();
          sCtx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
          sCtx.lineWidth = 1.5;
        } else {
          sCtx.fillStyle = 'rgba(239, 68, 68, 0.05)';
          sCtx.fill();
          sCtx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          sCtx.lineWidth = 1;
        }
        sCtx.stroke();

        // Channel number text
        sCtx.fillStyle = isSelected ? '#2563eb' : (isRec ? '#059669' : '#94a3b8');
        sCtx.font = isSelected ? 'bold 12px sans-serif' : '10px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.fillText(`CH ${i}`, cx, baseY + 18);
      }
    } else {
      // 5 GHz or 6 GHz Spectrum
      spectrumTitle.textContent = `${band} GHz Clean Channel Separation & Channel Bonding`;
      spectrumNote.innerHTML = `On ${band} GHz, channels operate with wider 20/40/80 MHz spacing with zero co-channel overlap between distinct blocks. Active selection: <strong>CH ${selectedCh}</strong>.`;

      const channels = CHANNELS_BY_BAND[band] || [];
      const totalCount = channels.length;
      const startX = 60;
      const stepX = (w - 120) / (totalCount - 1 || 1);
      const bellWidth = stepX * 0.85;

      channels.forEach((c, idx) => {
        const cx = startX + idx * stepX;
        const isSelected = (c.ch === selectedCh);

        sCtx.beginPath();
        sCtx.moveTo(cx - bellWidth / 2, baseY);
        sCtx.bezierCurveTo(
          cx - bellWidth / 4, baseY - (isSelected ? 115 : 85),
          cx + bellWidth / 4, baseY - (isSelected ? 115 : 85),
          cx + bellWidth / 2, baseY
        );

        if (isSelected) {
          sCtx.fillStyle = 'rgba(37, 99, 235, 0.35)';
          sCtx.fill();
          sCtx.strokeStyle = '#2563eb';
          sCtx.lineWidth = 3;
        } else {
          sCtx.fillStyle = 'rgba(6, 182, 212, 0.1)';
          sCtx.fill();
          sCtx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          sCtx.lineWidth = 1.5;
        }
        sCtx.stroke();

        sCtx.fillStyle = isSelected ? '#2563eb' : '#64748b';
        sCtx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.fillText(`CH ${c.ch}`, cx, baseY + 18);
      });
    }
  }

  // Listeners
  selectBand.addEventListener('change', populateChannels);
  selectChannel.addEventListener('change', evaluateSignal);
  inputDbm.addEventListener('input', evaluateSignal);
  selectEnvironment.addEventListener('change', evaluateSignal);

  window.addEventListener('resize', renderSpectrum);

  // Init
  populateChannels();
})();
