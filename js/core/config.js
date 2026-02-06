// /js/core/config.js
(function () {
  "use strict";

  // PROOF MARKER (so we can confirm the right file loaded)
  window.__CONFIG_JS_LOADED_AT = new Date().toISOString();

  async function init() {
    // Wait for Supabase init if available
    if (window.supabaseReady) await window.supabaseReady;

    // Build config from supabase client
    if (window.supabase) {
      window.ShopUpConfig = Object.freeze({
        SUPABASE_URL: window.supabase.supabaseUrl,
        SUPABASE_ANON_KEY: window.supabase.supabaseKey,
        APP_NAME: "ShopUp",
        CURRENCY: "GHS",
      });
    } else {
      window.ShopUpConfig = Object.freeze({
        SUPABASE_URL: undefined,
        SUPABASE_ANON_KEY: undefined,
        APP_NAME: "ShopUp",
        CURRENCY: "GHS",
      });
    }

    return window.ShopUpConfig;
  }

  window.ShopUpConfigReady = init();
})();
