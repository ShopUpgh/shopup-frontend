(function () {
  "use strict";

  const ALERT = document.getElementById("alertContainer");
  const FORM = document.getElementById("loginForm");
  const BTN = document.getElementById("loginBtn");

  function showAlert(message, type = "error") {
    const cls = type === "success" ? "alert-success" : "alert-error";
    const icon = type === "success" ? "✅" : "❌";
    ALERT.innerHTML = `<div class="alert ${cls}">${icon} ${message}</div>`;
    if (type === "success") {
      setTimeout(() => (ALERT.innerHTML = ""), 2500);
    }
  }

  async function verifyAdminRole(client, userId) {
    const { data, error } = await client
      .from("user_roles")
      .select("role,is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("role", ["admin", "moderator"])
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async function safeSignOut(client) {
    try { await client.auth.signOut(); } catch (_) {}
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("role");
    try { window.Sentry?.setUser?.(null); } catch (_) {}
  }

  function setBusy(isBusy) {
    if (!BTN) return;
    BTN.disabled = !!isBusy;
    BTN.textContent = isBusy ? "Signing in..." : "Sign In to Admin Panel";
  }

  async function routeIfAlreadyLoggedIn(client) {
    const { data, error } = await client.auth.getSession();
    if (error) return;
    const user = data?.session?.user;
    if (!user) return;

    const ok = await verifyAdminRole(client, user.id);
    if (ok) {
      localStorage.setItem("role", "admin");
      window.location.href = "/admin/admin-sellers.html";
    } else {
      await safeSignOut(client);
    }
  }

  async function handleLogin(client, e) {
    e.preventDefault();

    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      showAlert("Please enter both email and password.", "error");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error("Login succeeded but user missing.");

      const ok = await verifyAdminRole(client, user.id);
      if (!ok) {
        await safeSignOut(client);
        throw new Error("Access denied. Admin privileges required.");
      }

      // mark role locally (helps your guards)
      localStorage.setItem("role", "admin");

      // set Sentry context
      try {
        window.Sentry?.setUser?.({ id: user.id, email: user.email, role: "admin" });
      } catch (_) {}

      showAlert("Login successful! Redirecting…", "success");
      setTimeout(() => {
        window.location.href = "/admin/admin-sellers.html";
      }, 800);

    } catch (err) {
      console.error("Admin login error:", err);
      try { window.Sentry?.captureException?.(err); } catch (_) {}
      showAlert(err?.message || "Login failed. Please check your credentials.", "error");
      setBusy(false);
    }
  }

  async function main() {
    // ✅ wait for shared init
    const client = await window.supabaseReady;
    if (!client) {
      showAlert("Supabase init failed. Please refresh.", "error");
      return;
    }

    await routeIfAlreadyLoggedIn(client);

    if (!FORM) {
      showAlert("Page error: login form not found.", "error");
      return;
    }

    FORM.addEventListener("submit", (e) => handleLogin(client, e));
  }

  main().catch((e) => {
    console.error("Admin login fatal:", e);
    try { window.Sentry?.captureException?.(e); } catch (_) {}
    showAlert(e?.message || String(e), "error");
  });
})();
