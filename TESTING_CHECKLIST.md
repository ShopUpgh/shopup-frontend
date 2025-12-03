# 🧪 SHOPUP TESTING CHECKLIST

## Complete Testing Guide for All Features

**Last Updated:** November 17, 2025  
**Version:** 1.0

---

## 📋 PRE-TESTING SETUP

### Database Setup
- [ ] All SQL schemas executed in Supabase
- [ ] Row Level Security (RLS) enabled
- [ ] Tables created successfully
- [ ] Indexes created
- [ ] Triggers active
- [ ] Views created

### Configuration
- [ ] `supabase-config.js` has correct URL and anon key
- [ ] Paystack public key configured
- [ ] Email functions deployed (if using)
- [ ] All files uploaded to hosting

---

## 1️⃣ CUSTOMER AUTHENTICATION TESTING

### Registration Flow
- [ ] Navigate to `customer-register.html`
- [ ] Submit empty form → validation errors shown
- [ ] Enter invalid email → error shown
- [ ] Enter weak password → error shown
- [ ] Enter mismatched passwords → error shown
- [ ] Enter valid Ghana phone (024...) → accepts
- [ ] Enter invalid phone format → error shown
- [ ] Complete registration successfully
- [ ] Check Supabase Auth → user created
- [ ] Check `customer_profiles` table → profile created
- [ ] Verify redirect to dashboard

### Login Flow
- [ ] Navigate to `customer-login.html`
- [ ] Submit empty form → validation errors
- [ ] Enter wrong email → error shown
- [ ] Enter wrong password → error shown
- [ ] Login with correct credentials → success
- [ ] Verify redirect to dashboard
- [ ] Check session persistence (refresh page)

### Dashboard
- [ ] View dashboard shows welcome message
- [ ] Quick stats display correctly
- [ ] Navigation menu visible
- [ ] Logout button works
- [ ] After logout → redirected to login

### Profile Management
- [ ] Navigate to `customer-profile.html`
- [ ] View current profile information
- [ ] Update full name → saves successfully
- [ ] Update phone number → validates format
- [ ] Update email → updates in auth
- [ ] Change password → requires current password
- [ ] Upload profile picture (if implemented)
- [ ] Check database updates

### Address Management
- [ ] Navigate to `customer-addresses.html`
- [ ] Click "Add New Address"
- [ ] Fill in all fields (street, city, region, postal)
- [ ] Validate Ghana digital address format
- [ ] Save address → appears in list
- [ ] Set as default → marked correctly
- [ ] Edit existing address → updates
- [ ] Delete address → removed from list
- [ ] Cannot delete default (should show error)

---

## 2️⃣ PAYSTACK PAYMENT TESTING

### Checkout Flow
- [ ] Navigate to `customer-checkout.html`
- [ ] Verify cart items display
- [ ] Select delivery address
- [ ] Choose payment method:
  - [ ] Card Payment
  - [ ] Mobile Money (MTN/Vodafone/AirtelTigo)
  - [ ] Bank Transfer
  - [ ] Cash on Delivery
- [ ] Click "Complete Payment"

### Card Payment Test
- [ ] Paystack popup opens
- [ ] Use test card: `5061 2808 1234 5678 014`
- [ ] CVV: `123`, Expiry: Any future date
- [ ] OTP: `123456`
- [ ] Payment processes successfully
- [ ] Redirected to order confirmation
- [ ] Check `payment_transactions` table
- [ ] Check `orders` table → payment_status = 'paid'

### Mobile Money Test
- [ ] Select MTN Mobile Money
- [ ] Paystack popup shows mobile money option
- [ ] Use test number: `0241234567`
- [ ] Complete test payment
- [ ] Verify transaction recorded
- [ ] Order status updated

### Cash on Delivery
- [ ] Select Cash on Delivery
- [ ] No payment popup should appear
- [ ] Order created immediately
- [ ] Payment status = 'pending'
- [ ] Order status = 'pending'

### Order Confirmation
- [ ] Order number displays
- [ ] Order details correct
- [ ] Items list accurate
- [ ] Total amount matches
- [ ] Delivery address shown
- [ ] "Track Order" button works

---

## 3️⃣ CUSTOMER ORDER MANAGEMENT TESTING

### Order History
- [ ] Navigate to `customer-orders.html`
- [ ] All orders display
- [ ] Order numbers visible
- [ ] Order status badges correct
- [ ] Dates formatted properly

### Filtering & Search
- [ ] Filter by status (pending/confirmed/shipped/delivered)
- [ ] Search by order number → finds order
- [ ] Search by product name → finds orders
- [ ] Date range filter (7/30/90 days)
- [ ] Results update correctly

### Order Details
- [ ] Click "View Details" on any order
- [ ] Navigate to `customer-order-details.html`
- [ ] Order number displays
- [ ] Items table shows all products
- [ ] Subtotal, tax, delivery fee correct
- [ ] Total matches
- [ ] Delivery address shown
- [ ] Payment method displayed

