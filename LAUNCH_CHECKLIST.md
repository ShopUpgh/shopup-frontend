# 🚀 ShopUp Ghana - Pre-Launch Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

---

## 📋 Pre-Deployment Checks

### Environment Configuration

- [ ] Copy `.env.example` to create local `.env.local` for testing
- [ ] All environment variables configured in Vercel
- [ ] Using **LIVE** Paystack key (`pk_live_...`) not test key
- [ ] Supabase project in **PRODUCTION** mode
- [ ] `VITE_ENVIRONMENT=production` set in Vercel
- [ ] Run `node scripts/validate-env.js` passes without errors

### Supabase Setup

- [ ] Database schema deployed (`database/security/rate-limiting.sql`)
- [ ] Edge function `verify-payment` deployed
- [ ] Edge function `paystack-webhook` deployed  
- [ ] Supabase secrets set: `PAYSTACK_SECRET_KEY`
- [ ] RLS policies enabled and tested
- [ ] Service role key NOT exposed in frontend code

### Payment Configuration

- [ ] Paystack account verified and live mode enabled
- [ ] Webhook URL configured: `https://YOUR_PROJECT.supabase.co/functions/v1/paystack-webhook`
- [ ] Webhook events selected: charge.success, charge.failed
- [ ] Test transaction completed successfully
- [ ] Payment verification working (orders rejected without payment)

### Security Verification

- [ ] View page source - NO API keys visible
- [ ] Search source for "eyJ" - NOT FOUND
- [ ] Search source for "pk_test" or "pk_live" - NOT FOUND
- [ ] SecurityHeaders.com grade: **B or higher**
- [ ] HTTPS enabled and forced
- [ ] Rate limiting tested (5 failed logins → lockout)
- [ ] Strong password validation working

### Legal Compliance

- [ ] Privacy Policy accessible at `/privacy-policy.html`
- [ ] Terms & Conditions accessible at `/terms-and-conditions.html`
- [ ] Refund Policy accessible at `/refund-policy.html`
- [ ] Shipping Policy accessible at `/shipping-policy.html`
- [ ] Contact page with Ghana address and phone
- [ ] Cookie consent banner appears on first visit
- [ ] All legal pages linked in footer

### Functionality Testing

#### Authentication
- [ ] User registration with strong password requirements
- [ ] Email verification (if enabled)
- [ ] Login with rate limiting (test 5 failures)
- [ ] Password reset flow works
- [ ] Account lockout after 5 failed attempts
- [ ] Lockout expires after 15 minutes

#### Seller Flow
- [ ] Seller registration with verification
- [ ] Product listing creation
- [ ] Product images upload correctly
- [ ] Product categories work
- [ ] Seller dashboard accessible

#### Buyer Flow
- [ ] Browse products
- [ ] Search functionality
- [ ] Add to cart
- [ ] Update cart quantities
- [ ] Remove from cart
- [ ] Checkout form validation
- [ ] Ghana digital address field
- [ ] Phone number validation (Ghana format)

#### Payment Flow
- [ ] Select payment method
- [ ] Paystack modal opens
- [ ] Test payment with CARD
- [ ] Test payment with MOBILE MONEY
- [ ] Payment verification happens BEFORE order creation
- [ ] Order confirmation email sent
- [ ] Order appears in dashboard
- [ ] Seller receives notification

#### Order Management
- [ ] Customer can view order history
- [ ] Order status updates work
- [ ] Seller can manage orders
- [ ] Order tracking information displayed

### Performance

- [ ] PageSpeed Insights Mobile: **80+**
- [ ] PageSpeed Insights Desktop: **90+**
- [ ] Images optimized and compressed
- [ ] No console errors on any page
- [ ] All pages load in under 3 seconds

### Mobile Responsiveness

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] All buttons clickable on mobile
- [ ] Forms easy to fill on mobile
- [ ] Payment modal works on mobile
- [ ] Legal pages readable on mobile

### Monitoring & Logging

