// /js/order-management-script.js
/**
 * ShopUp Order Management (PROD schema + RLS)
 *
 * Tables:
 *  - public.orders
 *  - public.order_items
 *
 * Assumptions:
 *  - one order = one seller
 *  - customer_id = auth.uid()
 *  - RLS policies enforce access (customer sees own; seller sees assigned)
 */

(function () {
  "use strict";

  const TAG = "[orderAPI]";

  // ---------------------------
  // Supabase access (single source of truth)
  // ---------------------------
  async function sb() {
    if (window.supabaseReady) await window.supabaseReady;
    if (!window.supabase) throw new Error("Supabase client missing on window.supabase");
    return window.supabase;
  }

  async function requireUser() {
    const supabase = await sb();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error("Not authenticated");
    return data.user;
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  function calcLineSubtotal(qty, unitPrice) {
    return num(qty) * num(unitPrice);
  }

  // ---------------------------
  // Order number generation (RPC if exists, else fallback)
  // ---------------------------
  async function generateOrderNumber() {
    try {
      const supabase = await sb();
      const { data, error } = await supabase.rpc("generate_order_number");
      if (error) throw error;
      if (typeof data === "string" && data.trim()) return data.trim();
      throw new Error("generate_order_number returned invalid value");
    } catch {
      const year = new Date().getFullYear();
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      const tail = Date.now().toString().slice(-6);
      return `ORD-${year}-${tail}-${rand}`;
    }
  }

  // ---------------------------
  // 1) Create Order (orders)
  // ---------------------------
  async function createOrder(input) {
    try {
      const supabase = await sb();
      const user = await requireUser();

      if (!input || !input.seller_id) throw new Error("Missing seller_id");

      const order_number = await generateOrderNumber();

      const row = {
        order_number,
        customer_id: user.id, // matches your INSERT RLS checks (customer_id = auth.uid())
        seller_id: input.seller_id,
        delivery_address_id: input.delivery_address_id || null,

        subtotal: num(input.subtotal),
        shipping_fee: num(input.shipping_fee),
        tax: num(input.tax),
        discount: num(input.discount),
        total_amount: num(input.total_amount),

        payment_method: input.payment_method || "cod",
        payment_status: input.payment_status || "unpaid",
        order_status: input.order_status || "pending",

        notes: input.notes || null,

        // optional in your schema
        payment_reference: input.payment_reference || null,
      };

      const { data, error } = await supabase.from("orders").insert(row).select("*").single();
      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error(TAG, "createOrder error:", err);
      return { success: false, error: err?.message || "createOrder failed" };
    }
  }

  // ---------------------------
  // 2) Add items (order_items)
  // ---------------------------
  async function addOrderItems(orderId, items) {
    try {
      const supabase = await sb();
      await requireUser();

      if (!orderId) throw new Error("Missing orderId");
      if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

      const rows = items.map((it) => {
        const quantity = num(it.quantity);
        const unit_price = num(it.unit_price);

        return {
          order_id: orderId,
          product_id: it.product_id || null,
          product_name: (it.product_name || "Product").toString(),
          product_sku: it.product_sku || null,
          quantity,
          unit_price,
          subtotal: calcLineSubtotal(quantity, unit_price),
        };
      });

      const { data, error } = await supabase.from("order_items").insert(rows).select("*");
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error(TAG, "addOrderItems error:", err);
      return { success: false, error: err?.message || "addOrderItems failed" };
    }
  }

  // ---------------------------
  // 3) Customer orders
  // ---------------------------
  async function getMyOrders() {
    try {
      const supabase = await sb();
      const user = await requireUser();

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error(TAG, "getMyOrders error:", err);
      return { success: false, error: err?.message || "getMyOrders failed" };
    }
  }

  // ---------------------------
  // 4) Seller orders (sellerId usually = auth.uid())
  // ---------------------------
  async function getSellerOrders(sellerId, status) {
    try {
      const supabase = await sb();
      await requireUser();

      if (!sellerId) throw new Error("Missing sellerId");

      let q = supabase.from("orders").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false });
      if (status) q = q.eq("order_status", status);

      const { data, error } = await q;
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (err) {
      console.error(TAG, "getSellerOrders error:", err);
      return { success: false, error: err?.message || "getSellerOrders failed" };
    }
  }

  // ---------------------------
  // 5) Order details (header + items)
  // ---------------------------
  async function getOrderDetails(orderId) {
    try {
      const supabase = await sb();
      await requireUser();

      if (!orderId) throw new Error("Missing orderId");

      const { data: order, error: e1 } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (e1) throw e1;

      const { data: items, error: e2 } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (e2) throw e2;

      return { success: true, data: { ...order, items: items || [] } };
    } catch (err) {
      console.error(TAG, "getOrderDetails error:", err);
      return { success: false, error: err?.message || "getOrderDetails failed" };
    }
  }

  // ---------------------------
  // 6) Customer cancel (pending only is enforced by your policies)
  // ---------------------------
  async function cancelMyOrder(orderId, reason) {
    try {
      const supabase = await sb();
      await requireUser();

      if (!orderId) throw new Error("Missing orderId");

      const patch = {
        order_status: "cancelled",
        cancellation_reason: reason || null,
        cancelled_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from("orders").update(patch).eq("id", orderId).select("*").single();
      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error(TAG, "cancelMyOrder error:", err);
      return { success: false, error: err?.message || "cancelMyOrder failed" };
    }
  }

  // ---------------------------
  // 7) Mark payment reference/status (used after Paystack verification)
  // ---------------------------
  async function markOrderPaid(orderId, paymentReference) {
    try {
      const supabase = await sb();
      await requireUser();

      if (!orderId) throw new Error("Missing orderId");

      const patch = {
        payment_reference: paymentReference || null,
        payment_status: "paid",
        order_status: "confirmed",
      };

      const { data, error } = await supabase.from("orders").update(patch).eq("id", orderId).select("*").single();
      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      console.error(TAG, "markOrderPaid error:", err);
      return { success: false, error: err?.message || "markOrderPaid failed" };
    }
  }

  // ---------------------------
  // Export
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
})();
