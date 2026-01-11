// /js/supabase-config.js
// ✅ Legacy compatibility wrapper.
// ✅ Single source of truth remains /js/supabase-init.js (module).
// This file loads /js/supabase-init.js if needed, then exposes window.supabase + window.supabaseReady.

(function () {
  "use strict";

  const INIT_SRC = "/js/supabase-init.js";

  // If already initialized, do nothing.
  if (window.supabase && window.supabaseReady) return;

  // If supabaseReady exists but supabase not yet attached, wait for it.
  if (window.supabaseReady && !window.supabase) {
    window.supabaseReady
      .then((client) => {
        if (client) window.supabase = client;
      })
      .catch(() => {});
    return;
  }

  // Create a supabaseReady promise that resolves once the init module runs.
  window.supabaseReady = new Promise((resolve, reject) => {
    try {
      // If the module script already exists, just wait a tick.
      const existing = document.querySelector(`script[type="module"][src="${INIT_SRC}"]`);
      if (existing) {
        setTimeout(async () => {
          try {
            // supabase-init.js sets window.supabaseReady to a promise returning the client
            const client = await window.supabaseReady;
            if (client) window.supabase = client;
            resolve(client || window.supabase || null);
          } catch (e) {
            reject(e);
          }
        }, 0);
        return;
      }

      // Inject the module script
      const s = document.createElement("script");
      s.type = "module";
      s.src = INIT_SRC;

      s.onload = async () => {
        try {
          const client = await window.supabaseReady;
          if (client) window.supabase = client;
          resolve(client || null);
        } catch (e) {
          reject(e);
        }
      };

      s.onerror = () => reject(new Error("Failed to load /js/supabase-init.js"));
      document.head.appendChild(s);
    } catch (err) {
      reject(err);
    }
  });
})();
