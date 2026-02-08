// /js/core/seller-session.guard.js
export async function requireSellerSession({ redirectTo = "/seller/seller-login.html" } = {}) {
  const client = await window.supabaseReady;

  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.user) {
    window.location.href = redirectTo;
    return null;
  }

  const user = data.session.user;

  // Must be seller role in localStorage (your current system uses this)
  const role = localStorage.getItem("role");
  if (role && role !== "seller") {
    window.location.href = redirectTo;
    return null;
  }

  // ✅ Check sellers table for verification status
  const { data: sellerRow, error: sErr } = await client
    .from("sellers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sErr) {
    window.location.href = redirectTo;
    return null;
  }

  // No seller row yet -> go verify
  if (!sellerRow) {
    window.location.href = "/seller/seller-verification.html";
    return null;
  }

  const status = String(sellerRow.status || "draft").toLowerCase();

  if (status === "approved") {
    // ok
  } else if (status === "suspended") {
    window.location.href = "/seller/seller-verification.html";
    return null;
  } else {
    // draft/pending/rejected -> verification page
    window.location.href = "/seller/seller-verification.html";
    return null;
  }

  // Sentry safe setUser
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({ id: String(user.id), email: user.email || undefined, role: "seller" });
    }
  } catch (_) {}

  return { client, session: data.session, user };
}
