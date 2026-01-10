// /js/core/config.js
(function () {
  "use strict";

  const CONFIG = Object.freeze({
    storage: {
      CART_KEY: "cart",
      AUTH_TOKEN_KEY: "authToken",
      CURRENT_USER_KEY: "currentUser",
      ROLE_KEY: "role",
    },
    ui: {
      FALLBACK_IMAGE: "../images/placeholder.png",
      DASHBOARD_PRODUCTS_LIMIT: 12,
    },
    cart: {
      FLAT_SHIPPING_GHS: 20,
    },
  });

  window.ShopUpConfig = CONFIG;
})();
