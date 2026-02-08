// /admin/admin-sellers.page.js
// Admin Sellers Management (approve/reject) for ShopUp
// Requires:
// - window.supabaseReady (from /js/supabase-init.js)
// - public.user_roles: user_id, role, is_active
// - public.sellers: status, user_id, email, business_name, phone, region, updated_at

const ADMIN_LOGIN_URL = "/admin/admin-login.html";
const AFTER_LOGOUT_URL = "/admin/admin-login.html";

function qs(id) {
  return document.getElementById(id);
}

function safeText(v) {
  return (v === null || v === undefined) ? "" : String(v);
}

function fmtDate(ts) {
  try {
    return ts ? new Date(ts).toLocaleString() : "";
  } catch {
    return "";
  }
}

function statusPill(statusRaw) {
  const s = (statusRaw || "draft").toLowerCase();
  const cls = ["draft","pending","approved","rejected"].includes(s) ? s : "draft";
  return `<span class="pill ${cls}">${cls}</span>`;
}

function showAlert(kind, msg) {
  const errorAlert = qs("errorAlert");
  const successAlert = qs("successAlert");

  if (!errorAlert || !successAlert) return;

  errorAlert.classList.remove("show");
  successAlert.classList.remove("show");

  if (!msg) return;

  if (kind === "error") {
    errorAlert.textContent = msg;
    errorAlert.classList.add("show");
  } else {
    successAlert.textContent = msg;
    successAlert.classList.add("show");
  }
}

function redirectToLogin() {
  window.location.href = ADMIN_LOGIN_URL;
}

async function getClient() {
  const client = await window.supabaseReady;
  return client;
}

async function requireAdmin(client) {
  // Must be logged in
  const { data, error } = await client.auth.getSession();
  if (error) return { ok: false, reason: error.message };
  const user = data?.session?.user;
  if (!user) return { ok: false, reason: "Not logged in" };

  // Must have role admin + active
  const { data: roles, error: roleErr } = await client
    .from("user_roles")
    .select("role,is_active")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("is_active", true)
    .limit(1);

  if (roleErr) return { ok: false, reason: roleErr.message };
  if (!roles || roles.length === 0) return { ok: false, reason: "Admin access required" };

  // Sentry safe setUser
  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") {
      window.Sentry.setUser({ id: String(user.id), email: user.email || undefined, role: "admin" });
    }
  } catch (_) {}

  return { ok: true, user };
}

