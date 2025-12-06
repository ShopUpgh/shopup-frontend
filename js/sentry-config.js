/**
 * Sentry Configuration for ShopUp Ghana
 * ======================================
 * This file initializes Sentry monitoring across the application
 * 
 * This is a secondary config file that re-exports the main error-monitoring.js
 * configuration for backward compatibility.
 */

(function() {
    'use strict';

    // Check if Sentry is already loaded
    if (window.__SENTRY_INITIALIZED__) {
        console.log('Sentry already initialized');
        return;
    }

    // Sentry DSN for ShopUp Ghana
    const SENTRY_DSN = 'https://15328ade5c7644a80ab839d3a7488e67@o4508595405824000.ingest.us.sentry.io/4508595408904192';

    // Wait for Sentry SDK to load
    if (typeof Sentry === 'undefined') {
        console.warn('Sentry SDK not loaded. Include the Sentry SDK before this file.');
        return;
    }

    // Initialize Sentry
    try {
        Sentry.init({
            dsn: SENTRY_DSN,
            
            // Performance Monitoring
            integrations: [
                new Sentry.BrowserTracing({
                    tracePropagationTargets: [
                        'localhost',
                        'shopup-frontend-omega.vercel.app',
                        'www.shopupgh.com',
                        /^\//
                    ],
                }),
                new Sentry.Replay({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],

            // Performance sampling
            tracesSampleRate: 1.0, // Capture 100% of transactions
            
            // Session Replay sampling
            replaysSessionSampleRate: 0.1, // 10% of sessions
            replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

            // Environment detection
            environment: window.location.hostname === 'localhost' ? 'development' : 
                        window.location.hostname.includes('vercel') ? 'staging' : 'production',
            
            // Release version
            release: 'shopup@1.0.0',

            // Before send hook
            beforeSend(event, hint) {
                // Add ShopUp-specific context
                event.tags = {
                    ...event.tags,
                    platform: 'ShopUp Ghana',
                    region: 'GH'
                };
                
                // Log in development
                if (window.location.hostname === 'localhost') {
                    console.log('[Sentry] Event captured:', event);
                }
                
                return event;
            }
        });

        window.__SENTRY_INITIALIZED__ = true;
        console.log('✅ Sentry initialized for ShopUp Ghana');
        
    } catch (error) {
        console.error('Failed to initialize Sentry:', error);
    }

    // Export configuration for other modules
    window.SentryConfig = {
        dsn: SENTRY_DSN,
        isConfigured: true
    };

})();
