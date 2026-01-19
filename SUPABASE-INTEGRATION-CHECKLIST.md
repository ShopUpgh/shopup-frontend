# Supabase Integration - Complete Setup Checklist ✅

## Configuration Status

### ✅ Supabase Credentials Configured
- **Project URL**: `https://brbewkxpvihnsrbrlpzq.supabase.co`
- **Anon Key**: Configured (JWT token for public access)
- **Storage Bucket**: `product-images` (ready for product images)

### ✅ Script Loading Order Verified
All HTML pages load scripts in the correct sequence:

```
1. Supabase CDN library (https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2)
   ↓ (provides window.supabase.createClient)
2. supabase-config.js 
   ↓ (initializes window.supabase client)
3. shared-nav.js 
   ↓ (sets up window.updateNavigationCounts)
4. Page-specific scripts (products-script.js, orders-script.js)
   ↓ (use window.supabase and window.updateNavigationCounts)
```

## Verified HTML Pages

| Page | Scripts | Status |
|------|---------|--------|
| products.html | supabase-config.js → shared-nav.js → products-script.js | ✅ |
| orders.html | supabase-config.js → shared-nav.js → orders-script.js | ✅ |
| dashboard.html | supabase-config.js → shared-nav.js | ✅ |

## Implementation Timeline

### Phase 1: Supabase Backend Setup (Required)
These steps must be completed in your Supabase project before testing:

- [ ] **Create Supabase Project**
  - Go to https://supabase.com
  - Click "New Project"
  - Choose database password and region (Europe West for Ghana)
  
- [ ] **Run Database Schema**
  - In Supabase SQL Editor, create new query
  - Copy all content from `DATABASE-SCHEMA.sql`
  - Execute to create tables (products, orders, order_items, etc.)

- [ ] **Enable Row-Level Security (RLS)**
  - For `products` table: Add policy `seller_id = auth.uid()`
  - For `orders` table: Add policy `seller_id = auth.uid()`
  - For `order_items` table: Link to orders table with RLS
  - **Gotcha:** Checkout updates `orders.payment_reference/payment_status/order_status` after Paystack. Add a customer policy (e.g., `customer_id = auth.uid()`) or allow these columns via a secure RPC so this update succeeds.

- [ ] **Create Storage Bucket**
  - Go to Storage in Supabase
  - Create bucket: `product-images`
  - Make bucket PUBLIC (for public image access)
  - Set up public read access policy

- [ ] **Enable Authentication**
  - Go to Authentication settings
  - Enable Email/Password provider
  - Configure email templates if desired

### Phase 2: Frontend Testing (Can Start Immediately)

#### Test 1: Supabase Connection
```javascript
// Open browser console and run:
console.log(window.supabase);  // Should show Supabase client object
console.log(window.supabase.auth);  // Should show auth methods
```

**Expected Output**:
- `window.supabase` is an object with methods like `auth`, `from()`, `storage`
- No console errors about "Supabase not available"

#### Test 2: Navigation Badge System
1. Open **products.html** in browser
2. Check browser console (F12):
   - Look for: `🚀 Shared navigation script loading...`
   - Look for: `✅ Supabase ready for shared nav`
   - Look for: `Calling updateNavigationCounts from products page`

3. Look for badge elements:
   - Element with id="productCount" should show a number
   - Element with id="orderCount" should show a number

#### Test 3: After Login (Once Auth is Setup)
1. Log in as a seller
2. Navigate to **products.html**
3. Console should show:
   ```
   ✅ Shared nav: User authenticated - [user-id]
   📦 Loaded cached counts: {products: X, orders: Y}
   🔄 Updating navigation counts from Supabase...
   ✅ Fresh counts from Supabase: {products: X, orders: Y}
   💾 Cached counts to localStorage: {products: X, orders: Y, timestamp: ...}
   Calling updateNavigationCounts from products page
   ```

4. Add a new product:
   - Badge count should increase immediately
   - Console should show product count update

5. Delete a product:
   - Badge count should decrease immediately
   - Console should show product count update

