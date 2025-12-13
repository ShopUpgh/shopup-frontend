# 🛍️ SHOPUP - E-Commerce Platform for Africa

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Production%20Ready-green)

> A comprehensive e-commerce platform designed specifically for African markets, enabling small business sellers to transition from social media to professional online storefronts.

**Built by:** Alden's Innovations  
**Target Market:** Ghana & West Africa  
**Launch Date:** 2025

---

## 🎯 Overview

ShopUp is a full-stack e-commerce platform that provides:

- **For Customers:** Easy registration, secure payments, order tracking
- **For Sellers:** Product management, sales analytics, order fulfillment
- **For Admins:** User management, platform analytics, moderation tools

### Key Features

✅ User authentication with Supabase  
✅ Multiple payment methods (Card, Mobile Money, Cash on Delivery)  
✅ Real-time order tracking  
✅ Email notifications  
✅ Sales analytics & reporting  
✅ Admin dashboard with user management  
✅ Mobile-responsive design  
✅ Ghana-specific features (digital addresses, local payments)

---

## 🚀 Quick Start

### Prerequisites

- Supabase account (free)
- Paystack account (for payments)
- Resend account (for emails)
- Web hosting (Netlify/Vercel/GitHub Pages)

### Installation (5 Minutes)

1. **Clone/Download Files**
   ```bash
   # Download all files to your computer
   ```

2. **Configure Supabase**
   - Create new Supabase project
   - Run all SQL schemas (in order):
     - `01_CUSTOMER_AUTH_SCHEMA.sql`
     - `02_PAYSTACK_SCHEMA.sql`
     - `03_EMAIL_NOTIFICATIONS_SCHEMA.sql`
     - `04_ADMIN_PANEL_SCHEMA.sql`

3. **Update Configuration**
   ```javascript
   // In supabase-config.js
   const SUPABASE_URL = 'YOUR_PROJECT_URL';
   const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
   
   // In paystack-config.js
   publicKey: 'pk_test_YOUR_KEY'
   ```

4. **Deploy**
   - Upload files to Netlify/Vercel
   - Or use GitHub Pages
   - Enable HTTPS

5. **Create First Admin**
   ```sql
   -- Run in Supabase SQL Editor
   INSERT INTO user_roles (user_id, role)
   VALUES ('YOUR_USER_ID', 'admin');
   ```

**You're live!** 🎉

---

## 📂 Project Structure

```
shopup/
├── 📄 Configuration Files
│   ├── supabase-config.js
│   ├── paystack-config.js
│   └── email-notifications.js
│
├── 👥 Customer Module (9 files)
│   ├── Login & Registration
│   ├── Dashboard
│   ├── Profile & Addresses
│   └── Orders & Checkout
│
├── 🏪 Seller Module (8 files)
│   ├── Products Management
│   ├── Orders Processing
│   └── Sales Analytics
│
├── 🔐 Admin Module (7 files)
│   ├── Dashboard
│   ├── User Management
│   └── Platform Analytics
│
├── 🗄️ Database Schemas (4 SQL files)
│   └── 30+ tables, triggers, policies
│
├── 📧 Email Functions (2 Edge Functions)
│   └── Order confirmation & shipping
│
└── 📚 Documentation (4 files)
    ├── TESTING_CHECKLIST.md
    ├── DEPLOYMENT_GUIDE.md
    ├── PROJECT_DOCUMENTATION.md
    └── README.md (this file)
```

**Total:** 39 production-ready files

---

## 💡 Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript** (Vanilla - no frameworks)
- **Chart.js** for analytics visualization
- **Responsive Design** (mobile-first approach)

### Backend
- **Supabase** (PostgreSQL database)
- **Supabase Auth** (user authentication)
- **Supabase Edge Functions** (serverless functions)
- **Row Level Security** (RLS policies)

### Integrations
- **Paystack** - Payment processing
- **Resend** - Email notifications
- **Netlify/Vercel** - Hosting & CDN

### Ghana-Specific Features
- Mobile Money (MTN, Vodafone, AirtelTigo)
- Ghana phone number validation (024, 054, 055, etc.)
- Digital address support
- Cash on Delivery
- Local currency (GH₵)

---

## 🎨 Screenshots

### Customer Dashboard
Beautiful, intuitive interface for customers to manage orders and profile.

### Seller Analytics
Comprehensive sales charts, revenue tracking, and product performance.

