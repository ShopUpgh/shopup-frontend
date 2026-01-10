// /js/adapters/products.supabase.js
(function () {
  "use strict";

  function createProductsAdapter({ supabaseWait }) {
    return {
      async listActive(limit = 12) {
        const supabase = await supabaseWait.waitForSupabase();
        return supabase.from("products").select("*").eq("status", "active").limit(limit);
      },
      async getByIds(ids) {
        const supabase = await supabaseWait.waitForSupabase();
        return supabase.from("products").select("*").in("id", ids);
      },
    };
  }

  window.ShopUpProductsAdapterFactory = { createProductsAdapter };
})();
