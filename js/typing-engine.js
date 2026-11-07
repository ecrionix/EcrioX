/**
 * EcrioX Typing Arena - Core Typing State Machine & Engine
 * High-performance, zero-latency typing benchmark, accurate Gross & Net WPM,
 * Unicode segmentation, error tracking, and local history logging.
 */

(function () {
  'use strict';

  const STORAGE_KEY_HISTORY = 'ecriox_typing_history';
  const STORAGE_KEY_WEAK_KEYS = 'ecriox_typing_weak_keys';

  class TypingEngine {
    constructor(options = {}) {
      this.duration = options.duration || 60; // in seconds
      this.mode = options.mode || 'english';
      this.submode = options.submode || null;
      this.soundEnabled = options.soundEnabled !== undefined ? options.soundEnabled : false;

      this.text = '';
      this.words = [];
      this.charIndex = 0;
      this.currentWordIndex = 0;

      this.isActive = false;
      this.isFinished = false;
      this.startTime = null;
      this.elapsedSeconds = 0;
      this.timerInterval = null;

      this.totalTyped = 0;
      this.correctTyped = 0;
      this.errorCount = 0;
      this.sessionMistakes = {}; // key -> count

      this.onTick = options.onTick || null;
      this.onCharacter = options.onCharacter || null;
      this.onFinish = options.onFinish || null;

      this.audioCtx = null;
    }

    setText(passageText) {
      this.text = passageText.replace(/\r\n/g, '\n').trim();
      this.reset();
    }

    setDuration(seconds) {
      this.duration = seconds;
      this.reset();
    }

    reset() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      this.charIndex = 0;
      this.currentWordIndex = 0;
      this.isActive = false;
      this.isFinished = false;
      this.startTime = null;
      this.elapsedSeconds = 0;
      this.totalTyped = 0;
      this.correctTyped = 0;
      this.errorCount = 0;
      this.sessionMistakes = {};

      // Parse text into structured words & characters
      this.words = this.parseTextIntoWords(this.text);
    }

    parseTextIntoWords(rawText) {
      // Split into words by whitespace, retaining clean tokens
      const tokens = rawText.split(/\s+/).filter(Boolean);
      const words = [];
      let globalIndex = 0;

      // Use Intl.Segmenter for grapheme cluster splitting if available
      const hasSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
      const segmenter = hasSegmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

      tokens.forEach((token, wIdx) => {
        const isLastWord = wIdx === tokens.length - 1;
        const chars = [];

        const segments = segmenter
          ? Array.from(segmenter.segment(token), s => s.segment)
          : Array.from(token);

        for (let i = 0; i < segments.length; i++) {
          chars.push({
            char: segments[i],
            status: 'pending', // 'pending', 'correct', 'incorrect'
            globalIndex: globalIndex++
          });
        }

        // Add trailing space character for all words except the last
        let spaceChar = null;
        if (!isLastWord) {
          spaceChar = {
            char: ' ',
            status: 'pending',
            globalIndex: globalIndex++
          };
        }

        words.push({
          word: token,
          chars: chars,
          space: spaceChar,
          isCompleted: false,
          hasError: false
        });
      });

      return words;
    }

    start() {
      if (this.isActive || this.isFinished) return;
      this.isActive = true;
      this.startTime = Date.now();

      this.timerInterval = setInterval(() => {
        this.elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const timeRemaining = Math.max(0, this.duration - Math.floor(this.elapsedSeconds));

        const metrics = this.getMetrics();

        if (this.onTick) {
          this.onTick({
            timeRemaining,
            elapsedSeconds: this.elapsedSeconds,
            ...metrics
          });
        }

        if (this.duration && this.elapsedSeconds >= this.duration) {
          this.finish();
        }
      }, 250);
    }

    handleKeyInput(typedKey) {
      if (this.isFinished) return;

      // Start on first keypress
      if (!this.isActive) {
        this.start();
      }

      const currentWord = this.words[this.currentWordIndex];
      if (!currentWord) {
        this.finish();
        return;
      }

      this.playKeySound();

      // Find current character target
      const wordChars = currentWord.chars;
      const targetCharObj = wordChars.find(c => c.status === 'pending');

      if (targetCharObj) {
        // Typing letters of the current word
        this.totalTyped++;
        if (typedKey === targetCharObj.char) {
          targetCharObj.status = 'correct';
          this.correctTyped++;
        } else {
          targetCharObj.status = 'incorrect';
          this.errorCount++;
          currentWord.hasError = true;
          this.logMistake(targetCharObj.char);
        }
      } else if (currentWord.space && currentWord.space.status === 'pending') {
        // All letters of current word are typed, now expecting space
        this.totalTyped++;
        if (typedKey === ' ') {
          currentWord.space.status = 'correct';
          this.correctTyped++;
          currentWord.isCompleted = true;
          this.currentWordIndex++;
        } else {
          currentWord.space.status = 'incorrect';
          this.errorCount++;
          currentWord.hasError = true;
          this.logMistake('Space');
          // advance anyway so user does not get permanently stuck
          currentWord.isCompleted = true;
          this.currentWordIndex++;
        }
      } else {
        // Reached end of last word
        currentWord.isCompleted = true;
        this.finish();
        return;
      }

      // Check if all words completed
      if (this.currentWordIndex >= this.words.length) {
        this.finish();
      }

      if (this.onCharacter) {
        this.onCharacter({
          currentWordIndex: this.currentWordIndex,
          ...this.getMetrics()
        });
      }
    }

    handleBackspace() {
      if (!this.isActive || this.isFinished) return;
      const currentWord = this.words[this.currentWordIndex];
      if (!currentWord) return;

      // Find last typed character in this word
      const typedChars = currentWord.chars.filter(c => c.status !== 'pending');
      if (typedChars.length > 0) {
        const lastChar = typedChars[typedChars.length - 1];
        lastChar.status = 'pending';
      } else if (this.currentWordIndex > 0) {
        // Allow backspacing to previous word if not completed correctly
        const prevWord = this.words[this.currentWordIndex - 1];
        if (prevWord && prevWord.hasError) {
          this.currentWordIndex--;
          if (prevWord.space) prevWord.space.status = 'pending';
        }
      }

      if (this.onCharacter) {
        this.onCharacter({
          currentWordIndex: this.currentWordIndex,
          ...this.getMetrics()
        });
      }
    }

    logMistake(expectedChar) {
      const key = String(expectedChar).toLowerCase();
      this.sessionMistakes[key] = (this.sessionMistakes[key] || 0) + 1;
    }

    getMetrics() {
      const elapsedMinutes = Math.max(0.001, this.elapsedSeconds / 60);

      // Gross WPM: (Total Keystrokes / 5) / Elapsed Minutes
      const grossWpm = Math.round((this.totalTyped / 5) / elapsedMinutes);

      // Net WPM: (Correct Keystrokes / 5) / Elapsed Minutes
      const netWpm = Math.max(0, Math.round((this.correctTyped / 5) / elapsedMinutes));

      // Accuracy: Correct / Total * 100
      const accuracy = this.totalTyped > 0 ? Math.round((this.correctTyped / this.totalTyped) * 100) : 100;

      // Characters per minute (CPM)
      const cpm = Math.round(this.totalTyped / elapsedMinutes);

      return {
        grossWpm,
        netWpm,
        accuracy,
        cpm,
        totalTyped: this.totalTyped,
        correctTyped: this.correctTyped,
        errorCount: this.errorCount
      };
    }

    finish() {
      if (this.isFinished) return;
      this.isFinished = true;
      this.isActive = false;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      const finalMetrics = this.getMetrics();
      const result = {
        id: 'ecriox_' + Date.now().toString(36),
        date: new Date().toISOString(),
        duration: this.duration,
        elapsedSeconds: Math.round(this.elapsedSeconds),
        mode: this.mode,
        submode: this.submode,
        ...finalMetrics,
        mistakes: this.sessionMistakes
      };

      // Save to local storage
      this.saveLocalResult(result);
      this.updateWeakKeys(this.sessionMistakes);

      if (this.onFinish) {
        this.onFinish(result);
      }
    }

    saveLocalResult(result) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        const history = raw ? JSON.parse(raw) : [];
        history.unshift(result);
        // keep up to 100 recent tests
        if (history.length > 100) history.pop();
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }

    updateWeakKeys(sessionMistakes) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_WEAK_KEYS);
        const weakKeys = raw ? JSON.parse(raw) : {};
        for (const [key, count] of Object.entries(sessionMistakes)) {
          weakKeys[key] = (weakKeys[key] || 0) + count;
        }
        localStorage.setItem(STORAGE_KEY_WEAK_KEYS, JSON.stringify(weakKeys));
      } catch (e) {
        console.warn('Weak keys update failed:', e);
      }
    }

    playKeySound() {
      if (!this.soundEnabled) return;
      try {
        if (!this.audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        if (this.audioCtx) {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320 + Math.random() * 80, this.audioCtx.currentTime);
          gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.04);
        }
      } catch (e) {
        // audio blocked or unsupported
      }
    }

    static getHistory() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    static clearHistory() {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      localStorage.removeItem(STORAGE_KEY_WEAK_KEYS);
    }

    static getWeakKeys() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_WEAK_KEYS);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }
  }

  window.ECRIOX_TYPING_ENGINE = TypingEngine;
})();
