# 🏗️ Enterprise Architecture Implementation Guide

## Overview

ShopUp Ghana now uses an enterprise-grade architecture with:
- ✅ **Centralized Configuration** - Single source of truth for settings
- ✅ **Dependency Injection** - Loose coupling, testable code
- ✅ **Service Layer** - Reusable, maintainable services
- ✅ **Controller Pattern** - Separation of concerns
- ✅ **100% Testable** - Mock any dependency

## Directory Structure

```
shopup-frontend/
├── core/                          # Core system (load first)
│   ├── config-manager.js          # Configuration management
│   ├── di-container.js            # Dependency injection container
│   ├── app-bootstrap.js           # Application initialization
│   └── services/                  # Core services
│       ├── storage-service.js     # LocalStorage abstraction
│       ├── logger-service.js      # Logging with Sentry integration
│       └── auth-service.js        # Authentication (Supabase wrapper)
│
├── controllers/                   # Page controllers
│   ├── signup-controller.js       # Signup form logic
│   └── login-controller.js        # Login form logic
│
└── tests/                         # Testing utilities
    └── test-helpers.js            # Mock services and test runners
```

## How to Use in HTML Pages

### Basic Template (All Pages)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Page Title</title>
    
    <!-- 1. External Dependencies (if needed) -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- 2. CORE SYSTEM (Required Order) -->
    <script src="/core/config-manager.js"></script>
    <script src="/core/di-container.js"></script>
    
    <!-- 3. SERVICES (Required Order) -->
    <script src="/core/services/storage-service.js"></script>
    <script src="/core/services/logger-service.js"></script>
    <script src="/core/services/auth-service.js"></script>
    
    <!-- 4. BOOTSTRAP (Wires Everything Together) -->
    <script src="/core/app-bootstrap.js"></script>
    
    <!-- 5. PAGE CONTROLLER (if needed) -->
    <script src="/controllers/your-controller.js"></script>
</head>
<body>
    <!-- Your page content -->
</body>
</html>
```

### Example: signup.html

```html
<head>
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- Core System -->
    <script src="/core/config-manager.js"></script>
    <script src="/core/di-container.js"></script>
    <script src="/core/services/storage-service.js"></script>
    <script src="/core/services/logger-service.js"></script>
    <script src="/core/services/auth-service.js"></script>
    <script src="/core/app-bootstrap.js"></script>
    
    <!-- Page Controller -->
    <script src="/controllers/signup-controller.js"></script>
</head>
```

### Example: login.html

```html
<head>
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- Core System -->
    <script src="/core/config-manager.js"></script>
    <script src="/core/di-container.js"></script>
    <script src="/core/services/storage-service.js"></script>
    <script src="/core/services/logger-service.js"></script>
    <script src="/core/services/auth-service.js"></script>
    <script src="/core/app-bootstrap.js"></script>
    
    <!-- Page Controller -->
    <script src="/controllers/login-controller.js"></script>
</head>
```

## Using Services in Your Code

### Access Services via Global `app` Object

```javascript
// Wait for app to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Access services
    const auth = window.app.auth;
    const logger = window.app.logger;
    const storage = window.app.storage;
    const config = window.app.config;
    
    // Use them
    logger.info('Page loaded');
    
    if (auth.isAuthenticated()) {
        const user = auth.getCurrentUser();
        logger.info('User is logged in', { userId: user.id });
    }
});
```

### Configuration

```javascript
// Get configuration values
const vatRate = window.app.config.get('VAT_RATE'); // 0.175
const currency = window.app.config.get('CURRENCY'); // 'GHS'

// Set configuration (persists to localStorage)
window.app.config.set('LOG_LEVEL', 'debug');

// Check features
if (window.app.config.isFeatureEnabled('WHATSAPP')) {
    // WhatsApp is enabled
}
```

### Storage

```javascript
const storage = window.app.storage;

// Save data
storage.set('cart', cartItems);
storage.set('user_preferences', { theme: 'dark' });

// Get data
const cart = storage.get('cart', []);
const prefs = storage.get('user_preferences');

// Remove data
storage.remove('cart');

// Check if exists
if (storage.has('user_session')) {
    // Session exists
}
```

### Logging

```javascript
const logger = window.app.logger;

// Different log levels
logger.debug('Debug info', { data: 'value' });
logger.info('Information', { userId: 123 });
logger.warn('Warning message', { issue: 'something' });
logger.error('Error occurred', errorObject, { context: 'data' });

// Track events
logger.track('button_clicked', { button: 'signup' });
logger.pageView('Product Page');
```

### Authentication

```javascript
const auth = window.app.auth;

// Sign up
const result = await auth.signUp('email@example.com', 'password123', {
    business_name: 'My Shop',
    first_name: 'John',
    last_name: 'Doe'
});

if (result.success) {
    console.log('User created:', result.user);
}

// Sign in
const loginResult = await auth.signIn('email@example.com', 'password123');

// Check authentication
if (auth.isAuthenticated()) {
    const user = auth.getCurrentUser();
}

// Sign out
await auth.signOut();
```

## Testing

### Run Tests in Browser Console

```javascript
// Load test helpers first (add to your HTML)
<script src="/tests/test-helpers.js"></script>

// Then in console:
TestHelpers.runAllTests();
```

### Create Custom Tests

```javascript
// Use mock services
const mockAuth = TestHelpers.createMockAuth();
const mockLogger = TestHelpers.createMockLogger();
const mockStorage = TestHelpers.createMockStorage();

