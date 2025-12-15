// Configuration file for ShopUp Ghana
// IMPORTANT: In production, these values should come from environment variables
// and NOT be committed to the repository

const CONFIG = {
    // Environment
    environment: 'production', // 'development', 'staging', or 'production'
    
    // Supabase Configuration
    supabase: {
        url: 'https://brbewkxpvihnsrbrlpzq.supabase.co',
        // NOTE: In production, use environment-specific keys
        // This key should be configured in your deployment environment
        anonKey: process.env.SUPABASE_ANON_KEY || '******'
    },
    
    // Paystack Configuration
    paystack: {
        // CRITICAL: Switch to production key before launch
        // Use pk_live_YOUR_KEY for production
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_568969ab37dbf86e712189b75c2db0edb8f25afc',
        // Supported payment channels
        channels: ['card', 'mobile_money', 'bank_transfer'],
        currency: 'GHS'
    },
    
    // Contact Information
    contact: {
        supportEmail: 'support@shopup.gh',
        supportPhone: '+233 20 123 4567',
        supportWhatsApp: '+233 20 123 4567',
        legalEmail: 'legal@shopup.gh',
        privacyEmail: 'privacy@shopup.gh',
        returnsEmail: 'returns@shopup.gh',
        dpoEmail: 'dpo@shopup.gh'
    },
    
    // Platform Settings
    platform: {
        name: 'ShopUp Ghana',
        platformFee: 0.03, // 3%
        defaultShippingFee: 5.00, // GH₵ 5.00
        taxRate: 0.15, // 15% VAT
        currency: 'GH₵',
        returnPeriodDays: 7,
        orderCancellationHours: 24
    },
    
    // Feature Flags
    features: {
        smsNotifications: false, // TODO: Implement SMS
        locationBasedShipping: false, // TODO: Implement
        inventory:true,
        refunds: false, // TODO: Implement
        reviews: true,
        wishlist: true,
        giftCards: false
    },
    
    // Security Settings
    security: {
        enforceHttps: true,
        passwordMinLength: 8,
        sessionTimeout: 3600000, // 1 hour in milliseconds
        maxLoginAttempts: 5
    },
    
    // API Endpoints
    api: {
        baseUrl: window.location.origin,
        timeout: 30000 // 30 seconds
    }
};

// Validation warnings for development
if (CONFIG.environment === 'production') {
    if (CONFIG.paystack.publicKey.includes('test')) {
        console.error('⚠️ CRITICAL: Using TEST Paystack key in PRODUCTION environment!');
        console.error('Switch to production key: pk_live_YOUR_KEY');
    }
    
    if (CONFIG.contact.supportPhone.includes('XXX')) {
        console.error('⚠️ WARNING: Support phone number not configured!');
    }
}

// Helper function to check if environment is properly configured
function validateConfiguration() {
    const errors = [];
    const warnings = [];
    
    if (!CONFIG.supabase.url) {
        errors.push('Supabase URL not configured');
    }
    
    if (!CONFIG.supabase.anonKey || CONFIG.supabase.anonKey === '******') {
        errors.push('Supabase anonymous key not configured');
    }
    
    if (!CONFIG.paystack.publicKey) {
        errors.push('Paystack public key not configured');
    }
    
    if (CONFIG.environment === 'production' && CONFIG.paystack.publicKey.includes('test')) {
        errors.push('Production environment using TEST Paystack key');
    }
    
    if (CONFIG.contact.supportPhone.includes('XXX')) {
        warnings.push('Support phone number needs to be updated');
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make available globally
window.CONFIG = CONFIG;
window.validateConfiguration = validateConfiguration;

console.log('✅ Configuration loaded:', CONFIG.environment);

// Log validation results
const validation = validateConfiguration();
if (!validation.isValid) {
    console.error('❌ Configuration errors:', validation.errors);
}
if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', validation.warnings);
}
