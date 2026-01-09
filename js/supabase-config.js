// /js/supabase-config.js
(function () {
  // ✅ IMPORTANT: paste the REAL values from Supabase Project Settings → API
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

  // ✅ keep a reference to the library before we overwrite window.supabase
  const supabaseLib = window.supabase;

  if (!supabaseLib || typeof supabaseLib.createClient !== "function") {
    console.error("❌ Supabase library not loaded. Make sure the CDN is loaded BEFORE this file.");
    return;
  }

  // ✅ Create client
  const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // ✅ expose both (so nothing breaks)
  window.supabaseLib = supabaseLib;     // library
  window.supabaseClient = client;       // client (optional)
  window.supabase = client;             // client (your existing pages use this)

  console.log("✅ Supabase client initialized");

  // ✅ If there is a broken/old session, clear it once to stop refresh spam
  // (This is SAFE — it only logs users out.)
  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.warn("⚠️ Supabase session error — clearing old session", error.message);
      client.auth.signOut();
      try {
        // clear custom tokens if you stored any
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("sessionExpiry");
      } catch (_) {}
    }
  });
})();
