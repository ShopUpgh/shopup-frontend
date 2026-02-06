// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    if (window.ShopUpConfig) return;

    // Wait for module init
    if (window.supabaseReady) await window.supabaseReady;

    window.ShopUpConfig = Object.freeze({
      SUPABASE_URL: window.supabase?.supabaseUrl,
      SUPABASE_ANON_KEY: window.supabase?.supabaseKey,
      APP_NAME: "ShopUp",
      CURRENCY: "GHS",
    });
  }

  // Expose a ready promise if you want to wait on config later
  window.shopUpConfigReady = init();
})();
