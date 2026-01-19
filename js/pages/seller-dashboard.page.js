const el = (id) => document.getElementById(id);

function badgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "status-badge status-pending";
  if (s === "processing") return "status-badge status-processing";
  if (s === "completed" || s === "delivered" || s === "confirmed") return "status-badge status-completed";
  return "status-badge status-pending";
}

function fmtMoney(n) {
  const val = Number(n || 0);
  return `GHS ${val.toFixed(2)}`;
}

async function getClient() {
  if (!window.supabaseReady) throw new Error("supabaseReady missing. Check that /js/supabase-init.js is loaded.");
  const client = await window.supabaseReady;
  if (!client) throw new Error("Supabase not initialized.");
  return client;
}

async function requireSellerSession() {
  const client = await getClient();

  const { data: s1, error: e1 } = await client.auth.getSession();
  if (e1) throw e1;
  const session = s1?.session;

  if (!session || !session.user) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("role");
    window.location.href = "seller-login.html";
    return null;
  }

  const role = localStorage.getItem("role");
  if (role && role !== "seller") {
    window.location.href = "seller-login.html";
    return null;
  }

  if (typeof Sentry !== "undefined") {
    Sentry.setUser({ id: session.user.id, email: session.user.email, role: "seller" });
    Sentry.addBreadcrumb({ category: "navigation", message: "Seller dashboard viewed", level: "info" });
  }

  el("sellerName").textContent = (session.user.email || "Seller").split("@")[0];
  return session.user;
}

async function loadStats(user) {
  const client = await getClient();

  try {
    const { data: products, error: productsError } = await client
      .from("products")
      .select("id")
      .eq("seller_id", user.id);

    if (productsError) throw productsError;
    el("activeProducts").textContent = (products || []).length;
  } catch (e) {
    console.warn("products stats error:", e.message);
    el("productsNote").textContent = "Check products RLS";
  }

  const { data: orders, error: ordersError } = await client
    .from("orders")
    .select("id,total_amount,order_status,created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) throw ordersError;

  const list = orders || [];
  el("totalOrders").textContent = list.length;

  const pending = list.filter((o) => String(o.order_status || "").toLowerCase() === "pending").length;
  el("pendingOrders").textContent = pending;

  const revenue = list.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  el("totalRevenue").textContent = fmtMoney(revenue);

  return list;
}

async function loadRecentOrders(orders) {
  const rows = (orders || []).slice(0, 8);

  if (!rows.length) {
    el("recentOrders").innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:40px;">No recent orders</td>
      </tr>
    `;
    return;
  }

  el("recentOrders").innerHTML = rows.map((o) => {
    const date = o.created_at ? new Date(o.created_at).toLocaleString() : "-";
    return `
      <tr>
        <td>${o.id ? o.id.slice(0, 8) : "-"}</td>
        <td>${fmtMoney(o.total_amount)}</td>
        <td><span class="${badgeClass(o.order_status)}">${o.order_status || "pending"}</span></td>
        <td>${date}</td>
      </tr>
    `;
  }).join("");
}

function loadSalesChart() {
  const ctx = document.getElementById("salesChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Sales (GHS)",
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: "#667eea",
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

async function boot() {
  try {
    const user = await requireSellerSession();
    if (!user) return;

    const orders = await loadStats(user);
    await loadRecentOrders(orders);
    loadSalesChart();
  } catch (err) {
    console.error("Dashboard boot error:", err);
    if (typeof Sentry !== "undefined") {
      Sentry.captureException(err, { tags: { error_category: "seller_dashboard" } });
    }
    window.location.href = "seller-login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = el("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        const client = await getClient();
        if (typeof Sentry !== "undefined") {
          Sentry.addBreadcrumb({ category: "auth", message: "Seller logout initiated", level: "info" });
        }

        await client.auth.signOut();

        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("sessionExpiry");
        localStorage.removeItem("role");

        if (typeof Sentry !== "undefined") Sentry.setUser(null);

        window.location.href = "seller-login.html";
      } catch (err) {
        console.error("Logout error:", err);
        if (typeof Sentry !== "undefined") {
          Sentry.captureException(err, { tags: { error_category: "logout" } });
        }
      }
    });
  }

  boot();
});

export {};
