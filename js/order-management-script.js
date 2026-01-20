// /js/order-management-script.js
/**
 * ShopUp Order Management (PROD schema + RLS)
 * Requires ONE of:
 *  - /js/supabase-init.js (module)  OR
 *  - Supabase CDN + /js/supabase-config.js (UMD shim)
 *
 * Tables:
 *  - public.orders
 *  - public.order_items
 *
 * Assumptions:
 *  - one order = one seller
 *  - customer_id = auth.uid()
 *  - seller_id = auth.uid() for seller views
 *  - RLS policies enforce access
 */

(function () {
  "use strict";

  console.log("📦 Order Management (PROD) loaded");

  async function sb() {
    // Preferred: module init
    if (window.supabaseReady && typeof window.supabaseReady.then === "function") {
      const client = await window.supabaseReady;
      if (!client) throw new Error("Supabase not initialized (supabaseReady is null).");
      return client;
    }

    // Fallback: shim helper
    if (typeof window.ShopUpSupabaseWait === "function") {
      return await window.ShopUpSupabaseWait();
    }

    // Last resort: global client
    if (window.supabase && typeof window.supabase.from === "function") return window.supabase;

    throw new Error("Supabase client not found. Load /js/supabase-init.js or /js/supabase-config.js.");
  }

  async function getCurrentUser() {
    const supabase = await sb();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data?.user || null;
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  function calcLineSubtotal(qty, unitPrice) {
    return num(qty) * num(unitPrice);
  }

  async function tryGenerateOrderNumber() {
    try {
      const supabase = await sb();
      const { data, error } = await supabase.rpc("generate_order_number");
      if (error) throw error;
      if (typeof data === "string" && data.trim()) return data.trim();
      throw new Error("generate_order_number returned empty");
    } catch (e) {
      const ts = Date.now().toString().slice(-6);
      const year = new Date().getFullYear();
      return `ORD-${year}-${ts}`;
    }
  }

  /**
   * Create a new order (header) row
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

        subtotal: num(input.subtotal),
        shipping_fee: num(input.shipping_fee),
        tax: num(input.tax),
        discount: num(input.discount),
        total_amount: num(input.total_amount),

        payment_method: input.payment_method || "cod",
        payment_status: input.payment_status || "unpaid",
        order_status: input.order_status || "pending",

        payment_reference: input.payment_reference || null,
        notes: input.notes || null,
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
   */
  async function addOrderItems(orderId, items) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (!orderId) throw new Error("Missing orderId");
      if (!Array.isArray(items) || items.length === 0) throw new Error("No items provided");

      const rows = items.map((it) => {
        const quantity = num(it.quantity);
        const unit_price = num(it.unit_price);
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

  /**
   * Customer: list my orders
   */
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

  /**
   * Seller: list my assigned orders (seller_id = auth.uid())
   * NOTE: sellerId param is optional; kept for compatibility with your UI.
   */
  async function getSellerOrders(sellerId = null, status = null) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const sid = sellerId || user.id;

      let q = supabase.from("orders").select("*").eq("seller_id", sid);

      if (status) q = q.eq("order_status", status);

      q = q.order("created_at", { ascending: false });

      const { data, error } = await q;
      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("❌ getSellerOrders error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Order details (header + items)
   */
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

  /**
   * Customer: cancel my order (RLS/policies should restrict to pending)
   */
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
      console.error("❌ cancelMyOrder error:", error);
      return { success: false, error: error.message || String(error) };
    }
  }

  /**
   * Seller: update order status (RLS allows seller_id = auth.uid())
   */
  async function sellerUpdateOrderStatus(orderId, nextStatus, trackingNumber = null) {
    try {
      const supabase = await sb();
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (!orderId) throw new Error("Missing orderId");
      if (!nextStatus) throw new Error("Missing nextStatus");

      const patch = {
        order_status: nextStatus,
        updated_at: new Date().toISOString(),
      };

      if (trackingNumber) patch.tracking_number = trackingNumber;

      // Optional timestamps
      if (nextStatus === "shipped") patch.shipped_at = new Date().toISOString();
      if (nextStatus === "delivered") patch.delivered_at = new Date().toISOString();

      const { data, error } = await supabase.from("orders").update(patch).eq("id", orderId).select("*").single();
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("❌ sellerUpdateOrderStatus error:", error);
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
    sellerUpdateOrderStatus,
  };

  console.log("✅ orderAPI ready: window.orderAPI");
})();
