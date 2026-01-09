// /js/supabase-config.js
(function () {
  // ✅ Put your real credentials here
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

  // ✅ If already initialized, do nothing (prevents breaking other pages)
  if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getSession === "function") {
    return;
  }

  // Supabase v2 CDN exposes createClient at window.supabase
  const lib = window.supabase;

  if (!lib || typeof lib.createClient !== "function") {
    console.error("❌ Supabase library not loaded. Make sure you included the CDN first.");
    return;
  }

  const client = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  // ✅ Backward-compatible: pages using `supabase.auth...` will work
  window.supabaseClient = client; // optional
  window.supabase = client;

  console.log("✅ Supabase client initialized");
})();
