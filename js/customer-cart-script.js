// /js/customer-cart-script.js
(function () {
  "use strict";

  const CART_KEY = "cart";
  const FALLBACK_IMAGE = "../images/placeholder.png";

  let cartData = [];
  let products = [];

  function formatMoney(n) {
    return `GHS ${Number(n || 0).toFixed(2)}`;
  }

  function safeJsonParse(v, fallback) {
    try {
      return JSON.parse(v);
    } catch {
      return fallback;
    }
  }

  function getCartFromStorage() {
    return safeJsonParse(localStorage.getItem(CART_KEY) || "[]", []);
  }

  function saveCartToStorage(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  }

  async function waitForSupabase(maxMs = 8000) {
    const start = Date.now();
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!window.supabase) {
      throw new Error("Supabase not ready (check /js/supabase-init.js)");
    }
  }

  function setSummaryVisible(visible) {
    const el = document.getElementById("cartSummary");
    if (!el) return;
    el.style.display = visible ? "block" : "none";
  }

  function renderEmptyCart(messageTitle, messageBody, icon) {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    cartItems.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">${icon || "🛒"}</div>
        <h2>${messageTitle || "Your cart is empty"}</h2>
        <p>${messageBody || "Add some products to get started!"}</p>
        <a href="customer-dashboard.html"
           style="display:inline-block;margin-top:20px;padding:10px 20px;background:#2d8a3e;color:white;text-decoration:none;border-radius:8px;">
          Continue Shopping
        </a>
      </div>
    `;
    setSummaryVisible(false);
  }

  function getProductById(productId) {
    return products.find((p) => String(p.id) === String(productId));
  }

  function updateSummary() {
    const subtotal = cartData.reduce((total, item) => {
      const product = getProductById(item.productId);
      const price = Number(product?.price || 0);
      return total + price * Number(item.quantity || 0);
    }, 0);

    const shipping = subtotal > 0 ? 20 : 0;
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const totalEl = document.getElementById("total");

    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
    if (shippingEl) shippingEl.textContent = formatMoney(shipping);
    if (totalEl) totalEl.textContent = formatMoney(total);
  }

  function renderCart() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    if (!cartData || cartData.length === 0) {
      renderEmptyCart();
      return;
    }

    setSummaryVisible(true);

    cartItems.innerHTML = cartData
      .map((item) => {
        const product = getProductById(item.productId);
        if (!product) return "";

        const img = product.image_url || FALLBACK_IMAGE;
        const name = product.name || "Product";
        const price = Number(product.price || 0);

        return `
          <div class="cart-item">
            <img src="${img}" alt="${name}" class="item-image">
            <div class="item-details">
              <div class="item-name">${name}</div>
              <div class="item-price">${formatMoney(price)}</div>
              <div class="quantity-controls">
                <button class="qty-btn" data-action="dec" data-id="${item.productId}">-</button>
                <span>${Number(item.quantity || 0)}</span>
                <button class="qty-btn" data-action="inc" data-id="${item.productId}">+</button>
              </div>
            </div>
            <button class="remove-btn" data-action="remove" data-id="${item.productId}">🗑️ Remove</button>
          </div>
        `;
      })
      .join("");

    updateSummary();
  }

  function updateQuantity(productId, change) {
    const item = cartData.find((i) => String(i.productId) === String(productId));
    if (!item) return;

    item.quantity = Number(item.quantity || 0) + Number(change || 0);

    if (item.quantity <= 0) {
      cartData = cartData.filter((i) => String(i.productId) !== String(productId));
    }

    saveCartToStorage(cartData);
    renderCart();

    if (window.logger) {
      window.logger.info("Cart quantity updated", {
        productId,
        change,
        quantity: item.quantity,
      });
    }
  }

  function removeItem(productId) {
    cartData = cartData.filter((i) => String(i.productId) !== String(productId));
    saveCartToStorage(cartData);
    renderCart();

    if (window.logger) {
      window.logger.info("Cart item removed", { productId });
    }
  }

  function proceedToCheckout() {
    if (window.logger) {
      window.logger.info("Proceeding to checkout", {
        item_count: cartData.length,
        total_items: cartData.reduce((sum, i) => sum + Number(i.quantity || 0), 0),
      });
    }
    window.location.href = "customer-checkout.html";
  }

  function wireEvents() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");

      if (action === "inc") updateQuantity(id, 1);
      if (action === "dec") updateQuantity(id, -1);
      if (action === "remove") removeItem(id);
    });

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", proceedToCheckout);
  }

  async function loadProductsForCart() {
    cartData = getCartFromStorage();

    if (!cartData || cartData.length === 0) {
      renderCart();
      return;
    }

    await waitForSupabase();

    const productIds = cartData.map((i) => i.productId).filter(Boolean);

    const { data, error } = await window.supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (error) throw error;

    products = data || [];
    renderCart();
  }

  async function init() {
    try {
      wireEvents();
      await loadProductsForCart();
    } catch (err) {
      console.error("Error loading cart:", err);

      if (window.logger) window.logger.error("Error loading cart", err);
      if (window.Sentry) window.Sentry.captureException(err);

      renderEmptyCart(
        "We couldn't load your cart right now",
        "Please refresh the page or try again in a moment.",
        "⚠️"
      );
    }
  }

  init();
})();
