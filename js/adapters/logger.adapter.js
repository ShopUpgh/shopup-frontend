// /js/adapters/logger.adapter.js
(function () {
  "use strict";

  function safeSentrySetUser(user) {
    const S = window.Sentry;
    if (!S) return;

    try {
      // Some bundles expose setUser directly
      if (typeof S.setUser === "function") {
        S.setUser(user || null);
        return;
      }

      // Newer SDK patterns
      if (typeof S.getCurrentScope === "function") {
        const scope = S.getCurrentScope();
        if (scope && typeof scope.setUser === "function") {
          scope.setUser(user || null);
          return;
        }
      }

      // Older SDK patterns
      if (typeof S.configureScope === "function") {
        S.configureScope((scope) => {
          if (scope && typeof scope.setUser === "function") scope.setUser(user || null);
        });
      }
    } catch (_) {}
  }

  function createLogger() {
    return {
      info(msg, data) {
        console.log(msg, data || "");
        try {
          window.SentryTracking?.trackUserAction?.(msg, data || {});
        } catch (_) {}
      },
      warn(msg, data) {
        console.warn(msg, data || "");
      },
      error(msg, data) {
        console.error(msg, data || "");
      },
      pageView(title) {
        try {
          window.Sentry?.addBreadcrumb?.({
            category: "navigation",
            message: String(title || "Page View"),
            level: "info",
          });
        } catch (_) {}
      },
      setUser(user) {
        safeSentrySetUser(user);
      },
    };
  }

  window.ShopUpLoggerFactory = { createLogger };
})();
