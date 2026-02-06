// /js/services/auth.service.js
(function () {
  "use strict";

  function createAuthService({ config, authAdapter, logger }) {
    // ✅ Defensive config handling (prevents "Cannot destructure ... config.storage")
    const storage = config?.storage || {};
    const AUTH_TOKEN_KEY = storage.AUTH_TOKEN_KEY || "authToken";
    const CURRENT_USER_KEY = storage.CURRENT_USER_KEY || "currentUser";
    const ROLE_KEY = storage.ROLE_KEY || "role";
    const SESSION_EXPIRY_KEY = storage.SESSION_EXPIRY_KEY || "sessionExpiry";

    function saveSession(user, accessToken, role) {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user || {}));
      if (role) localStorage.setItem(ROLE_KEY, String(role));
    }

    function clearSession() {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    }

    function getStoredUser() {
      try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
      } catch {
        return null;
      }
    }

    function getStoredRole() {
      return localStorage.getItem(ROLE_KEY) || null;
    }

    function isAuthenticated() {
      return !!localStorage.getItem(AUTH_TOKEN_KEY);
    }

    /**
     * ✅ Backwards compatible:
     *   login(email, password) -> defaults role to "customer"
     *
     * ✅ New:
     *   login(email, password, { role: "seller" })
     */
    async function login(email, password, opts) {
      const role = opts?.role || "customer";

      const { data, error } = await authAdapter.signIn(email, password);
      if (error) throw error;

      const token = data?.session?.access_token;
      const user = data?.user;

      if (!token || !user) throw new Error("Login succeeded but session data is missing.");

      saveSession(user, token, role);

      // Logger user context
      try {
        logger?.setUser?.({ id: user.id, email: user.email, role });
      } catch {}

      logger?.info?.("Login success", { userId: user.id, role });

      return { user, token, role };
    }

    // ✅ Convenience methods (optional)
    async function loginCustomer(email, password) {
      return login(email, password, { role: "customer" });
    }

    async function loginSeller(email, password) {
      return login(email, password, { role: "seller" });
    }

    async function logout() {
      try {
        await authAdapter.signOut();
      } catch (err) {
        logger?.warn?.("Supabase signOut failed; clearing local session anyway", { err: err?.message });
      }
      clearSession();
      try {
        logger?.setUser?.(null);
      } catch {}
      logger?.info?.("Logout");
    }

    function requireAuthOrRedirect(redirectUrl, opts) {
      const requiredRole = opts?.role;

      if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
      }

      if (requiredRole) {
        const r = getStoredRole();
        if (r !== requiredRole) {
          window.location.href = redirectUrl;
          return false;
        }
      }

      return true;
    }

    return {
      // main
      login,
      logout,

      // helpers
      loginCustomer,
      loginSeller,

      isAuthenticated,
      getStoredUser,
      getStoredRole,
      requireAuthOrRedirect,
    };
  }

  window.ShopUpAuthServiceFactory = { createAuthService };
})();
