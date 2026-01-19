// /js/pages/seller-dashboard.page.js
import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  // Track page view
  if (typeof Sentry !== "undefined") {
    Sentry.addBreadcrumb({
      category: "navigation",
      message: "Seller dashboard viewed",
      level: "info",
    });
  }

  const elSellerName = document.getElementById("sellerName");
  const logoutBtn = document.getElementById("logoutBtn");

  async function loadStats(client, sellerId) {
    try {
      const { data: products, error } = await client
        .from("products")
        .select("id")
        .eq("seller_id", sellerId);

      if (error) throw error;

      document.getElementById("activeProducts").textContent = products?.length || 0;
    } catch (e) {
      console.error("loadStats error:", e);
    }
  }

  async function loadRecentOrdersUI(client, sellerId) {
    // Your current dashboard shows placeholder orders.
    // We'll keep it safe and simple: show “No recent orders” unless you wire the query later.
    const tbody = document.getElementById("recentOrders");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          No recent orders
        </td>
      </tr>
    `;
  }

  async function main() {
    const auth = await requireSellerSession({ redirectTo: "/seller/seller-login.html" });
    if (!auth) return;

    const { client, user } = auth;

    // Identify user in Sentry
    try {
      if (typeof Sentry !== "undefined") {
        Sentry.setUser({ id: user.id, email: user.email, role: "seller" });
      }
    } catch (_) {}

    // UI label
    if (elSellerName) elSellerName.textContent = (user.email || "Seller").split("@")[0];

    // Load dashboard data
    await Promise.all([
      loadStats(client, user.id),
      loadRecentOrdersUI(client, user.id),
    ]);

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          if (typeof Sentry !== "undefined") {
            Sentry.addBreadcrumb({ category: "auth", message: "Seller logout initiated", level: "info" });
          }

          await client.auth.signOut();

          // You can keep these clears (legacy)
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
