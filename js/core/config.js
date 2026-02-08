// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    // If already built, reuse
    if (window.ShopUpConfig && window.ShopUpConfig.storage) return window.ShopUpConfig;

    // Wait for Supabase module init if available
    if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
      await window.supabaseReady;
    }

    const storage = Object.freeze({
      AUTH_TOKEN_KEY: "authToken",
      CURRENT_USER_KEY: "currentUser",
      SESSION_EXPIRY_KEY: "sessionExpiry",
      ROLE_KEY: "role",
      CART_KEY: "cart",
    });

    window.ShopUpConfig = Object.freeze({
      SUPABASE_URL: window.supabase?.supabaseUrl,
      SUPABASE_ANON_KEY: window.supabase?.supabaseKey,
      APP_NAME: "ShopUp",
      CURRENCY: "GHS",
      storage,
    });

    return window.ShopUpConfig;
  }

  window.ShopUpConfigReady = init();
})();
