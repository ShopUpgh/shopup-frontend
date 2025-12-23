/**
 * Configuration Manager for ShopUp Ghana
 * Centralized configuration management with environment awareness
 */

class ConfigManager {
    constructor() {
        this.config = {};
        this.environment = this.detectEnvironment();
        this.loadConfiguration();
    }

    /**
     * Detect current environment
     */
    detectEnvironment() {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging') || hostname.includes('test')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

    /**
     * Load configuration from multiple sources (priority order)
     * 1. Environment variables (if available)
     * 2. LocalStorage (for runtime config)
     * 3. Hardcoded defaults
     */
    loadConfiguration() {
        // Default configuration
        const defaults = {
            // Supabase
            SUPABASE_URL: 'https://brbewkxpvihnsrbrlpzq.supabase.co',
            SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            
            // Paystack
            PAYSTACK_PUBLIC_KEY: 'pk_live_8f9d31f1db8aa5210a2a4a9510432101a438ffff',
            
            // Application
            APP_NAME: 'ShopUp Ghana',
            APP_VERSION: '2.0',
            
            // Ghana specific
            CURRENCY: 'GHS',
            VAT_RATE: 0.175, // 17.5%
            DEFAULT_SHIPPING: 20,
            
            // Features
            ENABLE_WHATSAPP: false, // Will enable when API key is set
            ENABLE_REFUNDS: true,
            ENABLE_RATE_LIMITING: true,
            
            // URLs
            API_BASE_URL: '',
            WEBHOOK_URL: '',
            
            // Logging
            LOG_LEVEL: this.environment === 'production' ? 'warn' : 'debug',
            ENABLE_SENTRY: this.environment === 'production',
            
            // Security
            SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
            MAX_LOGIN_ATTEMPTS: 5,
            LOCKOUT_DURATION: 900000, // 15 minutes
        };

        // Load from localStorage (allows runtime config changes)
        const storedConfig = this.loadFromStorage();

        // Merge configurations (localStorage overrides defaults)
        this.config = { ...defaults, ...storedConfig };

        // Log configuration loaded
        console.log(`✅ Configuration loaded for ${this.environment} environment`);
    }

    /**
     * Load configuration from localStorage
     */
    loadFromStorage() {
        const config = {};
        const keys = [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'PAYSTACK_PUBLIC_KEY',
            'LOG_LEVEL'
        ];

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                config[key] = value;
            }
        });

        return config;
    }

    /**
     * Get configuration value
     */
    get(key, defaultValue = null) {
        return this.config[key] !== undefined ? this.config[key] : defaultValue;
    }

    /**
     * Set configuration value (updates localStorage)
     */
    set(key, value) {
        this.config[key] = value;
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.error('Failed to save config to localStorage:', error);
        }
    }

    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(`ENABLE_${feature.toUpperCase()}`, false);
    }

    /**
     * Get environment
     */
    getEnvironment() {
        return this.environment;
    }

    /**
     * Is production environment
     */
    isProduction() {
        return this.environment === 'production';
    }

    /**
     * Is development environment
     */
    isDevelopment() {
        return this.environment === 'development';
    }
}

// Export global instance
window.ConfigManager = ConfigManager;
window.config = new ConfigManager();

console.log('✅ ConfigManager initialized');