### Admin Panel
Powerful tools for managing users, monitoring platform activity.

---

## 📊 Database Schema

### Core Tables (30+)

**Authentication & Users:**
- `auth.users` - User accounts
- `customer_profiles` - Customer details
- `user_roles` - Role-based access control
- `user_bans` - User suspensions

**E-Commerce:**
- `products` - Product catalog
- `orders` - Order headers
- `order_items` - Order line items
- `cart` - Shopping cart

**Payments:**
- `payment_transactions` - All transactions
- `payment_methods` - Saved payment methods
- `refunds` - Refund records

**Admin:**
- `audit_logs` - Activity tracking
- `platform_settings` - Configuration
- `email_logs` - Email delivery tracking

All tables include:
- Row Level Security (RLS)
- Automatic timestamps
- Foreign key constraints
- Proper indexing

---

## 🔐 Security Features

✅ **Authentication**
- Supabase Auth with JWT tokens
- Password hashing (bcrypt)
- Email verification
- Session management

✅ **Authorization**
- Row Level Security (RLS)
- Role-based access control (RBAC)
- Permission system
- Audit logging

✅ **Payment Security**
- PCI DSS compliant (via Paystack)
- No card data stored
- Tokenized payments
- Encrypted communication

✅ **Data Privacy**
- GDPR compliance ready
- Data encryption
- User data deletion
- Privacy policy integration

---

## 💳 Payment Methods Supported

### Card Payments
- Visa, Mastercard, Verve
- International cards accepted
- 3D Secure authentication
- Instant confirmation

### Mobile Money
- **MTN Mobile Money**
- **Vodafone Cash**
- **AirtelTigo Money**
- Popular in Ghana & West Africa

### Bank Transfer
- Direct bank transfers
- Manual verification
- Delayed confirmation

### Cash on Delivery
- Pay on receipt
- No upfront payment
- Available in major cities

---

## 📧 Email Notifications

### Automated Emails

1. **Order Confirmation**
   - Sent immediately after order placement
   - Includes order summary, items, total
   - Delivery address and payment method

2. **Shipping Notification**
   - Sent when order ships
   - Includes tracking number
   - Estimated delivery date

3. **Order Delivered** (future)
4. **Password Reset** (future)
5. **New Product Alerts** (future)

All emails:
- Professional HTML templates
- Mobile-responsive design
- Branded with ShopUp colors
- Include call-to-action buttons

---

## 📈 Analytics & Reporting

### Customer Analytics
- Total registered customers
- Active customers (30-day)
- Customer retention rate
- Average order value
- Customer lifetime value

### Order Analytics
- Total orders by status
- Order fulfillment rate
- Average processing time
- Cancellation rate
- Payment method distribution

### Revenue Analytics
- Total revenue (daily/weekly/monthly)
- Revenue by category
- Revenue by payment method
- Commission tracking
- Growth trends

### Seller Analytics
- Top selling products
- Product performance
- Inventory levels
- Customer ratings (future)
- Sales forecasting (future)

---

## 🧪 Testing

### Comprehensive Test Coverage

✅ **Authentication Tests**
- Registration flow
- Login/logout
- Password reset
- Session management

✅ **Payment Tests**
- Test cards provided
- Mobile money simulation
- Failed payment handling
- Refund processing

✅ **Order Flow Tests**
- Cart operations
- Checkout process
- Order tracking
- Status updates

✅ **Admin Tests**
- User management
- Ban/unban functionality
- Audit log verification
- Settings updates

See `TESTING_CHECKLIST.md` for complete testing guide.

---

## 🚀 Deployment

### Supported Platforms

**Recommended:** Netlify (easiest setup)
- Drag & drop deployment
- Automatic HTTPS
- Custom domain support
- Free tier available

**Also Supported:**
- Vercel
- GitHub Pages
- Any static hosting

### Deployment Steps

1. Run database schemas in Supabase
2. Update configuration files
3. Deploy to hosting platform
4. Configure custom domain (optional)
5. Set up email functions
6. Create admin account
7. Test all features
8. Go live!

**Detailed guide:** See `DEPLOYMENT_GUIDE.md`

---

## 📚 Documentation

### Available Guides

1. **README.md** (this file)
   - Quick overview and setup

2. **DEPLOYMENT_GUIDE.md**
   - Step-by-step deployment instructions
   - Production configuration
   - Troubleshooting

