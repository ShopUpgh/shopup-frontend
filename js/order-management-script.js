/**
 * /js/order-management-script.js
 * Works with BOTH:
 *  - module pages using /js/supabase-init.js (window.supabaseReady + window.supabase)
 *  - UMD pages using /js/supabase-config.js (window.supabaseReady + window.supabase)
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

  async function getClient() {
    // 1) Preferred: window.supabaseReady promise
    if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
      const client = await window.supabaseReady;
      if (!client) throw new Error("Supabase not initialized (supabaseReady returned null).");
      return client;
    }

    // 2) Fallback: direct global client (should be rare)
    if (window.supabase && window.supabase.auth) return window.supabase;

    throw new Error("Supabase client not found. Include /js/supabase-init.js (module) OR UMD + /js/supabase-config.js.");
  }

  async function getCurrentUser() {
    const supabase = await getClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  function n(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function calcLineSubtotal(qty, unitPrice) {
    return n(qty) * n(unitPrice);
  }

  // Optional RPC if you add it later. Falls back safely.
  async function tryGenerateOrderNumber() {
    try {
      const supabase = await getClient();
      const { data, error } = await supabase.rpc("generate_order_number");
      if (error) throw error;
      if (!data) throw new Error("RPC returned no order number");
      return data;
    } catch (_e) {
      const ts = Date.now().toString().slice(-6);
      const year = new Date().getFullYear();
      return `ORD-${year}-${ts}`;
    }
  }

  /**
   * Create an order row (header)
   * @param {Object} input
   */
  async function createOrder(input) {
    try {
      const supabase = await getClient();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (!input?.seller_id) throw new Error("Missing seller_id");

      const order_number = await tryGenerateOrderNumber();

      const order = {
        order_number,
        customer_id: user.id,
        seller_id: input.seller_id,
        delivery_address_id: input.delivery_address_id || null,

        subtotal: n(input.subtotal),
        shipping_fee: n(input.shipping_fee),
        tax: n(input.tax),
        discount: n(input.discount),
        total_amount: n(input.total_amount),

        payment_method: input.payment_method || "cod",
        payment_status: input.payment_status || "unpaid",
        order_status: input.order_status || "pending",

        notes: input.notes || null,
        payment_reference: input.payment_reference || null,
      };

      const { data, error } = await supabase.from("orders").insert(order).select("*").single();
      if (error) throw error;

      console.log("✅ Order created:", data.order_number, data.id);
      return { success: true, data };
    } catch (error) {
      console.error("❌ createOrder error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Add items to an order
   * @param {string} orderId
   * @param {Array} items
   */
  async function addOrderItems(orderId, items) {
    try {
      const supabase = await getClient();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (!orderId) throw new Error("Missing orderId");
      if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

      const rows = items.map((it) => {
        const quantity = n(it.quantity);
        const unit_price = n(it.unit_price);
        return {
          order_id: orderId,
          product_id: it.product_id,
          product_name: it.product_name,
          product_sku: it.product_sku || null,
          quantity,
          unit_price,
          subtotal: calcLineSubtotal(quantity, unit_price),
        };
      });

      const { data, error } = await supabase.from("order_items").insert(rows).select("*");
      if (error) throw error;

      console.log("✅ Items added:", data.length);
      return { success: true, data };
    } catch (error) {
      console.error("❌ addOrderItems error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async function getMyOrders() {
    try {
      const supabase = await getClient();
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
      console.error("❌ getMyOrders error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async function getSellerOrders(sellerId, status = null) {
    try {
      const supabase = await getClient();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");
      if (!sellerId) throw new Error("Missing sellerId");

      let q = supabase.from("orders").select("*").eq("seller_id", sellerId);

      if (status) q = q.eq("order_status", status);

      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ getSellerOrders error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async function getOrderDetails(orderId) {
    try {
      const supabase = await getClient();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");
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
    } catch (error) {
      console.error("❌ getOrderDetails error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async function cancelMyOrder(orderId, reason = "") {
    try {
      const supabase = await getClient();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");
      if (!orderId) throw new Error("Missing orderId");

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
      console.error("❌ cancelMyOrder error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // expose globally (so HTML can call it)
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
