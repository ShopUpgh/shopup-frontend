# ShopUp Order System - Integration Testing Guide

**Status:** Ready for Testing
**Version:** 1.0
**Last Updated:** 2025

---

## 📋 Overview

This guide provides comprehensive testing procedures for the ShopUp Order Management System integration. The order system includes:

- ✅ **Database Schema** - 4 tables, 3 views, 3 functions, 2 triggers, RLS policies
- ✅ **Checkout Integration** - Complete order creation flow with cart-to-database integration
- ✅ **Seller Dashboard** - Real-time order management with status updates
- ✅ **Customer Orders** - Order history and tracking for customers
- ✅ **Order Confirmation** - Post-purchase confirmation page
- ✅ **Order Management Script** - 13 JavaScript functions for all order operations

---

## 🚀 Pre-Testing Checklist

Before running tests, verify:

- [ ] Supabase project created and configured
- [ ] `supabase-config.js` has correct credentials
- [ ] Database schema deployed (run `DATABASE-SCHEMA.sql` in Supabase SQL Editor)
- [ ] All order tables exist (orders, order_items, order_tracking, order_statistics)
- [ ] Authentication configured in Supabase
- [ ] Test seller account created
- [ ] Test customer account created
- [ ] All HTML files in place (checkout.html, order-confirmation.html, etc.)
- [ ] All JavaScript files included (order-management-script.js, shared-nav.js)

---

## 🧪 Test Suite 1: Database Schema Verification

**Objective:** Verify all database components are correctly deployed

### Test 1.1: Verify Tables Exist

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run the verification query:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('orders', 'order_items', 'order_tracking', 'order_statistics');
```

**Expected Result:**
```
table_name
-----------
orders
order_items
order_tracking
order_statistics
```

**Status:** ✅ PASS / ❌ FAIL

### Test 1.2: Verify Views Exist

**Steps:**
1. In Supabase SQL Editor, run:

```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('orders_with_seller', 'orders_with_item_count', 'seller_orders_summary');
```

**Expected Result:**
```
table_name
-----------------------
orders_with_seller
orders_with_item_count
seller_orders_summary
```

**Status:** ✅ PASS / ❌ FAIL

### Test 1.3: Verify Functions Exist

**Steps:**
1. In Supabase SQL Editor, run:

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('generate_order_number', 'get_order_summary', 'update_order_status');
```

**Expected Result:**
```
routine_name
----------------------
generate_order_number
get_order_summary
update_order_status
```

**Status:** ✅ PASS / ❌ FAIL

### Test 1.4: Verify RLS Policies Enabled

