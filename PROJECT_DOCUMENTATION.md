# 📚 SHOPUP PLATFORM DOCUMENTATION

## Complete Technical Documentation

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Author:** Alden's Innovations

---

## 🎯 PROJECT OVERVIEW

### What is ShopUp?

ShopUp is a comprehensive e-commerce platform designed specifically for the African market, particularly Ghana. It enables small business sellers to transition from social media selling to professional online storefronts.

### Key Features

**For Customers:**
- User registration and authentication
- Profile and address management
- Order placement and tracking
- Multiple payment methods (Card, Mobile Money, Cash on Delivery)
- Order history and reordering
- Email notifications

**For Sellers:**
- Product management (CRUD operations)
- Order processing and fulfillment
- Sales analytics and reporting
- Revenue tracking
- Customer order management

**For Admins:**
- User management (view, ban, unban)
- Platform-wide analytics
- Order monitoring
- Audit logging
- Platform settings management

---

## 🏗️ SYSTEM ARCHITECTURE

### Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla JS)
- Chart.js for data visualization
- Responsive design (mobile-first)

**Backend:**
- Supabase (PostgreSQL database)
- Supabase Authentication
- Supabase Edge Functions (Deno/TypeScript)
- Row Level Security (RLS)

**Payment Processing:**
- Paystack API
- Mobile Money integration (MTN, Vodafone, AirtelTigo)
- Card payments (Visa, Mastercard, Verve)
- Cash on Delivery

**Email Service:**
- Resend API
- Transactional emails
- HTML email templates

**Hosting:**
- Netlify / Vercel / GitHub Pages
- CDN delivery
- HTTPS encryption

---

## 📊 DATABASE SCHEMA

### Core Tables

#### 1. Authentication Tables (Supabase Auth)
```sql
auth.users - User authentication data
```

#### 2. Customer Tables
```sql
customer_profiles - Customer information
customer_addresses - Delivery addresses
customer_payment_methods - Saved payment methods
```

#### 3. Order Tables
```sql
orders - Order headers
order_items - Order line items
order_tracking - Tracking information
```

#### 4. Product Tables
```sql
products - Product catalog
product_categories - Categories
product_images - Product images
```

#### 5. Payment Tables
```sql
payment_transactions - All transactions
payment_methods - Saved payment methods
refunds - Refund records
payment_webhooks - Paystack webhooks
```

#### 6. Admin Tables
```sql
user_roles - User role assignments
admin_permissions - Permission definitions
audit_logs - Admin action logs
user_bans - User bans/suspensions
platform_settings - System configuration
```

#### 7. Email Tables
```sql
email_logs - Email delivery tracking
```

### Relationships

```
auth.users
    ├── customer_profiles (1:1)
    │   ├── customer_addresses (1:N)
    │   ├── orders (1:N)
    │   └── payment_methods (1:N)
    ├── user_roles (1:N)
    ├── user_bans (1:N)
    └── audit_logs (1:N)

orders
    ├── order_items (1:N)
    ├── payment_transactions (1:1)
    └── order_tracking (1:1)

products
    ├── order_items (1:N)
    └── product_images (1:N)
```

---

## 🔐 SECURITY ARCHITECTURE

### Authentication Flow

1. User registers → Supabase Auth creates user
2. Trigger creates customer_profile
3. Email verification sent (optional)
4. User logs in → JWT token issued
5. Token used for all subsequent requests

### Authorization (RLS)

**Row Level Security Policies:**
- Customers can only access their own data
- Sellers can only access their own products/orders
- Admins have full access with permission checks
- All queries filtered at database level

### Payment Security

- No card data stored locally
- All payment processing via Paystack (PCI DSS compliant)
- Tokenized payment methods
- Encrypted API communication

### Data Privacy

- Passwords hashed (bcrypt)
- Sensitive data encrypted
- GDPR compliance ready
- User data deletion capability

---

## 🔄 DATA FLOW

### Customer Order Flow

```
1. Customer adds items to cart (localStorage)
2. Proceeds to checkout
3. Selects delivery address
4. Chooses payment method
5. If Paystack:
   - Payment popup opens
   - Customer enters card/momo details
   - Paystack processes payment
   - Webhook confirms payment
6. Order created in database
7. Email confirmation sent
8. Order appears in customer dashboard
9. Seller receives order notification
10. Seller processes and ships order
11. Customer receives shipping notification
12. Order status updated to delivered
```

### Seller Product Flow

```
1. Seller logs in
2. Navigates to products page
3. Clicks "Add Product"
4. Fills in product details
5. Uploads product image
6. Saves product → stored in database
7. Product appears in seller's inventory
8. Product visible in storefront
9. Customers can purchase product
10. Seller views analytics on sales
```

