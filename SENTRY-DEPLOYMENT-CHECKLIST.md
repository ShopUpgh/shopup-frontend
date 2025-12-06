# 🔍 Sentry Deployment Checklist for ShopUp Ghana

## ✅ Pre-Deployment Verification

### 1. Sentry Configuration Files

| File | Purpose | Status |
|------|---------|--------|
| `js/error-monitoring.js` | Main Sentry initialization | ✓ Created |
| `js/sentry-config.js` | Alternative Sentry config | ✓ Created |
| `js/sentry-error-tracking.js` | Error tracking utilities | ✓ Created |
| `sentry-test.html` | Integration test page | ✓ Created |
| `monitoring-dashboard.html` | Real-time monitoring | ✓ Created |

### 2. Sentry DSN Configuration

The Sentry DSN has been configured in the following files:

```javascript
// js/error-monitoring.js
dsn: 'https://15328ade5c7644a80ab839d3a7488e67@o4508595405824000.ingest.us.sentry.io/4508595408904192'
```

**⚠️ Security Note:** The DSN is safe to include in frontend code. It only allows sending events to your Sentry project, not reading them.

---

## 📋 Deployment Steps

### Step 1: Verify Sentry Project Settings

1. Log in to [sentry.io](https://sentry.io)
2. Go to your ShopUp project
3. Verify the DSN matches the one in your code
4. Check that "Browser JavaScript" is selected as the platform

### Step 2: Deploy to Vercel

```bash
# From your local repository
git add .
git commit -m "Add Sentry monitoring and error tracking"
git push origin main
```

Vercel will automatically deploy the changes.

### Step 3: Verify Deployment

Visit these URLs after deployment:

1. **Sentry Test Page**: 
   `https://shopup-frontend-omega.vercel.app/sentry-test.html`
   
2. **Monitoring Dashboard**: 
   `https://shopup-frontend-omega.vercel.app/monitoring-dashboard.html`

3. **Health Check**: 
   `https://shopup-frontend-omega.vercel.app/health.html`

### Step 4: Test Error Tracking

1. Open `sentry-test.html` in your browser
2. Verify the status shows "✓ Configured" for DSN
3. Click "Trigger JavaScript Error"
4. Check Sentry dashboard for the captured error

---

## 🔧 Sentry Dashboard Setup

### Recommended Alerts

Set up these alerts in your Sentry project:

1. **High Error Rate**
   - Trigger: More than 10 errors in 1 hour
   - Action: Email notification

2. **New Issue**
   - Trigger: First occurrence of new error
   - Action: Slack/Email notification

3. **Slow Page Load**
   - Trigger: Page load > 5 seconds
   - Action: Email notification

### Issue Assignment

Configure issue assignment rules:
- Assign JavaScript errors to frontend team
- Assign payment errors (tagged with `type:payment`) to payments team

---

## 📊 Monitoring Checklist

### Daily Checks

- [ ] Check Sentry dashboard for new issues
- [ ] Review error trends
- [ ] Check health.html page

### Weekly Checks

- [ ] Review unresolved issues
- [ ] Analyze performance metrics
- [ ] Update release version if deploying

---

## 🚀 Going Live Checklist

Before going live with Sentry monitoring:

- [x] DSN configured in code
- [x] Test page created and working
- [x] Error capturing verified
- [ ] Sentry alerts configured
- [ ] Team members have Sentry access
- [ ] Performance sampling rate reviewed (currently 100%)

### Recommended Production Settings

For production, consider adjusting these in `js/error-monitoring.js`:

```javascript
// Reduce transaction sampling to save quota
tracesSampleRate: 0.1, // 10% of transactions

// Keep full session replay on errors
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% when errors occur
```

---

## 🔗 Quick Links

- **Sentry Dashboard**: https://sentry.io/organizations/your-org/issues/
- **Sentry Test Page**: /sentry-test.html
- **Monitoring Dashboard**: /monitoring-dashboard.html
- **Health Check**: /health.html

---

## 📞 Support

If you encounter issues with Sentry integration:

1. Check browser console for errors
2. Verify DSN is correct
3. Ensure Sentry SDK is loading (check network tab)
4. Review Sentry documentation: https://docs.sentry.io/platforms/javascript/

---

*Last Updated: December 2024*
*ShopUp Ghana - Error Monitoring Setup Guide*
