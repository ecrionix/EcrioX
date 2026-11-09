/**
 * EcrioX PDF to Word Converter
 * 100% Client-Side PDF Parsing & DOCX Generation
 * Powered by PDF.js & DOCX.js
 */

(function () {
  'use strict';

  // Configure PDF.js Worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  const progressCard = document.getElementById('progress-card');
  const step1 = document.getElementById('step-1');
  const step2 = document.getElementById('step-2');
  const step3 = document.getElementById('step-3');
  const progressStatus = document.getElementById('progress-status');
  const progressPercent = document.getElementById('progress-percent');
  const progressFill = document.getElementById('progress-fill');
  const progressDetails = document.getElementById('progress-details');

  const resultCard = document.getElementById('result-card');
  const resultFilename = document.getElementById('result-filename');
  const scannedWarning = document.getElementById('scanned-warning');
  const statPages = document.getElementById('stat-pages');
  const statWords = document.getElementById('stat-words');
  const statHeadings = document.getElementById('stat-headings');
  const docPreview = document.getElementById('doc-preview');

  const btnConvertAnother = document.getElementById('btn-convert-another');
  const btnDownloadDocx = document.getElementById('btn-download-docx');

  // State
  let currentFile = null;
  let convertedBlob = null;
  let outputFilename = 'converted-document.docx';

  // Event Listeners
  initEvents();

  function initEvents() {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
      fileInput.value = '';
    });

    btnConvertAnother.addEventListener('click', resetConverter);
    btnDownloadDocx.addEventListener('click', triggerDownload);

    // Check URL transfer parameter from homepage hero
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('transfer') === '1' && window.EcrioXHeroTransfer) {
      window.EcrioXHeroTransfer.getStoredFiles().then((transferredFiles) => {
        if (transferredFiles && transferredFiles.length > 0) {
          handleFileSelection(transferredFiles[0]);
          try {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (e) {}
        }
      });
    }
  }

  /**
   * Handle uploaded PDF file
   */
  async function handleFileSelection(file) {
    if (!file || file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a valid PDF document (.pdf).');
      return;
    }

    currentFile = file;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    outputFilename = `${baseName}.docx`;

    // Switch view to progress
    dropzone.style.display = 'none';
    resultCard.style.display = 'none';
    progressCard.style.display = 'block';

    setStep(1);
    updateProgress('Reading PDF document structure...', 10, `Loading ${file.name} (${formatBytes(file.size)})`);

    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);

      // 1. Load document with PDF.js
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      setStep(2);
      updateProgress(`Extracting content from ${totalPages} pages...`, 25, 'Analyzing text streams & spatial layout');

      let allPageStructures = [];
      let totalWordCount = 0;
      let totalHeadingsCount = 0;
      const fontSizeCounts = {};

      // 2. Process each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageLines = groupItemsIntoLines(textContent.items);

        // Record font sizes for statistical mode calculation
        pageLines.forEach(l => {
          fontSizeCounts[l.fontSize] = (fontSizeCounts[l.fontSize] || 0) + 1;
        });

        allPageStructures.push({
          pageNumber: pageNum,
          lines: pageLines
        });

        // Update progress bar incrementally
        const pct = Math.round(25 + ((pageNum / totalPages) * 45));
        updateProgress(`Extracting page ${pageNum} of ${totalPages}...`, pct, `Parsed ${pageLines.length} text lines`);
      }

      // Determine document body font size (statistical mode)
      let bodyFontSize = 11;
      let maxFreq = 0;
      for (const [sizeStr, count] of Object.entries(fontSizeCounts)) {
        if (count > maxFreq) {
          maxFreq = count;
          bodyFontSize = parseFloat(sizeStr);
        }
      }

      setStep(3);
      updateProgress('Building Microsoft Word (.docx) document...', 80, 'Compiling Open XML WordprocessingML paragraphs & headings');

      // 3. Construct DOCX Elements & Preview Elements
      const docxChildren = [];
      const previewHtml = [];

      allPageStructures.forEach((pageStruct, pIdx) => {
        if (pIdx > 0) {
          previewHtml.push(`<div class="doc-page-marker">Page ${pageStruct.pageNumber}</div>`);
        }

        let currentParagraphRuns = [];
        let currentParagraphType = 'normal'; // 'normal' | 'h1' | 'h2' | 'bullet'
        let lastLineY = null;

        pageStruct.lines.forEach((line) => {
          const lineText = line.items.map(it => it.text).join(' ').trim();
          if (!lineText) return;

          const words = lineText.split(/\s+/).filter(Boolean);
          totalWordCount += words.length;

          // Determine line semantic role
          let lineType = 'normal';
          if (line.fontSize >= bodyFontSize * 1.55 && lineText.length < 120) {
            lineType = 'h1';
            totalHeadingsCount++;
          } else if (line.fontSize >= bodyFontSize * 1.25 && lineText.length < 140) {
            lineType = 'h2';
            totalHeadingsCount++;
          } else if (/^[•\-\*\u2022]\s+/.test(lineText)) {
            lineType = 'bullet';
          }

          // Check if this line should start a new paragraph (large vertical gap or heading change)
          const isLargeGap = lastLineY !== null && Math.abs(lastLineY - line.y) > (line.fontSize * 1.8);
          const typeChanged = lineType !== 'normal' || currentParagraphType !== 'normal';

          if (currentParagraphRuns.length > 0 && (isLargeGap || typeChanged)) {
            flushParagraph(docxChildren, currentParagraphRuns, currentParagraphType);
            currentParagraphRuns = [];
          }

          currentParagraphType = lineType;
          lastLineY = line.y;

          // Build Text Runs for this line
          line.items.forEach((item, itemIdx) => {
            let runText = item.text;
            if (itemIdx > 0 && !runText.startsWith(' ')) {
              runText = ' ' + runText;
            }

            currentParagraphRuns.push(new window.docx.TextRun({
              text: runText,
              bold: item.bold,
              italics: item.italic,
              size: Math.max(16, Math.min(64, Math.round(item.fontSize * 2))) // docx uses half-points
            }));
          });

          // Append to UI Preview HTML
          if (lineType === 'h1') {
            previewHtml.push(`<h2>${escapeHtml(lineText)}</h2>`);
          } else if (lineType === 'h2') {
            previewHtml.push(`<h3>${escapeHtml(lineText)}</h3>`);
          } else {
            previewHtml.push(`<p>${escapeHtml(lineText)}</p>`);
          }
        });

        // Flush remaining paragraph on this page
        if (currentParagraphRuns.length > 0) {
          flushParagraph(docxChildren, currentParagraphRuns, currentParagraphType);
        }

        // Add page break if more pages remain
        if (pIdx < allPageStructures.length - 1) {
          docxChildren.push(new window.docx.Paragraph({
            children: [new window.docx.PageBreak()]
          }));
        }
      });

      // 4. Create and pack docx Document
      updateProgress('Finalizing document packaging...', 95, 'Writing ZIP archive & XML schemas');

      const doc = new window.docx.Document({
        sections: [{
          properties: {},
          children: docxChildren
        }]
      });

      convertedBlob = await window.docx.Packer.toBlob(doc);

      updateProgress('Conversion complete!', 100, 'Your file is ready');

      // 5. Update UI with Results
      setTimeout(() => {
        progressCard.style.display = 'none';
        resultCard.style.display = 'block';

        resultFilename.textContent = `${outputFilename} (${formatBytes(convertedBlob.size)})`;
        statPages.textContent = totalPages;
        statWords.textContent = totalWordCount.toLocaleString();
        statHeadings.textContent = totalHeadingsCount;

        if (previewHtml.length > 0) {
          docPreview.innerHTML = previewHtml.slice(0, 150).join('');
          if (previewHtml.length > 150) {
            docPreview.innerHTML += `<p style="color: var(--text-subtle); font-style: italic;">... [Showing first 150 paragraphs; full document contains all ${previewHtml.length} elements]</p>`;
          }
        } else {
          docPreview.innerHTML = '<p style="color: var(--text-subtle); font-style: italic;">No text preview available.</p>';
        }

        // Check if scanned document
        if (totalWordCount < 20) {
          scannedWarning.style.display = 'block';
        } else {
          scannedWarning.style.display = 'none';
        }
      }, 400);

    } catch (err) {
      console.error('Conversion error:', err);
      progressStatus.textContent = 'Conversion encountered an error.';
      progressStatus.style.color = 'var(--color-danger)';
      progressDetails.textContent = err.message || 'Please check that the file is not corrupted or password protected.';
      
      setTimeout(() => {
        dropzone.style.display = 'block';
        progressCard.style.display = 'none';
      }, 3500);
    }
  }

  /**
   * Flush runs into docx Paragraph with appropriate heading style
   */
  function flushParagraph(childrenArray, textRuns, type) {
    if (textRuns.length === 0) return;

    let headingLevel = undefined;
    if (type === 'h1') headingLevel = window.docx.HeadingLevel.HEADING_1;
    if (type === 'h2') headingLevel = window.docx.HeadingLevel.HEADING_2;

    childrenArray.push(new window.docx.Paragraph({
      children: textRuns,
      heading: headingLevel,
      spacing: {
        after: headingLevel ? 160 : 120
      }
    }));
  }

  /**
   * Group PDF text items into lines by Y position
   */
  function groupItemsIntoLines(items) {
    const validItems = items.filter(it => it.str && it.str.trim().length > 0);

    // Sort items top-to-bottom (Y descending), then left-to-right (X ascending)
    validItems.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      const yDiff = yB - yA;
      if (Math.abs(yDiff) > 4) {
        return yDiff;
      }
      return a.transform[4] - b.transform[4];
    });

    const lines = [];
    let currentLine = null;

    validItems.forEach((it) => {
      const y = it.transform[5];
      const x = it.transform[4];
      const fontSize = Math.round(Math.abs(it.transform[0] || it.height || 11));
      const fontName = (it.fontName || '').toLowerCase();
      const isBold = /bold|heavy|black/i.test(fontName);
      const isItalic = /italic|oblique/i.test(fontName);

      if (!currentLine || Math.abs(currentLine.y - y) > 4) {
        currentLine = {
          y: y,
          fontSize: fontSize,
          items: [{
            text: it.str,
            x: x,
            fontSize: fontSize,
            bold: isBold,
            italic: isItalic
          }]
        };
        lines.push(currentLine);
      } else {
        currentLine.items.push({
          text: it.str,
          x: x,
          fontSize: fontSize,
          bold: isBold,
          italic: isItalic
        });
        if (fontSize > currentLine.fontSize) {
          currentLine.fontSize = fontSize;
        }
      }
    });

    return lines;
  }

  /**
   * Trigger download of converted DOCX
   */
  function triggerDownload() {
    if (!convertedBlob) return;
    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Reset converter back to initial state
   */
  function resetConverter() {
    resultCard.style.display = 'none';
    progressCard.style.display = 'none';
    dropzone.style.display = 'block';
    fileInput.value = '';
    currentFile = null;
    convertedBlob = null;
    scannedWarning.style.display = 'none';
    docPreview.innerHTML = '';
  }

  /**
   * Update Progress UI helper
   */
  function updateProgress(status, percent, details) {
    progressStatus.textContent = status;
    progressPercent.textContent = percent + '%';
    progressFill.style.width = percent + '%';
    if (details) progressDetails.textContent = details;
  }

  function setStep(stepNum) {
    step1.className = 'step-item' + (stepNum === 1 ? ' active' : (stepNum > 1 ? ' done' : ''));
    step2.className = 'step-item' + (stepNum === 2 ? ' active' : (stepNum > 2 ? ' done' : ''));
    step3.className = 'step-item' + (stepNum === 3 ? ' active' : (stepNum > 3 ? ' done' : ''));
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
