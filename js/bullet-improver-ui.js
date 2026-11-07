/**
 * EcrioX Career Studio - Resume Bullet Point Improver UI Controller
 * 100% Client-Side - Zero False Metrics Fabricated
 */

(function (window) {
  'use strict';

  function initBulletImproverUI() {
    const rawInput = document.getElementById('bulletInput');
    const roleInput = document.getElementById('bulletRoleInput');
    const generateBtn = document.getElementById('btnImproveBullet');
    const resultsContainer = document.getElementById('bulletResultsContainer');

    if (!generateBtn) return;

    generateBtn.addEventListener('click', () => {
      const text = rawInput.value.trim();
      const role = roleInput ? roleInput.value.trim() : '';

      if (!text) {
        alert('Please enter a draft bullet point to improve.');
        return;
      }

      const results = window.ECRIOX_CAREER_HELPERS.improveBullet(text, role);
      renderResults(results);
    });

    function renderResults(res) {
      if (!resultsContainer) return;
      resultsContainer.style.display = 'block';
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setResultCard('resImpact', res.impact);
      setResultCard('resConcise', res.concise);
      setResultCard('resTechnical', res.technical);
      setResultCard('resLeadership', res.leadership);
    }

    function setResultCard(id, text) {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `
        <div style="font-size:0.9375rem; color:var(--cs-text); line-height:1.5; margin-bottom:0.75rem;">
          • ${escapeHTML(text)}
        </div>
        <button type="button" class="btn-secondary btn-copy-bullet" data-text="${escapeAttr(text)}" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
          📋 Copy Bullet
        </button>
      `;

      el.querySelector('.btn-copy-bullet').addEventListener('click', (e) => {
        const copyText = e.target.getAttribute('data-text');
        navigator.clipboard.writeText(copyText).then(() => {
          e.target.textContent = '✓ Copied!';
          setTimeout(() => { e.target.textContent = '📋 Copy Bullet'; }, 2000);
        });
      });
    }

    function escapeHTML(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function escapeAttr(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
  }

  window.ECRIOX_BULLET_UI = {
    init: initBulletImproverUI
  };

})(typeof window !== 'undefined' ? window : this);