3. **TESTING_CHECKLIST.md**
   - Complete testing procedures
   - Test cases for all features
   - Quality assurance checklist

4. **PROJECT_DOCUMENTATION.md**
   - Technical architecture
   - API references
   - Database schema details
   - Security documentation

5. **EMAIL_SETUP_GUIDE.md**
   - Resend configuration
   - Edge Functions deployment
   - Email template customization

---

## 🔧 Configuration

### Environment Variables

**Required:**
```javascript
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
```

**Optional (for email):**
```javascript
RESEND_API_KEY=re_xxxxx (stored in Supabase secrets)
```

### Feature Flags

Enable/disable features in `platform_settings` table:
- User registration
- Maintenance mode
- Payment methods
- Email notifications

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Single Currency**
   - Currently supports GHS only
   - Multi-currency coming in v2.0

2. **Image Upload**
   - Basic implementation
   - No automatic optimization
   - Consider Cloudinary integration

3. **Search**
   - Basic text search
   - Full-text search in roadmap

4. **Mobile Apps**
   - Web-only currently
   - Native apps planned for v2.0

### Reporting Bugs

Found a bug? Please report:
- Email: support@shopup.gh
- Include: Browser, steps to reproduce, screenshots

---

## 🗺️ Roadmap

### Version 1.1 (Q1 2026)
- [ ] Product reviews & ratings
- [ ] Wishlist functionality
- [ ] Advanced search & filters
- [ ] Inventory management
- [ ] Bulk product upload

### Version 2.0 (Q2 2026)
- [ ] Multi-currency support
- [ ] Mobile applications (iOS/Android)
- [ ] Seller subscription plans
- [ ] Advanced analytics dashboard
- [ ] AI-powered recommendations

### Future Features
- [ ] Multi-vendor marketplace
- [ ] Social media integration
- [ ] Loyalty program
- [ ] Affiliate system
- [ ] API for third-party integrations

---

## 💰 Pricing & Costs

### Infrastructure Costs

**Supabase:**
- Free: 500MB database, 2GB bandwidth
- Pro: $25/mo (8GB database, 250GB bandwidth)

**Paystack:**
- Transaction fee: 1.5% + GH₵0.30
- No monthly fee

**Resend:**
- Free: 100 emails/day
- Pro: $20/mo (50,000 emails)

**Netlify:**
- Free: 100GB bandwidth
- Pro: $19/mo (400GB bandwidth)

**Total Monthly (Free Tier):** $0  
**Total Monthly (Pro Tier):** ~$70

---

## 👥 Team & Contributors