**Steps:**
1. In Supabase SQL Editor, run:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('orders', 'order_items', 'order_tracking')
AND schemaname = 'public';
```

**Expected Result:**
```
tablename        | rowsecurity
-----------------+------------
orders           | t (true)
order_items      | t (true)
order_tracking   | t (true)
```

**Status:** ✅ PASS / ❌ FAIL

---

## 🧪 Test Suite 2: Checkout Flow Testing

**Objective:** Verify complete order creation from cart to confirmation

### Test 2.1: Add Products to Cart

**Steps:**
1. Open `storefront-index.html`
2. Click on any product
3. Click "Add to Cart"
4. Verify cart count badge increments
5. Add 2-3 different products

**Expected Result:**
- Cart badge shows correct count
- Cart persists in localStorage
- Products display in cart.html

**Console Check:**
```javascript
// In F12 console, run:
localStorage.getItem('shopup_cart')
// Should return JSON array of products
```

**Status:** ✅ PASS / ❌ FAIL

### Test 2.2: Proceed to Checkout

**Steps:**
1. Click "Proceed to Checkout" from cart.html
2. Verify redirect to checkout.html
3. Verify order summary displays all items
4. Verify pricing calculations correct

**Expected Result:**
- checkout.html loads
- Order summary shows all items
- Subtotal, tax, shipping calculated correctly
- Total = Subtotal + Tax + Shipping

**Console Check:**
```javascript
// Verify form is ready
console.log('Form ready:', typeof window.submitOrder === 'function')
// Should return: Form ready: true
```

**Status:** ✅ PASS / ❌ FAIL

### Test 2.3: Complete Checkout Form

**Steps:**
1. Fill in all required fields:
   - Full Name: "Test Customer"
   - Email: "test@example.com"
   - Phone: "024 123 4567"
   - Address: "123 Main Street"
   - City: "Accra"
   - Region: "Greater Accra"
   - Payment Method: Select any option
2. Check "I agree to terms"
3. Click "Place Order"

**Expected Result:**
- Form validates (no errors)
- Loading indicator shows
- Order created in Supabase
- Redirects to order-confirmation.html

**Console Check:**
```javascript
// Check for order creation success
console.log('Order submitted successfully')
// Should see: "✅ Order created successfully: ORD-XXXX-XXXXX"
```

**Status:** ✅ PASS / ❌ FAIL

### Test 2.4: Order Confirmation Page

**Steps:**
1. After redirect to order-confirmation.html
2. Verify page displays:
   - Order number
   - Order date/time
   - Items list
   - Total amount
   - Estimated delivery info
3. Check "Back to Shopping" link works

**Expected Result:**
- All order details displayed correctly
- Order number matches database
- Items list matches cart
- Total matches checkout total

**Console Check:**
```javascript
// Verify session storage has order
const order = JSON.parse(sessionStorage.getItem('lastOrder'));
console.log('Confirmation Order:', order);
// Should return complete order object
```

**Status:** ✅ PASS / ❌ FAIL

---

## 🧪 Test Suite 3: Database Operations Testing

**Objective:** Verify order data correctly saved to Supabase

### Test 3.1: Verify Order Created in Database

**Steps:**
1. Go to Supabase Dashboard
2. Click Table Editor
3. Click "orders" table
4. Verify order from Test 2.3 appears

**Expected Result:**
```
Column          | Value
----------------+------------------
order_number    | ORD-2025-00001 (or similar)
customer_name   | Test Customer
customer_email  | test@example.com
customer_phone  | 024 123 4567
delivery_address| 123 Main Street
delivery_city   | Accra
order_status    | pending
total           | Correct amount
```

**Status:** ✅ PASS / ❌ FAIL

### Test 3.2: Verify Order Items Saved

**Steps:**
1. In Supabase Table Editor, click "order_items" table
2. Filter by the order_id from Test 3.1
3. Verify all cart items appear

**Expected Result:**
```
order_id        | product_name      | quantity | unit_price | line_total
----------------+-------------------+----------+------------+-----------
[UUID]          | Product 1         | 2        | 50.00      | 100.00
[UUID]          | Product 2         | 1        | 75.00      | 75.00
```

**Status:** ✅ PASS / ❌ FAIL

### Test 3.3: Verify Order Tracking Entry Created

**Steps:**
1. In Supabase Table Editor, click "order_tracking" table
2. Filter by order_id from Test 3.1
3. Verify initial "pending" entry exists

**Expected Result:**
```
order_id | status  | message              | created_at
---------+---------+----------------------+-------------------
[UUID]  | pending | Order status pending | [timestamp]
```

**Status:** ✅ PASS / ❌ FAIL

---

## 🧪 Test Suite 4: Seller Dashboard Testing

**Objective:** Verify sellers can see and manage orders

### Test 4.1: Load Seller Orders Dashboard

**Steps:**
1. Open `seller-orders-dashboard.html`
2. Verify page loads (may show demo data if not authenticated)
3. Check console for "✅ Loaded X orders" message

**Expected Result:**
- Page loads without errors
- Orders display in table
- Stats cards show order counts
- All filter controls functional

**Console Check:**
```javascript
// Verify orders loaded
console.log('Orders loaded:', allOrders.length > 0 ? '✅' : '❌')
```

**Status:** ✅ PASS / ❌ FAIL

### Test 4.2: Search and Filter Orders

**Steps:**
1. In seller dashboard, use Search box
2. Type part of order number from Test 2.3
3. Verify order appears in filtered list
4. Use Status filter to show "pending" only
5. Use Status filter to show "delivered" only

**Expected Result:**
- Search finds order by number, name, or email
- Status filter correctly filters orders
- Stats update when filters applied
- "All Orders" shows all again

**Status:** ✅ PASS / ❌ FAIL

### Test 4.3: View Order Details

**Steps:**
1. Click "View" (👁️) on any order
2. Verify popup/modal shows:
   - Order number
   - Customer name
   - Customer phone
   - All items in order
   - Order total
   - Order status

**Expected Result:**
- All details displayed correctly
- Items list shows all products
- Total matches database

**Status:** ✅ PASS / ❌ FAIL

### Test 4.4: Update Order Status

**Steps:**
1. Click "Ship" (📦) on an order
2. Verify popup shows
3. Confirm shipping
4. Verify:
   - Tracking number generated
   - Order status changes to "shipped"
   - Badge count updates if applicable
   - Order timestamp updated

**Expected Result:**
- Order status changes from "pending" to "shipped"
- Tracking number displays
- Database updated

**Database Verification:**
```sql
SELECT order_status, tracking_number, updated_at
FROM orders
WHERE order_number = 'ORD-XXXX-XXXXX';
```

Expected:
```
order_status | tracking_number | updated_at
-------------+-----------------+-------------------
shipped      | TRK123456789    | [current timestamp]
```

**Status:** ✅ PASS / ❌ FAIL

### Test 4.5: Cancel Order

**Steps:**
1. Click "Cancel" (❌) on a pending order
2. Confirm cancellation
3. Verify order status changes to "cancelled"
4. Verify order no longer counts as pending

**Expected Result:**
- Order status = "cancelled"
- Removed from "Pending" tab
- Shows in "All Orders"
- Stats updated

**Status:** ✅ PASS / ❌ FAIL

### Test 4.6: Export Orders

**Steps:**
1. Click "Export" (📊) button
2. Verify CSV file downloads
3. Open CSV file
4. Verify contains all current orders

**Expected Result:**
- CSV file downloads
- Filename format: `orders-YYYY-MM-DD.csv`
- Contains columns: Order #, Customer, Email, Phone, Items, Total, Status, Date

**Status:** ✅ PASS / ❌ FAIL

---

## 🧪 Test Suite 5: Customer Orders Page Testing

**Objective:** Verify customers can see their order history

### Test 5.1: Load Customer Orders Page

**Steps:**
1. Open `customer-orders.html`
2. Verify page loads
3. Check "My Orders" title displays
4. Verify tabs show (All, Pending, Shipped, Delivered)

**Expected Result:**
- Page loads without errors
- Order cards display
- Tabs functional
- Empty state shows if no orders

**Status:** ✅ PASS / ❌ FAIL

### Test 5.2: View Order in Customer History

**Steps:**
1. Look for order created in Test 2.3
2. Verify order displays with:
   - Order number
   - Order date
   - Total amount
   - Order status
   - Progress timeline
   - Items list

**Expected Result:**
- Order visible in "All Orders" tab
- All details displayed correctly
- Progress timeline shows correct status

**Status:** ✅ PASS / ❌ FAIL

### Test 5.3: Filter Orders by Status

**Steps:**
1. Click "Pending" tab
2. Verify only pending orders show
3. Click "Shipped" tab
4. Verify only shipped orders show
5. Click "Delivered" tab
6. Verify only delivered orders show
7. Click "All Orders" tab
8. Verify all orders show

**Expected Result:**
- Tabs correctly filter orders
- Order count reflects status
- Correct status badge shown
- Timeline updates per status

**Status:** ✅ PASS / ❌ FAIL

### Test 5.4: View Tracking Information

**Steps:**
1. Find an order with shipped status
2. Look for "📍 Tracking:" field
3. Verify tracking number displays if available

**Expected Result:**
- Tracking number shows for shipped orders
- Format: TRK + 9 digits
- Empty for pending orders

**Status:** ✅ PASS / ❌ FAIL

### Test 5.5: Contact Support

**Steps:**
1. Click "💬 Help" button on any order
2. Verify support contact info displays
3. Check email and phone number provided

**Expected Result:**
- Popup shows with support details
- Email: support@shopup.gh
- Phone: +233 XXX XXXX
- Hours: 9 AM - 6 PM Ghana Time

**Status:** ✅ PASS / ❌ FAIL

---

## 🧪 Test Suite 6: Real-Time Synchronization

**Objective:** Verify order changes sync across pages and tabs

### Test 6.1: Multi-Tab Synchronization

**Steps:**
1. Open seller-orders-dashboard.html in Tab 1
2. Open same page in Tab 2
3. In Tab 1, click "Ship" on an order
4. Switch to Tab 2
5. Verify order status updated automatically

**Expected Result:**
- Tab 2 automatically refreshes
- Order status changes without manual refresh
- Badge counts match across tabs

**Status:** ✅ PASS / ❌ FAIL

### Test 6.2: Badge Count Updates

**Steps:**
1. Open dashboard.html
2. Note order count badge
3. Open checkout.html in another tab
4. Complete an order
5. Return to dashboard tab
6. Verify badge increments

**Expected Result:**
- Badge count increases
- Updates within 2 seconds
- Persists on page navigation

**Console Check:**
```javascript
// Check badge system
console.log('Badge value:', document.getElementById('orderCount').textContent)
```

**Status:** ✅ PASS / ❌ FAIL

---

## 🧪 Test Suite 7: Error Handling & Edge Cases

**Objective:** Verify system handles errors gracefully

### Test 7.1: Empty Cart Submission

**Steps:**
1. Clear cart: `localStorage.removeItem('shopup_cart')`
2. Go to checkout.html
3. Try to submit order without items

**Expected Result:**
- Error message displays
- Order not created
- Form remains on page

**Expected Error:**
```
❌ Your cart is empty. Add items before checkout.
```

**Status:** ✅ PASS / ❌ FAIL

### Test 7.2: Missing Required Fields

**Steps:**
1. Go to checkout.html
2. Fill only Name field
3. Leave other required fields empty
4. Click "Place Order"

**Expected Result:**
- Validation error displays
- Order not created
- Form indicates missing fields

**Expected Error:**
```
❌ Please fill in all required fields.
```

**Status:** ✅ PASS / ❌ FAIL

### Test 7.3: Terms Not Accepted

**Steps:**
1. Fill all checkout form fields
2. Leave "I agree to terms" unchecked
3. Click "Place Order"

**Expected Result:**
- Error message displays
- Order not created

**Expected Error:**
```
❌ Please accept the terms and conditions.
```

**Status:** ✅ PASS / ❌ FAIL

### Test 7.4: Network Error Simulation

**Steps:**
1. Go to checkout.html
2. Open DevTools (F12)
3. Go to Network tab
4. Check "Offline" to simulate no internet
5. Fill form and submit
6. Verify error handling

**Expected Result:**
- Error message displays
- Button remains enabled
- Can retry submission

**Status:** ✅ PASS / ❌ FAIL

---

## 📊 Performance Testing

### Test 8.1: Checkout Page Load Time

**Steps:**
1. Open DevTools (F12)
2. Go to Performance tab
3. Open checkout.html
4. Record performance
5. Check load time

**Expected Result:**
- Page load: < 2 seconds
- First Contentful Paint: < 1 second
- All scripts load without blocking

**Status:** ✅ PASS / ❌ FAIL

### Test 8.2: Order List Rendering

**Steps:**
1. Open seller-orders-dashboard.html
2. Verify orders render within 1 second
3. Test with 50+ orders in list
4. Check rendering performance

**Expected Result:**
- Orders render instantly
- Scrolling is smooth
- No lag when filtering

**Status:** ✅ PASS / ❌ FAIL

---

## 🔐 Security Testing

### Test 9.1: RLS Policy - Sellers Can't See Other Orders

**Steps:**
1. Authenticate as Seller A
2. Open seller-orders-dashboard.html
3. Verify only Seller A's orders visible
4. Switch to Seller B account
5. Verify Seller A's orders not visible

**Expected Result:**
- Each seller sees only their orders
- RLS enforces data isolation
- No cross-seller order visibility

**Status:** ✅ PASS / ❌ FAIL

### Test 9.2: Form Input Validation

**Steps:**
1. Go to checkout.html
2. Attempt SQL injection in Name field: `'; DROP TABLE orders; --`
3. Submit form
4. Verify:
   - Input treated as text
   - No database corruption
   - Order creates successfully with safe data

