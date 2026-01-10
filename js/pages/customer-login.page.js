// /js/pages/customer-login.page.js
(function () {
  "use strict";

  function initCustomerLoginPage(container) {
    const logger = container.resolve("logger");
    const auth = container.resolve("authService");

    const form = document.getElementById("customerLoginForm");
    if (!form) return;

    const msg = document.getElementById("msg");
    const btn = document.getElementById("btn");

    logger.pageView(document.title);

    function show(type, text) {
      msg.className = "msg " + (type === "error" ? "err" : "ok");
      msg.textContent = text;
      msg.style.display = "block";
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.style.display = "none";
      btn.disabled = true;

      try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        await auth.login(email, password);

        show("ok", "Login successful. Redirecting…");
        setTimeout(() => (window.location.href = "/customer/customer-dashboard.html"), 800);
      } catch (err) {
        logger.error("Customer login failed", err);
        show("error", err?.message || "Login failed");
        btn.disabled = false;
      }
    });
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initCustomerLoginPage = initCustomerLoginPage;
})();
