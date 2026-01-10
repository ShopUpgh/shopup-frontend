// /js/customer-dashboard.js
(function () {
  "use strict";

  const c = window.ShopUpContainer;

  if (!c.__shopup_bootstrapped) {
    c.__shopup_bootstrapped = true;

    c.register("config", () => window.ShopUpConfig);
    c.register("supabaseWait", () => window.ShopUpSupabaseWait);
    c.register("logger", () => window.ShopUpLoggerFactory.createLogger());

    c.register("cartStorage", (cc) => window.ShopUpCartStorageFactory.createCartStorage(cc.resolve("config")));
    c.register("cartService", (cc) =>
      window.ShopUpCartServiceFactory.createCartService({
        cartStorage: cc.resolve("cartStorage"),
        logger: cc.resolve("logger"),
      })
    );

    c.register("productsAdapter", (cc) =>
      window.ShopUpProductsAdapterFactory.createProductsAdapter({ supabaseWait: cc.resolve("supabaseWait") })
    );
    c.register("productsService", (cc) =>
      window.ShopUpProductsServiceFactory.createProductsService({
        productsAdapter: cc.resolve("productsAdapter"),
        logger: cc.resolve("logger"),
      })
    );

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

  window.ShopUpPages.initCustomerDashboardPage(c);
})();
