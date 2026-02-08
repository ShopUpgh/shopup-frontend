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
    c.register("config", () => window.ShopUpConfig || {});

    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());

    c.register("authAdapter", (cc) =>
      window.ShopUpAuthAdapterFactory.createAuthAdapter({
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );

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

  Promise.resolve(window.ShopUpConfigReady)
    .catch(() => null)
    .finally(() => window.ShopUpPages.initSellerLoginPage(c));
})();
