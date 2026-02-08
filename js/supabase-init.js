// /js/supabase-init.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

if (!window.__SUPABASE_INIT_AT) window.__SUPABASE_INIT_AT = new Date().toISOString();

// ✅ Reuse if already created
if (window.supabase && window.supabase.auth) {
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
