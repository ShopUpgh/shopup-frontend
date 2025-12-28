// /js/sentry-config.js
(function () {
  "use strict";

  // ✅ REAL DSN — MUST MATCH YOUR PROJECT
  const SENTRY_DSN =
    "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

  // Guard: SDK must exist
  if (!window.Sentry) {
    console.info("ℹ️ Sentry SDK not loaded");
    return;
  }

  // Guard: DSN must be valid
  if (
    !SENTRY_DSN ||
    SENTRY_DSN.includes("your-sentry-dsn") ||
    !SENTRY_DSN.startsWith("https://")
  ) {
    console.warn("ℹ️ Sentry not initialized (DSN not configured)");
    return;
  }

  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  window.Sentry.init({
    dsn: SENTRY_DSN,
    environment: isLocal ? "development" : "production",
    tracesSampleRate: isLocal ? 1.0 : 0.2,
    release: "shopup@1.0.0",

    beforeSend(event) {
      // Filter browser noise
      const msg = event?.exception?.values?.[0]?.value || "";
      if (msg.includes("ResizeObserver loop")) return null;
      if (msg.includes("chrome-extension://")) return null;
      return event;
    },
  });

  console.log("✅ Sentry initialized (central config)");
})();
