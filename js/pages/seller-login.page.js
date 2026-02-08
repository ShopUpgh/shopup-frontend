// /js/pages/seller-login.page.js
(function () {
  "use strict";

  function initSellerLoginPage(container) {
    const logger = container.resolve("logger");
    const authService = container.resolve("authService"); // role already set to "seller" via bootstrap

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

    // Page view breadcrumb (safe)
    try {
      window.Sentry?.addBreadcrumb?.({
        category: "navigation",
        message: "Seller login page viewed",
        level: "info",
      });
    } catch (_) {}
    logger.pageView(document.title);

    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener("click", () => {
        alert("Password reset coming soon. Please contact support.");
      });
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
          window.location.href = "seller-dashboard-enhanced.html";
        }, 700);
      } catch (error) {
        console.error("Login failed:", error);
        logger.error("Seller login failed", { error: { message: error?.message, name: error?.name } });

        showError(error?.message || "Login failed. Please try again.");
        loginBtn.disabled = false;
        loading.classList.remove("show");
      }
    });
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initSellerLoginPage = initSellerLoginPage;
})();
