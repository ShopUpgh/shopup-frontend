// /js/supabase-config.js
(function () {
  "use strict";

  // ✅ Must match /js/supabase-init.js (same project)
  const SUPABASE_URL = "https://brbewkxpvihnsrbrlpzq.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4";

  const DEBUG = false;

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  function log(...args) {
    if (DEBUG) console.log(...args);
  }

  function warn(...args) {
    if (DEBUG) console.warn(...args);
  }

  function isPromise(p) {
    return !!p && typeof p.then === "function";
  }

  function isClient(obj) {
    return !!obj && !!obj.auth && typeof obj.auth.getSession === "function";
  }

  function isUmdNamespace(obj) {
    return !!obj && typeof obj.createClient === "function";
  }

  function getProjectRefFromUrl(url) {
    // https://<ref>.supabase.co
    try {
      const u = new URL(url);
      return (u.hostname || "").split(".")[0] || "";
    } catch {
      return "";
    }
  }

  function getIssuerFromJwt(jwt) {
    try {
      const parts = String(jwt || "").split(".");
      if (parts.length < 2) return "";
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return String(payload.iss || "");
    } catch {
      return "";
    }
  }

  function validateKeyMatchesUrl(url, anonKey) {
    const refFromUrl = getProjectRefFromUrl(url);
    const iss = getIssuerFromJwt(anonKey);
    const refFromIss = iss ? iss.replace("supabase-", "") : "";

    if (!refFromUrl || !refFromIss) return true;

    const ok = refFromUrl === refFromIss;
    if (!ok) {
      console.error(
        "❌ Supabase ANON key does NOT match SUPABASE_URL project.\n" +
          `URL project ref: ${refFromUrl}\n` +
          `Key issuer ref:  ${refFromIss}\n` +
          "Fix: ensure ALL pages load the SAME /js/supabase-config.js or /js/supabase-init.js values."
      );
    }
    return ok;
  }

  // -------------------------------------------------------
  // 1) If module init already created window.supabaseReady, reuse it.
  // -------------------------------------------------------
  if (isPromise(window.supabaseReady)) {
    window.supabaseReady = window.supabaseReady.then((client) => {
      if (client && !isClient(window.supabase)) window.supabase = client;
      return client;
    });

    window.ShopUpSupabaseWait = async function () {
      const client = await window.supabaseReady;
      if (!client) throw new Error("Supabase not initialized (supabaseReady returned null).");
      return client;
    };

    log("✅ supabase-config.js: using existing window.supabaseReady (module init detected)");
    return;
  }

  // -------------------------------------------------------
  // 2) If a client already exists, wrap it.
  // -------------------------------------------------------
  if (isClient(window.supabase)) {
    window.supabaseReady = Promise.resolve(window.supabase);

    window.ShopUpSupabaseWait = async function () {
      return window.supabase;
    };

    log("✅ supabase-config.js: wrapped existing window.supabase client");
    return;
  }

  // -------------------------------------------------------
  // 3) Validate config basics
  // -------------------------------------------------------
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Supabase not initialized: missing SUPABASE_URL / SUPABASE_ANON_KEY");
    window.supabaseReady = Promise.resolve(null);
    return;
  }

  // Catch the most common “Invalid API key” cause immediately
  validateKeyMatchesUrl(SUPABASE_URL, SUPABASE_ANON_KEY);

  // -------------------------------------------------------
  // 4) Create client from UMD namespace (window.supabase.createClient)
  // -------------------------------------------------------
  // If the UMD script is loaded, window.supabase is the namespace.
  // We will preserve it in window.__supabaseLib BEFORE replacing window.supabase with the client.
  const maybeLib = window.supabase;

  if (!isUmdNamespace(maybeLib)) {
    // If it’s not a namespace, you likely did not load the UMD script on this page.
    console.error(
      "❌ Supabase UMD namespace not found.\n" +
        "Fix (UMD pages): include <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script>\n" +
        "Fix (module pages): include <script type='module' src='/js/supabase-init.js'></script> and remove supabase-config.js."
    );
    window.supabaseReady = Promise.resolve(null);
    return;
  }

  // Preserve the UMD namespace so other scripts can still access it if needed
  window.__supabaseLib = maybeLib;

  window.supabaseReady = (async () => {
    const client = window.__supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: { "x-application-name": "shopup-frontend" },
      },
    });

    // ✅ Make the client the global "supabase" reference expected by your app
    window.supabase = client;

    // ✅ Backwards-compatible DI helper
    window.ShopUpSupabaseWait = async function () {
      return client;
    };

    warn("✅ Supabase client initialized via /js/supabase-config.js (UMD)");
    return client;
  })();
})();
