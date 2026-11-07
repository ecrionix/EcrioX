/**
 * EcrioX - Client-Side JSON Formatter, Validator & Minifier
 * 100% in-browser processing. Zero data transmitted over the network.
 */

(function () {
  "use strict";

  const TOOL_ID = "json-formatter";
  const TOOL_CATEGORY = "developer";

  const elements = {
    jsonInput: document.getElementById("jsonInput"),
    indentSelect: document.getElementById("indentSelect"),
    formatBtn: document.getElementById("formatBtn"),
    minifyBtn: document.getElementById("minifyBtn"),
    validateBtn: document.getElementById("validateBtn"),
    copyBtn: document.getElementById("copyBtn"),
    clearBtn: document.getElementById("clearBtn"),
    sampleBtn: document.getElementById("sampleBtn"),
    statusBanner: document.getElementById("statusBanner"),
    statusText: document.getElementById("statusText"),
    charCount: document.getElementById("charCount"),
    lineCount: document.getElementById("lineCount"),
    sizeText: document.getElementById("sizeText")
  };

  const SAMPLE_JSON = {
    platform: "EcrioX",
    version: "2.0.0",
    description: "One Platform. Endless Possibilities.",
    categories: ["pdf", "image", "developer", "text", "calculators", "media", "ai", "productivity"],
    features: {
      clientSideProcessing: true,
      serverStorage: false,
      privacyGuaranteed: true
    },
    metrics: {
      activeTools: 12,
      uptime: 0.999
    }
  };

  function init() {
    if (!elements.jsonInput) return;

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackToolOpen(TOOL_ID, TOOL_CATEGORY);
    }

    elements.jsonInput.addEventListener("input", updateMetrics);
    elements.formatBtn.addEventListener("click", () => formatJson(false));
    elements.minifyBtn.addEventListener("click", () => formatJson(true));
    elements.validateBtn.addEventListener("click", validateJson);
    elements.copyBtn.addEventListener("click", copyJson);
    elements.clearBtn.addEventListener("click", clearInput);
    elements.sampleBtn.addEventListener("click", loadSample);

    // Initial run with sample if empty
    if (!elements.jsonInput.value.trim()) {
      loadSample();
    } else {
      updateMetrics();
    }
  }

  function updateMetrics() {
    const text = elements.jsonInput.value;
    const bytes = new Blob([text]).size;
    const lines = text ? text.split("\n").length : 0;

    elements.charCount.textContent = `${text.length.toLocaleString()} chars`;
    elements.lineCount.textContent = `${lines.toLocaleString()} lines`;
    elements.sizeText.textContent = formatBytes(bytes);
  }

  function formatJson(minify) {
    const raw = elements.jsonInput.value.trim();
    if (!raw) {
      showStatus("warning", "Input is empty. Please enter or paste JSON code.");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      const indent = minify ? 0 : parseInt(elements.indentSelect.value, 10) || 2;
      const formatted = JSON.stringify(parsed, null, indent);

      elements.jsonInput.value = formatted;
      updateMetrics();

      showStatus("success", minify ? "JSON successfully minified!" : "JSON successfully formatted and validated!");

      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackToolUse(TOOL_ID, minify ? "minify" : "beautify");
      }

      if (window.EcrioXApp) {
        window.EcrioXApp.showToast(minify ? "JSON minified!" : "JSON formatted!");
      }
    } catch (err) {
      handleJsonError(err, raw);
    }
  }

  function validateJson() {
    const raw = elements.jsonInput.value.trim();
    if (!raw) {
      showStatus("warning", "Input is empty. Please enter JSON to validate.");
      return;
    }

    try {
      JSON.parse(raw);
      showStatus("success", "Valid JSON! Document structure is compliant with RFC 8259.");
      if (window.EcrioXAnalytics) {
        window.EcrioXAnalytics.trackToolUse(TOOL_ID, "validate");
      }
      if (window.EcrioXApp) {
        window.EcrioXApp.showToast("JSON is valid!");
      }
    } catch (err) {
      handleJsonError(err, raw);
    }
  }

  function handleJsonError(err, rawText) {
    const msg = err.message || "Invalid JSON syntax.";
    let errorDetails = msg;

    // Try extracting line number from message if available
    const match = msg.match(/position\s+(\d+)/i) || msg.match(/at line\s+(\d+)/i);
    if (match) {
      const pos = parseInt(match[1], 10);
      if (!isNaN(pos) && !msg.includes("at line")) {
        const textBefore = rawText.slice(0, pos);
        const line = textBefore.split("\n").length;
        const col = pos - textBefore.lastIndexOf("\n");
        errorDetails = `${msg} (Error near Line ${line}, Column ${col})`;
      }
    }

    showStatus("error", `Syntax Error: ${errorDetails}`);
    if (window.EcrioXApp) {
      window.EcrioXApp.showToast("Invalid JSON syntax.");
    }
  }

  function showStatus(type, message) {
    elements.statusBanner.style.display = "flex";
    elements.statusText.textContent = message;

    if (type === "success") {
      elements.statusBanner.style.backgroundColor = "var(--badge-avail-bg)";
      elements.statusBanner.style.borderColor = "var(--color-success)";
      elements.statusText.style.color = "var(--badge-avail-text)";
    } else if (type === "error") {
      elements.statusBanner.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
      elements.statusBanner.style.borderColor = "var(--color-danger)";
      elements.statusText.style.color = "var(--color-danger)";
    } else {
      elements.statusBanner.style.backgroundColor = "var(--badge-soon-bg)";
      elements.statusBanner.style.borderColor = "var(--color-warning)";
      elements.statusText.style.color = "var(--badge-soon-text)";
    }
  }

  function copyJson() {
    const text = elements.jsonInput.value;
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (window.EcrioXApp) window.EcrioXApp.showToast("JSON copied to clipboard!");
        if (window.EcrioXAnalytics) window.EcrioXAnalytics.trackToolUse(TOOL_ID, "copy");
      })
      .catch(() => {
        if (window.EcrioXApp) window.EcrioXApp.showToast("Could not copy automatically.");
      });
  }

  function clearInput() {
    elements.jsonInput.value = "";
    elements.statusBanner.style.display = "none";
    updateMetrics();
    elements.jsonInput.focus();
  }

  function loadSample() {
    elements.jsonInput.value = JSON.stringify(SAMPLE_JSON, null, 2);
    elements.statusBanner.style.display = "none";
    updateMetrics();
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
