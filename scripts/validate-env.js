#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Run this before deployment to validate environment configuration
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating ShopUp Ghana Configuration...\n');

// Check for .env.example
const envExamplePath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envExamplePath)) {
    console.error('❌ .env.example file not found');
    process.exit(1);
}

// Check for hardcoded secrets in config files
const dangerousFiles = [
    'js/supabase-config.js',
    'js/paystack-config.js'
];

let foundSecrets = false;

dangerousFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for hardcoded Supabase URL
        if (content.includes('https://') && content.includes('.supabase.co')) {
            console.error(`❌ Hardcoded Supabase URL found in ${file}`);
            foundSecrets = true;
        }
        
        // Check for hardcoded API keys
        if (content.includes('eyJ') || content.includes('pk_test_') || content.includes('pk_live_')) {
            console.error(`❌ Hardcoded API key found in ${file}`);
            foundSecrets = true;
        }
    }
});

if (foundSecrets) {
    console.error('\n⚠️  SECURITY WARNING: Hardcoded secrets detected!');
    console.error('These files should use environment variables instead.');
    console.error('See .env.example for the correct configuration.\n');
    process.exit(1);
}

// Check that config.js exists
const configPath = path.join(process.cwd(), 'js/config.js');
if (!fs.existsSync(configPath)) {
    console.error('❌ js/config.js not found');
    console.error('Run the security setup script to create this file.\n');
    process.exit(1);
}

// Validate environment variables if present
const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PAYSTACK_PUBLIC_KEY'
];

const missingVars = requiredVars.filter(key => !process.env[key]);

if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables:');
    missingVars.forEach(key => console.warn(`   - ${key}`));
    console.warn('\nThese should be configured in Vercel Dashboard for production.');
    console.warn('For local development, copy .env.example to .env.local\n');
}

// Check production environment
if (process.env.VITE_ENVIRONMENT === 'production') {
    if (process.env.VITE_PAYSTACK_PUBLIC_KEY && process.env.VITE_PAYSTACK_PUBLIC_KEY.startsWith('pk_test_')) {
        console.error('❌ Test Paystack key detected in production environment!');
        console.error('   Use pk_live_... for production\n');
        process.exit(1);
    }
}

// Check .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    if (!gitignoreContent.includes('.env')) {
        console.warn('⚠️  .gitignore should include .env files');
    }
    
    if (!gitignoreContent.includes('.vercel')) {
        console.warn('⚠️  .gitignore should include .vercel directory');
    }
}

console.log('✅ Configuration validation passed!');
console.log('🚀 Ready for deployment\n');

console.log('📋 Pre-deployment checklist:');
console.log('   □ Environment variables configured in Vercel Dashboard');
console.log('   □ Using live Paystack key (pk_live_...) for production');
console.log('   □ Supabase project is in production mode');
console.log('   □ All legal pages created and accessible');
console.log('   □ Payment verification backend deployed');
console.log('   □ Security headers configured in vercel.json');
console.log('   □ Error monitoring (Sentry) configured');
console.log('');