### Order Tracking
- [ ] Tracking timeline displays
- [ ] Completed steps highlighted
- [ ] Pending steps grayed out
- [ ] Status updates in real-time

### Order Actions
- [ ] Cancel pending order → status = 'cancelled'
- [ ] Cannot cancel shipped order
- [ ] Reorder delivered order → items added to cart
- [ ] Print receipt button works

---

## 4️⃣ SELLER DASHBOARD TESTING

### Seller Login
- [ ] Navigate to `login.html` (seller)
- [ ] Login with seller credentials
- [ ] Redirected to seller dashboard

### Dashboard Overview
- [ ] View `seller-dashboard-enhanced.html`
- [ ] Today's revenue displays
- [ ] Pending orders count correct
- [ ] Total products count correct
- [ ] Monthly revenue correct
- [ ] Recent orders list shows

### Product Management
- [ ] Navigate to `products.html`
- [ ] View all seller products
- [ ] Click "Add Product"
- [ ] Fill in product details:
  - [ ] Name, description, category
  - [ ] Price, compare-at price
  - [ ] Stock quantity
  - [ ] SKU
  - [ ] Upload image
- [ ] Save product → appears in list
- [ ] Edit product → updates correctly
- [ ] Delete product → removed
- [ ] Check `products` table

### Order Management
- [ ] Navigate to `orders.html`
- [ ] View all orders for seller
- [ ] Filter by status
- [ ] Update order status:
  - [ ] Pending → Confirmed
  - [ ] Confirmed → Processing
  - [ ] Processing → Shipped
  - [ ] Shipped → Delivered
- [ ] Add tracking number
- [ ] View order details
- [ ] Check order status updates in DB

### Analytics Dashboard
- [ ] Navigate to `seller-analytics.html`
- [ ] View time period filter (7/30/90 days, all)
- [ ] Revenue stats display
- [ ] Total orders count
- [ ] Average order value calculated
- [ ] Customer count shown

### Charts Display
- [ ] Revenue over time line chart loads
- [ ] Orders by status doughnut chart loads
- [ ] Top categories bar chart loads
- [ ] Payment methods pie chart loads
- [ ] All charts interactive (hover shows data)

### Top Products Table
- [ ] Top 10 products by revenue
- [ ] Orders count per product
- [ ] Units sold per product
- [ ] Revenue per product
- [ ] Data updates with date filter

---

## 5️⃣ EMAIL NOTIFICATIONS TESTING

### Setup Verification
- [ ] Resend account created
- [ ] API key configured in Supabase
- [ ] Edge Functions deployed
- [ ] Database triggers active

### Order Confirmation Email
- [ ] Create new order
- [ ] Check email inbox
- [ ] Email received within 1 minute
- [ ] Subject: "Order Confirmation - [ORDER_NUMBER]"
- [ ] Email displays:
  - [ ] Order number
  - [ ] Customer name
  - [ ] Order items with prices
  - [ ] Subtotal, tax, delivery fee
  - [ ] Total amount
  - [ ] Delivery address
  - [ ] Payment method
  - [ ] Track order button

### Shipping Notification Email
- [ ] Update order status to "shipped"
- [ ] Add tracking number
- [ ] Check email inbox
- [ ] Email received
- [ ] Subject: "Your Order is on its Way!"
- [ ] Email displays:
  - [ ] Order number
  - [ ] Tracking number
  - [ ] Carrier information
  - [ ] Estimated delivery
  - [ ] Delivery address
  - [ ] Track package button

### Email Logs
- [ ] Check `email_logs` table
- [ ] Verify sent emails recorded
- [ ] Status = 'pending' or 'sent'
- [ ] No error messages
- [ ] Timestamps correct

---

## 6️⃣ ADMIN PANEL TESTING

### Admin Login
- [ ] Navigate to `admin-login.html`
- [ ] Try login with regular user → denied
- [ ] Try login with seller → denied
- [ ] Login with admin credentials → success
- [ ] Redirected to admin dashboard

### Role Assignment (SQL)
```sql
-- Run this to make a user admin
INSERT INTO user_roles (user_id, role, granted_by)
VALUES ('YOUR_USER_ID', 'admin', 'YOUR_USER_ID');
```

### Admin Dashboard
- [ ] Navigate to `admin-dashboard.html`
- [ ] Total users stat displays
- [ ] Total orders stat displays
- [ ] Total revenue stat displays
- [ ] Active sellers stat displays
- [ ] Revenue chart loads
- [ ] User growth chart loads
- [ ] Recent activity list shows

### User Management
- [ ] Navigate to `admin-users.html`
- [ ] All users display in table
- [ ] User avatars show initials
- [ ] Roles displayed correctly
- [ ] Join dates formatted

### Search & Filter
- [ ] Search by name → filters users
- [ ] Search by email → filters users
- [ ] Filter by role (customer/seller/admin)
- [ ] Filter by status (active/banned)
- [ ] Results update in real-time

