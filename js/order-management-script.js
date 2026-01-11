// /js/order-management-script.js
/**
 * ShopUp Order Management (PROD schema + RLS) — MATCHES YOUR DB
 *
 * Tables:
 *  - public.orders
 *  - public.order_items
 *
 * Your orders columns include:
 *  id, order_number, customer_id, seller_id, delivery_address_id,
 *  subtotal, shipping_fee, tax, discount, total_amount,
 *  payment_method, payment_status, order_status, notes,
 *  tracking_number, shipped_at, delivered_at, cancelled_at, cancellation_reason,
 *  payment_reference, created_at, updated_at
 *
 * Assumptions:
 *  - one order = one seller
 *  - customer_id = auth.uid()
 *  - RLS policies enforce who can see/update which rows
 */

(function () {
  "use strict";

  console.log("📦 Order Management (PROD) loaded");

  // ---------------------------
  // Supabase access
  // ---------------------------
  async function sb() {
    if (window.supabaseReady) await window.supabaseReady;
    if (!window.supabase) throw new Error("Supabase client not found. Ensure /js/supabase-init.js is loaded.");
    return window.supabase;
  }

  async function getCurrentUser() {
    const supabase = await sb();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  // ---------------------------
  // Helpers
  // ---------------------------
  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function cleanStr(v) {
    const s = String(v ?? "").trim();
    return s.length ? s : null;
  }

  function calcLineSubtotal(qty, unitPrice) {
    return num(qty) * num(unitPrice);
  }

  function ensureItems(items) {
    if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

    const cleaned = items.map((it) => {
      const product_id = cleanStr(it.product_id);
      const product_name = cleanStr(it.product_name) || "Product";
      const product_sku = cleanStr(it.product_sku);
      const quantity = Math.trunc(num(it.quantity));
      const unit_price = num(it.unit_price);

      if (!product_id) throw new Error("Item missing product_id");
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Item quantity must be an integer > 0");
      if (unit_price < 0) throw new Error("Item unit_price must be >= 0");

      return { product_id, product_name, product_sku, quantity, unit_price };
    });

    return cleaned;
  }

  // Prefer DB RPC if it exists; fallback if not
  async function tryGenerateOrderNumber() {
    try {
      const supabase = await sb();
      const { data, error } = await supabase.rpc("generate_order_number");
      if (error) throw error;
      if (typeof data === "string" && data.trim()) return data.trim();
      throw new Error("RPC returned empty order number");
    } catch {
      const ts = Date.now().toString().slice(-6);
      const year = new Date().getFullYear();
      return `ORD-${year}-${ts}`;
    }
  }

  // ---------------------------
  // 1) Create Order (header)
  // ---------------------------
  /**
   * Create a new order row (no items yet)
   *
   * @param {Object} input
   * Required:
   *  - seller_id
   *  - subtotal, shipping_fee, tax, discount, total_amount
   *  - payment_method, payment_status, order_status
   *
   * Optional:
   *  - delivery_address_id, notes, tracking_number
   *  - shipped_at, delivered_at
   *  - payment_reference
   */
  async function createOrder(input) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const seller_id = cleanStr(input?.seller_id);
      if (!seller_id) throw new Error("Missing seller_id");

      const order_number = await tryGenerateOrderNumber();

      const order = {
        order_number,
        customer_id: user.id,
        seller_id,
        delivery_address_id: input?.delivery_address_id || null,

        subtotal: num(input?.subtotal),
        shipping_fee: num(input?.shipping_fee),
        tax: num(input?.tax),
        discount: num(input?.discount),
        total_amount: num(input?.total_amount),

        payment_method: cleanStr(input?.payment_method) || "cod",
        payment_status: cleanStr(input?.payment_status) || "unpaid",
        order_status: cleanStr(input?.order_status) || "pending",

        notes: cleanStr(input?.notes),

        tracking_number: cleanStr(input?.tracking_number),
        shipped_at: input?.shipped_at || null,
        delivered_at: input?.delivered_at || null,

        cancelled_at: input?.cancelled_at || null,
        cancellation_reason: cleanStr(input?.cancellation_reason),

        payment_reference: cleanStr(input?.payment_reference),
      };

      const { data, error } = await supabase.from("orders").insert(order).select("*").maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Order insert failed (no row returned). Check RLS insert policy.");

      console.log("✅ Order created:", data.order_number, data.id);
      return { success: true, data };
    } catch (error) {
      console.error("❌ createOrder error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 2) Add items to order
  // ---------------------------
  /**
   * @param {string} orderId
   * @param {Array<{product_id:string, product_name:string, product_sku?:string, quantity:number, unit_price:number}>} items
   */
  async function addOrderItems(orderId, items) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const oid = cleanStr(orderId);
      if (!oid) throw new Error("Missing orderId");

      const cleaned = ensureItems(items);

      const rows = cleaned.map((it) => ({
        order_id: oid,
        product_id: it.product_id,
        product_name: it.product_name,
        product_sku: it.product_sku,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: calcLineSubtotal(it.quantity, it.unit_price),
      }));

      const { data, error } = await supabase.from("order_items").insert(rows).select("*");
      if (error) throw error;

      console.log("✅ Items added:", Array.isArray(data) ? data.length : 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ addOrderItems error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 3) Customer orders
  // ---------------------------
  async function getMyOrders() {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ getMyOrders error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 4) Seller orders
  // ---------------------------
  async function getSellerOrders(sellerId, status = null) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const sid = cleanStr(sellerId);
      if (!sid) throw new Error("Missing sellerId");

      let query = supabase
        .from("orders")
        .select("*")
        .eq("seller_id", sid)
        .order("created_at", { ascending: false });

      if (status) query = query.eq("order_status", status);

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ getSellerOrders error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 5) Order details (header + items)
  // ---------------------------
  async function getOrderDetails(orderId) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const oid = cleanStr(orderId);
      if (!oid) throw new Error("Missing orderId");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", oid)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order?.id) throw new Error("Order not found or access denied (RLS).");

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", oid)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      return { success: true, data: { ...order, items: items || [] } };
    } catch (error) {
      console.error("❌ getOrderDetails error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 6) Customer cancel order
  // ---------------------------
  async function cancelMyOrder(orderId, reason = "") {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const oid = cleanStr(orderId);
      if (!oid) throw new Error("Missing orderId");

      const payload = {
        order_status: "cancelled",
        cancellation_reason: cleanStr(reason),
        cancelled_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("orders").update(payload).eq("id", oid).select("*").maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Cancel failed (no row returned). Check RLS update policy.");

      return { success: true, data };
    } catch (error) {
      console.error("❌ cancelMyOrder error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 7) Mark payment (optional helper)
  // ---------------------------
  async function markOrderPaid(orderId, payment_reference) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const oid = cleanStr(orderId);
      if (!oid) throw new Error("Missing orderId");

      const ref = cleanStr(payment_reference);
      if (!ref) throw new Error("Missing payment_reference");

      const payload = {
        payment_status: "paid",
        order_status: "confirmed",
        payment_reference: ref,
      };

      const { data, error } = await supabase
        .from("orders")
        .update(payload)
        .eq("id", oid)
        .eq("customer_id", user.id)
        .eq("order_status", "pending")
        .eq("payment_status", "pending")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) throw new Error("Payment update failed (no row returned).");

      return { success: true, data };
    } catch (error) {
      console.error("❌ markOrderPaid error:", error.message || error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // Expose globally
  // ---------------------------
  window.orderAPI = {
    createOrder,
    addOrderItems,
    getMyOrders,
    getSellerOrders,
    getOrderDetails,
    cancelMyOrder,
    markOrderPaid,
  };

  console.log("✅ orderAPI ready: window.orderAPI");
})();
