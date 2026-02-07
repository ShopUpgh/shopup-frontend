// /js/core/config.js
(function () {
  "use strict";

  async function init() {
    if (window.ShopUpConfig) return window.ShopUpConfig;

    const storage = Object.freeze({
      AUTH_TOKEN_KEY: "authToken",
      CURRENT_USER_KEY: "currentUser",
      SESSION_EXPIRY_KEY: "sessionExpiry",
      ROLE_KEY: "role",
      CART_KEY: "cart",
    });

    window.ShopUpConfig = Object.freeze({
      SUPABASE_URL: "https://brbewkxpvihnsrbrlpzq.supabase.co",
      SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4",
      APP_NAME: "ShopUp",
      CURRENCY: "GHS",
      storage,
    });

    return window.ShopUpConfig;
  }

  window.ShopUpConfigReady = init();
})();
