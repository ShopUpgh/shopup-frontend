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
      if (successAlert) {
        successAlert.textContent = message || "";
        successAlert.classList.add("show");
      }
      if (errorAlert) errorAlert.classList.remove("show");
    }

    function showError(message) {
      if (errorAlert) {
        errorAlert.textContent = message || "Login failed. Please try again.";
        errorAlert.classList.add("show");
      }
      if (successAlert) successAlert.classList.remove("show");
    }

    function setLoading(isLoading) {
      if (loginBtn) loginBtn.disabled = !!isLoading;
      if (loading) loading.classList.toggle("show", !!isLoading);
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
      setLoading(true);

      try {
        const email = (document.getElementById("email")?.value || "").trim();
        const password = document.getElementById("password")?.value || "";

        if (!email || !password) {
          showError("Please enter your email and password.");
          setLoading(false);
          return;
        }

        logger.info("Seller login attempt", { email });

        const result = await authService.login(email, password);

        // Optional: if you want to verify token exists in localStorage immediately
        // (keeps it simple; auth.service.js guarantees it now)
        if (!result?.token) {
          throw new Error("Login succeeded but session token missing.");
        }

        showSuccess("Login successful! Redirecting to dashboard...");

        setTimeout(() => {
          window.location.href = "/seller/seller-dashboard-enhanced.html";
        }, 600);
      } catch (err) {
        console.error("Login failed:", err);
        logger.error("Seller login failed", { error: err?.message || String(err) });

        showError(err?.message || "Login failed. Please try again.");
        setLoading(false);
      }
    });
  }

  window.ShopUpPages = window.ShopUpPages || {};
  window.ShopUpPages.initSellerLoginPage = initSellerLoginPage;
})();
