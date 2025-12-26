# 🚀 Production Readiness Deployment Guide

## Critical Features Implementation

This guide covers deployment of the 5 critical blockers identified in the pre-production audit:

1. ✅ Payment webhook verification
2. ✅ Stock validation during checkout
3. ✅ VAT calculation (17.5%)
4. ✅ Data export/deletion (GDPR/Act 843 compliance)
5. ✅ Payment callback security

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup

**Run the new SQL schema:**
```bash
# In Supabase SQL Editor, run:
15_PRODUCTION_READINESS_SCHEMA.sql
```

This creates:
- `payment_verifications` table
- `account_deletion_requests` table
- `data_export_logs` table
- `rate_limits` table
- `stock_reservations` table
- `vat_records` table
- `security_audit_log` table

### 2. Supabase Edge Function Deployment

**Deploy payment verification function:**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy verify-payment

# Set environment variables
supabase secrets set PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

### 3. Frontend File Updates

**New files created:**
- `/js/enhanced-checkout.js` - Enhanced checkout with stock validation and VAT
- `/js/data-privacy.js` - GDPR/Act 843 compliance features
- `/customer/privacy-settings.html` - Privacy settings page
- `/supabase/functions/verify-payment/index.ts` - Payment verification Edge Function

**Update existing checkout page:**

In `customer/customer-checkout.html`, replace the inline script with:

```html
<!-- Remove old inline script and add -->
<script src="../js/paystack-config.js"></script>
<script src="../js/enhanced-checkout.js"></script>
```

---

## 🔧 Configuration Steps

### Step 1: Paystack Configuration

1. **Get your Paystack Secret Key:**
   - Go to https://dashboard.paystack.com/#/settings/developer
   - Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)

2. **Set in Supabase:**
   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxx
   ```

3. **Verify public key in `/js/paystack-config.js`:**
   ```javascript
   publicKey: 'pk_live_8f9d31f1db8aa5210a2a4a9510432101a438ffff'
   ```

### Step 2: Enable Row Level Security

All new tables have RLS enabled by default. Verify policies are active:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('payment_verifications', 'account_deletion_requests');
```

### Step 3: Set Up Scheduled Jobs

Configure automatic cleanup of expired stock reservations:

```sql
-- Install pg_cron extension (if not already)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job (runs every 5 minutes)
SELECT cron.schedule(
    'cleanup-expired-reservations',
    '*/5 * * * *',
    'SELECT cleanup_expired_reservations()'
);
```

---

## 🧪 Testing Instructions

### Test 1: Stock Validation

1. Add a product to cart
2. In database, manually set product stock to 0:
   ```sql
   UPDATE products SET stock_quantity = 0 WHERE id = 'product_id';
   ```
3. Try to checkout → Should show error message
4. Reset stock:
   ```sql
   UPDATE products SET stock_quantity = 10 WHERE id = 'product_id';
   ```

### Test 2: VAT Calculation

1. Add items to cart
2. Go to checkout
3. Verify order summary shows:
   - Subtotal
   - Shipping
   - **VAT (17.5%)**
   - Total

Expected calculation:
```
Subtotal: GHS 100.00
Shipping: GHS 20.00
VAT (17.5%): GHS 21.00  [(100 + 20) × 0.175]
Total: GHS 141.00
```

### Test 3: Payment Verification

1. Complete a test checkout with Paystack test card:
   - Card: 5061 2808 1234 5678 014
   - CVV: 123
   - Expiry: Any future date
   - OTP: 123456

2. Check `payment_verifications` table:
   ```sql
   SELECT * FROM payment_verifications 
   ORDER BY created_at DESC LIMIT 1;
   ```

3. Verify:
   - Reference matches
   - Status is 'success'
   - Amount is correct

### Test 4: Data Export

1. Login as customer
2. Navigate to `/customer/privacy-settings.html`
3. Click "Export My Data"
4. Check downloaded JSON file contains:
   - Personal information
   - Orders
   - Addresses
   - Reviews

5. Verify log created:
   ```sql
   SELECT * FROM data_export_logs 
   ORDER BY exported_at DESC LIMIT 1;
   ```

### Test 5: Account Deletion Request

1. In privacy settings page
2. Click "Request Account Deletion"
3. Check database:
   ```sql
   SELECT * FROM account_deletion_requests 
   WHERE status = 'pending';
   ```

---

## 🔒 Security Verification

### Verify Payment Security

**Test that fake payments are blocked:**

1. Open browser console during checkout
2. Try to manipulate payment response (should fail due to server-side verification)
3. Check `security_audit_log` for any suspicious activity:
   ```sql
   SELECT * FROM security_audit_log 
   WHERE severity = 'critical' 
   ORDER BY created_at DESC;
   ```

