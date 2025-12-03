# 🔧 FIX: Update Scripts to Use Real Supabase

## ⚠️ THE PROBLEM

Your signup/login pages are still using the OLD JavaScript files that store data in localStorage instead of Supabase!

## ✅ THE SOLUTION

Replace 2 files with the updated versions:

---

## 📝 STEP 1: Replace Signup Script

1. **Delete** `C:\Projects\ShopUp\signup-script.js`
2. **Download** [signup-script-supabase.js](link)
3. **Rename it to** `signup-script.js`
4. **Move to** `C:\Projects\ShopUp\`

**OR manually:**
- Copy all content from `signup-script-supabase.js`
- Paste it into `signup-script.js` (replace everything)

---

## 📝 STEP 2: Replace Login Script

1. **Delete** `C:\Projects\ShopUp\login-script.js`
2. **Download** [login-script-supabase.js](link)
3. **Rename it to** `login-script.js`
4. **Move to** `C:\Projects\ShopUp\`

**OR manually:**
- Copy all content from `login-script-supabase.js`
- Paste it into `login-script.js` (replace everything)

---

## 🧪 STEP 3: Test Signup Again

1. **Open** `signup.html` in browser
2. **Fill in** the form with NEW details:
   - Email: test@example.com
   - Password: TestPass123
   - Business Name: Test Store
   - etc.
3. **Click** "Create My Store"
4. **Watch browser console** (F12) for any errors

### ✅ What Should Happen:

1. Console shows: "Attempting signup with: test@example.com"
2. Console shows: "Auth user created: [UUID]"
3. Console shows: "Seller profile created: [data]"
4. You see: "✓ Account created successfully!"
5. Redirects to dashboard
6. **Check Supabase:**
   - Authentication → Users → You should see the new user!
   - Table Editor → sellers → You should see the seller profile!

---

## 🐛 IF IT DOESN'T WORK

**Open browser console (F12) and check for errors:**

### Error: "supabase is not defined"
**Fix:** Make sure `supabase-config.js` has your credentials filled in

### Error: "Invalid API key"
**Fix:** Double-check your anon key in `supabase-config.js`

### Error: "Email already registered"
**Fix:** Use a different email address

### Error: "relation 'sellers' does not exist"
**Fix:** Re-run the database schema SQL in Supabase

---

## 📊 VERIFY IN SUPABASE

After successful signup, check:

1. **Authentication → Users**
   - You should see 1 user with your email
   
2. **Table Editor → sellers**
   - Click "sellers" table
   - You should see 1 row with your business info

3. **Both should have the SAME UUID**

---

## 🎯 QUICK CHECKLIST

- [ ] Replaced signup-script.js with supabase version
- [ ] Replaced login-script.js with supabase version
- [ ] supabase-config.js has my Project URL
- [ ] supabase-config.js has my anon key
- [ ] Tried signing up with new email
- [ ] Checked browser console for errors
- [ ] Verified user in Supabase Authentication
- [ ] Verified profile in Supabase sellers table

---

## 💡 WHY THIS HAPPENED

The original `signup-script.js` and `login-script.js` were designed to work with localStorage (for testing without a backend).

Now that you have Supabase, we need the NEW versions that actually call the Supabase API!

---

**Once you replace these 2 files, signup/login will save to REAL database!** 🚀
