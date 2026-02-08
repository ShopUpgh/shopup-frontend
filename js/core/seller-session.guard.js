// /js/core/seller-session.guard.js
export async function requireSellerSession({ redirectTo = "/seller/seller-login.html" } = {}) {
  const client = await window.supabaseReady;

  if (!client?.auth) {
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

  if (!session || !user?.id) {
    window.location.href = redirectTo;
    return null;
  }

  // Find seller row
  const { data: seller, error: sellerErr } = await client
    .from("sellers")
    .select("id, user_id, email, status, business_name, store_slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerErr || !seller) {
    // logged in user is not a seller
    window.location.href = "/seller/seller-register.html";
    return null;
  }

  const status = String(seller.status || "draft").toLowerCase();

  // Block hard states
  if (status === "disabled") {
    try { await client.auth.signOut(); } catch (_) {}
    window.location.href = "/seller/seller-login.html?state=disabled";
    return null;
  }

  // Not approved yet → verification flow
  if (status !== "approved") {
    const qs = encodeURIComponent(status);
    window.location.href = `/seller/seller-verification.html?state=${qs}`;
    return null;
  }

  // ✅ Approved seller
  localStorage.setItem("role", "seller");

  // Safe Sentry setUser
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({ id: String(user.id), email: user.email || seller.email || undefined, role: "seller" });
    }
  } catch (_) {}

  return { client, session, user, seller };
}