### Verify Rate Limiting

**Test rate limit function:**

```sql
-- Test login rate limiting (5 attempts per minute)
SELECT check_rate_limit('test_ip', 'ip', 'login', 60, 5);
-- Returns TRUE for first 5 calls, FALSE afterwards
```

---

## 📊 Monitoring Setup

### Daily Checks

1. **Payment Verifications:**
   ```sql
   SELECT 
       DATE(verified_at) as date,
       COUNT(*) as total_payments,
       SUM(CASE WHEN verification_status = 'success' THEN 1 ELSE 0 END) as successful,
       SUM(CASE WHEN verification_status = 'failed' THEN 1 ELSE 0 END) as failed
   FROM payment_verifications
   WHERE verified_at >= NOW() - INTERVAL '7 days'
   GROUP BY DATE(verified_at)
   ORDER BY date DESC;
   ```

2. **Stock Issues:**
   ```sql
   SELECT p.name, p.stock_quantity
   FROM products p
   WHERE p.stock_quantity < 5
   ORDER BY p.stock_quantity ASC;
   ```

3. **VAT Compliance:**
   ```sql
   SELECT 
       gra_filing_period,
       COUNT(*) as orders,
       SUM(vat_amount) as total_vat_collected,
       SUM(total_with_vat) as total_revenue
   FROM vat_records
   WHERE created_at >= NOW() - INTERVAL '1 month'
   GROUP BY gra_filing_period
   ORDER BY gra_filing_period DESC;
   ```

4. **Security Events:**
   ```sql
   SELECT 
       event_type,
       COUNT(*) as occurrences,
       MAX(created_at) as last_occurrence
   FROM security_audit_log
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY event_type
   ORDER BY occurrences DESC;
   ```

---

## 🚨 Troubleshooting

### Issue: Payment verification fails

**Solution:**
1. Check Paystack secret key is set correctly:
   ```bash
   supabase secrets list
   ```
2. Verify Edge Function is deployed:
   ```bash
   supabase functions list
   ```
3. Check Edge Function logs:
   ```bash
   supabase functions logs verify-payment
   ```

### Issue: Stock not updating after order

**Solution:**
1. Check if cleanup function is running:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-reservations';
   ```
2. Manually run cleanup:
   ```sql
   SELECT cleanup_expired_reservations();
   ```

### Issue: VAT calculation incorrect

**Solution:**
1. Verify VAT rate in code matches Ghana's current rate (17.5%):
   ```javascript
   // In enhanced-checkout.js
   const VAT_RATE = 0.175;
   ```
2. Clear browser cache
3. Test calculation manually

### Issue: Data export fails

**Solution:**
1. Check browser console for errors
2. Verify user is authenticated:
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log(user);
   ```
3. Check Supabase table permissions

---

## 📱 Customer Support Script

For handling customer inquiries about new features:

**Stock Unavailability:**
> "I apologize for the inconvenience. Our system now validates stock in real-time to prevent overselling. The item you're trying to purchase is currently out of stock. We'll notify you when it's back in stock."

**VAT Questions:**
> "As required by Ghana Revenue Authority, all prices include 17.5% VAT. You'll see the VAT breakdown during checkout. Your receipt will show both the pre-VAT and total amount for your records."

**Data Privacy:**
> "You can access your privacy settings from your dashboard. There you can export all your data or request account deletion as guaranteed by Ghana's Data Protection Act (Act 843)."

---

## ✅ Launch Readiness Checklist

Before going live, verify:

- [ ] Database schema deployed (15_PRODUCTION_READINESS_SCHEMA.sql)
- [ ] Payment verification Edge Function deployed
- [ ] Paystack secret key configured in Supabase
- [ ] Enhanced checkout script integrated
- [ ] Privacy settings page accessible
- [ ] Stock validation tested
- [ ] VAT calculation verified (17.5%)
- [ ] Payment verification tested
- [ ] Data export tested
- [ ] Rate limiting enabled
- [ ] Scheduled jobs configured
- [ ] Monitoring queries saved
- [ ] Customer support team briefed

---

## 🎯 Success Metrics

After deployment, monitor these KPIs:

1. **Payment Success Rate:** Should be >95%
2. **Stock Overselling:** Should be 0
3. **VAT Compliance:** 100% of orders with VAT recorded
4. **Data Export Requests:** Track and fulfill within 30 days
5. **Security Events:** Monitor for unusual activity

---

## 📞 Support

For deployment issues:
- **Technical Support:** tech@shopup.gh
- **Supabase Issues:** Check Supabase Dashboard → Settings → Support
- **Paystack Issues:** support@paystack.com

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Verified By:** _____________

**Status:** 🟢 Ready for Production
