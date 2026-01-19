// /js/order-management-script.js
(function () {
  "use strict";

  console.log("📦 Order Management loaded");
  
  // ---------------------------
  // Supabase access
  // ---------------------------
  async function sb() {
    if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
      await window.supabaseReady;
    }
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
  function n(x) {
    const v = Number(x);
    return Number.isFinite(v) ? v : 0;
  }

  function calcLineSubtotal(qty, unitPrice) {
    return n(qty) * n(unitPrice);
  }

  async function tryGenerateOrderNumber() {
    try {
      const supabase = await sb();
      const { data, error } = await supabase.rpc("generate_order_number");
      if (error) throw error;
      return data;
    } catch {
      const ts = Date.now().toString().slice(-6);
      const year = new Date().getFullYear();
      return `ORD-${year}-${ts}`;
    }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  // ---------------------------
  // 1) Create Order (header)
  // ---------------------------
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

        subtotal: n(input.subtotal),
        shipping_fee: n(input.shipping_fee),
        tax: n(input.tax),
        discount: n(input.discount),
        total_amount: n(input.total_amount),

        payment_method: input.payment_method || "cod",
        payment_status: input.payment_status || "unpaid",
        order_status: input.order_status || "pending",

        notes: input.notes || null,

        // optional fields from your schema
        payment_reference: input.payment_reference || null,
        tracking_number: input.tracking_number || null,
        shipped_at: input.shipped_at || null,
        delivered_at: input.delivered_at || null,
        cancelled_at: input.cancelled_at || null,
        cancellation_reason: input.cancellation_reason || null,

        // keep updated_at in sync if you use it
        updated_at: nowIso(),
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(order)
        .select("*")
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("❌ createOrder error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ---------------------------
  // 2) Add items to order
  // ---------------------------
  async function addOrderItems(orderId, items) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (!orderId) throw new Error("Missing orderId");
      if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

      const rows = items.map((it) => {
        const quantity = n(it.quantity);
        const unit_price = n(it.unit_price);
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

      const { data, error } = await supabase
        .from("order_items")
        .insert(rows)
        .select("*");

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ addOrderItems error:", error);
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
      console.error("❌ getMyOrders error:", error);
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

      const sid = sellerId || user.id;

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
      console.error("❌ getSellerOrders error:", error);
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
      console.error("❌ getOrderDetails error:", error);
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

      const { data, error } = await supabase
        .from("orders")
        .update({
          order_status: "cancelled",
          cancellation_reason: reason || null,
          cancelled_at: nowIso(),
          updated_at: nowIso(),
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

  // ---------------------------
  // 7) Seller update status
  // ---------------------------
  async function updateOrderStatusAsSeller(orderId, newStatus) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("orders")
        .update({
          order_status: String(newStatus || "pending").toLowerCase(),
          updated_at: nowIso(),
        })
        .eq("id", orderId)
        .select("*")
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("❌ updateOrderStatusAsSeller error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // Expose globally
  window.orderAPI = {
    createOrder,
    addOrderItems,
    getMyOrders,
    getSellerOrders,
    getOrderDetails,
    cancelMyOrder,
    updateOrderStatusAsSeller,
  };

  console.log("✅ orderAPI ready: window.orderAPI");
})();
