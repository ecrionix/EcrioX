/**
 * EcrioX - Invoice Generator
 * Client-side interactive invoice builder with multi-currency, GST/VAT computation, and PDF printing.
 */
(function() {
  'use strict';

  // Elements
  const currencySelect = document.getElementById('currency-select');
  const currencyLabels = document.querySelectorAll('.currency-label');
  const btnLoadSample = document.getElementById('btn-load-sample');
  const btnReset = document.getElementById('btn-reset-inv');
  const btnPrint = document.getElementById('btn-print-inv');

  const logoPlaceholder = document.getElementById('logo-placeholder');
  const logoFileInput = document.getElementById('logo-file-input');
  const logoPreviewImg = document.getElementById('logo-preview-img');
  const logoPromptText = document.getElementById('logo-prompt-text');

  const invDate = document.getElementById('inv-date');
  const invDueDate = document.getElementById('inv-due-date');

  const lineItemsTbody = document.getElementById('line-items-tbody');
  const btnAddLineItem = document.getElementById('btn-add-line-item');

  const discountPct = document.getElementById('discount-pct');
  const taxPct = document.getElementById('tax-pct');
  const shippingFee = document.getElementById('shipping-fee');

  const totSubtotal = document.getElementById('tot-subtotal');
  const totDiscount = document.getElementById('tot-discount');
  const totTax = document.getElementById('tot-tax');
  const totGrandTotal = document.getElementById('tot-grand-total');

  let currencySymbol = '₹';

  // Date initialization
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  invDate.value = todayStr;
  invDueDate.value = dueDateStr;

  function formatMoney(amount) {
    if (isNaN(amount) || !isFinite(amount)) amount = 0;
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Currency switcher
  currencySelect.addEventListener('change', () => {
    currencySymbol = currencySelect.value;
    currencyLabels.forEach(el => el.textContent = currencySymbol);
    calculateTotals();
  });

  // Logo upload
  logoPlaceholder.addEventListener('click', () => logoFileInput.click());
  logoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = ev => {
        logoPreviewImg.src = ev.target.result;
        logoPreviewImg.style.display = 'block';
        logoPromptText.style.display = 'none';
        logoPlaceholder.style.border = 'none';
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // Line items state
  let lineItems = [
    { desc: 'Web Application Design & Full-Stack Development', qty: 1, rate: 35000 },
    { desc: 'Cloud Infrastructure & Performance Tuning', qty: 1, rate: 10000 }
  ];

  function renderLineItems() {
    lineItemsTbody.innerHTML = '';

    lineItems.forEach((item, index) => {
      const tr = document.createElement('tr');
      const lineTotal = (item.qty || 0) * (item.rate || 0);

      tr.innerHTML = `
        <td>
          <input type="text" class="inv-input item-desc" value="${escapeHtml(item.desc)}" placeholder="Item or service description">
        </td>
        <td style="text-align: center;">
          <input type="number" class="inv-input item-qty" value="${item.qty}" min="0" step="any" style="text-align: center;">
        </td>
        <td style="text-align: right;">
          <input type="number" class="inv-input item-rate" value="${item.rate}" min="0" step="any" style="text-align: right;">
        </td>
        <td style="text-align: right; font-weight: 700; padding-top: 0.75rem;">
          <span class="item-total-val">${formatMoney(lineTotal)}</span>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-del-item" data-index="${index}" title="Remove Item">&times;</button>
        </td>
      `;

      // Listeners
      const descInput = tr.querySelector('.item-desc');
      const qtyInput = tr.querySelector('.item-qty');
      const rateInput = tr.querySelector('.item-rate');
      const delBtn = tr.querySelector('.btn-del-item');

      descInput.addEventListener('input', (e) => {
        item.desc = e.target.value;
      });

      qtyInput.addEventListener('input', (e) => {
        item.qty = parseFloat(e.target.value) || 0;
        calculateTotals();
      });

      rateInput.addEventListener('input', (e) => {
        item.rate = parseFloat(e.target.value) || 0;
        calculateTotals();
      });

      delBtn.addEventListener('click', () => {
        if (lineItems.length > 1) {
          lineItems.splice(index, 1);
          renderLineItems();
          calculateTotals();
        } else {
          alert('An invoice must contain at least one line item.');
        }
      });

      lineItemsTbody.appendChild(tr);
    });

    calculateTotals();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  btnAddLineItem.addEventListener('click', () => {
    lineItems.push({ desc: '', qty: 1, rate: 0 });
    renderLineItems();
  });

  // Calculate Totals
  function calculateTotals() {
    let subtotal = 0;

    // Update individual row total cells
    const rows = lineItemsTbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      const item = lineItems[i];
      if (item) {
        const itemTot = (item.qty || 0) * (item.rate || 0);
        subtotal += itemTot;
        const totalSpan = row.querySelector('.item-total-val');
        if (totalSpan) totalSpan.textContent = formatMoney(itemTot);
      }
    });

    const discRate = Math.max(0, Math.min(100, parseFloat(discountPct.value) || 0));
    const discountAmount = (subtotal * discRate) / 100;
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    const taxRate = Math.max(0, parseFloat(taxPct.value) || 0);
    const taxAmount = (taxableAmount * taxRate) / 100;

    const shipping = Math.max(0, parseFloat(shippingFee.value) || 0);

    const grandTotal = taxableAmount + taxAmount + shipping;

    totSubtotal.textContent = formatMoney(subtotal);
    totDiscount.textContent = `-${formatMoney(discountAmount)}`;
    totTax.textContent = formatMoney(taxAmount);
    totGrandTotal.textContent = formatMoney(grandTotal);
  }

  discountPct.addEventListener('input', calculateTotals);
  taxPct.addEventListener('input', calculateTotals);
  shippingFee.addEventListener('input', calculateTotals);

  // Load Sample Invoice
  btnLoadSample.addEventListener('click', () => {
    document.getElementById('business-name').value = 'Apex Creative Studio';
    document.getElementById('business-address').value = '404 Innovation Hub, Sector 62\nNoida, UP 201301\nbilling@apexcreativestudio.com | GSTIN: 09ABCDE1234F1Z5';
    document.getElementById('client-name').value = 'NextGen Logistics Ltd';
    document.getElementById('client-address').value = '78 Port View Tower\nMumbai, MH 400001\nGSTIN: 27AABCN9876M1Z8';
    document.getElementById('inv-number').value = 'INV-2026-089';

    lineItems = [
      { desc: 'E-Commerce Platform Redesign & UX Prototyping', qty: 1, rate: 45000 },
      { desc: 'Custom Payment Gateway & Inventory API Integration', qty: 1, rate: 22000 },
      { desc: 'Comprehensive Performance Optimization & SEO Audit', qty: 1, rate: 8000 }
    ];

    discountPct.value = '5';
    taxPct.value = '18';
    shippingFee.value = '0';

    renderLineItems();
  });

  // Reset Invoice
  btnReset.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all invoice fields?')) {
      document.getElementById('business-name').value = 'Your Company Name';
      document.getElementById('business-address').value = '123 Business Street\nCity, State, ZIP\ncontact@yourbusiness.com';
      document.getElementById('client-name').value = 'Client Name';
      document.getElementById('client-address').value = 'Client Street Address\nCity, State, Country';
      document.getElementById('inv-number').value = 'INV-2026-001';
      invDate.value = todayStr;
      invDueDate.value = dueDateStr;

      lineItems = [{ desc: 'Professional Services', qty: 1, rate: 1000 }];
      discountPct.value = '0';
      taxPct.value = '18';
      shippingFee.value = '0';

      renderLineItems();
    }
  });

  // Print / Save PDF
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Initial render
  renderLineItems();
})();
