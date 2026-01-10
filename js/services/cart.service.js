// /js/services/cart.service.js
(function () {
  "use strict";

  function createCartService({ cartStorage, logger }) {
    function getCart() {
      return cartStorage.read();
    }

    function setCart(cart) {
      cartStorage.write(cart);
    }

    function add(productId, qty = 1) {
      const cart = getCart();
      const existing = cart.find((i) => String(i.productId) === String(productId));
      if (existing) existing.quantity = Number(existing.quantity || 0) + Number(qty || 0);
      else cart.push({ productId, quantity: Number(qty || 1) });

      setCart(cart);
      logger.info("Cart add", { productId, qty });
      return cart;
    }

    function remove(productId) {
      const cart = getCart().filter((i) => String(i.productId) !== String(productId));
      setCart(cart);
      logger.info("Cart remove", { productId });
      return cart;
    }

    function changeQty(productId, delta) {
      let cart = getCart();
      const item = cart.find((i) => String(i.productId) === String(productId));
      if (!item) return cart;

      item.quantity = Number(item.quantity || 0) + Number(delta || 0);
      if (item.quantity <= 0) cart = cart.filter((i) => String(i.productId) !== String(productId));

      setCart(cart);
      logger.info("Cart quantity change", { productId, delta });
      return cart;
    }

    function countItems() {
      return getCart().reduce((sum, i) => sum + Number(i.quantity || 0), 0);
    }

    return { getCart, add, remove, changeQty, countItems };
  }

  window.ShopUpCartServiceFactory = { createCartService };
})();
