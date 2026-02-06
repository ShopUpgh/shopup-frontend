// /js/pages/seller-login.page.js
(function () {
  "use strict";

  function byId(id) { return document.getElementById(id); }

  function show(el) { if (el) el.classList.add("show"); }
  function hide(el) { if (el) el.classList.remove("show"); }

  function setText(el, msg) { if (el) el.textContent = String(msg || ""); }

  function breadcrumb(message, data) {
    if (!window.Sentry) return;
    window.Sentry.addBreadcrumb({
      category: "auth",
      message,
      level: "info",
      data: data || {},
    });
  }

  async function init(container) {
    const logger = container.resolve("logger");
    const authService = container.resolve("authService");

    // Page view breadcrumb
    if (window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: "navigation",
        message: "Seller login page viewed",
        level: "info",
      });
    }
    logger?.pageView?.(document.title);

    const loginForm = byId("loginForm");
    const loginBtn = byId("loginBtn");
    const loading = byId("loading");
    const successAlert = byId("successAlert");
    const errorAlert = byId("errorAlert");
    const forgotBtn = byId("forgotPasswordBtn");

    if (forgotBtn) {
      forgotBtn.addEventListener("click", () => {
        alert("Password reset feature coming soon! Please contact support.");
      });
    }

    function showSuccess(message) {
      setText(successAlert, message);
      show(successAlert);
      hide(errorAlert);
    }

    function showError(message) {
      setText(errorAlert, message);
      show(errorAlert);
      hide(successAlert);
    }

    function setLoading(isLoading) {
      if (loginBtn) loginBtn.disabled = !!isLoading;
      if (loading) loading.classList.toggle("show", !!isLoading);
    }

    if (!loginForm) {
      logger?.error?.("Seller login form not found");
      return;
    }

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const email = (byId("email")?.value || "").trim();
        const password = byId("password")?.value || "";

        breadcrumb("Seller login attempt started", { email, role: "seller" });
        logger?.info?.("Seller login attempt", { email });

        // Ensure Supabase is ready (module init)
        await window.supabaseReady;
        if (!window.supabase) throw new Error("Supabase not initialized. Check /js/supabase-init.js");

        // ✅ UPDATED: use authService.login / authService.loginSeller (safe storage fallbacks)
        let result;

        // Preferred: role-specific helper
        if (typeof authService?.loginSeller === "function") {
          result = await authService.loginSeller(email, password);

        // Next: generic login with role option
        } else if (typeof authService?.login === "function") {
          const out = await authService.login(email, password, { role: "seller" });
          result = out;

        // Last resort: direct supabase auth
        } else {
          const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          result = data;
        }

        const session = result?.session;
        const user =
          result?.user ||
          result?.user?.user ||
          result?.data?.user ||
          session?.user ||
          null;

        if (!session?.access_token) throw new Error("Login succeeded but session token missing.");

        // Store seller auth info (your current behavior)
        localStorage.setItem("authToken", session.access_token);
        localStorage.setItem("currentUser", JSON.stringify(user || {}));
        localStorage.setItem("sessionExpiry", new Date(session.expires_at * 1000).toISOString());
        localStorage.setItem("role", "seller");

        if (window.Sentry) {
          window.Sentry.setUser({
            id: user?.id ? String(user.id) : undefined,
            email: user?.email || email || undefined,
            role: "seller",
          });
        }

        breadcrumb("Seller login successful", { role: "seller" });
        logger?.info?.("Seller login successful", { email });

        showSuccess("Login successful! Redirecting to dashboard...");

        setTimeout(() => {
          window.location.href = "seller-dashboard-enhanced.html";
        }, 900);
      } catch (err) {
        const msg = err?.message || "Login failed. Please try again.";
        console.error("Login failed:", err);

        if (window.Sentry) {
          window.Sentry.captureException(err, { tags: { page: "seller-login", error_category: "authentication" } });
        }
        logger?.error?.("Seller login failed", { error: String(msg) });

        showError(msg);
        setLoading(false);
      }
    });
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initSellerLoginPage = init;
})();
