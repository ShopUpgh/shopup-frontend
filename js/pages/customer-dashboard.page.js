// /js/pages/customer-dashboard.page.js
(function () {
  "use strict";

  function safeText(el, text) {
    if (!el) return;
    el.textContent = String(text ?? "");
  }

  function moneyGHS(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "GHS 0.00";
    return `GHS ${num.toFixed(2)}`;
  }

  function renderError(container, message) {
    if (!container) return;
    container.innerHTML = "";
    const div = document.createElement("div");
    div.className = "error-message";
    div.textContent = message || "Something went wrong.";
    container.appendChild(div);
  }

  function renderLoading(container, message = "Loading products...") {
    if (!container) return;
    container.innerHTML = "";
    const div = document.createElement("div");
    div.className = "loading";
    div.textContent = message;
    container.appendChild(div);
  }

  function buildProductCard(product, onAdd) {
    const card = document.createElement("div");
    card.className = "product-card";

    const img = document.createElement("img");
    img.alt = product?.name || "Product";
    img.loading = "lazy";
    img.src = product?.image_url || product?.image || "/img/placeholder-product.png";
    card.appendChild(img);

    const title = document.createElement("h3");
    title.textContent = product?.name || "Untitled Product";
    card.appendChild(title);

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = moneyGHS(product?.price);
    card.appendChild(price);

    const btn = document.createElement("button");
    btn.className = "btn-add-cart";
    btn.type = "button";
    btn.textContent = "Add to Cart";
    btn.addEventListener("click", () => onAdd(product));
    card.appendChild(btn);

    return card;
  }

  async function loadProducts(productsService, logger) {
    // Expect productsService.listFeatured() OR listActive()
    if (typeof productsService?.listFeatured === "function") {
      return await productsService.listFeatured();
    }
    if (typeof productsService?.listActive === "function") {
      return await productsService.listActive();
    }
    // fallback if service exposes list()
    if (typeof productsService?.list === "function") {
      return await productsService.list();
    }
    logger?.warn?.("Products service has no list method. Returning empty.");
    return [];
  }

  async function updateCartBadge(cartService) {
    const el = document.getElementById("cartCount");
    if (!el) return;

    try {
      // prefer getCount() if exists
      if (typeof cartService?.getCount === "function") {
        const count = await cartService.getCount();
        el.textContent = String(count ?? 0);
        return;
      }

      // fallback: getCart() / list()
      if (typeof cartService?.getCart === "function") {
        const cart = await cartService.getCart();
        const items = cart?.items || cart || [];
        const count = Array.isArray(items)
          ? items.reduce((sum, it) => sum + Number(it?.quantity || 1), 0)
          : 0;
        el.textContent = String(count);
        return;
      }

      el.textContent = "0";
    } catch {
      el.textContent = "0";
    }
  }

  async function handleAddToCart(product, cartService, logger) {
    try {
      if (typeof cartService?.addItem === "function") {
        await cartService.addItem(product, 1);
      } else if (typeof cartService?.add === "function") {
        await cartService.add(product, 1);
      } else {
        throw new Error("Cart service missing add method");
      }

      logger?.info?.("Added to cart", { product_id: product?.id, name: product?.name });
      await updateCartBadge(cartService);
    } catch (e) {
      logger?.error?.("Add to cart failed", { error: String(e?.message || e) });
      if (window.Sentry) window.Sentry.captureException(e, { tags: { page: "customer-dashboard", action: "add_to_cart" } });
      alert("Could not add item to cart. Please try again.");
    }
  }

  async function wireLogout(authService, logger) {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      try {
        // Prefer central guard logout if present
        if (window.ShopUpAuth?.logoutCustomer) {
          await window.ShopUpAuth.logoutCustomer({ redirectTo: "customer-login.html" });
          return;
        }

        // fallback to authService
        if (typeof authService?.logout === "function") {
          await authService.logout();
        } else if (window.supabase) {
          await window.supabase.auth.signOut();
        }

        window.location.href = "customer-login.html";
      } catch (e) {
        logger?.error?.("Logout failed", { error: String(e?.message || e) });
        if (window.Sentry) window.Sentry.captureException(e, { tags: { page: "customer-dashboard", action: "logout" } });
        window.location.href = "customer-login.html";
      }
    });
  }

  async function init(container) {
    const logger = container.resolve("logger");
    const authService = container.resolve("authService");
    const productsService = container.resolve("productsService");
    const cartService = container.resolve("cartService");

    // ✅ Session guard (shared)
    const session = await window.ShopUpAuth.requireCustomerSession();
    if (!session) return;

    // UI: username
    const userNameEl = document.getElementById("userName");
    const u = session.user;
    safeText(userNameEl, u?.user_metadata?.full_name || u?.email || "Customer");

    // logs
    logger?.pageView?.(document.title);
    logger?.info?.("Dashboard viewed", { ts: new Date().toISOString() });

    // cart badge
    await updateCartBadge(cartService);

    // logout
    await wireLogout(authService, logger);

    // products
    const grid = document.getElementById("productsGrid");
    renderLoading(grid);

    try {
      const products = await loadProducts(productsService, logger);
      grid.innerHTML = "";

      if (!Array.isArray(products) || products.length === 0) {
        renderError(grid, "No products available right now.");
        return;
      }

      products.forEach((p) => {
        const card = buildProductCard(p, (prod) => handleAddToCart(prod, cartService, logger));
        grid.appendChild(card);
      });
    } catch (e) {
      logger?.error?.("Failed to load products", { error: String(e?.message || e) });
      if (window.Sentry) window.Sentry.captureException(e, { tags: { page: "customer-dashboard", action: "load_products" } });
      renderError(grid, "Failed to load products. Please refresh.");
    }
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initCustomerDashboardPage = init;
})();
