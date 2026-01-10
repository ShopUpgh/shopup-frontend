// /js/adapters/cart.storage.js
(function () {
  "use strict";

  function createCartStorage(config) {
    const KEY = config.storage.CART_KEY;

    function read() {
      try {
        return JSON.parse(localStorage.getItem(KEY) || "[]");
      } catch {
        return [];
      }
    }

    function write(cart) {
      localStorage.setItem(KEY, JSON.stringify(cart || []));
    }

    return { read, write };
  }

  window.ShopUpCartStorageFactory = { createCartStorage };
})();
