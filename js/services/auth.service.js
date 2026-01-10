// /js/services/auth.service.js
(function () {
  "use strict";

  function createAuthService({ config, authAdapter, logger }) {
    const { AUTH_TOKEN_KEY, CURRENT_USER_KEY, ROLE_KEY } = config.storage;

    function saveSession(user, accessToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, "customer");
    }

    function clearSession() {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem("sessionExpiry");
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

      if (!token || !user) throw new Error("Login succeeded but session data is missing.");

      saveSession(user, token);
      logger.setUser({ id: user.id, email: user.email, role: "customer" });
      logger.info("Customer login success", { userId: user.id });

      return { user, token };
    }

    async function logout() {
      try {
        await authAdapter.signOut();
      } catch (err) {
        // even if signOut fails, we still clear local state
        logger.warn("Supabase signOut failed; clearing local session anyway", { err: err?.message });
      }
      clearSession();
      logger.setUser(null);
      logger.info("Customer logout");
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
