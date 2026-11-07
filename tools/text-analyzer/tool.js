/**
 * EcrioX - Client-Side Text Analyzer & Case Converter
 * 100% in-browser instantaneous processing. Zero text transmitted over network.
 */

(function () {
  "use strict";

  const TOOL_ID = "text-analyzer";
  const TOOL_CATEGORY = "text";

  const elements = {
    textArea: document.getElementById("textInput"),
    wordCount: document.getElementById("wordCount"),
    charCount: document.getElementById("charCount"),
    charNoSpaces: document.getElementById("charNoSpaces"),
    sentenceCount: document.getElementById("sentenceCount"),
    paragraphCount: document.getElementById("paragraphCount"),
    readingTime: document.getElementById("readingTime"),
    btnUpper: document.getElementById("btnUpper"),
    btnLower: document.getElementById("btnLower"),
    btnTitle: document.getElementById("btnTitle"),
    btnSentence: document.getElementById("btnSentence"),
    btnSlug: document.getElementById("btnSlug"),
    btnCleanSpaces: document.getElementById("btnCleanSpaces"),
    btnCopy: document.getElementById("btnCopy"),
    btnClear: document.getElementById("btnClear"),
    btnSample: document.getElementById("btnSample")
  };

  function init() {
    if (!elements.textArea) return;

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackToolOpen(TOOL_ID, TOOL_CATEGORY);
    }

    elements.textArea.addEventListener("input", analyzeText);

    elements.btnUpper.addEventListener("click", () => transformCase("upper"));
    elements.btnLower.addEventListener("click", () => transformCase("lower"));
    elements.btnTitle.addEventListener("click", () => transformCase("title"));
    elements.btnSentence.addEventListener("click", () => transformCase("sentence"));
    elements.btnSlug.addEventListener("click", () => transformCase("slug"));
    elements.btnCleanSpaces.addEventListener("click", () => transformCase("clean"));

    elements.btnCopy.addEventListener("click", copyText);
    elements.btnClear.addEventListener("click", clearText);
    elements.btnSample.addEventListener("click", loadSampleText);

    // Initial run
    analyzeText();
  }

  function analyzeText() {
    const text = elements.textArea.value || "";

    // Words
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    elements.wordCount.textContent = words.toLocaleString();

    // Characters
    elements.charCount.textContent = text.length.toLocaleString();
    elements.charNoSpaces.textContent = text.replace(/\s/g, "").length.toLocaleString();

    // Sentences
    const sentences = trimmed ? trimmed.split(/[.!?]+(?:\s+|$)/).filter(Boolean).length : 0;
    elements.sentenceCount.textContent = sentences.toLocaleString();

    // Paragraphs
    const paragraphs = trimmed ? text.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;
    elements.paragraphCount.textContent = paragraphs.toLocaleString();

    // Reading Time (Average 200 WPM)
    const minutes = words / 200;
    if (minutes < 1) {
      const seconds = Math.ceil(minutes * 60);
      elements.readingTime.textContent = `${seconds} sec`;
    } else {
      elements.readingTime.textContent = `${Math.ceil(minutes)} min`;
    }
  }

  function transformCase(mode) {
    const text = elements.textArea.value;
    if (!text) return;

    let result = text;
    if (mode === "upper") {
      result = text.toUpperCase();
    } else if (mode === "lower") {
      result = text.toLowerCase();
    } else if (mode === "title") {
      result = text.toLowerCase().replace(/(?:^|\s|-)\w/g, (match) => match.toUpperCase());
    } else if (mode === "sentence") {
      result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
    } else if (mode === "slug") {
      result = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    } else if (mode === "clean") {
      result = text.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n\n").trim();
    }

    elements.textArea.value = result;
    analyzeText();

    if (window.EcrioXAnalytics) {
      window.EcrioXAnalytics.trackToolUse(TOOL_ID, "transform_" + mode);
    }

    if (window.EcrioXApp) {
      window.EcrioXApp.showToast("Text transformed successfully!");
    }
  }

  function copyText() {
    const text = elements.textArea.value;
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (window.EcrioXAnalytics) {
          window.EcrioXAnalytics.trackToolUse(TOOL_ID, "copy_clipboard");
        }
        if (window.EcrioXApp) {
          window.EcrioXApp.showToast("Copied to clipboard!");
        }
      })
      .catch(() => {
        if (window.EcrioXApp) {
          window.EcrioXApp.showToast("Could not copy automatically. Please copy manually.");
        }
      });
  }

  function clearText() {
    elements.textArea.value = "";
    analyzeText();
    elements.textArea.focus();
  }

  function loadSampleText() {
    elements.textArea.value =
      "EcrioX is an online productivity and utility platform built for speed, simplicity, and complete privacy. Discover tools to compress, convert, calculate, and format digital assets without unnecessary friction or complexity.";
    analyzeText();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
