// /js/core/config.js
(function () {
  "use strict";

  // If already defined, keep it (allows server-side injected config too)
  if (window.ShopUpConfig) return;

  // Create a minimal config object used by services
  window.ShopUpConfig = Object.freeze({
    SUPABASE_URL: window.supabase?.supabaseUrl,
    SUPABASE_ANON_KEY: window.supabase?.supabaseKey,

    // Optional: app defaults (safe to extend later)
    APP_NAME: "ShopUp",
    CURRENCY: "GHS",
  });
})();
