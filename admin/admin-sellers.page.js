// /admin/admin-sellers.page.js
const $ = (id) => document.getElementById(id);

function showError(msg) {
  const el = $("errorAlert");
  el.textContent = msg;
  el.classList.add("show");
  $("successAlert").classList.remove("show");
}
function showSuccess(msg) {
  const el = $("successAlert");
  el.textContent = msg;
  el.classList.add("show");
  $("errorAlert").classList.remove("show");
}
function pill(status) {
  const s = String(status || "draft").toLowerCase();
  const cls = ["draft","pending","approved","rejected","suspended"].includes(s) ? s : "draft";
  return `<span class="pill ${cls}">${cls}</span>`;
}
function fmtDate(ts) {
  try { return ts ? new Date(ts).toLocaleString() : ""; } catch { return ""; }
}

async function requireAdmin(client) {
  const { data } = await client.auth.getSession();
  const user = data?.session?.user;
  if (!user) {
    window.location.href = "/admin/admin-login.html";
    return null;
  }

  // must be admin/moderator + active
  const { data: roleRow, error } = await client
    .from("user_roles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["admin", "moderator"])
    .maybeSingle();

  if (error || !roleRow) {
    await client.auth.signOut().catch(() => {});
    window.location.href = "/admin/admin-login.html?err=not_admin";
    return null;
  }

  return user;
}

async function fetchSellers(client) {
  const search = ($("search").value || "").trim().toLowerCase();
  const status = $("statusFilter").value;
  const activeFilter = $("activeFilter").value;

  let q = client
    .from("sellers")
    .select("id,user_id,email,business_name,phone,region,status,updated_at,is_active", { count: "exact" })
    .order("updated_at", { ascending: false });

  if (status) q = q.eq("status", status);
  if (activeFilter === "true") q = q.eq("is_active", true);
  if (activeFilter === "false") q = q.eq("is_active", false);

  // simple search (OR)
  if (search) {
    q = q.or(`email.ilike.%${search}%,business_name.ilike.%${search}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

function renderRows(list) {
  const tbody = $("rows");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:30px;text-align:center;">No sellers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((s) => {
    const status = String(s.status || "draft").toLowerCase();

    return `
      <tr>
        <td><strong>${s.email || ""}</strong><div style="color:#6b7b8a;font-size:12px;">${s.user_id || ""}</div></td>
        <td>${s.business_name || ""}</td>
        <td>${s.phone || ""}</td>
        <td>${s.region || ""}</td>
        <td>${pill(status)} <div style="color:#6b7b8a;font-size:12px;">active: ${s.is_active === false ? "false" : "true"}</div></td>
        <td>${fmtDate(s.updated_at)}</td>
        <td>
          <div class="actions">
            <button class="btn green" data-act="approve" data-id="${s.id}">Approve</button>
            <button class="btn red" data-act="reject" data-id="${s.id}">Reject</button>
            <button class="btn gray" data-act="suspend" data-id="${s.id}">Suspend</button>
            <button class="btn gray" data-act="toggleActive" data-id="${s.id}" style="border:2px solid #e7edf5;">
              ${s.is_active === false ? "Set Active" : "Disable"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function updateSeller(client, sellerId, patch) {
  const { error } = await client
    .from("sellers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", sellerId);

  if (error) throw error;
}

async function main() {
  const client = await window.supabaseReady;

  const user = await requireAdmin(client);
  if (!user) return;

  // Logout
  $("logoutBtn").addEventListener("click", async () => {
    await client.auth.signOut().catch(() => {});
    window.location.href = "/admin/admin-login.html";
  });

  async function refresh() {
    try {
      $("errorAlert").classList.remove("show");
      $("successAlert").classList.remove("show");
      $("rows").innerHTML = `<tr><td colspan="7" style="padding:30px;text-align:center;">Loading...</td></tr>`;
      const sellers = await fetchSellers(client);
      renderRows(sellers);
    } catch (e) {
      showError(e?.message || String(e));
    }
  }

  $("refreshBtn").addEventListener("click", refresh);
  $("statusFilter").addEventListener("change", refresh);
  $("activeFilter").addEventListener("change", refresh);
  $("search").addEventListener("input", () => {
    clearTimeout(window.__adminSellerSearchT);
    window.__adminSellerSearchT = setTimeout(refresh, 250);
  });

  $("rows").addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-act]");
    if (!btn) return;

    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");

    try {
      btn.disabled = true;

      if (act === "approve") {
        await updateSeller(client, id, { status: "approved", is_active: true });
        showSuccess("Seller approved.");
      } else if (act === "reject") {
        await updateSeller(client, id, { status: "rejected", is_active: false });
        showSuccess("Seller rejected.");
      } else if (act === "suspend") {
        await updateSeller(client, id, { status: "suspended", is_active: false });
        showSuccess("Seller suspended.");
      } else if (act === "toggleActive") {
        // We need current state. Simple approach: flip based on button text:
        const makeActive = btn.textContent.trim().toLowerCase().includes("set active");
        await updateSeller(client, id, { is_active: makeActive });
        showSuccess(makeActive ? "Seller activated." : "Seller disabled.");
      }

      await refresh();
    } catch (e) {
      showError(e?.message || String(e));
    } finally {
      btn.disabled = false;
    }
  });

  await refresh();
}

main().catch((e) => {
  console.error(e);
  showError(e?.message || String(e));
});
