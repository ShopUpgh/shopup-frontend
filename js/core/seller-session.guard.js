// /js/core/seller-session.guard.js
export async function requireSellerSession({
  redirectTo = "/seller/seller-login.html",
  pendingTo = "/seller/seller-verification.html",
  rejectedTo = "/seller/seller-verification.html?state=rejected",
  blockedTo = "/seller/seller-verification.html?state=blocked",
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

  // Must be seller role in localStorage
  const role = localStorage.getItem("role");
  if (role && role !== "seller") {
    window.location.href = redirectTo;
    return null;
  }

  // ✅ Check seller verification status from DB
  const { data: sellerRow, error: sellerErr } = await client
    .from("sellers")
    .select("id, user_id, email, business_name, status, store_slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerErr) {
    // If query fails, treat as not allowed
    console.error("Seller status check failed:", sellerErr);
    window.location.href = pendingTo;
    return null;
  }

  // If no row exists yet, push into verification flow
  if (!sellerRow) {
    window.location.href = pendingTo;
    return null;
  }

  const status = String(sellerRow.status || "draft").toLowerCase();

  // Only approved can proceed
  if (status !== "approved") {
    if (status === "rejected") window.location.href = rejectedTo;
    else if (status === "suspended" || status === "disabled") window.location.href = blockedTo;
    else window.location.href = pendingTo;
    return null;
  }

  // Sentry safe setUser
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({
        id: String(user.id),
        email: user.email || undefined,
        role: "seller",
      });
    }
  } catch (_) {}

  return { client, session, user, seller: sellerRow };
}
