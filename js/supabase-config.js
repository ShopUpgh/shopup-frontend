// /js/supabase-config.js
// Compatibility shim for BOTH:
//  A) Old pages using UMD script: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//  B) New module pages using: <script type="module" src="/js/supabase-init.js"></script>
//
// Goal: single source of truth everywhere:
//   - window.supabaseReady (Promise<client>)
//   - window.supabase (client instance, NOT the library)
//   - window.ShopUpSupabaseWait() helper for legacy scripts

(function () {
  "use strict";

  // ✅ Must match /js/supabase-init.js
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

  const DEBUG = false;

  const log = (...a) => DEBUG && console.log(...a);
  const warn = (...a) => DEBUG && console.warn(...a);

  function setWaitHelper() {
    window.ShopUpSupabaseWait = async function () {
      const client = await window.supabaseReady;
      if (!client) throw new Error("Supabase not initialized (supabaseReady returned null).");
      return client;
    };
  }

  // ---------------------------------------------
  // 1) If module init already exists, reuse it
  // ---------------------------------------------
  if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
    window.supabaseReady = window.supabaseReady.then((client) => {
      if (client && (!window.supabase || typeof window.supabase.createClient === "function")) {
        // If window.supabase is currently the LIB, replace with client
        window.supabase = client;
      }
      return client;
    });

    setWaitHelper();
    log("✅ supabase-config.js: reusing existing window.supabaseReady (module mode)");
    return;
  }

  // ---------------------------------------------
  // 2) If a client already exists, wrap it
  // ---------------------------------------------
  if (
    window.supabase &&
    window.supabase.auth &&
    typeof window.supabase.auth.getSession === "function" &&
    typeof window.supabase.from === "function"
  ) {
    window.supabaseReady = Promise.resolve(window.supabase);
    setWaitHelper();
    log("✅ supabase-config.js: wrapped existing window.supabase (already client)");
    return;
  }

  // ---------------------------------------------
  // 3) Otherwise we must create client via UMD LIB
  // ---------------------------------------------
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Supabase not initialized: missing SUPABASE_URL / SUPABASE_ANON_KEY");
    window.supabaseReady = Promise.resolve(null);
    setWaitHelper();
    return;
  }

  const lib = window.supabase; // In UMD mode, this is the LIB with createClient()

  if (!lib || typeof lib.createClient !== "function") {
    console.error(
      "❌ Supabase library not found.\n" +
        "Old pages must include:\n" +
        "  <script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script>\n" +
        "New pages must include:\n" +
        "  <script type=\"module\" src=\"/js/supabase-init.js\"></script>"
    );
    window.supabaseReady = Promise.resolve(null);
    setWaitHelper();
    return;
  }

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

    // Replace LIB reference with CLIENT instance
    window.supabase = client;

    warn("✅ Supabase client initialized (UMD) via /js/supabase-config.js");
    return client;
  })();

  setWaitHelper();
})();
