// /js/adapters/logger.adapter.js
(function () {
  "use strict";

  function safeJson(err) {
    try {
      if (err instanceof Error) {
        return { name: err.name, message: err.message, stack: err.stack };
      }
      return err;
    } catch {
      return { message: "Unserializable error" };
    }
  }

  function createLogger() {
    const hasSentry = typeof window.Sentry !== "undefined";

    function breadcrumb(category, message, data) {
      if (!hasSentry) return;
      window.Sentry.addBreadcrumb({
        category,
        message,
        level: "info",
        data: data || undefined,
      });
    }

    return {
      setUser(user) {
        if (hasSentry) window.Sentry.setUser(user || null);
      },
      pageView(title) {
        breadcrumb("navigation", `Page view: ${title}`, { title });
        if (window.logger && typeof window.logger.pageView === "function") {
          window.logger.pageView(title);
        }
      },
      info(message, data) {
        breadcrumb("info", message, data);
        console.info(message, data || "");
        if (window.logger && typeof window.logger.info === "function") window.logger.info(message, data);
      },
      warn(message, data) {
        breadcrumb("warn", message, data);
        console.warn(message, data || "");
        if (hasSentry) window.Sentry.captureMessage(message, { level: "warning", extra: data || undefined });
        if (window.logger && typeof window.logger.warn === "function") window.logger.warn(message, data);
      },
      error(message, err, data) {
        const payload = { ...(data || {}), error: safeJson(err) };
        console.error(message, payload);
        if (hasSentry) window.Sentry.captureException(err || new Error(message), { extra: payload });
        if (window.logger && typeof window.logger.error === "function") window.logger.error(message, payload);
      },
    };
  }

  window.ShopUpLoggerFactory = { createLogger };
})();
