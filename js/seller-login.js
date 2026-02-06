// /js/seller-login.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    c.register("configReady", () => window.ShopUpConfigReady);
    c.register("config", () => window.ShopUpConfig);

    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());

    c.register("authAdapter", (cc) =>
      window.ShopUpAuthAdapterFactory.createAuthAdapter({
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );

    // ✅ Ensure config is ready before creating authService
    c.register("authService", (cc) => {
      // If config isn't ready yet, throw a clear error (caught by controller) OR wait in controller
      const cfg = cc.resolve("config");
      if (!cfg?.storage) {
        throw new Error("ShopUpConfig not ready or missing storage keys. Ensure /js/core/config.js is loaded.");
      }

      return window.ShopUpAuthServiceFactory.createAuthService({
        config: cfg,
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
      });
    });
  }

  if (!window.ShopUpPages?.initSellerLoginPage) {
    console.error("[ShopUp] Missing initSellerLoginPage. Check /js/pages/seller-login.page.js");
    return;
  }

  Promise.resolve(window.ShopUpConfigReady)
    .catch(() => null)
    .finally(() => window.ShopUpPages.initSellerLoginPage(c));
})();
