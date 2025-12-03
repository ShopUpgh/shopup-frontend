# 🚀 ShopUp Phase 3: Backend Setup Guide

## 🎯 What You're Building

You're connecting your ShopUp platform to a **real database** so:
- ✅ User accounts are stored permanently
- ✅ Products are saved to cloud database
- ✅ Orders are tracked in real-time
- ✅ Images are hosted online
- ✅ Everything works across devices!

---

## 📋 STEP-BY-STEP SETUP

### **STEP 1: Create Supabase Project** (5 mins)

1. **Go to** https://supabase.com
2. **Click** "Start your project"
3. **Sign in** with GitHub/Google (or create account)
4. **Click** "New Project"
5. **Fill in:**
   - Organization: Create new or use existing
   - Name: `ShopUp`
   - Database Password: `YOUR-STRONG-PASSWORD` (SAVE THIS!)
   - Region: `Europe West (London)` (closest to Ghana)
6. **Click** "Create new project"
7. **Wait 2-3 minutes** for project to be created ⏳

---

### **STEP 2: Get Your Credentials** (2 mins)

1. **Once project is ready**, go to **Settings** (gear icon on left)
2. **Click** "API" in the settings menu
3. **Copy these TWO values:**
   
   📝 **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   📝 **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   (very long string)
   ```

4. **Save these somewhere safe!** You'll need them in Step 5.

---

### **STEP 3: Create Database Tables** (3 mins)

1. **In Supabase**, click **SQL Editor** (</> icon on left)
2. **Click** "New Query"
3. **Open** `database-schema.sql` file
4. **Copy ALL the SQL** code (the entire file)
5. **Paste** into the Supabase SQL Editor
6. **Click** "Run" (or press Ctrl+Enter)
7. **You should see:** "Success. No rows returned"

✅ **Your database tables are now created!**

Tables created:
- `sellers` - User accounts
- `products` - Product catalog  
- `orders` - Customer orders
- `order_items` - Individual order items
- `customers` - Customer tracking

---

### **STEP 4: Set Up Image Storage** (2 mins)

1. **Click** "Storage" (📦 icon on left)
2. **Click** "New Bucket"
3. **Name:** `product-images`
4. **Make it PUBLIC** ✓ (check the box)
5. **Click** "Create bucket"

✅ **Image storage is ready!**

---

### **STEP 5: Configure Your Frontend** (5 mins)

1. **Open** `supabase-config.js`
2. **Find these lines** (around line 31-32):
   ```javascript
   url: 'https://YOUR-PROJECT-ID.supabase.co',
   anonKey: 'YOUR-ANON-KEY-HERE',
   ```

3. **Replace with YOUR actual values** from Step 2:
   ```javascript
   url: 'https://xxxxxxxxxxxxx.supabase.co',  // Your Project URL
   anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  // Your anon key
   ```

4. **Save the file!**

---

### **STEP 6: Add Supabase to Your HTML Files** (3 mins)

Add this line to the `<head>` section of these files:

**Files to update:**
- `signup.html`
- `login.html`  
- `dashboard.html`
- `add-product.html`
- `products.html`
- `edit-product.html`
- `orders.html`
- `store.html`

**Add this line:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

**Example for signup.html:**
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - ShopUp Seller</title>
    <link rel="stylesheet" href="signup-styles.css">
    
    <!-- ADD THESE TWO LINES -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-config.js"></script>
</head>
```

---

## 🧪 TESTING YOUR BACKEND

### **Test 1: Sign Up**

1. Open `signup.html`
2. Fill out the registration form
3. Click "Create My Store"
4. **Check Supabase Dashboard:**
   - Go to Authentication → Users
   - You should see your new user! ✅
   - Go to Table Editor → sellers
   - You should see your seller profile! ✅

### **Test 2: Login**

1. Open `login.html`
2. Enter your email/password
3. Click "Login"
4. You should be redirected to dashboard ✅

### **Test 3: Add Product**

1. From dashboard, click "Add Product"
2. Fill in product details
3. Upload images
4. Click "Save Product"
5. **Check Supabase Dashboard:**
   - Go to Table Editor → products
   - You should see your product! ✅

### **Test 4: View Products**

1. Click "Products" in sidebar
2. You should see your product from the database! ✅

---

## 🎉 SUCCESS CHECKLIST

After setup, verify:
- [ ] Supabase project created
- [ ] Database tables created (5 tables)
- [ ] Image storage bucket created
- [ ] Credentials added to supabase-config.js
- [ ] Supabase scripts added to all HTML files
- [ ] Can sign up new user
- [ ] Can login
- [ ] Can add product
- [ ] Can view products

---

## 🐛 TROUBLESHOOTING

### Problem: "createClient is not defined"
**Solution:** Add the Supabase CDN script to your HTML `<head>`

### Problem: "Invalid API key"
**Solution:** Double-check your `anonKey` in supabase-config.js

### Problem: "Table does not exist"
**Solution:** Re-run the database-schema.sql in Supabase SQL Editor

### Problem: "RLS policy violation"
**Solution:** The SQL schema includes RLS policies. Make sure you ran the ENTIRE schema file.

### Problem: Can't upload images
**Solution:** Make sure the `product-images` bucket is set to PUBLIC

---

## 📊 WHAT'S NEXT?

After backend is working, you can:

1. **Deploy to Production:**
   - Use Netlify/Vercel for frontend
   - Supabase handles backend automatically
   - Get a custom domain

2. **Add More Features:**
   - Email notifications
   - SMS alerts (Twilio)
   - Payment gateway (Paystack)
   - Analytics dashboard

3. **Scale Your Business:**
   - Supabase free tier: 500MB database, 1GB storage
   - Upgrade when you grow
   - Automatic backups

---

## 💰 PRICING

**Supabase Free Tier:**
- ✅ 500MB database storage
- ✅ 1GB file storage
- ✅ 2GB bandwidth
- ✅ 50,000 monthly active users
- ✅ Social OAuth providers

**Perfect for launching ShopUp!**

Upgrade to Pro ($25/month) when you need more.

---

## 🚀 YOU'RE LIVE!

Once you complete these steps:
- Your ShopUp platform is **PRODUCTION-READY**
- Everything is **stored in the cloud**
- Your store is **accessible from anywhere**
- You're running a **real e-commerce platform**!

**Congratulations! You built ShopUp from scratch!** 🎉

---

**Questions?** Check the Supabase docs: https://supabase.com/docs

**Built with ❤️ for Ghana and Africa**
