/**
 * ShopUp Ghana - Unified Configuration System
 * 
 * This file provides a secure configuration loader that:
 * 1. Uses environment variables (Vercel/build-time)
 * 2. Validates required configuration
 * 3. Provides environment detection
 * 4. Prevents exposure of sensitive data
 */

// Environment detection
const ENV = {
    isDevelopment: () => {
        // Check if we're in development mode
        const hostname = window.location.hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168');
    },
    
    isProduction: () => {
        const hostname = window.location.hostname;
        return !ENV.isDevelopment() && (hostname.includes('.vercel.app') || hostname.includes('shopup.com.gh'));
    },
    
    getEnvironment: () => {
        if (ENV.isDevelopment()) return 'development';
        if (ENV.isProduction()) return 'production';
        return 'staging';
    }
};

// Configuration loader with validation
const ConfigLoader = {
    /**
     * Get environment variable with fallback
     * In production (Vercel), these are injected at build time
     */
    getEnvVar: (key, defaultValue = null, required = false) => {
        // Try to get from global window object (injected by Vercel)
        let value = null;
        
        // Check if value is available in window.__ENV__ (injected at build time)
        if (window.__ENV__ && window.__ENV__[key]) {
            value = window.__ENV__[key];
        }
        
        // Fallback to import.meta.env for Vite-based builds
        if (!value && typeof import !== 'undefined' && import.meta && import.meta.env) {
            value = import.meta.env[key];
        }
        
        // Use default value if not found
        if (!value) {
            value = defaultValue;
        }
        
        // Validate required variables
        if (required && !value) {
            console.error(`❌ Required environment variable missing: ${key}`);
            throw new Error(`Missing required environment variable: ${key}`);
        }
        
        return value;
    },
    
    /**
     * Validate configuration on load
     */
    validate: () => {
        const errors = [];
        
        // Check Supabase configuration
        if (!ConfigLoader.getEnvVar('VITE_SUPABASE_URL')) {
            errors.push('Supabase URL not configured');
        }
        
        if (!ConfigLoader.getEnvVar('VITE_SUPABASE_ANON_KEY')) {
            errors.push('Supabase Anon Key not configured');
        }
        
        // Check Paystack configuration
        if (!ConfigLoader.getEnvVar('VITE_PAYSTACK_PUBLIC_KEY')) {
            errors.push('Paystack Public Key not configured');
        }
        
        // Warn if test key in production
        const environment = ENV.getEnvironment();
        const paystackKey = ConfigLoader.getEnvVar('VITE_PAYSTACK_PUBLIC_KEY', '');
        
        if (environment === 'production' && paystackKey.startsWith('pk_test_')) {
            errors.push('⚠️ WARNING: Test Paystack key detected in production environment!');
        }
        
        if (errors.length > 0) {
            console.error('❌ Configuration validation failed:');
            errors.forEach(error => console.error(`   - ${error}`));
            
            // Don't throw in production, just log
            if (ENV.isDevelopment()) {
                throw new Error('Configuration validation failed. Check console for details.');
            }
        }
        
        return errors.length === 0;
    }
};

