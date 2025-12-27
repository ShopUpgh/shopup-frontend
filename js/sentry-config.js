// /js/sentry-config.js
(function () {
  const SENTRY_DSN =
    "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

  const looksValid =
    typeof SENTRY_DSN === "string" &&
    SENTRY_DSN.startsWith("https://") &&
    SENTRY_DSN.includes("@") &&
    !SENTRY_DSN.includes("your-sentry-dsn") &&
    // ✅ accept both sentry.io and ingest.<region>.sentry.io
    (/\.sentry\.io\/\d+/.test(SENTRY_DSN) || /ingest\.[a-z0-9-]+\.sentry\.io\/\d+/.test(SENTRY_DSN));

  if (!window.Sentry || !looksValid) {
    console.log("ℹ️ Sentry not initialized (DSN not configured)");
    return;
  }

  const isLocal =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";

  window.Sentry.init({
    dsn: SENTRY_DSN,
    environment: isLocal ? "development" : "production",
    tracesSampleRate: isLocal ? 1.0 : 0.2,
    release: "shopup@1.0.0",
  });

  console.log("✅ Sentry initialized (central config)");
})();
