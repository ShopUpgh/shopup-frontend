// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    if (window.ShopUpConfig) return window.ShopUpConfig;

    // Wait for module init to create window.supabase
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
      // Supabase derived from the client created in supabase-init.js
      SUPABASE_URL: window.supabase?.supabaseUrl,
      SUPABASE_ANON_KEY: window.supabase?.supabaseKey,

      APP_NAME: "ShopUp",
      CURRENCY: "GHS",

      // ✅ required by auth.service.js (and other services)
      storage,
    });

    return window.ShopUpConfig;
  }

  window.ShopUpConfigReady = init();
})();
