// /js/adapters/supabase.wait.js
(function () {
  "use strict";

  async function waitForSupabase() {
    if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
      const client = await window.supabaseReady;
      if (client) {
        window.supabase = window.supabase || client;
        return client;
      }
    }

    if (window.supabase && window.supabase.auth) return window.supabase;

    throw new Error("Supabase not ready. Check /js/supabase-init.js.");
  }

  window.ShopUpSupabaseWait = { waitForSupabase };
})();
