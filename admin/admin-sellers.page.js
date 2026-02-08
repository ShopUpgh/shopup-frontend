// /admin/admin-sellers.page.js
async function requireAdmin(client) {
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.user) return false;

  // Must be admin in public.user_roles
  const userId = data.session.user.id;

  const res = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);

  if (res.error) return false;
  return (res.data || []).length > 0;
}

function pill(status) {
  const s = String(status || "draft").toLowerCase();
  const cls = ["draft", "pending", "approved", "rejected"].includes(s) ? s : "draft";
  return `<span class="pill ${cls}">${cls}</span>`;
}

function fmt(ts) {
  try { return ts ? new Date(ts).toLocaleString() : ""; } catch { return ""; }
}

const $ = (id) => document.getElementById(id);

function show(el, msg) { el.textContent = msg; el.classList.add("show"); }
function hide(el) { el.classList.remove("show"); }

async function logAdminAction(client, adminId, action, targetId, changes) {
  // Optional: if table exists + policy allows, log it; otherwise silently skip.
  try {
    await client.from("admin_activity_logs").insert({
      admin_id: adminId,
      action,
      target_type: "seller",
      target_id: targetId,
      changes: changes || {},
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}

async function main() {
  const client = await window.supabaseReady;

  const errorAlert = $("errorAlert");
  const successAlert = $("successAlert");
  const rowsEl = $("rows");

  const searchEl = $("search");
  const statusFilterEl = $("statusFilter");
  const refreshBtn = $("refreshBtn");
  const logoutBtn = $("logoutBtn");

  hide(errorAlert); hide(successAlert);

  const ok = await requireAdmin(client);
  if (!ok) {
    show(errorAlert, "Admin access required. Please login as an admin.");
    rowsEl.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center;">Not authorized.</td></tr>`;
    return;
  }

  const { data: sess } = await client.auth.getSession();
  const adminUser = sess?.session?.user;

  async function load() {
    hide(errorAlert); hide(successAlert);
    rowsEl.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center;">Loading...</td></tr>`;

    const q = (searchEl.value || "").trim().toLowerCase();
    const status = (statusFilterEl.value || "").trim().toLowerCase();

    // Pull recent sellers (simple)
    let query = client
      .from("sellers")
      .select("id, user_id, email, business_name, phone, region, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (status) query = query.eq("status", status);

    const res = await query;
    if (res.error) {
      show(errorAlert, res.error.message || String(res.error));
      rowsEl.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center;">Failed to load.</td></tr>`;
      return;
    }

    let list = res.data || [];
    if (q) {
      list = list.filter((r) =>
        String(r.email || "").toLowerCase().includes(q) ||
        String(r.business_name || "").toLowerCase().includes(q)
      );
    }

    if (!list.length) {
      rowsEl.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center;">No sellers found.</td></tr>`;
      return;
    }

    rowsEl.innerHTML = list.map((r) => `
      <tr>
        <td>${r.email || ""}</td>
        <td>${r.business_name || ""}</td>
        <td>${r.phone || ""}</td>
        <td>${r.region || ""}</td>
        <td>${pill(r.status)}</td>
        <td>${fmt(r.updated_at)}</td>
        <td>
          <div class="actions">
            <button class="btn green" data-action="approve" data-id="${r.id}">Approve</button>
            <button class="btn red" data-action="reject" data-id="${r.id}">Reject</button>
          </div>
        </td>
      </tr>
    `).join("");

    // Wire buttons
    rowsEl.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        hide(errorAlert); hide(successAlert);

        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const nextStatus = action === "approve" ? "approved" : "rejected";

        btn.disabled = true;

        const upd = await client
          .from("sellers")
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("id, status")
          .maybeSingle();

        btn.disabled = false;

        if (upd.error) {
          show(errorAlert, upd.error.message || String(upd.error));
          return;
        }

        await logAdminAction(client, adminUser?.id, `seller_${nextStatus}`, id, { status: nextStatus });

        show(successAlert, `Seller updated: ${nextStatus}`);
        await load();
      });
    });
  }

  refreshBtn.addEventListener("click", load);
  searchEl.addEventListener("input", () => { /* live filter */ load(); });
  statusFilterEl.addEventListener("change", load);

  logoutBtn.addEventListener("click", async () => {
    try { await client.auth.signOut(); } catch (_) {}
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("role");
    try { window.ShopUpSentry?.setUserSafe?.(null); } catch (_) {}
    window.location.href = "/admin/admin-login.html";
  });

  await load();
}

main().catch((e) => {
  console.error(e);
  try { window.ShopUpSentry?.captureExceptionSafe?.(e); } catch (_) {}
});
