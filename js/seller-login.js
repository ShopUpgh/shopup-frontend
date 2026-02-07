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

    // ✅ Config: always wait for ShopUpConfigReady before returning config
    c.register("config", async () => {
      try {
        await window.ShopUpConfigReady;
      } catch (_) {}
      return window.ShopUpConfig;
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

    // ✅ Auth service with role: seller (do NOT pass fallback {})
    c.register("authService", async (cc) =>
      window.ShopUpAuthServiceFactory.createAuthService({
        config: await cc.resolve("config"),
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
        role: "seller",
      })
    );
  }

  // Ensure page controller exists
  if (!window.ShopUpPages?.initSellerLoginPage) {
    console.error("[ShopUp] Missing initSellerLoginPage. Check /js/pages/seller-login.page.js");
    return;
  }

  // Init page (wait for config if available, but don't block forever)
  Promise.resolve(window.ShopUpConfigReady)
    .catch(() => null)
    .finally(() => window.ShopUpPages.initSellerLoginPage(c));
})();
