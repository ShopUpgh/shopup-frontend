// /js/pages/seller-orders.page.js
import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  const storeNameEl = document.getElementById("storeName");
  const userNameEl = document.getElementById("userName");

  const userMenuBtn = document.getElementById("userMenuBtn");
  const userDropdown = document.getElementById("userDropdown");
  const logoutBtn = document.getElementById("logoutBtn");

  const addProductBtn = document.getElementById("addProductBtn");
  const shareStoreBtn = document.getElementById("shareStoreBtn");

  const ordersContainer = document.getElementById("ordersContainer");
  const statusFilter = document.getElementById("statusFilter");
  const sortBy = document.getElementById("sortBy");

  const totalOrdersEl = document.getElementById("totalOrders");
  const pendingOrdersEl = document.getElementById("pendingOrders");
  const processingOrdersEl = document.getElementById("processingOrders");
  const completedOrdersEl = document.getElementById("completedOrders");

  const productCountEl = document.getElementById("productCount");
  const orderCountEl = document.getElementById("orderCount");

  const modal = document.getElementById("orderDetailModal");
  const closeModalBtn = document.getElementById("closeModal");
  const modalContent = document.getElementById("orderDetailContent");

  function money(v) {
    const n = Number(v || 0);
    return `GHS ${n.toFixed(2)}`;
  }

  function formatDate(ts) {
    try {
      return ts ? new Date(ts).toLocaleString() : "";
    } catch {
      return "";
    }
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

  function toggleDropdown(show) {
    if (!userDropdown) return;
    userDropdown.style.display = show ? "block" : "none";
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
                const label = o.order_number || o.id;
                return `
                  <tr>
                    <td class="order-id">${label}</td>
                    <td class="order-total">${money(o.total_amount)}</td>
                    <td><span class="order-status ${badgeClass(o.order_status)}">${o.order_status || "pending"}</span></td>
                    <td>${o.payment_status || "unpaid"}</td>
                    <td class="order-date">${formatDate(o.created_at)}</td>
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

    if (orderCountEl) orderCountEl.textContent = total;
  }

  async function loadCounts(client, sellerId) {
    // products
    try {
      const { data: products, error } = await client.from("products").select("id").eq("seller_id", sellerId);
      if (!error && productCountEl) productCountEl.textContent = products?.length || 0;
    } catch (_) {}
  }

  async function fetchOrders(client, sellerId) {
    let q = client
      .from("orders")
      .select("id, order_number, total_amount, order_status, payment_status, payment_reference, created_at")
      .eq("seller_id", sellerId);

    const status = statusFilter?.value;
    if (status) q = q.eq("order_status", status);

    const sort = sortBy?.value || "newest";
    if (sort === "oldest") q = q.order("created_at", { ascending: true });
    else if (sort === "highest") q = q.order("total_amount", { ascending: false });
    else if (sort === "lowest") q = q.order("total_amount", { ascending: true });
    else q = q.order("created_at", { ascending: false });

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function fetchOrderDetails(client, orderId) {
    const { data: order, error: orderError } = await client
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await client
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemsError) throw itemsError;

    return { order, items: items || [] };
  }

  function openModal() {
    if (!modal) return;
    modal.classList.add("show");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    if (modalContent) modalContent.innerHTML = "";
  }

  function renderModal({ order, items }, onUpdateStatus) {
    const label = order.order_number || order.id;

    modalContent.innerHTML = `
      <div class="order-detail-section">
        <h4>Order Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Order</span>
            <span class="detail-value">${label}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="detail-value">${order.order_status || "pending"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment</span>
            <span class="detail-value">${order.payment_status || "unpaid"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total</span>
            <span class="detail-value">${money(order.total_amount)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Created</span>
            <span class="detail-value">${formatDate(order.created_at)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Ref</span>
            <span class="detail-value">${order.payment_reference || "-"}</span>
          </div>
        </div>
      </div>

      <div class="order-detail-section">
        <h4>Items</h4>
        <div class="order-items-list">
          ${
            items.length
              ? items
                  .map(
                    (it) => `
                    <div class="order-item-card">
                      <div class="item-image">🧾</div>
                      <div class="item-details">
                        <div class="item-name">${it.product_name || "Item"}</div>
                        <div class="item-price">
                          Qty: ${it.quantity} • Unit: ${money(it.unit_price)} • Subtotal: ${money(it.subtotal)}
                        </div>
                      </div>
                    </div>
                  `
                  )
                  .join("")
              : `<div style="color:#666;">No items found for this order.</div>`
          }
        </div>
      </div>

      <div class="order-detail-section">
        <h4>Update Status</h4>
        <div class="status-update-section">
          <select class="status-select" id="statusSelect">
            <option value="pending" ${String(order.order_status).toLowerCase()==="pending"?"selected":""}>Pending</option>
            <option value="processing" ${String(order.order_status).toLowerCase()==="processing"?"selected":""}>Processing</option>
            <option value="shipped" ${String(order.order_status).toLowerCase()==="shipped"?"selected":""}>Shipped</option>
            <option value="delivered" ${String(order.order_status).toLowerCase()==="delivered"?"selected":""}>Delivered</option>
            <option value="cancelled" ${String(order.order_status).toLowerCase()==="cancelled"?"selected":""}>Cancelled</option>
          </select>
          <button class="btn-update-status" id="updateStatusBtn">Update</button>
          <div id="statusMsg" style="margin-top:10px; color:#666; font-size:0.9rem;"></div>
        </div>
      </div>
    `;

    const btn = document.getElementById("updateStatusBtn");
    const sel = document.getElementById("statusSelect");
    const msg = document.getElementById("statusMsg");

    btn.addEventListener("click", async () => {
      const next = sel.value;
      btn.disabled = true;
      msg.textContent = "Updating...";
      try {
        await onUpdateStatus(next);
        msg.textContent = "✅ Updated";
      } catch (e) {
        msg.textContent = `❌ ${e.message || "Update failed"}`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  async function main() {
    if (typeof Sentry !== "undefined") {
      Sentry.addBreadcrumb({ category: "navigation", message: "Seller orders viewed", level: "info" });
    }

    const auth = await requireSellerSession({ redirectTo: "/seller/seller-login.html" });
    if (!auth) return;

    const { client, user } = auth;

    // UI identity
    const short = (user.email || "Seller").split("@")[0];
    if (userNameEl) userNameEl.textContent = short;
    if (storeNameEl) storeNameEl.textContent = `${short}'s Store`;

    try {
      if (typeof Sentry !== "undefined") Sentry.setUser({ id: user.id, email: user.email, role: "seller" });
    } catch (_) {}

    // dropdown
    if (userMenuBtn) {
      userMenuBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const open = userDropdown && userDropdown.style.display !== "none";
        toggleDropdown(!open);
      });
    }
    document.addEventListener("click", (e) => {
      if (!userDropdown || !userMenuBtn) return;
      if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) toggleDropdown(false);
    });

    // quick actions
    if (addProductBtn) addProductBtn.addEventListener("click", () => (window.location.href = "products.html?action=add"));
    if (shareStoreBtn) {
      shareStoreBtn.addEventListener("click", async () => {
        const url = `${window.location.origin}/seller/${user.id}`;
        try {
          await navigator.clipboard.writeText(url);
          alert("Store link copied!");
        } catch {
          prompt("Copy your store link:", url);
        }
      });
    }

    // logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        await client.auth.signOut();
        if (typeof Sentry !== "undefined") Sentry.setUser(null);
        window.location.href = "/seller/seller-login.html";
      });
    }

    // counts
    await loadCounts(client, user.id);

    // load orders
    let rows = await fetchOrders(client, user.id);
    updateStats(rows);
    rows.length ? renderTable(rows) : renderEmpty();

    // filter/sort
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

    // modal close
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // view click
    ordersContainer.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-order-id]");
      if (!btn) return;

      const orderId = btn.getAttribute("data-order-id");
      try {
        const details = await fetchOrderDetails(client, orderId);

        renderModal(details, async (nextStatus) => {
          // Seller update (RLS must allow seller_id = auth.uid())
          const patch = { order_status: nextStatus, updated_at: new Date().toISOString() };
          if (nextStatus === "shipped") patch.shipped_at = new Date().toISOString();
          if (nextStatus === "delivered") patch.delivered_at = new Date().toISOString();
          if (nextStatus === "cancelled") patch.cancelled_at = new Date().toISOString();

          const { error } = await client.from("orders").update(patch).eq("id", orderId);
          if (error) throw error;

          // refresh list after update
          rows = await fetchOrders(client, user.id);
          updateStats(rows);
          rows.length ? renderTable(rows) : renderEmpty();
        });

        openModal();
      } catch (err) {
        console.error("Failed to open order:", err);
        if (typeof Sentry !== "undefined") Sentry.captureException(err);
        alert(err.message || "Failed to load order details.");
      }
    });
  }

  main().catch((e) => {
    console.error("Seller orders fatal error:", e);
    if (typeof Sentry !== "undefined") Sentry.captureException(e);
  });
})();
