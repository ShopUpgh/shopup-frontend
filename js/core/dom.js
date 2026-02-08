// /js/core/dom.js
(function () {
  "use strict";

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  window.ShopUpDOM = { qs, qsa };
})();
