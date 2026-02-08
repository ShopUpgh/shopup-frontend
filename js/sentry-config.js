// /js/sentry-config.js
(function () {
  const isProduction =
    location.hostname === "www.shopupgh.com" ||
    location.hostname === "shopupgh.com";

  if (!isProduction) {
    console.info("ℹ️ Sentry disabled (not production)");
    return;
  }

  const SENTRY_DSN =
    "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040";

  const looksValid =
    typeof SENTRY_DSN === "string" &&
    SENTRY_DSN.startsWith("https://") &&
    SENTRY_DSN.includes("@") &&
    SENTRY_DSN.includes("sentry.io") &&
    !SENTRY_DSN.includes("your-sentry-dsn");

  if (!window.Sentry || !looksValid) {
    console.info("ℹ️ Sentry not initialized (SDK missing or DSN invalid)");
    return;
  }

  window.Sentry.init({
    dsn: SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 0.0,   // ✅ disable tracing completely
    release: "shopup@1.0.0",
    beforeSend(event, hint) {
      try {
        const err = hint?.originalException;
        if (err?.message?.includes("chrome-extension://")) return null;

        const msg = event?.exception?.values?.[0]?.value || event?.message || "";
        if (msg.includes("ResizeObserver loop limit exceeded")) return null;

        return event;
      } catch {
        return event;
      }
    },
  });

  console.log("✅ Sentry initialized (production only)");
})();
