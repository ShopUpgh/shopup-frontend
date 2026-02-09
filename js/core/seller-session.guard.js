/**
 * Seller Access Rules:
 * - must be logged in
 * - must have sellers row for this auth user_id
 * - status:
 *    approved => dashboard
 *    pending  => verification page (read-only + pending banner)
 *    draft    => verification page (editable)
 *    rejected => verification page + rejected banner
 */
export async function ensureSellerAccess({
  client,
  user,
  redirectLogin = "/seller/seller-login.html",
  redirectVerification = "/seller/seller-verification.html",
  redirectDashboard = "/seller/seller-dashboard-enhanced.html",
} = {}) {
  if (!client) client = await window.supabaseReady;

  if (!user) {
    const sess = await client.auth.getSession();
    user = sess?.data?.session?.user;
  }

  if (!user) return { ok: false, redirectTo: redirectLogin };

  // Local role guard (optional, but keeps things consistent)
  const role = localStorage.getItem("role");
  if (role && role !== "seller") return { ok: false, redirectTo: redirectLogin };

  const { data: seller, error } = await client
    .from("sellers")
    .select("id,user_id,email,status,business_name,store_slug,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!seller) {
    // No seller row yet => start verification
    return { ok: true, status: "none", seller: null, user, redirectTo: redirectVerification };
  }

  const status = String(seller.status || "draft").toLowerCase();

  if (status === "approved") return { ok: true, status, seller, user, redirectTo: redirectDashboard };

  // draft/pending/rejected => verification page
  return { ok: true, status, seller, user, redirectTo: redirectVerification };
}

export async function requireSellerApproved(opts = {}) {
  const res = await ensureSellerAccess(opts);
  if (!res.ok) {
    window.location.href = res.redirectTo;
    return null;
  }
  if (res.status !== "approved") {
    window.location.href = res.redirectTo;
    return null;
  }

  // Sentry safe setUser
  try {
    if (window.Sentry?.setUser) {
      window.Sentry.setUser({ id: String(res.user.id), email: res.user.email || undefined, role: "seller" });
    }
  } catch (_) {}

  return res;
}
