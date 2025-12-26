// sentry-config.js - Sentry Error Tracking Configuration

// Only initialize Sentry if we have a valid DSN
const SENTRY_DSN = 'https://c4c92ac8539373f9c497ba50f31a9900@o4510464682688512.ingest.de.sentry.io/4510484995113040
'; // Replace with real DSN from Sentry dashboard

if (window.Sentry && SENTRY_DSN && SENTRY_DSN !== 'YOUR_ACTUAL_SENTRY_DSN_HERE') {
    window.Sentry.init({
        dsn: SENTRY_DSN,
        
        // Set environment
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        
        // Set sample rate (100% for now, adjust in production)
        tracesSampleRate: 1.0,
        
        // Capture specific errors
        beforeSend(event, hint) {
            // Filter out errors you don't care about
            if (event.exception) {
                const error = hint.originalException;
                
                // Ignore common browser extension errors
                if (error && error.message && error.message.includes('chrome-extension://')) {
                    return null;
                }
            }
            
            return event;
        },
        
        // Add release information (optional)
        release: 'shopup@1.0.0',
    });
    
    console.log('✅ Sentry initialized successfully');
} else {
    console.log('ℹ️ Sentry not initialized (DSN not configured)');
}
