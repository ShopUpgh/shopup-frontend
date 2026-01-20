// /js/pages/seller-dashboard.page.js
import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  const elSellerName = document.getElementById("sellerName");
  const logoutBtn = document.getElementById("logoutBtn");

  const totalRevenueEl = document.getElementById("totalRevenue");
  const totalOrdersEl = document.getElementById("totalOrders");
  const pendingOrdersEl = document.getElementById("pendingOrders");
  const activeProductsEl = document.getElementById("activeProducts");

  const recentOrdersBody = document.getElementById("recentOrders");
  const salesChartCanvas = document.getElementById("salesChart");

  const addProductBtn = document.getElementById("addProductBtn");
  const viewOrdersBtn = document.getElementById("viewOrdersBtn");

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

  function formatDate(ts) {
    try {
      return ts ? new Date(ts).toLocaleString() : "";
    } catch {
      return "";
    }
  }

  function dayKey(d) {
    // YYYY-MM-DD in local time
    const x = new Date(d);
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function loadActiveProducts(client, sellerId) {
    const { data, error } = await client
      .from("products")
      .select("id")
      .eq("seller_id", sellerId);

    if (error) throw error;
    activeProductsEl.textContent = data?.length || 0;
  }

  async function loadOrdersSummary(client, sellerId) {
    // Pull a reasonable recent window for dashboard (last 30 days)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: orders, error } = await client
      .from("orders")
      .select("id, order_number, total_amount, order_status, payment_status, created_at")
      .eq("seller_id", sellerId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    const all = orders || [];
    const totalOrders = all.length;
    const pending = all.filter((o) => (o.order_status || "").toLowerCase() === "pending").length;
    const revenue = all
      .filter((o) => (o.order_status || "").toLowerCase() === "delivered")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    totalOrdersEl.textContent = totalOrders;
    pendingOrdersEl.textContent = pending;
    totalRevenueEl.textContent = money(revenue);

    return all;
  }

  function renderRecentOrders(orders) {
    const rows = (orders || []).slice(0, 8);

    if (!rows.length) {
      recentOrdersBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:40px;">No recent orders yet.</td>
        </tr>
      `;
      return;
    }

    recentOrdersBody.innerHTML = rows
      .map((o) => {
        const label = o.order_number || o.id;
        return `
          <tr>
            <td><strong>${label}</strong></td>
            <td>${money(o.total_amount)}</td>
            <td><span class="status-badge ${badgeClass(o.order_status)}">${o.order_status || "pending"}</span></td>
            <td>${o.payment_status || "unpaid"}</td>
            <td>${formatDate(o.created_at)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderSalesChart(orders) {
    if (!salesChartCanvas || typeof Chart === "undefined") return;

    // last 7 days buckets (delivered only)
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const labels = days.map((d) =>
      d.toLocaleDateString(undefined, { weekday: "short" })
    );

    const byDay = new Map();
    days.forEach((d) => byDay.set(dayKey(d), 0));

    (orders || [])
      .filter((o) => (o.order_status || "").toLowerCase() === "delivered")
      .forEach((o) => {
        if (!o.created_at) return;
        const k = dayKey(o.created_at);
        if (!byDay.has(k)) return;
        byDay.set(k, byDay.get(k) + Number(o.total_amount || 0));
      });

    const data = days.map((d) => byDay.get(dayKey(d)) || 0);

    // Destroy old chart if re-rendered
    if (window.__sellerSalesChart && typeof window.__sellerSalesChart.destroy === "function") {
      window.__sellerSalesChart.destroy();
    }

    const ctx = salesChartCanvas.getContext("2d");
    window.__sellerSalesChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Sales (GHS)",
            data,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });
  }

  async function main() {
    if (typeof Sentry !== "undefined") {
      Sentry.addBreadcrumb({
        category: "navigation",
        message: "Seller dashboard viewed",
        level: "info",
      });
    }

    const auth = await requireSellerSession({ redirectTo: "/seller/seller-login.html" });
    if (!auth) return;

    const { client, user } = auth;

    if (elSellerName) elSellerName.textContent = (user.email || "Seller").split("@")[0];

    try {
      if (typeof Sentry !== "undefined") {
        Sentry.setUser({ id: user.id, email: user.email, role: "seller" });
      }
    } catch (_) {}

    // Quick actions
    if (addProductBtn) addProductBtn.addEventListener("click", () => (window.location.href = "products.html?action=add"));
    if (viewOrdersBtn) viewOrdersBtn.addEventListener("click", () => (window.location.href = "orders.html"));

    // Load stats + orders
    const [orders] = await Promise.all([
      loadOrdersSummary(client, user.id),
      loadActiveProducts(client, user.id),
    ]);

    renderRecentOrders(orders);
    renderSalesChart(orders);

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await client.auth.signOut();

          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("sessionExpiry");
          localStorage.removeItem("role");

          if (typeof Sentry !== "undefined") Sentry.setUser(null);

          window.location.href = "/seller/seller-login.html";
        } catch (e) {
          console.error("Logout error:", e);
          if (typeof Sentry !== "undefined") Sentry.captureException(e);
        }
      });
    }
  }

  main().catch((e) => {
    console.error("Seller dashboard fatal error:", e);
    if (typeof Sentry !== "undefined") Sentry.captureException(e);
  });
})();
