/**
 * EcrioX Career Studio - Interactive Builder UI Controller
 * Manages two-panel bindings, live updates, zoom, repeaters, and exports
 */

(function (window) {
  'use strict';

  let currentZoom = 1;
  let activeBulletInput = null;

  function initBuilderUI() {
    const engine = window.ECRIOX_RESUME_ENGINE;
    if (!engine) return;

    // Check URL parameters for pre-selected template or data
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTpl = urlParams.get('template');
    if (requestedTpl) {
      engine.updateActiveResume(r => {
        r.template = requestedTpl;
      });
    }

    renderVersionSelect();
    populateForm(engine.getActiveResume());
    renderTemplateOptions();
    renderLivePreview();

    // Event listeners
    setupTabNavigation();
    setupInputListeners();
    setupRepeaterButtons();
    setupActionVerbPills();
    setupToolbarControls();

    // Subscribe to engine changes
    engine.subscribe(resume => {
      renderLivePreview();
      renderVersionSelect();
    });
  }

  function renderVersionSelect() {
    const engine = window.ECRIOX_RESUME_ENGINE;
    const select = document.getElementById('resumeVersionSelect');
    if (!select) return;

    const resumes = engine.resumes || [];
    const active = engine.getActiveResume();

    select.innerHTML = resumes.map(r => `
      <option value="${r.id}" ${active && active.id === r.id ? 'selected' : ''}>
        ${escapeAttr(r.versionName || 'Untitled Resume')}
      </option>
    `).join('') + `
      <option value="__new__">+ Create New Version...</option>
      <option value="__duplicate__">📋 Duplicate Current Version</option>
    `;
  }

  function renderTemplateOptions() {
    const container = document.getElementById('templateOptionsGrid');
    if (!container) return;

    const catalog = window.ECRIOX_RESUME_TEMPLATES || [];
    const active = window.ECRIOX_RESUME_ENGINE.getActiveResume();
    const currentTpl = active ? active.template : 'tpl-modern-ats';

    container.innerHTML = catalog.map(tpl => `
      <div class="template-card-option ${tpl.id === currentTpl ? 'selected' : ''}" data-template-id="${tpl.id}" style="border: 2px solid ${tpl.id === currentTpl ? 'var(--cs-primary)' : 'var(--cs-border)'}; border-radius: 8px; padding: 0.75rem; cursor: pointer; background: var(--cs-card-bg); transition: all 0.2s ease;">
        <div style="font-weight: 700; font-size: 0.875rem; color: var(--cs-text); margin-bottom: 0.25rem;">
          ${tpl.name}
        </div>
        <div style="display: flex; gap: 0.35rem; margin-bottom: 0.4rem; font-size: 0.7rem;">
          <span style="background: rgba(16,185,129,0.12); color: #059669; padding: 0.1rem 0.35rem; border-radius: 3px; font-weight: 600;">${tpl.atsRating}</span>
          <span style="background: var(--cs-bg-app); border: 1px solid var(--cs-border); padding: 0.1rem 0.35rem; border-radius: 3px;">${tpl.columns}</span>
        </div>
        <p style="font-size: 0.75rem; color: var(--cs-text-muted); margin: 0; line-height: 1.35;">
          ${tpl.description}
        </p>
      </div>
    `).join('');

    container.querySelectorAll('.template-card-option').forEach(card => {
      card.addEventListener('click', () => {
        const tplId = card.getAttribute('data-template-id');
        window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
          r.template = tplId;
        });
        renderTemplateOptions();
      });
    });
  }

  function setupTabNavigation() {
    const tabs = document.querySelectorAll('.editor-tab-btn');
    const panels = document.querySelectorAll('.editor-section-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetSection = tab.getAttribute('data-section');
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPanel = document.getElementById(`panel-${targetSection}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  function populateForm(resume) {
    if (!resume) return;
    const p = resume.personal || {};

    setVal('fullName', p.fullName);
    setVal('jobTitle', p.jobTitle);
    setVal('email', p.email);
    setVal('phone', p.phone);
    setVal('location', p.location);
    setVal('linkedin', p.linkedin);
    setVal('github', p.github);
    setVal('portfolio', p.portfolio);

    setVal('summaryText', resume.summary || '');
    updateCharCount('summaryText', 'summaryCharCount', 500);

    setVal('skillsInput', (resume.skills || []).join(', '));
    setVal('paperSizeSelect', resume.paperSize || 'a4');
    setVal('themeColorSelect', resume.themeColor || '#1e40af');
    setVal('fontFamilySelect', resume.fontFamily || 'Inter');

    renderExperienceRepeaters(resume.experience || []);
    renderEducationRepeaters(resume.education || []);
    renderProjectRepeaters(resume.projects || []);
    renderCertRepeaters(resume.certifications || []);
  }

  function renderExperienceRepeaters(experienceList) {
    const container = document.getElementById('experienceRepeaterContainer');
    if (!container) return;

    container.innerHTML = experienceList.map((exp, idx) => `
      <div class="repeater-card" data-idx="${idx}">
        <div class="repeater-card-header">
          <span>Role #${idx + 1}: ${escapeAttr(exp.title || 'Untitled Role')}</span>
          <button type="button" class="btn-delete-item" data-action="delete-exp" data-idx="${idx}">✕ Remove</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Job Title</label>
            <input type="text" class="form-input exp-title" value="${escapeAttr(exp.title || '')}" placeholder="e.g. Senior Software Engineer">
          </div>
          <div class="form-group">
            <label class="form-label">Company Name</label>
            <input type="text" class="form-input exp-company" value="${escapeAttr(exp.company || '')}" placeholder="e.g. Acme Corp">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input exp-location" value="${escapeAttr(exp.location || '')}" placeholder="e.g. San Francisco, CA">
          </div>
          <div class="form-group">
            <label class="form-label">Dates (Start - End)</label>
            <div style="display: flex; gap: 0.35rem; align-items: center;">
              <input type="text" class="form-input exp-startDate" value="${escapeAttr(exp.startDate || '')}" placeholder="YYYY-MM">
              <span>to</span>
              <input type="text" class="form-input exp-endDate" value="${escapeAttr(exp.endDate || '')}" placeholder="Present or YYYY-MM" ${exp.current ? 'disabled' : ''}>
            </div>
            <label style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem;">
              <input type="checkbox" class="exp-current" ${exp.current ? 'checked' : ''}> Currently working here
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Key Achievements &amp; Bullets (One per line)</label>
          <textarea class="form-textarea exp-bullets" rows="4" placeholder="• Spearheaded backend microservices...">${(exp.bullets || []).join('\n')}</textarea>
          <span class="form-hint">Tip: Begin each bullet with a powerful action verb (Spearheaded, Optimized, Engineered).</span>
        </div>
      </div>
    `).join('');

    // Attach listeners
    container.querySelectorAll('.btn-delete-item[data-action="delete-exp"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
          r.experience.splice(idx, 1);
        });
        renderExperienceRepeaters(window.ECRIOX_RESUME_ENGINE.getActiveResume().experience);
      });
    });

    container.querySelectorAll('.exp-current').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const card = chk.closest('.repeater-card');
        const endInput = card.querySelector('.exp-endDate');
        if (endInput) endInput.disabled = chk.checked;
        saveExperienceFromDOM();
      });
    });

    container.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', () => {
        saveExperienceFromDOM();
      });
      if (inp.classList.contains('exp-bullets')) {
        inp.addEventListener('focus', () => {
          activeBulletInput = inp;
        });
      }
    });
  }

  function saveExperienceFromDOM() {
    const container = document.getElementById('experienceRepeaterContainer');
    if (!container) return;

    const cards = container.querySelectorAll('.repeater-card');
    const updated = [];

    cards.forEach(card => {
      const title = card.querySelector('.exp-title')?.value || '';
      const company = card.querySelector('.exp-company')?.value || '';
      const location = card.querySelector('.exp-location')?.value || '';
      const startDate = card.querySelector('.exp-startDate')?.value || '';
      const endDate = card.querySelector('.exp-endDate')?.value || '';
      const current = card.querySelector('.exp-current')?.checked || false;
      const bulletsRaw = card.querySelector('.exp-bullets')?.value || '';
      const bullets = bulletsRaw.split('\n').map(b => b.trim().replace(/^[-•*]\s*/, '')).filter(Boolean);

      updated.push({
        id: 'exp_' + Math.random().toString(36).substr(2, 9),
        title,
        company,
        location,
        startDate,
        endDate: current ? '' : endDate,
        current,
        bullets
      });
    });

    window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
      r.experience = updated;
    });
  }

  function renderEducationRepeaters(educationList) {
    const container = document.getElementById('educationRepeaterContainer');
    if (!container) return;

    container.innerHTML = educationList.map((edu, idx) => `
      <div class="repeater-card" data-idx="${idx}">
        <div class="repeater-card-header">
          <span>Degree #${idx + 1}: ${escapeAttr(edu.degree || 'Untitled Degree')}</span>
          <button type="button" class="btn-delete-item" data-action="delete-edu" data-idx="${idx}">✕ Remove</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Degree / Certificate</label>
            <input type="text" class="form-input edu-degree" value="${escapeAttr(edu.degree || '')}" placeholder="e.g. B.S. in Computer Science">
          </div>
          <div class="form-group">
            <label class="form-label">School / University</label>
            <input type="text" class="form-input edu-school" value="${escapeAttr(edu.school || '')}" placeholder="e.g. UC Berkeley">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input edu-location" value="${escapeAttr(edu.location || '')}" placeholder="e.g. Berkeley, CA">
          </div>
          <div class="form-group">
            <label class="form-label">Graduation Date (YYYY-MM)</label>
            <input type="text" class="form-input edu-endDate" value="${escapeAttr(edu.endDate || '')}" placeholder="e.g. 2022-05">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">GPA / Honors (Optional)</label>
            <input type="text" class="form-input edu-gpa" value="${escapeAttr(edu.gpa || '')}" placeholder="e.g. 3.8 / 4.0">
          </div>
          <div class="form-group">
            <label class="form-label">Relevant Coursework</label>
            <input type="text" class="form-input edu-coursework" value="${escapeAttr(edu.coursework || '')}" placeholder="e.g. Algorithms, Data Structures">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-item[data-action="delete-edu"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
          r.education.splice(idx, 1);
        });
        renderEducationRepeaters(window.ECRIOX_RESUME_ENGINE.getActiveResume().education);
      });
    });

    container.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        saveEducationFromDOM();
      });
    });
  }

  function saveEducationFromDOM() {
    const container = document.getElementById('educationRepeaterContainer');
    if (!container) return;

    const cards = container.querySelectorAll('.repeater-card');
    const updated = [];

    cards.forEach(card => {
      updated.push({
        id: 'edu_' + Math.random().toString(36).substr(2, 9),
        degree: card.querySelector('.edu-degree')?.value || '',
        school: card.querySelector('.edu-school')?.value || '',
        location: card.querySelector('.edu-location')?.value || '',
        endDate: card.querySelector('.edu-endDate')?.value || '',
        gpa: card.querySelector('.edu-gpa')?.value || '',
        coursework: card.querySelector('.edu-coursework')?.value || ''
      });
    });

    window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
      r.education = updated;
    });
  }

  function renderProjectRepeaters(projectsList) {
    const container = document.getElementById('projectRepeaterContainer');
    if (!container) return;

    container.innerHTML = projectsList.map((proj, idx) => `
      <div class="repeater-card" data-idx="${idx}">
        <div class="repeater-card-header">
          <span>Project #${idx + 1}: ${escapeAttr(proj.name || 'Untitled Project')}</span>
          <button type="button" class="btn-delete-item" data-action="delete-proj" data-idx="${idx}">✕ Remove</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Project Name</label>
            <input type="text" class="form-input proj-name" value="${escapeAttr(proj.name || '')}" placeholder="e.g. QuerySpeed Engine">
          </div>
          <div class="form-group">
            <label class="form-label">Project URL / GitHub</label>
            <input type="text" class="form-input proj-link" value="${escapeAttr(proj.link || '')}" placeholder="https://github.com/...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Technologies Used</label>
          <input type="text" class="form-input proj-tech" value="${escapeAttr(proj.tech || '')}" placeholder="e.g. React, Node.js, PostgreSQL">
        </div>
        <div class="form-group">
          <label class="form-label">Bullets / Description</label>
          <textarea class="form-textarea proj-bullets" rows="3" placeholder="• Architected real-time WebSocket dashboard...">${(proj.bullets || []).join('\n')}</textarea>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-item[data-action="delete-proj"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
          r.projects.splice(idx, 1);
        });
        renderProjectRepeaters(window.ECRIOX_RESUME_ENGINE.getActiveResume().projects);
      });
    });

    container.querySelectorAll('input, textarea').forEach(inp => {
      inp.addEventListener('input', () => {
        saveProjectsFromDOM();
      });
    });
  }

  function saveProjectsFromDOM() {
    const container = document.getElementById('projectRepeaterContainer');
    if (!container) return;

    const cards = container.querySelectorAll('.repeater-card');
    const updated = [];

    cards.forEach(card => {
      const bulletsRaw = card.querySelector('.proj-bullets')?.value || '';
      updated.push({
        id: 'proj_' + Math.random().toString(36).substr(2, 9),
        name: card.querySelector('.proj-name')?.value || '',
        link: card.querySelector('.proj-link')?.value || '',
        tech: card.querySelector('.proj-tech')?.value || '',
        bullets: bulletsRaw.split('\n').map(b => b.trim().replace(/^[-•*]\s*/, '')).filter(Boolean)
      });
    });

    window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
      r.projects = updated;
    });
  }

  function renderCertRepeaters(certsList) {
    const container = document.getElementById('certRepeaterContainer');
    if (!container) return;

    container.innerHTML = certsList.map((cert, idx) => `
      <div class="repeater-card" data-idx="${idx}">
        <div class="repeater-card-header">
          <span>Certification #${idx + 1}: ${escapeAttr(cert.name || 'Untitled')}</span>
          <button type="button" class="btn-delete-item" data-action="delete-cert" data-idx="${idx}">✕ Remove</button>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Certification Name</label>
            <input type="text" class="form-input cert-name" value="${escapeAttr(cert.name || '')}" placeholder="e.g. AWS Solutions Architect">
          </div>
          <div class="form-group">
            <label class="form-label">Issuing Organization</label>
            <input type="text" class="form-input cert-issuer" value="${escapeAttr(cert.issuer || '')}" placeholder="e.g. Amazon Web Services">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="text" class="form-input cert-date" value="${escapeAttr(cert.date || '')}" placeholder="YYYY-MM">
          </div>
          <div class="form-group">
            <label class="form-label">Credential ID</label>
            <input type="text" class="form-input cert-id" value="${escapeAttr(cert.credentialId || '')}" placeholder="e.g. AWS-894721">
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-item[data-action="delete-cert"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
          r.certifications.splice(idx, 1);
        });
        renderCertRepeaters(window.ECRIOX_RESUME_ENGINE.getActiveResume().certifications);
      });
    });

    container.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        saveCertsFromDOM();
      });
    });
  }

  function saveCertsFromDOM() {
    const container = document.getElementById('certRepeaterContainer');
    if (!container) return;

    const cards = container.querySelectorAll('.repeater-card');
    const updated = [];

    cards.forEach(card => {
      updated.push({
        id: 'cert_' + Math.random().toString(36).substr(2, 9),
        name: card.querySelector('.cert-name')?.value || '',
        issuer: card.querySelector('.cert-issuer')?.value || '',
        date: card.querySelector('.cert-date')?.value || '',
        credentialId: card.querySelector('.cert-id')?.value || ''
      });
    });

    window.ECRIOX_RESUME_ENGINE.updateActiveResume(r => {
      r.certifications = updated;
    });
  }

  function setupInputListeners() {
    const engine = window.ECRIOX_RESUME_ENGINE;

    // Personal info
    ['fullName', 'jobTitle', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio'].forEach(field => {
      const el = document.getElementById(field);
      if (el) {
        el.addEventListener('input', () => {
          engine.updateActiveResume(r => {
            r.personal[field] = el.value;
          });
        });
      }
    });

    // Summary
    const summaryInput = document.getElementById('summaryText');
    if (summaryInput) {
      summaryInput.addEventListener('input', () => {
        engine.updateActiveResume(r => {
          r.summary = summaryInput.value;
        });
        updateCharCount('summaryText', 'summaryCharCount', 500);
      });
    }

    // Skills
    const skillsInput = document.getElementById('skillsInput');
    if (skillsInput) {
      skillsInput.addEventListener('input', () => {
        const skillsList = skillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
        engine.updateActiveResume(r => {
          r.skills = skillsList;
        });
      });
    }

    // Formatting & Styling
    const colorSelect = document.getElementById('themeColorSelect');
    if (colorSelect) {
      colorSelect.addEventListener('change', () => {
        engine.updateActiveResume(r => {
          r.themeColor = colorSelect.value;
        });
      });
    }

    const fontSelect = document.getElementById('fontFamilySelect');
    if (fontSelect) {
      fontSelect.addEventListener('change', () => {
        engine.updateActiveResume(r => {
          r.fontFamily = fontSelect.value;
        });
      });
    }

    const sizeSelect = document.getElementById('paperSizeSelect');
    if (sizeSelect) {
      sizeSelect.addEventListener('change', () => {
        engine.updateActiveResume(r => {
          r.paperSize = sizeSelect.value;
        });
      });
    }
  }

  function setupRepeaterButtons() {
    const engine = window.ECRIOX_RESUME_ENGINE;

    document.getElementById('btnAddExperience')?.addEventListener('click', () => {
      engine.updateActiveResume(r => {
        if (!r.experience) r.experience = [];
        r.experience.push({
          id: 'exp_' + Date.now(),
          title: 'Job Title',
          company: 'Company Name',
          location: 'Location',
          startDate: '2023-01',
          endDate: '',
          current: true,
          bullets: ['Spearheaded strategic deliverables with cross-functional partners.']
        });
      });
      renderExperienceRepeaters(engine.getActiveResume().experience);
    });

    document.getElementById('btnAddEducation')?.addEventListener('click', () => {
      engine.updateActiveResume(r => {
        if (!r.education) r.education = [];
        r.education.push({
          id: 'edu_' + Date.now(),
          degree: 'Bachelor of Science',
          school: 'University Name',
          location: 'City, State',
          endDate: '2023-05',
          gpa: '',
          coursework: ''
        });
      });
      renderEducationRepeaters(engine.getActiveResume().education);
    });

    document.getElementById('btnAddProject')?.addEventListener('click', () => {
      engine.updateActiveResume(r => {
        if (!r.projects) r.projects = [];
        r.projects.push({
          id: 'proj_' + Date.now(),
          name: 'Project Name',
          link: '',
          tech: 'Technologies used',
          bullets: ['Engineered key modules ensuring high throughput and reliability.']
        });
      });
      renderProjectRepeaters(engine.getActiveResume().projects);
    });

    document.getElementById('btnAddCert')?.addEventListener('click', () => {
      engine.updateActiveResume(r => {
        if (!r.certifications) r.certifications = [];
        r.certifications.push({
          id: 'cert_' + Date.now(),
          name: 'Certification Name',
          issuer: 'Issuing Body',
          date: '2023-01',
          credentialId: ''
        });
      });
      renderCertRepeaters(engine.getActiveResume().certifications);
    });
  }

  function setupActionVerbPills() {
    const verbContainer = document.getElementById('actionVerbContainer');
    if (!verbContainer) return;

    const sampleVerbs = [
      'Spearheaded', 'Architected', 'Optimized', 'Streamlined', 'Engineered',
      'Orchestrated', 'Refactored', 'Automated', 'Consolidated', 'Accelerated',
      'Instituted', 'Negotiated', 'Directed', 'Deployed', 'Overhauled'
    ];

    verbContainer.innerHTML = sampleVerbs.map(v => `
      <button type="button" class="verb-pill" data-verb="${v}">+ ${v}</button>
    `).join('');

    verbContainer.querySelectorAll('.verb-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const verb = btn.getAttribute('data-verb');
        if (activeBulletInput) {
          const start = activeBulletInput.selectionStart;
          const end = activeBulletInput.selectionEnd;
          const val = activeBulletInput.value;
          activeBulletInput.value = val.substring(0, start) + verb + ' ' + val.substring(end);
          activeBulletInput.focus();
          activeBulletInput.selectionStart = activeBulletInput.selectionEnd = start + verb.length + 1;
          saveExperienceFromDOM();
        } else {
          alert(`Click into a bullet point box first to insert "${verb}".`);
        }
      });
    });
  }

  function setupToolbarControls() {
    const engine = window.ECRIOX_RESUME_ENGINE;

    // Zoom buttons
    document.getElementById('btnZoomIn')?.addEventListener('click', () => {
      setZoom(Math.min(1.4, currentZoom + 0.1));
    });
    document.getElementById('btnZoomOut')?.addEventListener('click', () => {
      setZoom(Math.max(0.5, currentZoom - 0.1));
    });
    document.getElementById('btnZoomReset')?.addEventListener('click', () => {
      setZoom(1);
    });

    // Version select dropdown
    const verSelect = document.getElementById('resumeVersionSelect');
    if (verSelect) {
      verSelect.addEventListener('change', () => {
        const val = verSelect.value;
        if (val === '__new__') {
          const name = prompt('Enter a title for this new resume version:', 'Untitled Resume');
          if (name) {
            engine.createBlankResume(name);
            populateForm(engine.getActiveResume());
          }
        } else if (val === '__duplicate__') {
          const name = prompt('Enter a name for the duplicated version:', `${engine.getActiveResume().versionName} (Copy)`);
          if (name) {
            engine.cloneCurrentResume(name);
            populateForm(engine.getActiveResume());
          }
        } else {
          engine.switchResume(val);
          populateForm(engine.getActiveResume());
        }
      });
    }

    // Print / PDF Download
    document.getElementById('btnPrintPDF')?.addEventListener('click', () => {
      engine.triggerPrint();
    });

    // JSON Export / Import
    document.getElementById('btnExportJSON')?.addEventListener('click', () => {
      engine.exportJSON();
    });

    document.getElementById('jsonFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = engine.importJSON(evt.target.result);
        if (res.success) {
          populateForm(engine.getActiveResume());
          alert('Resume data successfully imported!');
        } else {
          alert('Error importing JSON: ' + res.error);
        }
      };
      reader.readAsText(file);
    });

    // Reset with sample
    document.getElementById('btnResetSample')?.addEventListener('click', () => {
      if (confirm('Replace current resume fields with the comprehensive professional sample data?')) {
        engine.resetWithSample();
        populateForm(engine.getActiveResume());
      }
    });

    // Copy text
    document.getElementById('btnCopyText')?.addEventListener('click', () => {
      const r = engine.getActiveResume();
      const text = `${r.personal.fullName}\n${r.personal.jobTitle}\n${r.personal.email} | ${r.personal.phone} | ${r.personal.location}\n\nSUMMARY\n${r.summary}\n\nEXPERIENCE\n` +
        (r.experience || []).map(e => `${e.title} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate})\n${(e.bullets || []).map(b => '• ' + b).join('\n')}`).join('\n\n') +
        `\n\nEDUCATION\n` + (r.education || []).map(ed => `${ed.degree}, ${ed.school} (${ed.endDate})`).join('\n') +
        `\n\nSKILLS\n${(r.skills || []).join(', ')}`;

      navigator.clipboard.writeText(text).then(() => {
        alert('Clean resume text copied to clipboard!');
      });
    });
  }

  function renderLivePreview() {
    const container = document.getElementById('resumePaperContainer');
    if (!container) return;

    const engine = window.ECRIOX_RESUME_ENGINE;
    const resume = engine.getActiveResume();
    container.innerHTML = engine.renderResumeHTML(resume);
  }

  function setZoom(val) {
    currentZoom = val;
    const scaler = document.getElementById('paperScaler');
    const label = document.getElementById('zoomDisplayLabel');
    if (scaler) {
      scaler.style.transform = `scale(${val})`;
    }
    if (label) {
      label.textContent = `${Math.round(val * 100)}%`;
    }
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  function updateCharCount(inputId, countId, max) {
    const inp = document.getElementById(inputId);
    const cnt = document.getElementById(countId);
    if (inp && cnt) {
      const len = inp.value.length;
      cnt.textContent = `${len} / ${max} characters`;
      cnt.style.color = len > max ? 'var(--cs-danger)' : 'var(--cs-text-muted)';
    }
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.ECRIOX_BUILDER_UI = {
    init: initBuilderUI
  };

})(typeof window !== 'undefined' ? window : this);
