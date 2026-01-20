// /js/supabase-config.js
(function () {
  "use strict";

  // ✅ MUST match your Supabase project (URL + ANON PUBLIC KEY)
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4E";

  const DEBUG = false;

  function log(...args) {
    if (DEBUG) console.log(...args);
  }

  // ---------------------------------------
  // 1) If module init already exists, reuse it
  // ---------------------------------------
  if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
    window.ShopUpSupabaseWait = async function () {
      const client = await window.supabaseReady;
      if (!client) throw new Error("Supabase not initialized (supabaseReady returned null).");
      window.supabase = window.supabase || client;
      return client;
    };

    log("✅ supabase-config: using existing window.supabaseReady (module init)");
    return;
  }

  // ---------------------------------------
  // 2) If a client already exists, wrap it
  // ---------------------------------------
  if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getSession === "function") {
    window.supabaseReady = Promise.resolve(window.supabase);
    window.ShopUpSupabaseWait = async () => window.supabase;
    log("✅ supabase-config: existing supabase client detected");
    return;
  }

  // ---------------------------------------
  // 3) Otherwise, create client from UMD library
  // ---------------------------------------
  const lib = window.supabase; // UMD library exposes createClient()

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("PASTE_YOUR_CURRENT")) {
    console.error("❌ Supabase not initialized: missing/placeholder SUPABASE_URL or SUPABASE_ANON_KEY");
    window.supabaseReady = Promise.resolve(null);
    return;
  }

  if (!lib || typeof lib.createClient !== "function") {
    console.error(
      "❌ Supabase UMD library not found.\n" +
        "For non-module pages include:\n" +
        "  <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script>\n" +
        "For module pages include:\n" +
        "  <script type='module' src='/js/supabase-init.js'></script>"
    );
    window.supabaseReady = Promise.resolve(null);
    return;
  }

  window.supabaseReady = (async () => {
    const client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { headers: { "x-application-name": "shopup-frontend" } },
    });

    // ✅ Make sure global window.supabase is the CLIENT (not the library)
    window.supabase = client;

    window.ShopUpSupabaseWait = async () => client;

    log("✅ Supabase client initialized via supabase-config.js (UMD mode)");
    return client;
  })();
})();
