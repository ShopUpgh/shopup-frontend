// inside async function login(email, password) { ... }
const { data, error } = await authAdapter.signIn(email, password);
if (error) throw error;

const user = data?.user;
const session = data?.session;

if (!user) throw new Error("Login succeeded but user missing.");
if (!session?.access_token) throw new Error("Login succeeded but session token missing.");

// ✅ If this service is for seller, verify approval in DB
if (role === "seller") {
  const supabase = await authAdapter.getClient?.(); // (we'll add this below)
  const { data: seller, error: sellerErr } = await supabase
    .from("sellers")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sellerErr || !seller) throw new Error("Seller profile not found. Please register as a seller.");
  const status = String(seller.status || "").toLowerCase();
  if (status !== "approved") throw new Error("Seller account not approved yet. Complete verification.");
}

saveSession(user, session);
...
