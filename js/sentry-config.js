// /js/sentry-config.js
(function () {
  // Sentry loader must be included BEFORE this file in the HTML <head>
  if (!window.Sentry) {
    console.warn("ℹ️ Sentry not loaded yet. Check loader script order.");
    return;
  }

  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".local");

  const environment = isLocal ? "development" : "production";

  window.Sentry.init({
    dsn: "https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040",

    environment,

    // ✅ Production sampling defaults
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 0.2,

    // ✅ Privacy-safe default
    sendDefaultPii: false
  });

  // ✅ Tags help you filter + route alerts
  window.Sentry.setTag("app", "ShopUp");
  window.Sentry.setTag("site", location.hostname);
  window.Sentry.setTag("page", location.pathname);

  // Optional: if you deploy from Vercel, you can set a release string manually later
  // window.Sentry.setTag("release", "shopup-web@1.0.0");

  // ✅ Browser context (useful for debugging)
  window.Sentry.setContext("browser", {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform
  });

  console.log("✅ Sentry initialized (central config)");
})();
