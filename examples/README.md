# Session Guard Examples

This directory contains example implementations demonstrating the enhanced `session.guard.js` authentication features.

## 📁 Files

### 1. `protected-admin.html`
Demonstrates **single-role access control** for admin-only pages.

**Features:**
- Requires `admin` role
- Shows loading state during authentication
- Displays user information
- Auto token refresh enabled
- Clean logout functionality

**Usage:**
```javascript
await window.ShopUpAuth.requireSession({
  roles: ['admin'],
  showLoading: true,
  loadingMessage: "Verifying admin access..."
});
```

### 2. `protected-multi-role.html`
Demonstrates **multi-role access control** for pages accessible by multiple user types.

**Features:**
- Allows `admin`, `vendor`, or `seller` roles
- Visual loading overlay
- Real-time token refresh notifications
- Comprehensive feature demonstration
- Code examples included on page

**Usage:**
```javascript
await window.ShopUpAuth.requireSession({
  roles: ['admin', 'vendor', 'seller'],
  showLoading: true,
  enableTokenRefresh: true,
  onTokenRefresh: (session) => {
    console.log('Token refreshed');
  }
});
```

## 🚀 How to Use

### Prerequisites
1. Supabase must be configured in `/js/supabase-config.js`
2. User must have a valid session with appropriate role
3. Include required scripts:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="/js/supabase-config.js"></script>
   <script src="/js/core/session.guard.js"></script>
   <link rel="stylesheet" href="/css/auth-loading.css">
   ```

### Testing Steps

#### Test Admin-Only Access
1. Login as an admin user at `/admin/admin-login.html`
2. Navigate to `/examples/protected-admin.html`
3. You should see the admin dashboard
4. Try accessing with a different role - you'll be redirected

#### Test Multi-Role Access
1. Login as admin, vendor, or seller
2. Navigate to `/examples/protected-multi-role.html`
3. You should see the multi-role page with your role badge
4. Try accessing as a customer - you'll be denied access

#### Test Return URL Feature
1. While logged out, try to access: `/examples/protected-admin.html`
2. You'll be redirected to login with `?returnTo=/examples/protected-admin.html`
3. After login, you'll be automatically redirected back to the protected page

#### Test Token Refresh
1. Access any protected example page
2. Open browser console (F12)
3. Look for token refresh messages (they occur automatically before expiry)
4. The page will show notifications when tokens are refreshed

## 🔧 Customization

### Custom Loading Element
Provide your own loading element instead of the default overlay:

```html
<div id="my-custom-loader" style="display: none;">
  <p>Please wait...</p>
</div>

<script>
await ShopUpAuth.requireSession({
  showLoading: true,
  loadingElementId: "my-custom-loader"
});
</script>
```

### Custom Callbacks
Handle authentication events with callbacks:

```javascript
await ShopUpAuth.requireSession({
  roles: ['admin'],
  onSessionValid: (data) => {
    console.log('Welcome', data.user.email);
    // Initialize page-specific features
  },
  onSessionInvalid: (reason) => {
    console.log('Access denied:', reason);
    // Log analytics event
  },
  onTokenRefresh: (session) => {
    console.log('Token refreshed at', new Date());
    // Update UI indicators
  }
});
```

### Disable Token Refresh
For pages that don't need long-term sessions:

```javascript
await ShopUpAuth.requireSession({
  roles: ['customer'],
  enableTokenRefresh: false
});
```

## 📚 API Reference

### `requireSession(options)`
Generic session validation with RBAC.

**Options:**
- `roles` (string[]): Required roles
- `redirectTo` (string): Custom login URL
- `showLoading` (boolean): Show loading overlay
- `loadingMessage` (string): Custom loading text
- `loadingElementId` (string): Custom loader element ID
- `enableTokenRefresh` (boolean): Enable auto token refresh
- `onSessionValid` (Function): Callback when valid
- `onSessionInvalid` (Function): Callback when invalid
- `onTokenRefresh` (Function): Callback after token refresh
- `onRefreshError` (Function): Callback on refresh error

**Returns:** `Promise<{client, session, user, role}|null>`

### Convenience Methods

#### `requireCustomerSession(options)`
Validates customer session (backward compatible).

```javascript
await ShopUpAuth.requireCustomerSession();
```

#### `requireAdminSession(options)`
Validates admin session.

```javascript
await ShopUpAuth.requireAdminSession();
```

#### `requireSellerSession(options)`
Validates seller/vendor session.

```javascript
await ShopUpAuth.requireSellerSession();
```

### Utility Methods

#### `getReturnUrl()`
Extracts return URL from query parameters.

```javascript
const returnUrl = ShopUpAuth.getReturnUrl();
// Returns: "/customer-dashboard.html" or null
```

#### `redirectAfterLogin(defaultUrl, userRole)`
Redirects to intended destination after login.

```javascript
// After successful login
ShopUpAuth.redirectAfterLogin("/dashboard.html", "customer");
```

#### `configure(config)`
Updates configuration.

```javascript
ShopUpAuth.configure({
  debug: true,  // Enable debug logging
  tokenRefresh: {
    refreshBeforeExpiryMs: 10 * 60 * 1000  // 10 minutes
  }
});
```

#### `cleanup()`
Removes timers and listeners.

```javascript
// Before page unload
window.addEventListener('beforeunload', () => {
  ShopUpAuth.cleanup();
});
```

## 🐛 Debugging

Enable debug mode to see detailed console logs:

```javascript
window.ShopUpAuth.configure({ debug: true });
```

This will log:
- Session validation attempts
- Role checks
- Token refresh events
- Redirect decisions
- Error details

## 🔒 Security Notes

1. **Return URL Sanitization**: All return URLs are sanitized to prevent open redirect vulnerabilities
2. **Same-Origin Only**: Return URLs must be same-origin (relative paths or same domain)
3. **Role Validation**: User roles are checked from secure sources (app_metadata preferred)
4. **Token Refresh**: Automatic refresh prevents session expiry during user activity
5. **Error Handling**: All errors are caught and logged (to Sentry if available)

## 📝 Notes

- Examples use inline styles for demonstration - in production, use external CSS
- Debug mode is enabled in examples - disable in production
- Token refresh runs every 30 seconds (configurable)
- Tokens refresh 5 minutes before expiry (configurable)
- Loading overlay uses z-index 9999 to appear above all content

## 🤝 Integration with Existing Pages

To add session protection to existing pages:

1. **Include Scripts**
   ```html
   <script src="/js/supabase-config.js"></script>
   <script src="/js/core/session.guard.js"></script>
   <link rel="stylesheet" href="/css/auth-loading.css">
   ```

2. **Add Session Check**
   ```javascript
   async function initPage() {
     const session = await ShopUpAuth.requireCustomerSession({
       showLoading: true
     });
     
     if (session) {
       // Page initialization code
     }
   }
   
   initPage();
   ```

3. **Handle Cleanup**
   ```javascript
   window.addEventListener('beforeunload', () => {
     ShopUpAuth.cleanup();
   });
   ```

## 🎯 Best Practices

1. **Always enable token refresh** for pages with long user sessions
2. **Use loading states** to provide user feedback during authentication
3. **Implement cleanup** before page unload to prevent memory leaks
4. **Use appropriate callbacks** for logging and analytics
5. **Test with different roles** to ensure proper access control
6. **Sanitize return URLs** (automatically done by the library)
7. **Handle errors gracefully** with user-friendly messages

## 📖 Additional Resources

- Main documentation: `/js/core/session.guard.js` (JSDoc comments)
- Supabase Auth Docs: https://supabase.com/docs/guides/auth
- Project README: `/README.md`
