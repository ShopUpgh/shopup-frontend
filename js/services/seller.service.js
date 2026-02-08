// /js/services/seller.service.js
(function () {
  "use strict";

  function createSellerService({ supabaseWait, logger }) {
    async function getClient() {
      const s = await supabaseWait.waitForSupabase();
      return s;
    }

    async function getAuthUser() {
      const client = await getClient();
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return data?.user || null;
    }

    async function getSellerByUserId(userId) {
      const client = await getClient();

      const { data, error } = await client
        .from("sellers")
        .select("id, user_id, email, business_name, business_category, phone, city, region, store_slug, status, updated_at, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    }

    async function updateSeller(userId, patch) {
      const client = await getClient();

      const safePatch = { ...patch, updated_at: new Date().toISOString() };

      const { data, error } = await client
        .from("sellers")
        .update(safePatch)
        .eq("user_id", userId)
        .select("id, user_id, email, business_name, business_category, phone, city, region, store_slug, status, updated_at, created_at")
        .maybeSingle();

      if (error) throw error;
      return data || null;
    }

    async function submitVerification(userId, formData) {
      // When seller submits verification → status becomes pending
      const patch = {
        business_name: formData.business_name,
        business_category: formData.business_category,
        phone: formData.phone || null,
        city: formData.city || null,
        region: formData.region || null,
        store_slug: formData.store_slug || null,
        status: "pending",
      };

      logger.info("Seller verification submitted", { userId });

      return updateSeller(userId, patch);
    }

    async function markDraft(userId) {
      return updateSeller(userId, { status: "draft" });
    }

    return {
      getAuthUser,
      getSellerByUserId,
      submitVerification,
      updateSeller,
      markDraft,
    };
  }

  window.ShopUpSellerServiceFactory = { createSellerService };
})();
