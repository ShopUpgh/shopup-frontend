#!/usr/bin/env node

/**
 * Environment Variable Injection Script for Vercel Deployment
 * 
 * This script runs during Vercel build to inject environment variables
 * into the HTML files so they're available at runtime.
 */

const fs = require('fs');
const path = require('path');

// Get environment variables from Vercel
const ENV_VARS = {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_PAYSTACK_PUBLIC_KEY: process.env.VITE_PAYSTACK_PUBLIC_KEY || '',
    VITE_ENVIRONMENT: process.env.VITE_ENVIRONMENT || 'production',
    VITE_APP_NAME: process.env.VITE_APP_NAME || 'ShopUp Ghana',
    VITE_APP_URL: process.env.VITE_APP_URL || '',
    VITE_SUPPORT_EMAIL: process.env.VITE_SUPPORT_EMAIL || 'support@shopup.com.gh',
    VITE_SENTRY_DSN: process.env.VITE_SENTRY_DSN || '',
    VITE_ENABLE_ANALYTICS: process.env.VITE_ENABLE_ANALYTICS || 'true',
    VITE_ENABLE_ERROR_TRACKING: process.env.VITE_ENABLE_ERROR_TRACKING || 'true',
    VITE_ENABLE_COOKIE_CONSENT: process.env.VITE_ENABLE_COOKIE_CONSENT || 'true',
    VITE_MAX_LOGIN_ATTEMPTS: process.env.VITE_MAX_LOGIN_ATTEMPTS || '5',
    VITE_LOCKOUT_DURATION: process.env.VITE_LOCKOUT_DURATION || '15',
    VITE_MIN_PASSWORD_LENGTH: process.env.VITE_MIN_PASSWORD_LENGTH || '12'
};

// Validate required variables
const REQUIRED_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_PAYSTACK_PUBLIC_KEY'];
const missing = REQUIRED_VARS.filter(key => !ENV_VARS[key]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease configure these in Vercel Dashboard:');
    console.error('https://vercel.com/docs/concepts/projects/environment-variables');
    process.exit(1);
}

// Validate production environment
if (ENV_VARS.VITE_ENVIRONMENT === 'production') {
    if (ENV_VARS.VITE_PAYSTACK_PUBLIC_KEY.startsWith('pk_test_')) {
        console.error('⚠️  WARNING: Test Paystack key detected in production!');
        console.error('   Please use a live key (pk_live_...) for production.');
        // Don't fail build, but warn heavily
    }
}

// Create env injection script content
const envScript = `
<script>
// Environment variables injected at build time by Vercel
window.__ENV__ = ${JSON.stringify(ENV_VARS, null, 2)};
console.log('✅ Environment variables loaded');
</script>
`;

// Find all HTML files
const htmlFiles = [];
function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'scripts') {
            findHtmlFiles(filePath);
        } else if (file.endsWith('.html')) {
            htmlFiles.push(filePath);
        }
    });
}

// Start from root directory
findHtmlFiles(process.cwd());

console.log(`Found ${htmlFiles.length} HTML files`);

// Inject into each HTML file
let injected = 0;
htmlFiles.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if already injected
        if (content.includes('window.__ENV__')) {
            console.log(`⏭️  Skipping ${path.basename(filePath)} (already injected)`);
            return;
        }
        
        // Inject right after <head> tag
        if (content.includes('<head>')) {
            content = content.replace('<head>', `<head>\n${envScript}`);
            fs.writeFileSync(filePath, content, 'utf8');
            injected++;
            console.log(`✅ Injected into ${path.basename(filePath)}`);
        } else {
            console.log(`⚠️  No <head> tag found in ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
});

console.log(`\n✅ Successfully injected environment variables into ${injected} files`);
console.log('🚀 Build ready for deployment');
