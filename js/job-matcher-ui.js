/**
 * EcrioX Career Studio - Job Matcher UI Controller
 * 100% Client-Side - Zero PII Sent to Remote Servers
 */

(function (window) {
  'use strict';

  function initJobMatcherUI() {
    const resumeTextarea = document.getElementById('matcherResumeInput');
    const jdTextarea = document.getElementById('matcherJdInput');
    const analyzeBtn = document.getElementById('btnAnalyzeMatch');
    const loadSavedBtn = document.getElementById('btnMatcherLoadSaved');
    const resultsContainer = document.getElementById('matcherResultsContainer');

    if (!analyzeBtn) return;

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

    analyzeBtn.addEventListener('click', () => {
      const resumeText = resumeTextarea.value.trim();
      const jdText = jdTextarea.value.trim();

      if (!resumeText) {
        alert('Please paste or load your resume text first.');
        return;
      }
      if (!jdText) {
        alert('Please paste a job description to compare against.');
        return;
      }

      const results = window.ECRIOX_CAREER_HELPERS.matchJobDescription(resumeText, jdText);
      renderResults(results);
    });

    function renderResults(res) {
      if (!resultsContainer) return;

      resultsContainer.style.display = 'block';
      resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Score
      const scoreCircle = document.getElementById('matcherScoreCircle');
      let scoreClass = res.matchScore >= 75 ? 'excellent' : (res.matchScore >= 50 ? 'good' : 'warning');
      if (scoreCircle) {
        scoreCircle.className = `score-circle ${scoreClass}`;
        scoreCircle.innerHTML = `
          <span class="score-num">${res.matchScore}%</span>
          <span class="score-label">MATCH</span>
        `;
      }

      // Matched Skills
      const matchedContainer = document.getElementById('matchedSkillsContainer');
      if (matchedContainer) {
        matchedContainer.innerHTML = res.matchedSkills.length > 0
          ? res.matchedSkills.map(s => `<span class="skill-match-pill matched">✓ ${escapeHTML(s)}</span>`).join('')
          : '<p style="font-size:0.875rem; color:var(--cs-text-muted);">No direct technical keyword matches identified.</p>';
      }

      // Missing Skills
      const missingContainer = document.getElementById('missingSkillsContainer');
      if (missingContainer) {
        missingContainer.innerHTML = res.missingSkills.length > 0
          ? res.missingSkills.map(s => `<span class="skill-match-pill missing">✕ ${escapeHTML(s)}</span>`).join('')
          : '<p style="font-size:0.875rem; color:#059669; font-weight:600;">Outstanding! All primary technical keywords in the JD were recognized in your resume.</p>';
      }

      // Top Keywords table
      const keywordsContainer = document.getElementById('topKeywordsContainer');
      if (keywordsContainer) {
        keywordsContainer.innerHTML = res.topKeywords.map(kw => `
          <div style="display:inline-flex; align-items:center; gap:0.35rem; background:var(--cs-bg-app); border:1px solid var(--cs-border); padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem;">
            <strong>${escapeHTML(kw.keyword)}</strong>
            <span style="color:var(--cs-text-muted);">(${kw.count}×)</span>
          </div>
        `).join(' ');
      }

      // Recommendations
      const recList = document.getElementById('matcherRecList');
      if (recList) {
        recList.innerHTML = res.recommendations.map(r => `
          <div class="ats-item" style="background: rgba(37,99,235,0.06); border-left: 3px solid #2563eb;">
            <span>💡</span>
            <div>${escapeHTML(r)}</div>
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

  window.ECRIOX_MATCHER_UI = {
    init: initJobMatcherUI
  };

})(typeof window !== 'undefined' ? window : this);
