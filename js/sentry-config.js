// /js/sentry-config.js
(function () {
  // Sentry loader must be included BEFORE this file
  if (!window.Sentry) {
    console.warn("ℹ️ Sentry not loaded. Check loader script order.");
    return;
  }

  const SENTRY_DSN =
    "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

  const isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  window.Sentry.init({
    dsn: SENTRY_DSN,
    environment: isLocal ? "development" : "production",

    // Production sampling defaults
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.2,

    sendDefaultPii: false,

    beforeSend(event, hint) {
      const err = hint && hint.originalException;

      // Ignore common extension noise
      if (err && err.message && err.message.includes("chrome-extension://")) {
        return null;
      }

      return event;
    }
  });

  // Tags
  window.Sentry.setTag("app", "ShopUp");
  window.Sentry.setTag("site", location.hostname);
  window.Sentry.setTag("page", location.pathname);

  // Browser context
  window.Sentry.setContext("browser", {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform
  });

  console.log("✅ Sentry initialized (central config)");
})();
