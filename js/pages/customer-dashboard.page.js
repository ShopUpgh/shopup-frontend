// /js/pages/customer-dashboard.page.js
(function () {
  "use strict";

  const { el, clear } = window.ShopUpDOM;

  function money(n) {
    return `GHS ${Number(n || 0).toFixed(2)}`;
  }

  function initCustomerDashboardPage(container) {
    const logger = container.resolve("logger");
    const auth = container.resolve("authService");
    const products = container.resolve("productsService");
    const cart = container.resolve("cartService");
    const config = container.resolve("config");

    logger.pageView(document.title);

    // Auth gate
    if (!auth.requireAuthOrRedirect("customer-login.html")) return;

    // Identify user name
    const user = auth.getStoredUser();
    if (user?.email) {
      const userNameEl = document.getElementById("userName");
      if (userNameEl) userNameEl.textContent = user.email.split("@")[0];
      logger.setUser({ id: user.id, email: user.email, role: "customer" });
    }

    // Cart badge
    function updateCartCount() {
      const countEl = document.getElementById("cartCount");
      if (countEl) countEl.textContent = String(cart.countItems());
    }

    // Render products safely with DOM APIs
    function renderProducts(list) {
      const grid = document.getElementById("productsGrid");
      if (!grid) return;

      clear(grid);

      if (!list || list.length === 0) {
        grid.appendChild(el("p", { className: "error-message", text: "No products available at the moment." }));
        return;
      }

      list.forEach((p) => {
        const imgSrc = p.image_url || config.ui.FALLBACK_IMAGE;

        const card = el("div", { className: "product-card" }, [
          el("img", { src: imgSrc, alt: p.name || "Product" }),
          el("h3", { text: p.name || "Product" }),
          el("p", { className: "price", text: money(p.price) }),
          el(
            "button",
            {
              className: "btn-add-cart",
              type: "button",
              onclick: () => {
                cart.add(p.id, 1);
                updateCartCount();
                alert("Product added to cart!");
                logger.info("Product added to cart", { productId: p.id });
              },
            },
            ["Add to Cart"]
          ),
        ]);

        grid.appendChild(card);
      });
    }

    async function load() {
      try {
        updateCartCount();

        const grid = document.getElementById("productsGrid");
        if (grid) {
          // show loading
          clear(grid);
          grid.appendChild(el("div", { className: "loading", text: "Loading products..." }));
        }

        const list = await products.listActive(config.ui.DASHBOARD_PRODUCTS_LIMIT);
        renderProducts(list);
      } catch (err) {
        logger.error("Dashboard products load failed", err);
        const grid = document.getElementById("productsGrid");
        if (grid) {
          clear(grid);
          grid.appendChild(el("p", { className: "error-message", text: "Failed to load products. Please refresh." }));
        }
      }
    }

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await auth.logout();
        window.location.href = "customer-login.html";
      });
    }

    load();
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initCustomerDashboardPage = initCustomerDashboardPage;
})();
