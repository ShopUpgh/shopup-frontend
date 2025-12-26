// /js/supabase-init.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose globally for non-module scripts like /js/signup-script.js
window.supabase = supabase;

console.log("✅ Supabase initialized (module) for ShopUp Ghana");
console.log("📍 Project URL:", SUPABASE_URL);
console.log("🔑 Key configured:", SUPABASE_ANON_KEY.length > 0 ? "Yes" : "No");
