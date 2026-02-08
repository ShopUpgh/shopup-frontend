// /admin/admin-sellers.page.js
(function () {
  "use strict";

  function pillClass(status) {
    const s = String(status || "draft").toLowerCase();
    if (["draft","pending","approved","rejected","suspended","disabled"].includes(s)) return s;
    return "draft";
  }

  function fmt(ts) {
    try { return ts ? new Date(ts).toLocaleString() : ""; } catch { return ""; }
  }

  function showAlert(id, msg) {
    const ok = document.getElementById("okAlert");
    const err = document.getElementById("errAlert");
    if (ok) ok.classList.remove("show");
    if (err) err.classList.remove("show");

    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
  }

  async function getClient() {
    const client = await window.supabaseReady;
    return client;
  }

  async function loadSellers({ status = "", q = "" }) {
    const client = await getClient();

    let query = client
      .from("sellers")
      .select("id, user_id, email, business_name, phone, status, updated_at")
      .order("updated_at", { ascending: false });

    if (status) query = query.eq("status", status);

    if (q) {
      // Basic search: use OR across fields (Supabase PostgREST syntax)
      // NOTE: ilike needs %...%
      const like = `%${q}%`;
      query = query.or(`email.ilike.${like},business_name.ilike.${like},phone.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function setSellerStatus(userId, status) {
    const client = await getClient();
    const { data, error } = await client
      .from("sellers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select("id, user_id, email, business_name, status, updated_at")
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  function render(rows) {
    const tbody = document.getElementById("rows");
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted">No sellers found.</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((r) => {
      const status = String(r.status || "draft").toLowerCase();
      return `
        <tr>
          <td>
            <div><strong>${r.email || "—"}</strong></div>
            <div class="muted" style="font-size:12px;">user_id: ${r.user_id || "—"}</div>
          </td>
          <td>
            <div><strong>${r.business_name || "—"}</strong></div>
            <div class="muted" style="font-size:12px;">${r.phone || ""}</div>
          </td>
          <td><span class="pill ${pillClass(status)}">${status}</span></td>
          <td class="muted">${fmt(r.updated_at)}</td>
          <td>
            <div class="actions">
              <button class="btn ok" data-action="approved" data-user="${r.user_id}">Approve</button>
              <button class="btn err" data-action="rejected" data-user="${r.user_id}">Reject</button>
              <button class="btn warn" data-action="suspended" data-user="${r.user_id}">Suspend</button>
              <button class="btn ghost" data-action="draft" data-user="${r.user_id}">Back to Draft</button>
              <button class="btn ghost" data-action="disabled" data-user="${r.user_id}">Disable</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Bind buttons
    tbody.querySelectorAll("button[data-action][data-user]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.getAttribute("data-user");
        const status = btn.getAttribute("data-action");

        if (!userId || !status) return;

        // Confirm destructive actions
        if (status === "disabled") {
          const ok = confirm("Disable this seller? They will be blocked from dashboard.");
          if (!ok) return;
        }

        try {
          btn.disabled = true;
          await setSellerStatus(userId, status);
          showAlert("okAlert", `Updated seller ${userId} → ${status}`);

          // refresh current view
          document.getElementById("refreshBtn")?.click();
        } catch (e) {
          showAlert("errAlert", e?.message || "Update failed.");
          try { if (window.Sentry) window.Sentry.captureException(e); } catch (_) {}
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  async function main() {
    const refreshBtn = document.getElementById("refreshBtn");
    const statusFilter = document.getElementById("statusFilter");
    const searchBox = document.getElementById("searchBox");
    const logoutBtn = document.getElementById("logoutBtn");

    async function refresh() {
      try {
        const status = statusFilter?.value || "";
        const q = (searchBox?.value || "").trim();
        const rows = await loadSellers({ status, q });
        render(rows);
      } catch (e) {
        showAlert("errAlert", e?.message || "Failed to load sellers.");
        try { if (window.Sentry) window.Sentry.captureException(e); } catch (_) {}
      }
    }

    refreshBtn?.addEventListener("click", refresh);
    statusFilter?.addEventListener("change", refresh);
    searchBox?.addEventListener("input", () => {
      // lightweight debounce
      clearTimeout(window.__adminSellerSearchT);
      window.__adminSellerSearchT = setTimeout(refresh, 250);
    });

    logoutBtn?.addEventListener("click", async () => {
      try {
        const client = await getClient();
        try { await client.auth.signOut(); } catch (_) {}
      } finally {
        window.location.href = "/admin/admin-login.html";
      }
    });

    await refresh();
  }

  main();
})();
