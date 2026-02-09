<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seller Verification - ShopUp</title>

  <!-- Sentry -->
  <script src="https://js-de.sentry-cdn.com/c4c92ac8539373f9c497ba50f31a9900.min.js" crossorigin="anonymous"></script>
  <script src="/js/sentry-config.js"></script>
  <script src="/js/sentry-error-tracking.js"></script>

  <!-- Supabase -->
  <script type="module" src="/js/supabase-init.js"></script>

  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f7fa;min-height:100vh;padding:24px}
    .wrap{max-width:760px;margin:0 auto}
    .card{background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(31,45,61,.10);padding:24px}
    .top{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;margin-bottom:14px}
    h1{color:#1f2d3d}
    .sub{color:#6b7b8a;margin-top:6px}
    .pill{display:inline-block;padding:6px 10px;border-radius:999px;font-weight:900;font-size:12px}
    .pill.draft{background:#eef2ff;color:#3b5bdb}
    .pill.pending{background:#fff3cd;color:#856404}
    .pill.approved{background:#d1e7dd;color:#0f5132}
    .pill.rejected{background:#ffebee;color:#c62828}
    .actionsTop{display:flex;gap:10px;align-items:center}
    .btn{border:none;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer}
    .btn.red{background:#e74c3c;color:#fff}
    .btn.red:hover{background:#c0392b}
    .btn.primary{background:#667eea;color:#fff}
    .btn.primary:hover{background:#5568d3}
    .alert{display:none;margin:12px 0;padding:12px 14px;border-radius:12px;border:1px solid transparent}
    .alert.show{display:block}
    .alert.error{background:#ffebee;border-color:#ffcdd2;color:#c62828}
    .alert.success{background:#e8f5e9;border-color:#c8e6c9;color:#2e7d32}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    @media (max-width:720px){.grid{grid-template-columns:1fr}}
    label{display:block;font-weight:900;color:#1f2d3d;margin:12px 0 6px}
    input,select{width:100%;padding:12px 14px;border-radius:12px;border:2px solid #e7edf5;outline:none}
    input:focus,select:focus{border-color:#667eea}
    .muted{color:#6b7b8a;font-size:13px;margin-top:10px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <div>
          <h1>Seller Verification</h1>
          <div class="sub">Complete your seller profile and submit for approval.</div>
        </div>

        <div class="actionsTop">
          <span id="statusPill" class="pill draft">draft</span>
          <button class="btn red" id="logoutBtn">Logout</button>
        </div>
      </div>

      <div id="error" class="alert error"></div>
      <div id="success" class="alert success"></div>

      <div class="muted" id="who"></div>

      <form id="form">
        <label>Business Name</label>
        <input id="business_name" placeholder="Your store/business name" required />

        <label>Business Category</label>
        <select id="business_category" required>
          <option value="">Select...</option>
          <option>Electronics</option>
          <option>Fashion</option>
          <option>Beauty</option>
          <option>Home & Living</option>
          <option>Groceries</option>
          <option>Phones & Accessories</option>
          <option>Other</option>
        </select>

        <label>Store Slug</label>
        <input id="store_slug" placeholder="e.g. dennis-electronics" required />

        <div class="grid">
          <div>
            <label>First Name</label>
            <input id="first_name" placeholder="First name" />
          </div>
          <div>
            <label>Last Name</label>
            <input id="last_name" placeholder="Last name" />
          </div>
        </div>

        <div class="grid">
          <div>
            <label>Phone</label>
            <input id="phone" placeholder="e.g. 0244000000" />
          </div>
          <div>
            <label>Region</label>
            <input id="region" placeholder="e.g. Greater Accra" />
          </div>
        </div>

        <div class="grid">
          <div>
            <label>City</label>
            <input id="city" placeholder="e.g. Accra" />
          </div>
          <div>
            <label>Brand Color (optional)</label>
            <input id="brand_color" placeholder="#667eea" />
          </div>
        </div>

        <div class="grid">
          <div>
            <label>Store URL (optional)</label>
            <input id="store_url" placeholder="https://..." />
          </div>
          <div style="display:flex;align-items:end;gap:10px;">
            <button class="btn primary" id="saveBtn" type="button" style="width:100%;">Save Draft</button>
          </div>
        </div>

        <div style="margin-top:14px;">
          <button class="btn primary" id="submitBtn" type="submit" style="width:100%;">Submit for Approval</button>
          <div class="muted">
            Submitting sets your status to <strong>pending</strong>. Only admins can approve.
          </div>
        </div>
      </form>
    </div>
  </div>

  <script type="module" src="/js/pages/seller-verification.page.js"></script>
</body>
</html>
