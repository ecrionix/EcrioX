/**
 * EcrioX Secure Password Generator
 * Cryptographically random password generator with entropy calculation.
 */

(function () {
  'use strict';

  const lblPassword = document.getElementById('lblPassword');
  const btnCopyPwd = document.getElementById('btnCopyPwd');
  const btnRegeneratePwd = document.getElementById('btnRegeneratePwd');
  const rngLength = document.getElementById('rngLength');
  const lblLengthVal = document.getElementById('lblLengthVal');

  const chkUpper = document.getElementById('chkUpper');
  const chkLower = document.getElementById('chkLower');
  const chkNumbers = document.getElementById('chkNumbers');
  const chkSymbols = document.getElementById('chkSymbols');
  const chkExcludeAmbiguous = document.getElementById('chkExcludeAmbiguous');

  const barStrength = document.getElementById('barStrength');
  const lblStrengthText = document.getElementById('lblStrengthText');
  const lblEntropy = document.getElementById('lblEntropy');

  const CHARS = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const AMBIGUOUS = /[l1IO0]/g;

  function getRandomInt(max) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }

  function generatePassword() {
    const length = parseInt(rngLength.value, 10) || 16;
    lblLengthVal.textContent = length;

    let availableSets = [];
    if (chkUpper.checked) availableSets.push(CHARS.upper);
    if (chkLower.checked) availableSets.push(CHARS.lower);
    if (chkNumbers.checked) availableSets.push(CHARS.numbers);
    if (chkSymbols.checked) availableSets.push(CHARS.symbols);

    if (availableSets.length === 0) {
      chkLower.checked = true;
      availableSets.push(CHARS.lower);
    }

    if (chkExcludeAmbiguous.checked) {
      availableSets = availableSets.map(set => set.replace(AMBIGUOUS, ''));
    }

    const pool = availableSets.join('');
    if (!pool.length) {
      lblPassword.textContent = 'Error: empty character pool';
      return;
    }

    // Ensure at least one character from each selected set
    const resultChars = [];
    availableSets.forEach(set => {
      if (set.length > 0) {
        resultChars.push(set[getRandomInt(set.length)]);
      }
    });

    // Fill remaining length
    while (resultChars.length < length) {
      resultChars.push(pool[getRandomInt(pool.length)]);
    }

    // Shuffle result
    for (let i = resultChars.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      const temp = resultChars[i];
      resultChars[i] = resultChars[j];
      resultChars[j] = temp;
    }

    const password = resultChars.join('');
    lblPassword.textContent = password;

    // Calculate Entropy
    const poolSize = pool.length;
    const entropy = Math.round(length * (Math.log2(poolSize)));
    lblEntropy.textContent = `${entropy} bits`;

    // Strength classification
    if (entropy < 45) {
      barStrength.style.width = '25%';
      barStrength.style.backgroundColor = '#ef4444';
      lblStrengthText.textContent = 'Weak';
      lblStrengthText.style.color = '#ef4444';
    } else if (entropy < 65) {
      barStrength.style.width = '55%';
      barStrength.style.backgroundColor = '#f59e0b';
      lblStrengthText.textContent = 'Fair';
      lblStrengthText.style.color = '#f59e0b';
    } else if (entropy < 85) {
      barStrength.style.width = '80%';
      barStrength.style.backgroundColor = 'var(--color-primary)';
      lblStrengthText.textContent = 'Strong';
      lblStrengthText.style.color = 'var(--color-primary)';
    } else {
      barStrength.style.width = '100%';
      barStrength.style.backgroundColor = 'var(--color-success)';
      lblStrengthText.textContent = 'Very Strong';
      lblStrengthText.style.color = 'var(--color-success)';
    }
  }

  // Event Listeners
  rngLength.addEventListener('input', generatePassword);
  chkUpper.addEventListener('change', generatePassword);
  chkLower.addEventListener('change', generatePassword);
  chkNumbers.addEventListener('change', generatePassword);
  chkSymbols.addEventListener('change', generatePassword);
  chkExcludeAmbiguous.addEventListener('change', generatePassword);
  btnRegeneratePwd.addEventListener('click', generatePassword);

  btnCopyPwd.addEventListener('click', () => {
    const pwd = lblPassword.textContent;
    if (!pwd || pwd.startsWith('Error')) return;
    navigator.clipboard.writeText(pwd).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Password copied to clipboard!');
    }).catch(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Copied!', 'success');
    });
  });

  // Init
  generatePassword();
})();
