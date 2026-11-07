/**
 * EcrioX Pomodoro Focus Timer
 * High-precision interval timer with circular SVG progress and Web Audio chime.
 */

(function () {
  'use strict';

  const CIRCUMFERENCE = 2 * Math.PI * 120; // ~753.98

  const MODE_DURATIONS = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  };

  const MODE_LABELS = {
    focus: 'Deep Focus',
    short: 'Short Rest',
    long: 'Long Recharge'
  };

  let currentMode = 'focus';
  let timeLeft = MODE_DURATIONS.focus;
  let timerId = null;
  let isRunning = false;
  let completedSessions = 0;

  const btnFocus = document.getElementById('btnFocus');
  const btnShort = document.getElementById('btnShort');
  const btnLong = document.getElementById('btnLong');
  const modeButtons = [btnFocus, btnShort, btnLong];

  const timerDisplay = document.getElementById('timerDisplay');
  const timerLabel = document.getElementById('timerLabel');
  const circleProgress = document.getElementById('circleProgress');
  const btnToggleTimer = document.getElementById('btnToggleTimer');
  const btnResetTimer = document.getElementById('btnResetTimer');
  const btnSkipTimer = document.getElementById('btnSkipTimer');
  const valCompletedSessions = document.getElementById('valCompletedSessions');

  // Web Audio Chime Generator
  function playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updateDisplay() {
    const formatted = formatTime(timeLeft);
    timerDisplay.textContent = formatted;
    timerLabel.textContent = MODE_LABELS[currentMode];

    // Document Title
    if (isRunning) {
      document.title = `(${formatted}) ${currentMode.toUpperCase()} – Pomodoro Timer | EcrioX`;
    } else {
      document.title = `Pomodoro Focus Timer Online – Free Productivity Timer | EcrioX`;
    }

    // Circular Progress
    const total = MODE_DURATIONS[currentMode];
    const fraction = (total - timeLeft) / total;
    const offset = CIRCUMFERENCE * (1 - fraction);
    circleProgress.style.strokeDashoffset = offset;
  }

  function tick() {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      // Completed Interval
      pause();
      playChime();

      if (currentMode === 'focus') {
        completedSessions++;
        valCompletedSessions.textContent = completedSessions;
        if (window.EcrioXApp) {
          EcrioXApp.showToast('🎉 Focus session complete! Time for a well-deserved break.');
        }
        // Auto-switch to break
        if (completedSessions % 4 === 0) {
          setMode('long');
        } else {
          setMode('short');
        }
      } else {
        if (window.EcrioXApp) {
          EcrioXApp.showToast('Break finished! Ready to focus?');
        }
        setMode('focus');
      }
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    btnToggleTimer.textContent = 'Pause';
    btnToggleTimer.className = 'btn btn-secondary btn-timer-main';
    timerId = setInterval(tick, 1000);
    updateDisplay();
  }

  function pause() {
    if (!isRunning) return;
    isRunning = false;
    btnToggleTimer.textContent = currentMode === 'focus' ? 'Resume Focus' : 'Resume Break';
    btnToggleTimer.className = 'btn btn-primary btn-timer-main';
    if (timerId) clearInterval(timerId);
    timerId = null;
    updateDisplay();
  }

  function reset() {
    pause();
    timeLeft = MODE_DURATIONS[currentMode];
    btnToggleTimer.textContent = currentMode === 'focus' ? 'Start Focus' : 'Start Break';
    btnToggleTimer.className = 'btn btn-primary btn-timer-main';
    updateDisplay();
  }

  function setMode(mode) {
    pause();
    currentMode = mode;
    timeLeft = MODE_DURATIONS[mode];

    modeButtons.forEach(btn => {
      if (btn.getAttribute('data-mode') === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    btnToggleTimer.textContent = mode === 'focus' ? 'Start Focus' : 'Start Break';
    btnToggleTimer.className = 'btn btn-primary btn-timer-main';
    updateDisplay();
  }

  // Event Listeners
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.getAttribute('data-mode'));
    });
  });

  btnToggleTimer.addEventListener('click', () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  });

  btnResetTimer.addEventListener('click', reset);

  btnSkipTimer.addEventListener('click', () => {
    pause();
    if (currentMode === 'focus') {
      setMode('short');
    } else {
      setMode('focus');
    }
  });

  // Init
  circleProgress.style.strokeDasharray = CIRCUMFERENCE;
  circleProgress.style.strokeDashoffset = 0;
  updateDisplay();
})();
