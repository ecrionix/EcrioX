/**
 * EcrioX - GST Calculator India
 * Pure client-side GST, CGST, SGST, IGST calculations (Inclusive & Exclusive)
 */
(function() {
  'use strict';

  // Elements
  const btnExclusive = document.getElementById('btn-mode-exclusive');
  const btnInclusive = document.getElementById('btn-mode-inclusive');
  const amountLabel = document.getElementById('amount-input-label');
  const inputAmount = document.getElementById('input-amount');
  const rateBtns = document.querySelectorAll('.rate-btn');
  const customRateInput = document.getElementById('custom-rate-input');
  const supplyTypeInputs = document.querySelectorAll('input[name="supply-type"]');
  
  // Results
  const lblNetAmount = document.getElementById('lbl-net-amount');
  const resNetAmount = document.getElementById('res-net-amount');
  const resRateBadge = document.getElementById('res-rate-badge');
  const resGstAmount = document.getElementById('res-gst-amount');
  const lblTotalAmount = document.getElementById('lbl-total-amount');
  const resTotalAmount = document.getElementById('res-total-amount');

  // Breakdown table
  const tblBaseVal = document.getElementById('tbl-base-val');
  const rowCgst = document.getElementById('row-cgst');
  const tblCgstRate = document.getElementById('tbl-cgst-rate');
  const tblCgstVal = document.getElementById('tbl-cgst-val');
  const rowSgst = document.getElementById('row-sgst');
  const tblSgstRate = document.getElementById('tbl-sgst-rate');
  const tblSgstVal = document.getElementById('tbl-sgst-val');
  const rowIgst = document.getElementById('row-igst');
  const tblIgstRate = document.getElementById('tbl-igst-rate');
  const tblIgstVal = document.getElementById('tbl-igst-val');
  const tblFinalVal = document.getElementById('tbl-final-val');

  // Actions
  const btnReset = document.getElementById('btn-reset-calc');
  const btnCopy = document.getElementById('btn-copy-gst');

  // State
  let mode = 'exclusive'; // 'exclusive' | 'inclusive'
  let currentRate = 18;
  let supplyType = 'intra'; // 'intra' | 'inter'

  // Indian currency formatting helper: ₹ 1,00,000.00
  function formatINR(val) {
    if (isNaN(val) || !isFinite(val)) return '₹0.00';
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculate() {
    const rawVal = parseFloat(inputAmount.value);
    const amount = isNaN(rawVal) || rawVal < 0 ? 0 : rawVal;
    const rate = currentRate;

    let baseAmount = 0;
    let gstAmount = 0;
    let totalAmount = 0;

    if (mode === 'exclusive') {
      // Amount entered is Base Amount; GST is added on top
      baseAmount = amount;
      gstAmount = (baseAmount * rate) / 100;
      totalAmount = baseAmount + gstAmount;
    } else {
      // Amount entered is Inclusive (MRP); Reverse GST
      totalAmount = amount;
      baseAmount = totalAmount / (1 + (rate / 100));
      gstAmount = totalAmount - baseAmount;
    }

    // Display summary
    resRateBadge.textContent = `${rate}%`;
    resNetAmount.textContent = formatINR(baseAmount);
    resGstAmount.textContent = formatINR(gstAmount);
    resTotalAmount.textContent = formatINR(totalAmount);

    tblBaseVal.textContent = formatINR(baseAmount);
    tblFinalVal.textContent = formatINR(totalAmount);

    if (supplyType === 'intra') {
      // Intra-state: Split 50/50 between CGST and SGST
      const halfRate = (rate / 2).toFixed(2).replace(/\.00$/, '');
      const halfGst = gstAmount / 2;

      rowCgst.style.display = '';
      rowSgst.style.display = '';
      rowIgst.style.display = 'none';

      tblCgstRate.textContent = `${halfRate}%`;
      tblCgstVal.textContent = formatINR(halfGst);
      tblSgstRate.textContent = `${halfRate}%`;
      tblSgstVal.textContent = formatINR(halfGst);
    } else {
      // Inter-state: 100% IGST
      rowCgst.style.display = 'none';
      rowSgst.style.display = 'none';
      rowIgst.style.display = '';

      tblIgstRate.textContent = `${rate}%`;
      tblIgstVal.textContent = formatINR(gstAmount);
    }
  }

  // Mode switching
  function setMode(newMode) {
    mode = newMode;
    if (mode === 'exclusive') {
      btnExclusive.classList.add('active');
      btnInclusive.classList.remove('active');
      amountLabel.textContent = 'Initial Net Amount (₹)';
      lblNetAmount.textContent = 'Net Base Amount';
      lblTotalAmount.textContent = 'Final Gross Amount';
    } else {
      btnInclusive.classList.add('active');
      btnExclusive.classList.remove('active');
      amountLabel.textContent = 'Total Inclusive MRP / Price (₹)';
      lblNetAmount.textContent = 'Original Pre-Tax Amount';
      lblTotalAmount.textContent = 'Total Gross Price';
    }
    calculate();
  }

  btnExclusive.addEventListener('click', () => setMode('exclusive'));
  btnInclusive.addEventListener('click', () => setMode('inclusive'));

  // Rate presets
  rateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      rateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      customRateInput.value = '';
      currentRate = parseFloat(btn.getAttribute('data-rate'));
      calculate();
    });
  });

  // Custom rate input
  customRateInput.addEventListener('input', () => {
    const customVal = parseFloat(customRateInput.value);
    if (!isNaN(customVal) && customVal >= 0 && customVal <= 100) {
      rateBtns.forEach(b => b.classList.remove('active'));
      currentRate = customVal;
      calculate();
    }
  });

  // Supply type change
  supplyTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      supplyType = e.target.value;
      calculate();
    });
  });

  // Input amount change
  inputAmount.addEventListener('input', calculate);

  // Reset
  btnReset.addEventListener('click', () => {
    inputAmount.value = '10000';
    setMode('exclusive');
    customRateInput.value = '';
    rateBtns.forEach(b => {
      if (b.getAttribute('data-rate') === '18') b.classList.add('active');
      else b.classList.remove('active');
    });
    currentRate = 18;
    supplyTypeInputs[0].checked = true;
    supplyType = 'intra';
    calculate();
  });

  // Copy Summary
  btnCopy.addEventListener('click', () => {
    const rawVal = parseFloat(inputAmount.value) || 0;
    const rate = currentRate;
    let base = 0, gst = 0, total = 0;
    if (mode === 'exclusive') {
      base = rawVal;
      gst = (base * rate) / 100;
      total = base + gst;
    } else {
      total = rawVal;
      base = total / (1 + (rate / 100));
      gst = total - base;
    }

    let splitDetails = '';
    if (supplyType === 'intra') {
      const halfRate = (rate / 2).toFixed(2).replace(/\.00$/, '');
      splitDetails = `CGST (${halfRate}%): ${formatINR(gst / 2)}\nSGST (${halfRate}%): ${formatINR(gst / 2)}`;
    } else {
      splitDetails = `IGST (${rate}%): ${formatINR(gst)}`;
    }

    const textToCopy = `EcrioX GST Calculation Summary:
----------------------------------------
Calculation Mode : ${mode === 'exclusive' ? 'GST Exclusive (Added)' : 'GST Inclusive (Removed)'}
GST Rate         : ${rate}%
Transaction Type : ${supplyType === 'intra' ? 'Intra-State' : 'Inter-State'}
Base Amount      : ${formatINR(base)}
Total GST        : ${formatINR(gst)}
${splitDetails}
Final Total      : ${formatINR(total)}
----------------------------------------
Calculated on EcrioX (https://ecriox.com/gst-calculator/)`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        btnCopy.classList.add('btn-success');
        setTimeout(() => {
          btnCopy.textContent = originalText;
          btnCopy.classList.remove('btn-success');
        }, 2000);
      }).catch(err => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  });

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      const originalText = btnCopy.textContent;
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
    } catch(e) {
      alert('Unable to copy to clipboard.');
    }
    document.body.removeChild(ta);
  }

  // Initial calculation
  calculate();
})();
