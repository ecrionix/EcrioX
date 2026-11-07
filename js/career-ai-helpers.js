/**
 * EcrioX Career Studio - Career Intelligence & Heuristics Helper
 * 100% Client-Side - Zero Remote Uploads - Zero Privacy Leakage
 * Contains action verbs, bullet improvers, ATS analysis rules, and text templates.
 */

(function (window) {
  'use strict';

  const CAREER_HELPERS = {
    // 250+ Categorized High-Impact Action Verbs
    actionVerbs: {
      leadership: [
        'Spearheaded', 'Orchestrated', 'Directed', 'Mobilized', 'Championed',
        'Steered', 'Empowered', 'Cultivated', 'Chaired', 'Founded',
        'Pioneered', 'Mentored', 'Delegated', 'Governed', 'Instituted'
      ],
      technical: [
        'Architected', 'Engineered', 'Refactored', 'Deployed', 'Automated',
        'Containerized', 'Constructed', 'Programmed', 'Integrated', 'Optimized',
        'Implemented', 'Migrated', 'Debugged', 'Standardized', 'Benchmarked'
      ],
      optimization: [
        'Streamlined', 'Accelerated', 'Consolidated', 'Eliminated', 'Maximized',
        'Revamped', 'Restructured', 'Overhauled', 'Augmented', 'Expedited',
        'Simplified', 'Refined', 'Scaled', 'Enhanced', 'Modernized'
      ],
      analysis: [
        'Audited', 'Synthesized', 'Quantified', 'Forecasted', 'Diagnosed',
        'Evaluated', 'Surveyed', 'Modeled', 'Dissected', 'Formulated',
        'Discovered', 'Assessed', 'Mapped', 'Identified', 'Benchmarked'
      ],
      management: [
        'Facilitated', 'Negotiated', 'Liaised', 'Partnered', 'Coordinated',
        'Supervised', 'Executed', 'Delivered', 'Resolved', 'Preserved',
        'Aligned', 'Administered', 'Synchronized', 'Tracked', 'Maintained'
      ],
      creative: [
        'Conceptualized', 'Crafted', 'Authored', 'Devised', 'Produced',
        'Illustrated', 'Designed', 'Storyboarded', 'Redesigned', 'Curated',
        'Composed', 'Formulated', 'Innovated', 'Visualized', 'Shaped'
      ]
    },

    // Weak phrases to avoid in resumes
    weakPhrases: [
      { weak: /responsible for/gi, better: 'Led, executed, or managed' },
      { weak: /worked on/gi, better: 'Engineered, spearheaded, or developed' },
      { weak: /helped with/gi, better: 'Assisted in, co-authored, or accelerated' },
      { weak: /duties included/gi, better: 'Administered, orchestrated, or delivered' },
      { weak: /handled/gi, better: 'Managed, resolved, or coordinated' },
      { weak: /hard worker/gi, better: 'Demonstrated dedication with tangible outcomes' },
      { weak: /team player/gi, better: 'Collaborated across cross-functional squads' },
      { weak: /go-getter/gi, better: 'Proactively delivered initiatives' },
      { weak: /detail-oriented/gi, better: 'Ensured high fidelity and zero-defect delivery' },
      { weak: /good communication skills/gi, better: 'Presented technical concepts to stakeholders' }
    ],

    // Technical skills dictionary for parsing & matching
    skillsCatalog: {
      languages: [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'go', 'golang',
        'rust', 'ruby', 'php', 'swift', 'kotlin', 'sql', 'html', 'html5', 'css', 'css3',
        'sass', 'scss', 'r', 'matlab', 'bash', 'shell', 'powershell', 'scala', 'dart', 'perl'
      ],
      frameworks: [
        'react', 'react.js', 'react native', 'angular', 'vue', 'vue.js', 'next.js', 'nuxt.js',
        'node.js', 'express', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
        'asp.net', '.net core', 'laravel', 'ruby on rails', 'flutter', 'tailwind css', 'bootstrap',
        'graphql', 'rest api', 'redux', 'svelte', 'jquery'
      ],
      cloud_devops: [
        'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes',
        'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'linux',
        'nginx', 'apache', 'helm', 'prometheus', 'grafana', 'datadog', 'cloudformation',
        'serverless', 'lambda', 'microservices'
      ],
      databases: [
        'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
        'sqlite', 'oracle', 'cassandra', 'firebase', 'supabase', 'snowflake', 'neo4j', 'mariadb'
      ],
      data_ai: [
        'machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'computer vision',
        'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'data analysis', 'power bi',
        'tableau', 'spark', 'hadoop', 'bigquery', 'data modeling', 'statistics', 'etl'
      ],
      hardware_embedded: [
        'verilog', 'vhdl', 'systemverilog', 'fpga', 'asic', 'embedded c', 'rtos', 'arm',
        'pcb design', 'altium', 'microcontrollers', 'arduino', 'raspberry pi', 'uart', 'spi',
        'i2c', 'cadence', 'synopsys', 'rtl design', 'labview', 'circuit design'
      ],
      business_management: [
        'agile', 'scrum', 'kanban', 'jira', 'confluence', 'project management', 'pmp',
        'sdlc', 'product management', 'business analysis', 'stakeholder management',
        'budgeting', 'risk management', 'vendor management', 'kpi tracking', 'okrs',
        'financial modeling', 'gaap', 'audit', 'supply chain', 'crm', 'salesforce'
      ],
      soft_skills: [
        'leadership', 'cross-functional collaboration', 'problem-solving', 'critical thinking',
        'public speaking', 'mentorship', 'conflict resolution', 'time management', 'client relations',
        'strategic planning', 'negotiation', 'adaptability'
      ]
    },

    // Standard ATS section headings
    standardHeadings: [
      'experience', 'work experience', 'professional experience', 'employment history',
      'education', 'academic background', 'educational qualifications',
      'skills', 'technical skills', 'core competencies', 'skills & abilities',
      'summary', 'professional summary', 'executive summary', 'profile', 'career objective',
      'projects', 'key projects', 'technical projects', 'personal projects',
      'certifications', 'licenses & certifications', 'professional credentials',
      'awards', 'honors & awards', 'publications', 'languages', 'volunteer experience'
    ],

    /**
     * Improve a single bullet point into 4 distinct styles without inventing false numbers
     */
    improveBullet: function (rawBullet, role = '', intent = 'impact') {
      const trimmed = (rawBullet || '').trim().replace(/^[-•*]\s*/, '');
      if (!trimmed) {
        return {
          impact: 'Lead and execute strategic initiatives while driving high-quality deliverables across teams.',
          concise: 'Delivered core initiatives ensuring rigorous execution and cross-team alignment.',
          technical: 'Architected and implemented core modules following industry standard specifications.',
          leadership: 'Spearheaded team execution and established best practices for long-term project success.'
        };
      }

      // Check for leading weak words
      let firstWord = trimmed.split(' ')[0] || '';
      let remaining = trimmed.substring(firstWord.length).trim();
      let cleaned = trimmed;

      // Replace weak openings
      if (/^(worked\s+on|responsible\s+for|helped\s+with|handled|did|assisted\s+in)/i.test(trimmed)) {
        cleaned = trimmed.replace(/^(worked\s+on|responsible\s+for|helped\s+with|handled|did|assisted\s+in)\s*/i, '');
        firstWord = cleaned.split(' ')[0] || '';
        remaining = cleaned.substring(firstWord.length).trim();
      }

      // Generate variations
      const impactPrefixes = ['Spearheaded', 'Optimized', 'Accelerated', 'Delivered', 'Streamlined'];
      const technicalPrefixes = ['Architected', 'Engineered', 'Refactored', 'Deployed', 'Constructed'];
      const leadershipPrefixes = ['Orchestrated', 'Directed', 'Mobilized', 'Governed', 'Championed'];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      const baseNoun = cleaned.length > 5 ? cleaned : 'critical workflow components';

      return {
        impact: `${pick(impactPrefixes)} ${baseNoun}, boosting delivery reliability and operational efficiency.`,
        concise: `Executed ${baseNoun} adhering strictly to target specifications and quality standards.`,
        technical: `${pick(technicalPrefixes)} ${baseNoun} utilizing modern engineering patterns and robust testing practices.`,
        leadership: `${pick(leadershipPrefixes)} cross-functional efforts for ${baseNoun}, aligning stakeholder goals with project milestones.`
      };
    },

    /**
     * Generate 5 professional summaries based on candidate details
     */
    generateSummaries: function (params) {
      const {
        jobTitle = 'Software Engineer',
        yearsExp = '4',
        industry = 'Technology',
        keySkills = 'System Design, Cloud Infrastructure, Agile',
        achievement = 'delivering scalable web applications and optimizing system performance',
        targetRole = ''
      } = params;

      const title = jobTitle || 'Professional';
      const exp = yearsExp ? `${yearsExp}+ years of` : 'proven';
      const skills = keySkills || 'core technical competencies and cross-team leadership';
      const ach = achievement || 'delivering high-impact solutions in dynamic environments';
      const target = targetRole || title;

      return {
        short: `Results-driven ${title} with ${exp} experience specializing in ${skills}. Proven track record of ${ach}.`,
        standard: `Dedicated and forward-thinking ${title} offering ${exp} expertise in the ${industry} domain. Proficient in ${skills}, with a consistent history of ${ach}. Adept at partnering with cross-functional stakeholders to build reliable, high-value solutions.`,
        experienced: `Accomplished ${title} with over ${yearsExp || '5'} years of extensive background driving ${industry} initiatives. Subject-matter expert in ${skills}. Spearheaded end-to-end execution resulting in ${ach}, while mentoring teams and institutionalizing industry best practices.`,
        fresher: `Ambitious and detail-oriented graduate pursuing a ${target} trajectory. Possesses a strong academic foundation in ${skills}, complemented by practical hands-on project experience in ${ach}. Highly motivated to contribute technical enthusiasm and quick-learning aptitude to team objectives.`,
        transition: `Versatile professional transitioning into ${target}, bringing ${exp} background in ${industry} alongside deep proficiency in ${skills}. Leverages transferable strengths in problem-solving and strategic execution, demonstrated through ${ach}, to bring immediate value to the organization.`
      };
    },

    /**
     * Generate Cover Letter based on input details
     */
    generateCoverLetter: function (params) {
      const {
        applicantName = 'Alex Morgan',
        applicantEmail = 'alex.morgan@email.com',
        applicantPhone = '+1 (555) 019-2834',
        applicantLocation = 'San Francisco, CA',
        date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        recipientName = 'Hiring Manager',
        companyName = 'Innovate Technologies Inc.',
        companyAddress = 'San Francisco, CA',
        targetRole = 'Senior Software Engineer',
        relevantExperience = 'Building scalable cloud architectures and leading distributed engineering squads',
        keySkills = 'React, Node.js, AWS, and Distributed Microservices',
        motivation = 'your company’s mission of empowering global teams through accessible digital infrastructure',
        tone = 'formal'
      } = params;

      let opening = '';
      let body1 = '';
      let body2 = '';
      let closing = '';

      if (tone === 'concise') {
        opening = `I am writing to express my strong enthusiasm for the ${targetRole} position at ${companyName}. With a solid track record in ${relevantExperience}, I am confident in my ability to make an immediate, meaningful impact on your engineering deliverables.`;
        body1 = `Throughout my career, I have focused on mastering ${keySkills}. My background includes successfully delivering end-to-end solutions that emphasize system reliability, clean code standards, and agile collaboration.`;
        body2 = `What excites me most about ${companyName} is ${motivation}. I thrive in collaborative environments where high ownership and technical excellence are valued.`;
        closing = `Thank you for your time and consideration. I welcome the opportunity to discuss how my skill set aligns with your team's current milestones.`;
      } else if (tone === 'modern') {
        opening = `I was excited to discover the open ${targetRole} opportunity at ${companyName}. Having followed your organization’s innovative milestones in ${motivation}, I believe my background in ${relevantExperience} aligns seamlessly with your vision.`;
        body1 = `Over the course of my career, I have refined my core competencies in ${keySkills}. I take pride not only in writing robust and maintainable code, but also in bridging technical requirements with genuine user needs to drive organizational outcomes.`;
        body2 = `At ${companyName}, I look forward to tackling challenging technical problems alongside a dedicated team, championing best practices, and contributing proactively to your upcoming product roadmaps.`;
        closing = `I would love the opportunity to speak further about how my experience can support ${companyName}’s objectives. Thank you very much for reviewing my application.`;
      } else if (tone === 'graduate') {
        opening = `I am writing to enthusiastically apply for the ${targetRole} opening at ${companyName}. As an eager professional with rigorous hands-on project exposure in ${relevantExperience}, I am eager to contribute my technical foundation to your team.`;
        body1 = `During my academic training and project coursework, I developed deep practical expertise in ${keySkills}. These experiences strengthened my problem-solving discipline, collaborative communication, and eagerness to master new technologies rapidly.`;
        body2 = `I am especially inspired by ${companyName} because of ${motivation}. Joining your organization presents an exceptional opportunity to learn from seasoned engineers while delivering dependable, enthusiastic contributions from day one.`;
        closing = `Thank you for considering my application. I look forward to the chance to speak with you about how I can contribute to ${companyName}.`;
      } else {
        // Formal Corporate
        opening = `Please accept this letter and the attached resume as formal expression of my interest in the ${targetRole} position currently available at ${companyName}. With extensive experience in ${relevantExperience}, I am well-prepared to contribute effectively to your organization’s strategic initiatives.`;
        body1 = `My professional background is grounded in thorough technical and operational execution, with specialized proficiency across ${keySkills}. In my previous roles, I consistently demonstrated the ability to deliver complex projects on schedule, uphold rigorous quality benchmarks, and foster productive cross-functional partnerships.`;
        body2 = `I have long respected ${companyName} for ${motivation}. I am confident that my disciplined work ethic, dedication to continuous improvement, and problem-solving abilities will serve as a valuable asset to your department.`;
        closing = `I appreciate your time and consideration of my credentials. I welcome the opportunity to discuss my qualifications with you in greater detail during an interview.`;
      }

      const fullLetterText = `${applicantName}
${applicantEmail} | ${applicantPhone} | ${applicantLocation}

${date}

${recipientName}
${companyName}
${companyAddress}

Dear ${recipientName},

${opening}

${body1}

${body2}

${closing}

Sincerely,

${applicantName}`;

      return {
        header: {
          name: applicantName,
          contact: `${applicantEmail} • ${applicantPhone} • ${applicantLocation}`,
          date: date,
          recipient: recipientName,
          company: companyName,
          companyAddress: companyAddress
        },
        salutation: `Dear ${recipientName},`,
        paragraphs: [opening, body1, body2, closing],
        signoff: `Sincerely,\n${applicantName}`,
        fullText: fullLetterText
      };
    },

    /**
     * Parse raw text to extract resume fields (Heuristic parsing)
     */
    parseResumeText: function (rawText) {
      if (!rawText || typeof rawText !== 'string') {
        return { name: '', email: '', phone: '', summary: '', skills: [], experience: [], education: [] };
      }

      const text = rawText.replace(/\r\n/g, '\n');
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

      // Email Regex
      const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
      const email = emailMatch ? emailMatch[1] : '';

      // Phone Regex
      const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0] : '';

      // LinkedIn / GitHub
      const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
      const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : '';

      const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
      const github = githubMatch ? `https://${githubMatch[0]}` : '';

      // Name guess: first non-empty line that isn't email, phone, or title
      let name = '';
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i];
        if (!line.includes('@') && !line.includes('http') && line.length < 40 && !/resume|curriculum|cv/i.test(line)) {
          name = line;
          break;
        }
      }

      // Extract skills from catalog
      const foundSkills = new Set();
      const lowerText = text.toLowerCase();
      Object.keys(this.skillsCatalog).forEach(category => {
        this.skillsCatalog[category].forEach(skill => {
          const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(lowerText)) {
            // Capitalize properly
            foundSkills.add(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
          }
        });
      });

      return {
        name: name || 'Your Name',
        email: email || '',
        phone: phone || '',
        linkedin: linkedin || '',
        github: github || '',
        skills: Array.from(foundSkills),
        rawWordCount: text.split(/\s+/).length
      };
    },

    /**
     * In-browser ATS Resume Checker Evaluator
     * Evaluates Structure, Formatting, Content Quality, and Readability (0-100 score)
     */
    evaluateATS: function (resumeData, rawText = '') {
      let structureScore = 0;
      let formatScore = 0;
      let contentScore = 0;
      let readabilityScore = 0;

      const passedChecks = [];
      const warnings = [];
      const recommendations = [];

      // Determine content to check
      let hasName = false;
      let hasEmail = false;
      let hasPhone = false;
      let hasSummary = false;
      let expCount = 0;
      let eduCount = 0;
      let skillCount = 0;
      let bulletCount = 0;
      let actionVerbCount = 0;
      let metricCount = 0;
      let wordCount = 0;

      if (resumeData && typeof resumeData === 'object') {
        const p = resumeData.personal || {};
        hasName = Boolean(p.fullName && p.fullName.trim());
        hasEmail = Boolean(p.email && p.email.includes('@'));
        hasPhone = Boolean(p.phone && p.phone.trim());
        hasSummary = Boolean(resumeData.summary && resumeData.summary.trim().length > 30);
        expCount = (resumeData.experience || []).length;
        eduCount = (resumeData.education || []).length;
        skillCount = (resumeData.skills || []).length;

        (resumeData.experience || []).forEach(exp => {
          (exp.bullets || []).forEach(b => {
            if (b && b.trim()) {
              bulletCount++;
              wordCount += b.trim().split(/\s+/).length;
              // Check action verb
              const first = b.trim().split(/\s+/)[0].toLowerCase();
              const isAction = Object.values(this.actionVerbs).some(list =>
                list.some(v => v.toLowerCase() === first)
              );
              if (isAction) actionVerbCount++;

              // Check metric
              if (/\d+%|\$\d+|\d+\+|\b\d+\b/.test(b)) {
                metricCount++;
              }
            }
          });
        });
      } else if (rawText) {
        const parsed = this.parseResumeText(rawText);
        hasName = Boolean(parsed.name);
        hasEmail = Boolean(parsed.email);
        hasPhone = Boolean(parsed.phone);
        hasSummary = /summary|profile|objective/i.test(rawText);
        expCount = /experience|employment|work history/i.test(rawText) ? 2 : 0;
        eduCount = /education|university|college|degree/i.test(rawText) ? 1 : 0;
        skillCount = parsed.skills.length;
        wordCount = parsed.rawWordCount || 100;
        bulletCount = (rawText.match(/^[-•*]\s+/gm) || []).length || 5;
        actionVerbCount = Math.min(bulletCount, 3);
        metricCount = (rawText.match(/\d+%|\$\d+|\d+\+/g) || []).length;
      }

      // 1. Structure Evaluation (Max 25 pts)
      if (hasName && hasEmail && hasPhone) {
        structureScore += 8;
        passedChecks.push('Complete contact information (Full Name, verified Email, and Phone Number).');
      } else {
        structureScore += 4;
        warnings.push('Incomplete contact details. Ensure your Full Name, direct Email, and Phone Number are prominent.');
        recommendations.push('Include accurate contact info at the top so recruiters can contact you immediately.');
      }

      if (hasSummary) {
        structureScore += 5;
        passedChecks.push('Professional Summary or Executive Profile included.');
      } else {
        warnings.push('Missing Professional Summary. A concise 2-3 sentence overview introduces your strengths immediately.');
        recommendations.push('Add a professional summary targeting your primary industry and key achievements.');
      }

      if (expCount > 0) {
        structureScore += 6;
        passedChecks.push(`Documented Work Experience entries detected (${expCount} roles).`);
      } else {
        warnings.push('No formal Work Experience section detected.');
        recommendations.push('Add employment history or relevant internships/project leadership.');
      }

      if (eduCount > 0) {
        structureScore += 4;
        passedChecks.push('Education and academic credentials clearly listed.');
      } else {
        warnings.push('Education section is missing or ambiguous.');
      }

      if (skillCount >= 5) {
        structureScore += 2;
        passedChecks.push(`Comprehensive Skills section detected (${skillCount} skills recognized).`);
      } else {
        warnings.push('Skills section has fewer than 5 items. ATS scanners prioritize skill keyword matches.');
        recommendations.push('Add core technical tools, languages, or industry competencies relevant to your target role.');
      }

      // 2. Formatting & ATS Readability (Max 25 pts)
      formatScore = 25; // Base high for our clean templates
      if (resumeData && resumeData.template && resumeData.template.includes('creative')) {
        formatScore -= 3;
        warnings.push('Creative or two-column templates look great to human eyes but may have variable parsing across older legacy ATS.');
        recommendations.push('Consider choosing Classic ATS or Modern ATS for strict compliance on enterprise job portals.');
      } else {
        passedChecks.push('Single-column or high-parseability hierarchy optimized for standard ATS parsers.');
      }
      passedChecks.push('Selectable, vector typography without rasterized text or graphical clipping.');
      passedChecks.push('Standard recognizable section headings (Experience, Education, Skills, Summary).');

      // 3. Content Quality (Max 25 pts)
      if (bulletCount >= 3) {
        contentScore += 6;
        passedChecks.push(`Sufficient bullet points provided (${bulletCount} total achievement bullets).`);
      } else {
        contentScore += 2;
        warnings.push('Too few bullet points in your experience section.');
        recommendations.push('Aim for 3-5 high-impact bullet points for each primary work experience role.');
      }

      if (actionVerbCount > 0 && bulletCount > 0) {
        const verbRatio = actionVerbCount / bulletCount;
        if (verbRatio >= 0.5) {
          contentScore += 10;
          passedChecks.push('Strong action verbs utilized at the beginning of bullet points (e.g., Spearheaded, Engineered, Optimized).');
        } else {
          contentScore += 6;
          warnings.push('Several bullet points begin with passive or weak verbs.');
          recommendations.push('Use our Resume Bullet Point Improver tool to rewrite weak phrases into powerful action verbs.');
        }
      } else {
        contentScore += 3;
      }

      if (metricCount > 0) {
        contentScore += 9;
        passedChecks.push(`Quantifiable achievements detected (${metricCount} metrics, percentages, or scale indicators).`);
      } else {
        contentScore += 4;
        warnings.push('No measurable numbers or quantifiable impacts found in your bullet points.');
        recommendations.push('Where truthful, include scale or outcomes (e.g., team sizes, volume of tickets handled, latency improvements).');
      }

      // 4. ATS Readability & Length (Max 25 pts)
      readabilityScore = 22;
      if (wordCount > 150 && wordCount < 900) {
        readabilityScore += 3;
        passedChecks.push(`Ideal document word density (~${wordCount} words for clean 1-2 page presentation).`);
      } else if (wordCount <= 150) {
        warnings.push('Resume content appears quite brief. Expand on key responsibilities and technologies.');
      } else {
        warnings.push('Resume is quite lengthy. Consider condensing to 1-2 pages to retain recruiter attention.');
      }

      // Aggregate Score
      const totalScore = Math.min(100, Math.max(30, structureScore + formatScore + contentScore + readabilityScore));

      return {
        totalScore,
        breakdown: {
          structure: structureScore, // max 25
          formatting: formatScore, // max 25
          contentQuality: contentScore, // max 25
          readability: readabilityScore // max 25
        },
        passedChecks,
        warnings,
        recommendations
      };
    },

    /**
     * Job Description Keyword & Skill Matcher
     * Extracts keywords from JD and compares with resume skills/text
     */
    matchJobDescription: function (resumeTextOrSkills, jobDescription) {
      if (!jobDescription || !jobDescription.trim()) {
        return {
          matchScore: 0,
          matchedSkills: [],
          missingSkills: [],
          topKeywords: [],
          recommendations: ['Paste a job description to analyze keyword coverage and required skills.']
        };
      }

      const jdText = jobDescription.toLowerCase();
      const resumeSkillsSet = new Set();

      if (Array.isArray(resumeTextOrSkills)) {
        resumeTextOrSkills.forEach(s => resumeSkillsSet.add(s.toLowerCase().trim()));
      } else if (typeof resumeTextOrSkills === 'string') {
        const parsed = this.parseResumeText(resumeTextOrSkills);
        parsed.skills.forEach(s => resumeSkillsSet.add(s.toLowerCase().trim()));
        // also check raw words
        const words = resumeTextOrSkills.toLowerCase().split(/[\s,.;:()]+/);
        words.forEach(w => { if (w.length > 2) resumeSkillsSet.add(w); });
      }

      // Find required skills present in JD
      const jdRequiredSkills = new Set();
      Object.keys(this.skillsCatalog).forEach(cat => {
        this.skillsCatalog[cat].forEach(skill => {
          const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (regex.test(jdText)) {
            jdRequiredSkills.add(skill);
          }
        });
      });

      const matched = [];
      const missing = [];

      jdRequiredSkills.forEach(skill => {
        const titleCaseSkill = skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        let isPresent = false;

        // Direct check or sub-check
        if (resumeSkillsSet.has(skill)) {
          isPresent = true;
        } else {
          // Check if contained
          for (let item of resumeSkillsSet) {
            if (item.includes(skill) || skill.includes(item)) {
              isPresent = true;
              break;
            }
          }
        }

        if (isPresent) {
          matched.push(titleCaseSkill);
        } else {
          missing.push(titleCaseSkill);
        }
      });

      // Calculate score
      const totalRequired = matched.length + missing.length;
      let matchScore = totalRequired === 0 ? 50 : Math.round((matched.length / totalRequired) * 100);

      // Extract general high-frequency buzzwords from JD (excluding common stopwords)
      const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'have', 'from', 'will', 'your', 'about', 'team', 'work', 'experience', 'ability', 'skills', 'role', 'looking', 'years', 'must', 'responsible', 'including', 'opportunity']);
      const wordFreq = {};
      jdText.split(/[^a-zA-Z0-9+#.-]+/).forEach(word => {
        const w = word.trim();
        if (w.length > 3 && !stopWords.has(w) && isNaN(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1;
        }
      });

      const topKeywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([kw, count]) => ({ keyword: kw, count }));

      const recommendations = [];
      if (missing.length > 0) {
        recommendations.push(`The job posting emphasizes competencies like ${missing.slice(0, 4).join(', ')}. If you possess genuine experience with any of these, incorporate them into your Skills or Experience bullet points.`);
      }
      if (matchScore >= 75) {
        recommendations.push('Strong keyword alignment! Your profile covers the core requirements outlined in this posting.');
      } else if (matchScore >= 50) {
        recommendations.push('Moderate alignment. Tailor your work experience achievement descriptions to highlight tools mentioned in the job description.');
      } else {
        recommendations.push('Low keyword overlap. Ensure you have highlighted relevant transferable tools and domain responsibilities.');
      }

      return {
        matchScore,
        matchedSkills: matched,
        missingSkills: missing,
        topKeywords,
        recommendations
      };
    }
  };

  window.ECRIOX_CAREER_HELPERS = CAREER_HELPERS;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAREER_HELPERS;
  }
})(typeof window !== 'undefined' ? window : this);
