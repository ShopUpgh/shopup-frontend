// /js/customer-dashboard.js
(function () {
  "use strict";

  const FALLBACK_IMAGE = "../images/placeholder.png";
  const CART_KEY = "cart";

  function safeJsonParse(v, fallback) {
    try {
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  async function waitForSupabase(maxMs = 8000) {
    const start = Date.now();
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!window.supabase) throw new Error("Supabase not ready (check /js/supabase-init.js)");
  }

  function authGate() {
    const authToken = localStorage.getItem("authToken");
    const currentUser = localStorage.getItem("currentUser");

    if (!authToken || !currentUser) {
      if (window.Sentry) {
        window.Sentry.captureMessage("Unauthorized access attempt to customer dashboard", {
          level: "warning",
          tags: { error_category: "authentication" },
        });
      }
      window.location.href = "customer-login.html";
      return null;
    }

    const user = safeJsonParse(currentUser, null);
    if (!user || !user.id) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "customer-login.html";
      return null;
    }

    // Identify user
    if (window.Sentry) {
      window.Sentry.setUser({
        id: String(user.id),
        email: user.email || undefined,
        role: "customer",
      });
      window.Sentry.addBreadcrumb({
        category: "navigation",
        message: "Customer dashboard viewed",
        level: "info",
      });
    }

    // UI username
    const userNameEl = document.getElementById("userName");
    if (userNameEl && user.email) {
      userNameEl.textContent = String(user.email).split("@")[0];
    }

    return user;
  }

  function updateCartCount() {
    const cart = safeJsonParse(localStorage.getItem(CART_KEY) || "[]", []);
    const count = (cart || []).reduce((total, item) => total + Number(item?.quantity || 0), 0);
    const cartCountEl = document.getElementById("cartCount");
    if (cartCountEl) cartCountEl.textContent = String(count);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function displayProducts(products) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (!products || products.length === 0) {
      grid.innerHTML = '<p class="error-message">No products available at the moment.</p>';
      return;
    }

    grid.innerHTML = products
      .map((product) => {
        const id = escapeHtml(product.id);
        const name = escapeHtml(product.name || "Product");
        const imageUrl = escapeHtml(product.image_url || FALLBACK_IMAGE);

        const priceNum = Number(product.price || 0);
        const priceText = `GHS ${priceNum.toFixed(2)}`;

        return `
          <div class="product-card">
            <img src="${imageUrl}" alt="${name}">
            <h3>${name}</h3>
            <p class="price">${priceText}</p>
            <button class="btn-add-cart" data-action="add-to-cart" data-id="${id}">
              Add to Cart
            </button>
          </div>
        `;
      })
      .join("");
  }

  async function loadProducts() {
    const grid = document.getElementById("productsGrid");
    if (grid) grid.innerHTML = '<div class="loading">Loading products...</div>';

    await waitForSupabase();

    const { data, error } = await window.supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .limit(12);

    if (error) throw error;

    displayProducts(data || []);
  }

  function addToCart(productId) {
    const cart = safeJsonParse(localStorage.getItem(CART_KEY) || "[]", []);
    const idStr = String(productId);

    const existing = cart.find((item) => String(item.productId) === idStr);
    if (existing) existing.quantity = Number(existing.quantity || 0) + 1;
    else cart.push({ productId: idStr, quantity: 1 });

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();

    if (window.logger) window.logger.info("Product added to cart", { productId: idStr });
    if (window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: "cart",
        message: "Add to cart",
        level: "info",
        data: { productId: idStr },
      });
    }

    alert("Product added to cart!");
  }

  function wireEvents() {
    // Add-to-cart buttons
    document.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="add-to-cart"]');
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      if (id) addToCart(id);
    });

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          if (window.Sentry) {
            window.Sentry.addBreadcrumb({
              category: "auth",
              message: "User logout initiated",
              level: "info",
            });
          }

          await waitForSupabase();
          await window.supabase.auth.signOut();

          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("sessionExpiry");
          localStorage.removeItem("role");

          if (window.Sentry) window.Sentry.setUser(null);

          window.location.href = "customer-login.html";
        } catch (err) {
          if (window.logger) window.logger.error("Logout failed", err);
          if (window.Sentry) window.Sentry.captureException(err);
          alert("Logout failed. Please try again.");
        }
      });
    }
  }

  async function init() {
    try {
      const user = authGate();
      if (!user) return;

      wireEvents();
      updateCartCount();
      await loadProducts();

      if (window.logger) window.logger.pageView(document.title);
    } catch (err) {
      if (window.logger) window.logger.error("Dashboard failed", err);
      if (window.Sentry) window.Sentry.captureException(err);

      const grid = document.getElementById("productsGrid");
      if (grid) {
        grid.innerHTML =
          '<p class="error-message">Failed to load products. Please refresh the page.</p>';
      }
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
