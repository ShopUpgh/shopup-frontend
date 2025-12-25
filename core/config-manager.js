/**
 * Configuration Manager
 * Centralized configuration management for ShopUp application
 * Provides a single source of truth for all configuration values
 */
(function(window) {
    'use strict';

    class ConfigManager {
        constructor() {
            this.config = {
                // Supabase Configuration
                supabase: {
                    url: 'https://brbewkxpvihnsrbrlpzq.supabase.co',
                    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4'
                },
                
                // Application Configuration
                app: {
                    name: 'ShopUp Ghana',
                    version: '1.0.0',
                    environment: 'production'
                },
                
                // Feature Flags
                features: {
                    payments: true,
                    analytics: true,
                    notifications: true,
                    sentry: true
                },
                
                // Routing Configuration
                routes: {
                    sellerDashboard: '/dashboard.html',
                    customerDashboard: '/customer/customer-dashboard.html',
                    adminDashboard: '/admin/admin-dashboard.html',
                    login: '/login.html',
                    signup: '/signup.html',
                    customerLogin: '/customer/customer-login.html',
                    customerRegister: '/customer/customer-register.html',
                    sellerLogin: '/seller/seller-login.html'
                },
                
                // Storage Keys
                storageKeys: {
                    user: 'shopup_user',
                    session: 'shopup_session',
                    preferences: 'shopup_preferences',
                    cart: 'shopup_cart'
                },
                
                // Logging Configuration
                logging: {
                    enabled: true,
                    level: 'info', // 'debug', 'info', 'warn', 'error'
                    sendToServer: false
                }
            };
            
            this.overrides = this.loadOverrides();
        }
        
        /**
         * Load configuration overrides from localStorage
         */
        loadOverrides() {
            try {
                const stored = localStorage.getItem('shopup_config_overrides');
                return stored ? JSON.parse(stored) : {};
            } catch (e) {
                console.warn('Failed to load config overrides:', e);
                return {};
            }
        }
        
        /**
         * Save configuration overrides to localStorage
         */
        saveOverrides() {
            try {
                localStorage.setItem('shopup_config_overrides', JSON.stringify(this.overrides));
            } catch (e) {
                console.warn('Failed to save config overrides:', e);
            }
        }
        
        /**
         * Get a configuration value using dot notation
         * @param {string} path - Configuration path (e.g., 'supabase.url')
         * @param {*} defaultValue - Default value if path not found
         * @returns {*} Configuration value
         */
        get(path, defaultValue = null) {
            const keys = path.split('.');
            let value = this.overrides;
            
            // Check overrides first
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    value = null;
                    break;
                }
            }
            
            // Fall back to default config
            if (value === null) {
                value = this.config;
                for (const key of keys) {
                    if (value && typeof value === 'object' && key in value) {
                        value = value[key];
                    } else {
                        return defaultValue;
                    }
                }
            }
            
            return value;
        }
        
        /**
         * Set a configuration value using dot notation
         * @param {string} path - Configuration path (e.g., 'supabase.url')
         * @param {*} value - Value to set
         */
        set(path, value) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            let target = this.overrides;
            
            // Navigate/create nested structure
            for (const key of keys) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                target = target[key];
            }
            
            target[lastKey] = value;
            this.saveOverrides();
        }
        
        /**
         * Check if a feature is enabled
         * @param {string} featureName - Name of the feature
         * @returns {boolean} True if feature is enabled
         */
        isFeatureEnabled(featureName) {
            return this.get(`features.${featureName}`, false);
        }
        
        /**
         * Get Supabase configuration
         * @returns {object} Supabase config
         */
        getSupabaseConfig() {
            return {
                url: this.get('supabase.url'),
                anonKey: this.get('supabase.anonKey')
            };
        }
        
        /**
         * Reset configuration to defaults
         */
        reset() {
            this.overrides = {};
            try {
                localStorage.removeItem('shopup_config_overrides');
            } catch (e) {
                console.warn('Failed to remove config overrides:', e);
            }
        }
        
        /**
         * Get all configuration (for debugging)
         * @returns {object} Full configuration
         */
        getAll() {
            return {
                ...this.config,
                ...this.overrides
            };
        }
    }
    
    // Create singleton instance
    window.ConfigManager = ConfigManager;
    
    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('✅ ConfigManager initialized');
    }
    
})(window);
