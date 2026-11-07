/**
 * EcrioX EMI & Loan Calculator
 * Accurate financial calculation of loan EMIs, interest totals, and visual amortization.
 */

(function () {
  'use strict';

  const rngAmount = document.getElementById('rngAmount');
  const txtAmount = document.getElementById('txtAmount');
  const rngRate = document.getElementById('rngRate');
  const txtRate = document.getElementById('txtRate');
  const rngTenure = document.getElementById('rngTenure');
  const txtTenure = document.getElementById('txtTenure');

  const lblEmiAmount = document.getElementById('lblEmiAmount');
  const lblPrincipal = document.getElementById('lblPrincipal');
  const lblTotalInterest = document.getElementById('lblTotalInterest');
  const lblTotalPayment = document.getElementById('lblTotalPayment');

  const barPrincipal = document.getElementById('barPrincipal');
  const barInterest = document.getElementById('barInterest');
  const lblPrincipalPct = document.getElementById('lblPrincipalPct');
  const lblInterestPct = document.getElementById('lblInterestPct');

  function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  }

  function calculate() {
    const P = parseFloat(txtAmount.value) || 0;
    const annualRate = parseFloat(txtRate.value) || 0;
    const years = parseFloat(txtTenure.value) || 0;

    if (P <= 0 || annualRate <= 0 || years <= 0) {
      lblEmiAmount.textContent = '$0.00';
      lblPrincipal.textContent = formatCurrency(P);
      lblTotalInterest.textContent = '$0.00';
      lblTotalPayment.textContent = formatCurrency(P);
      barPrincipal.style.width = '100%';
      barInterest.style.width = '0%';
      lblPrincipalPct.textContent = '100%';
      lblInterestPct.textContent = '0%';
      return;
    }

    const r = (annualRate / 12) / 100; // Monthly rate
    const n = years * 12; // Total months

    // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
    const factor = Math.pow(1 + r, n);
    const emi = (P * r * factor) / (factor - 1);

    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const principalPct = Math.round((P / totalPayment) * 100);
    const interestPct = 100 - principalPct;

    // Render
    lblEmiAmount.textContent = formatCurrency(emi);
    lblPrincipal.textContent = formatCurrency(P);
    lblTotalInterest.textContent = formatCurrency(totalInterest);
    lblTotalPayment.textContent = formatCurrency(totalPayment);

    barPrincipal.style.width = `${principalPct}%`;
    barInterest.style.width = `${interestPct}%`;
    lblPrincipalPct.textContent = `${principalPct}%`;
    lblInterestPct.textContent = `${interestPct}%`;
  }

  function sync(sourceInput, targetInput) {
    targetInput.value = sourceInput.value;
    calculate();
  }

  // Two-way bindings
  rngAmount.addEventListener('input', () => sync(rngAmount, txtAmount));
  txtAmount.addEventListener('input', () => sync(txtAmount, rngAmount));

  rngRate.addEventListener('input', () => sync(rngRate, txtRate));
  txtRate.addEventListener('input', () => sync(txtRate, rngRate));

  rngTenure.addEventListener('input', () => sync(rngTenure, txtTenure));
  txtTenure.addEventListener('input', () => sync(txtTenure, rngTenure));

  // Initial calculation
  calculate();
})();
