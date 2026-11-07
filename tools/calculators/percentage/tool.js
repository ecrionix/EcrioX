/**
 * EcrioX Percentage Calculator
 * Interactive 3-in-1 percentage math engine.
 */

(function () {
  'use strict';

  function formatNum(n) {
    if (isNaN(n) || !isFinite(n)) return '0';
    return parseFloat(n.toFixed(4)).toString();
  }

  // Mode 1: What is X% of Y?
  const m1_x = document.getElementById('m1_x');
  const m1_y = document.getElementById('m1_y');
  const res1 = document.getElementById('res1');
  const formula1 = document.getElementById('formula1');
  const btnCalc1 = document.getElementById('btnCalc1');

  function calc1() {
    const x = parseFloat(m1_x.value);
    const y = parseFloat(m1_y.value);

    if (isNaN(x) || isNaN(y)) {
      res1.textContent = '--';
      formula1.textContent = 'Please enter valid numbers.';
      return;
    }

    const val = (x / 100) * y;
    const formatted = formatNum(val);
    res1.textContent = formatted;
    formula1.textContent = `Formula: (${x} / 100) × ${y} = ${formatted}`;
  }

  // Mode 2: X is what % of Y?
  const m2_x = document.getElementById('m2_x');
  const m2_y = document.getElementById('m2_y');
  const res2 = document.getElementById('res2');
  const formula2 = document.getElementById('formula2');
  const btnCalc2 = document.getElementById('btnCalc2');

  function calc2() {
    const x = parseFloat(m2_x.value);
    const y = parseFloat(m2_y.value);

    if (isNaN(x) || isNaN(y)) {
      res2.textContent = '--';
      formula2.textContent = 'Please enter valid numbers.';
      return;
    }

    if (y === 0) {
      res2.textContent = 'Undefined';
      formula2.textContent = 'Cannot divide by zero.';
      return;
    }

    const val = (x / y) * 100;
    const formatted = formatNum(val);
    res2.textContent = `${formatted}%`;
    formula2.textContent = `Formula: (${x} / ${y}) × 100 = ${formatted}%`;
  }

  // Mode 3: Percentage Increase / Decrease
  const m3_x = document.getElementById('m3_x');
  const m3_y = document.getElementById('m3_y');
  const res3 = document.getElementById('res3');
  const formula3 = document.getElementById('formula3');
  const btnCalc3 = document.getElementById('btnCalc3');

  function calc3() {
    const x = parseFloat(m3_x.value);
    const y = parseFloat(m3_y.value);

    if (isNaN(x) || isNaN(y)) {
      res3.textContent = '--';
      formula3.textContent = 'Please enter valid numbers.';
      return;
    }

    if (x === 0) {
      res3.textContent = 'Undefined';
      formula3.textContent = 'Initial value cannot be zero.';
      return;
    }

    const diff = y - x;
    const pct = (diff / x) * 100;
    const formatted = formatNum(Math.abs(pct));

    if (diff > 0) {
      res3.textContent = `+${formatted}% Increase`;
      res3.style.color = 'var(--color-success)';
      formula3.textContent = `Formula: ((${y} - ${x}) / ${x}) × 100 = +${formatted}%`;
    } else if (diff < 0) {
      res3.textContent = `-${formatted}% Decrease`;
      res3.style.color = '#ef4444';
      formula3.textContent = `Formula: ((${y} - ${x}) / ${x}) × 100 = -${formatted}%`;
    } else {
      res3.textContent = '0% No Change';
      res3.style.color = 'var(--color-primary)';
      formula3.textContent = `Initial and final values are identical.`;
    }
  }

  // Attach Listeners
  m1_x.addEventListener('input', calc1);
  m1_y.addEventListener('input', calc1);
  if (btnCalc1) btnCalc1.addEventListener('click', calc1);

  m2_x.addEventListener('input', calc2);
  m2_y.addEventListener('input', calc2);
  if (btnCalc2) btnCalc2.addEventListener('click', calc2);

  m3_x.addEventListener('input', calc3);
  m3_y.addEventListener('input', calc3);
  if (btnCalc3) btnCalc3.addEventListener('click', calc3);

  // Initial runs
  calc1();
  calc2();
  calc3();
})();
