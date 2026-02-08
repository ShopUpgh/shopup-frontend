// /js/seller-login.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // Bootstrap DI only once
  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    // Always register the READY promise
    c.register("configReady", () => window.ShopUpConfigReady);

    // ✅ Register config as a PROMISE-backed resolver (prevents race conditions)
    c.register("config", () => {
      // return the object if already present
      if (window.ShopUpConfig) return window.ShopUpConfig;

      // otherwise, return a placeholder; services should use safe defaults anyway
      // (auth.service.js already does)
      return {};
    });

    // Supabase + logger
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());

    // Auth adapter
    c.register("authAdapter", (cc) =>
      window.ShopUpAuthAdapterFactory.createAuthAdapter({
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );

    // ✅ Auth service with role seller (auth.service.js already safe-defaults config.storage)
    c.register("authService", (cc) =>
      window.ShopUpAuthServiceFactory.createAuthService({
        config: cc.resolve("config"),
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
        role: "seller",
      })
    );
  }

  if (!window.ShopUpPages?.initSellerLoginPage) {
    console.error("[ShopUp] Missing initSellerLoginPage. Check /js/pages/seller-login.page.js");
    return;
  }

  // ✅ Wait for config to be ready BEFORE page init
  Promise.resolve(window.ShopUpConfigReady)
    .catch(() => null)
    .finally(() => window.ShopUpPages.initSellerLoginPage(c));
})();
