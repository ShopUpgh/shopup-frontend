// /js/adapters/supabase.wait.js
(function () {
  "use strict";

  async function waitForSupabase(maxMs = 12000) {
    const start = Date.now();

    // If module init promise exists, await it
    if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
      try {
        await Promise.race([
          window.supabaseReady,
          new Promise((_, rej) => setTimeout(() => rej(new Error("Timed out waiting for supabaseReady")), maxMs)),
        ]);
      } catch (e) {
        // continue to polling fallback
      }
    }

    // Poll fallback (covers edge cases)
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }

    if (!window.supabase || !window.supabase.auth) {
      throw new Error("Supabase not ready. Check /js/supabase-init.js is loaded and sets window.supabase.");
    }

    return window.supabase;
  }

  window.ShopUpSupabaseWait = { waitForSupabase };
})();
