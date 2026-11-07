/**
 * EcrioX Typing Arena - 4 Interactive Browser Games
 * Word Rain, Word Blitz, Keyboard Challenge, Sentence Sprint
 */

(function () {
  'use strict';

  // 1. GAME 1: WORD RAIN
  class WordRainGame {
    constructor(canvas, onScoreUpdate, onGameOver) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onScoreUpdate = onScoreUpdate;
      this.onGameOver = onGameOver;

      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.words = [];
      this.currentTyped = '';
      this.isRunning = false;
      this.animationFrame = null;
      this.lastSpawn = 0;
      this.spawnInterval = 2000;
      this.fallSpeed = 1.2;

      this.dictionary = [
        'code', 'type', 'speed', 'arena', 'cloud', 'swift', 'quick', 'focus',
        'rhythm', 'stream', 'pulse', 'spark', 'light', 'flash', 'matrix',
        'system', 'rocket', 'galaxy', 'future', 'design', 'engine', 'vector'
      ];
    }

    start() {
      this.score = 0;
      this.lives = 3;
      this.level = 1;
      this.words = [];
      this.currentTyped = '';
      this.isRunning = true;
      this.lastSpawn = Date.now();
      this.fallSpeed = 1.2;
      this.spawnInterval = 2000;

      if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.lives, this.level, this.currentTyped);
      this.loop();
    }

    stop() {
      this.isRunning = false;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }

    spawnWord() {
      const text = this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
      const x = 50 + Math.random() * (this.canvas.width - 150);
      this.words.push({
        text,
        x,
        y: 20,
        speed: this.fallSpeed + Math.random() * 0.5
      });
    }

    handleKey(key) {
      if (!this.isRunning) return;

      if (key === 'Backspace') {
        this.currentTyped = this.currentTyped.slice(0, -1);
      } else if (key.length === 1 && !key.ctrlKey && !key.metaKey) {
        this.currentTyped += key.toLowerCase();
      }

      // Check if currentTyped matches any active word
      const matchIdx = this.words.findIndex(w => w.text.toLowerCase() === this.currentTyped.trim().toLowerCase());
      if (matchIdx !== -1) {
        // Word cleared!
        this.score += 10 * this.level;
        this.words.splice(matchIdx, 1);
        this.currentTyped = '';

        // Level up every 100 points
        this.level = Math.floor(this.score / 100) + 1;
        this.fallSpeed = 1.2 + this.level * 0.3;
        this.spawnInterval = Math.max(900, 2000 - this.level * 150);
      }

      if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.lives, this.level, this.currentTyped);
    }

    loop() {
      if (!this.isRunning) return;

      const now = Date.now();
      if (now - this.lastSpawn > this.spawnInterval) {
        this.spawnWord();
        this.lastSpawn = now;
      }

      // Update positions
      for (let i = this.words.length - 1; i >= 0; i--) {
        const w = this.words[i];
        w.y += w.speed;

        // Hit bottom?
        if (w.y > this.canvas.height - 20) {
          this.words.splice(i, 1);
          this.lives--;
          if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.lives, this.level, this.currentTyped);

          if (this.lives <= 0) {
            this.stop();
            if (this.onGameOver) this.onGameOver(this.score);
            return;
          }
        }
      }

      this.draw();
      this.animationFrame = requestAnimationFrame(() => this.loop());
    }

    draw() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Background grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Warning line at bottom
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, this.canvas.height - 25);
      ctx.lineTo(this.canvas.width, this.canvas.height - 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw falling words
      ctx.font = 'bold 20px "Fira Code", monospace';
      ctx.textBaseline = 'middle';

      this.words.forEach(w => {
        const isTarget = w.text.toLowerCase().startsWith(this.currentTyped.toLowerCase()) && this.currentTyped.length > 0;

        if (isTarget) {
          // Highlight matched portion
          const matchedPart = w.text.slice(0, this.currentTyped.length);
          const remainPart = w.text.slice(this.currentTyped.length);

          ctx.fillStyle = '#10b981';
          ctx.fillText(matchedPart, w.x, w.y);

          const matchedWidth = ctx.measureText(matchedPart).width;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(remainPart, w.x + matchedWidth, w.y);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(w.text, w.x, w.y);
        }
      });
    }
  }

  // 2. GAME 2: WORD BLITZ (60s Sprint)
  class WordBlitzGame {
    constructor(onUpdate, onFinish) {
      this.onUpdate = onUpdate;
      this.onFinish = onFinish;
      this.score = 0;
      this.timeRemaining = 60;
      this.timer = null;
      this.currentWord = '';
      this.wordsList = [
        'apple', 'beach', 'cloud', 'dance', 'eagle', 'flame', 'grace', 'heart',
        'input', 'jewel', 'karma', 'lemon', 'magic', 'noble', 'ocean', 'peace',
        'queen', 'river', 'stone', 'tiger', 'unity', 'voice', 'water', 'yield'
      ];
    }

    start() {
      this.score = 0;
      this.timeRemaining = 60;
      this.nextWord();

      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.timeRemaining--;
        if (this.onUpdate) this.onUpdate(this.currentWord, this.score, this.timeRemaining);
        if (this.timeRemaining <= 0) {
          this.finish();
        }
      }, 1000);

      if (this.onUpdate) this.onUpdate(this.currentWord, this.score, this.timeRemaining);
    }

    nextWord() {
      this.currentWord = this.wordsList[Math.floor(Math.random() * this.wordsList.length)];
    }

    submitWord(typed) {
      if (typed.trim().toLowerCase() === this.currentWord.toLowerCase()) {
        this.score++;
        this.nextWord();
        if (this.onUpdate) this.onUpdate(this.currentWord, this.score, this.timeRemaining);
        return true;
      }
      return false;
    }

    finish() {
      clearInterval(this.timer);
      if (this.onFinish) this.onFinish(this.score);
    }
  }

  // 3. GAME 3: KEYBOARD CHALLENGE (Reaction Speed)
  class KeyboardChallengeGame {
    constructor(onUpdate, onFinish) {
      this.onUpdate = onUpdate;
      this.onFinish = onFinish;
      this.keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
      this.currentKey = '';
      this.score = 0;
      this.round = 0;
      this.maxRounds = 25;
      this.startTime = null;
      this.latencies = [];
    }

    start() {
      this.score = 0;
      this.round = 0;
      this.latencies = [];
      this.nextRound();
    }

    nextRound() {
      if (this.round >= this.maxRounds) {
        this.finish();
        return;
      }
      this.round++;
      this.currentKey = this.keys[Math.floor(Math.random() * this.keys.length)];
      this.startTime = Date.now();
      if (this.onUpdate) this.onUpdate(this.currentKey, this.round, this.score, null);
    }

    handleKey(pressedKey) {
      if (!this.currentKey) return;
      const latency = Date.now() - this.startTime;

      if (pressedKey.toUpperCase() === this.currentKey) {
        this.score++;
        this.latencies.push(latency);
        if (this.onUpdate) this.onUpdate(this.currentKey, this.round, this.score, latency);
        setTimeout(() => this.nextRound(), 300);
      }
    }

    finish() {
      const avgLatency = this.latencies.length > 0 ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length) : 0;
      if (this.onFinish) this.onFinish(this.score, avgLatency);
    }
  }

  window.ECRIOX_GAMES = {
    WordRainGame,
    WordBlitzGame,
    KeyboardChallengeGame
  };
})();