### Admin User Management Flow

```
1. Admin logs in
2. Views all users
3. Searches/filters users
4. Selects user to ban
5. Enters ban reason
6. User banned → cannot login
7. Action logged in audit_logs
8. Admin can unban later
9. Unban action also logged
```

---

## 📁 FILE STRUCTURE

```
shopup/
│
├── README.md
├── DEPLOYMENT_GUIDE.md
├── TESTING_CHECKLIST.md
├── index.html (landing page)
│
├── Configuration/
│   ├── supabase-config.js
│   ├── paystack-config.js
│   └── email-notifications.js
│
├── Customer/
│   ├── HTML Files/
│   │   ├── customer-login.html
│   │   ├── customer-register.html
│   │   ├── customer-dashboard.html
│   │   ├── customer-profile.html
│   │   ├── customer-addresses.html
│   │   ├── customer-orders.html
│   │   ├── customer-order-details.html
│   │   ├── customer-checkout.html
│   │   └── customer-order-confirmation.html
│   │
│   └── Scripts/
│       ├── customer-login-script.js
│       ├── customer-register-script.js
│       ├── customer-dashboard-script.js
│       ├── customer-profile-script.js
│       ├── customer-addresses-script.js
│       ├── customer-orders-script.js
│       ├── customer-order-details-script.js
│       └── customer-checkout-script.js
│
├── Seller/
│   ├── HTML Files/
│   │   ├── login.html
│   │   ├── signup.html
│   │   ├── dashboard.html
│   │   ├── seller-dashboard-enhanced.html
│   │   ├── products.html
│   │   ├── add-product.html
│   │   ├── edit-product.html
│   │   ├── orders.html
│   │   └── seller-analytics.html
│   │
│   └── Scripts/
│       ├── login-script.js
│       ├── signup-script.js
│       ├── dashboard-script.js
│       ├── seller-dashboard-enhanced-script.js
│       ├── products-script.js
│       ├── add-product-script.js
│       ├── orders-script.js
│       └── seller-analytics-script.js
│
├── Admin/
│   ├── HTML Files/
│   │   ├── admin-login.html
│   │   ├── admin-dashboard.html
│   │   └── admin-users.html
│   │
│   └── Scripts/
│       ├── admin-login-script.js
│       ├── admin-dashboard-script.js
│       └── admin-users-script.js
│
├── Storefront/
│   ├── storefront-index.html
│   ├── store.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   └── order-confirmation.html
│
├── Database/
│   ├── 01_CUSTOMER_AUTH_SCHEMA.sql
│   ├── 02_PAYSTACK_SCHEMA.sql
│   ├── 03_EMAIL_NOTIFICATIONS_SCHEMA.sql
│   └── 04_ADMIN_PANEL_SCHEMA.sql
│
├── Edge Functions/
│   ├── send-order-confirmation-function.ts
│   └── send-shipping-notification-function.ts
│
└── Documentation/
    ├── EMAIL_SETUP_GUIDE.md
    ├── DEPLOYMENT_GUIDE.md
    ├── TESTING_CHECKLIST.md
    └── PROJECT_DOCUMENTATION.md (this file)
```

---

## 🎨 UI/UX DESIGN PRINCIPLES

### Design System

**Colors:**
- Primary: #2d8a3e (Green)
- Secondary: #667eea (Purple)
- Success: #10b981
- Error: #ef4444
- Warning: #f59e0b
- Gray: #718096

**Typography:**
- Font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- Headings: Bold, 1.5-2.5em
- Body: Regular, 1em
- Small text: 0.85-0.9em

**Spacing:**
- Sections: 40px padding
- Cards: 20-30px padding
- Elements: 15-20px margin-bottom
- Form fields: 12-15px padding

**Components:**
- Rounded corners: 8-12px
- Shadows: 0 2px 8px rgba(0,0,0,0.08)
- Buttons: 600 font-weight
- Inputs: 2px border

### Mobile Responsiveness

- Breakpoint: 768px
- Grid layouts collapse to single column
- Touch-friendly buttons (min 44px)
- Readable text without zoom
- Horizontal scrolling for tables

---

## 🔌 API INTEGRATIONS

### Supabase API

**Base URL:** `https://[project-ref].supabase.co`

**Authentication:**
```javascript
const { createClient } = supabase;
const client = createClient(URL, ANON_KEY);

// Sign up
await client.auth.signUp({ email, password });

// Sign in
await client.auth.signInWithPassword({ email, password });

// Sign out
await client.auth.signOut();
```

