/**
 * EcrioX Diwali Card Canvas Engine
 * High-DPI procedural vector rendering for 20 unique Diwali templates,
 * multilingual text layout, photo frame embedding, and Web Share API.
 */

window.DIWALI_ENGINE = (function () {
  'use strict';

  let canvas = null;
  let ctx = null;
  let userPhotoImg = null;

  // Active Card Configuration State
  const state = {
    templateId: 'royal-gold',
    format: 'square', // 'square' (1080x1080), 'story' (1080x1920), 'portrait' (1080x1350)
    width: 1080,
    height: 1080,
    recipient: 'Dear Family & Friends',
    message: 'May the divine light of Diwali illuminate your life with boundless peace, joy, prosperity and good health. Happy Diwali!',
    sender: 'With warm wishes, EcrioX',
    language: 'en',
    fontStyle: 'serif', // 'serif', 'sans', 'traditional', 'script'
    textColor: '#ffd700',
    textAlign: 'center',
    hasPhoto: false
  };

  // Dimensions by format
  const FORMAT_DIMENSIONS = {
    square: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
    portrait: { width: 1080, height: 1350 }
  };

  function init(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    setFormat(state.format);
  }

  function setFormat(fmt) {
    if (!FORMAT_DIMENSIONS[fmt]) fmt = 'square';
    state.format = fmt;
    state.width = FORMAT_DIMENSIONS[fmt].width;
    state.height = FORMAT_DIMENSIONS[fmt].height;

    if (canvas) {
      canvas.width = state.width;
      canvas.height = state.height;
    }
    render();
  }

  function updateState(updates) {
    Object.assign(state, updates);
    if (updates.format && updates.format !== state.format) {
      setFormat(updates.format);
    } else {
      render();
    }
  }

  function getState() {
    return { ...state };
  }

  function setPhoto(file, callback) {
    if (!file) {
      userPhotoImg = null;
      state.hasPhoto = false;
      render();
      if (callback) callback(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        userPhotoImg = img;
        state.hasPhoto = true;
        render();
        if (callback) callback(true);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    userPhotoImg = null;
    state.hasPhoto = false;
    render();
  }

  // Master Render Function
  function render() {
    if (!ctx || !canvas) return;
    const w = state.width;
    const h = state.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    const tmpl = window.DIWALI_DATA.TEMPLATES.find(t => t.id === state.templateId) || window.DIWALI_DATA.TEMPLATES[0];

    // 1. Draw Background
    drawBackground(tmpl, w, h);

    // 2. Draw Decorative Borders & Patterns specific to template
    drawTemplateDecorations(tmpl, w, h);

    // 3. Draw Diya Artwork
    drawDiyaArt(tmpl, w, h);

    // 4. Draw Uploaded Photo Frame (if active)
    let textOffsetTop = 0;
    if (state.hasPhoto && userPhotoImg) {
      textOffsetTop = drawPhotoFrame(w, h);
    }

    // 5. Draw Typography (Title, Recipient, Message, Sender)
    drawCardTypography(tmpl, w, h, textOffsetTop);

    // 6. Draw Subtle Brand Mark
    drawBrandMark(w, h);

    ctx.restore();
  }

  // --- Background Renderer ---
  function drawBackground(tmpl, w, h) {
    const { colors, bgType } = tmpl;

    if (bgType === 'radial') {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, colors.bg2);
      grad.addColorStop(1, colors.bg1);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (bgType === 'solid') {
      ctx.fillStyle = colors.bg1;
      ctx.fillRect(0, 0, w, h);
    } else {
      // Linear gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, colors.bg1);
      grad.addColorStop(1, colors.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Add starry sparkles / light particles
    drawStarfield(w, h);
  }

  function drawStarfield(w, h) {
    ctx.save();
    const seed = 42;
    for (let i = 0; i < 45; i++) {
      const x = ((Math.sin(i * seed) + 1) / 2) * w;
      const y = ((Math.cos(i * seed * 1.5) + 1) / 2) * h;
      const r = ((i % 3) + 1) * 1.2;
      const alpha = (i % 5 + 3) / 10;

      ctx.fillStyle = `rgba(255, 223, 100, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Occasional 4-point sparkle
      if (i % 7 === 0) {
        ctx.strokeStyle = `rgba(255, 235, 150, ${alpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - r * 3, y);
        ctx.lineTo(x + r * 3, y);
        ctx.moveTo(x, y - r * 3);
        ctx.lineTo(x, y + r * 3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // --- Template Specific Decorative Borders ---
  function drawTemplateDecorations(tmpl, w, h) {
    ctx.save();
    const pad = 40;
    const accent = tmpl.colors.accent;

    // Corner Ornament helper
    function drawOrnateCorner(cx, cy, rotation) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;

      // Arc curve
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI / 2);
      ctx.stroke();

      // Little diamond
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(25, 25);
      ctx.lineTo(30, 20);
      ctx.lineTo(35, 25);
      ctx.lineTo(30, 30);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    if (tmpl.borderStyle === 'mandala-ornate' || tmpl.borderStyle === 'mandala-corner') {
      // Golden outer double border
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 12, pad + 12, w - (pad + 12) * 2, h - (pad + 12) * 2);

      // Ornate corners
      drawOrnateCorner(pad + 12, pad + 12, 0);
      drawOrnateCorner(w - pad - 12, pad + 12, Math.PI / 2);
      drawOrnateCorner(w - pad - 12, h - pad - 12, Math.PI);
      drawOrnateCorner(pad + 12, h - pad - 12, -Math.PI / 2);

      // Top center mandala header arc
      drawTopMandala(w / 2, pad + 12, accent);
    } else if (tmpl.borderStyle === 'geometric-art-deco') {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.strokeRect(pad + 16, pad + 16, w - (pad + 16) * 2, h - (pad + 16) * 2);

      // Art deco corner brackets
      const corners = [
        [pad, pad, 1, 1],
        [w - pad, pad, -1, 1],
        [w - pad, h - pad, -1, -1],
        [pad, h - pad, 1, -1]
      ];
      corners.forEach(([cx, cy, sx, sy]) => {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + sx * 45, cy);
        ctx.lineTo(cx + sx * 45, cy + sy * 6);
        ctx.lineTo(cx + sx * 6, cy + sy * 6);
        ctx.lineTo(cx + sx * 6, cy + sy * 45);
        ctx.lineTo(cx, cy + sy * 45);
        ctx.closePath();
        ctx.fill();
      });
    } else if (tmpl.borderStyle === 'marigold-toran') {
      // Warm marigold garland on top
      drawMarigoldGarland(w, pad + 15);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad + 35, w - pad * 2, h - pad * 2 - 35);
    } else if (tmpl.borderStyle === 'temple-gopuram') {
      // South Indian Temple Gopuram top silhouette
      drawGopuramHeader(w / 2, pad + 20, accent);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(pad, pad + 50, w - pad * 2, h - pad * 2 - 50);
    } else if (tmpl.borderStyle === 'circuit-neon') {
      // Cyberpunk glowing borders
      ctx.shadowColor = tmpl.colors.accent;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = tmpl.colors.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

      // Circuit nodes
      ctx.fillStyle = tmpl.colors.secondary;
      ctx.fillRect(pad - 4, pad + 100, 8, 8);
      ctx.fillRect(w - pad - 4, pad + 100, 8, 8);
      ctx.fillRect(w / 2 - 4, pad - 4, 8, 8);
      ctx.shadowBlur = 0;
    } else {
      // Default clean elegant festive border
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 10, pad + 10, w - (pad + 10) * 2, h - (pad + 10) * 2);
    }

    ctx.restore();
  }

  function drawTopMandala(cx, cy, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.lineWidth = 1.5;

    // Semi-circle mandala radiating downward
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI);
    ctx.stroke();
    ctx.fill();

    for (let angle = 0; angle <= Math.PI; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 45, Math.sin(angle) * 45);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMarigoldGarland(w, y) {
    ctx.save();
    const count = 18;
    const step = (w - 100) / count;
    for (let i = 0; i <= count; i++) {
      const cx = 50 + i * step;
      const cy = y + Math.sin((i / count) * Math.PI) * 15;

      // Orange marigold flower
      ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();

      // Yellow center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGopuramHeader(cx, cy, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 30, cy + 30);
    ctx.lineTo(cx - 50, cy + 45);
    ctx.lineTo(cx + 50, cy + 45);
    ctx.lineTo(cx + 30, cy + 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- Diya Artwork Renderer ---
  function drawDiyaArt(tmpl, w, h) {
    ctx.save();
    const accent = tmpl.colors.accent;

    if (tmpl.diyaStyle === 'nilavilakku-lamp') {
      // Tall traditional brass Kerala lamp
      drawNilavilakku(w / 2, h - 170, 1.1);
    } else if (tmpl.diyaStyle === 'row-of-diyas') {
      // Multiple glowing diyas across bottom
      const count = 5;
      const startX = w * 0.2;
      const endX = w * 0.8;
      const step = (endX - startX) / (count - 1);
      for (let i = 0; i < count; i++) {
        const x = startX + i * step;
        const scale = i === 2 ? 0.9 : 0.7;
        drawSingleEarthenDiya(x, h - 140, scale);
      }
    } else if (tmpl.diyaStyle === 'kuthu-vilakku') {
      // Traditional Tamil brass lamp
      drawKuthuVilakku(w / 2, h - 180, 1.0);
    } else if (tmpl.diyaStyle === 'hologram-diya') {
      // Cyberpunk glowing vector diya
      drawNeonDiya(w / 2, h - 150, 1.1, accent);
    } else {
      // Default majestic central glowing earthen/golden diya
      const diyaY = state.hasPhoto ? h - 130 : h - 150;
      const diyaScale = state.hasPhoto ? 0.85 : 1.15;
      drawSingleEarthenDiya(w / 2, diyaY, diyaScale);
    }

    ctx.restore();
  }

  function drawSingleEarthenDiya(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // 1. Ambient Glow behind flame
    const glow = ctx.createRadialGradient(0, -35, 10, 0, -35, 90);
    glow.addColorStop(0, 'rgba(255, 190, 0, 0.7)');
    glow.addColorStop(0.5, 'rgba(255, 100, 0, 0.25)');
    glow.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -35, 90, 0, Math.PI * 2);
    ctx.fill();

    // 2. Diya Base (Terracotta/Brass bowl)
    const baseGrad = ctx.createLinearGradient(0, 0, 0, 45);
    baseGrad.addColorStop(0, '#c2410c');
    baseGrad.addColorStop(0.5, '#7c2d12');
    baseGrad.addColorStop(1, '#431407');

    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.moveTo(-55, 0);
    ctx.quadraticCurveTo(0, 50, 55, 0);
    ctx.quadraticCurveTo(0, 12, -55, 0);
    ctx.closePath();
    ctx.fill();

    // Diya Rim highlight
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-55, 0);
    ctx.quadraticCurveTo(0, 14, 55, 0);
    ctx.stroke();

    // 3. Flame (Outer gold, inner white/amber core)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.bezierCurveTo(-22, -15, -18, -48, 0, -75);
    ctx.bezierCurveTo(18, -48, 22, -15, 0, 2);
    ctx.closePath();
    ctx.fill();

    // Inner bright white/yellow core
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.bezierCurveTo(-10, -15, -8, -40, 0, -62);
    ctx.bezierCurveTo(8, -40, 10, -15, 0, -2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawNilavilakku(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Brass stem
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-8, -40, 16, 70);

    // Base circular pedestal
    ctx.beginPath();
    ctx.ellipse(0, 30, 40, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top oil tray
    ctx.beginPath();
    ctx.ellipse(0, -40, 50, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crown / finial
    ctx.beginPath();
    ctx.moveTo(0, -65);
    ctx.lineTo(-8, -40);
    ctx.lineTo(8, -40);
    ctx.closePath();
    ctx.fill();

    // 3 Wicks burning
    [-30, 0, 30].forEach(ox => {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ox, -55, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(ox, -56, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawKuthuVilakku(cx, cy, scale) {
    drawNilavilakku(cx, cy, scale);
  }

  function drawNeonDiya(cx, cy, scale, accent) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.shadowColor = accent;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;

    // Cyber bowl
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.lineTo(-20, 35);
    ctx.lineTo(20, 35);
    ctx.lineTo(50, 0);
    ctx.closePath();
    ctx.stroke();

    // Cyber flame diamond
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(15, -25);
    ctx.lineTo(0, -5);
    ctx.lineTo(-15, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // --- Photo Frame Renderer ---
  function drawPhotoFrame(w, h) {
    if (!userPhotoImg) return 0;
    ctx.save();

    const frameSize = 220;
    const cx = w / 2;
    const cy = h * 0.32; // positioned in upper-middle

    // Golden ornate circular frame
    ctx.beginPath();
    ctx.arc(cx, cy, frameSize / 2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();

    // Clip image inside circle
    ctx.beginPath();
    ctx.arc(cx, cy, frameSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Center crop image
    const imgRatio = userPhotoImg.width / userPhotoImg.height;
    let sWidth = userPhotoImg.width;
    let sHeight = userPhotoImg.height;
    let sx = 0;
    let sy = 0;

    if (imgRatio > 1) {
      sWidth = userPhotoImg.height;
      sx = (userPhotoImg.width - sWidth) / 2;
    } else {
      sHeight = userPhotoImg.width;
      sy = (userPhotoImg.height - sHeight) / 2;
    }

    ctx.drawImage(userPhotoImg, sx, sy, sWidth, sHeight, cx - frameSize / 2, cy - frameSize / 2, frameSize, frameSize);
    ctx.restore();

    return 130; // Push text slightly lower when photo is present
  }

  // --- Typography Renderer ---
  function drawCardTypography(tmpl, w, h, textOffsetTop) {
    ctx.save();
    const isStory = state.format === 'story';
    const hasPhoto = state.hasPhoto && userPhotoImg;

    // Resolve font stacks
    let fontFamily = '"Cinzel", "Playfair Display", Georgia, serif';
    if (state.fontStyle === 'sans') {
      fontFamily = '"Inter", system-ui, -apple-system, sans-serif';
    } else if (state.fontStyle === 'script') {
      fontFamily = '"Great Vibes", "Brush Script MT", cursive';
    } else if (state.fontStyle === 'traditional') {
      fontFamily = '"Tiro Devanagari Hindi", "Noto Serif Tamil", Georgia, serif';
    }

    // Language Title (e.g. "Happy Diwali" or "இனிய தீபாவளி நல்வாழ்த்துகள்")
    const langMeta = window.DIWALI_DATA.LANGUAGES[state.language] || window.DIWALI_DATA.LANGUAGES.en;
    const festiveTitle = langMeta.title;

    // 1. Festive Header Title
    const titleY = isStory ? (hasPhoto ? h * 0.16 : h * 0.22) : (hasPhoto ? 140 : 180);
    ctx.fillStyle = tmpl.colors.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    ctx.shadowBlur = 10;

    // Dynamic Title sizing based on language character length
    let titleFontSize = festiveTitle.length > 20 ? 44 : 56;
    ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
    ctx.fillText(festiveTitle.toUpperCase(), w / 2, titleY);
    ctx.shadowBlur = 0;

    // Sub-separator line
    ctx.strokeStyle = tmpl.colors.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 120, titleY + 35);
    ctx.lineTo(w / 2 + 120, titleY + 35);
    ctx.stroke();

    // 2. Recipient Name
    const recipientY = titleY + (hasPhoto ? 55 + textOffsetTop * 1.5 : 85);
    if (state.recipient && state.recipient.trim().length > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 36px ${fontFamily}`;
      ctx.fillText(state.recipient.trim(), w / 2, recipientY);
    }

    // 3. Greeting Message Body (Multi-line word wrap)
    const msgY = recipientY + 55;
    const maxTextWidth = w - 240;
    const msgFontSize = isStory ? 30 : (hasPhoto ? 24 : 28);
    const lineHeight = msgFontSize * 1.45;

    ctx.fillStyle = state.textColor || tmpl.colors.text;
    ctx.font = `normal ${msgFontSize}px ${fontFamily}`;
    ctx.textAlign = state.textAlign || 'center';

    const lines = wrapText(ctx, state.message, maxTextWidth);
    const startX = state.textAlign === 'center' ? w / 2 : (state.textAlign === 'left' ? 120 : w - 120);

    lines.forEach((line, index) => {
      ctx.fillText(line, startX, msgY + index * lineHeight);
    });

    // 4. Sender Name
    if (state.sender && state.sender.trim().length > 0) {
      const lastLineY = msgY + lines.length * lineHeight;
      const senderY = lastLineY + 45;

      ctx.fillStyle = tmpl.colors.secondary || tmpl.colors.accent;
      ctx.font = `italic 600 28px ${fontFamily}`;
      ctx.textAlign = state.textAlign || 'center';
      ctx.fillText(state.sender.trim(), startX, senderY);
    }

    ctx.restore();
  }

  // Text Wrapping Helper
  function wrapText(context, text, maxWidth) {
    if (!text) return [];
    const paragraphs = text.split('\n');
    const resultLines = [];

    paragraphs.forEach(paragraph => {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine.length === 0 ? word : currentLine + ' ' + word;
        const metrics = context.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
          resultLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine.length > 0) {
        resultLines.push(currentLine);
      }
    });

    return resultLines;
  }

  // --- Brand Mark Renderer ---
  function drawBrandMark(w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '500 16px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('ecriox.com • One Platform. Endless Possibilities.', w / 2, h - 22);
    ctx.restore();
  }

  // --- Export & Download ---
  function downloadCard(format = 'png') {
    if (!canvas) return;
    const filename = `happy-diwali-ecriox-${Date.now()}.${format === 'jpg' ? 'jpg' : 'png'}`;
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.95 : undefined;

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- WhatsApp & Web Share API ---
  async function shareCard(onSuccess, onError) {
    if (!canvas) return;

    const shareText = `Wishing you and your family a very Happy and Prosperous Diwali! 🪔✨\n\nI created this personalized Diwali card for you on EcrioX. Create your own free Diwali greeting here:\nhttps://ecriox.com/diwali-wishes-maker/`;

    // Try Web Share API with Blob File (Mobile Chrome, Safari iOS)
    if (navigator.share && navigator.canShare) {
      try {
        canvas.toBlob(async function (blob) {
          if (!blob) {
            fallbackWhatsApp(shareText);
            return;
          }
          const file = new File([blob], 'happy-diwali-ecriox.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'Happy Diwali Wishes – EcrioX',
                text: shareText,
                files: [file]
              });
              if (onSuccess) onSuccess('native');
              return;
            } catch (err) {
              if (err.name !== 'AbortError') {
                fallbackWhatsApp(shareText);
              }
            }
          } else {
            fallbackWhatsApp(shareText);
          }
        }, 'image/png');
        return;
      } catch (e) {
        fallbackWhatsApp(shareText);
        return;
      }
    }

    fallbackWhatsApp(shareText);
  }

  function fallbackWhatsApp(text) {
    // Download image first so user has it immediately
    downloadCard('png');
    // Open WhatsApp prefilled with link
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  return {
    init,
    setFormat,
    updateState,
    getState,
    setPhoto,
    removePhoto,
    render,
    downloadCard,
    shareCard
  };
})();
