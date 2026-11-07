/**
 * EcrioX AI Prompt Studio
 * Structured prompt engineering compiler for LLMs.
 */

(function () {
  'use strict';

  const txtRole = document.getElementById('txtRole');
  const txtTask = document.getElementById('txtTask');
  const txtContext = document.getElementById('txtContext');
  const selFormat = document.getElementById('selFormat');
  const chkCoT = document.getElementById('chkCoT');
  const txtPromptOutput = document.getElementById('txtPromptOutput');
  const btnCopyPrompt = document.getElementById('btnCopyPrompt');
  const presetButtons = document.querySelectorAll('.preset-pill');

  const PRESETS = {
    coding: {
      role: 'Senior Full-Stack Software Engineer & Cloud Architect',
      task: 'Design a resilient, high-speed client-side caching strategy for an online tools web platform.',
      context: 'Must use pure vanilla JavaScript with zero external dependencies. Prioritize offline capability, low latency, and memory safety.',
      format: 'step-by-step'
    },
    marketing: {
      role: 'Principal Growth Marketer & Technical SEO Copywriter',
      task: 'Write a high-converting, educational landing page copy section explaining the benefits of client-side browser tools.',
      context: 'Audience is security-conscious developers and remote professionals. Emphasize zero-upload privacy, speed, and no signup requirements.',
      format: 'bullet-points'
    },
    research: {
      role: 'Staff Research Analyst & Cybersecurity Specialist',
      task: 'Conduct a competitive analysis comparing server-side PDF processing versus client-side WebAssembly processing.',
      context: 'Evaluate data security compliance (GDPR, HIPAA), cloud server infrastructure operating costs, and device hardware limitations.',
      format: 'markdown-table'
    },
    biz: {
      role: 'Chief Technology Officer & Product Strategist',
      task: 'Draft an executive briefing on scaling an online utility platform to 100,000+ monthly organic visitors.',
      context: 'Focus on organic programmatic SEO, site architecture scalability, AdSense compliance, and low maintenance overhead.',
      format: 'bullet-points'
    }
  };

  function compilePrompt() {
    const role = txtRole.value.trim();
    const task = txtTask.value.trim();
    const context = txtContext.value.trim();
    const formatValue = selFormat.value;
    const formatText = selFormat.options[selFormat.selectedIndex].text;
    const useCoT = chkCoT.checked;

    const sections = [];

    if (role) {
      sections.push(`# ROLE\nAct as: ${role}`);
    }

    if (task) {
      sections.push(`# TASK\n${task}`);
    }

    if (context) {
      sections.push(`# CONTEXT & CONSTRAINTS\n${context}`);
    }

    sections.push(`# OUTPUT FORMAT\nDeliver the response strictly in: ${formatText}.`);

    const instructions = [
      'Maintain an authoritative, precise, and objective tone.',
      'Do not include conversational filler, preamble, or apologies.'
    ];

    if (useCoT) {
      instructions.unshift('Think step-by-step and outline your architectural reasoning before providing the final deliverable.');
    }

    sections.push(`# INSTRUCTIONS\n${instructions.map(i => `- ${i}`).join('\n')}`);

    txtPromptOutput.value = sections.join('\n\n');
  }

  // Event Listeners
  txtRole.addEventListener('input', compilePrompt);
  txtTask.addEventListener('input', compilePrompt);
  txtContext.addEventListener('input', compilePrompt);
  selFormat.addEventListener('change', compilePrompt);
  chkCoT.addEventListener('change', compilePrompt);

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const key = btn.getAttribute('data-preset');
      const data = PRESETS[key];
      if (data) {
        txtRole.value = data.role;
        txtTask.value = data.task;
        txtContext.value = data.context;
        selFormat.value = data.format;
        compilePrompt();
      }
    });
  });

  btnCopyPrompt.addEventListener('click', () => {
    const prompt = txtPromptOutput.value;
    if (!prompt) return;
    navigator.clipboard.writeText(prompt).then(() => {
      if (window.EcrioXApp) EcrioXApp.showToast('Structured prompt copied to clipboard!');
    }).catch(() => {
      txtPromptOutput.select();
      document.execCommand('copy');
      if (window.EcrioXApp) EcrioXApp.showToast('Copied prompt!', 'success');
    });
  });

  // Init
  compilePrompt();
})();
