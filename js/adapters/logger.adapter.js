(function () {
  "use strict";

  function createLogger() {
    return {
      setUser(user) {
        window.ShopUpSentry?.setUserSafe?.(user || null);
      },
      info(msg, meta) {
        try { console.log(msg, meta || ""); } catch (_) {}
      },
      warn(msg, meta) {
        try { console.warn(msg, meta || ""); } catch (_) {}
      },
      error(msg, meta) {
        try { console.error(msg, meta || ""); } catch (_) {}
      },
      captureException(err) {
        window.ShopUpSentry?.captureExceptionSafe?.(err);
      },
      breadcrumb(crumb) {
        window.ShopUpSentry?.breadcrumbSafe?.(crumb);
      },
    };
  }

  window.ShopUpLoggerFactory = { createLogger };
})();
