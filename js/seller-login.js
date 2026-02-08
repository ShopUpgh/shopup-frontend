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

    // Core config
    c.register("configReady", () => window.ShopUpConfigReady);
    c.register("config", () => window.ShopUpConfig);

    // Supabase + logger
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());

    // Auth adapter
    c.register("authAdapter", (cc) =>
      window.ShopUpAuthAdapterFactory.createAuthAdapter({
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );

    // ✅ Auth service role=seller
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

  // Wait for config init (but do not block forever)
  Promise.resolve(window.ShopUpConfigReady)
    .catch(() => null)
    .finally(() => window.ShopUpPages.initSellerLoginPage(c));
})();
