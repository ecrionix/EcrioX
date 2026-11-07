/**
 * EcrioX Career Studio - Standalone ATS Resume Checker UI Controller
 * 100% Client-Side - Zero PII Sent to Remote Servers
 */

(function (window) {
  'use strict';

  function initATSCheckerUI() {
    const resumeTextarea = document.getElementById('atsResumeInput');
    const analyzeBtn = document.getElementById('btnAnalyzeATS');
    const loadSavedBtn = document.getElementById('btnLoadSavedResume');
    const fileInput = document.getElementById('atsFileInput');
    const resultsContainer = document.getElementById('atsResultsContainer');

    if (!analyzeBtn) return;

    // Check if coming with pre-filled content
    try {
      const active = window.ECRIOX_RESUME_ENGINE ? window.ECRIOX_RESUME_ENGINE.getActiveResume() : null;
      if (active && resumeTextarea && !resumeTextarea.value) {
        // Pre-fill with active resume summary & bullets
        const text = formatResumeAsPlainText(active);
        resumeTextarea.value = text;
      }
    } catch (e) {}

    // Load from saved resumes button
    loadSavedBtn?.addEventListener('click', () => {
      try {
        const engine = window.ECRIOX_RESUME_ENGINE;
        const active = engine ? engine.getActiveResume() : null;
        if (active) {
          resumeTextarea.value = formatResumeAsPlainText(active);
          alert('Loaded active resume from local builder!');
        } else {
          alert('No local resume found. Start by typing or pasting your resume.');
        }
      } catch (e) {
        alert('Could not retrieve local resume.');
      }
    });

    // File input handler (txt, pdf text)
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        resumeTextarea.value = evt.target.result;
        runAnalysis();
      };
      reader.readAsText(file);
    });

    // Analyze Button
    analyzeBtn.addEventListener('click', () => {
      runAnalysis();
    });

    function runAnalysis() {
      const text = resumeTextarea.value.trim();
      if (!text) {
        alert('Please paste or upload your resume text to analyze.');
        return;
      }

      // Run evaluation
      const results = window.ECRIOX_CAREER_HELPERS.evaluateATS(null, text);
      renderResults(results);
    }

    function renderResults(res) {
      if (!resultsContainer) return;

      resultsContainer.style.display = 'block';
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Score class
      let scoreClass = 'good';
      let scoreSummary = 'Good ATS Compatibility';
      if (res.totalScore >= 85) {
        scoreClass = 'excellent';
        scoreSummary = 'Outstanding ATS Readiness';
      } else if (res.totalScore < 65 && res.totalScore >= 50) {
        scoreClass = 'warning';
        scoreSummary = 'Moderate ATS Issues Detected';
      } else if (res.totalScore < 50) {
        scoreClass = 'poor';
        scoreSummary = 'Requires Structural Revision';
      }

      const scoreCircle = document.getElementById('atsScoreCircle');
      if (scoreCircle) {
        scoreCircle.className = `score-circle ${scoreClass}`;
        scoreCircle.innerHTML = `
          <span class="score-num">${res.totalScore}</span>
          <span class="score-label">/ 100</span>
        `;
      }

      const titleEl = document.getElementById('atsScoreSummaryText');
      if (titleEl) {
        titleEl.textContent = scoreSummary;
      }

      // Metric breakdowns
      document.getElementById('scoreStructure').textContent = `${res.breakdown.structure} / 25`;
      document.getElementById('scoreFormatting').textContent = `${res.breakdown.formatting} / 25`;
      document.getElementById('scoreContent').textContent = `${res.breakdown.contentQuality} / 25`;
      document.getElementById('scoreReadability').textContent = `${res.breakdown.readability} / 25`;

      // Passed checks
      const passedList = document.getElementById('atsPassedList');
      if (passedList) {
        passedList.innerHTML = res.passedChecks.map(item => `
          <div class="ats-item passed">
            <span>✅</span>
            <div>${escapeHTML(item)}</div>
          </div>
        `).join('');
      }

      // Warnings
      const warningsList = document.getElementById('atsWarningsList');
      if (warningsList) {
        warningsList.innerHTML = (res.warnings.length > 0 ? res.warnings : ['No critical formatting or structural issues detected!']).map(item => `
          <div class="ats-item warning">
            <span>⚠️</span>
            <div>${escapeHTML(item)}</div>
          </div>
        `).join('');
      }

      // Recommendations
      const recList = document.getElementById('atsRecList');
      if (recList) {
        recList.innerHTML = (res.recommendations.length > 0 ? res.recommendations : ['Your resume follows recommended ATS principles.']).map(item => `
          <div class="ats-item" style="background: rgba(37,99,235,0.06); border-left: 3px solid #2563eb;">
            <span>💡</span>
            <div>${escapeHTML(item)}</div>
          </div>
        `).join('');
      }
    }

    function formatResumeAsPlainText(r) {
      if (!r) return '';
      const p = r.personal || {};
      let out = `${p.fullName || ''}\n${p.jobTitle || ''}\n${p.email || ''} | ${p.phone || ''} | ${p.location || ''}\n\n`;
      if (r.summary) out += `PROFESSIONAL SUMMARY\n${r.summary}\n\n`;
      if (r.experience && r.experience.length) {
        out += `WORK EXPERIENCE\n`;
        r.experience.forEach(exp => {
          out += `${exp.title} - ${exp.company} (${exp.startDate} - ${exp.current ? 'Present' : exp.endDate})\n`;
          (exp.bullets || []).forEach(b => { out += `• ${b}\n`; });
          out += '\n';
        });
      }
      if (r.education && r.education.length) {
        out += `EDUCATION\n`;
        r.education.forEach(edu => {
          out += `${edu.degree} - ${edu.school} (${edu.endDate})\n`;
        });
        out += '\n';
      }
      if (r.skills && r.skills.length) {
        out += `SKILLS\n${r.skills.join(', ')}\n\n`;
      }
      return out;
    }

    function escapeHTML(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  window.ECRIOX_ATS_UI = {
    init: initATSCheckerUI
  };

})(typeof window !== 'undefined' ? window : this);
