(function () {
  "use strict";

  window.ShopUpSentry = window.ShopUpSentry || {};

  window.ShopUpSentry.setUserSafe = function (user) {
    try {
      // Different Sentry bundles expose different APIs.
      // The most reliable in browser is to use setUser on the current scope if available.
      if (typeof Sentry === "undefined") return;

      if (typeof Sentry.setUser === "function") {
        Sentry.setUser(user || null);
        return;
      }

      // Fallback: scope-based
      if (typeof Sentry.getCurrentScope === "function") {
        const scope = Sentry.getCurrentScope();
        if (scope && typeof scope.setUser === "function") scope.setUser(user || null);
      }
    } catch (_) {}
  };

  window.ShopUpSentry.captureExceptionSafe = function (err) {
    try {
      if (typeof Sentry === "undefined") return;
      if (typeof Sentry.captureException === "function") Sentry.captureException(err);
    } catch (_) {}
  };

  window.ShopUpSentry.breadcrumbSafe = function (crumb) {
    try {
      if (typeof Sentry === "undefined") return;
      if (typeof Sentry.addBreadcrumb === "function") Sentry.addBreadcrumb(crumb);
    } catch (_) {}
  };
})();
