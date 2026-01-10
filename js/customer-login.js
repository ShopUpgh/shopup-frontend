// /js/customer-login.js
(function () {
  "use strict";

  const form = document.getElementById("customerLoginForm");
  if (!form) return;

  const msg = document.getElementById("msg");
  const btn = document.getElementById("btn");

  function show(type, text) {
    if (!msg) return;
    msg.className = "msg " + (type === "error" ? "err" : "ok");
    msg.textContent = text;
    msg.style.display = "block";
  }

  async function waitForSupabase(maxMs = 8000) {
    const start = Date.now();
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!window.supabase) {
      throw new Error("Supabase not ready. Check /js/supabase-init.js is loading.");
    }
  }

  function safeJsonStringify(obj) {
    try {
      return JSON.stringify(obj);
    } catch {
      return "{}";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (msg) msg.style.display = "none";
    btn.disabled = true;

    try {
      await waitForSupabase();

      const emailEl = document.getElementById("email");
      const passEl = document.getElementById("password");

      const email = (emailEl?.value || "").trim();
      const password = passEl?.value || "";

      if (!email || !password) {
        show("error", "Please enter your email and password.");
        btn.disabled = false;
        return;
      }

      // Breadcrumb
      if (window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: "auth",
          message: "Customer login attempt",
          level: "info",
          data: { email },
        });
      }

      const { data, error } = await window.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Friendly error messages
        const msg = String(error.message || "Login failed");
        if (msg.toLowerCase().includes("email not confirmed")) {
          throw new Error("Please verify your email first, then try again.");
        }
        if (msg.toLowerCase().includes("invalid login credentials")) {
          throw new Error("Invalid email or password.");
        }
        throw error;
      }

      const session = data?.session;
      const user = data?.user;

      if (!session || !user) {
        throw new Error("Login failed. Please try again.");
      }

      // Persist session + user for your pages that check these values
      localStorage.setItem("authToken", session.access_token);
      localStorage.setItem("currentUser", safeJsonStringify(user));
      localStorage.setItem("role", "customer");

      // Helpful expiry for your own "sessionExpiry" checks (optional)
      if (session.expires_at) {
        localStorage.setItem("sessionExpiry", String(session.expires_at));
      } else {
        // fallback: 1 hour
        const fallbackExpiry = Math.floor(Date.now() / 1000) + 3600;
        localStorage.setItem("sessionExpiry", String(fallbackExpiry));
      }

      // Identify user in Sentry
      if (window.Sentry) {
        window.Sentry.setUser({
          id: String(user.id),
          email: user.email || undefined,
          role: "customer",
        });
      }

      if (window.logger) {
        window.logger.info("Customer login success", { userId: user.id, email: user.email });
      }

      show("ok", "Login successful. Redirecting…");

      // ✅ Use relative path so it works from /customer/ pages
      setTimeout(() => {
        window.location.href = "customer-dashboard.html";
      }, 600);
    } catch (err) {
      if (window.logger) window.logger.error("Customer login failed", err);
      if (window.Sentry) window.Sentry.captureException(err);

      show("error", err?.message || "Login failed. Please try again.");
      btn.disabled = false;
    }
  });
})();
