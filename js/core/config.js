// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    // If already set, keep it (supports server-injected config too)
    if (window.ShopUpConfig) return window.ShopUpConfig;

    // Wait for Supabase module init
    if (window.supabaseReady) {
      await window.supabaseReady;
    }

    // At this point supabase-init.js should have set window.supabase
    if (!window.supabase) {
      // Don't throw hard here—keep diagnostics clear
      console.error("[ShopUpConfig] window.supabase not found. Ensure /js/supabase-init.js is included and working.");
      window.ShopUpConfig = Object.freeze({
        SUPABASE_URL: undefined,
        SUPABASE_ANON_KEY: undefined,
        APP_NAME: "ShopUp",
        CURRENCY: "GHS",
      });
      return window.ShopUpConfig;
    }

    window.ShopUpConfig = Object.freeze({
      SUPABASE_URL: window.supabase.supabaseUrl,
      SUPABASE_ANON_KEY: window.supabase.supabaseKey,
      APP_NAME: "ShopUp",
      CURRENCY: "GHS",
    });

    return window.ShopUpConfig;
  }

  // A promise any page/service can await
  window.ShopUpConfigReady = init();
})();
