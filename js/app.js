/**
 * EcrioX - Global Application Controller
 * Handles Theme Management, Global Search, Navigation Drawer, and Interactive UI
 */

(function () {
  "use strict";

  const STORAGE_KEY_THEME = "ecriox_theme_preference";

  const EcrioXApp = {
    init: function () {
      this.initTheme();
      this.initMobileNav();
      this.initGlobalSearch();
      this.initFaqAccordions();
      this.initToasts();
    },

    /* -------------------------------------------------------------------------
       Theme Management (Light / Dark)
       ------------------------------------------------------------------------- */
    initTheme: function () {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

      this.applyTheme(initialTheme);

      // Listen for toggle buttons
      document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const current = document.documentElement.getAttribute("data-theme") || "light";
          const next = current === "dark" ? "light" : "dark";
          this.applyTheme(next);
        });
      });
    },

    applyTheme: function (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(STORAGE_KEY_THEME, theme);

      // Update toggle button icons if available
      document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
        btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
        btn.innerHTML = theme === "dark"
          ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
          : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      });
    },

    /* -------------------------------------------------------------------------
       Mobile Navigation Drawer
       ------------------------------------------------------------------------- */
    initMobileNav: function () {
      const toggle = document.querySelector(".mobile-toggle");
      const nav = document.querySelector(".mobile-nav");
      if (!toggle || !nav) return;

      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      // Close when clicking outside
      document.addEventListener("click", (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target) && nav.classList.contains("open")) {
          nav.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    },

    /* -------------------------------------------------------------------------
       Global Search with Live Autocomplete
       ------------------------------------------------------------------------- */
    initGlobalSearch: function () {
      const searchInput = document.getElementById("heroSearchInput") || document.querySelector(".search-input");
      const resultsDropdown = document.getElementById("searchResultsDropdown");
      if (!searchInput || !resultsDropdown) return;

      let debounceTimer = null;

      searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 1) {
          resultsDropdown.classList.remove("active");
          resultsDropdown.innerHTML = "";
          return;
        }

        debounceTimer = setTimeout(() => {
          if (!window.EcrioXRegistry) return;
          const matches = window.EcrioXRegistry.searchTools(query);

          if (window.EcrioXAnalytics) {
            window.EcrioXAnalytics.trackSearch(query, matches.length);
          }

          if (matches.length === 0) {
            resultsDropdown.innerHTML = `
              <div style="padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                No tools found matching "<strong>${this.escapeHtml(query)}</strong>".
              </div>
            `;
          } else {
            resultsDropdown.innerHTML = matches
              .map((tool) => {
                const isAvail = tool.status === "available";
                const badge = isAvail
                  ? `<span class="badge badge-available">Available</span>`
                  : `<span class="badge badge-coming-soon">Coming Soon</span>`;
                return `
                  <a href="${tool.route}" class="search-result-item" ${isAvail ? "" : "data-coming-soon='true'"}>
                    <div class="search-result-info">
                      <h4>${this.escapeHtml(tool.name)}</h4>
                      <p>${this.escapeHtml(tool.categoryName)} &bull; ${this.escapeHtml(tool.description)}</p>
                    </div>
                    <div>${badge}</div>
                  </a>
                `;
              })
              .join("");
          }

          resultsDropdown.classList.add("active");
        }, 150);
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !resultsDropdown.contains(e.target)) {
          resultsDropdown.classList.remove("active");
        }
      });

      // Handle click on coming-soon tools inside dropdown
      resultsDropdown.addEventListener("click", (e) => {
        const item = e.target.closest("[data-coming-soon='true']");
        if (item) {
          e.preventDefault();
          this.showToast("This tool is currently in active development. Coming very soon!");
        }
      });
    },

    /* -------------------------------------------------------------------------
       FAQ Accordions
       ------------------------------------------------------------------------- */
    initFaqAccordions: function () {
      document.querySelectorAll(".faq-item").forEach((item) => {
        const questionBtn = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        if (!questionBtn || !answer) return;

        questionBtn.addEventListener("click", () => {
          const isActive = item.classList.contains("active");

          // Close siblings if in accordion mode
          document.querySelectorAll(".faq-item.active").forEach((openItem) => {
            if (openItem !== item) {
              openItem.classList.remove("active");
              openItem.querySelector(".faq-answer").style.maxHeight = null;
            }
          });

          if (isActive) {
            item.classList.remove("active");
            answer.style.maxHeight = null;
          } else {
            item.classList.add("active");
            answer.style.maxHeight = answer.scrollHeight + 30 + "px";
          }
        });
      });
    },

    /* -------------------------------------------------------------------------
       Toast Notification System
       ------------------------------------------------------------------------- */
    initToasts: function () {
      if (!document.getElementById("toastContainer")) {
        const container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
      }
    },

    showToast: function (message) {
      const container = document.getElementById("toastContainer");
      if (!container) return;
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;
      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 3200);
    },

    escapeHtml: function (str) {
      if (!str) return "";
      return str.replace(/[&<>"']/g, function (m) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[m];
      });
    }
  };

  // Auto initialize on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => EcrioXApp.init());
  } else {
    EcrioXApp.init();
  }

  window.EcrioXApp = EcrioXApp;
})();
