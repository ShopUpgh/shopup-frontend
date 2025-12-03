# 💰 PAYMENT SPLIT & AD SYSTEM - IMPLEMENTATION GUIDE

## Complete Setup for Revenue Routing & Advertising

**Version:** 1.0  
**Date:** November 17, 2025

---

## 📋 TABLE OF CONTENTS

1. [Payment Split System](#payment-split-system)
2. [Ad System Overview](#ad-system-overview)
3. [Paystack Setup](#paystack-setup)
4. [Frontend Integration](#frontend-integration)
5. [Revenue Projections](#revenue-projections)

---

## 💳 PAYMENT SPLIT SYSTEM

### **How It Works**

```
Customer Order: GH₵110
├─ Product Price: GH₵100
└─ Delivery Fee: GH₵10

Seller on Essential Plan (3% commission)

SERVICE FEE CALCULATION:
├─ Commission: GH₵100 × 3% = GH₵3.00
└─ Transaction Fee: GH₵0.30
= Total Service Fee: GH₵3.30

BUYER PAYS:
Total: GH₵110 + GH₵3.30 = GH₵113.30

PAYSTACK SPLIT:
├─ To Platform (Your Account): GH₵3.30
└─ To Seller Account: GH₵110
```

### **Database Tables Created**

1. **platform_paystack_accounts** - Your Paystack subaccounts
   - Commission account
   - Transaction fees account
   - Subscription account
   - Ad revenue account

2. **seller_paystack_accounts** - Seller bank/MoMo details
   - Settlement bank
   - Account number
   - Mobile Money option
   - Verification status

3. **payment_splits** - Per-transaction breakdown
   - Platform share
   - Seller share
   - Commission rate
   - Transaction fees

4. **settlements** - Actual money transfers
   - Pending/Completed status
   - Paystack references
   - Error tracking

---

## 🎯 AD SYSTEM OVERVIEW

### **Professional, Non-Intrusive Advertising**

Unlike popup ads or full-screen interruptions, ShopUp ads are:
- ✅ **Taskbar ads** - Small, professional banners
- ✅ **Sidebar placements** - Right side of page
- ✅ **Sponsored products** - Highlighted in search
- ✅ **Featured stores** - Top of category pages

### **Ad Placement Types**

| Placement | Location | Size | Best For |
|-----------|----------|------|----------|
| **Taskbar Left** | Logo area | 200×40px | Brand awareness |
| **Taskbar Center** | Center banner | 400×40px | Promotions |
| **Taskbar Right** | Menu area | 300×40px | Quick actions |
| **Banner Top** | Below nav | 1200×90px | Featured products |
| **Banner Sidebar** | Right side | 300×600px | Continuous visibility |
| **Sponsored Product** | Product grid | 250×350px | Direct sales |
| **Featured Store** | Store listings | 400×200px | Seller promotion |
| **Category Top** | Category pages | 1000×120px | Targeted ads |

### **Pricing Models**

1. **CPM** (Cost Per Mille - 1000 impressions)
   - Taskbar: GH₵3-4 per 1000 views
   - Banner: GH₵5 per 1000 views
   - Best for: Brand awareness

2. **CPC** (Cost Per Click)
   - Taskbar: GH₵0.60-0.80 per click
   - Banner: GH₵1.00 per click
   - Best for: Traffic generation

3. **CPA** (Cost Per Action/Conversion)
   - Custom pricing based on order value
   - Best for: Direct sales

4. **Flat Rate** (Package deals)
   - Starter: GH₵50/week
   - Growth: GH₵200/month
   - Premium: GH₵500/month

---

## 🔧 PAYSTACK SETUP

### **Step 1: Create Platform Subaccounts**

You need 4 subaccounts in Paystack:

```javascript
// 1. Commission Account
{
  "business_name": "ShopUp Commission",
  "settlement_bank": "Your Bank Code",
  "account_number": "Your Account Number",
  "percentage_charge": 0 // We'll handle split manually
}

// 2. Transaction Fees Account
{
  "business_name": "ShopUp Transaction Fees",
  "settlement_bank": "Your Bank Code",
  "account_number": "Your Account Number"
}

// 3. Subscription Account
{
  "business_name": "ShopUp Subscriptions",
  "settlement_bank": "Your Bank Code",
  "account_number": "Your Account Number"
}

// 4. Ad Revenue Account
{
  "business_name": "ShopUp Advertising",
  "settlement_bank": "Your Bank Code",
  "account_number": "Your Account Number"
}
```

**Paystack API Call:**
```bash
curl https://api.paystack.co/subaccount \
-H "Authorization: Bearer YOUR_SECRET_KEY" \
-H "Content-Type: application/json" \
-d '{
  "business_name": "ShopUp Commission",
  "settlement_bank": "044",
  "account_number": "0123456789",
  "percentage_charge": 0
}'
```

Save the `subaccount_code` (e.g., `ACCT_xxxxxxxxxx`) for each!

### **Step 2: Update Database**

```sql
-- Update platform accounts with your Paystack codes
UPDATE platform_paystack_accounts 
SET subaccount_code = 'ACCT_commission_code'
WHERE account_type = 'commission';

UPDATE platform_paystack_accounts 
SET subaccount_code = 'ACCT_fees_code'
WHERE account_type = 'transaction_fees';

UPDATE platform_paystack_accounts 
SET subaccount_code = 'ACCT_subscription_code'
WHERE account_type = 'subscription';

UPDATE platform_paystack_accounts 
SET subaccount_code = 'ACCT_ads_code'
WHERE account_type = 'ads';
```

### **Step 3: Seller Onboarding**

When a seller joins:

1. **Collect bank details:**
   - Settlement bank
   - Account number
   - Account name

2. **Create seller subaccount:**
```javascript
async function createSellerSubaccount(seller) {
    const response = await fetch('https://api.paystack.co/subaccount', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_SECRET_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            business_name: seller.business_name,
            settlement_bank: seller.bank_code,
            account_number: seller.account_number,
            percentage_charge: 0 // We handle split manually
        })
    });
    
    const data = await response.json();
    
    // Save to database
    await supabase
        .from('seller_paystack_accounts')
        .insert({
            seller_id: seller.id,
            subaccount_code: data.data.subaccount_code,
            settlement_bank: seller.bank_code,
            account_number: seller.account_number,
            account_name: seller.account_name
        });
}
```

### **Step 4: Payment Split Implementation**

**When customer checks out:**

```javascript
async function processPaymentWithSplit(orderData) {
    // Calculate split
    const split = await calculateSplit(orderData);
    
    // {
    //   total: 113.30,
    //   platform: 3.30,
    //   seller: 110.00
    // }
    
    // Initialize Paystack payment
    const paystack = PaystackPop.setup({
        key: 'YOUR_PUBLIC_KEY',
        email: customer.email,
        amount: split.total * 100, // In kobo
        currency: 'GHS',
        
        // SPLIT PAYMENT CONFIG
        subaccount: seller.subaccount_code,
        transaction_charge: split.platform * 100, // Platform's share
        bearer: 'customer', // Customer pays all fees
        
        callback: function(response) {
            // Payment successful
            verifyPayment(response.reference);
        },
        
        onClose: function() {
            alert('Payment cancelled');
        }
    });
    
    paystack.openIframe();
}
```

**What Happens:**
1. Customer pays GH₵113.30
2. Paystack processes payment
3. **Automatically:**
   - GH₵3.30 → Your commission account
   - GH₵110 → Seller's account
4. Database updated with split details

---

## 🎨 FRONTEND INTEGRATION

### **1. Taskbar Ad Component**

```html
<!-- Add to navigation bar -->
<div class="taskbar-ad-container">
    <div id="taskbar-ad-left" class="taskbar-ad"></div>
    <div id="taskbar-ad-center" class="taskbar-ad"></div>
    <div id="taskbar-ad-right" class="taskbar-ad"></div>
</div>

<style>
.taskbar-ad-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 20px;
    background: #f7fafc;
    border-bottom: 1px solid #e2e8f0;
}

.taskbar-ad {
    height: 40px;
    display: flex;
    align-items: center;
}

.taskbar-ad a {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #2d3748;
    font-size: 0.9em;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.3s;
}

.taskbar-ad a:hover {
    background: #edf2f7;
}

.taskbar-ad img {
    height: 30px;
    margin-right: 8px;
}
</style>

<script>
// Load taskbar ads
async function loadTaskbarAds() {
    const placements = ['taskbar-ad-left', 'taskbar-ad-center', 'taskbar-ad-right'];
    
    for (const placement of placements) {
        const ad = await getAdForPlacement(placement);
        
        if (ad) {
            document.getElementById(placement).innerHTML = `
                <a href="${ad.cta_url}" onclick="trackAdClick('${ad.campaign_id}', '${placement}')">
                    <img src="${ad.ad_image_url}" alt="${ad.ad_title}">
                    <span>${ad.cta_text}</span>
                </a>
            `;
            
            // Track impression
            trackAdImpression(ad.campaign_id, placement);
        }
    }
}

async function getAdForPlacement(placement) {
    const { data } = await supabase.rpc('get_active_ads_for_placement', {
        p_placement_code: placement.toUpperCase().replace('-', '_')
    });
    
    return data?.[0];
}

function trackAdImpression(campaignId, placement) {
    supabase.rpc('track_ad_impression', {
        p_campaign_id: campaignId,
        p_placement_id: placement,
        p_impression_type: 'view'
    });
}

function trackAdClick(campaignId, placement) {
    supabase.rpc('track_ad_impression', {
        p_campaign_id: campaignId,
        p_placement_id: placement,
        p_impression_type: 'click'
    });
}

// Load ads when page loads
document.addEventListener('DOMContentLoaded', loadTaskbarAds);
</script>
```

### **2. Sidebar Ad Component**

```html
<!-- Add to sidebar -->
<div class="sidebar-ad-container">
    <div class="ad-label">Sponsored</div>
    <div id="sidebar-ad"></div>
</div>

<style>
.sidebar-ad-container {
    position: sticky;
    top: 80px;
    width: 300px;
    margin: 20px;
}

.ad-label {
    font-size: 0.75em;
    color: #718096;
    margin-bottom: 8px;
    text-transform: uppercase;
}

#sidebar-ad {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

#sidebar-ad img {
    width: 100%;
    height: auto;
}

#sidebar-ad .ad-content {
    padding: 15px;
}

#sidebar-ad h3 {
    font-size: 1.1em;
    margin-bottom: 8px;
}

#sidebar-ad p {
    font-size: 0.9em;
    color: #718096;
    margin-bottom: 12px;
}

#sidebar-ad .cta-button {
    display: block;
    background: #667eea;
    color: white;
    text-align: center;
    padding: 10px;
    border-radius: 6px;
    text-decoration: none;
}
</style>
```

### **3. Sponsored Product in Grid**

```html
<!-- Add to product grid -->
<div class="product-grid">
    <!-- Regular products -->
    <div class="product-card">...</div>
    
    <!-- Sponsored product (every 6th item) -->
    <div class="product-card sponsored-product">
        <div class="sponsored-badge">Sponsored</div>
        <img src="product-image.jpg">
        <h3>Product Name</h3>
        <p class="price">GH₵99</p>
        <button>Shop Now</button>
    </div>
    
    <!-- More products -->
</div>

<style>
.sponsored-product {
    border: 2px solid #667eea;
    position: relative;
}

.sponsored-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #667eea;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75em;
    font-weight: 600;
}
</style>
```

---

## 💰 REVENUE PROJECTIONS

### **Payment Split Revenue**

```
100 active sellers
Average 10 orders/month per seller = 1,000 orders/month
Average order value: GH₵100

Commission Revenue (by subscription tier):
- Free (50 sellers × 5%): GH₵250/order × 500 orders = GH₵2,500
- Essential (30 sellers × 3%): GH₵150/order × 300 orders = GH₵900
- Pro (15 sellers × 2%): GH₵100/order × 150 orders = GH₵300
- Enterprise (5 sellers × 1%): GH₵50/order × 50 orders = GH₵50

Transaction Fees:
1,000 orders × GH₵0.30 = GH₵300

Total from Payments: GH₵4,050/month = GH₵48,600/year
```

### **Ad Revenue**

```
Taskbar Ads:
- 3 spots × GH₵200/month each = GH₵600/month

Banner Ads:
- Top banner: GH₵500/month
- Sidebar: GH₵300/month

Sponsored Products:
- 10 sellers × GH₵50/month = GH₵500/month

Featured Stores:
- 5 sellers × GH₵100/month = GH₵500/month

Total from Ads: GH₵2,400/month = GH₵28,800/year
```

### **Subscription Revenue**

```
From previous calculations: GH₵6,250/month = GH₵75,000/year
```

### **TOTAL PLATFORM REVENUE**

```
Year 1:
├─ Subscriptions: GH₵75,000
├─ Payment Splits: GH₵48,600
└─ Advertising: GH₵28,800
= GH₵152,400/year (~$10,000 USD)

Year 2 (5x growth):
= GH₵762,000/year (~$50,000 USD)

Year 3 (10x growth):
= GH₵1,524,000/year (~$100,000 USD)
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### **Payment Split System**

- [ ] Create 4 Paystack subaccounts
- [ ] Update database with subaccount codes
- [ ] Test split payment with test card
- [ ] Verify money routes correctly
- [ ] Add seller bank details form
- [ ] Create seller subaccount API integration
- [ ] Test end-to-end payment flow

### **Ad System**

- [ ] Run ad system schema
- [ ] Create ad campaign creation page
- [ ] Build taskbar ad component
- [ ] Build sidebar ad component
- [ ] Implement sponsored products
- [ ] Add impression/click tracking
- [ ] Create advertiser dashboard
- [ ] Set up billing automation

### **Testing**

- [ ] Test payment split (GH₵100 order)
- [ ] Verify platform receives commission
- [ ] Verify seller receives product price
- [ ] Test ad display on all pages
- [ ] Test ad click tracking
- [ ] Test ad billing calculation

---

## 📊 MONITORING

### **Payment Split Monitoring**

```sql
-- Daily commission earned
SELECT 
    DATE(created_at) as date,
    SUM(platform_total) as commission,
    COUNT(*) as orders
FROM payment_splits
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Seller payouts pending
SELECT 
    s.seller_id,
    SUM(s.seller_amount) as pending_payout
FROM payment_splits s
WHERE s.seller_settled = false
GROUP BY s.seller_id;
```

### **Ad Performance**

```sql
-- Top performing ads
SELECT 
    c.campaign_name,
    c.total_impressions,
    c.total_clicks,
    c.ctr,
    c.spent_amount
FROM ad_campaigns c
WHERE c.status = 'active'
ORDER BY c.total_conversions DESC
LIMIT 10;
```

---

## 🚀 NEXT STEPS

1. **This Week:**
   - Set up Paystack subaccounts
   - Update database with codes
   - Test payment split

2. **Next Week:**
   - Build seller bank details page
   - Implement subaccount creation
   - Test live payments

3. **Week 3:**
   - Launch ad system
   - Create first test campaign
   - Monitor performance

---

**You now have a complete revenue system!** 💰

- ✅ Automatic payment splits
- ✅ Professional advertising platform
- ✅ Multiple revenue streams
- ✅ Scalable architecture

**Ready to make money!** 🚀
