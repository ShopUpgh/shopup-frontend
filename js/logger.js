// /js/logger.js - Production logging system
console.log("🔍 Logger initialized");

window.logger = {
  info: (message, data) => {
    console.log(`ℹ️ [INFO] ${message}`, data || "");
  },

  error: (message, error) => {
    console.error(`❌ [ERROR] ${message}`, error || "");

    // Send to Sentry if available
    if (window.Sentry) {
      try {
        if (error instanceof Error) {
          window.Sentry.captureException(error);
        } else if (typeof error === "string") {
          window.Sentry.captureMessage(error, "error");
        } else {
          window.Sentry.captureException(new Error(message));
        }
      } catch (e) {
        console.warn("⚠️ Failed to forward error to Sentry", e);
      }
    }
  },

  warn: (message, data) => {
    console.warn(`⚠️ [WARN] ${message}`, data || "");
  },

  debug: (message, data) => {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log(`🐛 [DEBUG] ${message}`, data || "");
    }
  },

  pageView: (pageName) => {
    console.log(`📄 Page view: ${pageName}`);

    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  },

  track: (eventName, properties) => {
    console.log(`📊 Event: ${eventName}`, properties || {});

    if (window.gtag) {
      window.gtag("event", eventName, properties);
    }
  }
};

// Log initial page load
window.logger.pageView(document.title);
