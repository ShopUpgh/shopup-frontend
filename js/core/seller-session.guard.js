// /js/core/seller-session.guard.js
export async function requireSellerSession({ redirectTo = "/seller/seller-login.html" } = {}) {
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

  // Bind Sentry user safely
  try {
    window.ShopUpSentry?.setUserSafe?.({ id: String(user.id), email: user.email || undefined, role: "seller" });
  } catch (_) {}

  // Check seller status
  let sellerRow = null;
  try {
    const res = await client
      .from("sellers")
      .select("id, status, user_id, email, business_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!res.error) sellerRow = res.data || null;
  } catch (_) {}

  return { client, session, user, seller: sellerRow };
}

export async function requireApprovedSeller({
  loginRedirect = "/seller/seller-login.html",
  verifyRedirect = "/seller/seller-verification.html",
} = {}) {
  const auth = await requireSellerSession({ redirectTo: loginRedirect });
  if (!auth) return null;

  const status = String(auth.seller?.status || "draft").toLowerCase();

  if (!auth.seller) {
    window.location.href = verifyRedirect;
    return null;
  }

  if (status !== "approved") {
    window.location.href = `${verifyRedirect}?status=${encodeURIComponent(status)}`;
    return null;
  }

  return auth;
}
