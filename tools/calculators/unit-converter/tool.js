/**
 * EcrioX Unit Converter
 * Multi-category conversion engine for length, weight, temperature, and data.
 */

(function () {
  'use strict';

  const valFrom = document.getElementById('valFrom');
  const valTo = document.getElementById('valTo');
  const selUnitFrom = document.getElementById('selUnitFrom');
  const selUnitTo = document.getElementById('selUnitTo');
  const btnSwap = document.getElementById('btnSwap');
  const lblFormula = document.getElementById('lblFormula');
  const tabs = document.querySelectorAll('.tab-unit');

  let currentCat = 'length';

  // Unit definitions and conversions relative to base unit
  const UNITS = {
    length: {
      base: 'm',
      items: [
        { id: 'm', name: 'Meters (m)', factor: 1 },
        { id: 'km', name: 'Kilometers (km)', factor: 1000 },
        { id: 'cm', name: 'Centimeters (cm)', factor: 0.01 },
        { id: 'mm', name: 'Millimeters (mm)', factor: 0.001 },
        { id: 'mi', name: 'Miles (mi)', factor: 1609.344 },
        { id: 'yd', name: 'Yards (yd)', factor: 0.9144 },
        { id: 'ft', name: 'Feet (ft)', factor: 0.3048 },
        { id: 'in', name: 'Inches (in)', factor: 0.0254 }
      ],
      defaultFrom: 'm',
      defaultTo: 'ft'
    },
    weight: {
      base: 'kg',
      items: [
        { id: 'kg', name: 'Kilograms (kg)', factor: 1 },
        { id: 'g', name: 'Grams (g)', factor: 0.001 },
        { id: 'mg', name: 'Milligrams (mg)', factor: 0.000001 },
        { id: 'lb', name: 'Pounds (lb)', factor: 0.45359237 },
        { id: 'oz', name: 'Ounces (oz)', factor: 0.028349523125 }
      ],
      defaultFrom: 'kg',
      defaultTo: 'lb'
    },
    temperature: {
      items: [
        { id: 'c', name: 'Celsius (°C)' },
        { id: 'f', name: 'Fahrenheit (°F)' },
        { id: 'k', name: 'Kelvin (K)' }
      ],
      defaultFrom: 'c',
      defaultTo: 'f'
    },
    data: {
      base: 'b',
      items: [
        { id: 'b', name: 'Bytes (B)', factor: 1 },
        { id: 'kb', name: 'Kilobytes (KB)', factor: 1024 },
        { id: 'mb', name: 'Megabytes (MB)', factor: 1048576 },
        { id: 'gb', name: 'Gigabytes (GB)', factor: 1073741824 },
        { id: 'tb', name: 'Terabytes (TB)', factor: 1099511627776 }
      ],
      defaultFrom: 'mb',
      defaultTo: 'gb'
    }
  };

  function populateDropdowns(category) {
    const catData = UNITS[category];
    const opts = catData.items.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    selUnitFrom.innerHTML = opts;
    selUnitTo.innerHTML = opts;

    selUnitFrom.value = catData.defaultFrom;
    selUnitTo.value = catData.defaultTo;
  }

  function convertTemp(val, from, to) {
    if (from === to) return val;
    // Normalize to Celsius
    let c = val;
    if (from === 'f') c = (val - 32) * (5 / 9);
    else if (from === 'k') c = val - 273.15;

    // Convert Celsius to target
    if (to === 'c') return c;
    if (to === 'f') return (c * (9 / 5)) + 32;
    if (to === 'k') return c + 273.15;
    return val;
  }

  function convert() {
    const inputVal = parseFloat(valFrom.value);
    if (isNaN(inputVal)) {
      valTo.value = '';
      lblFormula.textContent = '--';
      return;
    }

    const fromUnit = selUnitFrom.value;
    const toUnit = selUnitTo.value;
    let result = 0;

    if (currentCat === 'temperature') {
      result = convertTemp(inputVal, fromUnit, toUnit);
    } else {
      const catData = UNITS[currentCat];
      const fromObj = catData.items.find(u => u.id === fromUnit);
      const toObj = catData.items.find(u => u.id === toUnit);

      if (fromObj && toObj) {
        // Base = input * fromFactor; result = base / toFactor
        const baseVal = inputVal * fromObj.factor;
        result = baseVal / toObj.factor;
      }
    }

    // Format clean output
    const formatted = parseFloat(result.toFixed(6));
    valTo.value = formatted;

    // Formula label
    const fromName = selUnitFrom.options[selUnitFrom.selectedIndex].text;
    const toName = selUnitTo.options[selUnitTo.selectedIndex].text;
    lblFormula.textContent = `${inputVal} ${fromName} = ${formatted} ${toName}`;
  }

  function setCategory(cat) {
    currentCat = cat;
    tabs.forEach(t => {
      if (t.getAttribute('data-cat') === cat) {
        t.className = 'btn btn-sm btn-primary tab-unit';
      } else {
        t.className = 'btn btn-sm btn-secondary tab-unit';
      }
    });

    populateDropdowns(cat);
    convert();
  }

  // Event Listeners
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      setCategory(t.getAttribute('data-cat'));
    });
  });

  valFrom.addEventListener('input', convert);
  selUnitFrom.addEventListener('change', convert);
  selUnitTo.addEventListener('change', convert);

  btnSwap.addEventListener('click', () => {
    const temp = selUnitFrom.value;
    selUnitFrom.value = selUnitTo.value;
    selUnitTo.value = temp;
    convert();
  });

  // Init
  setCategory('length');
})();
