// Sentry Configuration for ShopUp Ghana
// Simplified for maximum error capture

(function() {
    'use strict';
    
    if (typeof Sentry === 'undefined') {
        console.error('❌ Sentry SDK not loaded');
        return;
    }

    // Use custom logger (only logs in development)
    if (window.logger) {
        window.logger.log('🔧 Initializing Sentry...');
    }

    // Initialize Sentry with minimal filtering
    Sentry.init({
        dsn: "https://15328ade5c7644a80ab839d3a7488e67@o4510484995113040.ingest.de.sentry.io/4510484995113040",
        
        // Capture everything for now
        tracesSampleRate: 1.0,
        
        // Environment
        environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
        
        // Release
        release: 'shopup@1.0.0',
        
        // Remove beforeSend filter - capture everything
        
        // Only ignore real noise
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
        ],
    });

    // Use custom logger (only logs in development)
    if (window.logger) {
        window.logger.log('✅ Sentry initialized successfully');
        window.logger.log('📊 Environment:', window.location.hostname.includes('localhost') ? 'development' : 'production');
        window.logger.log('🎯 Capturing ALL error levels for testing');
    }

})();

// Helper functions
window.identifySentryUser = function(user) {
    if (typeof Sentry !== 'undefined' && user && user.id) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.email?.split('@')[0]
        });
    }
};

window.captureSentryError = function(error, context = {}) {
    if (typeof Sentry !== 'undefined') {
        Sentry.captureException(error, {
            contexts: { custom: context }
        });
    }
};
