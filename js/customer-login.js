// /js/customer-login.js
(function () {
  const form = document.getElementById("customerLoginForm");
  if (!form) return;

  const msg = document.getElementById("msg");
  const btn = document.getElementById("btn");

  function show(type, text) {
    msg.className = "msg " + (type === "error" ? "err" : "ok");
    msg.textContent = text;
    msg.style.display = "block";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";
    btn.disabled = true;

    try {
      if (!window.supabase) throw new Error("Supabase not ready");

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      localStorage.setItem("authToken", data.session.access_token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("role", "customer");

      if (window.Sentry) window.Sentry.setUser({ id: data.user.id, email: data.user.email, role: "customer" });

      show("ok", "Login successful. Redirecting…");
      setTimeout(() => (window.location.href = "/customer/customer-dashboard.html"), 800);
    } catch (err) {
      if (window.logger) logger.error("Customer login failed", err);
      show("error", err?.message || "Login failed");
      btn.disabled = false;
    }
  });
})();
