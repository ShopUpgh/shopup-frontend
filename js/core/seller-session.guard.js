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

  // ✅ Read seller row by user_id
  const { data: seller, error: sellerErr } = await client
    .from("sellers")
    .select("id, user_id, email, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerErr || !seller) {
    window.location.href = "/seller/seller-register.html";
    return null;
  }

  const status = String(seller.status || "draft").toLowerCase();

  // disabled → logout
  if (status === "disabled") {
    try { await client.auth.signOut(); } catch (_) {}
    window.location.href = "/seller/seller-login.html?state=disabled";
    return null;
  }

  // Not approved → send to verification page
  if (status !== "approved") {
    window.location.href = `/seller/seller-verification.html?state=${encodeURIComponent(status)}`;
    return null;
  }

  // ✅ Approved
  localStorage.setItem("role", "seller");

  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({ id: String(user.id), email: user.email || seller.email || undefined, role: "seller" });
    }
  } catch (_) {}

  return { client, session, user, seller };
}