**Expected Result:**
- Input treated literally
- Database safe
- Order saved with literal text

**Status:** ✅ PASS / ❌ FAIL

---

## 📝 Test Results Summary

**Test Date:** _______________
**Tested By:** _______________
**Environment:** [ ] Dev [ ] Staging [ ] Production

| Test Suite | Passed | Failed | Notes |
|-----------|--------|--------|-------|
| 1. Database Schema | ___ / 4 | ___ | |
| 2. Checkout Flow | ___ / 4 | ___ | |
| 3. Database Operations | ___ / 3 | ___ | |
| 4. Seller Dashboard | ___ / 6 | ___ | |
| 5. Customer Orders | ___ / 5 | ___ | |
| 6. Real-Time Sync | ___ / 2 | ___ | |
| 7. Error Handling | ___ / 4 | ___ | |
| 8. Performance | ___ / 2 | ___ | |
| 9. Security | ___ / 2 | ___ | |
| **TOTAL** | **___ / 32** | **___** | |

---

## ✅ Sign-Off

**All tests passed:** [ ] Yes [ ] No

**Issues found:** _______________________________________________

**Recommendations:** _______________________________________________

**Approved for production:** [ ] Yes [ ] No

**Approver Name:** _______________
**Date:** _______________

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Order not appearing in database"**
- Check Supabase connection
- Verify seller_id is correct UUID format
- Check RLS policies allow insert
- Verify tables exist in Supabase