// Test your code with mocks
async function testMyFeature() {
    const result = await mockAuth.signUp('test@test.com', 'pass');
    console.log(result.success ? 'PASSED' : 'FAILED');
}
```

## Benefits

### 1. No More Global Dependencies

**Before:**
```javascript
// Direct Supabase usage everywhere
const { data } = await supabase.auth.signUp(...);
```

**After:**
```javascript
// Use service abstraction
const result = await window.app.auth.signUp(...);
```

**Why Better:** Can swap Supabase for any other auth provider without changing code.

### 2. Testable Code

**Before:**
```javascript
// Cannot test without real Supabase
❌ Must test in browser manually
```

**After:**
```javascript
// Use mocks
const mockAuth = TestHelpers.createMockAuth();
const controller = new SignupController(mockAuth, ...);
✅ Runs instantly, no network
```

### 3. Centralized Configuration

**Before:**
```javascript
// Hardcoded values everywhere
const key = 'pk_live_123...';
const vat = 0.175;
```

**After:**
```javascript
// Single source of truth
const key = config.get('PAYSTACK_PUBLIC_KEY');
const vat = config.get('VAT_RATE');
```

### 4. Better Error Handling

**Before:**
```javascript
// Errors disappear
try { ... } catch (e) { console.log(e); }
```

**After:**
```javascript
// Auto-logged to Sentry in production
logger.error('Failed', error, { context });
```

## Migration Guide

### Existing Code Compatibility

**Good News:** Old code still works! No breaking changes.

### Gradual Migration

1. **Week 1:** Add new architecture files
2. **Week 2:** Update one page (e.g., signup.html)
3. **Week 3:** Update another page (e.g., login.html)
4. **Week 4:** Update remaining pages

### Example Migration: signup.html

**Step 1:** Add core scripts to `<head>`:

```html
<head>
    <!-- Add these BEFORE existing scripts -->
    <script src="/core/config-manager.js"></script>
    <script src="/core/di-container.js"></script>
    <script src="/core/services/storage-service.js"></script>
    <script src="/core/services/logger-service.js"></script>
    <script src="/core/services/auth-service.js"></script>
    <script src="/core/app-bootstrap.js"></script>
    
    <!-- Then your controller -->
    <script src="/controllers/signup-controller.js"></script>
</head>
```

**Step 2:** Remove old inline scripts (if any)

**Step 3:** Test in browser - should work immediately

## Configuration Options

### Environment Variables (via localStorage)

```javascript
// Set in browser console or admin panel
localStorage.setItem('SUPABASE_URL', 'https://your-project.supabase.co');
localStorage.setItem('SUPABASE_ANON_KEY', 'your-key');
localStorage.setItem('PAYSTACK_PUBLIC_KEY', 'your-key');
localStorage.setItem('LOG_LEVEL', 'debug'); // debug, info, warn, error
```

### Feature Flags

```javascript
// Check if feature is enabled
if (config.isFeatureEnabled('WHATSAPP')) {
    // Show WhatsApp button
}

// Enable/disable features
config.set('ENABLE_REFUNDS', true);
config.set('ENABLE_WHATSAPP', false);
```

## Debugging

### Check Initialization

```javascript
// In browser console
console.log(window.app); // Should show: { config, storage, logger, auth, ... }
console.log(window.container.getServiceNames()); // List all services
```

### Check Configuration

```javascript
console.log(window.app.config.getAll());
```

### Test a Service

```javascript
// Test logger
window.app.logger.info('Test message', { data: 'value' });

// Test storage
window.app.storage.set('test', 'value');
console.log(window.app.storage.get('test')); // 'value'

// Test auth
console.log(window.app.auth.isAuthenticated());
```

## Troubleshooting

### Services Not Available

**Problem:** `window.app` is undefined

**Solution:** Wait for bootstrap to complete

```javascript
// Option 1: Use DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // window.app is ready here
});

// Option 2: Add slight delay
setTimeout(() => {
    // window.app is ready here
}, 500);
```

### Script Load Order

**Problem:** "Service not registered" error

**Solution:** Ensure correct load order:
1. config-manager.js
2. di-container.js
3. services/*.js
4. app-bootstrap.js
5. controllers/*.js

## Advanced Usage

### Creating Custom Services

```javascript
// 1. Create service class
class PaymentService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    
    async processPayment(amount) {
        this.logger.info('Processing payment', { amount });
        // Implementation
    }
}

// 2. Create factory function
function createPaymentService(container) {
    return new PaymentService(
        container.get('config'),
        container.get('logger')
    );
}

// 3. Register service
window.container.register('payment', createPaymentService);

// 4. Use anywhere
const payment = window.app.getService('payment');
await payment.processPayment(100);
```

### Custom Controllers

```javascript
class MyPageController {
    constructor(auth, logger, storage) {
        this.auth = auth;
        this.logger = logger;
        this.storage = storage;
        
        this.init();
    }
    
    init() {
        this.logger.pageView('My Page');
        // Your initialization logic
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new MyPageController(
        window.app.auth,
        window.app.logger,
        window.app.storage
    );
});
```

## Summary

This enterprise architecture provides:
- ✅ **No breaking changes** - Works alongside existing code
- ✅ **Zero cost increase** - Just better organization
- ✅ **100% testable** - Mock any service
- ✅ **Easy to extend** - Add new services anytime
- ✅ **Production ready** - Used by major applications
- ✅ **Future proof** - Swap implementations without rewrites

**Recommendation:** Start using this architecture for all new pages, migrate existing pages gradually.
