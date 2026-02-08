function $(id) { return document.getElementById(id); }

function show(el, msg) {
  if (!el) return;
  el.textContent = msg || "";
  el.classList.add("show");
}
function hide(el) { el?.classList.remove("show"); }

function pill(status) {
  const s = String(status || "draft").toLowerCase();
  return `<span class="pill ${s}">${s}</span>`;
}

function fmtDate(ts) {
  try { return ts ? new Date(ts).toLocaleString() : ""; } catch { return ""; }
}

async function isAdmin(client, userId) {
  const { data, error } = await client
    .from("user_roles")
    .select("role,is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("role", ["admin", "moderator"])
    .maybeSingle();

  if (error) return false;
  return !!data;
}

async function logout(client) {
  try { await client.auth.signOut(); } catch (_) {}
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("sessionExpiry");
  localStorage.removeItem("role");
  try { window.Sentry?.setUser?.(null); } catch (_) {}
  window.location.href = "/admin/admin-login.html";
}

async function loadSellers(client) {
  const search = ($("search")?.value || "").trim().toLowerCase();
  const statusFilter = ($("statusFilter")?.value || "").trim().toLowerCase();

  let q = client
    .from("sellers")
    .select("id,user_id,email,business_name,phone,region,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (statusFilter) q = q.eq("status", statusFilter);

  // Simple client-side search (safe + avoids complex filters)
  const { data, error } = await q;
  if (error) throw error;

  let rows = data || [];
  if (search) {
    rows = rows.filter((r) =>
      String(r.email || "").toLowerCase().includes(search) ||
      String(r.business_name || "").toLowerCase().includes(search)
    );
  }
  return rows;
}

async function setSellerStatus(client, sellerId, status) {
  const s = String(status).toLowerCase();
  const { error } = await client
    .from("sellers")
    .update({ status: s, updated_at: new Date().toISOString() })
    .eq("id", sellerId);

  if (error) throw error;
}

function renderRows(rows) {
  const tbody = $("rows");
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center;">No sellers found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((r) => {
    return `
      <tr data-id="${r.id}">
        <td>${r.email || ""}</td>
        <td>${r.business_name || ""}</td>
        <td>${r.phone || ""}</td>
        <td>${r.region || ""}</td>
        <td>${pill(r.status)}</td>
        <td>${fmtDate(r.updated_at)}</td>
        <td>
          <div class="actions">
            <button class="btn green" data-action="approve">Approve</button>
            <button class="btn red" data-action="reject">Reject</button>
            <button class="btn gray" data-action="pending">Set Pending</button>
            <button class="btn gray" data-action="draft">Set Draft</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function main() {
  const client = await window.supabaseReady;
  if (!client) {
    window.location.href = "/admin/admin-login.html";
    return;
  }

  const { data } = await client.auth.getSession();
  const user = data?.session?.user;
  if (!user) {
    window.location.href = "/admin/admin-login.html";
    return;
  }

  const ok = await isAdmin(client, user.id);
  if (!ok) {
    await logout(client);
    return;
  }

  $("logoutBtn")?.addEventListener("click", () => logout(client));

  async function refresh() {
    hide($("errorAlert")); hide($("successAlert"));
    try {
      $("rows").innerHTML = `<tr><td colspan="7" style="padding:30px; text-align:center;">Loading...</td></tr>`;
      const rows = await loadSellers(client);
      renderRows(rows);
      show($("successAlert"), "Loaded.");
      setTimeout(() => hide($("successAlert")), 900);
    } catch (e) {
      console.error(e);
      show($("errorAlert"), e?.message || String(e));
      try { window.Sentry?.captureException?.(e); } catch (_) {}
    }
  }

  $("refreshBtn")?.addEventListener("click", refresh);
  $("statusFilter")?.addEventListener("change", refresh);
  $("search")?.addEventListener("input", () => {
    // small debounce-like behavior
    clearTimeout(window.__adminSellerSearchT);
    window.__adminSellerSearchT = setTimeout(refresh, 250);
  });

  $("rows")?.addEventListener("click", async (e) => {
    const btn = e.target?.closest("button[data-action]");
    if (!btn) return;

    const tr = e.target?.closest("tr[data-id]");
    const sellerId = tr?.getAttribute("data-id");
    const action = btn.getAttribute("data-action");
    if (!sellerId || !action) return;

    hide($("errorAlert")); hide($("successAlert"));

    try {
      btn.disabled = true;
      if (action === "approve") await setSellerStatus(client, sellerId, "approved");
      if (action === "reject") await setSellerStatus(client, sellerId, "rejected");
      if (action === "pending") await setSellerStatus(client, sellerId, "pending");
      if (action === "draft") await setSellerStatus(client, sellerId, "draft");

      show($("successAlert"), `Updated seller to ${action}.`);
      await refresh();
    } catch (err) {
      console.error(err);
      show($("errorAlert"), err?.message || String(err));
      try { window.Sentry?.captureException?.(err); } catch (_) {}
    } finally {
      btn.disabled = false;
    }
  });

  await refresh();
}

main().catch((e) => {
  console.error("Admin sellers fatal:", e);
  try { window.Sentry?.captureException?.(e); } catch (_) {}
  window.location.href = "/admin/admin-login.html";
});
