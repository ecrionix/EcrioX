/**
 * EcrioX CSV to JSON & JSON to CSV Converter
 * Bidirectional tabular data parser with RFC 4180 compliance.
 */

(function () {
  'use strict';

  const btnModeCsvToJson = document.getElementById('btnModeCsvToJson');
  const btnModeJsonToCsv = document.getElementById('btnModeJsonToCsv');
  const btnSample = document.getElementById('btnSample');
  const btnClear = document.getElementById('btnClear');
  const btnDownload = document.getElementById('btnDownload');
  const btnCopy = document.getElementById('btnCopy');

  const lblInputHeader = document.getElementById('lblInputHeader');
  const lblOutputHeader = document.getElementById('lblOutputHeader');
  const statInputInfo = document.getElementById('statInputInfo');
  const statOutputInfo = document.getElementById('statOutputInfo');

  const txtSource = document.getElementById('txtSource');
  const txtTarget = document.getElementById('txtTarget');

  let mode = 'csv2json'; // 'csv2json' or 'json2csv'

  // Delimiter detection
  function detectDelimiter(text) {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;

    if (tabs > commas && tabs > semicolons) return '\t';
    if (semicolons > commas) return ';';
    return ',';
  }

  // Parse CSV line with quotes support
  function parseCSVLine(text, delimiter) {
    const pattern = new RegExp(
      (
        // Delimiters.
        '(\\' + delimiter + '|\\r?\\n|\\r|^)' +
        // Quoted fields.
        '(?:"([^"]*(?:""[^"]*)*)"|' +
        // Standard fields.
        '([^"\\' + delimiter + '\\r\\n]*))'
      ),
      'gi'
    );

    const rows = [[]];
    let matches = null;

    while ((matches = pattern.exec(text))) {
      const matchedDelimiter = matches[1];
      if (matchedDelimiter.length && matchedDelimiter !== delimiter) {
        rows.push([]);
      }

      let matchedValue;
      if (matches[2] !== undefined) {
        matchedValue = matches[2].replace(/""/g, '"');
      } else {
        matchedValue = matches[3];
      }

      rows[rows.length - 1].push(matchedValue);
    }

    // Filter empty trailing rows
    return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
  }

  function csvToJson(csvText) {
    const delimiter = detectDelimiter(csvText);
    const rows = parseCSVLine(csvText.trim(), delimiter);
    if (!rows.length) return [];

    const headers = rows[0].map(h => (h || '').trim());
    const result = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || (row.length === 1 && !row[0])) continue;

      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j] || `column_${j + 1}`;
        let val = row[j] !== undefined ? row[j] : '';

        // Auto cast numbers and booleans
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val !== '' && !isNaN(val) && !val.includes(' ') && val.length < 16) {
          val = Number(val);
        }

        obj[header] = val;
      }
      result.push(obj);
    }

    return result;
  }

  function jsonToCsv(jsonText) {
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (e) {
      throw new Error('Invalid JSON syntax: ' + e.message);
    }

    if (!Array.isArray(data)) {
      if (typeof data === 'object' && data !== null) {
        data = [data];
      } else {
        throw new Error('JSON root must be an Array of objects.');
      }
    }

    if (data.length === 0) return '';

    // Collect all unique keys
    const keys = [];
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(k => {
          if (!keys.includes(k)) keys.push(k);
        });
      }
    });

    function escapeCSV(val) {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') val = JSON.stringify(val);
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    const lines = [];
    lines.push(keys.map(escapeCSV).join(','));

    data.forEach(item => {
      const row = keys.map(k => escapeCSV(item[k]));
      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  function convert() {
    const input = txtSource.value.trim();
    if (!input) {
      txtTarget.value = '';
      statInputInfo.textContent = '0 lines';
      statOutputInfo.textContent = '0 items';
      return;
    }

    try {
      if (mode === 'csv2json') {
        const jsonResult = csvToJson(input);
        txtTarget.value = JSON.stringify(jsonResult, null, 2);
        statInputInfo.textContent = `${input.split(/\r?\n/).length} lines`;
        statOutputInfo.textContent = `${jsonResult.length} JSON objects`;
      } else {
        const csvResult = jsonToCsv(input);
        txtTarget.value = csvResult;
        statInputInfo.textContent = `${input.length} characters`;
        statOutputInfo.textContent = `${csvResult.split(/\r?\n/).length} CSV lines`;
      }
    } catch (err) {
      txtTarget.value = `Conversion Error:\n${err.message}`;
    }
  }

  function setMode(newMode) {
    mode = newMode;
    if (mode === 'csv2json') {
      btnModeCsvToJson.className = 'btn btn-sm btn-primary';
      btnModeJsonToCsv.className = 'btn btn-sm btn-secondary';
      lblInputHeader.textContent = 'CSV Source Data';
      lblOutputHeader.textContent = 'JSON Output';
      txtSource.placeholder = 'Paste CSV data here with headers in the first row...';
      txtTarget.placeholder = 'JSON array of objects will appear here...';
    } else {
      btnModeJsonToCsv.className = 'btn btn-sm btn-primary';
      btnModeCsvToJson.className = 'btn btn-sm btn-secondary';
      lblInputHeader.textContent = 'JSON Source Data (Array)';
      lblOutputHeader.textContent = 'CSV Output';
      txtSource.placeholder = 'Paste JSON array of objects here...';
      txtTarget.placeholder = 'CSV table will appear here...';
    }
    convert();
  }

  // Event Listeners
  txtSource.addEventListener('input', convert);
  btnModeCsvToJson.addEventListener('click', () => setMode('csv2json'));
  btnModeJsonToCsv.addEventListener('click', () => setMode('json2csv'));

  btnSample.addEventListener('click', () => {
    if (mode === 'csv2json') {
      txtSource.value = `id,name,role,department,active,salary
101,John Doe,Lead Architect,Engineering,true,145000
102,"Smith, Jane",Senior Designer,Product,true,120000
103,Alex Wong,Product Manager,Growth,false,115000
104,"Miller, Robert ""Bob""",DevOps Specialist,Infrastructure,true,130000`;
    } else {
      txtSource.value = JSON.stringify([
        { id: 101, name: "John Doe", role: "Lead Architect", active: true },
        { id: 102, name: "Smith, Jane", role: "Senior Designer", active: true },
        { id: 103, name: "Alex Wong", role: "Product Manager", active: false }
      ], null, 2);
    }
    convert();
  });

  btnClear.addEventListener('click', () => {
    txtSource.value = '';
    txtTarget.value = '';
    statInputInfo.textContent = '0 lines';
    statOutputInfo.textContent = '0 items';
    txtSource.focus();
  });

  btnCopy.addEventListener('click', () => {
    if (!txtTarget.value || txtTarget.value.startsWith('Conversion Error')) {
      if (window.EcrioXApp) EcrioXApp.showToast('No valid output to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(txtTarget.value).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Output copied to clipboard!');
    }).catch(() => {
      txtTarget.select();
      document.execCommand('copy');
      if (window.EcrioXApp) EcrioXApp.showToast('Copied output!', 'success');
    });
  });

  btnDownload.addEventListener('click', () => {
    const content = txtTarget.value;
    if (!content || content.startsWith('Conversion Error')) return;

    const isJson = mode === 'csv2json';
    const filename = isJson ? 'data.json' : 'data.csv';
    const mime = isJson ? 'application/json' : 'text/csv';

    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${filename}`);
  });

  // Init with sample
  btnSample.click();
})();