**Database Queries:**
```javascript
// Select
const { data, error } = await client
  .from('table_name')
  .select('*')
  .eq('column', value);

// Insert
const { data, error } = await client
  .from('table_name')
  .insert([{ column: value }]);

// Update
const { data, error } = await client
  .from('table_name')
  .update({ column: value })
  .eq('id', id);

// Delete
const { data, error } = await client
  .from('table_name')
  .delete()
  .eq('id', id);
```

### Paystack API

**Test Public Key:** `pk_test_...`  
**Live Public Key:** `pk_live_...`

**Initialize Payment:**
```javascript
const handler = PaystackPop.setup({
  key: 'pk_test_xxxxx',
  email: 'customer@email.com',
  amount: amount * 100, // in kobo
  currency: 'GHS',
  callback: function(response) {
    // Payment successful
  },
  onClose: function() {
    // Payment cancelled
  }
});

handler.openIframe();
```

### Resend API

**Base URL:** `https://api.resend.com`

**Send Email:**
```javascript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer re_xxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'ShopUp <orders@shopup.gh>',
    to: ['customer@email.com'],
    subject: 'Order Confirmation',
    html: '<html>...</html>'
  })
});
```

---

## 📊 ANALYTICS & METRICS

### Key Performance Indicators (KPIs)

**Customer Metrics:**
- Total registered customers
- Active customers (last 30 days)
- Customer retention rate
- Average order value
- Customer lifetime value

**Order Metrics:**
- Total orders
- Orders by status
- Average order processing time
- Order fulfillment rate
- Order cancellation rate

**Revenue Metrics:**
- Total revenue
- Revenue by payment method
- Revenue by category
- Commission earned
- Refund rate

**Seller Metrics:**
- Total active sellers
- Products per seller
- Orders per seller
- Top performing sellers
- Seller satisfaction score

---

## 🐛 ERROR HANDLING

### Frontend Error Handling

```javascript
try {
  // Database operation
  const { data, error } = await supabase
    .from('table')
    .select('*');
    
  if (error) throw error;
  
  // Success handling
  
} catch (error) {
  console.error('Error:', error);
  showAlert('Failed to load data', 'error');
}
```

### Common Error Scenarios

1. **Network Errors**
   - Display: "Connection failed. Please check your internet."
   - Action: Retry button

2. **Authentication Errors**
   - Display: "Session expired. Please login again."
   - Action: Redirect to login

3. **Validation Errors**
   - Display: "Please check your input: [field] is required"
   - Action: Highlight invalid fields

4. **Payment Errors**
   - Display: "Payment failed: [reason]"
   - Action: Retry or change payment method

---

## 🚀 PERFORMANCE OPTIMIZATION

### Best Practices Implemented

1. **Lazy Loading**
   - Images load as they enter viewport
   - Scripts load asynchronously

2. **Database Indexing**
   - All foreign keys indexed
   - Frequently queried columns indexed
   - Composite indexes for complex queries

3. **Caching Strategy**
   - Static assets cached by browser
   - CDN for JavaScript libraries
   - Session data in localStorage

4. **Query Optimization**
   - Select only needed columns
   - Use joins instead of multiple queries
   - Implement pagination for large datasets

---

## 🔧 MAINTENANCE

### Regular Tasks

**Daily:**
- Monitor error logs
- Check email delivery
- Review payment transactions
- Monitor server uptime

**Weekly:**
- Database backup verification
- Security patches
- Performance metrics review
- User feedback analysis

**Monthly:**
- Database optimization
- Analytics report generation
- Feature usage analysis
- Security audit

### Backup Strategy

1. **Database Backups**
   - Automatic daily backups (Supabase)
   - 7-day retention (free tier)
   - Manual backups before major changes

2. **Code Backups**
   - Git version control
   - GitHub repository
   - Tagged releases

---

## 📞 SUPPORT & CONTACT

**Technical Support:**
- Email: support@shopup.gh
- Phone: +233 XXX XXX XXXX
- Hours: Mon-Fri, 9am-5pm GMT

**Developer Resources:**
- GitHub: https://github.com/aldensgh/shopup
- Documentation: https://docs.shopup.gh
- API Reference: https://api.shopup.gh/docs

**Emergency Contacts:**
- Database: Supabase Support
- Payments: Paystack Support
- Hosting: Netlify/Vercel Support

---

## 📝 CHANGELOG

### Version 1.0 (November 17, 2025)
- Initial release
- Customer authentication system
- Paystack payment integration
- Order management
- Seller analytics dashboard
- Admin panel
- Email notifications

---

## 📜 LICENSE

Copyright © 2025 Alden's Innovations  
All Rights Reserved

---

## 🙏 ACKNOWLEDGMENTS

Built with:
- Supabase
- Paystack
- Resend
- Chart.js
- And lots of ☕

---

**End of Documentation**
