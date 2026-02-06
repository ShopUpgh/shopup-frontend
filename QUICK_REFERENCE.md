# Session Guard Quick Reference

## 🚀 Quick Start

### Basic Usage (Backward Compatible)
```javascript
// Protect a customer page
await window.ShopUpAuth.requireCustomerSession();
```

### Role-Based Protection
```javascript
// Admin only
await ShopUpAuth.requireSession({ roles: ['admin'] });

// Multiple roles
await ShopUpAuth.requireSession({ roles: ['admin', 'vendor', 'seller'] });
```

### With Loading State
```javascript
await ShopUpAuth.requireSession({
  roles: ['customer'],
  showLoading: true,
  loadingMessage: "Loading your dashboard..."
});
```

## 📦 Installation

Add to your HTML page:
```html
<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- ShopUp Core -->
<script src="/js/supabase-config.js"></script>
<script src="/js/core/session.guard.js"></script>

<!-- Loading Styles (optional but recommended) -->
<link rel="stylesheet" href="/css/auth-loading.css">
```

## 🎯 Common Use Cases

### 1. Protect an Admin Page
```javascript
async function initAdminPage() {
  const session = await ShopUpAuth.requireAdminSession({
    showLoading: true
  });
  
  if (session) {
    console.log('Admin:', session.user.email);
    // Initialize admin dashboard
  }
}

initAdminPage();
```

### 2. Multi-Role Access
```javascript
await ShopUpAuth.requireSession({
  roles: ['admin', 'staff', 'vendor'],
  showLoading: true,
  loadingMessage: "Verifying access...",
  onSessionValid: (data) => {
    initPage(data.role);
  }
});
```

### 3. Return URL After Login
```javascript
// In your login page after successful authentication
async function handleLoginSuccess() {
  // This will redirect to the page user tried to access
  ShopUpAuth.redirectAfterLogin("/dashboard.html", "customer");
}
```

### 4. Custom Loading Element
```html
<div id="my-loader" style="display:none;">
  <img src="/images/spinner.gif" alt="Loading...">
</div>

<script>
await ShopUpAuth.requireSession({
  showLoading: true,
  loadingElementId: "my-loader"
});
</script>
```

### 5. With Callbacks
```javascript
await ShopUpAuth.requireSession({
  roles: ['customer'],
  onSessionValid: (data) => {
    console.log('Welcome back!', data.user.email);
    trackUserLogin(data.user.id);
  },
  onTokenRefresh: (session) => {
    console.log('Session refreshed');
    updateLastActiveTime();
  },
  onRefreshError: (error) => {
    console.error('Token refresh failed');
    showSessionExpiryWarning();
  }
});
```

## 🔧 Configuration

### Enable Debug Mode
```javascript
ShopUpAuth.configure({ debug: true });
```

### Custom Token Refresh Timing
```javascript
ShopUpAuth.configure({
  tokenRefresh: {
    refreshBeforeExpiryMs: 10 * 60 * 1000,  // 10 minutes
    checkIntervalMs: 60 * 1000               // 1 minute
  }
});
```

### Custom Login URLs
```javascript
ShopUpAuth.configure({
  loginUrls: {
    customer: "/auth/customer-login.html",
    admin: "/auth/admin-login.html"
  }
});
```

## 🧹 Cleanup

Always clean up before page unload:
```javascript
window.addEventListener('beforeunload', () => {
  ShopUpAuth.cleanup();
});
```

## 🔑 API Reference

### Main Functions

| Function | Description | Example |
|----------|-------------|---------|
| `requireSession(options)` | Generic session validation with RBAC | `requireSession({ roles: ['admin'] })` |
| `requireCustomerSession(options)` | Customer session validation | `requireCustomerSession()` |
| `requireAdminSession(options)` | Admin session validation | `requireAdminSession()` |
| `requireSellerSession(options)` | Seller/Vendor session validation | `requireSellerSession()` |
| `getReturnUrl()` | Extract return URL from query params | `const url = getReturnUrl()` |
| `redirectAfterLogin(defaultUrl, role)` | Redirect after successful login | `redirectAfterLogin("/home", "customer")` |
| `configure(config)` | Update configuration | `configure({ debug: true })` |
| `cleanup()` | Remove timers and listeners | `cleanup()` |

### Options Object

```javascript
{
  roles: ['admin', 'vendor'],           // Required roles
  redirectTo: '/login.html',            // Custom redirect URL
  showLoading: true,                    // Show loading overlay
  loadingMessage: 'Please wait...',     // Loading message
  loadingElementId: 'my-loader',        // Custom loader element
  enableTokenRefresh: true,             // Enable auto refresh
  onSessionValid: (data) => {},         // Success callback
  onSessionInvalid: (reason) => {},     // Failure callback
  onTokenRefresh: (session) => {},      // Token refresh callback
  onRefreshError: (error) => {}         // Refresh error callback
}
```

### Return Value

All session functions return:
```javascript
{
  client: SupabaseClient,   // Supabase client instance
  session: Session,          // Supabase session object
  user: User,                // User object
  role: string              // User role (e.g., 'admin')
}
// or null if validation fails
```

## 🛡️ Security Features

- ✅ Return URL sanitization (prevents open redirect)
- ✅ Same-origin validation
- ✅ Role validation from secure sources
- ✅ Automatic token refresh
- ✅ Error handling with Sentry integration

## 🐛 Debugging

### Enable Debug Logging
```javascript
ShopUpAuth.configure({ debug: true });
```

### Check Browser Console
Look for messages prefixed with `[ShopUpAuth]`:
- Session validation attempts
- Role checks
- Token refresh events
- Redirect decisions

### Common Issues

**Issue**: Session validation fails immediately
- ✅ Check Supabase is configured correctly
- ✅ Verify user is logged in
- ✅ Check browser console for errors

**Issue**: Wrong redirect after login
- ✅ Check return URL in query params: `?returnTo=...`
- ✅ Verify URL sanitization is working
- ✅ Enable debug mode to see redirect decisions

**Issue**: Token not refreshing
- ✅ Check `enableTokenRefresh: true` is set
- ✅ Verify Supabase autoRefreshToken is enabled
- ✅ Look for token refresh messages in console

## 📚 Examples

See `/examples/` directory for:
- `protected-admin.html` - Admin-only page
- `protected-multi-role.html` - Multi-role page
- `test-session-guard.html` - Test suite
- `README.md` - Detailed documentation

## 🔗 Links

- **Full Documentation**: `/SESSION_GUARD_IMPLEMENTATION.md`
- **Examples**: `/examples/README.md`
- **Main File**: `/js/core/session.guard.js`

## 💡 Tips

1. **Always use `showLoading: true`** for better UX
2. **Enable token refresh** on long-lived pages
3. **Call `cleanup()`** before page unload
4. **Use callbacks** for analytics and logging
5. **Enable debug mode** during development
6. **Test with different roles** to ensure proper access control

## 📝 Notes

- Requires Supabase v2
- Browser support: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Module size: ~24KB source, ~8KB minified
- No external dependencies (besides Supabase)
- Fully backward compatible with existing code

---

For more information, see the full documentation at `/SESSION_GUARD_IMPLEMENTATION.md`
