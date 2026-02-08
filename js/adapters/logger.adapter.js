// /js/adapters/logger.adapter.js
(function () {
  "use strict";

  function safeSentry() {
    return typeof window !== "undefined" ? window.Sentry : undefined;
  }

  function safeCall(obj, fnName, ...args) {
    try {
      if (obj && typeof obj[fnName] === "function") return obj[fnName](...args);
    } catch (_) {}
    return undefined;
  }

  function createLogger() {
    return {
      info(msg, data) {
        console.log(msg, data || "");
        safeCall(safeSentry(), "addBreadcrumb", {
          category: "log",
          message: String(msg),
          level: "info",
          data: data || {},
        });
      },
      warn(msg, data) {
        console.warn(msg, data || "");
        safeCall(safeSentry(), "addBreadcrumb", {
          category: "log",
          message: String(msg),
          level: "warning",
          data: data || {},
        });
      },
      error(msg, data) {
        console.error(msg, data || "");
        safeCall(safeSentry(), "captureMessage", String(msg), {
          level: "error",
          extra: data || {},
        });
      },
      setUser(user) {
        // ✅ Some Sentry bundles don't have setUser
        safeCall(safeSentry(), "setUser", user || null);
      },
    };
  }

  window.ShopUpLoggerFactory = { createLogger };
})();
