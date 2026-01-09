// /js/supabase-init.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ✅ ShopUp Ghana (Production / Live)
const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

// Optional: quiet logs in production
const DEBUG = false;

// A ready promise any script can await: await window.supabaseReady;
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
      headers: {
        "x-application-name": "shopup-frontend",
      },
    },
  });

  // Attach to window for non-module scripts
  window.supabase = client;

  if (DEBUG) {
    console.log("✅ Supabase initialized (ShopUp Ghana)");
    console.log("📍 Project URL:", SUPABASE_URL);
    console.log("🔧 functions.invoke:", typeof window.supabase?.functions?.invoke);
  }

  return client;
})();

export {}; // keep this file as a module
