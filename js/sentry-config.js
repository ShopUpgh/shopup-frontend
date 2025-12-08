// Initialize Sentry
Sentry.init({
    dsn: "https://15328ade5c7644a80ab839d3a7488e67@o45104646826885512.ingest.de.sentry.io/4510484995113040",
    
    // Performance Monitoring
    tracesSampleRate: 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
        Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
        }),
    ],
    
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

// Helper functions for user identification
function identifySentryUser(user) {
    if (user && user.id) {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            username: user.email?.split('@')[0]
        });
    }
}

// Add context to Sentry
function addSentryContext(key, data) {
    Sentry.setContext(key, data);
}

// Add breadcrumb
function addSentryBreadcrumb(category, message, level = 'info', data = {}) {
    Sentry.addBreadcrumb({
        category,
        message,
        level,
        data
    });
}

// Capture custom error
function captureSentryError(error, context = {}) {
    Sentry.captureException(error, {
        contexts: { custom: context }
    });
}

// Capture custom message
function captureSentryMessage(message, level = 'info', context = {}) {
    Sentry.captureMessage(message, {
        level,
        contexts: { custom: context }
    });
}
