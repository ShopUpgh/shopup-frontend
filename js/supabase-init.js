// /js/supabase-init.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ✅ ShopUp Ghana (Production / Live) — replace with your current Supabase project values
const SUPABASE_URL = "https://PASTE_YOUR_PROJECT_URL.supabase.co";
const SUPABASE_ANON_KEY = "PASTE_YOUR_CURRENT_ANON_KEY";

// Optional: quiet logs in production
const DEBUG = false;

// ✅ Prevent double init if imported multiple times
if (!window.supabaseReady) {
  window.supabaseReady = (async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("⚠️ Supabase not initialized: missing SUPABASE_URL / SUPABASE_ANON_KEY");
      return null;
    }

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { "x-application-name": "shopup-frontend" },
      },
    });

    window.supabase = client;

    if (DEBUG) {
      console.log("✅ Supabase initialized (ShopUp Ghana)");
      console.log("📍 Project URL:", SUPABASE_URL);
    }

    return client;
  })();
}

export {}; // keep this file as a module
