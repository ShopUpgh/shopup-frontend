// /js/pages/seller-orders.page.js
import "/js/supabase-init.js";
import "/js/order-management-script.js";

async function getClient() {
  if (window.supabaseReady) {
    const c = await window.supabaseReady;
    if (c) return c;
  }
  if (window.supabase) return window.supabase;
  throw new Error("Supabase client not initialized");
}

// Legacy compatibility for inline script on seller orders page
if (window.orderAPI?.getSellerOrders) {
  window.getSellerOrders = window.orderAPI.getSellerOrders;
}

window.updateOrderStatus = async function updateOrderStatus(orderId, newStatus) {
  const client = await getClient();
  const { error } = await client
    .from("orders")
    .update({
      order_status: String(newStatus || "pending").toLowerCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    throw error;
  }

  return { success: true };
};