### Ban User
- [ ] Click "Ban" on a user
- [ ] Modal opens
- [ ] Enter ban reason
- [ ] Click "Ban User"
- [ ] User status → "Banned"
- [ ] Check `user_bans` table
- [ ] Action logged in `audit_logs`

### Unban User
- [ ] Click "Unban" on banned user
- [ ] Confirm dialog appears
- [ ] User status → "Active"
- [ ] `user_bans` record updated (is_active = false)
- [ ] Action logged in audit logs

### Audit Logs
- [ ] Navigate to `admin-audit-logs.html` (if created)
- [ ] View all admin actions
- [ ] Filter by action type
- [ ] Filter by user
- [ ] Filter by date range
- [ ] View action details

### Platform Settings
- [ ] Navigate to `admin-settings.html` (if created)
- [ ] View current settings
- [ ] Update commission rate
- [ ] Update delivery fee
- [ ] Update tax rate
- [ ] Save changes → updates DB
- [ ] Changes reflected platform-wide

---

## 7️⃣ INTEGRATION TESTING

### End-to-End Customer Journey
1. [ ] Register new customer account
2. [ ] Add delivery address
3. [ ] Browse products (storefront)
4. [ ] Add items to cart
5. [ ] Proceed to checkout
6. [ ] Complete payment with Paystack
7. [ ] Receive order confirmation email
8. [ ] View order in order history
9. [ ] Track order status
10. [ ] Receive shipping notification email

### End-to-End Seller Journey
1. [ ] Register seller account
2. [ ] Add products to store
3. [ ] Receive customer order
4. [ ] Confirm order
5. [ ] Process order
6. [ ] Add tracking number
7. [ ] Mark as shipped
8. [ ] View analytics
9. [ ] Check revenue reports

### End-to-End Admin Journey
1. [ ] Login to admin panel
2. [ ] View platform statistics
3. [ ] Browse all users
4. [ ] Search for specific user
5. [ ] Ban inappropriate user
6. [ ] View all orders
7. [ ] Monitor audit logs
8. [ ] Update platform settings

---

## 8️⃣ SECURITY TESTING

### Authentication Security
- [ ] Cannot access protected pages without login
- [ ] Session expires after timeout
- [ ] Logout clears session
- [ ] Password requirements enforced
- [ ] SQL injection attempts blocked

### Authorization Testing
- [ ] Customers cannot access seller pages
- [ ] Sellers cannot access admin pages
- [ ] Users can only view own data
- [ ] RLS policies prevent unauthorized access

### Payment Security
- [ ] Card numbers never stored
- [ ] Payment handled by Paystack (PCI compliant)
- [ ] Transactions logged properly
- [ ] Failed payments handled gracefully

### Data Privacy
- [ ] Users cannot see other users' data
- [ ] Orders isolated by customer/seller
- [ ] Email addresses protected
- [ ] Phone numbers protected

---

## 9️⃣ PERFORMANCE TESTING

### Page Load Times
- [ ] Dashboard loads < 2 seconds
- [ ] Product listings load < 3 seconds
- [ ] Order history loads < 2 seconds
- [ ] Analytics loads < 4 seconds

### Database Queries
- [ ] Large product lists paginated
- [ ] Order lists filtered efficiently
- [ ] No N+1 query problems
- [ ] Indexes working correctly

### Image Loading
- [ ] Product images optimized
- [ ] Lazy loading implemented (if applicable)
- [ ] Thumbnails generated

---

## 🔟 MOBILE RESPONSIVENESS

### Test on Mobile Devices
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] Tablet (iPad)

### Mobile Features
- [ ] Navigation menu responsive
- [ ] Forms usable on mobile
- [ ] Tables scroll horizontally
- [ ] Buttons large enough to tap
- [ ] Text readable without zoom
- [ ] Images scale properly

---

## 🐛 BUG TRACKING

### Found Issues
| Priority | Component | Description | Status |
|----------|-----------|-------------|--------|
| High | Payment | [Description] | Open |
| Medium | Dashboard | [Description] | Fixed |
| Low | UI | [Description] | Open |

---

## ✅ FINAL CHECKLIST

### Pre-Launch
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Database backups configured
- [ ] Error monitoring setup
- [ ] Performance optimized
- [ ] Security audit complete

### Production Ready
- [ ] Environment variables secure
- [ ] API keys configured
- [ ] Email templates finalized
- [ ] Terms & Conditions added
- [ ] Privacy Policy added
- [ ] Contact information updated

### Go-Live
- [ ] DNS configured
- [ ] SSL certificate active
- [ ] Monitoring dashboards setup
- [ ] Support system ready
- [ ] Launch announcement prepared

---

## 📞 SUPPORT CONTACTS

**Supabase:** https://supabase.com/support  
**Paystack:** https://paystack.com/support  
**Resend:** https://resend.com/support

---

**Testing completed:** ___/___/_____  
**Tester:** _________________  
**Sign-off:** _________________
