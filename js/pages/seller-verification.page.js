// /js/pages/seller-verification.page.js
import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const statusPill = $("statusPill");
  const whoEmail = $("whoEmail");
  const errorAlert = $("errorAlert");
  const successAlert = $("successAlert");
  const infoAlert = $("infoAlert");

  const form = $("sellerForm");
  const saveDraftBtn = $("saveDraftBtn");
  const logoutBtn = $("logoutBtn");

  const fields = [
    "business_name",
    "business_category",
    "first_name",
    "last_name",
    "phone",
    "region",
    "city",
    "store_slug",
  ];

  function show(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
  }
  function hide(el) {
    if (!el) return;
    el.classList.remove("show");
  }

  function setPill(status) {
    const s = String(status || "draft").toLowerCase();
    statusPill.textContent = s;
    statusPill.className = "pill " + (["draft","pending","approved","rejected"].includes(s) ? s : "draft");
  }

  function readForm() {
    const out = {};
    for (const k of fields) out[k] = ($(k)?.value || "").trim();
    return out;
  }

  function fillForm(row) {
    if (!row) return;
    for (const k of fields) {
      if ($(k) && row[k] != null) $(k).value = String(row[k] ?? "");
    }
  }

  async function getSellerRow(client, userId) {
    const res = await client
      .from("sellers")
      .select("id, user_id, email, status, business_name, business_category, first_name, last_name, phone, region, city, store_slug, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (res.error) throw res.error;
    return res.data || null;
  }

  async function saveSeller(client, user, patch) {
    const existing = await getSellerRow(client, user.id);

    if (existing) {
      const res = await client
        .from("sellers")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select("*")
        .maybeSingle();
      if (res.error) throw res.error;
      return res.data;
    } else {
      const payload = {
        user_id: user.id,
        email: user.email,
        status: "draft",
        ...patch,
      };

      const res = await client
        .from("sellers")
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (res.error) throw res.error;
      return res.data;
    }
  }

  async function main() {
    const auth = await requireSellerSession({ redirectTo: "/seller/seller-login.html" });
    if (!auth) return;

    const { client, user, seller } = auth;

    whoEmail.textContent = user.email || "seller";
    setPill(seller?.status || "draft");

    // If redirected with status query
    const qs = new URLSearchParams(location.search);
    const incoming = qs.get("status");
    if (incoming && ["draft","pending","approved","rejected"].includes(incoming)) {
      setPill(incoming);
    }

    if (seller) {
      fillForm(seller);

      if (String(seller.status || "").toLowerCase() === "pending") {
        show(infoAlert, "Your application is pending review. You can still update and resubmit if needed.");
      }

      if (String(seller.status || "").toLowerCase() === "rejected") {
        show(errorAlert, "Your application was rejected. Please update your details and submit again.");
      }
    }

    // Save Draft
    saveDraftBtn.addEventListener("click", async () => {
      hide(errorAlert); hide(successAlert); hide(infoAlert);

      try {
        const payload = readForm();
        const row = await saveSeller(client, user, { ...payload, status: "draft" });

        setPill(row.status);
        show(successAlert, "Draft saved.");
      } catch (e) {
        console.error(e);
        show(errorAlert, e?.message || String(e));
        try { window.ShopUpSentry?.captureExceptionSafe?.(e); } catch (_) {}
      }
    });

    // Submit for Approval
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hide(errorAlert); hide(successAlert); hide(infoAlert);

      try {
        const payload = readForm();

        // Basic validation
        if (!payload.business_name || !payload.business_category || !payload.first_name || !payload.last_name || !payload.phone || !payload.region) {
          show(errorAlert, "Please complete all required fields.");
          return;
        }

        const row = await saveSeller(client, user, { ...payload, status: "pending" });

        setPill(row.status);
        show(successAlert, "Submitted! Your status is now pending approval.");
        show(infoAlert, "Once approved, you can access the dashboard.");
      } catch (err) {
        console.error(err);
        show(errorAlert, err?.message || String(err));
        try { window.ShopUpSentry?.captureExceptionSafe?.(err); } catch (_) {}
      }
    });

    // Logout
    logoutBtn.addEventListener("click", async () => {
      try { await client.auth.signOut(); } catch (_) {}
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("role");
      try { window.ShopUpSentry?.setUserSafe?.(null); } catch (_) {}
      window.location.href = "/seller/seller-login.html";
    });
  }

  main().catch((e) => {
    console.error("Seller verification fatal:", e);
    try { window.ShopUpSentry?.captureExceptionSafe?.(e); } catch (_) {}
  });
})();
