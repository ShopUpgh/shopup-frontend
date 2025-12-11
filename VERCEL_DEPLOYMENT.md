# 🚀 ShopUp Ghana - Vercel Deployment Guide

Complete guide for deploying ShopUp to Vercel with all security fixes applied.

## Prerequisites

- ✅ GitHub account with repository access
- ✅ Vercel account (free tier works)
- ✅ Supabase project set up
- ✅ Paystack account (test or live keys)
- ✅ (Optional) Sentry account for error monitoring

---

## Step 1: Prepare Your Repository

### 1.1 Ensure All Security Files Are Present

Verify these files exist:
```bash
.env.example
.gitignore
vercel.json
js/config.js
js/payment-handler.js
js/auth-security.js
js/password-validator.js
scripts/inject-env.js
scripts/validate-env.js
```

### 1.2 Run Environment Validation

```bash
node scripts/validate-env.js
```

Fix any issues reported before proceeding.

---

## Step 2: Deploy Supabase Edge Functions

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login to Supabase

```bash
supabase login
```

### 2.3 Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 2.4 Deploy Edge Functions

```bash
# Deploy payment verification function
supabase functions deploy verify-payment

# Deploy webhook handler
supabase functions deploy paystack-webhook
```

### 2.5 Set Edge Function Secrets

```bash
# Set Paystack secret key
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_your_secret_key

# Verify secrets
supabase secrets list
```

### 2.6 Run Database Migrations

```bash
# Connect to your Supabase SQL Editor
# Run the following SQL file:
psql -h your-project.supabase.co -U postgres -f database/security/rate-limiting.sql
```

---

## Step 3: Connect to Vercel

### 3.1 Create Vercel Account

