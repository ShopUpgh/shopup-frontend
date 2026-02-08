// /js/pages/seller-login.page.js
(function () {
  "use strict";

  async function initSellerLoginPage(container) {
    const logger = container.resolve("logger");
    const authService = container.resolve("authService");

    const loginForm = document.getElementById("loginForm");
    const loginBtn = document.getElementById("loginBtn");
    const loading = document.getElementById("loading");
    const successAlert = document.getElementById("successAlert");
    const errorAlert = document.getElementById("errorAlert");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

    function showSuccess(message) {
      successAlert.textContent = message;
      successAlert.classList.add("show");
      errorAlert.classList.remove("show");
    }

    function showError(message) {
      errorAlert.textContent = message;
      errorAlert.classList.add("show");
      successAlert.classList.remove("show");
    }

    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener("click", () => {
        alert("Password reset feature coming soon! Please contact support.");
      });
    }

    if (!loginForm) {
      console.error("[ShopUp] loginForm not found");
      return;
    }

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      loginBtn.disabled = true;
      loading.classList.add("show");

      try {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        logger.info("Seller login attempt", { email });

        await authService.login(email, password);

        showSuccess("Login successful! Redirecting to dashboard...");

        setTimeout(() => {
          window.location.href = "/seller/seller-dashboard-enhanced.html";
        }, 600);
      } catch (err) {
        console.error("Login failed:", err);
        logger.error("Seller login failed", { error: err?.message || String(err) });

        showError(err?.message || "Login failed. Please try again.");
        loginBtn.disabled = false;
        loading.classList.remove("show");
      }
    });
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initSellerLoginPage = initSellerLoginPage;
})();
