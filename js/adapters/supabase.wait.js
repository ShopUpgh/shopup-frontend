// /js/adapters/supabase.wait.js
(function () {
  "use strict";

  async function waitForSupabase(maxMs = 8000) {
    const start = Date.now();
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!window.supabase) throw new Error("Supabase not ready. Check /js/supabase-init.js or supabase-config.js.");
    return window.supabase;
  }

  window.ShopUpSupabaseWait = { waitForSupabase };
})();
