// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    if (window.ShopUpConfig) return window.ShopUpConfig;

    if (window.supabaseReady) await window.supabaseReady;

    // ✅ Default storage keys used by services
    const storage = Object.freeze({
      AUTH_TOKEN_KEY: "authToken",
      CURRENT_USER_KEY: "currentUser",
      SESSION_EXPIRY_KEY: "sessionExpiry",
      ROLE_KEY: "role",
      CART_KEY: "cart",
    });

    window.ShopUpConfig = Object.freeze({
      // Supabase (Option A: derive from client)
      SUPABASE_URL: window.supabase?.supabaseUrl,
      SUPABASE_ANON_KEY: window.supabase?.supabaseKey,

      // App metadata
      APP_NAME: "ShopUp",
      CURRENCY: "GHS",

      // ✅ This is what your auth.service.js expects
      storage,
    });

    return window.ShopUpConfig;
  }

  window.ShopUpConfigReady = init();
})();
