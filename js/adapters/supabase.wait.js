// /js/adapters/supabase.wait.js
(function () {
  "use strict";

  async function waitForSupabase() {
    const client = await window.supabaseReady;
    if (!client) throw new Error("Supabase not ready. Check /js/supabase-init.js");
    window.supabase = window.supabase || client;
    return client;
  }

  window.ShopUpSupabaseWait = { waitForSupabase };
})();