// Main configuration object
const AppConfig = {
    // Environment
    environment: ENV.getEnvironment(),
    isDevelopment: ENV.isDevelopment(),
    isProduction: ENV.isProduction(),
    
    // Supabase
    supabase: {
        url: ConfigLoader.getEnvVar('VITE_SUPABASE_URL', '', true),
        anonKey: ConfigLoader.getEnvVar('VITE_SUPABASE_ANON_KEY', '', true)
    },
    
    // Paystack
    paystack: {
        publicKey: ConfigLoader.getEnvVar('VITE_PAYSTACK_PUBLIC_KEY', '', true),
        currency: 'GHS',
        channels: ['card', 'mobile_money', 'bank_transfer'],
        mobileMoneyNetworks: {
            mtn: 'MTN Mobile Money',
            vod: 'Vodafone Cash',
            tgo: 'AirtelTigo Money'
        }
    },
    
    // Application
    app: {
        name: ConfigLoader.getEnvVar('VITE_APP_NAME', 'ShopUp Ghana'),
        url: ConfigLoader.getEnvVar('VITE_APP_URL', window.location.origin),
        supportEmail: ConfigLoader.getEnvVar('VITE_SUPPORT_EMAIL', 'support@shopup.com.gh')
    },
    
    // Security
    security: {
        maxLoginAttempts: parseInt(ConfigLoader.getEnvVar('VITE_MAX_LOGIN_ATTEMPTS', '5')),
        lockoutDuration: parseInt(ConfigLoader.getEnvVar('VITE_LOCKOUT_DURATION', '15')),
        minPasswordLength: parseInt(ConfigLoader.getEnvVar('VITE_MIN_PASSWORD_LENGTH', '12'))
    },
    
    // Feature Flags
    features: {
        analytics: ConfigLoader.getEnvVar('VITE_ENABLE_ANALYTICS', 'true') === 'true',
        errorTracking: ConfigLoader.getEnvVar('VITE_ENABLE_ERROR_TRACKING', 'true') === 'true',
        cookieConsent: ConfigLoader.getEnvVar('VITE_ENABLE_COOKIE_CONSENT', 'true') === 'true'
    },
    
    // Error Monitoring
    sentry: {
        dsn: ConfigLoader.getEnvVar('VITE_SENTRY_DSN', '')
    }
};

// Initialize Supabase client using configuration
let supabaseClient = null;

function initializeSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded. Include Supabase CDN script first.');
        return null;
    }
    
    try {
        supabaseClient = window.supabase.createClient(
            AppConfig.supabase.url,
            AppConfig.supabase.anonKey
        );
        
        console.log('✅ Supabase initialized for ShopUp Ghana');
        console.log('📍 Environment:', AppConfig.environment);
        console.log('🔑 Configuration loaded:', AppConfig.supabase.url ? 'Yes' : 'No');
        
        // Test connection in development
        if (AppConfig.isDevelopment) {
            testSupabaseConnection();
        }
        
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return null;
    }
}

// Test database connection
async function testSupabaseConnection() {
    if (!supabaseClient) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('customer_profiles')
            .select('count')
            .limit(1);
        
        if (error) {
            console.warn('⚠️ Database connection test:', error.message);
        } else {
            console.log('✅ Database connected successfully');
        }
    } catch (err) {
        console.error('❌ Connection test failed:', err);
    }
}

// Validate configuration on load
try {
    ConfigLoader.validate();
} catch (error) {
    console.error('Configuration validation failed:', error);
    // In development, show user-friendly error
    if (AppConfig.isDevelopment) {
        document.addEventListener('DOMContentLoaded', () => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ff4444;color:white;padding:20px;z-index:999999;text-align:center;';
            errorDiv.innerHTML = `
                <strong>⚠️ Configuration Error</strong><br>
                Please check console for details. Ensure environment variables are set correctly.
            `;
            document.body.prepend(errorDiv);
        });
    }
}

// Initialize Supabase when script loads
if (typeof window !== 'undefined') {
    supabaseClient = initializeSupabase();
}

// Export for use in other scripts
window.AppConfig = AppConfig;
window.supabase = supabaseClient;

// For backwards compatibility, export legacy globals
window.SUPABASE_URL = AppConfig.supabase.url;
window.SUPABASE_ANON_KEY = AppConfig.supabase.anonKey;
window.PAYSTACK_CONFIG = {
    publicKey: AppConfig.paystack.publicKey,
    currency: AppConfig.paystack.currency,
    channels: AppConfig.paystack.channels,
    mobileMoneyNetworks: AppConfig.paystack.mobileMoneyNetworks,
    callbackUrl: window.location.origin + '/payment-callback.html',
    metadata: {
        custom_fields: [
            {
                display_name: "Platform",
                variable_name: "platform",
                value: "ShopUp"
            }
        ]
    }
};

console.log('✅ AppConfig loaded successfully');
