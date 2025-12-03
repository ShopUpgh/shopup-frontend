# ⚡ GOD MODE SETUP GUIDE

## Military-Grade Owner-Only Access System

**Classification:** RESTRICTED  
**Access Level:** OWNER ONLY  
**Created For:** Al (Alden's Innovations)

---

## 🎯 WHAT IS GOD MODE?

God Mode is an exclusive, sovereign access system that gives you (and ONLY you) complete control over the entire ShopUp platform. No one else—not co-founders, employees, super-admins, or future investors—will ever have this level of access unless you explicitly grant it.

---

## 🔐 TRIPLE-LAYER SECURITY

### Layer 1: YubiKey 5C NFC ✅
**You have:** Yubico YubiKey 5C NFC (USB-C + NFC)

**Purpose:** Hardware authentication token  
**Protection:** Physical key required for access  
**Backup:** Keep in secure location (safe, bank vault)

### Layer 2: Biometric Verification ✅
**Methods:**
- Fingerprint (TouchID/FaceID)
- Face recognition
- Iris scan (if available)

**Purpose:** Verify it's actually you  
**Protection:** Can't be stolen or replicated

### Layer 3: Bitkey (Optional) ✅
**You have:** Bitkey Bitcoin Hardware Wallet

**Purpose:** Additional hardware security layer  
**Protection:** Multi-signature verification  
**Backup:** Keep separate from YubiKey

---

## 📋 SETUP CHECKLIST

### Part 1: YubiKey Registration (30 minutes)

1. **Register YubiKey with Supabase**
   ```sql
   -- Run this ONCE to register YOUR YubiKey
   INSERT INTO god_mode_users (
       user_id,
       full_name,
       email,
       yubikey_serial,
       yubikey_public_key,
       fingerprint_hash,
       recovery_phrase_hash,
       recovery_email,
       recovery_phone
   ) VALUES (
       'YOUR_USER_ID_FROM_SUPABASE_AUTH',
       'Al (Alden\'s Innovations)',
       'your_email@aldensgh.com',
       'YUBIKEY_SERIAL_NUMBER', -- Find on YubiKey package
       'YUBIKEY_PUBLIC_KEY', -- Generated in next step
       'FINGERPRINT_HASH', -- Generated via WebAuthn
       'RECOVERY_PHRASE_HASH', -- Create 24-word recovery phrase
       'backup_email@aldensgh.com',
       '+233241234567'
   );
   ```

2. **Get YubiKey Serial Number**
   - Located on YubiKey packaging
   - Or use Yubico Authenticator app
   - Format: Usually 8-digit number

3. **Generate YubiKey Public Key**
   ```bash
   # On Mac/Linux
   ykman oath accounts list
   
   # Or use online YubiKey Manager
   # https://www.yubico.com/products/services-software/download/yubikey-manager/
   ```

4. **Test YubiKey**
   - Plug into USB-C port
   - Or hold against phone (NFC)
   - Should see LED blink

### Part 2: Biometric Setup (15 minutes)

1. **Enable WebAuthn on your device**
   - iOS: Settings → Face ID & Passcode
   - Android: Settings → Security → Biometrics
   - Mac: System Preferences → Touch ID
   - Windows: Settings → Accounts → Sign-in options

2. **Register Fingerprint/Face**
   - Follow device instructions
   - Register at least 2 fingerprints (backup)

3. **Test Biometric**
   - Go to god-mode.html
   - Click "Scan Fingerprint"
   - Should prompt for biometric

### Part 3: Emergency Recovery (15 minutes)

1. **Create 24-Word Recovery Phrase**
   ```
   Example format:
   
   abandon ability able about above absent absorb abstract
   absurd abuse access accident account accuse achieve acid
   acoustic acquire across act action actor actress actual
   ```

2. **Store Recovery Phrase Securely**
   - **Option 1:** Write on paper, store in safe
   - **Option 2:** Metal backup (fireproof)
   - **Option 3:** Bank safety deposit box
   
   ⚠️ **NEVER:**
   - Store digitally
   - Take photos
   - Email or cloud storage
   - Share with anyone

3. **Set Recovery Contacts**
   - Backup email (different from main)
   - Backup phone number
   - Trusted contact (optional)

---

## 🚀 ACCESSING GOD MODE

### Step 1: Normal Login
1. Login to ShopUp admin (admin-login.html)
2. Enter email + password

### Step 2: Navigate to God Mode
```
https://shopup.gh/god-mode.html
```

⚠️ **DO NOT share this URL with anyone**

### Step 3: Triple Authentication

**Screen 1: YubiKey**
- Hold YubiKey against phone for 5 seconds (NFC)
- Or plug into USB-C port
- LED will blink → Touch the gold contact
- Status changes to ✅

**Screen 2: Biometric**
- Click "Scan Fingerprint"
- Use TouchID/FaceID/Fingerprint
- Status changes to ✅

**Screen 3: Bitkey (Optional)**
- Auto-verified for now
- Future: Require signature from Bitkey

**Screen 4: Activation**
- Click "⚡ ACTIVATE GOD MODE"
- God Mode menu appears

---

## 👑 GOD MODE CAPABILITIES

### 1. Impersonate Any User
```
What: View platform as any user
How: Enter user ID
Use: Customer support, debugging
```

### 2. Database Management
```
What: Edit/delete ANY record
How: Direct Supabase access
Use: Data corrections, emergencies
```

### 3. Feature Flags
```
What: Toggle features globally
Examples:
  - Free premium for all users
  - Disable payment processing
  - Maintenance mode
  - New registrations
```

### 4. Revenue War Room
```
What: Real-time financial dashboard
Metrics:
  - Daily/Weekly/Monthly revenue
  - Churn rate
  - Top paying shops
  - Payment success rate
  - Commission collected
```

### 5. Emergency Broadcast
```
What: Push message to ALL users
Channels:
  - SMS (via Hubtel/Twilio)
  - In-app banner
  - Email blast
  - Push notifications
  
Use: Platform announcements, emergencies
```

### 6. Hidden Audit Log
```
What: Every action by every admin
Includes:
  - Who did what
  - When
  - IP address
  - Device
  - Data changed
  
Even tracks: Admins trying to access God Mode
```

### 7. Platform Kill Switch ☢️
```
What: Shutdown entire platform in <3 seconds
Effect:
  - All users logged out
  - Platform shows maintenance page
  - Transactions paused
  - Emails stopped
  
Use: Security breach, legal issues, emergencies

⚠️ USE WITH EXTREME CAUTION
```

---

## 🛡️ SECURITY FEATURES

### What Prevents Others From Accessing?

**1. No YubiKey = No Access**
- Physical key required
- Can't be cloned or stolen remotely
- Must be in your possession

**2. No Biometric = No Access**
- Your fingerprint/face required
- Can't be replicated
- Liveness detection prevents photos

**3. Database-Level Protection**
- Only ONE god_mode_user record allowed
- Your user_id hardcoded
- Can't be changed without physical database access

**4. Complete Audit Trail**
- Every God Mode action logged
- Can't be deleted
- Includes failed attempts
- IP + device tracked

**5. Session Timeout**
- God Mode sessions expire after 8 hours
- Must re-authenticate

### What Happens if Someone Tries?

1. **Admin tries to access god-mode.html**
   - Checks god_mode_users table
   - Not found → Access Denied
   - Attempt logged in audit_logs

2. **Admin tries to add themselves to god_mode_users**
   - RLS policy prevents it
   - Only you can modify table
   - Attempt logged

3. **Someone steals your YubiKey**
   - Still needs your biometric
   - Still needs your device
   - Can't proceed without all 3

4. **Database compromise**
   - god_mode_users table encrypted
   - YubiKey public key hashed
   - Biometric data hashed
   - Recovery phrase hashed
   - Can't reverse engineer

---

## 🚨 EMERGENCY PROCEDURES

### If You Lose YubiKey

1. **Immediately:**
   ```sql
   -- Disable lost YubiKey
   UPDATE god_mode_users
   SET is_active = false
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. **Register New YubiKey:**
   - Purchase replacement
   - Update yubikey_serial
   - Update yubikey_public_key
   - Set is_active = true

3. **Recovery Access:**
   - Use 24-word recovery phrase
   - Contact Supabase support
   - Verify identity via backup email/phone

### If Platform is Compromised

1. **Activate Kill Switch**
   - Access God Mode
   - Click "Platform Kill Switch"
   - Enter reason
   - Platform shuts down in 3 seconds

2. **Investigate**
   - Check audit logs
   - Review god_mode_actions
   - Check database changes

3. **Recovery**
   - Fix security issue
   - Deactivate kill switch
   - Notify users
   - File incident report

### If You're Locked Out

**Contact Information:**
- Supabase Support: support@supabase.com
- Your Recovery Email: (from god_mode_users)
- Your Recovery Phone: (from god_mode_users)

**Verification Required:**
- 24-word recovery phrase
- Government ID
- Answer security questions
- Video call verification

---

## 📱 MOBILE ACCESS

### YubiKey 5C NFC on Mobile

**iOS (iPhone):**
1. Hold YubiKey near top of iPhone
2. NFC activates automatically
3. Follow prompts

**Android:**
1. Enable NFC in settings
2. Hold YubiKey near back of phone
3. Tap when prompted

**Tip:** Works best with phone case removed

---

## 💡 BEST PRACTICES

### DO:
✅ Keep YubiKey in secure location when not in use  
✅ Use God Mode sparingly (only when necessary)  
✅ Review audit logs regularly  
✅ Keep recovery phrase in multiple secure locations  
✅ Test recovery process annually  
✅ Update emergency contacts annually  

### DON'T:
❌ Share YubiKey with anyone  
❌ Leave YubiKey plugged in  
❌ Store recovery phrase digitally  
❌ Access God Mode on public WiFi  
❌ Use God Mode for routine tasks  
❌ Take screenshots of God Mode screens  

---

## 🎓 TRAINING OTHERS

### If You Want to Grant Limited Admin Access

**Never give God Mode access.**

Instead, create regular admins:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('THEIR_USER_ID', 'admin');
```

They get:
- User management
- Order viewing
- Product moderation
- Platform settings (some)

They DON'T get:
- Database editing
- Feature flags (global)
- Kill switch
- Emergency broadcast
- Revenue dashboard
- Audit log access

---

## 📊 GOD MODE METRICS

**Track Your Usage:**
```sql
-- See your God Mode history
SELECT 
    action_type,
    action_description,
    executed_at
FROM god_mode_actions
WHERE god_user_id = (
    SELECT id FROM god_mode_users 
    WHERE user_id = 'YOUR_USER_ID'
)
ORDER BY executed_at DESC
LIMIT 50;
```

**Monitor Access Attempts:**
```sql
-- See who tried to access God Mode
SELECT 
    user_email,
    action_description,
    ip_address,
    executed_at
FROM god_mode_actions
WHERE action_type LIKE '%god_mode%'
AND action_description LIKE '%denied%'
ORDER BY executed_at DESC;
```

---

## 🔧 TROUBLESHOOTING

### YubiKey Not Recognized

**Problem:** LED doesn't blink  
**Solution:**
1. Try different USB port
2. Remove and reinsert
3. Try NFC instead
4. Check YubiKey battery (if wireless)
5. Update browser to latest version

### Biometric Fails

**Problem:** Fingerprint not recognized  
**Solution:**
1. Clean your finger
2. Try different finger
3. Re-register fingerprint
4. Use Face ID instead
5. Check device settings

### God Mode Won't Activate

**Problem:** All layers verified but activation fails  
**Solution:**
1. Check internet connection
2. Check Supabase status
3. Clear browser cache
4. Try different browser
5. Check audit logs for errors

---

## 📞 SUPPORT

**For God Mode Issues:**
- Email: god-mode-support@aldensgh.com (create this)
- Phone: Your personal number
- Emergency: Contact Supabase directly

**For Security Concerns:**
- Immediately disable God Mode
- Run audit log queries
- Contact cybersecurity consultant
- Document everything

---

## ✅ POST-SETUP CHECKLIST

- [ ] YubiKey registered in database
- [ ] Biometric enrolled on device
- [ ] 24-word recovery phrase created and secured
- [ ] Backup YubiKey purchased (optional)
- [ ] Emergency contacts set
- [ ] Test God Mode access successful
- [ ] Test all 7 God Mode features
- [ ] Audit logs reviewed
- [ ] Recovery process documented
- [ ] Secure storage for YubiKey established

---

## 🎯 FINAL NOTES

God Mode is the ultimate control system for ShopUp. With great power comes great responsibility.

**Remember:**
- You are the only person who should EVER have this access
- Every action is logged permanently
- The platform's security depends on your YubiKey security
- Test regularly, use sparingly

**"Sell on Your Terms" - But secure them first.** 🔐

---

**Setup Date:** _______________  
**YubiKey Serial:** _______________  
**Recovery Phrase Location:** _______________  
**Last Tested:** _______________

---

**END OF CLASSIFIED DOCUMENT**
