# Favicon Integration Guide

## Files Created

✅ **favicon.ico** - Standard ICO format favicon (16x16)
✅ **favicon.svg** - Scalable SVG favicon (modern browsers)
✅ **site.webmanifest** - Web app manifest for PWA support

## How to Add Favicons to Your HTML Files

Add these lines inside the `<head>` section of all your HTML files:

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#4F46E5">
```

## For HTML Files in Subdirectories

For files in `admin/`, `seller/`, `customer/` subdirectories, use relative paths:

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="../favicon.ico">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<link rel="apple-touch-icon" href="../favicon.svg">
<link rel="manifest" href="../site.webmanifest">
<meta name="theme-color" content="#4F46E5">
```

## Files to Update

### Root-level HTML files (use `/` or no prefix):
- index.html
- signup.html
- login.html
- store.html
- storefront-index.html
- cart.html
- checkout.html
- dashboard.html
- products.html
- orders.html
- add-product.html
- edit-product.html
- god-mode.html
- terms-of-service.html
- privacy-policy.html
- refund-policy.html
- order-confirmation.html

### Subdirectory HTML files (use `../` prefix):
- admin/admin-dashboard.html
- admin/admin-users.html
- admin/admin-verifications.html
- admin/admin-login.html
- seller/seller-analytics.html
- seller/seller-orders-dashboard.html
- seller/seller-verification.html
- seller/seller-login.html
- customer/customer-order-confirmation.html
- customer/customer-order-details.html
- customer/customer-orders.html
- customer/customer-addresses.html
- customer/customer-profile.html

## Testing

After adding the favicon links:

1. Clear your browser cache
2. Reload the page
3. Check browser tab - you should see the ShopUp "S" logo in purple
4. Check browser console - no more 404 errors for favicon.ico

## Customization

The favicon features:
- Purple gradient background (ShopUp brand colors: #4F46E5 to #7C3AED)
- White "S" lettermark
- SVG format scales to any size
- ICO format for older browsers

To customize, edit `favicon.svg` or regenerate `favicon.ico` with your design.
