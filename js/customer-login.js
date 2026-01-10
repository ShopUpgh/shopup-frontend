// /js/customer-login.js
(function () {
  "use strict";

  // Ensure core is loaded
  const c = window.ShopUpContainer;

  // Register dependencies once
  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    c.register("config", () => window.ShopUpConfig);
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());
    c.register("authAdapter", (cc) =>
      window.ShopUpAuthAdapterFactory.createAuthAdapter({ supabaseWait: cc.resolve("supabaseWait") })
    );
    c.register("authService", (cc) =>
      window.ShopUpAuthServiceFactory.createAuthService({
        config: cc.resolve("config"),
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
      })
    );
  }

  window.ShopUpPages.initCustomerLoginPage(c);
})();
