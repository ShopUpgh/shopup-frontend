// /js/core/seller-session.guard.js
export async function requireSellerSession({
  redirectTo = "/seller/seller-login.html",
  verificationUrl = "/seller/seller-verification.html",
  dashboardUrl = "/seller/seller-dashboard-enhanced.html",
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

  // Optional: also require local role= seller
  const role = localStorage.getItem("role");
  if (role && role !== "seller") {
    window.location.href = redirectTo;
    return null;
  }

  // ✅ Real seller verification check
  const { data: seller, error: sellerErr } = await client
    .from("sellers")
    .select("id, user_id, status, business_name, email, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerErr) {
    // If RLS blocks this, your policies are wrong.
    window.location.href = verificationUrl;
    return null;
  }

  // If no seller row exists, force verification page
  if (!seller) {
    window.location.href = verificationUrl;
    return null;
  }

  const status = String(seller.status || "draft").toLowerCase();

  if (status !== "approved") {
    // Send status as query so page can show correct state
    window.location.href = `${verificationUrl}?status=${encodeURIComponent(status)}`;
    return null;
  }

  // Sentry user binding (safe)
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({
        id: String(user.id),
        email: user.email || undefined,
        role: "seller",
      });
    }
  } catch (_) {}

  return { client, session, user, seller };
}