Go to [vercel.com](https://vercel.com) and sign up with GitHub.

### 3.2 Import Repository

1. Click "Add New Project"
2. Import your GitHub repository
3. Select "shopup-frontend"

### 3.3 Configure Project Settings

**Framework Preset:** Other (Static HTML)  
**Root Directory:** ./  
**Build Command:** `node scripts/inject-env.js`  
**Output Directory:** .  
**Install Command:** `echo 'No dependencies'`

---

## Step 4: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key

# Environment
VITE_ENVIRONMENT=production

# Application
VITE_APP_NAME=ShopUp Ghana
VITE_APP_URL=https://shopup.com.gh
VITE_SUPPORT_EMAIL=support@shopup.com.gh
```

### Security Configuration

```env
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_LOCKOUT_DURATION=15
VITE_MIN_PASSWORD_LENGTH=12
```

### Feature Flags

```env
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_COOKIE_CONSENT=true
```

### Optional: Error Monitoring

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### ⚠️ Important Notes:

- Use `pk_live_...` for production (NOT `pk_test_...`)
- Keep `VITE_SUPABASE_ANON_KEY` (it's safe for frontend)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend variables

---

## Step 5: Deploy to Production

### 5.1 Deploy from Vercel Dashboard

Click "Deploy" in Vercel dashboard.

### 5.2 Monitor Build

Watch the build logs for any errors.

### 5.3 Verify Deployment

Once deployed, visit your Vercel URL and check:

```
✓ Site loads without errors
✓ No API keys visible in page source
✓ Cookie consent banner appears
✓ Legal pages accessible (privacy-policy.html, etc.)
✓ Can create account with strong password
✓ Login works with rate limiting
```

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., shopup.com.gh)
3. Follow DNS configuration instructions

### 6.2 Update DNS Records

Add these records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 6.3 Enable SSL

Vercel automatically provisions SSL certificates. Wait 1-2 minutes.

---

## Step 7: Configure Paystack Webhook

### 7.1 Get Webhook URL

Your webhook URL will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook
```

### 7.2 Add to Paystack Dashboard

1. Log into [dashboard.paystack.com](https://dashboard.paystack.com)
2. Go to Settings → Webhooks
3. Add webhook URL
4. Select events:
   - ✅ charge.success
   - ✅ charge.failed
   - ✅ transfer.success
   - ✅ transfer.failed

### 7.3 Test Webhook

Use Paystack's webhook tester to verify it's receiving events.

---

## Step 8: Security Verification

### 8.1 Check Security Headers

Visit [securityheaders.com](https://securityheaders.com) and enter your URL.

**Target Grade:** B or higher

### 8.2 Verify No Exposed Secrets

1. Open your site
2. Right-click → View Page Source
3. Search for:
   - ❌ No "eyJhbGci" (JWT tokens)
   - ❌ No "pk_test_" or "pk_live_"
   - ❌ No ".supabase.co" URLs hardcoded
   - ✅ Should see `window.__ENV__` with references only

### 8.3 Test Payment Flow

1. Create test account
2. Add item to cart
3. Attempt checkout WITHOUT paying
   - ❌ Should FAIL (no order created)
4. Complete payment properly
   - ✅ Should succeed after verification

### 8.4 Test Rate Limiting

1. Attempt login with wrong password 5 times
2. Should see lockout message
3. Wait 15 minutes or use admin unlock

---

## Step 9: Performance Optimization

### 9.1 Enable Edge Network

Vercel automatically uses their edge network. No action needed.

### 9.2 Check PageSpeed Insights

Visit [pagespeed.web.dev](https://pagespeed.web.dev)

**Target Scores:**
- Mobile: 80+
- Desktop: 90+

---

## Step 10: Monitoring Setup

### 10.1 Enable Vercel Analytics (Optional)

1. Go to Vercel Project Settings → Analytics
2. Enable Analytics
3. View real-time traffic

### 10.2 Configure Sentry (Optional)

If you added `VITE_SENTRY_DSN`:
1. Go to [sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN to Vercel environment variables
4. Test error tracking

---

## Post-Deployment Checklist

### ✅ Functionality Checks

- [ ] Homepage loads correctly
- [ ] User registration with password validation
- [ ] Login with rate limiting
- [ ] Seller verification flow
- [ ] Product listing and search
- [ ] Add to cart functionality
- [ ] Checkout with payment verification
- [ ] Order confirmation emails
- [ ] Legal pages accessible

### ✅ Security Checks

- [ ] No hardcoded secrets visible
- [ ] HTTPS enabled
- [ ] Security headers configured (Grade B+)
- [ ] Payment verification working
- [ ] Rate limiting active
- [ ] Cookie consent banner
- [ ] Privacy policy accessible

### ✅ Compliance Checks

- [ ] Privacy Policy (Ghana DPA compliant)
- [ ] Terms & Conditions
- [ ] Refund Policy
- [ ] Shipping Policy
- [ ] Contact information with Ghana address
- [ ] Cookie consent with preferences

---

## Troubleshooting

### Build Fails

**Error:** "Missing environment variables"
- **Fix:** Add all required variables in Vercel dashboard
- **Check:** Use exact names (including `VITE_` prefix)

### Site Loads But Features Broken

**Error:** "Supabase client not initialized"
- **Fix:** Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- **Check:** Environment variables are in Production scope

### Payment Not Working

**Error:** "Payment verification failed"
- **Fix:** Ensure edge functions are deployed
- **Check:** Paystack secret key is set in Supabase secrets
- **Verify:** Using live key (`pk_live_`) in production

### Rate Limiting Not Working

**Error:** Can attempt login unlimited times
- **Fix:** Run `database/security/rate-limiting.sql` in Supabase
- **Verify:** Functions exist in Supabase SQL Editor

---

## Updating Deployment

### To Update Code

1. Push changes to GitHub
2. Vercel automatically redeploys
3. Monitor build logs

### To Update Environment Variables

1. Go to Vercel Project Settings → Environment Variables
2. Edit variable
3. Redeploy from Deployments page

### To Update Edge Functions

```bash
supabase functions deploy verify-payment
supabase functions deploy paystack-webhook
```

---

## Support

**Deployment Issues:** [Vercel Support](https://vercel.com/support)  
**Supabase Issues:** [Supabase Support](https://supabase.com/support)  
**Paystack Issues:** support@paystack.com  

---

## Next Steps

1. ✅ Monitor error logs in Sentry
2. ✅ Check Vercel Analytics daily
3. ✅ Test payment flow weekly
4. ✅ Review security headers monthly
5. ✅ Update dependencies quarterly

---

**🎉 Congratulations! ShopUp Ghana is now live and secure!**
