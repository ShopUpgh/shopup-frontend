// /js/signup-script.js
(function () {
  const form = document.getElementById("sellerSignupForm");
  if (!form) return;

  const msg = document.getElementById("msg");
  const btn = document.getElementById("btn");

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
      if (!window.supabase) throw new Error("Supabase not ready");

      const business = document.getElementById("business").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (window.logger) logger.info("Seller signup attempt", { email });

      const { data, error } = await window.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { business_name: business, role: "seller" },
        },
      });

      if (error) throw error;

      show("ok", "Account created. Check your email to confirm, then login.");
      btn.disabled = false;
    } catch (err) {
      if (window.logger) logger.error("Seller signup failed", err);
      show("error", err?.message || "Signup failed");
      btn.disabled = false;
    }
  });
})();
