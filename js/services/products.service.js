// /js/services/products.service.js
(function () {
  "use strict";

  function createProductsService({ productsAdapter, logger }) {
    async function listActive(limit) {
      const { data, error } = await productsAdapter.listActive(limit);
      if (error) {
        logger.error("Failed to list products", error);
        throw error;
      }
      return data || [];
    }

    async function getByIds(ids) {
      const { data, error } = await productsAdapter.getByIds(ids);
      if (error) {
        logger.error("Failed to load products for cart", error, { idsCount: ids?.length });
        throw error;
      }
      return data || [];
    }

    return { listActive, getByIds };
  }

  window.ShopUpProductsServiceFactory = { createProductsService };
})();
