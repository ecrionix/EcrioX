/**
 * EcrioX Career Studio - Professional Summary Generator UI Controller
 * Generates tailored executive, fresher, standard, experienced, and career-transition summaries
 */

(function (window) {
  'use strict';

  function initSummaryUI() {
    const jobTitleInput = document.getElementById('sumJobTitle');
    const yearsExpInput = document.getElementById('sumYearsExp');
    const industryInput = document.getElementById('sumIndustry');
    const skillsInput = document.getElementById('sumSkills');
    const achieveInput = document.getElementById('sumAchieve');
    const generateBtn = document.getElementById('btnGenerateSummary');
    const resultsContainer = document.getElementById('summaryResultsContainer');

    if (!generateBtn) return;

    generateBtn.addEventListener('click', () => {
      const params = {
        jobTitle: jobTitleInput ? jobTitleInput.value.trim() : '',
        yearsExp: yearsExpInput ? yearsExpInput.value.trim() : '',
        industry: industryInput ? industryInput.value.trim() : '',
        keySkills: skillsInput ? skillsInput.value.trim() : '',
        achievement: achieveInput ? achieveInput.value.trim() : ''
      };

      const summaries = window.ECRIOX_CAREER_HELPERS.generateSummaries(params);
      renderResults(summaries);
    });

    function renderResults(res) {
      if (!resultsContainer) return;
      resultsContainer.style.display = 'block';
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      setSummaryCard('sumStandard', res.standard);
      setSummaryCard('sumShort', res.short);
      setSummaryCard('sumExperienced', res.experienced);
      setSummaryCard('sumFresher', res.fresher);
      setSummaryCard('sumTransition', res.transition);
    }

    function setSummaryCard(id, text) {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `
        <div style="font-size:0.9375rem; color:var(--cs-text); line-height:1.5; margin-bottom:0.75rem;">
          "${escapeHTML(text)}"
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="btn-secondary btn-copy-sum" data-text="${escapeAttr(text)}" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
            📋 Copy Summary
          </button>
          <button type="button" class="btn-primary btn-apply-sum" data-text="${escapeAttr(text)}" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
            ⚡ Insert into Builder
          </button>
        </div>
      `;

      el.querySelector('.btn-copy-sum').addEventListener('click', (e) => {
        const copyText = e.target.getAttribute('data-text');
        navigator.clipboard.writeText(copyText).then(() => {
          e.target.textContent = '✓ Copied!';
          setTimeout(() => { e.target.textContent = '📋 Copy Summary'; }, 2000);
        });
      });

      el.querySelector('.btn-apply-sum').addEventListener('click', (e) => {
        const copyText = e.target.getAttribute('data-text');
        if (window.ECRIOX_RESUME_ENGINE) {
          window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
            r.summary = copyText;
          });
          alert('Summary inserted into your active resume! Head to the Resume Builder to review.');
        }
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

  window.ECRIOX_SUMMARY_UI = {
    init: initSummaryUI
  };

})(typeof window !== 'undefined' ? window : this);
