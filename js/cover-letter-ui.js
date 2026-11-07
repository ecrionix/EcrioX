/**
 * EcrioX Career Studio - Cover Letter Generator UI Controller
 * 100% Client-Side - Multi-Tone Letter Generation & High-Res PDF Print
 */

(function (window) {
  'use strict';

  function initCoverLetterUI() {
    const generateBtn = document.getElementById('btnGenerateLetter');
    const printBtn = document.getElementById('btnPrintLetter');
    const copyBtn = document.getElementById('btnCopyLetter');
    const toneSelect = document.getElementById('clTone');
    const previewContainer = document.getElementById('clPreviewSheet');

    if (!generateBtn) return;

    // Prepopulate from active resume if available
    try {
      const active = window.ECRIOX_RESUME_ENGINE ? window.ECRIOX_RESUME_ENGINE.getActiveResume() : null;
      if (active && active.personal) {
        setVal('clName', active.personal.fullName);
        setVal('clEmail', active.personal.email);
        setVal('clPhone', active.personal.phone);
        setVal('clLocation', active.personal.location);
        setVal('clRole', active.personal.jobTitle);
        setVal('clSkills', (active.skills || []).slice(0, 5).join(', '));
      }
    } catch (e) {}

    generateBtn.addEventListener('click', () => {
      renderLetter();
    });

    toneSelect?.addEventListener('change', () => {
      renderLetter();
    });

    printBtn?.addEventListener('click', () => {
      window.print();
    });

    copyBtn?.addEventListener('click', () => {
      const letterData = getLetterData();
      const res = window.ECRIOX_CAREER_HELPERS.generateCoverLetter(letterData);
      navigator.clipboard.writeText(res.fullText).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy Letter Text'; }, 2000);
      });
    });

    function getLetterData() {
      return {
        applicantName: document.getElementById('clName')?.value || 'Alex Morgan',
        applicantEmail: document.getElementById('clEmail')?.value || 'alex.morgan@email.com',
        applicantPhone: document.getElementById('clPhone')?.value || '+1 (555) 019-2834',
        applicantLocation: document.getElementById('clLocation')?.value || 'San Francisco, CA',
        recipientName: document.getElementById('clRecipient')?.value || 'Hiring Manager',
        companyName: document.getElementById('clCompany')?.value || 'Innovate Technologies Inc.',
        companyAddress: document.getElementById('clCompanyAddress')?.value || 'San Francisco, CA',
        targetRole: document.getElementById('clRole')?.value || 'Senior Software Engineer',
        relevantExperience: document.getElementById('clExperience')?.value || 'Architecting distributed cloud systems and leading sprint deliverables',
        keySkills: document.getElementById('clSkills')?.value || 'React, Node.js, AWS, TypeScript, and Agile execution',
        motivation: document.getElementById('clMotivation')?.value || 'your team’s mission of empowering global teams through resilient digital platforms',
        tone: toneSelect ? toneSelect.value : 'formal'
      };
    }

    function renderLetter() {
      const data = getLetterData();
      const res = window.ECRIOX_CAREER_HELPERS.generateCoverLetter(data);

      if (!previewContainer) return;

      previewContainer.innerHTML = `
        <div class="cover-letter-sheet">
          <header class="letter-header">
            <div class="letter-title-name">${escapeHTML(res.header.name)}</div>
            <div class="letter-contact-meta">${escapeHTML(res.header.contact)}</div>
          </header>

          <div class="letter-date">${escapeHTML(res.header.date)}</div>

          <div class="letter-recipient-block">
            <strong>${escapeHTML(res.header.recipient)}</strong><br>
            ${escapeHTML(res.header.company)}<br>
            ${escapeHTML(res.header.companyAddress)}
          </div>

          <div class="letter-body">
            <p><strong>${escapeHTML(res.salutation)}</strong></p>
            ${res.paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('')}
          </div>

          <div class="letter-signoff">
            <p>Sincerely,</p>
            <strong style="font-size:11pt; color:#0f172a;">${escapeHTML(res.header.name)}</strong>
          </div>
        </div>
      `;
    }

    // Initial render
    renderLetter();

    function setVal(id, val) {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    }

    function escapeHTML(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  window.ECRIOX_COVER_LETTER_UI = {
    init: initCoverLetterUI
  };

})(typeof window !== 'undefined' ? window : this);
