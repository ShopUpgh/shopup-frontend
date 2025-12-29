// /js/customer-checkout-script.js
(function () {
  "use strict";

  const CART_KEY = "cart";
  const CURRENT_USER_KEY = "currentUser";
  const ORDER_PENDING_KEY = "order_pending";
  const SHIPPING_FLAT = 20;

  // OPTIONAL: if you already load Paystack elsewhere, keep this.
  // If not loaded, this script will show a friendly error.
  // Recommended later: load Paystack inline script on checkout only.
  // <script src="https://js.paystack.co/v1/inline.js"></script>

  let cartData = [];
  let products = [];

  const el = {
    fullName: document.getElementById("fullName"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    city: document.getElementById("city"),
    addressLine: document.getElementById("addressLine"),
    notes: document.getElementById("notes"),
    paymentMethod: document.getElementById("paymentMethod"),

    subtotal: document.getElementById("subtotal"),
    shipping: document.getElementById("shipping"),
    total: document.getElementById("total"),
    itemCountPill: document.getElementById("itemCountPill"),
    itemsList: document.getElementById("itemsList"),

    payNowBtn: document.getElementById("payNowBtn"),
    placeOrderBtn: document.getElementById("placeOrderBtn"),
    alertBox: document.getElementById("alertBox"),
  };

  function formatMoney(n) {
    return `GHS ${Number(n || 0).toFixed(2)}`;
  }

  function safeJsonParse(v, fallback) {
    try { return JSON.parse(v); } catch { return fallback; }
  }

  function showAlert(msg) {
    if (!el.alertBox) return;
    el.alertBox.style.display = "block";
    el.alertBox.textContent = msg;
  }

  function clearAlert() {
    if (!el.alertBox) return;
    el.alertBox.style.display = "none";
    el.alertBox.textContent = "";
  }

  async function waitForSupabase(maxMs = 8000) {
    const start = Date.now();
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!window.supabase) throw new Error("Supabase not ready (check /js/supabase-init.js)");
  }

  function readCart() {
    return safeJsonParse(localStorage.getItem(CART_KEY) || "[]", []);
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  }

  function getProductById(id) {
    return products.find((p) => String(p.id) === String(id));
  }

  function calcSubtotal() {
    return cartData.reduce((sum, item) => {
      const p = getProductById(item.productId);
      const price = Number(p?.price || 0);
      return sum + price * Number(item.quantity || 0);
    }, 0);
  }

  function calcShipping(subtotal) {
    return subtotal > 0 ? SHIPPING_FLAT : 0;
  }

  function calcTotals() {
    const subtotal = calcSubtotal();
    const shipping = calcShipping(subtotal);
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
  }

  function renderSummary() {
    const { subtotal, shipping, total } = calcTotals();

    if (el.subtotal) el.subtotal.textContent = formatMoney(subtotal);
    if (el.shipping) el.shipping.textContent = formatMoney(shipping);
    if (el.total) el.total.textContent = formatMoney(total);

    const itemCount = cartData.reduce((n, i) => n + Number(i.quantity || 0), 0);
    if (el.itemCountPill) el.itemCountPill.textContent = `${itemCount} items`;

    if (el.itemsList) {
      if (!cartData.length) {
        el.itemsList.innerHTML = `<p class="muted">Your cart is empty. Go back to cart.</p>`;
        return;
      }

      el.itemsList.innerHTML = cartData.map((item) => {
        const p = getProductById(item.productId);
        const name = p?.name || "Product";
        const qty = Number(item.quantity || 0);
        const price = Number(p?.price || 0);
        return `
          <div class="item">
            <div>
              <div class="item-name">${name}</div>
              <div class="muted">Qty: ${qty}</div>
            </div>
            <div style="font-weight:700;">${formatMoney(price * qty)}</div>
          </div>
        `;
      }).join("");
    }
  }

  function hydrateFromUser() {
    const user = safeJsonParse(localStorage.getItem(CURRENT_USER_KEY) || "{}", {});
    if (!user) return;

    if (el.email && !el.email.value && user.email) el.email.value = user.email;
    if (el.fullName && !el.fullName.value && user.name) el.fullName.value = user.name;
    if (el.phone && !el.phone.value && user.phone) el.phone.value = user.phone;
  }

  function validateForm() {
    const fullName = (el.fullName?.value || "").trim();
    const phone = (el.phone?.value || "").trim();
    const email = (el.email?.value || "").trim();
    const city = (el.city?.value || "").trim();
    const addressLine = (el.addressLine?.value || "").trim();

    if (!cartData.length) return { ok: false, msg: "Your cart is empty. Please add items first." };
    if (!fullName) return { ok: false, msg: "Please enter your full name." };
    if (!phone) return { ok: false, msg: "Please enter your phone number." };
    if (!email || !email.includes("@")) return { ok: false, msg: "Please enter a valid email address." };
    if (!city) return { ok: false, msg: "Please enter your city." };
    if (!addressLine) return { ok: false, msg: "Please enter your delivery address." };

    return { ok: true };
  }

  function buildOrderPayload(status, payment) {
    const user = safeJsonParse(localStorage.getItem(CURRENT_USER_KEY) || "{}", {});
    const { subtotal, shipping, total } = calcTotals();

    const items = cartData.map((item) => {
      const p = getProductById(item.productId) || {};
      return {
        product_id: item.productId,
        name: p.name || "Product",
        price: Number(p.price || 0),
        quantity: Number(item.quantity || 0),
      };
    });

    return {
      user_id: user?.id || null,
      customer_email: (el.email?.value || "").trim(),
      customer_name: (el.fullName?.value || "").trim(),
      customer_phone: (el.phone?.value || "").trim(),

      city: (el.city?.value || "").trim(),
      address: (el.addressLine?.value || "").trim(),
      notes: (el.notes?.value || "").trim(),

      currency: "GHS",
      subtotal,
      shipping,
      total,

      items,
      status, // "pending_payment" | "paid" | "pending_fulfillment"
      payment_method: payment.method, // "paystack" | "cod"
      payment_reference: payment.reference || null,
    };
  }

  async function createOrderInSupabase(orderPayload) {
    await waitForSupabase();

    // NOTE: Adjust table name/columns if your schema differs.
    // This assumes you have an "orders" table that accepts these fields.
    const { data, error } = await window.supabase
      .from("orders")
      .insert([orderPayload])
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async function updateOrderInSupabase(orderId, updates) {
    await waitForSupabase();
    const { data, error } = await window.supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  function clearCartAfterSuccess() {
    writeCart([]);
  }

  function goToConfirmation(orderId) {
    // You already have customer-order-confirmation.html in your tree
    window.location.href = `customer-order-confirmation.html?order_id=${encodeURIComponent(orderId)}`;
  }

  function setBusy(isBusy) {
    if (el.payNowBtn) el.payNowBtn.disabled = isBusy;
    if (el.placeOrderBtn) el.placeOrderBtn.disabled = isBusy;
  }

  async function handleCOD() {
    clearAlert();
    const v = validateForm();
    if (!v.ok) return showAlert(v.msg);

    setBusy(true);

    try {
      const payload = buildOrderPayload("pending_fulfillment", { method: "cod" });

      // store a local fallback in case insert fails
      localStorage.setItem(ORDER_PENDING_KEY, JSON.stringify(payload));

      const order = await createOrderInSupabase(payload);

      if (window.logger) window.logger.info("COD order created", { order_id: order.id });
      clearCartAfterSuccess();
      localStorage.removeItem(ORDER_PENDING_KEY);

      goToConfirmation(order.id);
    } catch (err) {
      console.error("COD order error:", err);
      if (window.logger) window.logger.error("COD order error", err);
      if (window.Sentry) window.Sentry.captureException(err);
      showAlert("We couldn't place your order right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePaystack() {
    clearAlert();
    const v = validateForm();
    if (!v.ok) return showAlert(v.msg);

    const { total } = calcTotals();
    if (total <= 0) return showAlert("Cart total is invalid.");

    // Paystack inline SDK check
    if (!window.PaystackPop) {
      showAlert("Paystack is not loaded yet. Add Paystack inline script on this page to enable payments.");
      return;
    }

    setBusy(true);

    try {
      // Step 1: Create order as pending payment
      const pendingPayload = buildOrderPayload("pending_payment", { method: "paystack" });
      localStorage.setItem(ORDER_PENDING_KEY, JSON.stringify(pendingPayload));

      const order = await createOrderInSupabase(pendingPayload);

      if (window.logger) window.logger.info("Paystack order pending created", { order_id: order.id });

      // Step 2: Launch Paystack
      // IMPORTANT: Paystack expects amount in PESewas (GHS * 100)
      const amountPesewas = Math.round(Number(total) * 100);

      const reference = `shopup_${order.id}_${Date.now()}`;

      const handler = window.PaystackPop.setup({
        key: "PUT_YOUR_PUBLIC_PAYSTACK_KEY_HERE", // ✅ Replace with your PAYSTACK PUBLIC KEY (pk_live_... in production)
        email: (el.email?.value || "").trim(),
        amount: amountPesewas,
        currency: "GHS",
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Order ID", variable_name: "order_id", value: String(order.id) },
            { display_name: "Customer", variable_name: "customer_name", value: (el.fullName?.value || "").trim() }
          ]
        },
        callback: async function (response) {
          try {
            // Step 3: Mark as paid (best practice: verify server-side via webhook, but this is a working client baseline)
            const updated = await updateOrderInSupabase(order.id, {
              status: "paid",
              payment_reference: response?.reference || reference,
            });

            if (window.logger) window.logger.info("Paystack payment success", { order_id: updated.id, ref: response?.reference });
            clearCartAfterSuccess();
            localStorage.removeItem(ORDER_PENDING_KEY);

            goToConfirmation(updated.id);
          } catch (err) {
            console.error("Payment success but update failed:", err);
            if (window.logger) window.logger.error("Order update failed after paystack", err);
            if (window.Sentry) window.Sentry.captureException(err);
            showAlert("Payment went through, but we couldn't finalize your order. Please contact support with your payment reference.");
          } finally {
            setBusy(false);
          }
        },
        onClose: function () {
          setBusy(false);
          showAlert("Payment window closed. You can try again.");
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error("Paystack flow error:", err);
      if (window.logger) window.logger.error("Paystack flow error", err);
      if (window.Sentry) window.Sentry.captureException(err);
      showAlert("We couldn't start payment right now. Please try again.");
      setBusy(false);
    }
  }

  function toggleButtons() {
    const method = el.paymentMethod?.value || "paystack";
    if (method === "cod") {
      if (el.payNowBtn) el.payNowBtn.style.display = "none";
      if (el.placeOrderBtn) el.placeOrderBtn.style.display = "block";
    } else {
      if (el.placeOrderBtn) el.placeOrderBtn.style.display = "none";
      if (el.payNowBtn) el.payNowBtn.style.display = "block";
    }
  }

  async function loadProductsForCart() {
    cartData = readCart();

    if (!cartData.length) {
      renderSummary();
      showAlert("Your cart is empty. Go back to cart to add items.");
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
    renderSummary();
  }

  function wireEvents() {
    if (el.paymentMethod) {
      el.paymentMethod.addEventListener("change", () => {
        clearAlert();
        toggleButtons();
      });
    }

    if (el.placeOrderBtn) el.placeOrderBtn.addEventListener("click", handleCOD);
    if (el.payNowBtn) el.payNowBtn.addEventListener("click", handlePaystack);
  }

  async function init() {
    try {
      toggleButtons();
      wireEvents();
      hydrateFromUser();
      await loadProductsForCart();

      if (window.logger) window.logger.info("Checkout initialized");
    } catch (err) {
      console.error("Checkout init error:", err);
      if (window.logger) window.logger.error("Checkout init error", err);
      if (window.Sentry) window.Sentry.captureException(err);
      showAlert("We couldn't load checkout right now. Please refresh and try again.");
    }
  }

  init();
})();
