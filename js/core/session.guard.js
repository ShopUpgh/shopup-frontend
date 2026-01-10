(function () {
  "use strict";

  async function requireCustomerSession({ redirectTo = "customer-login.html" } = {}) {
    await window.supabaseReady;
    if (!window.supabase) throw new Error("Supabase not ready");

    const { data, error } = await window.supabase.auth.getSession();
    if (error) throw error;

    const session = data?.session;
    if (!session?.user) {
      window.location.href = redirectTo;
      return null;
    }

    const u = session.user;

    if (window.Sentry) {
      window.Sentry.setUser({ id: String(u.id), email: u.email || undefined, role: "customer" });
    }

    return session;
  }

  window.ShopUpAuth = { requireCustomerSession };
})();
