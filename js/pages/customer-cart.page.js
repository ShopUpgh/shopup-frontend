// /js/pages/customer-cart.page.js
(function () {
  "use strict";

  const { el, clear } = window.ShopUpDOM;

  function money(n) {
    return `GHS ${Number(n || 0).toFixed(2)}`;
  }

  function initCustomerCartPage(container) {
    const logger = container.resolve("logger");
    const auth = container.resolve("authService");
    const cart = container.resolve("cartService");
    const products = container.resolve("productsService");
    const config = container.resolve("config");

    logger.pageView(document.title);

    // Auth gate
    if (!auth.requireAuthOrRedirect("customer-login.html")) return;

    // Identify user
    const user = auth.getStoredUser();
    if (user?.id) logger.setUser({ id: user.id, email: user.email, role: "customer" });

    const cartItemsEl = document.getElementById("cartItems");
    const summaryEl = document.getElementById("cartSummary");

    function setSummaryVisible(visible) {
      if (!summaryEl) return;
      summaryEl.style.display = visible ? "block" : "none";
    }

    function renderEmpty(icon = "🛒", title = "Your cart is empty", body = "Add some products to get started!") {
      if (!cartItemsEl) return;
      clear(cartItemsEl);
      setSummaryVisible(false);

      cartItemsEl.appendChild(
        el("div", { className: "empty-cart" }, [
          el("div", { className: "empty-cart-icon", text: icon }),
          el("h2", { text: title }),
          el("p", { text: body }),
          el(
            "a",
            {
              href: "customer-dashboard.html",
              style:
                "display:inline-block;margin-top:20px;padding:10px 20px;background:#2d8a3e;color:white;text-decoration:none;border-radius:8px;",
            },
            ["Continue Shopping"]
          ),
        ])
      );
    }

    function getTotals(cartData, productMap) {
      const subtotal = cartData.reduce((sum, item) => {
        const p = productMap.get(String(item.productId));
        const price = Number(p?.price || 0);
        return sum + price * Number(item.quantity || 0);
      }, 0);

      const shipping = subtotal > 0 ? Number(config.cart.FLAT_SHIPPING_GHS) : 0;
      return { subtotal, shipping, total: subtotal + shipping };
    }

    function setTotalsUI(totals) {
      const subtotalEl = document.getElementById("subtotal");
      const shippingEl = document.getElementById("shipping");
      const totalEl = document.getElementById("total");
      if (subtotalEl) subtotalEl.textContent = money(totals.subtotal);
      if (shippingEl) shippingEl.textContent = money(totals.shipping);
      if (totalEl) totalEl.textContent = money(totals.total);
    }

    async function render() {
      if (!cartItemsEl) return;

      const cartData = cart.getCart();
      if (!cartData || cartData.length === 0) {
        renderEmpty();
        return;
      }

      try {
        // load only cart products
        const ids = cartData.map((i) => i.productId).filter(Boolean);
        const list = await products.getByIds(ids);
        const productMap = new Map(list.map((p) => [String(p.id), p]));

        clear(cartItemsEl);
        setSummaryVisible(true);

        cartData.forEach((item) => {
          const p = productMap.get(String(item.productId));
          if (!p) return;

          const imgSrc = p.image_url || config.ui.FALLBACK_IMAGE;

          const row = el("div", { className: "cart-item" }, [
            el("img", { className: "item-image", src: imgSrc, alt: p.name || "Product" }),
            el("div", { className: "item-details" }, [
              el("div", { className: "item-name", text: p.name || "Product" }),
              el("div", { className: "item-price", text: money(p.price) }),
              el("div", { className: "quantity-controls" }, [
                el("button", {
                  className: "qty-btn",
                  type: "button",
                  onclick: () => {
                    cart.changeQty(item.productId, -1);
                    render();
                  },
                  text: "-",
                }),
                el("span", { text: String(Number(item.quantity || 0)) }),
                el("button", {
                  className: "qty-btn",
                  type: "button",
                  onclick: () => {
                    cart.changeQty(item.productId, 1);
                    render();
                  },
                  text: "+",
                }),
              ]),
            ]),
            el("button", {
              className: "remove-btn",
              type: "button",
              onclick: () => {
                cart.remove(item.productId);
                render();
              },
              text: "🗑️ Remove",
            }),
          ]);

          cartItemsEl.appendChild(row);
        });

        setTotalsUI(getTotals(cartData, productMap));
      } catch (err) {
        logger.error("Cart render failed", err);
        renderEmpty("⚠️", "We couldn't load your cart right now", "Please refresh the page or try again in a moment.");
      }
    }

    const checkoutBtn = document.getElementById("checkoutBtn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        logger.info("Proceeding to checkout", { items: cart.countItems() });
        window.location.href = "customer-checkout.html";
      });
    }

    render();
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initCustomerCartPage = initCustomerCartPage;
})();
