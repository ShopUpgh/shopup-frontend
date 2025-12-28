// /js/logger.js
(function () {
  "use strict";

  const Logger = {
    info(message, data = {}) {
      console.log("ℹ️ [INFO]", message, data);
      if (window.Sentry) {
        Sentry.addBreadcrumb({
          category: "log",
          message,
          level: "info",
          data,
        });
      }
    },

    warn(message, data = {}) {
      console.warn("⚠️ [WARN]", message, data);
      if (window.Sentry) {
        Sentry.captureMessage(message, { level: "warning", extra: data });
      }
    },

    error(message, err) {
      console.error("❌ [ERROR]", message, err);
      if (window.Sentry) {
        Sentry.captureException(err || new Error(message));
      }
    },

    pageView(title) {
      console.log("📄 Page view:", title);
      if (window.Sentry) {
        Sentry.addBreadcrumb({
          category: "navigation",
          message: title,
          level: "info",
        });
      }
    },
  };

  window.Logger = Logger;

  console.log("🔍 Logger initialized");
})();