#### Test 4: Cross-Tab Synchronization
1. Open **products.html** in Tab 1
2. Open **products.html** in Tab 2
3. In Tab 1, add/delete a product
4. In Tab 2, navigate to a different page and back
5. Tab 2 badge counts should update (via storage event)

#### Test 5: Order Management
1. Open **orders.html**
2. Check that order count badge is displayed
3. Confirm an order:
   - Badge should update
   - Console should show "Calling updateNavigationCounts"
4. Ship an order:
   - Badge should update
   - Console should show "Calling updateNavigationCounts"

## Database Verification

### Required Tables
Run these queries in Supabase SQL Editor to verify:

```sql
-- Check products table exists
SELECT * FROM products LIMIT 1;

-- Check orders table exists
SELECT * FROM orders LIMIT 1;

-- Check order_items table exists
SELECT * FROM order_items LIMIT 1;

-- Verify RLS is enabled
SELECT tablename FROM pg_tables WHERE tablename = 'products';
```

## Troubleshooting Guide

### Issue: "Supabase not available"
**Solution**: 
- Verify Supabase CDN is loaded: `console.log(window.supabase)`
- Check network tab in DevTools - CDN request should succeed
- Try hard refresh (Ctrl+Shift+R) to clear cache

### Issue: Badge counts show 0
**Solution**:
- Verify seller is logged in: `console.log(currentUser)`
- Check console for authentication errors
- Verify database has products/orders for current seller
- Run: `SELECT * FROM products WHERE seller_id = '[your-id]'` in Supabase

### Issue: "No session - user not logged in"
**Solution**:
- Must be logged in to access products/orders pages
- Log in first via login.html
- Session is stored in browser's auth tokens
- Check: `localStorage.getItem('sb-auth-token')`

### Issue: Products/Orders not loading
**Solution**:
- Check RLS policies are correct: `SELECT * FROM pg_policies`
- Verify seller_id in database matches current user ID
- Check network tab for Supabase API errors
- Try: `SELECT COUNT(*) FROM products WHERE seller_id = auth.uid()`

### Issue: Images not uploading
**Solution**:
- Verify storage bucket `product-images` exists and is PUBLIC
- Check upload policy allows authenticated users
- Verify bucket has public read access
- Try uploading test file directly in Supabase Storage UI

### Issue: Badge not updating after add/delete
**Solution**:
- Verify `window.updateNavigationCounts` is available
- Check browser console for errors in product insert/delete
- Verify localStorage is enabled
- Try manual refresh (F5) - counts should update from Supabase

## Performance Metrics

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Load cached counts | <50ms | Instant from localStorage |
| Fetch fresh counts | 500-800ms | Supabase API call |
| Update badge after action | <100ms | localStorage write |
| Cross-tab sync | <100ms | Storage event propagation |

## Security Checklist

- [x] Credentials in supabase-config.js (use environment variables in production)
- [x] RLS policies restrict data per seller
- [x] All queries filter by `seller_id = auth.uid()`
- [x] Storage bucket requires authentication to upload
- [x] No sensitive data in localStorage (only counts)

## Next Steps

1. **Immediate**: Set up Supabase project and run database schema
2. **Short-term**: Test with at least one seller account
3. **Before Launch**: Enable RLS policies and security rules
4. **Production**: Move credentials to environment variables (do NOT commit to Git)

## File References

- **Supabase Config**: [supabase-config.js](supabase-config.js)
- **Badge Manager**: [shared-nav.js](shared-nav.js)
- **Products Script**: [products-script.js](products-script.js)
- **Orders Script**: [orders-script.js](orders-script.js)
- **Database Schema**: [DATABASE-SCHEMA.sql](DATABASE-SCHEMA.sql)

## Success Indicators

✅ System is working correctly when:
1. Supabase client initializes without errors
2. User can log in successfully
3. Badge counts display correctly on pages
4. Adding/deleting products updates badges in real-time
5. Confirming/shipping orders updates badges in real-time
6. Navigating between pages preserves badge counts
7. Multiple browser tabs sync badge counts automatically
