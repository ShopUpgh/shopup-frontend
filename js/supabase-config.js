// Deprecated: Supabase is initialized via /js/supabase-init.js.
// This stub prevents double-initialization if old script tags remain.
(function () {
  if (typeof window === "undefined") return;
  if (!window.supabaseReady) {
    console.warn("Load /js/supabase-init.js for Supabase setup.");
  }
})();
