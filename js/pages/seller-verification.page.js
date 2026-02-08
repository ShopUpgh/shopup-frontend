// /js/pages/seller-verification.page.js
import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  function qsGet(name) {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get(name);
    } catch {
      return null;
    }
  }

  function setElText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "—";
  }

  function show(elId, yes) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.style.display = yes ? "" : "none";
  }

  function setAlert(type, msg) {
    const alert = document.getElementById("statusAlert");
    if (!alert) return;

    alert.classList.remove("info", "ok", "err", "warn", "show");
    alert.classList.add(type);
    alert.textContent = msg;
    alert.classList.add("show");
  }

  async function main() {
    // Must be logged in to verify
    const auth = await requireSellerSession({ redirectTo: "/seller/seller-login.html" });
    if (!auth) return;

    const { client, user } = auth;

    // DI container services
    const c = window.ShopUpContainer;
    const logger = c?.resolve ? c.resolve("logger") : console;

    const sellerService =
      window.ShopUpSellerServiceFactory.createSellerService({
        supabaseWait: window.ShopUpSupabaseWait,
        logger,
      });

    // DOM
    const formCard = document.getElementById("formCard");
    const pendingCard = document.getElementById("pendingCard");
    const rejectedCard = document.getElementById("rejectedCard");
    const suspendedCard = document.getElementById("suspendedCard");

    const verifyForm = document.getElementById("verifyForm");
    const submitBtn = document.getElementById("submitBtn");
    const loading = document.getElementById("loading");

    const backBtn = document.getElementById("backBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const resubmitBtn = document.getElementById("resubmitBtn");

    const logoutBtn = document.getElementById("logoutBtn");
    const logoutBtn2 = document.getElementById("logoutBtn2");
    const logoutBtn3 = document.getElementById("logoutBtn3");

    function setLoading(on) {
      if (submitBtn) submitBtn.disabled = !!on;
      if (loading) loading.classList.toggle("show", !!on);
    }

    async function logoutAndGo() {
      try { await client.auth.signOut(); } catch (_) {}
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("role");
      try { if (window.Sentry && typeof window.Sentry.setUser === "function") window.Sentry.setUser(null); } catch (_) {}
      window.location.href = "/seller/seller-login.html";
    }

    async function loadAndRender() {
      const seller = await sellerService.getSellerByUserId(user.id);

      if (!seller) {
        setAlert("err", "No seller profile found. Please register as a seller.");
        window.location.href = "/seller/seller-register.html";
        return;
      }

      const status = String(seller.status || "draft").toLowerCase();

      setElText("statusText", status);
      setElText("sellerEmail", seller.email || user.email || "—");
      setElText("sellerBiz", seller.business_name || "—");

      // Handle hard states
      if (status === "disabled") {
        setAlert("err", "Your seller account is disabled. Please contact support.");
        await logoutAndGo();
        return;
      }

      if (status === "approved") {
        setAlert("ok", "Approved ✅ Redirecting you to your dashboard...");
        localStorage.setItem("role", "seller");
        window.location.href = "/seller/seller-dashboard-enhanced.html";
        return;
      }

      // Show correct card
      show("formCard", status === "draft");
      show("pendingCard", status === "pending");
      show("rejectedCard", status === "rejected");
      show("suspendedCard", status === "suspended");

      if (status === "draft") {
        setAlert("info", "Complete verification to submit your account for review.");
        // Prefill
        const bn = document.getElementById("businessName");
        const bc = document.getElementById("businessCategory");
        const phone = document.getElementById("phone");
        const city = document.getElementById("city");
        const region = document.getElementById("region");
        const slug = document.getElementById("storeSlug");

        if (bn && seller.business_name) bn.value = seller.business_name;
        if (bc && seller.business_category) bc.value = seller.business_category;
        if (phone && seller.phone) phone.value = seller.phone;
        if (city && seller.city) city.value = seller.city;
        if (region && seller.region) region.value = seller.region;
        if (slug && seller.store_slug) slug.value = seller.store_slug;
      }

      if (status === "pending") {
        setAlert("warn", "Your verification is pending review. Please check back later.");
      }

      if (status === "rejected") {
        setAlert("err", "Your verification was rejected. Please correct details and resubmit.");
      }

      if (status === "suspended") {
        setAlert("warn", "Your account is suspended. Please contact support.");
      }
    }

    // Buttons
    if (backBtn) backBtn.addEventListener("click", () => (window.location.href = "/seller/seller-login.html"));
    if (refreshBtn) refreshBtn.addEventListener("click", () => loadAndRender().catch((e) => logger.error("Refresh failed", { e: e?.message })));
    if (resubmitBtn) {
      resubmitBtn.addEventListener("click", async () => {
        // Move back to draft so they can edit + submit again
        try {
          await sellerService.updateSeller(user.id, { status: "draft" });
          await loadAndRender();
        } catch (e) {
          logger.error("Resubmit transition failed", { e: e?.message || String(e) });
          setAlert("err", "Could not start resubmission. Please try again.");
        }
      });
    }

    [logoutBtn, logoutBtn2, logoutBtn3].forEach((b) => {
      if (!b) return;
      b.addEventListener("click", () => logoutAndGo());
    });

    // Form submit
    if (verifyForm) {
      verifyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
          const business_name = (document.getElementById("businessName")?.value || "").trim();
          const business_category = (document.getElementById("businessCategory")?.value || "").trim();
          const phone = (document.getElementById("phone")?.value || "").trim();
          const city = (document.getElementById("city")?.value || "").trim();
          const region = (document.getElementById("region")?.value || "").trim();
          const store_slug = (document.getElementById("storeSlug")?.value || "").trim();

          if (!business_name) throw new Error("Business name is required.");
          if (!business_category) throw new Error("Business category is required.");

          await sellerService.submitVerification(user.id, {
            business_name,
            business_category,
            phone,
            city,
            region,
            store_slug,
          });

          setAlert("warn", "Submitted ✅ Your status is now pending review.");
          await loadAndRender();
        } catch (err) {
          const msg = err?.message || "Submission failed. Please try again.";
          logger.error("Verification submit failed", { error: msg });
          setAlert("err", msg);
        } finally {
          setLoading(false);
        }
      });
    }

    // optional: allow ?state=pending etc. to show message (not required)
    const urlState = String(qsGet("state") || "").toLowerCase();
    if (urlState) {
      // We'll still rely on DB status; this is only a hint message
      // no action needed
    }

    await loadAndRender();
  }

  // Boot DI if needed (seller-verification page might not have seller-login bootstrap)
  (function ensureDI() {
    const c = window.ShopUpContainer;
    if (!c) return;

    if (!c.__shopup_bootstrapped_verification) {
      c.__shopup_bootstrapped_verification = true;

      c.register("configReady", () => window.ShopUpConfigReady);
      c.register("config", () => window.ShopUpConfig);

      c.register("supabaseWait", () => window.ShopUpSupabaseWait);
      c.register("logger", () => window.ShopUpLoggerFactory.createLogger());
    }
  })();

  main().catch((e) => {
    console.error("seller-verification fatal:", e);
    try { if (window.Sentry) window.Sentry.captureException(e); } catch (_) {}
  });
})();