**Founder:** Al (Alden's Innovations)  
**Development:** Claude AI + Al  
**Design:** In-house  
**Testing:** Community testers

### Contributing

Currently not accepting external contributions.  
For partnerships: contact@aldensgh.com

---

## 📄 License

**Proprietary Software**  
Copyright © 2025 Alden's Innovations  
All Rights Reserved

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

For licensing inquiries: legal@aldensgh.com

---

## 📞 Support & Contact

### Technical Support
- **Email:** support@shopup.gh
- **Phone:** +233 XXX XXX XXXX
- **Hours:** Mon-Fri, 9am-5pm GMT

### Business Inquiries
- **Partnerships:** partnerships@shopup.gh
- **Sales:** sales@shopup.gh

### Social Media
- **Twitter:** @shopupgh
- **Facebook:** /shopupghana
- **Instagram:** @shopup.gh
- **LinkedIn:** /company/shopup

---

## 🙏 Acknowledgments

Built with amazing tools and services:
- **Supabase** - Backend infrastructure
- **Paystack** - Payment processing
- **Resend** - Email delivery
- **Chart.js** - Data visualization
- **Netlify** - Hosting & deployment

Special thanks to:
- Early beta testers
- The Supabase community
- Paystack Ghana team

---

## 📊 Project Stats

- **Total Files:** 39
- **Lines of Code:** ~15,000+
- **Database Tables:** 30+
- **API Endpoints:** 50+
- **Development Time:** 3 months
- **Languages:** JavaScript, SQL, TypeScript
- **Status:** ✅ Production Ready

---

## 🎉 Ready to Launch!

Your complete e-commerce platform is ready for deployment.

**Next Steps:**
1. Read `DEPLOYMENT_GUIDE.md`
2. Set up Supabase project
3. Configure Paystack
4. Deploy to hosting
5. Create admin account
6. Start selling!

---

## 🔧 Deployment / Troubleshooting

### Static Assets Configuration

#### Favicon Setup
The site uses `/public/favicon.svg` as the main favicon. All HTML files reference it with:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
```

The `vercel.json` configuration includes a rewrite rule that serves `/favicon.svg` when `/favicon.ico` is requested.

**To replace the favicon:**
1. Update `/public/favicon.svg` with your custom SVG
2. Ensure it's optimized (small file size, simple design)
3. The favicon will be cached for 24 hours (86400 seconds)

#### Root-Relative Asset Paths
All CSS and static assets use root-relative paths (starting with `/`) to ensure reliable loading across all pages:
- Main stylesheet: `/css/styles.css`
- Other stylesheets: `/css/dashboard-styles.css`, `/css/login-styles.css`, etc.
- Favicon: `/favicon.ico` (rewrites to `/public/favicon.svg`)

**Why root-relative paths?**
- Works consistently from any page depth (root, subdirectories)
- Avoids 404 errors when deployed to CDN/edge networks
- Simplifies maintenance and refactoring

#### Cache Control Headers
The `vercel.json` file sets optimal caching for different asset types:

**Long-term caching (1 year, immutable):**
- CSS files: `max-age=31536000, immutable`
- JavaScript files: `max-age=31536000, immutable`
- WASM files: `max-age=31536000, immutable`

**Short-term caching (24 hours):**
- Favicon: `max-age=86400`

**Benefits:**
- Faster page loads for returning visitors
- Reduced bandwidth costs
- Better performance scores

#### Preloading Critical CSS
Critical stylesheets are preloaded to avoid Flash of Unstyled Content (FOUC):
```html
<link rel="preload" href="/css/styles.css" as="style">
<link rel="stylesheet" href="/css/styles.css">
```

This tells the browser to prioritize loading the stylesheet before rendering.

### WASM Asset Optimization (Optional)

If you're using WebAssembly files, you can precompress them for better performance:

**Using the npm script:**
```bash
npm run precompress
```

This will create `.gz` and `.br` (Brotli) versions of all WASM files, which Vercel will automatically serve to supporting browsers.

**Manual compression:**
```bash
# Gzip compression
find . -name "*.wasm" -exec gzip -k {} \;

# Brotli compression (better compression ratio)
find . -name "*.wasm" -exec brotli {} -o {}.br \;
```

**Note:** You need `gzip` and `brotli` CLI tools installed. On macOS: `brew install brotli`

### Verification Steps

After deployment, verify that static assets are loading correctly:

**1. Check stylesheet loading:**
```bash
curl -I https://www.shopupgh.com/css/styles.css
```
Expected: `200 OK` with `Cache-Control: public, max-age=31536000, immutable`

**2. Check favicon:**
```bash
curl -I https://www.shopupgh.com/favicon.ico
```
Expected: `200 OK` (served from `/public/favicon.svg`)

**3. Browser DevTools verification:**
- Open Network tab in browser DevTools
- Load the site
- Verify no 404 errors for favicon or CSS files
- Check that CSS files show proper `Cache-Control` headers
- Confirm WASM files (if any) are served with correct MIME type and compression

**4. Common issues and fixes:**

| Issue | Solution |
|-------|----------|
| Favicon shows 404 | Ensure `/public/favicon.svg` exists and `vercel.json` rewrite is configured |
| CSS not loading | Check that CSS files are in `/public/css/` directory |
| Styles not applying | Clear browser cache, check for CSS path errors in HTML |
| WASM not loading | Verify MIME type is `application/wasm` in `vercel.json` headers |

### Directory Structure for Deployment

```
shopup-frontend/
├── public/
│   ├── favicon.svg          # Main favicon
│   └── css/                 # All stylesheets
│       ├── styles.css
│       ├── dashboard-styles.css
│       ├── login-styles.css
│       ├── signup-styles.css
│       └── storefront-styles.css
├── vercel.json              # Vercel configuration
├── index.html               # Entry points (root-relative paths)
├── login.html
├── signup.html
└── [other HTML files]
```

**Important:** The `public/` directory must be deployed with all assets. Vercel automatically serves files from this directory at the root path.

---

**Made with ❤️ in Ghana**  
**Powered by Commerce, Guided by Conscience**

🛍️ **ShopUp** - Transforming African E-Commerce
