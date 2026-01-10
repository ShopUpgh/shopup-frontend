// /js/supabase-init.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4"; // from Settings → API

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("PASTE_")) {
  console.error("❌ Supabase init failed: Missing/invalid URL or ANON KEY");
}

window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

window.supabaseReady = (async () => {
  try {
    // quick sanity check: fetch session
    const { data, error } = await window.supabase.auth.getSession();
    if (error) throw error;
    console.log("✅ Supabase ready. Session user:", data?.session?.user?.id || "none");
    return window.supabase;
  } catch (e) {
    console.error("❌ Supabase ready check failed:", e?.message || e);
    throw e;
  }
})();
