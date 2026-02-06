// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    if (window.ShopUpConfig) return window.ShopUpConfig;
    if (window.supabaseReady) await window.supabaseReady;

    window.ShopUpConfig = Object.freeze({
      SUPABASE_URL: window.supabase?.supabaseUrl,
      SUPABASE_ANON_KEY: window.supabase?.supabaseKey,
      APP_NAME: "ShopUp",
      CURRENCY: "GHS",
    });

    return window.ShopUpConfig;
  }

  window.ShopUpConfigReady = init();
})();
