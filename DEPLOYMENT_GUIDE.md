# 🚀 SHOPUP DEPLOYMENT GUIDE

## Complete Step-by-Step Deployment Instructions

**Platform:** ShopUp E-commerce  
**Version:** 1.0  
**Last Updated:** November 17, 2025

---

## 📋 DEPLOYMENT OVERVIEW

This guide covers deploying ShopUp to production using:
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Netlify / Vercel / GitHub Pages
- **Payments:** Paystack
- **Email:** Resend (via Supabase Edge Functions)

**Estimated Time:** 2-3 hours

---

## PART 1: SUPABASE SETUP

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Create new organization (if needed)
4. Click "New Project"
5. Fill in details:
   - **Name:** shopup-production
   - **Database Password:** (Generate strong password - SAVE THIS!)
   - **Region:** Choose closest to Ghana (e.g., eu-west-2)
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### Step 2: Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **SAVE THESE SECURELY!**

### Step 3: Run Database Schemas

1. Go to **SQL Editor** in Supabase Dashboard
2. Run schemas in this order:

**Schema 1:** Customer Authentication
```sql
-- Paste contents of 01_CUSTOMER_AUTH_SCHEMA.sql
-- Click "Run"
-- Wait for "Success" message
```

**Schema 2:** Paystack Payments
```sql
-- Paste contents of 02_PAYSTACK_SCHEMA.sql
-- Click "Run"
```

**Schema 3:** Email Notifications
```sql
-- Paste contents of 03_EMAIL_NOTIFICATIONS_SCHEMA.sql
-- Click "Run"
```

**Schema 4:** Admin Panel
```sql
-- Paste contents of 04_ADMIN_PANEL_SCHEMA.sql
-- Click "Run"
```

### Step 4: Enable RLS (Row Level Security)

All tables should have RLS enabled (schemas do this automatically).

Verify by going to **Database** → **Tables** → Check each table has 🔒 icon

### Step 5: Create First Admin User

1. Go to **Authentication** → **Users**
2. Click "Add user"
3. Create admin account:
   - Email: admin@shopup.gh
   - Password: (Strong password)
4. Click "Create user"
5. Copy the User ID
6. Go to **SQL Editor**, run:

```sql
-- Make this user an admin
INSERT INTO user_roles (user_id, role, granted_by, is_active)
VALUES ('PASTE_USER_ID_HERE', 'admin', 'PASTE_USER_ID_HERE', true);

-- Create customer profile for this admin
INSERT INTO customer_profiles (user_id, full_name, email, phone)
VALUES ('PASTE_USER_ID_HERE', 'Admin User', 'admin@shopup.gh', '0241234567');
```

---

## PART 2: PAYSTACK SETUP

### Step 1: Create Paystack Account

1. Go to https://paystack.com
2. Click "Get Started"
3. Sign up with business email
4. Complete verification (may take 1-2 days)

### Step 2: Get API Keys

1. Login to Paystack Dashboard
2. Go to **Settings** → **API Keys & Webhooks**
3. Copy:
   ```
   Test Public Key: pk_test_xxxxx
   Test Secret Key: sk_test_xxxxx
   Live Public Key: pk_live_xxxxx (after verification)
   Live Secret Key: sk_live_xxxxx (after verification)
   ```

### Step 3: Test Mode First

**Always test with test keys before going live!**

Test Cards:
- Card: `5061 2808 1234 5678 014`
- CVV: `123`
- Expiry: Any future date
- OTP: `123456`

### Step 4: Configure Webhooks (Optional)

1. In Paystack Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://YOUR_DOMAIN.com/paystack-webhook`
3. Select events:
   - charge.success
   - charge.failed
   - transfer.success

---

## PART 3: FILE PREPARATION

### Step 1: Update Configuration Files

**File:** `supabase-config.js`
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'; // UPDATE THIS
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // UPDATE THIS

const { createClient } = supabase;
window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**File:** `paystack-config.js`
```javascript
const PAYSTACK_CONFIG = {
    publicKey: 'pk_test_YOUR_KEY', // UPDATE THIS (use pk_live_ for production)
    // ... rest stays the same
};
```

### Step 2: Check All File References

Ensure all HTML files reference correct script files:
```html
<script src="supabase-config.js"></script>
<script src="paystack-config.js"></script>
<script src="email-notifications.js"></script>
```

### Step 3: Create File Structure

