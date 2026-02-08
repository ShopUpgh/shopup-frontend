(function () {
  "use strict";

  const isProd =
    location.hostname === "shopupgh.com" ||
    location.hostname === "www.shopupgh.com";

  // Create a safe wrapper namespace (we will NOT call window.Sentry.setUser directly)
  window.ShopUpSentry = window.ShopUpSentry || {
    enabled: false,
    setUserSafe: () => {},
    captureExceptionSafe: () => {},
    breadcrumbSafe: () => {},
  };

  if (!isProd) {
    console.log("✅ Sentry disabled (not production)");
    return;
  }

  try {
    if (typeof Sentry !== "undefined" && typeof Sentry.init === "function") {
      Sentry.init({
        dsn: "https://c4c92ac8539373f9c497ba50f31a9900@o4500000000000000.ingest.us.sentry.io/4500000000000000",
        tracesSampleRate: 0.05,
      });

      window.ShopUpSentry.enabled = true;
      console.log("✅ Sentry initialized (production only)");
    } else {
      console.warn("[ShopUp] Sentry SDK not available");
    }
  } catch (e) {
    console.warn("[ShopUp] Sentry init failed:", e);
  }
})();
