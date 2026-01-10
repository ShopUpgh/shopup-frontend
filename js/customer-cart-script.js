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

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderEmptyCart(messageTitle, messageBody, icon) {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    clearNode(cartItems);

    const wrap = document.createElement("div");
    wrap.className = "empty-cart";

    const iconEl = document.createElement("div");
    iconEl.className = "empty-cart-icon";
    iconEl.textContent = icon || "🛒";

    const h2 = document.createElement("h2");
    h2.textContent = messageTitle || "Your cart is empty";

    const p = document.createElement("p");
    p.textContent = messageBody || "Add some products to get started!";

    const a = document.createElement("a");
    a.href = "customer-dashboard.html";
    a.textContent = "Continue Shopping";
    a.style.display = "inline-block";
    a.style.marginTop = "20px";
    a.style.padding = "10px 20px";
    a.style.background = "#2d8a3e";
    a.style.color = "white";
    a.style.textDecoration = "none";
    a.style.borderRadius = "8px";

    wrap.appendChild(iconEl);
    wrap.appendChild(h2);
    wrap.appendChild(p);
    wrap.appendChild(a);

    cartItems.appendChild(wrap);
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

  function buildCartItemRow(item) {
    const product = getProductById(item.productId);
    if (!product) return null;

    const row = document.createElement("div");
    row.className = "cart-item";

    const img = document.createElement("img");
    img.className = "item-image";
    img.alt = product.name || "Product";
    img.src = product.image_url || FALLBACK_IMAGE;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      img.src = FALLBACK_IMAGE;
    });

    const details = document.createElement("div");
    details.className = "item-details";

    const name = document.createElement("div");
    name.className = "item-name";
    // ✅ SAFE: textContent prevents HTML injection (XSS)
    name.textContent = product.name || "Product";

    const price = document.createElement("div");
    price.className = "item-price";
    price.textContent = formatMoney(Number(product.price || 0));

    const qty = document.createElement("div");
    qty.className = "quantity-controls";

    const dec = document.createElement("button");
    dec.className = "qty-btn";
    dec.type = "button";
    dec.setAttribute("data-action", "dec");
    dec.setAttribute("data-id", String(item.productId));
    dec.textContent = "-";

    const qtyText = document.createElement("span");
    qtyText.textContent = String(Number(item.quantity || 0));

    const inc = document.createElement("button");
    inc.className = "qty-btn";
    inc.type = "button";
    inc.setAttribute("data-action", "inc");
    inc.setAttribute("data-id", String(item.productId));
    inc.textContent = "+";

    qty.appendChild(dec);
    qty.appendChild(qtyText);
    qty.appendChild(inc);

    details.appendChild(name);
    details.appendChild(price);
    details.appendChild(qty);

    const remove = document.createElement("button");
    remove.className = "remove-btn";
    remove.type = "button";
    remove.setAttribute("data-action", "remove");
    remove.setAttribute("data-id", String(item.productId));
    remove.textContent = "🗑️ Remove";

    row.appendChild(img);
    row.appendChild(details);
    row.appendChild(remove);

    return row;
  }

  function renderCart() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    if (!cartData || cartData.length === 0) {
      renderEmptyCart();
      return;
    }

    setSummaryVisible(true);
    clearNode(cartItems);

    let renderedAny = false;

    for (const item of cartData) {
      const row = buildCartItemRow(item);
      if (row) {
        cartItems.appendChild(row);
        renderedAny = true;
      }
    }

    if (!renderedAny) {
      renderEmptyCart(
        "Some items are no longer available",
        "Please return to the store to add new products.",
        "ℹ️"
      );
      return;
    }

    updateSummary();
  }

  function updateQuantity(productId, change) {
    const item = cartData.find((i) => String(i.productId) === String(productId));
    if (!item) return;

    const nextQty = Number(item.quantity || 0) + Number(change || 0);

    if (nextQty <= 0) {
      cartData = cartData.filter((i) => String(i.productId) !== String(productId));
    } else {
      item.quantity = nextQty;
    }

    saveCartToStorage(cartData);
    renderCart();

    if (window.logger) {
      window.logger.info("Cart quantity updated", {
        productId,
        change,
        quantity: nextQty,
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
    if (!cartData || cartData.length === 0) {
      renderEmptyCart();
      return;
    }

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

      if (!id) return;

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