- [ ] Sentry DSN configured (if using)
- [ ] Test error captured in Sentry
- [ ] Health check endpoint responds: `/api/health`
- [ ] Vercel Analytics enabled (optional)
- [ ] Error logs viewable in Supabase

---

## 🧪 End-to-End Test Scenarios

### Test 1: Complete Purchase Flow

1. [ ] Create new account with strong password
2. [ ] Verify email (if required)
3. [ ] Browse products
4. [ ] Add 3 items to cart
5. [ ] Go to checkout
6. [ ] Fill delivery information with Ghana digital address
7. [ ] Complete payment with Mobile Money
8. [ ] Verify payment processed
9. [ ] Check order appears in account
10. [ ] Verify order confirmation email received

**Expected Result:** ✅ Order created AFTER payment verification

### Test 2: Failed Payment Scenario

1. [ ] Add items to cart
2. [ ] Go to checkout
3. [ ] Fill information
4. [ ] Close payment modal without paying
5. [ ] Verify NO order was created

**Expected Result:** ✅ Order NOT created without payment

### Test 3: Security Tests

1. [ ] View page source
2. [ ] Search for API keys - should NOT find any
3. [ ] Try 5 wrong passwords
4. [ ] Account locked for 15 minutes
5. [ ] Try SQL injection in search box
6. [ ] No errors or database exposure

**Expected Result:** ✅ All security measures working

---

## 🌍 Post-Deployment Verification

### Immediately After Deploy

- [ ] Visit production URL
- [ ] Homepage loads without errors
- [ ] Open browser console - no errors
- [ ] Legal pages load correctly
- [ ] Cookie consent banner appears
- [ ] Test user registration
- [ ] Test login
- [ ] Test complete purchase (small amount)

### Within 24 Hours

- [ ] Monitor Sentry for errors
- [ ] Check Vercel Analytics for traffic
- [ ] Review Supabase logs for issues
- [ ] Verify payment webhook received events
- [ ] Check email delivery working

### Within 1 Week

- [ ] SecurityHeaders.com recheck
- [ ] Google PageSpeed recheck
- [ ] Test on 5+ different devices
- [ ] Review customer feedback
- [ ] Check for any security alerts

---

## 🚨 Rollback Plan

If critical issues found after launch:

1. **Immediate Actions:**
   - [ ] Revert to previous Vercel deployment
   - [ ] Put maintenance page up
   - [ ] Notify customers via email

2. **Investigation:**
   - [ ] Check Sentry errors
   - [ ] Review Vercel build logs
   - [ ] Check Supabase logs
   - [ ] Identify root cause

3. **Fix & Redeploy:**
   - [ ] Fix issue in development
   - [ ] Test thoroughly
   - [ ] Deploy fix
   - [ ] Verify fix works
   - [ ] Remove maintenance page

---

## 📞 Emergency Contacts

**Technical Lead:** [Name] - [Phone] - [Email]  
**Product Owner:** [Name] - [Phone] - [Email]  
**Vercel Support:** https://vercel.com/support  
**Supabase Support:** https://supabase.com/support  
**Paystack Support:** support@paystack.com  

---

## ✅ Final Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **Developer** | ___________ | ___/___/___ | ✓ |
| **QA Tester** | ___________ | ___/___/___ | ✓ |
| **Security** | ___________ | ___/___/___ | ✓ |
| **Product Owner** | ___________ | ___/___/___ | ✓ |

---

**Status:** 🟢 READY FOR LAUNCH

**Launch Date:** _______________

**Launch Time:** _______________ GMT

---

## 📊 Success Metrics (Week 1)

Track these metrics after launch:

- **Uptime:** Target 99.9%
- **Error Rate:** < 0.1%
- **Page Load Time:** < 3 seconds
- **Payment Success Rate:** > 95%
- **User Registration:** Track daily
- **Security Incidents:** Target 0

**Weekly Review:** Schedule for one week post-launch to review metrics and address any issues.

---

🎉 **Good luck with your launch!**
