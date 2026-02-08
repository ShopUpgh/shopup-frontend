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
      } else {
        // If expires_at missing, store a short-lived fallback timestamp
        const fallback = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1hr
        localStorage.setItem(SESSION_EXPIRY_KEY, fallback);
      }
    }

    function clearSession() {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    }

    async function login(email, password) {
      // 1) Attempt sign in
      const { data, error } = await authAdapter.signIn(email, password);
      if (error) throw error;

      let user = data?.user || null;
      let session = data?.session || null;

      // 2) Fallback: if session is missing, try getSession immediately
      if (!session?.access_token) {
        const sessRes = await authAdapter.getSession();
        const fallbackSession = sessRes?.data?.session || null;

        if (fallbackSession?.access_token) {
          session = fallbackSession;
          // If user missing, try from session
          user = user || fallbackSession.user || null;
        }
      }

      if (!user) throw new Error("Login succeeded but user missing.");
      if (!session?.access_token) {
        // Extra debug for you in console/Sentry
        logger?.error?.("Session missing after login", {
          role,
          hasUser: !!user,
          hasSession: !!session,
          signInReturned: {
            user: !!data?.user,
            session: !!data?.session,
          },
        });
        throw new Error("Login succeeded but session token missing.");
      }

      saveSession(user, session);

      try {
        logger.setUser({ id: user.id, email: user.email, role });
      } catch (_) {}

      logger.info("Login success", { userId: user.id, role });

      return { user, session, token: session.access_token };
    }

    async function logout() {
      try {
        await authAdapter.signOut();
      } catch (err) {
        logger.warn("Supabase signOut failed; clearing local session anyway", { err: err?.message });
      }
      clearSession();
      try {
        logger.setUser(null);
      } catch (_) {}
      logger.info("Logout", { role });
    }

    return { login, logout };
  }

  window.ShopUpAuthServiceFactory = { createAuthService };
})();
