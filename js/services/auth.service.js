// /js/services/auth.service.js
(function () {
  "use strict";

  function createAuthService({ config, authAdapter, logger, role = "customer" }) {
    const storage = config?.storage || {};
    const AUTH_TOKEN_KEY = storage.AUTH_TOKEN_KEY || "authToken";
    const CURRENT_USER_KEY = storage.CURRENT_USER_KEY || "currentUser";
    const SESSION_EXPIRY_KEY = storage.SESSION_EXPIRY_KEY || "sessionExpiry";
    const ROLE_KEY = storage.ROLE_KEY || "role";

    function saveSession(user, session) {
      const token = session?.access_token;
      if (!token) throw new Error("Login succeeded but session token missing.");

      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(ROLE_KEY, role);

      if (session?.expires_at) {
        localStorage.setItem(
          SESSION_EXPIRY_KEY,
          new Date(session.expires_at * 1000).toISOString()
        );
      }
    }

    function clearSession() {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    }

    async function login(email, password) {
      const { data, error } = await authAdapter.signIn(email, password);
      if (error) throw error;

      const user = data?.user;
      const session = data?.session;

      if (!user) throw new Error("Login succeeded but user missing.");
      if (!session?.access_token) throw new Error("Login succeeded but session token missing.");

      saveSession(user, session);

      // Safe logger user binding
      try {
        if (logger && typeof logger.setUser === "function") {
          logger.setUser({ id: user.id, email: user.email, role });
        }
      } catch (_) {}

      logger?.info?.("Login success", { userId: user.id, role });

      return { user, session, token: session.access_token };
    }

    async function logout() {
      try {
        await authAdapter.signOut();
      } catch (err) {
        logger?.warn?.("Supabase signOut failed; clearing local session anyway", {
          err: err?.message || String(err),
        });
      }

      clearSession();

      try {
        if (logger && typeof logger.setUser === "function") logger.setUser(null);
      } catch (_) {}

      logger?.info?.("Logout", { role });
    }

    return { login, logout };
  }

  window.ShopUpAuthServiceFactory = { createAuthService };
})();
