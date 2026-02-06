// /js/customer-dashboard.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;
  if (!c) {
    console.error("[ShopUp] ShopUpContainer not found. Check script order.");
    return;
  }

  // One bootstrap (register once)
  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    c.register("config", () => window.ShopUpConfig);
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());

    c.register("authAdapter", (cc) =>
      window.ShopUpAuthAdapterFactory.createAuthAdapter({
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );

    c.register("productsAdapter", (cc) =>
      window.ShopUpProductsAdapterFactory.createProductsAdapter({
        supabaseWait: cc.resolve("supabaseWait"),
      })
    );

    c.register("cartStorage", () =>
      window.ShopUpCartStorageFactory.createCartStorage()
    );

    c.register("authService", (cc) =>
      window.ShopUpAuthServiceFactory.createAuthService({
        config: cc.resolve("config"),
        authAdapter: cc.resolve("authAdapter"),
        logger: cc.resolve("logger"),
      })
    );

    c.register("productsService", (cc) =>
      window.ShopUpProductsServiceFactory.createProductsService({
        config: cc.resolve("config"),
        productsAdapter: cc.resolve("productsAdapter"),
        logger: cc.resolve("logger"),
      })
    );

    c.register("cartService", (cc) =>
      window.ShopUpCartServiceFactory.createCartService({
        config: cc.resolve("config"),
        cartStorage: cc.resolve("cartStorage"),
        logger: cc.resolve("logger"),
      })
    );
  }

  // Run the controller
  if (!window.ShopUpPages?.initCustomerDashboardPage) {
    console.error("[ShopUp] Missing initCustomerDashboardPage. Check /js/pages/customer-dashboard.page.js");
    return;
  }

  window.ShopUpPages.initCustomerDashboardPage(c);
})();
