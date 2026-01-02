# Public Assets Directory

This directory contains static assets for the ShopUp platform.

## Favicon Files

### Current Files:
- `favicon.svg` - SVG icon (copied from root)

### Required Files (for full browser support):
To complete the favicon setup, please add the following files:

1. **favicon.ico** (16x16 and 32x32 multi-size ICO file)
   - Generate from https://favicon.io or similar tool
   - Use the ShopUp logo or text
   
2. **apple-touch-icon.png** (180x180 PNG)
   - For iOS home screen icons
   - Should have rounded corners (iOS applies mask)

### How to Generate:
1. Visit https://favicon.io
2. Upload your logo or use text ("ShopUp")
3. Download the generated files
4. Place them in this `/public` directory

### Browser Support:
- Modern browsers: favicon.svg ✅
- Legacy browsers: favicon.ico (needed)
- iOS Safari: apple-touch-icon.png (recommended)
