// /js/pages/seller-verification.page.js
(function () {
  "use strict";

  function qs(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function setPill(status) {
    const pill = document.getElementById("statusPill");
    if (!pill) return;

    const s = String(status || "draft").toLowerCase();
    pill.textContent = s;

    pill.className = "pill " + (
      s === "approved" ? "approved" :
      s === "pending" ? "pending" :
      s === "rejected" ? "rejected" :
      (s === "suspended" || s === "disabled") ? "blocked" :
      "draft"
    );
  }

  function showAlert(type, msg) {
    const ok = document.getElementById("okAlert");
    const err = document.getElementById("errAlert");
    if (ok) ok.classList.remove("show");
    if (err) err.classList.remove("show");

    const el = type === "ok" ? ok : err;
    if (!el) return;

    el.textContent = msg;
    el.classList.add("show");
  }

  function slugify(input) {
    return String(input || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function main() {
    const client = await window.supabaseReady;

    // Must be logged in
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.user) {
      window.location.href = "/seller/seller-login.html";
      return;
    }

    const user = data.session.user;

    // Optional message states
    const state = qs("state");
    const stateMessage = document.getElementById("stateMessage");
    if (stateMessage) {
      if (state === "rejected") {
        stateMessage.innerHTML = `<span style="color:#9f1239;font-weight:900;">Your verification was rejected.</span> Please correct and resubmit.`;
      } else if (state === "blocked") {
        stateMessage.innerHTML = `<span style="color:#991b1b;font-weight:900;">Your seller account is blocked.</span> Please contact support.`;
      } else {
        stateMessage.innerHTML = `Logged in as <b>${user.email}</b>`;
      }
    }

    // Elements
    const form = document.getElementById("sellerForm");
    const saveBtn = document.getElementById("saveBtn");
    const submitBtn = document.getElementById("submitBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const fields = {
      business_name: document.getElementById("business_name"),
      business_category: document.getElementById("business_category"),
      first_name: document.getElementById("first_name"),
      last_name: document.getElementById("last_name"),
      phone: document.getElementById("phone"),
      city: document.getElementById("city"),
      region: document.getElementById("region"),
      store_slug: document.getElementById("store_slug"),
      store_url: document.getElementById("store_url"),
    };

    // Load existing seller row
    const { data: sellerRow } = await client
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sellerRow) {
      setPill(sellerRow.status);

      // Fill form
      for (const k of Object.keys(fields)) {
        if (!fields[k]) continue;
        fields[k].value = sellerRow[k] ?? "";
      }
    } else {
      setPill("draft");
      // Pre-fill name/email if you want
    }

    async function upsertSeller({ statusOverride } = {}) {
      const payload = {
        user_id: user.id,
        email: user.email,
        business_name: fields.business_name.value.trim(),
        business_category: fields.business_category.value,
        first_name: fields.first_name.value.trim(),
        last_name: fields.last_name.value.trim(),
        phone: fields.phone.value.trim(),
        city: fields.city.value.trim(),
        region: fields.region.value.trim(),
        store_slug: slugify(fields.store_slug.value || fields.business_name.value),
        store_url: fields.store_url.value.trim(),
        status: statusOverride || (sellerRow?.status || "draft"),
        updated_at: new Date().toISOString(),
      };

      // If your DB has NOT NULL created_at trigger, it’s fine.
      // If not, include created_at for new rows:
      if (!sellerRow) payload.created_at = new Date().toISOString();

      const { data, error } = await client
        .from("sellers")
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      saveBtn.disabled = true;

      try {
        const row = await upsertSeller({ statusOverride: sellerRow?.status || "draft" });
        showAlert("ok", "Profile saved.");
        setPill(row.status);
      } catch (err) {
        showAlert("err", err?.message || "Save failed.");
        try { if (window.Sentry) window.Sentry.captureException(err); } catch (_) {}
      } finally {
        saveBtn.disabled = false;
      }
    });

    submitBtn.addEventListener("click", async () => {
      submitBtn.disabled = true;
      try {
        const row = await upsertSeller({ statusOverride: "pending" });
        showAlert("ok", "Submitted! Your status is now pending. Please wait for approval.");
        setPill(row.status);
      } catch (err) {
        showAlert("err", err?.message || "Submit failed.");
        try { if (window.Sentry) window.Sentry.captureException(err); } catch (_) {}
      } finally {
        submitBtn.disabled = false;
      }
    });

    logoutBtn.addEventListener("click", async () => {
      try { await client.auth.signOut(); } catch (_) {}
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("role");
      window.location.href = "/seller/seller-login.html";
    });
  }

  main();
})();
