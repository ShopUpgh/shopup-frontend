// /js/services/auth.service.js
(function () {
  "use strict";

  function createAuthService({ config, authAdapter, logger, role = "customer" }) {
    if (!config || !config.storage) throw new Error("AuthService: config.storage is required.");

    const { AUTH_TOKEN_KEY, CURRENT_USER_KEY, ROLE_KEY, SESSION_EXPIRY_KEY } = config.storage;

    function saveSession(user, session) {
      const token = session?.access_token;
      if (!token) throw new Error("saveSession: missing access_token.");

      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, role);

      const expiresAt = session?.expires_at; // unix seconds
      if (expiresAt) {
        localStorage.setItem(SESSION_EXPIRY_KEY, new Date(expiresAt * 1000).toISOString());
      }
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

    function isAuthenticated() {
      return !!localStorage.getItem(AUTH_TOKEN_KEY);
    }

    // ✅ Robust: if signIn returns no session, immediately re-read it from auth storage
    async function login(email, password) {
      const { data, error } = await authAdapter.signIn(email, password);
      if (error) throw error;

      const user = data?.user;
      let session = data?.session || null;

      // If session missing, fetch it (Supabase may persist session async)
      if (!session) {
        const sessRes = await authAdapter.getSession();
        if (sessRes?.error) throw sessRes.error;
        session = sessRes?.data?.session || null;
      }

      if (!user) throw new Error("Login succeeded but user missing.");
      if (!session?.access_token) throw new Error("Login succeeded but session token missing.");

      saveSession(user, session);

      // identify for logs/sentry
      logger?.setUser?.({ id: user.id, email: user.email, role });
      logger?.info?.("Login success", { userId: user.id, role });

      return { user, token: session.access_token, session };
    }

    async function logout() {
      try {
        await authAdapter.signOut();
      } catch (err) {
        logger?.warn?.("Supabase signOut failed; clearing local session anyway", { err: err?.message });
      }
      clearSession();
      logger?.setUser?.(null);
      logger?.info?.("Logout", { role });
    }

    function requireAuthOrRedirect(redirectUrl) {
      if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
      }
      return true;
    }

    // Convenience wrappers
    async function loginCustomer(email, password) {
      role = "customer";
      return login(email, password);
    }

    async function loginSeller(email, password) {
      role = "seller";
      return login(email, password);
    }

    return {
      login,
      loginCustomer,
      loginSeller,
      logout,
      isAuthenticated,
      getStoredUser,
      requireAuthOrRedirect,
    };
  }

  window.ShopUpAuthServiceFactory = { createAuthService };
})();
