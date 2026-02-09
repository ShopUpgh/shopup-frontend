function showAlert(msg, type = "error") {
  const container = document.getElementById("alertContainer");
  const cls = type === "error" ? "alert-error" : "alert-success";
  const icon = type === "error" ? "❌" : "✅";
  container.innerHTML = `<div class="alert ${cls}">${icon} ${msg}</div>`;
}

async function verifyAdminRole(client, userId) {
  // If user_roles RLS was broken, this used to error.
  // After the SQL fixes, it will work reliably.
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

async function main() {
  const client = await window.supabaseReady;

  // Already logged in?
  const { data } = await client.auth.getSession();
  const user = data?.session?.user;
  if (user) {
    const ok = await verifyAdminRole(client, user.id);
    if (ok) {
      localStorage.setItem("role", "admin");
      window.location.href = "/admin/admin-sellers.html";
      return;
    }
  }

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const btn = document.getElementById("loginBtn");
    btn.disabled = true;
    btn.textContent = "Signing in...";

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const ok = await verifyAdminRole(client, data.user.id);
      if (!ok) {
        await client.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }

      localStorage.setItem("role", "admin");
      showAlert("Login successful. Redirecting...", "success");
      window.location.href = "/admin/admin-sellers.html";
    } catch (err) {
      console.error(err);
      showAlert(err?.message || String(err), "error");
      try { window.Sentry?.captureException?.(err); } catch (_) {}
    } finally {
      btn.disabled = false;
      btn.textContent = "Sign In to Admin Panel";
    }
  });
}

main().catch((e) => {
  console.error("admin-login fatal:", e);
  try { window.Sentry?.captureException?.(e); } catch (_) {}
  showAlert("Unexpected error. Please refresh.", "error");
});
