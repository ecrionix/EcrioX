/**
 * EcrioX - Safe Google Analytics & Google Tag Manager Event Dispatcher
 * Container ID: GTM-PQFRBJ9F | GA4 Measurement ID: G-N31KL5T2VY
 *
 * Privacy Enforcement:
 * - NO file contents, filenames, or path info is ever transmitted.
 * - NO personal data, emails, IP overrides, or sensitive values.
 * - Only generalized telemetry: tool category, tool ID, action type, status.
 */

(function (window) {
  "use strict";

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];

  const EcrioXAnalytics = {
    /**
     * Push a structured event to GTM dataLayer
     * @param {string} eventName
     * @param {Object} params
     */
    pushEvent: function (eventName, params) {
      if (!eventName) return;
      try {
        const payload = Object.assign(
          {
            event: eventName,
            timestamp: new Date().toISOString()
          },
          params || {}
        );
        window.dataLayer.push(payload);
        // Optional debug logger in development console
        if (window.location.hostname === "localhost" || window.location.search.includes("debug=true")) {
          console.log("[EcrioX Analytics]", eventName, payload);
        }
      } catch (err) {
        // Suppress any tracking exceptions so user experience is never impacted
        console.warn("[EcrioX Analytics Error]", err);
      }
    },

    /**
     * Triggered when a tool page is opened
     */
    trackToolOpen: function (toolId, toolCategory) {
      this.pushEvent("tool_open", {
        tool_name: toolId || "unknown_tool",
        tool_category: toolCategory || "general"
      });
    },

    /**
     * Triggered when user performs an action inside a tool
     */
    trackToolUse: function (toolId, actionType) {
      this.pushEvent("tool_use", {
        tool_name: toolId || "unknown_tool",
        action_type: actionType || "execute"
      });
    },

    /**
     * Triggered when a file is selected for client-side processing
     * PRIVACY: Only file extension/type and size bracket (e.g. "<5MB") is recorded; NEVER the filename.
     */
    trackFileUpload: function (toolId, fileType, sizeBytes) {
      let sizeBracket = "unknown";
      if (typeof sizeBytes === "number") {
        if (sizeBytes < 1024 * 1024) sizeBracket = "under_1mb";
        else if (sizeBytes < 5 * 1024 * 1024) sizeBracket = "1mb_to_5mb";
        else if (sizeBytes < 20 * 1024 * 1024) sizeBracket = "5mb_to_20mb";
        else sizeBracket = "over_20mb";
      }

      this.pushEvent("file_upload", {
        tool_name: toolId,
        file_format: fileType || "generic",
        file_size_bracket: sizeBracket
      });
    },

    /**
     * Triggered when client-side processing completes
     */
    trackProcessingComplete: function (toolId, durationMs) {
      this.pushEvent("processing_complete", {
        tool_name: toolId,
        duration_ms: Math.round(durationMs || 0)
      });
    },

    /**
     * Triggered when user downloads processed output
     */
    trackDownload: function (toolId, format) {
      this.pushEvent("download", {
        tool_name: toolId,
        download_format: format || "file"
      });
    },

    /**
     * Triggered when user navigates or views a category
     */
    trackCategoryView: function (categorySlug) {
      this.pushEvent("category_view", {
        category_name: categorySlug
      });
    },

    /**
     * Triggered when user searches the tools directory
     */
    trackSearch: function (query, resultCount) {
      if (!query) return;
      this.pushEvent("search", {
        search_term: query.slice(0, 40), // Truncate to avoid accidental long strings
        result_count: resultCount || 0
      });
    }
  };

  window.EcrioXAnalytics = EcrioXAnalytics;
})(window);
