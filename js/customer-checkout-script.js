// /js/customer-checkout-script.js
(function () {
  "use strict";

  // --------------------------
  // Storage keys (MATCH cart.html)
  // --------------------------
  const CART_KEY_PRIMARY = "shopup_cart"; // ✅ what your cart.html uses
  const CART_KEY_FALLBACK = "cart";       // ✅ backward compatibility
  const CURRENT_USER_KEY = "currentUser";
  const ORDER_PENDING_KEY = "order_pending";

  // Money / rules
  const SHIPPING_FLAT = 20;               // change if needed
  const VERIFY_FUNCTION = "verify-payment"; // Supabase Edge Function

  let cartData = [];
  let products = []; // optional, only used if cart items use {productId}

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

  // --------------------------
  // Logging helpers
  // --------------------------
  function logInfo(msg, data) {
    try { window.logger?.info?.(msg, data || {}); } catch {}
    try { window.Sentry?.addBreadcrumb?.({ category: "checkout", message: msg, level: "info", data }); } catch {}
  }

  function logError(msg, err) {
    try { window.logger?.error?.(msg, { err: String(err?.message || err || "") }); } catch {}
    try { window.Sentry?.captureException?.(err instanceof Error ? err : new Error(String(err))); } catch {}
  }

  // --------------------------
  // Utils
  // --------------------------
  function formatMoney(n) {
    return `GHS ${Number(n || 0).toFixed(2)}`;
  }

  function safeJsonParse(v, fallback) {
    try { return JSON.parse(v); } catch { return fallback; }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function setBusy(isBusy) {
    if (el.payNowBtn) el.payNowBtn.disabled = isBusy;
    if (el.placeOrderBtn) el.placeOrderBtn.disabled = isBusy;
  }

  async function waitForSupabase(maxMs = 8000) {
    const start = Date.now();
    while (!window.supabase && Date.now() - start < maxMs) {
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!window.supabase) throw new Error("Supabase not ready (check /js/supabase-init.js)");
  }

  // --------------------------
  // Cart read/write (supports both keys)
  // --------------------------
  function readCart() {
    const primary = safeJsonParse(localStorage.getItem(CART_KEY_PRIMARY) || "[]", []);
    if (Array.isArray(primary) && primary.length) return primary;

    const fallback = safeJsonParse(localStorage.getItem(CART_KEY_FALLBACK) || "[]", []);
    if (Array.isArray(fallback)) return fallback;

    return [];
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY_PRIMARY, JSON.stringify(cart || []));
    // Optionally keep fallback synced:
    // localStorage.setItem(CART_KEY_FALLBACK, JSON.stringify(cart || []));
  }

  // --------------------------
  // Product support (only needed for {productId} carts)
  // --------------------------
  function cartUsesProductIdShape() {
    return cartData.some((i) => i && (i.productId !== undefined || i.product_id !== undefined));
  }

  function normalizeCartItem(item) {
    // Support both shapes:
    // A) { id, name, price, quantity }
    // B) { productId, quantity } or { product_id, quantity }
    if (!item) return null;

    const quantity = Number(item.quantity || 0);

    // If it already has price + name, keep it
    if (item.price != null && item.name) {
      return {
        id: item.id ?? item.productId ?? item.product_id ?? null,
        name: String(item.name),
        price: Number(item.price || 0),
        quantity,
        sku: item.sku || "",
        category: item.category || "",
      };
    }

    // Else treat it as product reference
    const pid = item.productId ?? item.product_id ?? item.id ?? null;
    return {
      id: pid,
      productId: pid,
      quantity,
    };
  }

  function getProductById(id) {
    return products.find((p) => String(p.id) === String(id));
  }

  async function loadProductsForCartIfNeeded() {
    if (!cartUsesProductIdShape()) return;

    await waitForSupabase();

    const ids = Array.from(
      new Set(
        cartData
          .map((i) => i?.productId ?? i?.product_id ?? i?.id)
          .filter(Boolean)
          .map(String)
      )
    );

    if (!ids.length) return;

    // Try to load minimal product fields
    const { data, error } = await window.supabase
      .from("products")
      .select("id,name,price,sku,category,image_url,status,is_active")
      .in("id", ids);

    if (error) throw error;
    products = Array.isArray(data) ? data : [];
  }

  // --------------------------
  // Totals (works for both cart formats)
  // --------------------------
  function calcSubtotal() {
    return cartData.reduce((sum, raw) => {
      const item = normalizeCartItem(raw);
      if (!item) return sum;

      // Direct-price cart
      if (item.price != null && item.name) {
        return sum + Number(item.price || 0) * Number(item.quantity || 0);
      }

      // productId cart (use loaded products)
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

  // --------------------------
  // Render
  // --------------------------
  function renderSummary() {
    const { subtotal, shipping, total } = calcTotals();

    if (el.subtotal) el.subtotal.textContent = formatMoney(subtotal);
    if (el.shipping) el.shipping.textContent = formatMoney(shipping);
    if (el.total) el.total.textContent = formatMoney(total);

    const itemCount = cartData.reduce((n, i) => n + Number(i?.quantity || 0), 0);
    if (el.itemCountPill) el.itemCountPill.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;

    if (!el.itemsList) return;

    if (!cartData.length) {
      el.itemsList.innerHTML = `<p class="muted">Your cart is empty. Go back to cart.</p>`;
      return;
    }

    el.itemsList.innerHTML = cartData
      .map((raw) => {
        const item = normalizeCartItem(raw);
        if (!item) return "";

        let name = "Product";
        let price = 0;

        // Direct-price cart
        if (item.price != null && item.name) {
          name = item.name;
          price = item.price;
        } else {
          // productId cart
          const p = getProductById(item.productId) || {};
          name = p.name || "Product";
          price = Number(p.price || 0);
        }

        const qty = Number(item.quantity || 0);
        return `
          <div class="item">
            <div>
              <div class="item-name">${escapeHtml(name)}</div>
              <div class="muted">Qty: ${qty}</div>
            </div>
            <div style="font-weight:700;">${formatMoney(price * qty)}</div>
          </div>
        `;
      })
      .join("");
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

  // --------------------------
  // Orders (Supabase)
  // --------------------------
  function buildOrderPayload(status, payment) {
    const user = safeJsonParse(localStorage.getItem(CURRENT_USER_KEY) || "{}", {});
    const { subtotal, shipping, total } = calcTotals();

    const items = cartData.map((raw) => {
      const item = normalizeCartItem(raw);
      if (!item) return null;

      // Direct-price cart
      if (item.price != null && item.name) {
        return {
          product_id: item.id || null,
          name: item.name || "Product",
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
        };
      }

      // productId cart
      const p = getProductById(item.productId) || {};
      return {
        product_id: item.productId,
        name: p.name || "Product",
        price: Number(p.price || 0),
        quantity: Number(item.quantity || 0),
      };
    }).filter(Boolean);

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
    window.location.href = `customer-order-confirmation.html?order_id=${encodeURIComponent(orderId)}`;
  }

  // --------------------------
  // Paystack helpers
  // --------------------------
  function getPaystackPublicKey() {
    return window.PAYSTACK_PUBLIC_KEY || localStorage.getItem("PAYSTACK_PUBLIC_KEY") || "";
  }

  function loadPaystackScriptIfMissing() {
    return new Promise((resolve, reject) => {
      if (window.PaystackPop) return resolve(true);

      const existing = document.querySelector('script[data-paystack="inline"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => reject(new Error("Failed to load Paystack script.")));
        return;
      }

      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.async = true;
      s.dataset.paystack = "inline";
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("Failed to load Paystack script."));
      document.head.appendChild(s);
    });
  }

  async function verifyPaymentServerSide(reference, expectedTotalGHS) {
    await waitForSupabase();

    if (!window.supabase?.functions?.invoke) {
      throw new Error("Supabase functions not available (need supabase-js v2 and functions enabled).");
    }

    const { data, error } = await window.supabase.functions.invoke(VERIFY_FUNCTION, {
      body: {
        reference,
        expected_total: Number(expectedTotalGHS),
        currency: "GHS",
      },
    });

    if (error) throw error;

    // Accept a few common formats
    if (data?.verified === true) return true;
    if (data?.status === "success") return true;
    if (data?.data?.status === "success") return true;

    return false;
  }

  // --------------------------
  // Flows
  // --------------------------
  async function handleCOD() {
    clearAlert();
    const v = validateForm();
    if (!v.ok) return showAlert(v.msg);

    setBusy(true);

    try {
      const payload = buildOrderPayload("pending_fulfillment", { method: "cod" });
      localStorage.setItem(ORDER_PENDING_KEY, JSON.stringify(payload));

      const order = await createOrderInSupabase(payload);

      logInfo("COD order created", { order_id: order.id });
      clearCartAfterSuccess();
      localStorage.removeItem(ORDER_PENDING_KEY);

      goToConfirmation(order.id);
    } catch (err) {
      logError("COD order error", err);
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

    const pk = getPaystackPublicKey();
    if (!pk) return showAlert("Paystack public key is missing. Set window.PAYSTACK_PUBLIC_KEY (recommended).");

    setBusy(true);

    try {
      await loadPaystackScriptIfMissing();

      // 1) create pending order
      const pendingPayload = buildOrderPayload("pending_payment", { method: "paystack" });
      localStorage.setItem(ORDER_PENDING_KEY, JSON.stringify(pendingPayload));

      const order = await createOrderInSupabase(pendingPayload);
      logInfo("Paystack pending order created", { order_id: order.id });

      // 2) paystack popup
      const amountPesewas = Math.round(Number(total) * 100);
      const reference = `shopup_${order.id}_${Date.now()}`;

      const handler = window.PaystackPop.setup({
        key: pk,
        email: (el.email?.value || "").trim(),
        amount: amountPesewas,
        currency: "GHS",
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Customer", variable_name: "customer_name", value: (el.fullName?.value || "").trim() },
            { display_name: "Phone", variable_name: "customer_phone", value: (el.phone?.value || "").trim() },
            { display_name: "City", variable_name: "city", value: (el.city?.value || "").trim() },
          ],
          order_id: order.id,
        },
        callback: async function (response) {
          // response.reference is the Paystack ref
          try {
            logInfo("Paystack callback received", { ref: response?.reference });

            // 3) server-side verify
            const verified = await verifyPaymentServerSide(response.reference, total);
            if (!verified) {
              showAlert("Payment could not be verified. If you were charged, contact support with your reference.");
              await updateOrderInSupabase(order.id, {
                status: "pending_payment",
                payment_reference: response.reference,
              });
              return;
            }

            // 4) update order -> PAID
            const updated = await updateOrderInSupabase(order.id, {
              status: "paid",
              payment_reference: response.reference,
            });

            logInfo("Payment verified & order marked paid", { order_id: updated.id });

            clearCartAfterSuccess();
            localStorage.removeItem(ORDER_PENDING_KEY);
            goToConfirmation(updated.id);
          } catch (err) {
            logError("Paystack post-payment error", err);
            showAlert("Payment completed, but we couldn't confirm your order yet. Please refresh or contact support.");
          } finally {
            setBusy(false);
          }
        },
        onClose: function () {
          // User closed without paying
          logInfo("Paystack popup closed", { order_id: order.id });
          setBusy(false);
          showAlert("Payment was cancelled. You can try again.");
        },
      });

      handler.openIframe();
    } catch (err) {
      logError("Paystack flow error", err);
      showAlert("We couldn't start payment right now. Please try again.");
      setBusy(false);
    }
  }

  // --------------------------
  // Payment method toggle
  // --------------------------
  function syncPaymentButtons() {
    const method = el.paymentMethod?.value || "paystack";
    const isPaystack = method === "paystack";

    if (el.payNowBtn) el.payNowBtn.style.display = isPaystack ? "block" : "none";
    if (el.placeOrderBtn) el.placeOrderBtn.style.display = isPaystack ? "none" : "block";
  }

  // --------------------------
  // Boot
  // --------------------------
  async function init() {
    try {
      cartData = readCart();
      hydrateFromUser();

      // Only fetch products if cart uses productId format
      if (cartData.length && cartUsesProductIdShape()) {
        await loadProductsForCartIfNeeded();
      }

      renderSummary();
      syncPaymentButtons();

      // Events
      el.paymentMethod?.addEventListener("change", () => {
        syncPaymentButtons();
      });

      el.payNowBtn?.addEventListener("click", handlePaystack);
      el.placeOrderBtn?.addEventListener("click", handleCOD);

      logInfo("Checkout initialized", {
        cart_items: cartData.length,
        cart_key: cartData.length ? CART_KEY_PRIMARY : CART_KEY_FALLBACK,
      });
    } catch (err) {
      logError("Checkout init error", err);
      showAlert("Checkout could not load properly. Please refresh or try again.");
    }
  }

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
