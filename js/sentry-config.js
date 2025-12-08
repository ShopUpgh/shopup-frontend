// Sentry Configuration for ShopUp Ghana
// This file initializes Sentry error monitoring

(function() {
    'use strict';
    
    // Check if Sentry is loaded
    if (typeof Sentry === 'undefined') {
        console.warn('⚠️ Sentry SDK not loaded');
        return;
    }

    try {
        // Initialize Sentry with minimal config
        // The loader script handles most initialization
        Sentry.init({
            dsn: "https://15328ade5c7644a80ab839d3a7488e67@o45104646826885512.ingest.de.sentry.io/4510484995113040",
            
            // Performance Monitoring
            tracesSampleRate: 1.0,
            
            // Environment detection
            environment: window.location.hostname === 'localhost' ? 'development' : 'production',
            
            // Filter out non-errors
            beforeSend(event, hint) {
                // Don't send events that are not errors
                if (event.level !== 'error' && event.level !== 'fatal') {
                    return null;
                }
                return event;
            },
            
            // Ignore specific errors
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
            ],
        });
        
        console.log('✅ Sentry error monitoring initialized');
        console.log('📊 Environment:', window.location.hostname === 'localhost' ? 'development' : 'production');
        console.log('🌍 Region:', 'Ghana');
        
    } catch (error) {
        console.error('❌ Failed to initialize Sentry:', error);
    }
})();

// Helper functions for user identification
function identifySentryUser(user) {
    if (typeof Sentry !== 'undefined' && user && user.id) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.email?.split('@')[0]
        });
    }
}

// Add context to Sentry
function addSentryContext(key, data) {
    if (typeof Sentry !== 'undefined') {
        Sentry.setContext(key, data);
    }
}

// Add breadcrumb
function addSentryBreadcrumb(category, message, level = 'info', data = {}) {
    if (typeof Sentry !== 'undefined') {
        Sentry.addBreadcrumb({
            category,
            message,
            level,
            data
        });
    }
}

// Capture custom error
function captureSentryError(error, context = {}) {
    if (typeof Sentry !== 'undefined') {
        Sentry.captureException(error, {
            contexts: { custom: context }
        });
    }
}

// Capture custom message
function captureSentryMessage(message, level = 'info', context = {}) {
    if (typeof Sentry !== 'undefined') {
        Sentry.captureMessage(message, {
            level,
            contexts: { custom: context }
        });
    }
}
