/**
 * EcrioX Diwali Wishes Maker - Main UI Controller
 * Manages template gallery, smart wish generator, live preview,
 * interactive Diya lighting animation, countdown, and viral sharing.
 */

(function () {
  'use strict';

  // DOM Elements
  let mainCanvas;
  let recipientInput;
  let messageInput;
  let senderInput;
  let languageSelect;
  let fontStyleSelect;
  let photoUploadInput;
  let removePhotoBtn;
  let templateGalleryContainer;
  let templateCategoryFilter;
  let smartWishResults;
  let smartRecipientSelect;
  let smartToneSelect;

  function init() {
    mainCanvas = document.getElementById('cardCanvas');
    recipientInput = document.getElementById('recipientInput');
    messageInput = document.getElementById('messageInput');
    senderInput = document.getElementById('senderInput');
    languageSelect = document.getElementById('languageSelect');
    fontStyleSelect = document.getElementById('fontStyleSelect');
    photoUploadInput = document.getElementById('photoUploadInput');
    removePhotoBtn = document.getElementById('removePhotoBtn');
    templateGalleryContainer = document.getElementById('templateGallery');
    templateCategoryFilter = document.getElementById('templateCategoryFilter');
    smartWishResults = document.getElementById('smartWishResults');
    smartRecipientSelect = document.getElementById('smartRecipientSelect');
    smartToneSelect = document.getElementById('smartToneSelect');

    if (mainCanvas && window.DIWALI_ENGINE) {
      window.DIWALI_ENGINE.init(mainCanvas);
    }

    renderTemplatesGallery('all');
    setupEventListeners();
    setupDiyaLightingWidget();
    setupCountdownTimer();
    triggerSmartWishGenerator();
  }

  // 1. Render Template Gallery with Category Filters
  function renderTemplatesGallery(filterCategory = 'all') {
    if (!templateGalleryContainer || !window.DIWALI_DATA) return;

    const templates = window.DIWALI_DATA.TEMPLATES.filter(t => {
      if (filterCategory === 'all') return true;
      return t.category === filterCategory;
    });

    const activeId = window.DIWALI_ENGINE.getState().templateId;

    templateGalleryContainer.innerHTML = templates.map(t => {
      const isSelected = t.id === activeId;
      const grad = `linear-gradient(135deg, ${t.colors.bg1}, ${t.colors.bg2})`;

      return `
        <div class="template-card ${isSelected ? 'active' : ''}" data-template-id="${t.id}">
          <div class="template-preview-box" style="background: ${grad}; border-color: ${t.colors.accent};">
            <div class="mini-diya-icon">🪔</div>
            <div class="template-preview-text" style="color: ${t.colors.accent};">
              ${t.name}
            </div>
          </div>
          <div class="template-info">
            <span class="template-name">${t.name}</span>
            <span class="template-badge badge-${t.category}">${t.category}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    templateGalleryContainer.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        const tid = card.getAttribute('data-template-id');
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        window.DIWALI_ENGINE.updateState({ templateId: tid });

        trackAnalytics('template_selected', { template_id: tid });
      });
    });
  }

  // 2. Setup Event Listeners
  function setupEventListeners() {
    // Text Inputs
    if (recipientInput) {
      recipientInput.addEventListener('input', (e) => {
        window.DIWALI_ENGINE.updateState({ recipient: e.target.value });
      });
    }

    if (messageInput) {
      messageInput.addEventListener('input', (e) => {
        window.DIWALI_ENGINE.updateState({ message: e.target.value });
      });
    }

    if (senderInput) {
      senderInput.addEventListener('input', (e) => {
        window.DIWALI_ENGINE.updateState({ sender: e.target.value });
      });
    }

    // Language Dropdown
    if (languageSelect) {
      languageSelect.addEventListener('change', (e) => {
        const langCode = e.target.value;
        const langData = window.DIWALI_DATA.LANGUAGES[langCode];
        if (langData) {
          const sampleWish = langData.wishes[0];
          if (messageInput) messageInput.value = sampleWish;
          if (senderInput && !senderInput.value.includes(langData.defaultSender)) {
            senderInput.value = `${langData.defaultSender} EcrioX`;
          }

          window.DIWALI_ENGINE.updateState({
            language: langCode,
            message: sampleWish,
            sender: senderInput ? senderInput.value : ''
          });

          trackAnalytics('language_selected', { language: langCode });
        }
      });
    }

    // Font Style Select
    if (fontStyleSelect) {
      fontStyleSelect.addEventListener('change', (e) => {
        window.DIWALI_ENGINE.updateState({ fontStyle: e.target.value });
      });
    }

    // Text Alignment
    document.querySelectorAll('.align-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const align = btn.getAttribute('data-align');
        window.DIWALI_ENGINE.updateState({ textAlign: align });
      });
    });

    // Text Color Swatches
    document.querySelectorAll('.color-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.getAttribute('data-color');
        window.DIWALI_ENGINE.updateState({ textColor: color });
      });
    });

    // Format / Aspect Ratio
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const fmt = btn.getAttribute('data-format');
        window.DIWALI_ENGINE.setFormat(fmt);

        // Adjust canvas wrapper CSS class for aspect ratio preview
        const wrap = document.getElementById('canvasWrapper');
        if (wrap) {
          wrap.className = `canvas-wrapper format-${fmt}`;
        }
      });
    });

    // Photo Upload
    if (photoUploadInput) {
      photoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          window.DIWALI_ENGINE.setPhoto(file, (success) => {
            if (success && removePhotoBtn) {
              removePhotoBtn.style.display = 'inline-flex';
            }
          });
        }
      });
    }

    if (removePhotoBtn) {
      removePhotoBtn.addEventListener('click', () => {
        window.DIWALI_ENGINE.removePhoto();
        if (photoUploadInput) photoUploadInput.value = '';
        removePhotoBtn.style.display = 'none';
      });
    }

    // Template Category Filter Bar
    if (templateCategoryFilter) {
      templateCategoryFilter.addEventListener('click', (e) => {
        const pill = e.target.closest('.cat-pill');
        if (!pill) return;
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.getAttribute('data-category');
        renderTemplatesGallery(cat);
      });
    }

    // Smart Wish Generator Controls
    if (smartRecipientSelect) {
      smartRecipientSelect.addEventListener('change', triggerSmartWishGenerator);
    }
    if (smartToneSelect) {
      smartToneSelect.addEventListener('change', triggerSmartWishGenerator);
    }

    // "Surprise Me!" Random Button
    const surpriseBtn = document.getElementById('surpriseMeBtn');
    if (surpriseBtn) {
      surpriseBtn.addEventListener('click', () => {
        const templates = window.DIWALI_DATA.TEMPLATES;
        const randomTmpl = templates[Math.floor(Math.random() * templates.length)];
        const recipients = Object.keys(window.DIWALI_DATA.SMART_WISHES);
        const randomRec = recipients[Math.floor(Math.random() * recipients.length)];
        const wishes = window.DIWALI_DATA.generateWishes(randomRec, 'heartwarming');
        const randomWish = wishes[Math.floor(Math.random() * wishes.length)];

        if (messageInput) messageInput.value = randomWish;

        window.DIWALI_ENGINE.updateState({
          templateId: randomTmpl.id,
          message: randomWish
        });

        renderTemplatesGallery('all');
        trackAnalytics('surprise_me_clicked', {});
      });
    }

    // WhatsApp Viral Share Button
    const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
    if (shareWhatsAppBtn) {
      shareWhatsAppBtn.addEventListener('click', () => {
        window.DIWALI_ENGINE.shareCard(
          () => trackAnalytics('whatsapp_share_clicked', { method: 'native' }),
          () => trackAnalytics('whatsapp_share_clicked', { method: 'fallback' })
        );
      });
    }

    // Download HD Buttons (PNG / JPG)
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    if (downloadPngBtn) {
      downloadPngBtn.addEventListener('click', () => {
        window.DIWALI_ENGINE.downloadCard('png');
        trackAnalytics('image_downloaded', { format: 'png' });
        showPostDownloadCelebration();
      });
    }

    const downloadJpgBtn = document.getElementById('downloadJpgBtn');
    if (downloadJpgBtn) {
      downloadJpgBtn.addEventListener('click', () => {
        window.DIWALI_ENGINE.downloadCard('jpg');
        trackAnalytics('image_downloaded', { format: 'jpg' });
        showPostDownloadCelebration();
      });
    }

    // Copy Greeting Text
    const copyTextBtn = document.getElementById('copyTextBtn');
    if (copyTextBtn) {
      copyTextBtn.addEventListener('click', () => {
        const text = messageInput ? messageInput.value : '';
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            const originalText = copyTextBtn.innerHTML;
            copyTextBtn.innerHTML = '✓ Copied to Clipboard!';
            setTimeout(() => { copyTextBtn.innerHTML = originalText; }, 2000);
            trackAnalytics('text_copied', {});
          });
        }
      });
    }

    // Copy Link Button
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('https://ecriox.com/diwali-wishes-maker/').then(() => {
          const orig = copyLinkBtn.innerHTML;
          copyLinkBtn.innerHTML = '✓ Link Copied!';
          setTimeout(() => { copyLinkBtn.innerHTML = orig; }, 2000);
          trackAnalytics('link_copied', {});
        });
      });
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        if (item) item.classList.toggle('open');
      });
    });
  }

  // 3. Smart Wish Generator Renderer
  function triggerSmartWishGenerator() {
    if (!smartWishResults || !window.DIWALI_DATA) return;

    const rec = smartRecipientSelect ? smartRecipientSelect.value : 'everyone';
    const tone = smartToneSelect ? smartToneSelect.value : 'heartwarming';

    const wishes = window.DIWALI_DATA.generateWishes(rec, tone);

    smartWishResults.innerHTML = wishes.map((w, idx) => `
      <div class="wish-item-card">
        <p class="wish-item-text">"${w}"</p>
        <button class="btn btn-sm btn-outline-gold use-wish-btn" data-wish="${encodeURIComponent(w)}">
          Use This Wish &rarr;
        </button>
      </div>
    `).join('');

    smartWishResults.querySelectorAll('.use-wish-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rawWish = decodeURIComponent(btn.getAttribute('data-wish'));
        if (messageInput) messageInput.value = rawWish;
        window.DIWALI_ENGINE.updateState({ message: rawWish });

        // Scroll smoothly to editor on mobile
        const editor = document.getElementById('cardEditorSection');
        if (editor) {
          editor.scrollIntoView({ behavior: 'smooth' });
        }

        trackAnalytics('smart_wish_used', { recipient: rec, tone: tone });
      });
    });
  }

  // 4. Interactive "Pass the Light" Diya Widget
  function setupDiyaLightingWidget() {
    const diyaWidget = document.getElementById('interactiveDiya');
    const diyaStatus = document.getElementById('diyaStatusMessage');
    let isLit = false;

    if (diyaWidget) {
      diyaWidget.addEventListener('click', () => {
        isLit = !isLit;
        diyaWidget.classList.toggle('is-lit', isLit);

        if (diyaStatus) {
          if (isLit) {
            diyaStatus.innerHTML = `
              <span class="text-gold">✨ You have lit a sacred Diya!</span><br>
              "One flame can ignite thousands without diminishing. Spread the light to your family and friends."
            `;
            spawnConfetti(diyaWidget);
            trackAnalytics('diya_lit', {});
          } else {
            diyaStatus.innerHTML = 'Tap the Diya to light the holy flame and pass the light.';
          }
        }
      });
    }
  }

  function spawnConfetti(anchor) {
    const rect = anchor.getBoundingClientRect();
    for (let i = 0; i < 24; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-spark';
      p.style.left = `${rect.left + rect.width / 2}px`;
      p.style.top = `${rect.top + rect.height / 2}px`;
      p.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
      p.style.setProperty('--ty', `${(Math.random() - 0.7) * 200}px`);
      p.style.setProperty('--bg', i % 2 === 0 ? '#ffd700' : '#ff9f1a');
      document.body.appendChild(p);

      setTimeout(() => { p.remove(); }, 1200);
    }
  }

  // 5. Diwali Countdown Timer (November 8, 2026)
  function setupCountdownTimer() {
    const daysEl = document.getElementById('countdownDays');
    const hoursEl = document.getElementById('countdownHours');
    const minsEl = document.getElementById('countdownMins');
    const secsEl = document.getElementById('countdownSecs');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    // Target: Diwali 2026 (Nov 8, 2026 00:00:00 IST)
    const targetDate = new Date('2026-11-08T00:00:00+05:30').getTime();

    function update() {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(mins).padStart(2, '0');
      secsEl.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  function showPostDownloadCelebration() {
    const modal = document.getElementById('postDownloadBanner');
    if (modal) {
      modal.style.display = 'block';
      setTimeout(() => {
        modal.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }

  // Privacy-safe Analytics Tracking
  function trackAnalytics(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
