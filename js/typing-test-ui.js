/**
 * EcrioX Typing Arena - Core Test UI Controller
 * Handles DOM rendering of words/characters, blinking caret positioning,
 * input listeners, timer updates, results display, and instant restart.
 */

(function () {
  'use strict';

  let engine = null;
  let passageBox = null;
  let hiddenInput = null;
  let timerDisplay = null;
  let wpmDisplay = null;
  let accDisplay = null;
  let errDisplay = null;
  let resultCard = null;
  let soundToggleBtn = null;
  let focusOverlay = null;

  let currentCategory = 'english';
  let currentSubcategory = null;
  let currentDuration = 60;
  let isSoundActive = false;

  function init(options = {}) {
    currentCategory = options.defaultCategory || 'english';
    currentSubcategory = options.defaultSubcategory || null;
    currentDuration = options.defaultDuration || 60;

    passageBox = document.getElementById('typingPassageBox');
    hiddenInput = document.getElementById('typingHiddenInput');
    timerDisplay = document.getElementById('hudTimer');
    wpmDisplay = document.getElementById('hudWpm');
    accDisplay = document.getElementById('hudAcc');
    errDisplay = document.getElementById('hudErr');
    resultCard = document.getElementById('typingResultCard');
    soundToggleBtn = document.getElementById('soundToggleBtn');
    focusOverlay = document.getElementById('focusOverlay');

    if (!passageBox || !window.ECRIOX_TYPING_ENGINE || !window.ECRIOX_PASSAGES) return;

    engine = new window.ECRIOX_TYPING_ENGINE({
      duration: currentDuration,
      mode: currentCategory,
      submode: currentSubcategory,
      soundEnabled: isSoundActive,
      onTick: handleTick,
      onCharacter: handleCharacter,
      onFinish: handleFinish
    });

    loadNewPassage();
    setupListeners();
  }

  function loadNewPassage(customText = null) {
    let passage = customText;
    if (!passage) {
      passage = window.ECRIOX_PASSAGES.getPassage(currentCategory, currentSubcategory);
    }
    engine.setText(passage);
    engine.setDuration(currentDuration);

    renderPassageDOM();
    resetHUD();

    if (resultCard) resultCard.classList.remove('show');
    if (passageBox) passageBox.scrollTop = 0;

    focusInput();
  }

  function renderPassageDOM() {
    if (!passageBox || !engine) return;

    const wordsHtml = engine.words.map((wObj, wIdx) => {
      const charsHtml = wObj.chars.map(c => `
        <span class="type-char pending" data-idx="${c.globalIndex}">${escapeHtml(c.char)}</span>
      `).join('');

      let spaceHtml = '';
      if (wObj.space) {
        spaceHtml = `<span class="type-char pending" data-idx="${wObj.space.globalIndex}">&nbsp;</span>`;
      }

      return `<span class="type-word" id="word-${wIdx}">${charsHtml}${spaceHtml}</span>`;
    }).join('');

    passageBox.innerHTML = wordsHtml;
    updateCaretAndActiveWord();
  }

  function updateCaretAndActiveWord() {
    if (!passageBox || !engine) return;

    // Remove old carets and active word styles
    passageBox.querySelectorAll('.type-word.active').forEach(w => w.classList.remove('active'));
    passageBox.querySelectorAll('.type-char.caret').forEach(c => c.classList.remove('caret'));

    const currentWord = engine.words[engine.currentWordIndex];
    if (!currentWord) return;

    const wordEl = document.getElementById(`word-${engine.currentWordIndex}`);
    if (wordEl) {
      wordEl.classList.add('active');

      // Auto-scroll passage container to keep active word visible
      const boxRect = passageBox.getBoundingClientRect();
      const wordRect = wordEl.getBoundingClientRect();
      if (wordRect.bottom > boxRect.bottom - 20 || wordRect.top < boxRect.top + 20) {
        wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Place caret on target pending char
    const pendingChar = currentWord.chars.find(c => c.status === 'pending');
    if (pendingChar) {
      const charEl = passageBox.querySelector(`[data-idx="${pendingChar.globalIndex}"]`);
      if (charEl) charEl.classList.add('caret');
    } else if (currentWord.space && currentWord.space.status === 'pending') {
      const spaceEl = passageBox.querySelector(`[data-idx="${currentWord.space.globalIndex}"]`);
      if (spaceEl) spaceEl.classList.add('caret');
    }
  }

  function handleTick(data) {
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(data.timeRemaining);
    }
    if (wpmDisplay) {
      wpmDisplay.textContent = data.netWpm;
    }
    if (accDisplay) {
      accDisplay.textContent = `${data.accuracy}%`;
    }
    if (errDisplay) {
      errDisplay.textContent = data.errorCount;
    }
  }

  function handleCharacter(data) {
    // Update character statuses in DOM
    const currentWord = engine.words[data.currentWordIndex];
    if (currentWord) {
      currentWord.chars.forEach(c => {
        const el = passageBox.querySelector(`[data-idx="${c.globalIndex}"]`);
        if (el) {
          el.className = `type-char ${c.status}`;
        }
      });
      if (currentWord.space) {
        const el = passageBox.querySelector(`[data-idx="${currentWord.space.globalIndex}"]`);
        if (el) {
          el.className = `type-char ${currentWord.space.status}`;
        }
      }
    }

    updateCaretAndActiveWord();

    if (wpmDisplay) wpmDisplay.textContent = data.netWpm;
    if (accDisplay) accDisplay.textContent = `${data.accuracy}%`;
    if (errDisplay) errDisplay.textContent = data.errorCount;
  }

  function handleFinish(result) {
    if (timerDisplay) timerDisplay.textContent = '00:00';

    if (resultCard) {
      const netWpmVal = document.getElementById('resultNetWpm');
      const grossWpmVal = document.getElementById('resultGrossWpm');
      const accVal = document.getElementById('resultAccuracy');
      const errVal = document.getElementById('resultErrors');
      const cpmVal = document.getElementById('resultCpm');
      const rankBadge = document.getElementById('resultRankBadge');

      if (netWpmVal) netWpmVal.textContent = result.netWpm;
      if (grossWpmVal) grossWpmVal.textContent = result.grossWpm;
      if (accVal) accVal.textContent = `${result.accuracy}%`;
      if (errVal) errVal.textContent = result.errorCount;
      if (cpmVal) cpmVal.textContent = result.cpm;

      if (rankBadge) {
        rankBadge.textContent = getSpeedTier(result.netWpm);
      }

      resultCard.classList.add('show');
      resultCard.scrollIntoView({ behavior: 'smooth' });
    }

    // Track analytics event safely without PII
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'typing_test_completed', {
        wpm: result.netWpm,
        accuracy: result.accuracy,
        duration: result.duration,
        mode: result.mode
      });
    }
  }

  function getSpeedTier(wpm) {
    if (wpm >= 100) return '🚀 Master Typist (Top 1% Worldwide)';
    if (wpm >= 80) return '⚡ Advanced Typist (Top 5% Worldwide)';
    if (wpm >= 60) return '⭐ High Professional (Top 20% Worldwide)';
    if (wpm >= 40) return '👍 Fluent Typist (Average Professional)';
    if (wpm >= 25) return '🌱 Intermediate Typist (Building Speed)';
    return '🐣 Beginner Typist (Keep Practicing!)';
  }

  function setupListeners() {
    // Focus passage box
    if (passageBox) {
      passageBox.addEventListener('click', focusInput);
    }
    if (focusOverlay) {
      focusOverlay.addEventListener('click', () => {
        focusOverlay.classList.remove('show');
        focusInput();
      });
    }

    // Input listeners
    if (hiddenInput) {
      hiddenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          // Tab + Enter restarts
          e.preventDefault();
          loadNewPassage();
          return;
        }

        if (e.key === 'Backspace') {
          e.preventDefault();
          engine.handleBackspace();
          return;
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          engine.handleKeyInput(e.key);
        }
      });

      hiddenInput.addEventListener('blur', () => {
        if (engine && engine.isActive && focusOverlay) {
          focusOverlay.classList.add('show');
        }
      });
    }

    // Duration buttons
    document.querySelectorAll('.duration-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dur = parseInt(btn.getAttribute('data-duration'), 10);
        currentDuration = dur;
        loadNewPassage();
      });
    });

    // Category buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-mode');
        currentSubcategory = btn.getAttribute('data-submode') || null;
        loadNewPassage();
      });
    });

    // Restart button
    const restartBtn = document.getElementById('restartTestBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => loadNewPassage());
    }

    // Sound toggle
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        isSoundActive = !isSoundActive;
        engine.soundEnabled = isSoundActive;
        soundToggleBtn.classList.toggle('active', isSoundActive);
        soundToggleBtn.innerHTML = isSoundActive ? '🔊 Sound On' : '🔇 Mute';
      });
    }
  }

  function focusInput() {
    if (hiddenInput) {
      hiddenInput.focus();
    }
  }

  function resetHUD() {
    if (timerDisplay) timerDisplay.textContent = formatTime(currentDuration);
    if (wpmDisplay) wpmDisplay.textContent = '0';
    if (accDisplay) accDisplay.textContent = '100%';
    if (errDisplay) errDisplay.textContent = '0';
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    if (str === ' ') return '&nbsp;';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.ECRIOX_TYPING_UI = {
    init,
    loadNewPassage
  };
})();
