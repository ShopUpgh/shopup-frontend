// /js/core/seller-session.guard.js
export async function requireSellerSession({
  redirectTo = "/seller/seller-login.html",
} = {}) {
  const client = await window.supabaseReady;
  if (!client || !client.auth) {
    window.location.href = redirectTo;
    return null;
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    window.location.href = redirectTo;
    return null;
  }

  const session = data?.session;
  const user = session?.user;

  if (!user) {
    window.location.href = redirectTo;
    return null;
  }

  const role = localStorage.getItem("role");
  if (role && role !== "seller") {
    window.location.href = redirectTo;
    return null;
  }

  // Sentry safe setUser
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({ id: String(user.id), email: user.email || undefined, role: "seller" });
    }
  } catch (_) {}

  return { client, session, user };
}
