// /js/sentry-config.js
(function () {
  // ✅ Real DSN (no newline, no spaces)
  const SENTRY_DSN = "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

  // Only init if loader exists + DSN looks real
  const looksValid =
    typeof SENTRY_DSN === "string" &&
    SENTRY_DSN.startsWith("https://") &&
    !SENTRY_DSN.includes("your-sentry-dsn") &&
    SENTRY_DSN.includes("@") &&
    SENTRY_DSN.includes("sentry.io");

  if (!window.Sentry || !looksValid) {
    console.log("ℹ️ Sentry not initialized (missing SDK or invalid DSN)");
    return;
  }

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  window.Sentry.init({
    dsn: SENTRY_DSN,
    environment: isLocal ? "development" : "production",

    // Keep this modest in prod to avoid noise/cost
    tracesSampleRate: isLocal ? 1.0 : 0.2,

    beforeSend(event, hint) {
      try {
        const err = hint && hint.originalException;

        // Ignore common noise
        if (err && err.message && err.message.includes("chrome-extension://")) return null;
        if (event && event.exception && event.exception.values) {
          const msg = event.exception.values[0]?.value || "";
          if (msg.includes("ResizeObserver loop limit exceeded")) return null;
        }

        return event;
      } catch {
        return event;
      }
    },

    release: "shopup@1.0.0",
  });

  console.log("✅ Sentry initialized (central config)");
})();
