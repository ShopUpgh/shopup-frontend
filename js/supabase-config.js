// /js/supabase-config.js
// ✅ Compatibility Supabase init (NON-module) for older pages
// Requires: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

(function () {
  "use strict";

  // If module init already created window.supabase, do nothing
  if (window.supabase && window.supabase.auth) {
    console.log("✅ Supabase already initialized (using existing client).");
    return;
  }

  // Ensure library is present
  if (!window.supabase || !window.supabase.createClient) {
    console.warn("⚠️ supabase-js not loaded. Add: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    return;
  }

  // ✅ ShopUp Ghana (Production / Live)
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

  try {
    // Create client using UMD build
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { "x-application-name": "shopup-frontend" },
      },
    });

    // Expose as window.supabaseClient to avoid clobbering the library namespace
    window.supabaseClient = client;

    // Also set window.supabase to the client for older code that expects `supabase.auth...`
    // BUT only if window.supabase is still the library object (createClient exists)
    if (window.supabase && typeof window.supabase.createClient === "function") {
      window.supabase = client;
    }

    console.log("✅ Supabase initialized via supabase-config.js");
    console.log("📍 Project URL:", SUPABASE_URL);
  } catch (e) {
    console.error("❌ Supabase init failed in supabase-config.js", e);
  }
})();
