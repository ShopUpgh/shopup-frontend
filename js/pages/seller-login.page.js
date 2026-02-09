<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seller Login - ShopUp</title>

  <!-- Sentry -->
  <script src="https://js-de.sentry-cdn.com/c4c92ac8539373f9c497ba50f31a9900.min.js" crossorigin="anonymous"></script>
  <script src="/js/sentry-config.js"></script>
  <script src="/js/sentry-error-tracking.js"></script>

  <!-- Supabase init -->
  <script type="module" src="/js/supabase-init.js"></script>

  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f7fa;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{width:100%;max-width:460px;background:#fff;border-radius:18px;box-shadow:0 10px 40px rgba(31,45,61,.12);padding:28px}
    h1{color:#1f2d3d;margin-bottom:6px}
    .sub{color:#6b7b8a;margin-bottom:16px}
    label{display:block;font-weight:800;color:#1f2d3d;margin:12px 0 6px}
    input{width:100%;padding:12px 14px;border-radius:12px;border:2px solid #e7edf5;outline:none}
    input:focus{border-color:#667eea}
    .btn{width:100%;border:none;border-radius:12px;padding:12px 14px;font-weight:900;cursor:pointer;margin-top:14px;background:#667eea;color:#fff}
    .btn:hover{background:#5568d3}
    .alert{display:none;margin:12px 0;padding:12px 14px;border-radius:12px;border:1px solid transparent}
    .alert.show{display:block}
    .alert.error{background:#ffebee;border-color:#ffcdd2;color:#c62828}
    .alert.success{background:#e8f5e9;border-color:#c8e6c9;color:#2e7d32}
    .hint{margin-top:14px;color:#6b7b8a;font-size:13px;text-align:center}
    a{color:#667eea;text-decoration:none;font-weight:800}
  </style>
</head>
<body>
  <div class="card">
    <h1>Seller Login</h1>
    <div class="sub">Access your ShopUp seller dashboard.</div>

    <div id="error" class="alert error"></div>
    <div id="success" class="alert success"></div>

    <form id="form">
      <label>Email</label>
      <input id="email" type="email" required placeholder="seller@example.com" />

      <label>Password</label>
      <input id="password" type="password" required placeholder="••••••••" />

      <button class="btn" id="btn" type="submit">Sign In</button>
    </form>

    <div class="hint">
      New seller? <a href="/seller/seller-verification.html">Complete verification</a>
    </div>
  </div>

  <script type="module" src="/js/pages/seller-login.page.js"></script>
</body>
</html>
