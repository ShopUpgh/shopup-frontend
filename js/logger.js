// /js/logger.js
(function () {
  console.log("🔍 Logger initialized");

  function safeJson(data) {
    try { return JSON.parse(JSON.stringify(data || {})); } catch { return {}; }
  }

  function captureToSentry(level, message, extra) {
    if (!window.Sentry) return;
    try {
      if (level === "error") {
        const err = extra instanceof Error ? extra : new Error(message);
        window.Sentry.captureException(err, { extra: { detail: safeJson(extra) } });
      } else {
        window.Sentry.captureMessage(message, { level, extra: safeJson(extra) });
      }
    } catch {}
  }

  window.logger = {
    info(msg, extra) {
      console.log("ℹ️ [INFO]", msg, extra || "");
      captureToSentry("info", msg, extra);
    },
    warn(msg, extra) {
      console.warn("⚠️ [WARN]", msg, extra || "");
      captureToSentry("warning", msg, extra);
    },
    error(msg, extra) {
      console.error("❌ [ERROR]", msg, extra || "");
      captureToSentry("error", msg, extra);
    },
    pageView(title) {
      const payload = {
        title,
        path: window.location.pathname,
        ts: new Date().toISOString(),
      };
      console.log("📄 Page view:", title, payload);
      captureToSentry("info", "page_view", payload);
    },
  };
})();
