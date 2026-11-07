/**
 * EcrioX Career Studio - Resume Engine & Multi-Version Manager
 * 100% Client-Side - Zero Remote Uploads - 20+ Real Professional Templates
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'ecriox_resumes_v1';
  const ACTIVE_ID_KEY = 'ecriox_active_resume_id';

  // 20 Professional Templates Directory
  const TEMPLATES_CATALOG = [
    // ATS-Friendly
    { id: 'tpl-classic-ats', name: 'Classic Professional', category: 'ats', atsRating: '100% ATS Ready', description: 'Timeless single-column serif format optimized for enterprise recruitment systems.', font: 'Merriweather, Georgia, serif', columns: '1-Column' },
    { id: 'tpl-modern-ats', name: 'Modern ATS', category: 'ats', atsRating: '100% ATS Ready', description: 'Crisp sans-serif typography with subtle border dividers and bold section headers.', font: 'Inter, sans-serif', columns: '1-Column' },
    { id: 'tpl-minimal-single', name: 'Minimal Single Column', category: 'ats', atsRating: '100% ATS Ready', description: 'Ultra-clean, uncluttered presentation maximizing content density and legibility.', font: 'Plus Jakarta Sans, sans-serif', columns: '1-Column' },
    { id: 'tpl-corporate-standard', name: 'Corporate Standard', category: 'ats', atsRating: '98% ATS Ready', description: 'Formal banking, consulting, and corporate enterprise format with navy accents.', font: 'Georgia, serif', columns: '1-Column' },
    { id: 'tpl-executive-pro', name: 'Executive Professional', category: 'ats', atsRating: '98% ATS Ready', description: 'Prestigious layout with distinguished header framing and executive summary emphasis.', font: 'Merriweather, serif', columns: '1-Column' },

    // Technology and Engineering
    { id: 'tpl-software-engineer', name: 'Software Engineer', category: 'tech', atsRating: '98% ATS Ready', description: 'Engineered for developers, featuring tech stack tags, GitHub links, and system project focus.', font: 'Inter, sans-serif', columns: '1-Column' },
    { id: 'tpl-developer-portfolio', name: 'Developer Portfolio', category: 'tech', atsRating: '95% ATS Ready', description: 'Highlights code repositories, open source contributions, and cloud proficiencies.', font: 'Roboto, sans-serif', columns: '1-Column' },
    { id: 'tpl-data-scientist', name: 'Data Scientist', category: 'tech', atsRating: '95% ATS Ready', description: 'Structured for quantitative specialists, analytical frameworks, and research methodologies.', font: 'Inter, sans-serif', columns: '1-Column' },
    { id: 'tpl-it-professional', name: 'IT Systems & DevOps', category: 'tech', atsRating: '96% ATS Ready', description: 'Elevates infrastructure certifications, CI/CD pipelines, and cloud security competencies.', font: 'Inter, sans-serif', columns: '1-Column' },
    { id: 'tpl-hardware-engineer', name: 'Electronics & Hardware', category: 'tech', atsRating: '96% ATS Ready', description: 'Tailored for FPGA, embedded systems, PCB engineering, and laboratory tooling.', font: 'Plus Jakarta Sans, sans-serif', columns: '1-Column' },

    // Business and Management
    { id: 'tpl-business-analyst', name: 'Business Analyst', category: 'business', atsRating: '96% ATS Ready', description: 'Focuses on business requirements, stakeholder alignment, and quantitative business value.', font: 'Inter, sans-serif', columns: '1-Column' },
    { id: 'tpl-project-manager', name: 'Project Manager (PMP/Agile)', category: 'business', atsRating: '95% ATS Ready', description: 'Emphasizes sprint leadership, budget oversight, and milestone execution metrics.', font: 'Plus Jakarta Sans, sans-serif', columns: '1-Column' },
    { id: 'tpl-marketing-pro', name: 'Marketing & Growth', category: 'business', atsRating: '93% ATS Ready', description: 'Highlights conversion KPIs, campaign performance, and cross-channel brand strategy.', font: 'Inter, sans-serif', columns: '1-Column' },
    { id: 'tpl-finance-pro', name: 'Finance & Accounting', category: 'business', atsRating: '98% ATS Ready', description: 'Structured for financial modeling, auditing, GAAP standards, and regulatory reporting.', font: 'Georgia, serif', columns: '1-Column' },
    { id: 'tpl-operations-mgr', name: 'Operations & Supply Chain', category: 'business', atsRating: '95% ATS Ready', description: 'Focuses on operational throughput, logistics, vendor contracts, and Lean Six Sigma.', font: 'Inter, sans-serif', columns: '1-Column' },

    // Creative and Academic
    { id: 'tpl-modern-creative', name: 'Modern Creative', category: 'creative', atsRating: '90% (Modern ATS)', description: 'Clean two-tone layout featuring a dedicated side column for quick contact and skill scanning.', font: 'Plus Jakarta Sans, sans-serif', columns: '2-Column Header' },
    { id: 'tpl-designer-portfolio', name: 'Designer Portfolio', category: 'creative', atsRating: '90% (Modern ATS)', description: 'Aesthetic spacing and typography showcasing design systems, UX metrics, and portfolios.', font: 'Inter, sans-serif', columns: 'Refined 1-Col' },
    { id: 'tpl-elegant-minimal', name: 'Elegant Minimal', category: 'creative', atsRating: '95% ATS Ready', description: 'Refined, airy design with generous whitespace and understated typographic accents.', font: 'Merriweather, serif', columns: '1-Column' },
    { id: 'tpl-contemporary-pro', name: 'Contemporary Professional', category: 'creative', atsRating: '92% (Modern ATS)', description: 'Sophisticated dual-toned headers with balanced section dividers and clean pill badges.', font: 'Plus Jakarta Sans, sans-serif', columns: 'Modern Hybrid' },
    { id: 'tpl-academic-cv', name: 'Academic & Research CV', category: 'creative', atsRating: '98% ATS Ready', description: 'Comprehensive curriculum vitae format for grants, publications, conferences, and teaching.', font: 'Georgia, serif', columns: '1-Column CV' }
  ];

  // Default Professional Sample Resume
  const SAMPLE_RESUME = {
    id: 'sample-software-engineer',
    versionName: 'Senior Software Engineer (Target)',
    template: 'tpl-modern-ats',
    paperSize: 'a4',
    themeColor: '#1e40af',
    fontFamily: 'Inter',
    fontSize: 'normal', // compact, normal, large
    lineSpacing: 'normal',
    personal: {
      fullName: 'Alex Morgan',
      jobTitle: 'Senior Full-Stack Engineer',
      email: 'alex.morgan@email.com',
      phone: '+1 (555) 349-8201',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/alexmorgan-dev',
      github: 'https://github.com/alexmorgan-dev',
      portfolio: 'https://alexmorgan.dev',
      website: ''
    },
    summary: 'Results-driven Senior Full-Stack Engineer with over 6 years of experience architecting high-scale web applications, microservices, and distributed cloud systems. Skilled in React, Node.js, TypeScript, and AWS cloud infrastructure. Demonstrated success optimizing database query latency, leading cross-functional squads, and instituting automated CI/CD deployment pipelines.',
    experience: [
      {
        id: 'exp-1',
        title: 'Lead Full-Stack Engineer',
        company: 'Apex Cloud Solutions',
        location: 'San Francisco, CA',
        startDate: '2022-03',
        endDate: '',
        current: true,
        bullets: [
          'Architected and deployed distributed event-driven microservices using Node.js, TypeScript, and AWS Lambda, serving over 1.2M daily active API requests.',
          'Spearheaded the migration of legacy monolithic frontend to React and Next.js, accelerating initial page load speeds by 42% and enhancing mobile SEO performance.',
          'Optimized PostgreSQL query schemas and implemented Redis caching layers, reducing peak database CPU utilization from 78% to 34%.',
          'Mentored 7 junior and mid-level software engineers through structured code reviews, automated linting enforcement, and bi-weekly architecture brown-bags.'
        ]
      },
      {
        id: 'exp-2',
        title: 'Software Engineer',
        company: 'Vanguard Digital Systems',
        location: 'San Jose, CA',
        startDate: '2019-06',
        endDate: '2022-02',
        current: false,
        bullets: [
          'Engineered reusable component libraries and design system modules in React and Tailwind CSS, standardizing UI consistency across 4 customer-facing enterprise applications.',
          'Built robust REST and GraphQL API integrations for payment processing workflows, maintaining 99.98% uptime SLA compliance.',
          'Automated regression testing suites using Jest and Cypress, expanding end-to-end test coverage from 45% to 88% and cutting bug rollback frequency in half.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        startDate: '2015-08',
        endDate: '2019-05',
        gpa: '3.8 / 4.0',
        coursework: 'Distributed Systems, Data Structures & Algorithms, Database Design, Computer Networks'
      }
    ],
    skills: [
      'JavaScript (ES6+)', 'TypeScript', 'React.js', 'Next.js', 'Node.js',
      'Python', 'PostgreSQL', 'Redis', 'MongoDB', 'Docker',
      'Kubernetes', 'AWS (Lambda, S3, ECS)', 'GraphQL', 'REST APIs', 'CI/CD (GitHub Actions)',
      'Git', 'Jest', 'System Architecture', 'Agile/Scrum', 'Microservices'
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'StreamPulse – Real-Time Telemetry Dashboard',
        tech: 'React, Node.js, WebSockets, Redis, Tailwind CSS',
        link: 'https://github.com/alexmorgan-dev/streampulse',
        bullets: [
          'Engineered high-throughput telemetry analytics dashboard handling 10,000 concurrent WebSocket metric streams with sub-50ms render latency.',
          'Implemented responsive visual charts and interactive alert thresholds, deployed via Docker containers onto AWS ECS.'
        ]
      },
      {
        id: 'proj-2',
        name: 'QuerySpeed – Automated SQL Performance Profiler',
        tech: 'TypeScript, PostgreSQL, Express, Docker',
        link: 'https://github.com/alexmorgan-dev/queryspeed',
        bullets: [
          'Created developer CLI and web UI analyzing slow relational database queries and recommending missing indexes, achieving 300+ GitHub stars.'
        ]
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        date: '2023-09',
        credentialId: 'AWS-ASA-894721',
        url: 'https://aws.amazon.com/verification'
      }
    ],
    languages: [
      { language: 'English', proficiency: 'Native / Bilingual' },
      { language: 'Spanish', proficiency: 'Professional Working Proficiency' }
    ],
    customSections: []
  };

  class ResumeEngine {
    constructor() {
      this.resumes = [];
      this.currentResume = null;
      this.listeners = [];
      this.loadFromStorage();
    }

    /**
     * Load resumes from localStorage or initialize with sample
     */
    loadFromStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.resumes = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not read resumes from storage:', e);
      }

      if (!this.resumes || !Array.isArray(this.resumes) || this.resumes.length === 0) {
        // Clone sample resume
        const initial = JSON.parse(JSON.stringify(SAMPLE_RESUME));
        initial.id = 'resume_' + Date.now();
        this.resumes = [initial];
      }

      let activeId = localStorage.getItem(ACTIVE_ID_KEY);
      this.currentResume = this.resumes.find(r => r.id === activeId) || this.resumes[0];
      this.saveToStorage();
    }

    /**
     * Persist to localStorage
     */
    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.resumes));
        if (this.currentResume) {
          localStorage.setItem(ACTIVE_ID_KEY, this.currentResume.id);
        }
      } catch (e) {
        console.warn('Could not save to localStorage:', e);
      }
      this.notifyListeners();
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    }

    notifyListeners() {
      this.listeners.forEach(fn => {
        try {
          fn(this.currentResume);
        } catch (e) {
          console.error('Error in resume listener:', e);
        }
      });
    }

    /**
     * Get active resume
     */
    getActiveResume() {
      return this.currentResume;
    }

    /**
     * Update active resume data
     */
    updateActiveResume(updaterFn) {
      if (!this.currentResume) return;
      if (typeof updaterFn === 'function') {
        updaterFn(this.currentResume);
      } else if (typeof updaterFn === 'object') {
        Object.assign(this.currentResume, updaterFn);
      }
      this.saveToStorage();
    }

    /**
     * Switch active resume by ID
     */
    switchResume(id) {
      const found = this.resumes.find(r => r.id === id);
      if (found) {
        this.currentResume = found;
        this.saveToStorage();
      }
    }

    /**
     * Clone active resume into a new version
     */
    cloneCurrentResume(newVersionName) {
      if (!this.currentResume) return;
      const copy = JSON.parse(JSON.stringify(this.currentResume));
      copy.id = 'resume_' + Date.now();
      copy.versionName = newVersionName || `${this.currentResume.versionName} (Copy)`;
      this.resumes.push(copy);
      this.currentResume = copy;
      this.saveToStorage();
      return copy;
    }

    /**
     * Create fresh blank resume
     */
    createBlankResume(versionName = 'Untitled Resume') {
      const blank = {
        id: 'resume_' + Date.now(),
        versionName: versionName,
        template: 'tpl-modern-ats',
        paperSize: 'a4',
        themeColor: '#1e40af',
        fontFamily: 'Inter',
        fontSize: 'normal',
        lineSpacing: 'normal',
        personal: {
          fullName: 'Your Name',
          jobTitle: 'Professional Title',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          portfolio: '',
          website: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        customSections: []
      };
      this.resumes.push(blank);
      this.currentResume = blank;
      this.saveToStorage();
      return blank;
    }

    /**
     * Reset active resume with sample data
     */
    resetWithSample() {
      if (!this.currentResume) return;
      const sample = JSON.parse(JSON.stringify(SAMPLE_RESUME));
      sample.id = this.currentResume.id;
      sample.versionName = this.currentResume.versionName;
      Object.assign(this.currentResume, sample);
      this.saveToStorage();
    }

    /**
     * Delete a resume version
     */
    deleteResume(id) {
      if (this.resumes.length <= 1) {
        alert('You must have at least one resume version.');
        return false;
      }
      this.resumes = this.resumes.filter(r => r.id !== id);
      if (this.currentResume.id === id) {
        this.currentResume = this.resumes[0];
      }
      this.saveToStorage();
      return true;
    }

    /**
     * Export active resume as JSON file
     */
    exportJSON() {
      if (!this.currentResume) return;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.currentResume, null, 2));
      const downloadAnchor = document.createElement('a');
      const filename = `${(this.currentResume.personal.fullName || 'resume').toLowerCase().replace(/\s+/g, '_')}_data.json`;
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    /**
     * Import JSON file and load as resume
     */
    importJSON(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || typeof parsed !== 'object' || !parsed.personal) {
          throw new Error('Invalid resume data structure');
        }
        parsed.id = 'resume_' + Date.now();
        parsed.versionName = parsed.versionName ? `${parsed.versionName} (Imported)` : 'Imported Resume';
        this.resumes.push(parsed);
        this.currentResume = parsed;
        this.saveToStorage();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    /**
     * Generate HTML markup for a given resume object & template
     */
    renderResumeHTML(resume) {
      const r = resume || this.currentResume || SAMPLE_RESUME;
      const p = r.personal || {};
      const tplId = r.template || 'tpl-modern-ats';
      const color = r.themeColor || '#1e40af';
      const font = r.fontFamily || 'Inter';

      // Build contact line
      const contactItems = [];
      if (p.email) contactItems.push(`<a href="mailto:${escapeHTML(p.email)}" class="cv-link">${escapeHTML(p.email)}</a>`);
      if (p.phone) contactItems.push(`<span>${escapeHTML(p.phone)}</span>`);
      if (p.location) contactItems.push(`<span>${escapeHTML(p.location)}</span>`);
      if (p.linkedin) contactItems.push(`<a href="${escapeHTML(p.linkedin)}" target="_blank" rel="noopener" class="cv-link">LinkedIn</a>`);
      if (p.github) contactItems.push(`<a href="${escapeHTML(p.github)}" target="_blank" rel="noopener" class="cv-link">GitHub</a>`);
      if (p.portfolio) contactItems.push(`<a href="${escapeHTML(p.portfolio)}" target="_blank" rel="noopener" class="cv-link">Portfolio</a>`);

      // Experience HTML
      let expHTML = '';
      if (r.experience && r.experience.length > 0) {
        expHTML = `
          <section class="cv-section cv-experience-section">
            <h2 class="cv-section-title">Work Experience</h2>
            <div class="cv-entries">
              ${r.experience.map(exp => `
                <div class="cv-entry">
                  <div class="cv-entry-header">
                    <div>
                      <h3 class="cv-entry-title">${escapeHTML(exp.title || 'Job Title')}</h3>
                      <div class="cv-entry-subtitle">${escapeHTML(exp.company || 'Company')}${exp.location ? ` • ${escapeHTML(exp.location)}` : ''}</div>
                    </div>
                    <div class="cv-entry-date">
                      ${formatDate(exp.startDate)} – ${exp.current ? 'Present' : formatDate(exp.endDate)}
                    </div>
                  </div>
                  ${exp.bullets && exp.bullets.length > 0 ? `
                    <ul class="cv-bullets">
                      ${exp.bullets.filter(b => b && b.trim()).map(b => `<li>${escapeHTML(b)}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        `;
      }

      // Education HTML
      let eduHTML = '';
      if (r.education && r.education.length > 0) {
        eduHTML = `
          <section class="cv-section cv-education-section">
            <h2 class="cv-section-title">Education</h2>
            <div class="cv-entries">
              ${r.education.map(edu => `
                <div class="cv-entry">
                  <div class="cv-entry-header">
                    <div>
                      <h3 class="cv-entry-title">${escapeHTML(edu.degree || 'Degree')}</h3>
                      <div class="cv-entry-subtitle">${escapeHTML(edu.school || 'University')}${edu.location ? ` • ${escapeHTML(edu.location)}` : ''}</div>
                    </div>
                    <div class="cv-entry-date">
                      ${edu.startDate ? `${formatDate(edu.startDate)} – ` : ''}${formatDate(edu.endDate)}
                    </div>
                  </div>
                  ${edu.gpa ? `<div class="cv-entry-meta">GPA / Honors: ${escapeHTML(edu.gpa)}</div>` : ''}
                  ${edu.coursework ? `<div class="cv-entry-desc"><strong>Coursework:</strong> ${escapeHTML(edu.coursework)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        `;
      }

      // Skills HTML
      let skillsHTML = '';
      if (r.skills && r.skills.length > 0) {
        skillsHTML = `
          <section class="cv-section cv-skills-section">
            <h2 class="cv-section-title">Skills &amp; Competencies</h2>
            <div class="cv-skills-cloud">
              ${r.skills.map(s => `<span class="cv-skill-pill">${escapeHTML(s)}</span>`).join('')}
            </div>
          </section>
        `;
      }

      // Projects HTML
      let projectsHTML = '';
      if (r.projects && r.projects.length > 0) {
        projectsHTML = `
          <section class="cv-section cv-projects-section">
            <h2 class="cv-section-title">Key Projects</h2>
            <div class="cv-entries">
              ${r.projects.map(proj => `
                <div class="cv-entry">
                  <div class="cv-entry-header">
                    <div>
                      <h3 class="cv-entry-title">
                        ${escapeHTML(proj.name || 'Project Name')}
                        ${proj.link ? `<a href="${escapeHTML(proj.link)}" target="_blank" rel="noopener" class="cv-entry-link">↗</a>` : ''}
                      </h3>
                      ${proj.tech ? `<div class="cv-entry-tech"><strong>Technologies:</strong> ${escapeHTML(proj.tech)}</div>` : ''}
                    </div>
                  </div>
                  ${proj.bullets && proj.bullets.length > 0 ? `
                    <ul class="cv-bullets">
                      ${proj.bullets.filter(b => b && b.trim()).map(b => `<li>${escapeHTML(b)}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </section>
        `;
      }

      // Certifications HTML
      let certsHTML = '';
      if (r.certifications && r.certifications.length > 0) {
        certsHTML = `
          <section class="cv-section cv-certifications-section">
            <h2 class="cv-section-title">Certifications &amp; Credentials</h2>
            <div class="cv-entries">
              ${r.certifications.map(cert => `
                <div class="cv-entry cv-cert-entry">
                  <div class="cv-entry-header">
                    <div>
                      <h3 class="cv-entry-title">${escapeHTML(cert.name)}</h3>
                      <div class="cv-entry-subtitle">${escapeHTML(cert.issuer || '')}${cert.credentialId ? ` • ID: ${escapeHTML(cert.credentialId)}` : ''}</div>
                    </div>
                    <div class="cv-entry-date">${formatDate(cert.date)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
        `;
      }

      // Summary HTML
      let summaryHTML = '';
      if (r.summary && r.summary.trim()) {
        summaryHTML = `
          <section class="cv-section cv-summary-section">
            <h2 class="cv-section-title">Professional Summary</h2>
            <p class="cv-summary-text">${escapeHTML(r.summary)}</p>
          </section>
        `;
      }

      // Assemble full template
      return `
        <div class="resume-sheet ${tplId} size-${r.paperSize || 'a4'}" style="--theme-color: ${color}; --font-family: ${font}; font-family: ${font};">
          <header class="cv-header">
            <h1 class="cv-name">${escapeHTML(p.fullName || 'Your Name')}</h1>
            ${p.jobTitle ? `<div class="cv-job-title">${escapeHTML(p.jobTitle)}</div>` : ''}
            <div class="cv-contact-row">
              ${contactItems.join('<span class="cv-sep">•</span>')}
            </div>
          </header>

          ${summaryHTML}
          ${expHTML}
          ${eduHTML}
          ${skillsHTML}
          ${projectsHTML}
          ${certsHTML}
        </div>
      `;
    }

    /**
     * Trigger clean vector print preview
     */
    triggerPrint() {
      window.print();
    }
  }

  // Utilities
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [year, month] = dateStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${months[mIdx] || month} ${year}`;
    }
    return dateStr;
  }

  window.ECRIOX_RESUME_TEMPLATES = TEMPLATES_CATALOG;
  window.ECRIOX_SAMPLE_RESUME = SAMPLE_RESUME;
  window.ECRIOX_RESUME_ENGINE = new ResumeEngine();

})(typeof window !== 'undefined' ? window : this);
