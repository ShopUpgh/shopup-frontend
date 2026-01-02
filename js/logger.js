// /js/logger.js
// Production-safe logging utility - silences console logs in production
(() => {
  const host = (location.hostname || "").toLowerCase();

  // Treat your real domain + vercel prod alias as production
  const IS_PROD =
    host === "shopupgh.com" ||
    host === "www.shopupgh.com" ||
    host.endsWith(".shopupgh.com");

  // Only allow logs in non-prod
  const canLog = !IS_PROD;

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

  // Safe logger API (your code can call window.log.* anywhere)
  window.log = {
    info: (...args) => canLog && console.info(...args),
    warn: (...args) => canLog && console.warn(...args),
    debug: (...args) => canLog && console.debug(...args),
    log: (...args) => canLog && console.log(...args),
    
    // Always allow errors (but keep them minimal in prod)
    error: (...args) => console.error(...args),
  };

  // Legacy support: keep window.logger for backward compatibility
  window.logger = {
    info(msg, extra) {
      if (canLog) console.log("ℹ️ [INFO]", msg, extra || "");
      captureToSentry("info", msg, extra);
    },
    warn(msg, extra) {
      if (canLog) console.warn("⚠️ [WARN]", msg, extra || "");
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
      if (canLog) console.log("📄 Page view:", title, payload);
      captureToSentry("info", "page_view", payload);
    },
  };

  // Optional: hard-silence direct console.* in production
  // Note: This intentionally overrides console methods to eliminate noise in production.
  // Third-party libraries should use their own logging mechanisms or window.log API.
  // Errors and warnings are preserved for critical issue detection.
  if (IS_PROD) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    // keep warn/error so you can still see real problems
  }

  window.log.info("🔍 Logger initialized", { IS_PROD });
})();
