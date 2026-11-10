/**
 * EcrioX Lorem Ipsum Dummy Text Generator
 * Produces authentic classical Latin placeholder text in paragraphs, sentences, or words.
 */

(function () {
  'use strict';

  const numCount = document.getElementById('numCount');
  const selType = document.getElementById('selType');
  const chkStartLorem = document.getElementById('chkStartLorem');
  const chkHtmlTags = document.getElementById('chkHtmlTags');
  const btnRegenerate = document.getElementById('btnRegenerate');
  const btnCopy = document.getElementById('btnCopy');
  const btnDownload = document.getElementById('btnDownload');
  const txtOutput = document.getElementById('txtLoremOutput');
  const statInfo = document.getElementById('statInfo');

  const WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip',
    'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat',
    'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est',
    'laborum', 'curabitur', 'pretium', 'tincidunt', 'lacus', 'nulla', 'gravida', 'orci', 'a', 'odio',
    'nullam', 'varius', 'turpis', 'et', 'commodo', 'pharetra', 'est', 'eros', 'bibendum', 'elit',
    'nec', 'luctus', 'magna', 'felis', 'sollicitudin', 'mauris', 'integer', 'in', 'mauris', 'eu',
    'nibh', 'euismod', 'gravida', 'duis', 'ac', 'tellus', 'et', 'risus', 'vulputate', 'vehicula'
  ];

  function getRandomWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function generateSentence(isFirst) {
    const len = Math.floor(Math.random() * 10) + 8; // 8-17 words
    const sentenceWords = [];

    if (isFirst && chkStartLorem.checked) {
      sentenceWords.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet,', 'consectetur', 'adipiscing', 'elit');
    } else {
      for (let i = 0; i < len; i++) {
        let w = getRandomWord();
        if (i === 0) {
          w = w.charAt(0).toUpperCase() + w.slice(1);
        }
        sentenceWords.push(w);
      }
    }

    return sentenceWords.join(' ') + '.';
  }

  function generateParagraph(isFirst) {
    const sentenceCount = Math.floor(Math.random() * 4) + 4; // 4-7 sentences
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence(isFirst && i === 0));
    }
    return sentences.join(' ');
  }

  function generate() {
    let count = parseInt(numCount.value, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 500) count = 500;

    const type = selType.value;
    const wrapTags = chkHtmlTags.checked;
    let output = '';

    if (type === 'paragraphs') {
      const paras = [];
      for (let i = 0; i < count; i++) {
        const p = generateParagraph(i === 0);
        paras.push(wrapTags ? `<p>${p}</p>` : p);
      }
      output = paras.join('\n\n');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence(i === 0));
      }
      output = wrapTags ? sentences.map(s => `<p>${s}</p>`).join('\n') : sentences.join(' ');
    } else if (type === 'words') {
      const words = [];
      if (chkStartLorem.checked) {
        const standard = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
        for (let i = 0; i < Math.min(count, standard.length); i++) {
          words.push(standard[i]);
        }
      }
      while (words.length < count) {
        words.push(getRandomWord());
      }
      output = wrapTags ? `<p>${words.join(' ')}</p>` : words.join(' ');
    }

    txtOutput.value = output;

    // Stats
    const wordsClean = output.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean);
    const wordCount = wordsClean.length;
    const charCount = output.length;
    statInfo.textContent = `${wordCount.toLocaleString()} words | ${charCount.toLocaleString()} characters`;
  }

  // Event Listeners
  btnRegenerate.addEventListener('click', generate);
  numCount.addEventListener('input', generate);
  selType.addEventListener('change', generate);
  chkStartLorem.addEventListener('change', generate);
  chkHtmlTags.addEventListener('change', generate);

  btnCopy.addEventListener('click', () => {
    if (!txtOutput.value) return;
    navigator.clipboard.writeText(txtOutput.value).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Lorem Ipsum copied to clipboard!');
    }).catch(() => {
      txtOutput.select();
      document.execCommand('copy');
      if (window.EcrioXApp) EcrioXApp.showToast('Copied!', 'success');
    });
  });

  btnDownload.addEventListener('click', () => {
    if (!txtOutput.value) return;
    const isHtml = chkHtmlTags.checked;
    const filename = isHtml ? 'lorem-ipsum.html' : 'lorem-ipsum.txt';
    const mime = isHtml ? 'text/html' : 'text/plain';
    const blob = new Blob([txtOutput.value], { type: `${mime};charset=utf-8` });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    if (window.EcrioXApp) EcrioXApp.showToast(`Downloaded ${filename}`);
  });

  document.querySelectorAll('.quick-lorem').forEach(btn => {
    btn.addEventListener('click', () => {
      numCount.value = btn.dataset.count;
      selType.value = btn.dataset.type;
      generate();
      if (window.EcrioXApp) EcrioXApp.showToast(`Generated ${btn.textContent}!`);
    });
  });

  // Init
  generate();
})();
