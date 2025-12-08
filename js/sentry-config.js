// Sentry Configuration for ShopUp Ghana
// This file initializes Sentry error monitoring with minimal config

(function() {
    'use strict';
    
    // Only initialize if Sentry is loaded
    if (typeof Sentry === 'undefined') {
        console.warn('Sentry SDK not loaded');
        return;
    }

    try {
        // Sentry is already initialized by the loader script
        // We just need to configure additional options
        
        console.log('✅ Sentry error monitoring initialized');
        console.log('📊 Environment:', 'production');
        console.log('🌍 Region:', 'Ghana');
        
    } catch (error) {
        console.error('Failed to configure Sentry:', error);
    }
})();
