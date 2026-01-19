// /js/supabase-config.js
(function () {
  "use strict";

  // ✅ Must match /js/supabase-init.js
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

  const DEBUG = false;

  // -----------------------------
  // Goal:
  // - Single source of truth: window.supabase + window.supabaseReady
  // - If module init already set it, do nothing.
  // - If not, create via UMD library window.supabase.createClient(...)
  // -----------------------------

  function warn(msg) {
    if (DEBUG) console.warn(msg);
  }

  function info(msg) {
    if (DEBUG) console.log(msg);
  }

  // If supabase-init.js already created window.supabaseReady, just reuse it.
  if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
    window.supabaseReady = window.supabaseReady.then((client) => {
      if (client && !window.supabase) window.supabase = client;
      return client;
    });

    // Provide the adapter used by your DI setup (cart/checkout/etc.)
    window.ShopUpSupabaseWait = async function () {
      const client = await window.supabaseReady;
      if (!client) throw new Error("Supabase not initialized (supabaseReady returned null).");
      return client;
    };

    info("✅ supabase-config.js: using existing window.supabaseReady");
    return;
  }

  // If a global client already exists (rare), wrap it.
  if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getSession === "function") {
    window.supabaseReady = Promise.resolve(window.supabase);

    window.ShopUpSupabaseWait = async function () {
      return window.supabase;
    };

    info("✅ supabase-config.js: wrapped existing window.supabase");
    return;
  }

  // Otherwise we must create from the UMD library:
  // The UMD library exposes: window.supabase.createClient(...)
  const lib = window.supabase;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Supabase not initialized: missing SUPABASE_URL / SUPABASE_ANON_KEY");
    window.supabaseReady = Promise.resolve(null);
    return;
  }

  if (!lib || typeof lib.createClient !== "function") {
    console.error(
      "❌ Supabase UMD library not found. If this is a module page, use /js/supabase-init.js. " +
        "If not, ensure you included: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
    );
    window.supabaseReady = Promise.resolve(null);
    return;
  }

  // ✅ Create ONE client (UMD mode)
  window.supabaseReady = (async () => {
    const client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { "x-application-name": "shopup-frontend" },
      },
    });

    // Replace window.supabase (lib) with the client instance (intentional)
    window.supabase = client;

    // DI helper expected by your factories
    window.ShopUpSupabaseWait = async function () {
      return client;
    };

    warn("✅ Supabase client initialized (UMD) via /js/supabase-config.js");
    return client;
  })();
})();
