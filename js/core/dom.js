// /js/core/dom.js
(function () {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function on(el, event, handler, opts) {
    if (!el) return;
    el.addEventListener(event, handler, opts);
  }

  window.ShopUpDOM = { byId, on };
})();
