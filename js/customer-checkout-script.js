// /js/customer-checkout-script.js  (PROD schema + RLS + one-seller cart)
(function () {
  "use strict";

  // --------------------------
  // Storage keys (MATCH cart.html)
  // --------------------------
  const CART_KEY_PRIMARY = "shopup_cart";
  const CART_KEY_FALLBACK = "cart";

  // Money / rules
  const SHIPPING_FLAT = 20; // adjust anytime
  const VERIFY_FUNCTION = "verify-payment"; // Supabase Edge Function

  let cartData = [];
  let products = []; // loaded if cart items only have productId
  let currentUser = null;

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

  async function waitForSupabase() {
    if (window.supabaseReady) await window.supabaseReady;
    if (!window.supabase) throw new Error("Supabase not ready (check /js/supabase-init.js)");
  }

  async function requireAuth() {
    await waitForSupabase();
    const { data, error } = await window.supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) {
      window.location.href = "customer-login.html";
      return null;
    }
    return data.user;
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

  // --------------------------
  // Cart normalization
  // --------------------------
  function cartUsesProductIdShape() {
    return cartData.some((i) => i && (i.productId !== undefined || i.product_id !== undefined));
  }

  function normalizeCartItem(item) {
    if (!item) return null;

    const quantity = Number(item.quantity || 0);

    // A) direct-price cart: { id, name, price, quantity, seller_id? }
    if (item.price != null && item.name) {
      return {
        id: item.id ?? item.productId ?? item.product_id ?? null,
        product_id: item.id ?? item.productId ?? item.product_id ?? null,
        product_name: String(item.name),
        unit_price: Number(item.price || 0),
        quantity,
        product_sku: item.sku || null,
        seller_id: item.seller_id || null, // may be present
      };
    }

    // B) productId cart: { productId/product_id, quantity }
    const pid = item.productId ?? item.product_id ?? item.id ?? null;
    return {
      id: pid,
      product_id: pid,
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

    // IMPORTANT: include seller_id for one-seller enforcement
    const { data, error } = await window.supabase
      .from("products")
      .select("id,name,price,sku,category,image_url,status,is_active,seller_id")
      .in("id", ids);

    if (error) throw error;
    products = Array.isArray(data) ? data : [];
  }

  // --------------------------
  // Totals
  // --------------------------
  function calcSubtotal() {
    return cartData.reduce((sum, raw) => {
      const item = normalizeCartItem(raw);
      if (!item) return sum;

      // Direct-price cart
      if (item.unit_price != null && item.product_name) {
        return sum + Number(item.unit_price || 0) * Number(item.quantity || 0);
      }

      // productId cart
      const p = getProductById(item.product_id);
      const price = Number(p?.price || 0);
      return sum + price * Number(item.quantity || 0);
    }, 0);
  }

  function calcShipping(subtotal) {
    return subtotal > 0 ? SHIPPING_FLAT : 0;
  }

  function calcTotals() {
    const subtotal = calcSubtotal();
    const shipping_fee = calcShipping(subtotal);
    const total_amount = subtotal + shipping_fee;
    return { subtotal, shipping_fee, total_amount };
  }

  // --------------------------
  // Enforce one order = one seller
  // --------------------------
  function resolveSellerIdOrThrow() {
    const sellerIds = new Set();

    cartData.forEach((raw) => {
      const item = normalizeCartItem(raw);
      if (!item) return;

      // If cart contains seller_id directly
      if (item.seller_id) sellerIds.add(String(item.seller_id));

      // If cart is productId-based, use products lookup
      if (!item.seller_id && item.product_id) {
        const p = getProductById(item.product_id);
        if (p?.seller_id) sellerIds.add(String(p.seller_id));
      }
    });

    sellerIds.delete("null");
    sellerIds.delete("undefined");

    if (sellerIds.size === 0) {
      // If products table doesn't have seller_id, you MUST add it.
      throw new Error("Cannot determine seller_id for this cart. Ensure products.seller_id exists and is loaded.");
    }

    if (sellerIds.size > 1) {
      throw new Error("Your cart has items from multiple sellers. One order must contain items from only ONE seller.");
    }

    return Array.from(sellerIds)[0];
  }

  // --------------------------
  // Render
  // --------------------------
  function renderSummary() {
    const { subtotal, shipping_fee, total_amount } = calcTotals();

    if (el.subtotal) el.subtotal.textContent = formatMoney(subtotal);
    if (el.shipping) el.shipping.textContent = formatMoney(shipping_fee);
    if (el.total) el.total.textContent = formatMoney(total_amount);

    const itemCount = cartData.reduce((n, i) => n + Number(i?.quantity || 0), 0);
    if (el.itemCountPill) el.itemCountPill.textContent = `${itemCount} item${itemCount === 1 ? "" : "s"}`;

    if (!el.itemsList) return;
    el.itemsList.textContent = "";

    if (!cartData.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "Your cart is empty. Go back to cart.";
      el.itemsList.appendChild(p);
      return;
    }

    cartData.forEach((raw) => {
      const item = normalizeCartItem(raw);
      if (!item) return;

      let name = "Product";
      let price = 0;

      // direct cart
      if (item.unit_price != null && item.product_name) {
        name = item.product_name;
        price = item.unit_price;
      } else {
        const p = getProductById(item.product_id) || {};
        name = p.name || "Product";
        price = Number(p.price || 0);
      }

      const qty = Number(item.quantity || 0);

      const wrapper = document.createElement("div");
      wrapper.className = "item";

      const left = document.createElement("div");

      const title = document.createElement("div");
      title.className = "item-name";
      title.textContent = String(name);

      const meta = document.createElement("div");
      meta.className = "muted";
      meta.textContent = `Qty: ${qty}`;

      left.appendChild(title);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.style.fontWeight = "700";
      right.textContent = formatMoney(price * qty);

      wrapper.appendChild(left);
      wrapper.appendChild(right);

      el.itemsList.appendChild(wrapper);
    });
  }

  function hydrateFromAuthUser() {
    if (!currentUser) return;
    if (el.email && !el.email.value && currentUser.email) el.email.value = currentUser.email;

    // Optional: if you store name/phone in user_metadata
    const md = currentUser.user_metadata || {};
    if (el.fullName && !el.fullName.value && md.full_name) el.fullName.value = md.full_name;
    if (el.phone && !el.phone.value && md.phone) el.phone.value = md.phone;
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
  // Build items for order_items table
  // --------------------------
  function buildOrderItemsForDB() {
    return cartData
      .map((raw) => {
        const item = normalizeCartItem(raw);
        if (!item) return null;

        // direct cart
        if (item.unit_price != null && item.product_name) {
          return {
            product_id: item.product_id || null,
            product_name: item.product_name || "Product",
            product_sku: item.product_sku || null,
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
          };
        }

        // productId cart
        const p = getProductById(item.product_id) || {};
        return {
          product_id: item.product_id,
          product_name: p.name || "Product",
          product_sku: p.sku || null,
          quantity: Number(item.quantity || 0),
          unit_price: Number(p.price || 0),
        };
      })
      .filter(Boolean);
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

    const { data, error } = await window.supabase.functions.invoke(VERIFY_FUNCTION, {
      body: {
        reference,
        expected_total: Number(expectedTotalGHS),
        currency: "GHS",
      },
    });

    if (error) throw error;

    if (data?.verified === true) return true;
    if (data?.status === "success") return true;
    if (data?.data?.status === "success") return true;

    return false;
  }

  // --------------------------
  // Flows (COD / Paystack)
  // --------------------------
  function syncPaymentButtons() {
    const method = el.paymentMethod?.value || "paystack";
    const isPaystack = method === "paystack";

    if (el.payNowBtn) el.payNowBtn.style.display = isPaystack ? "block" : "none";
    if (el.placeOrderBtn) el.placeOrderBtn.style.display = isPaystack ? "none" : "block";
  }

  function buildNotesBlob(paymentRefOrNull) {
    const fullName = (el.fullName?.value || "").trim();
    const phone = (el.phone?.value || "").trim();
    const email = (el.email?.value || "").trim();
    const city = (el.city?.value || "").trim();
    const addressLine = (el.addressLine?.value || "").trim();
    const notes = (el.notes?.value || "").trim();

    const parts = [
      `Customer: ${fullName}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `City: ${city}`,
      `Address: ${addressLine}`,
      notes ? `Notes: ${notes}` : null,
      paymentRefOrNull ? `PaymentRef: ${paymentRefOrNull}` : null,
    ].filter(Boolean);

    return parts.join(" | ");
  }

  async function handleCOD() {
    clearAlert();
    const v = validateForm();
    if (!v.ok) return showAlert(v.msg);

    setBusy(true);

    try {
      await waitForSupabase();

      // Enforce one seller per order
      const seller_id = resolveSellerIdOrThrow();

      const { subtotal, shipping_fee, total_amount } = calcTotals();

      // 1) create order (RLS uses auth.uid())
      const orderRes = await window.orderAPI.createOrder({
        seller_id,
        delivery_address_id: null, // We store the address text in notes for now
        subtotal,
        shipping_fee,
        tax: 0,
        discount: 0,
        total_amount,
        payment_method: "cod",
        payment_status: "unpaid",
        order_status: "pending",
        notes: buildNotesBlob(null),
      });

      if (!orderRes.success) throw new Error(orderRes.error);
      const order = orderRes.data;

      // 2) add items
      const items = buildOrderItemsForDB();
      const addRes = await window.orderAPI.addOrderItems(order.id, items);
      if (!addRes.success) throw new Error(addRes.error);

      logInfo("COD order created", { order_id: order.id });

      // Clear cart
      localStorage.setItem(CART_KEY_PRIMARY, "[]");

      // Go confirmation
      window.location.href = `customer-order-confirmation.html?order_id=${encodeURIComponent(order.id)}`;
    } catch (err) {
      logError("COD order error", err);
      showAlert(err?.message || "We couldn't place your order right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePaystack() {
    clearAlert();
    const v = validateForm();
    if (!v.ok) return showAlert(v.msg);

    const { total_amount, subtotal, shipping_fee } = calcTotals();
    if (total_amount <= 0) return showAlert("Cart total is invalid.");

    const pk = getPaystackPublicKey();
    if (!pk) return showAlert("Paystack public key is missing. Set window.PAYSTACK_PUBLIC_KEY.");

    setBusy(true);

    try {
      await waitForSupabase();
      await loadPaystackScriptIfMissing();

      // Enforce one seller per order
      const seller_id = resolveSellerIdOrThrow();

      // 1) create pending order
      const createRes = await window.orderAPI.createOrder({
        seller_id,
        delivery_address_id: null,
        subtotal,
        shipping_fee,
        tax: 0,
        discount: 0,
        total_amount,
        payment_method: "paystack",
        payment_status: "pending",
        order_status: "pending",
        notes: buildNotesBlob(null),
      });

      if (!createRes.success) throw new Error(createRes.error);
      const order = createRes.data;

      logInfo("Paystack pending order created", { order_id: order.id });

      // 2) paystack popup
      const amountPesewas = Math.round(Number(total_amount) * 100);
      const reference = `shopup_${order.id}_${Date.now()}`;

      const handler = window.PaystackPop.setup({
        key: pk,
        email: (el.email?.value || "").trim(),
        amount: amountPesewas,
        currency: "GHS",
        ref: reference,
        metadata: {
          order_id: order.id,
          customer_id: currentUser?.id,
        },
        callback: async function (response) {
          try {
            logInfo("Paystack callback received", { ref: response?.reference, order_id: order.id });

            // 3) verify server-side
            const verified = await verifyPaymentServerSide(response.reference, total_amount);
            if (!verified) {
              showAlert("Payment could not be verified. If you were charged, contact support with your reference.");
              // store reference if you added column
              await window.supabase.from("orders").update({
                payment_reference: response.reference,
                payment_status: "pending",
                notes: buildNotesBlob(response.reference),
              }).eq("id", order.id);
              return;
            }

            // 4) mark as paid (and confirm order)
            await window.supabase.from("orders").update({
              payment_reference: response.reference,   // requires the optional column
              payment_status: "paid",
              order_status: "confirmed",
              notes: buildNotesBlob(response.reference),
            }).eq("id", order.id);

            // 5) add items only AFTER payment verified (recommended)
            const items = buildOrderItemsForDB();
            const addRes = await window.orderAPI.addOrderItems(order.id, items);
            if (!addRes.success) throw new Error(addRes.error);

            // Clear cart + redirect
            localStorage.setItem(CART_KEY_PRIMARY, "[]");

            window.location.href = `customer-order-confirmation.html?order_id=${encodeURIComponent(order.id)}`;
          } catch (err) {
            logError("Paystack post-payment error", err);
            showAlert("Payment completed, but we couldn't finalize your order yet. Please contact support.");
          } finally {
            setBusy(false);
          }
        },
        onClose: function () {
          logInfo("Paystack popup closed", { order_id: order.id });
          setBusy(false);
          showAlert("Payment was cancelled. You can try again.");
        },
      });

      handler.openIframe();
    } catch (err) {
      logError("Paystack flow error", err);
      showAlert(err?.message || "We couldn't start payment right now. Please try again.");
      setBusy(false);
    }
  }

  // --------------------------
  // Boot
  // --------------------------
  async function init() {
    try {
      // Auth
      currentUser = await requireAuth();
      if (!currentUser) return;

      // Hydrate email/name/phone from auth profile
      hydrateFromAuthUser();

      // Cart
      cartData = readCart();

      if (cartData.length && cartUsesProductIdShape()) {
        await loadProductsForCartIfNeeded();
      }

      // Enforce one-seller cart early (so user knows before paying)
      try {
        resolveSellerIdOrThrow();
      } catch (e) {
        showAlert(e.message);
        // Optionally send them back to cart to fix it
        // window.location.href = "cart.html";
        return;
      }

      renderSummary();
      syncPaymentButtons();

      el.paymentMethod?.addEventListener("change", syncPaymentButtons);
      el.payNowBtn?.addEventListener("click", handlePaystack);
      el.placeOrderBtn?.addEventListener("click", handleCOD);

      logInfo("Checkout initialized", { cart_items: cartData.length });
    } catch (err) {
      logError("Checkout init error", err);
      showAlert("Checkout could not load properly. Please refresh or try again.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