```
shopup/
├── index.html (landing page)
├── supabase-config.js ⚠️
├── paystack-config.js ⚠️
├── email-notifications.js
│
├── Customer/
│   ├── customer-login.html
│   ├── customer-register.html
│   ├── customer-dashboard.html
│   ├── customer-profile.html
│   ├── customer-addresses.html
│   ├── customer-orders.html
│   ├── customer-order-details.html
│   └── customer-checkout.html
│
├── Seller/
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── products.html
│   ├── add-product.html
│   ├── orders.html
│   ├── seller-analytics.html
│   └── seller-dashboard-enhanced.html
│
├── Admin/
│   ├── admin-login.html
│   ├── admin-dashboard.html
│   └── admin-users.html
│
├── Storefront/
│   ├── store.html
│   ├── products.html
│   ├── cart.html
│   └── checkout.html
│
└── Scripts/
    ├── customer-*.js (all customer scripts)
    ├── seller-*.js (all seller scripts)
    ├── admin-*.js (all admin scripts)
    └── order-management-script.js
```

---

## PART 4: HOSTING DEPLOYMENT

### Option A: Netlify (Recommended - Easiest)

#### Step 1: Prepare for Netlify

1. Create `netlify.toml` in root:
```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Step 2: Deploy to Netlify

**Via Drag & Drop:**
1. Go to https://app.netlify.com
2. Sign up / Login
3. Drag your project folder to "Sites"
4. Wait for deployment
5. Site live at: `random-name.netlify.app`

**Via Git:**
1. Push code to GitHub
2. Login to Netlify
3. Click "Add new site" → "Import from Git"
4. Connect GitHub
5. Select repository
6. Click "Deploy site"

#### Step 3: Custom Domain (Optional)

1. Buy domain (e.g., from Namecheap, GoDaddy)
2. In Netlify → **Domain Settings**
3. Click "Add custom domain"
4. Enter your domain: `shopup.gh`
5. Update DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: www
   Value: YOUR-SITE.netlify.app
   ```
6. Enable HTTPS (automatic with Netlify)

---

### Option B: Vercel

#### Deploy to Vercel

1. Go to https://vercel.com
2. Sign up / Login
3. Click "Add New" → "Project"
4. Import from Git or drag & drop
5. Click "Deploy"
6. Site live at: `project.vercel.app`

---

### Option C: GitHub Pages (Free, Simple)

#### Step 1: Create GitHub Repository

1. Go to https://github.com
2. Create new repository: `shopup`
3. Make it public
4. Upload all files

#### Step 2: Enable GitHub Pages

1. Go to repository **Settings**
2. Scroll to **Pages**
3. Source: **Deploy from branch**
4. Branch: **main** → **/root**
5. Click **Save**
6. Site live at: `username.github.io/shopup`

---

## PART 5: EMAIL NOTIFICATIONS SETUP

### Step 1: Sign Up for Resend

1. Go to https://resend.com/signup
2. Create account (free tier: 100 emails/day)
3. Verify email

### Step 2: Get API Key

1. Go to **API Keys**
2. Click "Create API Key"
3. Name: "ShopUp Production"
4. Copy the key: `re_xxxxx`

### Step 3: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### Step 4: Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set Resend API key
supabase secrets set RESEND_API_KEY=re_YOUR_KEY

# Deploy functions
supabase functions deploy send-order-confirmation
supabase functions deploy send-shipping-notification

