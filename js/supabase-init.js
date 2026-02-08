import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

// ✅ always set for debugging
window.__SUPABASE_INIT_AT = window.__SUPABASE_INIT_AT || new Date().toISOString();

// ✅ if already bootstrapped, don't re-init
if (window.supabaseReady) {
  // (leave as-is)
} else {
  const isValidClient =
    !!window.supabase &&
    typeof window.supabase.from === "function" &&
    !!window.supabase.auth &&
    typeof window.supabase.auth.getSession === "function";

  if (isValidClient) {
    window.supabaseReady = Promise.resolve(window.supabase);
  } else {
    window.supabaseReady = (async () => {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: { headers: { "x-application-name": "shopup-frontend" } },
      });

      window.supabase = client;
      return client;
    })();
  }
}
