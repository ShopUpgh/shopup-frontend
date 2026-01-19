// /js/core/seller-session.guard.js
export async function requireSellerSession({ redirectTo = "/seller/seller-login.html" } = {}) {
  const client = await window.supabaseReady;
  if (!client) {
    window.location.href = redirectTo;
    return null;
  }

  const { data, error } = await client.auth.getSession();
  if (error || !data?.session) {
    window.location.href = redirectTo;
    return null;
  }

  // Optional role check (kept simple to avoid breaking you)
  // If you later store role in user.app_metadata.role, you can enforce it here.
  return { client, session: data.session, user: data.session.user };
}
