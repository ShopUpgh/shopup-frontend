// /admin/admin-sellers.page.js
const $ = (id) => document.getElementById(id);

function safeUUID() {
  if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function show(el, msg) { el.textContent = msg; el.classList.add("show"); }
function hide(el) { el.classList.remove("show"); el.textContent = ""; }

function pill(status) {
  const s = String(status || "draft").toLowerCase();
  const ok = ["draft","pending","approved","rejected","suspended"].includes(s) ? s : "draft";
  return `<span class="pill ${ok}">${ok}</span>`;
}

function fmtDate(ts) {
  try { return ts ? new Date(ts).toLocaleString() : ""; } catch { return ""; }
}

async function requireAdmin(client) {
  const { data, error } = await client.auth.getSession();
  const user = data?.session?.user;

  if (error || !user) {
    window.location.href = "/admin/admin-login.html";
    return null;
  }

  // Check admin role
  const { data: roles, error: rerr } = await client
    .from("user_roles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1);

  if (rerr || !roles || roles.length === 0) {
    // No access
    window.location.href = "/admin/admin-login.html";
    return null;
  }

  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({ id: user.id, email: user.email || undefined, role: "admin" });
    }
  } catch (_) {}

  return user;
}

async function setSellerRoleActive(client, userId, isActive) {
  // We try to find existing seller role row
  const { data: existing, error: e1 } = await client
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "seller")
    .order("created_at", { ascending: false })
    .limit(1);

  if (e1) throw e1;

  if (existing && existing.length > 0) {
    const id = existing[0].id;
    const { error } = await client
      .from("user_roles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  // Insert new role row (id might need UUID)
  const { error } = await client.from("user_roles").insert({
    id: safeUUID(),
    user_id: userId,
    role: "seller",
    is_active: isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

async function getSellerRoleActive(client, userId) {
  const { data, error } = await client
    .from("user_roles")
    .select("is_active")
    .eq("user_id", userId)
    .eq("role", "seller")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return false;
  return !!data[0].is_active;
}

async function fetchSellers(client) {
  const { data, error } = await client
    .from("sellers")
    .select("id, user_id, email, business_name, phone, region, status, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function filterList(list, search, status) {
  const q = String(search || "").trim().toLowerCase();
  const st = String(status || "").trim().toLowerCase();

  return (list || []).filter((r) => {
    if (st && String(r.status || "").toLowerCase() !== st) return false;
    if (!q) return true;

    const hay = `${r.email || ""} ${r.business_name || ""} ${r.phone || ""} ${r.region || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

async function main() {
  const errorAlert = $("errorAlert");
  const successAlert = $("successAlert");
  const rowsEl = $("rows");
  const searchEl = $("search");
  const statusEl = $("statusFilter");
  const refreshBtn = $("refreshBtn");
  const logoutBtn = $("logoutBtn");
  const adminHint = $("adminHint");

  const client = await window.supabaseReady;

  const adminUser = await requireAdmin(client);
  if (!adminUser) return;

  adminHint.textContent = `Logged in as ${adminUser.email || adminUser.id}`;

  let all = [];

  async function render() {
    hide(errorAlert);
    hide(successAlert);

    const filtered = filterList(all, searchEl.value, statusEl.value);

    if (!filtered.length) {
      rowsEl.innerHTML = `<tr><td colspan="8" style="padding:30px; text-align:center;">No sellers found.</td></tr>`;
      return;
    }

    // Enrich with seller role active
    const enriched = [];
    for (const s of filtered) {
      let active = false;
      try { active = await getSellerRoleActive(client, s.user_id); } catch (_) {}
      enriched.push({ ...s, sellerRoleActive: active });
    }

    rowsEl.innerHTML = enriched.map((s) => {
      const activeLabel = s.sellerRoleActive ? "Yes" : "No";
      return `
        <tr>
          <td>${s.email || ""}</td>
          <td>${s.business_name || ""}</td>
          <td>${s.phone || ""}</td>
          <td>${s.region || ""}</td>
          <td>${pill(s.status)}</td>
          <td>${activeLabel}</td>
          <td>${fmtDate(s.updated_at)}</td>
          <td>
            <div class="actions">
              <button class="btn green" data-action="approve" data-user="${s.user_id}">Approve</button>
              <button class="btn red" data-action="reject" data-user="${s.user_id}">Reject</button>
              <button class="btn gray" data-action="suspend" data-user="${s.user_id}">Suspend</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function load() {
    rowsEl.innerHTML = `<tr><td colspan="8" style="padding:30px; text-align:center;">Loading...</td></tr>`;
    try {
      all = await fetchSellers(client);
      await render();
    } catch (e) {
      console.error(e);
      show(errorAlert, e?.message || "Failed to load sellers.");
      rowsEl.innerHTML = `<tr><td colspan="8" style="padding:30px; text-align:center;">Error loading.</td></tr>`;
      try { if (window.Sentry && typeof window.Sentry.captureException === "function") window.Sentry.captureException(e); } catch (_) {}
    }
  }

  rowsEl.addEventListener("click", async (e) => {
    const btn = e.target?.closest("button[data-action]");
    if (!btn) return;

    hide(errorAlert);
    hide(successAlert);

    const action = btn.getAttribute("data-action");
    const userId = btn.getAttribute("data-user");

    try {
      if (!userId) throw new Error("Missing seller user_id");

      if (action === "approve") {
        // approve seller + activate seller role
        const { error } = await client
          .from("sellers")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) throw error;

        await setSellerRoleActive(client, userId, true);
        show(successAlert, "Seller approved.");
      }

      if (action === "reject") {
        const { error } = await client
          .from("sellers")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) throw error;

        await setSellerRoleActive(client, userId, false);
        show(successAlert, "Seller rejected.");
      }

      if (action === "suspend") {
        const { error } = await client
          .from("sellers")
          .update({ status: "suspended", updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        if (error) throw error;

        await setSellerRoleActive(client, userId, false);
        show(successAlert, "Seller suspended.");
      }

      await load();
    } catch (err) {
      console.error(err);
      show(errorAlert, err?.message || "Action failed.");
      try { if (window.Sentry && typeof window.Sentry.captureException === "function") window.Sentry.captureException(err); } catch (_) {}
    }
  });

  searchEl.addEventListener("input", () => render());
  statusEl.addEventListener("change", () => render());
  refreshBtn.addEventListener("click", () => load());

  logoutBtn.addEventListener("click", async () => {
    try { await client.auth.signOut(); } catch (_) {}
    try { if (window.Sentry && typeof window.Sentry.setUser === "function") window.Sentry.setUser(null); } catch (_) {}
    window.location.href = "/admin/admin-login.html";
  });

  await load();
}

main().catch((e) => {
  console.error("admin sellers fatal:", e);
  try { if (window.Sentry && typeof window.Sentry.captureException === "function") window.Sentry.captureException(e); } catch (_) {}
  window.location.href = "/admin/admin-login.html";
});
