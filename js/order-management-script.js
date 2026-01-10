/**
 * ShopUp Order Management (PROD schema + RLS)
 * Works with /js/supabase-init.js (window.supabaseReady + window.supabase)
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

  console.log("📦 Order Management (PROD) loaded");

  async function sb() {
    // Always wait for supabase-init.js
    if (window.supabaseReady) await window.supabaseReady;
    if (!window.supabase) throw new Error("Supabase client not found on window.supabase");
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
  function calcLineSubtotal(qty, unitPrice) {
    const q = Number(qty || 0);
    const p = Number(unitPrice || 0);
    return q * p;
  }

  // Option A: Use your RPC if it exists
  async function tryGenerateOrderNumber() {
    try {
      const supabase = await sb();
      const { data, error } = await supabase.rpc("generate_order_number");
      if (error) throw error;
      return data;
    } catch (e) {
      // fallback client-side (still unique enough for MVP)
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
   * @param {string} input.seller_id (required)
   * @param {string|null} input.delivery_address_id
   * @param {number} input.subtotal
   * @param {number} input.shipping_fee
   * @param {number} input.tax
   * @param {number} input.discount
   * @param {number} input.total_amount
   * @param {string} input.payment_method
   * @param {string} input.notes
   */
  async function createOrder(input) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (!input?.seller_id) throw new Error("Missing seller_id");

      const order_number = await tryGenerateOrderNumber();

      const order = {
        order_number,
        customer_id: user.id,
        seller_id: input.seller_id,
        delivery_address_id: input.delivery_address_id || null,

        subtotal: Number(input.subtotal || 0),
        shipping_fee: Number(input.shipping_fee || 0),
        tax: Number(input.tax || 0),
        discount: Number(input.discount || 0),
        total_amount: Number(input.total_amount || 0),

        payment_method: input.payment_method || "cod",
        payment_status: input.payment_status || "unpaid",
        order_status: input.order_status || "pending",

        notes: input.notes || null,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(order)
        .select("*")
        .single();

      if (error) throw error;

      console.log("✅ Order created:", data.order_number, data.id);
      return { success: true, data };
    } catch (error) {
      console.error("❌ createOrder error:", error.message);
      return { success: false, error: error.message };
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

      if (!orderId) throw new Error("Missing orderId");
      if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

      const rows = items.map((it) => {
        const quantity = Number(it.quantity || 0);
        const unit_price = Number(it.unit_price || 0);
        const subtotal = calcLineSubtotal(quantity, unit_price);

        return {
          order_id: orderId,
          product_id: it.product_id,
          product_name: it.product_name,
          product_sku: it.product_sku || null,
          quantity,
          unit_price,
          subtotal,
        };
      });

      const { data, error } = await supabase.from("order_items").insert(rows).select("*");
      if (error) throw error;

      console.log("✅ Items added:", data.length);
      return { success: true, data };
    } catch (error) {
      console.error("❌ addOrderItems error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // ---------------------------
  // 3) Customer orders (RLS filters automatically)
  // ---------------------------
  async function getMyOrders() {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // RLS ensures only your rows return, but we can still filter by customer_id for clarity
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ getMyOrders error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // ---------------------------
  // 4) Seller orders (if you ever use this in seller UI)
  // ---------------------------
  async function getSellerOrders(sellerId, status = null) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("orders")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (status) query = query.eq("order_status", status);

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ getSellerOrders error:", error.message);
      return { success: false, error: error.message };
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

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      return { success: true, data: { ...order, items: items || [] } };
    } catch (error) {
      console.error("❌ getOrderDetails error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // ---------------------------
  // 6) Customer cancel order (pending only; DB trigger enforces)
  // ---------------------------
  async function cancelMyOrder(orderId, reason = "") {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          cancellation_reason: reason || null,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("*")
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("❌ cancelMyOrder error:", error.message);
      return { success: false, error: error.message };
    }
  }

  // Expose globally (so your HTML can call them)
  window.orderAPI = {
    createOrder,
    addOrderItems,
    getMyOrders,
    getSellerOrders,
    getOrderDetails,
    cancelMyOrder,
  };

  console.log("✅ orderAPI ready: window.orderAPI");
})();
