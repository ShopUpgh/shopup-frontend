// /js/logger.js
(function () {
  console.log("🔍 Logger initialized");

  function captureToSentry(level, message, extra) {
    if (!window.Sentry) return;

    try {
      if (level === "error") {
        const err = extra instanceof Error ? extra : new Error(message);
        window.Sentry.captureException(err, { extra: { detail: extra } });
      } else {
        window.Sentry.captureMessage(message, {
          level,
          extra: extra || {},
        });
      }
    } catch {}
  }

  window.logger = {
    info(message, data) {
      console.log(`ℹ️ [INFO] ${message}`, data || "");
    },
    warn(message, data) {
      console.warn(`⚠️ [WARN] ${message}`, data || "");
      captureToSentry("warning", message, data);
    },
    error(message, error) {
      console.error(`❌ [ERROR] ${message}`, error || "");
      captureToSentry("error", message, error || new Error(message));
    },
    debug(message, data) {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (isLocal) console.log(`🐛 [DEBUG] ${message}`, data || "");
    },
    pageView(pageName) {
      console.log(`📄 Page view: ${pageName}`);
      if (window.gtag) {
        window.gtag("event", "page_view", {
          page_title: pageName,
          page_location: window.location.href,
          page_path: window.location.pathname,
        });
      }
    },
    track(eventName, properties) {
      console.log(`📊 Event: ${eventName}`, properties || {});
      if (window.gtag) window.gtag("event", eventName, properties);
    },
  };

  window.logger.pageView(document.title);
})();
