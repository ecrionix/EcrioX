/**
 * EcrioX Markdown to HTML Compiler
 * Real-time parser supporting headers, lists, code, quotes, and links.
 */

(function () {
  'use strict';

  const txtMarkdown = document.getElementById('txtMarkdown');
  const previewContainer = document.getElementById('previewContainer');
  const rawHtmlContainer = document.getElementById('rawHtmlContainer');
  const statWords = document.getElementById('statWords');
  const statOutputInfo = document.getElementById('statOutputInfo');

  const btnSample = document.getElementById('btnSample');
  const btnClear = document.getElementById('btnClear');
  const btnViewRendered = document.getElementById('btnViewRendered');
  const btnViewCode = document.getElementById('btnViewCode');
  const btnCopy = document.getElementById('btnCopy');
  const btnDownload = document.getElementById('btnDownload');
  const lblOutputTitle = document.getElementById('lblOutputTitle');

  let activeView = 'rendered'; // 'rendered' or 'code'

  function parseMarkdown(md) {
    if (!md) return '';

    let html = md;

    // Preserve code blocks before parsing
    const codeBlocks = [];
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (match, lang, code) {
      const id = `__CODEBLOCK_${codeBlocks.length}__`;
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlocks.push(`<pre><code class="language-${lang}">${escapedCode}</code></pre>`);
      return id;
    });

    // Inline code
    const inlineCodes = [];
    html = html.replace(/`([^`]+)`/g, function (match, code) {
      const id = `__INLINECODE_${inlineCodes.length}__`;
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      inlineCodes.push(`<code>${escapedCode}</code>`);
      return id;
    });

    // Horizontal Rules
    html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>');

    // Headers
    html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold, Italic, Strikethrough
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Images & Links
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Unordered Lists
    html = html.replace(/^\s*[-*+]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)\n(?!\s*<li>)/g, '<ul>$1</ul>\n');

    // Ordered Lists
    html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<oli>$1</oli>');
    html = html.replace(/(<oli>.*<\/oli>)/g, function (match) {
      return '<ol>' + match.replace(/<\/?oli>/g, function (tag) {
        return tag === '<oli>' ? '<li>' : '</li>';
      }) + '</ol>';
    });

    // Paragraphs for remaining text blocks
    const lines = html.split(/\n\n+/);
    html = lines.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(?:h[1-6]|ul|ol|pre|blockquote|hr|img)/i.test(trimmed) || trimmed.startsWith('__CODEBLOCK_')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('\n\n');

    // Restore Code Blocks
    codeBlocks.forEach((block, idx) => {
      html = html.replace(`__CODEBLOCK_${idx}__`, block);
    });

    // Restore Inline Code
    inlineCodes.forEach((block, idx) => {
      html = html.replace(`__INLINECODE_${idx}__`, block);
    });

    return html;
  }

  function compile() {
    const md = txtMarkdown.value;
    const html = parseMarkdown(md);

    previewContainer.innerHTML = html;
    rawHtmlContainer.value = html;

    // Word counter
    const words = md.trim() ? md.trim().split(/\s+/).length : 0;
    statWords.textContent = `${words.toLocaleString()} word${words === 1 ? '' : 's'}`;
    statOutputInfo.textContent = `${html.length.toLocaleString()} HTML characters`;
  }

  function setView(view) {
    activeView = view;
    if (view === 'rendered') {
      btnViewRendered.classList.add('active');
      btnViewCode.classList.remove('active');
      previewContainer.style.display = 'block';
      rawHtmlContainer.style.display = 'none';
      lblOutputTitle.textContent = 'Visual Preview';
    } else {
      btnViewCode.classList.add('active');
      btnViewRendered.classList.remove('active');
      previewContainer.style.display = 'none';
      rawHtmlContainer.style.display = 'block';
      lblOutputTitle.textContent = 'Raw HTML Output';
    }
  }

  // Event Listeners
  txtMarkdown.addEventListener('input', compile);
  btnViewRendered.addEventListener('click', () => setView('rendered'));
  btnViewCode.addEventListener('click', () => setView('code'));

  btnSample.addEventListener('click', () => {
    txtMarkdown.value = `# Welcome to EcrioX

> One Platform. Endless Possibilities.

This is a demonstration of our **in-browser Markdown converter**.

### Key Advantages:
- Fast and **100% private** client-side parsing.
- Supports \`inline code\` and multi-line fenced code blocks.
- Real-time synchronized visual preview.

\`\`\`javascript
function greet(user) {
  console.log("Hello, " + user + "! Welcome to EcrioX.");
}
greet("World");
\`\`\`

Visit the [EcrioX All Tools Directory](https://ecriox.com/tools/) to explore more tools!`;
    compile();
  });

  btnClear.addEventListener('click', () => {
    txtMarkdown.value = '';
    compile();
    txtMarkdown.focus();
  });

  btnCopy.addEventListener('click', () => {
    const html = rawHtmlContainer.value;
    if (!html) {
      if (window.EcrioXApp) EcrioXApp.showToast('No HTML to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(html).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('HTML copied to clipboard!');
    }).catch(() => {
      rawHtmlContainer.select();
      document.execCommand('copy');
      if (window.EcrioXApp) EcrioXApp.showToast('Copied HTML!', 'success');
    });
  });

  btnDownload.addEventListener('click', () => {
    const html = rawHtmlContainer.value;
    if (!html) {
      if (window.EcrioXApp) EcrioXApp.showToast('No content to download', 'error');
      return;
    }
    const fullDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compiled Markdown</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
    pre { background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { font-family: monospace; background: rgba(0,0,0,0.06); padding: 0.2rem 0.4rem; border-radius: 4px; }
    pre code { background: transparent; }
    blockquote { border-left: 3px solid #2563eb; padding-left: 1rem; color: #64748b; font-style: italic; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'document.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    if (window.EcrioXApp) EcrioXApp.showToast('Downloaded document.html');
  });

  // Init with sample
  btnSample.click();
})();
