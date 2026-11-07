/**
 * EcrioX Password & Passphrase Generator
 * 100% Client-Side Cryptographic Randomness using Web Crypto API (CSPRNG)
 */

(function () {
  'use strict';

  // Curated Clean Wordlist for Memorable Passphrases (Diceware style)
  const WORDLIST = [
    "amber", "anchor", "apple", "apron", "arctic", "arrow", "atlas", "autumn", "avocado", "badger",
    "baker", "bamboo", "banner", "barrel", "beacon", "beetle", "breeze", "bridge", "bronze", "cabin",
    "cactus", "canyon", "castle", "cedar", "celery", "cherry", "cipher", "citrus", "clover", "comet",
    "copper", "coral", "cosmos", "cotton", "crater", "creek", "crystal", "canyon", "delta", "desert",
    "dolphin", "dragon", "eagle", "echo", "eclipse", "ember", "emerald", "falcon", "feather", "fern",
    "finch", "flame", "forest", "fossil", "frost", "galaxy", "garden", "garnet", "geyser", "glacier",
    "glade", "granite", "grove", "harbor", "haven", "hawk", "hazel", "helix", "horizon", "island",
    "jaguar", "jasper", "jungle", "lagoon", "lark", "laurel", "ledger", "lemon", "leopard", "liberty",
    "lilac", "linden", "lotus", "lumber", "lunar", "magnet", "maple", "meadow", "meteor", "mirage",
    "monarch", "moss", "mountain", "nebula", "nectar", "nest", "nickel", "nova", "oasis", "ocean",
    "olive", "onyx", "opal", "orbit", "orchard", "orchid", "otter", "palace", "panther", "parade",
    "parrot", "pathway", "pebble", "pelican", "penguin", "pepper", "phoenix", "pillar", "pinnacle", "planet",
    "plasma", "plover", "polar", "ponder", "prairie", "prism", "pulsar", "pyramid", "quartz", "quiver",
    "radiant", "raptor", "ravine", "reef", "rhino", "ridge", "ripple", "river", "robin", "rocket",
    "ruby", "saffron", "sage", "sapphire", "satin", "savanna", "shadow", "shimmer", "sierra", "silver",
    "skylark", "solace", "solar", "sparrow", "spiral", "spring", "spruce", "star", "summit", "sunflower",
    "sunrise", "sunset", "swift", "talon", "tavern", "temple", "timber", "titan", "topaz", "torrent",
    "tower", "tropic", "tulip", "tundra", "twilight", "valley", "velvet", "venture", "vibrant", "village",
    "violet", "vista", "volcano", "vortex", "walnut", "warbler", "water", "whisper", "willow", "winter",
    "wizard", "zenith", "zephyr", "zodiac", "acorn", "albatross", "almond", "alpine", "anchor", "angel",
    "antenna", "anvil", "apex", "apollo", "arcade", "arch", "archive", "arrow", "artist", "aspect",
    "aston", "atoll", "atom", "aurora", "avalanche", "avenue", "axiom", "azure", "badge", "balsam",
    "bandit", "banjo", "baobab", "baron", "basil", "basalt", "bastion", "battery", "bazaar", "beaver",
    "belfry", "bell", "bison", "blade", "blizzard", "bloom", "blossom", "bonfire", "boulder", "bound",
    "bounty", "bracket", "bramble", "branch", "bravo", "breeze", "brick", "brim", "brisk", "broad",
    "broker", "brook", "broom", "bubble", "buckler", "buffalo", "bullet", "buoy", "burrow", "butter",
    "button", "caboose", "cadet", "calico", "calm", "camel", "camper", "canal", "canary", "candle",
    "canoe", "canopy", "canvas", "capital", "captain", "caravan", "cardinal", "cargo", "cascade", "cashew",
    "casque", "castor", "catkin", "cavity", "cavern", "celeste", "cellar", "cereal", "chalet", "chalk",
    "chamber", "chamois", "channel", "chapel", "chariot", "charter", "chateau", "chestnut", "chimney", "chipmunk",
    "chisel", "chrome", "cinder", "cinema", "circle", "circus", "clarion", "classic", "claw", "cliff",
    "climate", "climax", "cloister", "cloud", "clove", "cluster", "cobalt", "cobra", "coconut", "cocoon",
    "coffee", "coffer", "collar", "colony", "column", "comb", "command", "compass", "compound", "comrade",
    "concerto", "conduit", "conifer", "console", "consul", "contour", "copper", "corgi", "cornice", "coronet",
    "corsair", "cortex", "cosmic", "courier", "cove", "coyote", "cradle", "craft", "cranberry", "crane"
  ];

  // Character Sets
  const CHAR_SETS = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
  };

  const AMBIGUOUS_CHARS = "0O1lI";

  // DOM Elements
  const tabPassword = document.getElementById('tab-password');
  const tabPassphrase = document.getElementById('tab-passphrase');
  const sectionPasswordSettings = document.getElementById('section-password-settings');
  const sectionPassphraseSettings = document.getElementById('section-passphrase-settings');

  const passwordDisplay = document.getElementById('password-display');
  const btnToggleMask = document.getElementById('btn-toggle-mask');
  const eyeIcon = document.getElementById('eye-icon');
  const btnRegenerate = document.getElementById('btn-regenerate');
  const btnCopy = document.getElementById('btn-copy');

  const strengthLabel = document.getElementById('strength-label');
  const entropyLabel = document.getElementById('entropy-label');
  const meterFill = document.getElementById('meter-fill');
  const charComposition = document.getElementById('char-composition');
  const statUpper = document.getElementById('stat-upper');
  const statLower = document.getElementById('stat-lower');
  const statNums = document.getElementById('stat-nums');
  const statSyms = document.getElementById('stat-syms');

  const lengthSlider = document.getElementById('length-slider');
  const lengthDisplay = document.getElementById('length-display');
  const chkUpper = document.getElementById('chk-upper');
  const chkLower = document.getElementById('chk-lower');
  const chkNumbers = document.getElementById('chk-numbers');
  const chkSymbols = document.getElementById('chk-symbols');
  const chkNoAmbiguous = document.getElementById('chk-no-ambiguous');
  const inputCustomExclude = document.getElementById('input-custom-exclude');

  const wordsSlider = document.getElementById('words-slider');
  const wordsDisplay = document.getElementById('words-display');
  const passphraseSeparator = document.getElementById('passphrase-separator');
  const passphraseCasing = document.getElementById('passphrase-casing');
  const chkPassphraseNum = document.getElementById('chk-passphrase-num');

  const bulkCountSelect = document.getElementById('bulk-count-select');
  const btnResetTool = document.getElementById('btn-reset-tool');
  const multiPwdBox = document.getElementById('multi-pwd-box');
  const multiPwdList = document.getElementById('multi-pwd-list');

  // State
  let currentMode = 'password'; // 'password' | 'passphrase'
  let currentPassword = '';
  let isMasked = false;

  initEvents();
  generate();

  function initEvents() {
    // Mode Switching
    tabPassword.addEventListener('click', () => {
      currentMode = 'password';
      tabPassword.classList.add('active');
      tabPassphrase.classList.remove('active');
      sectionPasswordSettings.style.display = 'block';
      sectionPassphraseSettings.style.display = 'none';
      charComposition.style.display = 'flex';
      generate();
    });

    tabPassphrase.addEventListener('click', () => {
      currentMode = 'passphrase';
      tabPassphrase.classList.add('active');
      tabPassword.classList.remove('active');
      sectionPasswordSettings.style.display = 'none';
      sectionPassphraseSettings.style.display = 'block';
      charComposition.style.display = 'none';
      generate();
    });

    // Password Slider & Inputs
    lengthSlider.addEventListener('input', (e) => {
      lengthDisplay.textContent = e.target.value;
      generate();
    });

    [chkUpper, chkLower, chkNumbers, chkSymbols, chkNoAmbiguous].forEach(el => {
      el.addEventListener('change', () => {
        // Prevent all checkboxes being unchecked
        if (!chkUpper.checked && !chkLower.checked && !chkNumbers.checked && !chkSymbols.checked) {
          chkLower.checked = true;
        }
        generate();
      });
    });

    inputCustomExclude.addEventListener('input', generate);

    // Passphrase Controls
    wordsSlider.addEventListener('input', (e) => {
      wordsDisplay.textContent = e.target.value;
      generate();
    });

    [passphraseSeparator, passphraseCasing, chkPassphraseNum].forEach(el => {
      el.addEventListener('change', generate);
    });

    // Action buttons
    btnRegenerate.addEventListener('click', generate);
    btnCopy.addEventListener('click', copyPrimaryPassword);
    btnToggleMask.addEventListener('click', toggleMask);
    bulkCountSelect.addEventListener('change', generate);
    btnResetTool.addEventListener('click', resetDefaults);
  }

  /**
   * Cryptographically secure integer generator with unbiased rejection sampling
   */
  function getSecureRandomInt(max) {
    if (max <= 1) return 0;
    const bitsNeeded = Math.ceil(Math.log2(max));
    const bytesNeeded = Math.ceil(bitsNeeded / 8);
    const mask = (1 << bitsNeeded) - 1;
    const array = new Uint8Array(bytesNeeded);

    while (true) {
      window.crypto.getRandomValues(array);
      let value = 0;
      for (let i = 0; i < bytesNeeded; i++) {
        value = (value << 8) | array[i];
      }
      value = value & mask;
      if (value < max) {
        return value;
      }
    }
  }

  /**
   * Primary Generator function
   */
  function generate() {
    const bulkCount = parseInt(bulkCountSelect.value, 10);
    const generatedList = [];

    for (let b = 0; b < bulkCount; b++) {
      if (currentMode === 'password') {
        generatedList.push(generateSinglePassword());
      } else {
        generatedList.push(generateSinglePassphrase());
      }
    }

    currentPassword = generatedList[0];
    renderPasswordDisplay();
    updateStrengthAndEntropy();

    if (bulkCount > 1) {
      multiPwdBox.style.display = 'block';
      renderBulkList(generatedList);
    } else {
      multiPwdBox.style.display = 'none';
      multiPwdList.innerHTML = '';
    }
  }

  /**
   * Generate a standard password
   */
  function generateSinglePassword() {
    const length = parseInt(lengthSlider.value, 10);
    let pool = '';
    const activeSets = [];

    const excludedChars = new Set();
    if (chkNoAmbiguous.checked) {
      for (const ch of AMBIGUOUS_CHARS) excludedChars.add(ch);
    }
    const customExcludes = inputCustomExclude.value;
    for (const ch of customExcludes) excludedChars.add(ch);

    function filterSet(setStr) {
      return setStr.split('').filter(c => !excludedChars.has(c)).join('');
    }

    if (chkUpper.checked) {
      const s = filterSet(CHAR_SETS.upper);
      if (s) { pool += s; activeSets.push(s); }
    }
    if (chkLower.checked) {
      const s = filterSet(CHAR_SETS.lower);
      if (s) { pool += s; activeSets.push(s); }
    }
    if (chkNumbers.checked) {
      const s = filterSet(CHAR_SETS.numbers);
      if (s) { pool += s; activeSets.push(s); }
    }
    if (chkSymbols.checked) {
      const s = filterSet(CHAR_SETS.symbols);
      if (s) { pool += s; activeSets.push(s); }
    }

    if (!pool) pool = filterSet(CHAR_SETS.lower) || 'abcdefghijklmnopqrstuvwxyz';

    const resultChars = [];

    // Ensure at least one char from each active set
    activeSets.forEach(s => {
      if (resultChars.length < length) {
        resultChars.push(s[getSecureRandomInt(s.length)]);
      }
    });

    // Fill the remainder
    while (resultChars.length < length) {
      resultChars.push(pool[getSecureRandomInt(pool.length)]);
    }

    // Fisher-Yates Shuffle with CSPRNG
    for (let i = resultChars.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      const temp = resultChars[i];
      resultChars[i] = resultChars[j];
      resultChars[j] = temp;
    }

    return resultChars.join('');
  }

  /**
   * Generate a memorable passphrase
   */
  function generateSinglePassphrase() {
    const numWords = parseInt(wordsSlider.value, 10);
    const casing = passphraseCasing.value;
    const sepOption = passphraseSeparator.value;

    const chosenWords = [];
    for (let i = 0; i < numWords; i++) {
      let word = WORDLIST[getSecureRandomInt(WORDLIST.length)];
      if (casing === 'title') {
        word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      } else if (casing === 'upper') {
        word = word.toUpperCase();
      } else {
        word = word.toLowerCase();
      }
      chosenWords.push(word);
    }

    let separator = sepOption;
    if (sepOption === 'num') {
      // Join with random digits
      let joined = '';
      chosenWords.forEach((w, idx) => {
        joined += w;
        if (idx < chosenWords.length - 1) {
          joined += getSecureRandomInt(10);
        }
      });
      if (chkPassphraseNum.checked) {
        joined += getSecureRandomInt(100);
      }
      return joined;
    }

    let phrase = chosenWords.join(separator);
    if (chkPassphraseNum.checked) {
      phrase += (separator !== ' ' ? separator : '') + getSecureRandomInt(100);
    }
    return phrase;
  }

  /**
   * Update visual display of primary password
   */
  function renderPasswordDisplay() {
    if (isMasked) {
      passwordDisplay.textContent = '•'.repeat(Math.min(32, currentPassword.length));
    } else {
      passwordDisplay.textContent = currentPassword;
    }
  }

  /**
   * Toggle Show/Hide password masking
   */
  function toggleMask() {
    isMasked = !isMasked;
    eyeIcon.innerHTML = isMasked
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    renderPasswordDisplay();
  }

  /**
   * Calculate Shannon entropy and update strength meter
   */
  function updateStrengthAndEntropy() {
    let entropyBits = 0;

    if (currentMode === 'password') {
      let poolSize = 0;
      let hasUpper = false, hasLower = false, hasNum = false, hasSym = false;

      let upperCount = 0, lowerCount = 0, numCount = 0, symCount = 0;

      for (const ch of currentPassword) {
        if (/[A-Z]/.test(ch)) { upperCount++; hasUpper = true; }
        else if (/[a-z]/.test(ch)) { lowerCount++; hasLower = true; }
        else if (/[0-9]/.test(ch)) { numCount++; hasNum = true; }
        else { symCount++; hasSym = true; }
      }

      if (hasUpper) poolSize += 26;
      if (hasLower) poolSize += 26;
      if (hasNum) poolSize += 10;
      if (hasSym) poolSize += 30;

      if (poolSize > 0) {
        entropyBits = Math.round(currentPassword.length * (Math.log2(poolSize)));
      }

      statUpper.textContent = `Upper: ${upperCount}`;
      statLower.textContent = `Lower: ${lowerCount}`;
      statNums.textContent = `Numbers: ${numCount}`;
      statSyms.textContent = `Symbols: ${symCount}`;

    } else {
      // Passphrase entropy
      const numWords = parseInt(wordsSlider.value, 10);
      let bits = numWords * Math.log2(WORDLIST.length);
      if (chkPassphraseNum.checked) bits += Math.log2(100);
      entropyBits = Math.round(bits);
    }

    entropyLabel.textContent = `${entropyBits} bits`;

    // Categorize strength
    let label = 'Very Weak';
    let color = 'var(--color-danger)';
    let widthPct = 20;

    if (entropyBits >= 100) {
      label = 'Very Strong';
      color = 'var(--color-primary)';
      widthPct = 100;
    } else if (entropyBits >= 80) {
      label = 'Strong';
      color = 'var(--color-success)';
      widthPct = 80;
    } else if (entropyBits >= 56) {
      label = 'Moderate';
      color = 'var(--color-warning)';
      widthPct = 60;
    } else if (entropyBits >= 36) {
      label = 'Weak';
      color = '#f97316';
      widthPct = 40;
    } else {
      label = 'Very Weak';
      color = 'var(--color-danger)';
      widthPct = 20;
    }

    strengthLabel.textContent = label;
    strengthLabel.style.color = color;
    meterFill.style.width = widthPct + '%';
    meterFill.style.backgroundColor = color;
  }

  /**
   * Render bulk password list
   */
  function renderBulkList(passwords) {
    multiPwdList.innerHTML = '';
    passwords.forEach((pwd, idx) => {
      const item = document.createElement('div');
      item.className = 'multi-pwd-item';
      item.innerHTML = `
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.75rem;">${escapeHtml(pwd)}</span>
        <button class="btn btn-sm btn-secondary" onclick="window.copyBulkPwd('${idx}')" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;">
          Copy
        </button>
      `;
      multiPwdList.appendChild(item);
    });

    window.bulkPasswords = passwords;
  }

  window.copyBulkPwd = function (index) {
    const pwd = window.bulkPasswords[index];
    if (pwd) copyTextToClipboard(pwd);
  };

  /**
   * Copy primary password to clipboard
   */
  function copyPrimaryPassword() {
    copyTextToClipboard(currentPassword, btnCopy);
  }

  function copyTextToClipboard(text, btnElement) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (btnElement) {
        const origHtml = btnElement.innerHTML;
        btnElement.innerHTML = `<span style="color: #fff; font-weight:700;">✓ Copied!</span>`;
        setTimeout(() => {
          btnElement.innerHTML = origHtml;
        }, 1800);
      }
    }).catch(err => {
      console.warn('Clipboard write error:', err);
    });
  }

  /**
   * Reset tool to factory defaults and wipe passwords from view
   */
  function resetDefaults() {
    lengthSlider.value = 16;
    lengthDisplay.textContent = '16';
    chkUpper.checked = true;
    chkLower.checked = true;
    chkNumbers.checked = true;
    chkSymbols.checked = true;
    chkNoAmbiguous.checked = true;
    inputCustomExclude.value = '';

    wordsSlider.value = 5;
    wordsDisplay.textContent = '5';
    passphraseSeparator.value = '-';
    passphraseCasing.value = 'title';
    chkPassphraseNum.checked = true;

    bulkCountSelect.value = '1';
    currentMode = 'password';
    tabPassword.click();

    generate();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
