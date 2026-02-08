import { requireSellerSession } from "/js/core/seller-session.guard.js";

(function () {
  "use strict";

  const statusPill = document.getElementById("statusPill");
  const whoami = document.getElementById("whoami");

  const errorAlert = document.getElementById("errorAlert");
  const successAlert = document.getElementById("successAlert");
  const infoAlert = document.getElementById("infoAlert");

  const form = document.getElementById("form");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const submitBtn = document.getElementById("submitBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  const fields = {
    business_name: document.getElementById("business_name"),
    business_category: document.getElementById("business_category"),
    store_slug: document.getElementById("store_slug"),
    phone: document.getElementById("phone"),
    first_name: document.getElementById("first_name"),
    last_name: document.getElementById("last_name"),
    region: document.getElementById("region"),
    city: document.getElementById("city"),
    brand_color: document.getElementById("brand_color"),
    store_url: document.getElementById("store_url"),
  };

  function show(el, msg) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.add("show");
  }
  function hide(el) { el?.classList.remove("show"); }

  function setStatusPill(status) {
    const s = String(status || "draft").toLowerCase();
    if (!statusPill) return;
    statusPill.textContent = s;
    statusPill.className = `pill ${s}`;
  }

  function slugify(s) {
    return String(s || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
  }

  function getStateFromUrl() {
    const p = new URLSearchParams(window.location.search);
    return p.get("state");
  }

  function readForm() {
    const obj = {};
    Object.keys(fields).forEach((k) => (obj[k] = (fields[k]?.value || "").trim()));
    return obj;
  }

  function fillForm(seller) {
    if (!seller) return;
    Object.keys(fields).forEach((k) => {
      if (!fields[k]) return;
      const v = seller[k];
      if (v !== null && v !== undefined) fields[k].value = String(v);
    });
  }

  async function logout(client) {
    try { await client.auth.signOut(); } catch (_) {}
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("role");
    try { window.Sentry?.setUser?.(null); } catch (_) {}
    window.location.href = "/seller/seller-login.html";
  }

  async function upsertSeller(client, user, status) {
    hide(errorAlert); hide(successAlert); hide(infoAlert);

    const v = readForm();

    // help user by auto-creating slug if missing
    if (!v.store_slug) v.store_slug = slugify(v.business_name);
    else v.store_slug = slugify(v.store_slug);

    // IMPORTANT: include id to avoid "null id" if DB default not set
    const payload = {
      id: crypto.randomUUID(),
      user_id: user.id,
      email: user.email,
      status,
      business_name: v.business_name,
      business_category: v.business_category,
      store_slug: v.store_slug,
      first_name: v.first_name,
      last_name: v.last_name,
      phone: v.phone,
      region: v.region,
      city: v.city,
      brand_color: v.brand_color || null,
      store_url: v.store_url || null,
      notifications_enabled: true,
      updated_at: new Date().toISOString(),
    };

    // If row exists, do update instead of insert to avoid changing id
    const { data: existing, error: exErr } = await client
      .from("sellers")
      .select("id,status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (exErr) throw exErr;

    if (existing?.id) {
      delete payload.id;
      const { error: updErr } = await client
        .from("sellers")
        .update(payload)
        .eq("user_id", user.id);

      if (updErr) throw updErr;
      return { status };
    }

    // else insert
    payload.created_at = new Date().toISOString();
    const { error: insErr } = await client.from("sellers").insert([payload]);
    if (insErr) throw insErr;

    return { status };
  }

  async function loadSeller(client, user) {
    const { data: seller, error } = await client
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return seller || null;
  }

  async function main() {
    const auth = await requireSellerSession({
      redirectTo: "/seller/seller-login.html",
      verificationUrl: "/seller/seller-verification.html",
      requireApproved: false,
    });
    if (!auth) return;

    const { client, user, seller, status } = auth;

    if (whoami) whoami.textContent = `Logged in as ${user.email || user.id}`;

    const forcedState = getStateFromUrl();
    if (forcedState && infoAlert) {
      if (forcedState === "pending") show(infoAlert, "Your application is pending review. You can still update details, but approval is required to access the dashboard.");
      else if (forcedState === "rejected") show(infoAlert, "Your application was rejected. Update your details and re-submit for approval.");
      else if (forcedState === "missing") show(infoAlert, "Please complete your seller profile to continue.");
      else if (forcedState === "draft") show(infoAlert, "Your seller profile is in draft. Submit for approval when ready.");
    }

    // load latest seller row (in case status changed)
    const freshSeller = await loadSeller(client, user);
    fillForm(freshSeller);

    const effectiveStatus = String(freshSeller?.status || status || "draft").toLowerCase();
    setStatusPill(effectiveStatus);

    // auto slug update if business name changes
    fields.business_name?.addEventListener("input", () => {
      if (!fields.store_slug?.value) fields.store_slug.value = slugify(fields.business_name.value);
    });

    if (logoutBtn) logoutBtn.addEventListener("click", () => logout(client));

    if (saveDraftBtn) {
      saveDraftBtn.addEventListener("click", async () => {
        try {
          saveDraftBtn.disabled = true;
          const res = await upsertSeller(client, user, "draft");
          setStatusPill(res.status);
          show(successAlert, "Draft saved.");
        } catch (e) {
          console.error(e);
          show(errorAlert, e?.message || String(e));
          try { window.Sentry?.captureException?.(e); } catch (_) {}
        } finally {
          saveDraftBtn.disabled = false;
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          submitBtn.disabled = true;
          const res = await upsertSeller(client, user, "pending");
          setStatusPill(res.status);
          show(successAlert, "Submitted for approval. Redirecting to seller login...");
          setTimeout(() => (window.location.href = "/seller/seller-login.html"), 900);
        } catch (e2) {
          console.error(e2);
          show(errorAlert, e2?.message || String(e2));
          try { window.Sentry?.captureException?.(e2); } catch (_) {}
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  }

  main().catch((e) => {
    console.error("Seller verification fatal:", e);
    show(errorAlert, e?.message || String(e));
    try { window.Sentry?.captureException?.(e); } catch (_) {}
  });
})();
