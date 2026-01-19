// /js/pages/seller-orders.page.js
import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  const ordersContainer = document.getElementById("ordersContainer");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");

  const totalOrdersEl = document.getElementById("totalOrders");
  const pendingOrdersEl = document.getElementById("pendingOrders");
  const processingOrdersEl = document.getElementById("processingOrders");
  const completedOrdersEl = document.getElementById("completedOrders");

  function money(v) {
    const n = Number(v || 0);
    return `GHS ${n.toFixed(2)}`;
  }

  function badgeClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "pending") return "status-pending";
    if (s === "processing") return "status-processing";
    if (s === "shipped") return "status-shipped";
    if (s === "delivered") return "status-delivered";
    if (s === "cancelled") return "status-cancelled";
    return "status-pending";
  }

  function renderEmpty() {
    ordersContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>No orders yet</h3>
        <p>Your customer orders will show here when they arrive.</p>
      </div>
    `;
  }

  function renderTable(rows) {
    ordersContainer.innerHTML = `
      <div class="orders-table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((o) => {
                const d = o.created_at ? new Date(o.created_at) : null;
                const dateText = d ? d.toLocaleString() : "";
                return `
                  <tr>
                    <td class="order-id">${o.order_number || o.id}</td>
                    <td class="order-total">${money(o.total_amount)}</td>
                    <td><span class="order-status ${badgeClass(o.order_status)}">${o.order_status || "pending"}</span></td>
                    <td>${o.payment_status || "unpaid"}</td>
                    <td class="order-date">${dateText}</td>
                    <td class="order-actions">
                      <button class="btn-view" data-order-id="${o.id}">View</button>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function updateStats(rows) {
    const total = rows.length;
    const pending = rows.filter((r) => (r.order_status || "").toLowerCase() === "pending").length;
    const processing = rows.filter((r) => (r.order_status || "").toLowerCase() === "processing").length;
    const completed = rows.filter((r) => (r.order_status || "").toLowerCase() === "delivered").length;

    if (totalOrdersEl) totalOrdersEl.textContent = total;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pending;
    if (processingOrdersEl) processingOrdersEl.textContent = processing;
    if (completedOrdersEl) completedOrdersEl.textContent = completed;
  }

  async function fetchOrders(client, sellerId) {
    let q = client.from("orders").select("*").eq("seller_id", sellerId);

    const status = statusFilter?.value;
    if (status) q = q.eq("order_status", status);

    // sorting
    const sort = sortBy?.value || "newest";
    if (sort === "oldest") q = q.order("created_at", { ascending: true });
    else if (sort === "highest") q = q.order("total_amount", { ascending: false });
    else if (sort === "lowest") q = q.order("total_amount", { ascending: true });
    else q = q.order("created_at", { ascending: false });

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function main() {
    const auth = await requireSellerSession({ redirectTo: "/seller/seller-login.html" });
    if (!auth) return;

    const { client, user } = auth;

    // initial load
    let rows = await fetchOrders(client, user.id);
    updateStats(rows);

    if (!rows.length) renderEmpty();
    else renderTable(rows);

    // filter/sort events
    if (statusFilter) {
      statusFilter.addEventListener("change", async () => {
        rows = await fetchOrders(client, user.id);
        updateStats(rows);
        rows.length ? renderTable(rows) : renderEmpty();
      });
    }

    if (sortBy) {
      sortBy.addEventListener("change", async () => {
        rows = await fetchOrders(client, user.id);
        updateStats(rows);
        rows.length ? renderTable(rows) : renderEmpty();
      });
    }

    // view click (hook for your modal later)
    ordersContainer?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-order-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-order-id");
      alert(`Order detail modal next: ${id}`);
    });
  }

  main().catch((e) => {
    console.error("Seller orders fatal error:", e);
    if (typeof Sentry !== "undefined") Sentry.captureException(e);
  });
})();
