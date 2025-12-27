// /js/login-script.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const submitBtn =
    document.querySelector('button[type="submit"]') ||
    document.querySelector(".btn-submit");

  if (!form || !emailEl || !passwordEl) {
    window.logger?.error("Login form elements missing");
    return;
  }

  // Supabase should be created by /js/supabase-init.js (module)
  if (!window.supabase) {
    window.logger?.error("Supabase not initialized on login page");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl.value || "").trim();
    const password = passwordEl.value || "";

    if (!email || !password) {
      showToast("❌ Enter email and password");
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";
    }

    try {
      const { data, error } = await window.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        window.logger?.warn("Login failed", { message: error.message });
        showToast("❌ " + error.message);
        return;
      }

      // If email not verified yet (depends on your Supabase settings)
      const user = data?.user;
      if (user && user.email_confirmed_at === null) {
        showToast("📩 Please verify your email before logging in.");
        window.logger?.info("Login blocked: email not verified", { email });
        // Optionally sign out
        await window.supabase.auth.signOut();
        return;
      }

      showToast("✅ Login successful!");

      window.logger?.info("Seller login success", {
        userId: user?.id,
        email: user?.email,
      });

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } catch (err) {
      window.logger?.error("Login exception", err);
      showToast("❌ Something went wrong. Please try again.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
});

// Toast helper (matches your signup toast pattern)
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  if (!toast || !toastMessage) {
    alert(message);
    return;
  }
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}
