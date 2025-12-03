# 📧 Email Notifications Setup Guide

## Overview
Automated email notifications for ShopUp using Supabase Edge Functions and Resend.

## Features
✅ Order confirmation emails
✅ Shipping notification emails  
✅ Beautiful HTML email templates
✅ Automatic triggers on order events
✅ Email delivery logs

---

## Prerequisites

1. **Supabase Account** (you have this)
2. **Resend Account** - Sign up at https://resend.com
3. **Supabase CLI** - Install locally

---

## Step 1: Get Resend API Key

1. Go to https://resend.com/signup
2. Create account (free tier: 100 emails/day)
3. Navigate to **API Keys**
4. Create new API key
5. Copy the key (starts with `re_`)

---

## Step 2: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (with Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or download from: https://github.com/supabase/cli/releases
```

---

## Step 3: Initialize Supabase in Your Project

```bash
# Navigate to your project folder
cd /path/to/shopup

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

**Get YOUR_PROJECT_REF:**
- Go to your Supabase dashboard
- Project Settings → General → Reference ID

---

## Step 4: Create Edge Functions

### Create the functions directory structure:

```bash
mkdir -p supabase/functions/send-order-confirmation
mkdir -p supabase/functions/send-shipping-notification
```

### Copy the function files:

**File 1:** `supabase/functions/send-order-confirmation/index.ts`
- Copy content from `send-order-confirmation-function.ts`

**File 2:** `supabase/functions/send-shipping-notification/index.ts`
- Copy content from `send-shipping-notification-function.ts`

---

## Step 5: Set Resend API Key as Secret

```bash
# Set the secret
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Verify it's set
supabase secrets list
```

---

## Step 6: Deploy Edge Functions

```bash
# Deploy order confirmation function
supabase functions deploy send-order-confirmation

# Deploy shipping notification function
supabase functions deploy send-shipping-notification
```

---

## Step 7: Enable Email Triggers in Database

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL from `03_EMAIL_NOTIFICATIONS_SCHEMA.sql`
3. This creates:
   - `email_logs` table
   - Trigger functions
   - Automatic email triggers

---

## Step 8: Update Your Frontend

### Add email helper to your HTML pages:

```html
<script src="email-notifications.js"></script>
```

### Use in your checkout flow:

```javascript
// After order is created
const emailResult = await window.EmailNotifications.sendOrderConfirmation({
    customerEmail: order.customer_email,
    customerName: order.customer_name,
    orderNumber: order.order_number,
    items: orderItems,
    subtotal: order.subtotal,
    tax: order.tax,
    deliveryFee: order.delivery_fee,
    total: order.total,
    deliveryAddress: order.delivery_address,
    paymentMethod: order.payment_method
});

if (emailResult.success) {
    console.log('✅ Confirmation email sent!');
}
```

---

## Step 9: Test Your Setup

### Test Order Confirmation:

1. Create a test order through your checkout
2. Check your email inbox
3. Verify the email_logs table in Supabase

### Test Shipping Notification:

1. Update an order status to 'shipped'
2. Check email inbox
3. Verify in email_logs

---

## Verification Checklist

- [ ] Resend account created
- [ ] API key obtained
- [ ] Supabase CLI installed
- [ ] Project linked
- [ ] Edge Functions deployed
- [ ] Secrets set
- [ ] Database triggers created
- [ ] Frontend helper added
- [ ] Test email received

---

## Troubleshooting

### Issue: "Function not found"
**Solution:** Make sure you deployed the functions:
```bash
supabase functions deploy send-order-confirmation
```

### Issue: "RESEND_API_KEY not set"
**Solution:** Set the secret again:
```bash
supabase secrets set RESEND_API_KEY=your_key
```

### Issue: "Email not received"
**Solutions:**
1. Check spam folder
2. Verify Resend domain verification
3. Check email_logs table for errors
4. Check Supabase Edge Function logs

### View Edge Function Logs:
```bash
supabase functions logs send-order-confirmation
```

---

## Email Templates

### Order Confirmation Includes:
- Success checkmark
- Order number
- Order items with prices
- Subtotal, tax, delivery fee
- Total amount
- Delivery address
- Payment method
- Track order button

### Shipping Notification Includes:
- Shipping truck icon
- Tracking number
- Carrier information
- Estimated delivery date
- Delivery address
- Track package button
- Delivery tips

---

## Resend Configuration

### Free Tier Limits:
- 100 emails/day
- 3,000 emails/month

### To Use Custom Domain:
1. Add domain in Resend dashboard
2. Update DNS records
3. Verify domain
4. Update `from` address in functions

---

## Alternative: Use Supabase Email (Built-in)

If you prefer Supabase's built-in email:

```javascript
// Using Supabase Auth email templates
const { data, error } = await supabase.auth.admin.generateLink({
    type: 'email',
    email: 'user@example.com',
    options: {
        redirectTo: 'https://yourapp.com/verify'
    }
});
```

**Note:** Supabase Auth emails are limited to authentication flows.
For transactional emails (orders, shipping), Resend is recommended.

---

## Production Recommendations

1. **Use Custom Domain:** Configure in Resend for better deliverability
2. **Monitor Email Logs:** Check `email_logs` table regularly
3. **Set Up Alerts:** Monitor failed emails
4. **Add Retry Logic:** For failed sends
5. **Rate Limiting:** Implement to avoid spam

---

## Cost Estimation

**Resend Pricing:**
- Free: 100 emails/day
- Pro: $20/month for 50,000 emails
- Business: Custom pricing

**For 1000 orders/month:**
- Free tier is sufficient
- Upgrade as you grow

---

## Support

**Resend Docs:** https://resend.com/docs
**Supabase Edge Functions:** https://supabase.com/docs/guides/functions
**Need Help?** Check email_logs table for error messages

---

## Next Steps

After email notifications are working:
1. Add more email templates (order delivered, order cancelled)
2. Add SMS notifications (using Twilio)
3. Add push notifications
4. Create admin email notifications
5. Add email preferences for customers

---

## Files Created

✅ `send-order-confirmation-function.ts` - Order confirmation Edge Function
✅ `send-shipping-notification-function.ts` - Shipping notification Edge Function
✅ `03_EMAIL_NOTIFICATIONS_SCHEMA.sql` - Database triggers and logs
✅ `email-notifications.js` - Frontend helper functions
✅ `EMAIL_SETUP_GUIDE.md` - This setup guide

---

**Ready to send beautiful emails! 📧**