# Verify deployment
supabase functions list
```

### Step 5: Update Email Settings

In each Edge Function, update the `from` email:
```typescript
from: 'ShopUp <orders@shopup.gh>', // Use your verified domain
```

For custom domain:
1. Add domain in Resend dashboard
2. Update DNS records (Resend provides these)
3. Verify domain
4. Update functions with custom domain

---

## PART 6: SECURITY CONFIGURATION

### Step 1: Environment Variables

**Never commit these to Git:**
- Supabase URL ✓ (can be public)
- Supabase anon key ✓ (can be public)
- Paystack public key ✓ (can be public)
- Resend API key ✗ (keep secret - in Supabase only)
- Paystack secret key ✗ (never use in frontend)

### Step 2: Enable CORS

Supabase automatically allows your domain.

Verify in Supabase → **Settings** → **API** → **CORS**

### Step 3: Rate Limiting

Enable in Supabase → **Settings** → **API** → **Rate Limiting**

Suggested limits:
- Anonymous: 100 requests/hour
- Authenticated: 500 requests/hour

### Step 4: Database Backups

1. Supabase → **Settings** → **Database**
2. Enable **Automatic Backups**
3. Retention: 7 days (free tier)

---

## PART 7: GO-LIVE CHECKLIST

### Pre-Launch

- [ ] All schemas run successfully
- [ ] Supabase credentials configured
- [ ] Paystack API keys configured
- [ ] Email functions deployed
- [ ] Files uploaded to hosting
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Test admin account created
- [ ] Test customer account created
- [ ] Test seller account created

### Testing in Production

- [ ] Register new customer → Success
- [ ] Login works → Success
- [ ] Create test order → Success
- [ ] Process test payment → Success
- [ ] Receive confirmation email → Success
- [ ] View order in history → Success
- [ ] Seller can view orders → Success
- [ ] Admin can login → Success
- [ ] Admin can view users → Success

### Final Steps

- [ ] Add Terms & Conditions page
- [ ] Add Privacy Policy page
- [ ] Add Contact page
- [ ] Add About page
- [ ] Configure error monitoring (Sentry, LogRocket)
- [ ] Set up analytics (Google Analytics)
- [ ] Configure uptime monitoring
- [ ] Prepare support system

---

## PART 8: MONITORING & MAINTENANCE

### Daily Monitoring

1. **Supabase Dashboard**
   - Check database size
   - Monitor API requests
   - Review error logs

2. **Email Logs**
   - Check `email_logs` table
   - Verify emails sending
   - Monitor failed sends

3. **Paystack Dashboard**
   - Review transactions
   - Check for failed payments
   - Monitor disputes

### Weekly Tasks

- [ ] Review audit logs
- [ ] Check for banned users
- [ ] Monitor order volumes
- [ ] Review seller activity
- [ ] Check system performance

### Monthly Tasks

- [ ] Database backup verification
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature usage analysis
- [ ] Customer feedback review

---

## PART 9: TROUBLESHOOTING

### Common Issues

**Issue:** "Supabase client not defined"
```javascript
// Solution: Ensure supabase-config.js loads first
<script src="supabase-config.js"></script>
```

**Issue:** Paystack popup not opening
```javascript
// Solution: Check public key is correct
// Ensure Paystack script loaded:
<script src="https://js.paystack.co/v1/inline.js"></script>
```

**Issue:** RLS policies blocking access
```sql
-- Solution: Verify user has correct role
SELECT * FROM user_roles WHERE user_id = 'USER_ID';
```

**Issue:** Emails not sending
```bash
# Solution: Check Edge Function logs
supabase functions logs send-order-confirmation

# Verify Resend API key
supabase secrets list
```

**Issue:** 404 errors on page refresh
```
# Solution: Add redirect rules (Netlify)
_redirects file:
/*    /index.html   200
```

---

## PART 10: SCALING CONSIDERATIONS

### When to Upgrade

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth
- Pro: $25/mo (8GB database, 250GB bandwidth)

**Resend:**
- Free: 100 emails/day
- Pro: $20/mo (50,000 emails)

**Netlify:**
- Free: 100GB bandwidth
- Pro: $19/mo (400GB bandwidth)

### Performance Optimization

1. **Database Indexes**
   - Already created in schemas
   - Monitor slow queries

2. **Image Optimization**
   - Use Cloudinary or Imgix
   - Implement lazy loading

3. **Caching**
   - Enable browser caching
   - Use CDN for static assets

4. **Code Splitting**
   - Load scripts asynchronously
   - Minify JavaScript

---

## 📞 SUPPORT RESOURCES

**Supabase:**
- Docs: https://supabase.com/docs
- Support: https://supabase.com/support
- Discord: https://discord.supabase.com

**Paystack:**
- Docs: https://paystack.com/docs
- Support: support@paystack.com
- Phone: +234 1 888 8900

**Resend:**
- Docs: https://resend.com/docs
- Support: support@resend.com

**Netlify:**
- Docs: https://docs.netlify.com
- Support: https://www.netlify.com/support

---

## ✅ DEPLOYMENT COMPLETE!

Your ShopUp platform is now live! 🎉

**Next Steps:**
1. Share link with test users
2. Gather feedback
3. Iterate and improve
4. Market your platform
5. Grow your business!

---

**Deployment Date:** ___/___/_____  
**Deployed By:** _________________  
**Production URL:** _________________
