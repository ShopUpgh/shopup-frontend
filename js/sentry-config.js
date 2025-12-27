// /js/sentry-config.js
(function () {
  // ✅ Your real DSN
  const SENTRY_DSN =
    "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

  // ✅ Accept all Sentry domains (including regional ingest.*.sentry.io)
  const looksValid =
    typeof SENTRY_DSN === "string" &&
    SENTRY_DSN.startsWith("https://") &&
    SENTRY_DSN.includes("@") &&
    SENTRY_DSN.includes("/") &&
    !SENTRY_DSN.includes("your-sentry-dsn") &&
    // Accept: sentry.io OR ingest.<region>.sentry.io
    (SENTRY_DSN.includes(".sentry.io") || SENTRY_DSN.includes("sentry.io"));

  // Must have SDK loaded first
  if (!window.Sentry || !looksValid) {
    // Don’t spam console in production
    return;
  }

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Optional: enable tracing if the function exists in this SDK build
  // (safe check so we don't break if it’s not present)
  const integrations = [];
  if (typeof window.Sentry.browserTracingIntegration === "function") {
    integrations.push(window.Sentry.browserTracingIntegration());
  }

  window.Sentry.init({
    dsn: SENTRY_DSN,
    environment: isLocal ? "development" : "production",

    // Keep modest in prod to avoid cost/noise
    tracesSampleRate: isLocal ? 1.0 : 0.2,

    integrations,

    beforeSend(event, hint) {
      try {
        const err = hint && hint.originalException;

        // Ignore common noise
        if (err && err.message && err.message.includes("chrome-extension://")) return null;

        const msg = event?.exception?.values?.[0]?.value || "";
        if (msg.includes("ResizeObserver loop limit exceeded")) return null;

        return event;
      } catch {
        return event;
      }
    },

    release: "shopup@1.0.0",
  });

  // Optional debug only in local
  if (isLocal) console.log("✅ Sentry initialized (central config)");
})();
