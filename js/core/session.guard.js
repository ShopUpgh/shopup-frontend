// /js/core/session.guard.js
(function () {
  "use strict";

  async function requireCustomerSession({ redirectTo = "customer-login.html" } = {}) {
    // supabase-init.js should expose: window.supabaseReady (Promise) + window.supabase (client)
    if (!window.supabaseReady) {
      throw new Error("supabaseReady not found. Ensure /js/supabase-init.js is included as type=module.");
    }

    await window.supabaseReady;

    if (!window.supabase) {
      throw new Error("Supabase not ready (window.supabase missing). Check /js/supabase-init.js.");
    }

    const { data, error } = await window.supabase.auth.getSession();
    if (error) throw error;

    const session = data?.session;
    if (!session?.user) {
      window.location.href = redirectTo;
      return null;
    }

    const u = session.user;

    if (window.Sentry) {
      window.Sentry.setUser({
        id: String(u.id),
        email: u.email || undefined,
        role: "customer",
      });
    }

    return session;
  }

  // Optional helper for logging out in one place
  async function logoutCustomer({ redirectTo = "customer-login.html" } = {}) {
    await window.supabaseReady;
    if (!window.supabase) throw new Error("Supabase not ready");
    await window.supabase.auth.signOut();
    window.location.href = redirectTo;
  }

  window.ShopUpAuth = Object.freeze({
    requireCustomerSession,
    logoutCustomer,
  });
})();
