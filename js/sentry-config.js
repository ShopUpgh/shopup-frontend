// Sentry Configuration for ShopUp Ghana
// Direct SDK approach (no loader)

(function() {
    'use strict';
    
    // Wait for Sentry to be available
    if (typeof Sentry === 'undefined') {
        console.error('❌ Sentry SDK not loaded');
        return;
    }

    console.log('🔧 Initializing Sentry...');

    // Initialize Sentry
    Sentry.init({
        dsn: "https://15328ade5c7644a80ab839d3a7488e67@o4510484995113040.ingest.de.sentry.io/4510484995113040",
        
        // Performance Monitoring
        tracesSampleRate: 1.0,
        
        // Environment
        environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
        
        // Release tracking
        release: 'shopup@1.0.0',
        
        // Only send errors and fatal events
        beforeSend(event, hint) {
            if (event.level !== 'error' && event.level !== 'fatal') {
                return null;
            }
            return event;
        },
        
        // Ignore noise
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
        ],
    });

    console.log('✅ Sentry initialized successfully');
    console.log('📊 DSN:', 'https://15328ade5c7644a80ab839d3a7488e67@o4510484995113040.ingest.de.sentry.io/4510484995113040');
    console.log('🌍 Environment:', window.location.hostname.includes('localhost') ? 'development' : 'production');

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
