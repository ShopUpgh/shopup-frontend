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

  // ✅ Check sellers table by user_id
  const { data: seller, error: sellerErr } = await client
    .from("sellers")
    .select("id, user_id, email, status, business_name, store_slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerErr || !seller) {
    // Not a registered seller
    window.location.href = redirectTo;
    return null;
  }

  const status = String(seller.status || "").toLowerCase();
  if (status !== "approved") {
    // Seller exists, but not approved yet
    window.location.href = "/seller/seller-verification.html";
    return null;
  }

  // ✅ Persist role locally (helps your UI + your old checks)
  localStorage.setItem("role", "seller");

  // ✅ Safe Sentry setUser
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({
        id: String(user.id),
        email: user.email || seller.email || undefined,
        role: "seller",
      });
    }
  } catch (_) {}

  return { client, session, user, seller };
}
