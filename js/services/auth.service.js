// /js/services/auth.service.js
(function () {
  "use strict";

  function createAuthService({ config, authAdapter, logger, role = "customer" }) {
    if (!config || !config.storage) {
      throw new Error("AuthService requires config.storage. Check /js/core/config.js load order.");
    }

    const { AUTH_TOKEN_KEY, CURRENT_USER_KEY, ROLE_KEY, SESSION_EXPIRY_KEY } = config.storage;

    function saveSession(user, accessToken, expiresAtSeconds) {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, role);

      // optional expiry
      if (expiresAtSeconds) {
        localStorage.setItem(SESSION_EXPIRY_KEY, new Date(expiresAtSeconds * 1000).toISOString());
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

    async function login(email, password) {
      const { data, error } = await authAdapter.signIn(email, password);
      if (error) throw error;

      const token = data?.session?.access_token;
      const user = data?.user;
      const expiresAt = data?.session?.expires_at;

      if (!token || !user) {
        throw new Error("Login succeeded but session token missing.");
      }

      saveSession(user, token, expiresAt);

      logger.setUser({ id: user.id, email: user.email, role });
      logger.info("Login success", { userId: user.id, role });

      return { user, token };
    }

    async function logout() {
      try {
        await authAdapter.signOut();
      } catch (err) {
        logger.warn("Supabase signOut failed; clearing local session anyway", { err: err?.message });
      }
      clearSession();
      logger.setUser(null);
      logger.info("Logout", { role });
    }

    function requireAuthOrRedirect(redirectUrl) {
      if (!isAuthenticated()) {
        window.location.href = redirectUrl;
        return false;
      }
      return true;
    }

    return {
      login,
      logout,
      isAuthenticated,
      getStoredUser,
      requireAuthOrRedirect,
    };
  }

  window.ShopUpAuthServiceFactory = { createAuthService };
})();
