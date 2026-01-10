// /js/core/dom.js
(function () {
  "use strict";

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);

    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null) continue;

      if (k === "className") node.className = String(v);
      else if (k === "text") node.textContent = String(v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, String(v));
    }

    for (const child of children || []) {
      if (child === null || child === undefined) continue;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }

    return node;
  }

  function clear(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  window.ShopUpDOM = { el, clear };
})();
