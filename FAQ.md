# ❓ SHOPUP - FREQUENTLY ASKED QUESTIONS (FAQ)

## Complete FAQ Guide for ShopUp Platform

**Last Updated:** November 17, 2025

---

## 📋 TABLE OF CONTENTS

1. [General Questions](#general-questions)
2. [Setup & Configuration](#setup--configuration)
3. [Customer Features](#customer-features)
4. [Seller Features](#seller-features)
5. [Admin Features](#admin-features)
6. [Payments & Transactions](#payments--transactions)
7. [Email Notifications](#email-notifications)
8. [Security & Privacy](#security--privacy)
9. [Troubleshooting](#troubleshooting)
10. [Deployment & Hosting](#deployment--hosting)

---

## GENERAL QUESTIONS

### What is ShopUp?

ShopUp is a complete e-commerce platform designed specifically for African markets (particularly Ghana). It enables small businesses to transition from social media selling to professional online storefronts.

### Who is ShopUp for?

- **Small business sellers** in Ghana/West Africa
- **Individual entrepreneurs** selling products online
- **Small e-commerce platforms** needing a ready-made solution
- **Developers** looking for a production-ready e-commerce template

### What makes ShopUp different?

- **Ghana-specific features:** Mobile Money, digital addresses, local payment methods
- **Production-ready:** Fully functional out of the box
- **No frameworks:** Pure JavaScript, easy to customize
- **Complete documentation:** Everything you need is included
- **Free to start:** Use free tiers of Supabase, Netlify, etc.

### How much does it cost to run ShopUp?

**Free Tier (Small Scale):**
- Supabase: Free (500MB DB, 2GB bandwidth)
- Netlify: Free (100GB bandwidth)
- Resend: Free (100 emails/day)
- Paystack: Pay-per-transaction (1.5% + GH₵0.30)
- **Total: $0/month**

**Pro Tier (Growing Business):**
- Supabase: $25/month
- Netlify: $19/month
- Resend: $20/month
- **Total: ~$64/month**

### Is ShopUp open source?

No, ShopUp is proprietary software owned by Alden's Innovations. However, you own your installation and can customize it for your needs.

---

## SETUP & CONFIGURATION

### How long does setup take?

- **Quick setup:** 30 minutes (basic configuration)
- **Complete setup:** 2-3 hours (including email functions, testing)
- **Full customization:** 1-2 days (branding, content, etc.)

### What do I need to get started?

**Required:**
- Supabase account (free)
- Paystack account (free, verification takes 1-2 days)
- Web hosting (Netlify/Vercel/GitHub Pages)
- Text editor (VS Code, Sublime, etc.)

**Optional:**
- Resend account (for emails)
- Custom domain
- Logo/branding assets

### Do I need coding knowledge?

**Basic setup:** No coding needed, follow the guide
**Customization:** Basic HTML/CSS helpful
**Advanced features:** JavaScript knowledge recommended

### Can I use this without Supabase?

Technically yes, but you'd need to rewrite the entire backend. Supabase is core to the architecture. Consider it a requirement.

### Can I change the design/colors?

Yes! All colors are defined in CSS. You can customize:
- Color scheme
- Fonts
- Layout
- Logo
- All text content

---

## CUSTOMER FEATURES

### Can customers track their orders?

Yes! Customers get:
- Real-time order status updates
- Visual tracking timeline
- Email notifications
- Order history with filtering

### What information do customers need to register?

- Full name
- Email address
- Phone number (Ghana format)
- Password (8+ characters)

Optional:
- Date of birth
- Gender
- Profile picture

### Can customers save multiple addresses?

Yes! Customers can:
- Add unlimited delivery addresses
- Set a default address
- Edit addresses anytime
- Delete non-default addresses

### Can customers reorder previous purchases?

Yes! The "Order Again" button:
- Loads all items from a past order
- Adds them to cart
- Customer can modify and checkout

### Can customers cancel orders?

Yes, but with restrictions:
- **Can cancel:** Pending, Confirmed orders
- **Cannot cancel:** Processing, Shipped, Delivered orders
- Cancellation updates order status immediately

---

## SELLER FEATURES

### How do sellers add products?

1. Login to seller dashboard
2. Navigate to Products
3. Click "Add Product"
4. Fill in details (name, price, description, etc.)
5. Upload image
6. Save

Products appear immediately in storefront.

### Can sellers manage inventory?

Yes! Sellers can:
- Set stock quantities
- Track inventory levels
- Get low stock alerts (future feature)
- Update quantities anytime

### What analytics do sellers get?

- Total revenue (daily, weekly, monthly)
- Total orders by status
- Average order value
- Top selling products (by revenue/units)
- Revenue charts over time
- Payment method distribution
- Category performance

### Can sellers export data?

Currently: No built-in export
Workaround: Copy data from Supabase dashboard
Future: CSV/Excel export planned for v1.1

### How do sellers fulfill orders?

1. View orders in Orders page
2. Update status: Pending → Confirmed
3. Process order: Confirmed → Processing
4. Add tracking number
5. Mark as shipped: Processing → Shipped
6. Customer receives shipping email
7. Update to delivered when customer receives

---

## ADMIN FEATURES

### What can admins do?

- View all users (customers, sellers)
- Ban/unban users
- View all orders platform-wide
- View platform analytics
- Update platform settings
- View audit logs (all admin actions)
- Moderate products (future)

### How do I create an admin account?

1. Create regular user account
2. Get the user ID from Supabase Auth
3. Run SQL command:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('USER_ID_HERE', 'admin');
   ```

### Can there be multiple admins?

Yes! Add as many admin users as needed using the SQL command above.

### What's the difference between admin and moderator?

**Admin:**
- Full platform access
- Can manage settings
- Can manage roles
- Can view all data

**Moderator:**
- Can view users/orders
- Can ban users
- Can delete products
- Cannot change settings

### Can admins view all transactions?

Yes, admins can see:
- All orders
- All payment transactions
- Revenue statistics
- User purchase history

---

## PAYMENTS & TRANSACTIONS

### What payment methods are supported?

1. **Card Payments**
   - Visa, Mastercard, Verve
   - International cards
   - 3D Secure enabled

2. **Mobile Money**
   - MTN Mobile Money
   - Vodafone Cash
   - AirtelTigo Money

3. **Bank Transfer**
   - Direct bank transfers
   - Manual verification

4. **Cash on Delivery**
   - Pay upon receipt
   - Available in select areas

### Are payments secure?

Yes! Security features:
- Paystack is PCI DSS Level 1 certified
- No card data stored on your server
- All transactions encrypted (SSL/TLS)
- Tokenized payment processing
- Supabase backend security

### What are Paystack fees?

**Local cards (Ghana):**
- 1.5% + GH₵0.30 per transaction

**International cards:**
- 3.5% + GH₵0.30 per transaction

**Mobile Money:**
- 1.5% + GH₵0.30 per transaction

**No setup fee, no monthly fee**

### How do I test payments?

Use Paystack test cards:
- **Card Number:** 5061 2808 1234 5678 014
- **CVV:** 123
- **Expiry:** Any future date
- **OTP:** 123456

Test mode transactions don't charge real money.

### When do sellers get paid?

This depends on your Paystack settlement settings:
- **Daily settlements** (default)
- **Weekly settlements**
- **Manual settlements**

Configure in Paystack Dashboard → Settings → Settlements

### Can customers get refunds?

Feature is built into the schema (`refunds` table) but needs manual processing currently. Automatic refunds planned for v1.1.

---

## EMAIL NOTIFICATIONS

### What emails are sent automatically?

1. **Order Confirmation** - When order is placed
2. **Shipping Notification** - When order ships

Future emails:
- Order delivered
- Password reset
- Welcome email
- Promotional emails

### Why aren't emails sending?

Common issues:
1. **Resend API key not set** - Run `supabase secrets list`
2. **Edge Functions not deployed** - Run `supabase functions deploy`
3. **Database triggers not created** - Run email schema SQL
4. **Wrong email in Edge Function** - Update 'from' address

### Can I customize email templates?

Yes! Edit the HTML in the Edge Function files:
- `send-order-confirmation-function.ts`
- `send-shipping-notification-function.ts`

### How do I check if emails were sent?

Query the `email_logs` table:
```sql
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Status values:
- `pending` - Queued to send
- `sent` - Successfully delivered
- `failed` - Error occurred

### Can I use a different email service?

Yes, but you'll need to rewrite the Edge Functions. Current setup uses Resend. Alternatives:
- SendGrid
- AWS SES
- Mailgun
- Postmark

---

## SECURITY & PRIVACY

### Is customer data secure?

Yes! Security measures:
- Supabase RLS (Row Level Security)
- Encrypted passwords (bcrypt)
- HTTPS encryption
- No sensitive data in frontend
- JWT-based authentication

### Can users see other users' data?

No! RLS policies ensure:
- Customers only see their own orders
- Sellers only see their own products/orders
- Admins see everything (with proper role)
- Database-level enforcement

### How are passwords stored?

- Hashed using bcrypt (one-way encryption)
- Never stored in plain text
- Cannot be retrieved, only reset
- Minimum 8 characters required

### Is the platform GDPR compliant?

Partially ready:
- ✅ User data can be deleted
- ✅ Passwords encrypted
- ✅ Privacy by design (RLS)
- ⚠️ Need to add: Privacy policy, cookie consent, data export

### Can I delete user data?

Yes! When you delete a user:
- User account deleted from `auth.users`
- Related data cascades (due to foreign keys)
- Orders preserved but customer info nullified

---

## TROUBLESHOOTING

### "Supabase client not defined" error

**Solution:**
```html
<!-- Ensure this loads FIRST -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<!-- Then your page scripts -->
<script src="your-script.js"></script>
```

### Paystack popup not opening

**Solutions:**
1. Check Paystack script is loaded:
   ```html
   <script src="https://js.paystack.co/v1/inline.js"></script>
   ```
2. Verify public key is correct (starts with `pk_test_` or `pk_live_`)
3. Check browser console for errors
4. Try different browser (disable popup blockers)

### RLS policies blocking my queries

**Solutions:**
1. Verify you're logged in:
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log(session); // Should not be null
   ```
2. Check user has correct role:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
   ```
3. Review RLS policies in Supabase Dashboard → Database → Policies

### Images not displaying

**Common causes:**
1. **Incorrect path** - Check image URL
2. **CORS issue** - Enable CORS in Supabase Storage
3. **Large file** - Optimize images (<500KB recommended)
4. **Format** - Use JPG, PNG, WebP

### Orders not appearing in dashboard

**Check:**
1. Correct user logged in?
2. Order `seller_id` matches logged-in user?
3. RLS policies enabled on `orders` table?
4. Check browser console for errors

### 404 errors when refreshing pages

**Solution for Netlify:**
Create `_redirects` file:
```
/*    /index.html   200
```

**Solution for Vercel:**
Create `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## DEPLOYMENT & HOSTING

### Which hosting should I use?

**Recommended: Netlify**
- Easiest setup (drag & drop)
- Free SSL
- Custom domains
- Automatic deployments

**Also good:**
- Vercel (similar to Netlify)
- GitHub Pages (free, simple)
- AWS S3 + CloudFront (advanced)

### How do I add a custom domain?

**Netlify:**
1. Go to Site settings → Domain management
2. Add custom domain
3. Update DNS at your domain registrar:
   - Type: CNAME
   - Name: www
   - Value: your-site.netlify.app

**SSL automatically enabled!**

### Can I host on my own server?

Yes! Requirements:
- Web server (Apache/Nginx)
- HTTPS certificate
- Just upload files

Note: Supabase handles backend, so your server only serves HTML/JS files.

### How do I update after deployment?

1. Make changes locally
2. Test thoroughly
3. Upload updated files
4. Hosting auto-deploys (Netlify/Vercel)
5. Or manually upload to server

### Should I use test or live keys?

**Development/Testing:** Use test keys
- Paystack: `pk_test_...`
- Test cards don't charge money

**Production:** Use live keys
- Paystack: `pk_live_...` (after account verification)
- Real transactions

Never use live keys for testing!

---

## PERFORMANCE & SCALING

### How many users can ShopUp handle?

Depends on your Supabase tier:
- **Free:** ~500 concurrent connections
- **Pro:** ~1,500 concurrent connections
- **Enterprise:** Unlimited

For most small businesses, free tier is sufficient.

### How do I improve page load speed?

1. **Optimize images:**
   - Use WebP format
   - Compress to <200KB
   - Use image CDN (Cloudinary)

2. **Enable caching:**
   - Browser caching headers
   - CDN for static files

3. **Minify code:**
   - Minify JavaScript
   - Minify CSS
   - Remove console.logs

4. **Lazy load:**
   - Load images as they appear
   - Split large JavaScript files

### Can I add more features?

Yes! The codebase is yours to customize. Popular additions:
- Product reviews & ratings
- Wishlist
- Live chat support
- Social media sharing
- Coupon codes
- Gift cards

---

## SUPPORT & HELP

### Where can I get help?

1. **Documentation:**
   - README.md
   - DEPLOYMENT_GUIDE.md
   - PROJECT_DOCUMENTATION.md

2. **Community:**
   - Supabase Discord
   - Paystack Support

3. **Email Support:**
   - support@shopup.gh

### How do I report a bug?

Email: support@shopup.gh

Include:
- Browser & version
- Steps to reproduce
- Screenshots
- Error messages from console

### Can I hire someone to help?

Yes! For custom development:
- partnerships@shopup.gh
- Include project requirements
- Budget range
- Timeline

### Is there a demo available?

Check the README.md for demo links, or deploy your own instance for testing.

---

## PRICING & LICENSING

### Can I use this for commercial purposes?

Yes, but review the license terms. You can use ShopUp for your business, but you cannot:
- Resell ShopUp as your own product
- Distribute the source code
- Create competing products

### Can I white-label ShopUp?

Contact partnerships@shopup.gh for white-label licensing.

### What happens if I exceed free tier limits?

Supabase/Netlify will prompt you to upgrade. Your site continues working, but may be slower during high traffic.

---

## UPDATES & ROADMAP

### How do I get updates?

Updates will be released periodically. Check:
- GitHub (if provided)
- Email announcements
- Documentation changelog

### What's coming in future versions?

**Version 1.1 (Q1 2026):**
- Product reviews
- Advanced search
- Inventory management
- Bulk uploads

**Version 2.0 (Q2 2026):**
- Mobile apps
- Multi-currency
- Subscription plans
- Advanced analytics

---

## QUICK ANSWERS

**Q: Is coding required?**  
A: No for basic setup, yes for customization.

**Q: How much does it cost?**  
A: $0 to start (free tiers), ~$64/mo for growing businesses.

**Q: Is it secure?**  
A: Yes, uses industry-standard security practices.

**Q: Can I accept international payments?**  
A: Yes, Paystack supports international cards.

**Q: Does it work on mobile?**  
A: Yes, fully responsive design.

**Q: Can I customize the design?**  
A: Yes, all CSS is editable.

**Q: Do I need Supabase?**  
A: Yes, it's core to the architecture.

**Q: Can I use my own domain?**  
A: Yes, custom domains supported.

**Q: Is support included?**  
A: Community support yes, premium support available.

**Q: Can I migrate existing products?**  
A: Yes, via CSV import (coming soon) or manual entry.

---

**Still have questions?**  
Email: support@shopup.gh

**Want to contribute?**  
Email: partnerships@shopup.gh

---

**Last Updated:** November 17, 2025  
**Version:** 1.0