**Issue: "Supabase not initialized"**
- Check supabase-config.js credentials
- Verify `window.supabase` is available
- Check browser console for errors
- Refresh page to reload scripts

**Issue: "Orders show but can't update"**
- Check authentication status
- Verify updateOrderStatus function exists
- Check RLS policy allows UPDATE
- Verify order belongs to authenticated user

**Issue: "Badge counts wrong"**
- Clear localStorage: `localStorage.clear()`
- Refresh page
- Check `shopup_nav_counts` in console
- Verify shared-nav.js loaded

### Debug Commands

Run in browser console (F12):

```javascript
// Check Supabase connection
console.log('Supabase:', typeof window.supabase)

// Check authentication
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.email)

// Check order count
const { data: orders } = await supabase.from('orders').select('id');
console.log('Total orders:', orders?.length)

// Check RLS active
const { data: testOrders } = await supabase
  .from('orders')
  .select('seller_id')
  .limit(1);
console.log('Can query orders:', testOrders ? '✅' : '❌')
```

---

## 📚 Related Documents

- [ORDER-SYSTEM-INTEGRATION-CHECKLIST.md](ORDER-SYSTEM-INTEGRATION-CHECKLIST.md)
- [DATABASE-SCHEMA.sql](DATABASE-SCHEMA.sql)
- [order-management-script.js](order-management-script.js)
- [DATABASE-IMPLEMENTATION-GUIDE.md](DATABASE-IMPLEMENTATION-GUIDE.md)

---

**Version:** 1.0
**Status:** Ready for Testing
**Last Updated:** 2025
