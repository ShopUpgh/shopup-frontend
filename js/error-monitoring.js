/**
 * SHOPUP Error Monitoring Configuration
 * ======================================
 * This file initializes Sentry error tracking for production monitoring.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Sign up at https://sentry.io
 * 2. Create a new JavaScript project
 * 3. Replace the placeholder DSN below with your actual Sentry DSN
 * 4. Include this file in all HTML pages after security-utils.js
 * 
 * The DSN format looks like: https://xxxx@xxxxx.ingest.sentry.io/xxxxx
 */

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURATION
    // ============================================
    
    const SENTRY_CONFIG = {
        // ShopUp Ghana Production Sentry DSN
        dsn: 'https://15328ade5c7644a80ab839d3a7488e67@o4508595405824000.ingest.us.sentry.io/4508595408904192',
        
        // Environment (development, staging, production)
        environment: window.location.hostname === 'localhost' ? 'development' : 'production',
        
        // Release version (update with each deployment)
        release: 'shopup@1.0.0',
        
        // Sample rate for performance monitoring (0.0 to 1.0)
        tracesSampleRate: 0.1, // 10% of transactions
        
        // Sample rate for session replay (0.0 to 1.0)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        
        // Tags to add to all events
        tags: {
            platform: 'ShopUp Ghana',
            region: 'GH'
        }
    };
    
    // Check if DSN is configured
    const isDsnConfigured = !SENTRY_CONFIG.dsn.includes('YOUR_') && 
                            !SENTRY_CONFIG.dsn.includes('_HERE');
    
    // ============================================
    // SENTRY INITIALIZATION
    // ============================================
    
    if (isDsnConfigured && typeof Sentry !== 'undefined') {
        try {
            Sentry.init({
                dsn: SENTRY_CONFIG.dsn,
                environment: SENTRY_CONFIG.environment,
                release: SENTRY_CONFIG.release,
                tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
                
                // Filter out noisy errors
                ignoreErrors: [
                    'ResizeObserver loop limit exceeded',
                    'Non-Error promise rejection',
                    /Loading chunk \d+ failed/,
                    /Network Error/i
                ],
                
                // Add context before sending
                beforeSend(event, hint) {
                    // Add custom context
                    event.tags = {
                        ...event.tags,
                        ...SENTRY_CONFIG.tags
                    };
                    
                    // Don't send events in development unless explicitly enabled
                    if (SENTRY_CONFIG.environment === 'development') {
                        console.log('[Sentry] Event captured (dev mode):', event);
                        return null; // Don't send in dev
                    }
                    
                    return event;
                }
            });
            
            // Add user context if available
            const user = localStorage.getItem('shopup_seller') || 
                        localStorage.getItem('shopup_customer');
            if (user) {
                try {
                    const userData = JSON.parse(user);
                    Sentry.setUser({
                        id: userData.id,
                        email: userData.email
                    });
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }
            
            console.log('✅ Sentry error monitoring initialized');
            
        } catch (e) {
            console.warn('Failed to initialize Sentry:', e);
        }
    } else if (!isDsnConfigured) {
        console.warn('⚠️ Sentry DSN not configured. Error monitoring disabled.');
        console.warn('⚠️ To enable: Update js/error-monitoring.js with your Sentry DSN');
    }
    
    // ============================================
    // GLOBAL ERROR HANDLERS
    // ============================================
    
    // Catch unhandled errors
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('Unhandled error:', { message, source, lineno, colno });
        
        if (typeof Sentry !== 'undefined' && isDsnConfigured) {
            Sentry.captureException(error || new Error(message), {
                extra: { source, lineno, colno }
            });
        }
        
        // Also log to our security utils if available
        if (typeof logError === 'function') {
            logError('global_error', error || message, { source, lineno, colno });
        }
        
        return false; // Don't prevent default handling
    };
    
    // Catch unhandled promise rejections
    window.onunhandledrejection = function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        if (typeof Sentry !== 'undefined' && isDsnConfigured) {
            Sentry.captureException(event.reason || new Error('Unhandled Promise Rejection'));
        }
        
        if (typeof logError === 'function') {
            logError('unhandled_rejection', event.reason);
        }
    };
    
    // ============================================
    // PERFORMANCE MONITORING
    // ============================================
    
    // Track page load performance
    if (window.performance && SENTRY_CONFIG.environment === 'production') {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                
                console.log(`📊 Page load: ${loadTime}ms, DOM ready: ${domReady}ms`);
                
                // Report slow page loads
                if (loadTime > 5000 && typeof Sentry !== 'undefined' && isDsnConfigured) {
                    Sentry.captureMessage('Slow page load detected', {
                        level: 'warning',
                        extra: {
                            loadTime: loadTime,
                            domReady: domReady,
                            url: window.location.href
                        }
                    });
                }
            }, 0);
        });
    }
    
    // ============================================
    // HEALTH CHECK HELPER
    // ============================================
    
    window.getMonitoringStatus = function() {
        return {
            sentryConfigured: isDsnConfigured,
            sentryLoaded: typeof Sentry !== 'undefined',
            environment: SENTRY_CONFIG.environment,
            release: SENTRY_CONFIG.release
        };
    };
    
})();