async function fetchSellers(client) {
  // Adjust columns as needed; keep minimal and safe
  const { data, error } = await client
    .from("sellers")
    .select("id,user_id,email,business_name,phone,region,status,updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

function applyFilters(rows, search, status) {
  const s = (search || "").trim().toLowerCase();
  const f = (status || "").trim().toLowerCase();

  return (rows || []).filter((r) => {
    const hay = [
      r.email,
      r.business_name,
      r.phone,
      r.region,
      r.status,
      r.user_id,
    ]
      .map((x) => safeText(x).toLowerCase())
      .join(" ");

    const matchSearch = !s || hay.includes(s);
    const matchStatus = !f || safeText(r.status).toLowerCase() === f;

    return matchSearch && matchStatus;
  });
}

function renderTable(rows) {
  const tbody = qs("rows");
  if (!tbody) return;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 30px; text-align:center;">No sellers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((r) => {
      const email = safeText(r.email);
      const biz = safeText(r.business_name);
      const phone = safeText(r.phone);
      const region = safeText(r.region);
      const updated = fmtDate(r.updated_at);
      const status = safeText(r.status || "draft").toLowerCase();
      const userId = safeText(r.user_id);
      const id = safeText(r.id);

      // Buttons disable when already approved/rejected optionally
      const approveDisabled = status === "approved" ? "disabled" : "";
      const rejectDisabled = status === "rejected" ? "disabled" : "";

      return `
        <tr data-seller-row="1" data-id="${id}" data-user-id="${userId}">
          <td>
            <div><strong>${email || "(no email)"}</strong></div>
            <div class="muted mono">${userId ? `user_id: ${userId}` : ""}</div>
          </td>
          <td>${biz || "-"}</td>
          <td>${phone || "-"}</td>
          <td>${region || "-"}</td>
          <td>${statusPill(status)}</td>
          <td>${updated || "-"}</td>
          <td>
            <div class="actions">
              <button class="btn green" data-action="approve" ${approveDisabled}>Approve</button>
              <button class="btn red" data-action="reject" ${rejectDisabled}>Reject</button>
              <button class="btn gray" data-action="pending">Set Pending</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function updateSellerStatus(client, sellerId, newStatus) {
  const status = String(newStatus || "").toLowerCase();

  if (!["draft", "pending", "approved", "rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  const { error } = await client
    .from("sellers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", sellerId);

  if (error) throw error;
}

async function logout(client) {
  try {
    await client.auth.signOut();
  } catch (_) {}

  // Clear any optional local keys (safe, won't hurt)
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("role");
  } catch (_) {}

  try {
    if (window.Sentry && typeof window.Sentry.setUser === "function") window.Sentry.setUser(null);
  } catch (_) {}

  window.location.href = AFTER_LOGOUT_URL;
}

async function main() {
  const searchEl = qs("search");
  const statusFilterEl = qs("statusFilter");
  const refreshBtn = qs("refreshBtn");
  const logoutBtn = qs("logoutBtn");
  const adminHint = qs("adminHint");

  const client = await getClient();
  if (!client) {
    showAlert("error", "Supabase client not available. Check /js/supabase-init.js");
    return;
  }

  const admin = await requireAdmin(client);
  if (!admin.ok) {
    // Don’t show internal info on prod; just redirect.
    redirectToLogin();
    return;
  }

  if (adminHint) {
    adminHint.textContent = `Logged in as admin: ${admin.user.email || admin.user.id}`;
  }

  let allRows = [];

  async function reload() {
    showAlert("", "");
    renderTable([{ loading: true }]); // placeholder row not used, but keeps UI alive

    try {
      allRows = await fetchSellers(client);

      const search = searchEl ? searchEl.value : "";
      const status = statusFilterEl ? statusFilterEl.value : "";
      const filtered = applyFilters(allRows, search, status);
      renderTable(filtered);
    } catch (e) {
      console.error("Admin sellers load error:", e);
      showAlert("error", e?.message || "Failed to load sellers");
      renderTable([]);
      try {
        if (window.Sentry && typeof window.Sentry.captureException === "function") {
          window.Sentry.captureException(e);
        }
      } catch (_) {}
    }
  }

  // Events
  if (refreshBtn) refreshBtn.addEventListener("click", reload);

  if (searchEl) searchEl.addEventListener("input", () => {
    const filtered = applyFilters(allRows, searchEl.value, statusFilterEl?.value || "");
    renderTable(filtered);
  });

  if (statusFilterEl) statusFilterEl.addEventListener("change", () => {
    const filtered = applyFilters(allRows, searchEl?.value || "", statusFilterEl.value);
    renderTable(filtered);
  });

  // Row action handler (event delegation)
  document.addEventListener("click", async (ev) => {
    const btn = ev.target?.closest?.("button[data-action]");
    if (!btn) return;

    const tr = btn.closest("tr[data-seller-row]");
    if (!tr) return;

    const sellerId = tr.getAttribute("data-id");
    const action = btn.getAttribute("data-action");

    if (!sellerId) return;

    let newStatus = null;
    if (action === "approve") newStatus = "approved";
    if (action === "reject") newStatus = "rejected";
    if (action === "pending") newStatus = "pending";
    if (!newStatus) return;

    btn.disabled = true;
    showAlert("", "");

    try {
      await updateSellerStatus(client, sellerId, newStatus);
      showAlert("success", `Seller updated: ${newStatus}`);
      await reload();
    } catch (e) {
      console.error("Update status error:", e);
      showAlert("error", e?.message || "Failed to update seller");
      btn.disabled = false;

      try {
        if (window.Sentry && typeof window.Sentry.captureException === "function") {
          window.Sentry.captureException(e);
        }
      } catch (_) {}
    }
  });

  if (logoutBtn) logoutBtn.addEventListener("click", () => logout(client));

  await reload();
}

main().catch((e) => {
  console.error("Admin sellers fatal error:", e);
  try {
    if (window.Sentry && typeof window.Sentry.captureException === "function") {
      window.Sentry.captureException(e);
    }
  } catch (_) {}
});
