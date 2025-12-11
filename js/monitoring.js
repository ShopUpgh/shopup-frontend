/**
 * ShopUp Ghana - Error Monitoring Integration (Sentry)
 * 
 * Provides centralized error tracking and performance monitoring
 */

const Monitoring = {
    initialized: false,
    sentryLoaded: false,

    /**
     * Initialize monitoring system
     */
    async init() {
        if (this.initialized) return;

        // Check if monitoring is enabled
        const enabled = window.AppConfig?.features?.errorTracking !== false;
        const dsn = window.AppConfig?.sentry?.dsn;

        if (!enabled || !dsn) {
            console.log('ℹ️ Error monitoring disabled or not configured');
            return;
        }

        try {
            await this.loadSentry();
            this.initializeSentry(dsn);
            this.setupGlobalErrorHandlers();
            this.initialized = true;
            console.log('✅ Monitoring initialized');
        } catch (error) {
            console.error('Failed to initialize monitoring:', error);
        }
    },

    /**
     * Load Sentry SDK
     */
    async loadSentry() {
        if (typeof Sentry !== 'undefined') {
            this.sentryLoaded = true;
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://browser.sentry-cdn.com/7.80.0/bundle.min.js';
            // Note: SRI hash should be updated based on actual Sentry bundle
            // For production, verify hash at: https://browser.sentry-cdn.com/7.80.0/bundle.min.js
            // Or omit integrity check and rely on HTTPS + CSP
            script.crossOrigin = 'anonymous';
            script.async = true;

            script.onload = () => {
                this.sentryLoaded = true;
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load Sentry SDK'));
            };

            document.head.appendChild(script);
        });
    },

    /**
     * Initialize Sentry
     */
    initializeSentry(dsn) {
        if (!this.sentryLoaded || typeof Sentry === 'undefined') {
            console.error('Sentry SDK not loaded');
            return;
        }

        const environment = window.AppConfig?.environment || 'development';

        Sentry.init({
            dsn: dsn,
            environment: environment,
            
            // Release tracking
            release: `shopup@${window.AppConfig?.app?.version || '1.0.0'}`,

            // Performance monitoring
            tracesSampleRate: environment === 'production' ? 0.2 : 1.0,

            // Session replay (optional)
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,

            // Integrations
            integrations: [
                new Sentry.BrowserTracing(),
                new Sentry.Replay()
            ],

            // Filter sensitive data
            beforeSend(event, hint) {
                // Remove sensitive data
                if (event.request) {
                    delete event.request.cookies;
                    delete event.request.headers;
                }

                // Filter out expected errors
                if (event.exception) {
                    const firstException = event.exception.values[0];
                    if (firstException && firstException.value) {
                        // Ignore network errors
                        if (firstException.value.includes('Network')) {
                            return null;
                        }
                        // Ignore cancelled requests
                        if (firstException.value.includes('cancelled')) {
                            return null;
                        }
                    }
                }

                return event;
            },

            // Ignore certain errors
            ignoreErrors: [
                'ResizeObserver loop limit exceeded',
                'Non-Error promise rejection captured',
                'cancelled'
            ]
        });

        // Set user context if authenticated
        this.updateUserContext();

        console.log(`📊 Sentry initialized (${environment})`);
    },

    /**
     * Update user context in Sentry
     */
    async updateUserContext() {
        if (!this.sentryLoaded || typeof Sentry === 'undefined') return;

        try {
            const supabase = window.supabase;
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                Sentry.setUser({
                    id: user.id,
                    email: user.email,
                    // Don't send sensitive data
                });
            }
        } catch (error) {
            // Silent fail
        }
    },

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Window error handler
        window.addEventListener('error', (event) => {
            this.captureError(event.error, {
                type: 'window.onerror',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(event.reason, {
                type: 'unhandledrejection',
                promise: event.promise
            });
        });
    },

    /**
     * Capture error
     * 
     * @param {Error|string} error - Error object or message
     * @param {Object} context - Additional context
     */
    captureError(error, context = {}) {
        // Log to console in development
        if (window.AppConfig?.isDevelopment) {
            console.error('🐛 Error captured:', error, context);
        }

        // Send to Sentry if available
        if (this.sentryLoaded && typeof Sentry !== 'undefined') {
            if (context && Object.keys(context).length > 0) {
                Sentry.setContext('error_context', context);
            }

            if (typeof error === 'string') {
                Sentry.captureMessage(error, 'error');
            } else {
                Sentry.captureException(error);
            }
        }

        // Also log to our logger
        if (window.Logger) {
            window.Logger.error('Error captured', { error, context });
        }
    },

    /**
     * Capture message
     * 
     * @param {string} message - Message to capture
     * @param {string} level - Severity level
     * @param {Object} context - Additional context
     */
    captureMessage(message, level = 'info', context = {}) {
        if (this.sentryLoaded && typeof Sentry !== 'undefined') {
            if (context && Object.keys(context).length > 0) {
                Sentry.setContext('message_context', context);
            }
            Sentry.captureMessage(message, level);
        }

        if (window.Logger) {
            window.Logger[level](message, context);
        }
    },

    /**
     * Start transaction (performance monitoring)
     * 
     * @param {string} name - Transaction name
     * @param {string} op - Operation type
     * @returns {Object} Transaction object
     */
    startTransaction(name, op = 'custom') {
        if (!this.sentryLoaded || typeof Sentry === 'undefined') {
            return null;
        }

        return Sentry.startTransaction({
            name,
            op
        });
    },

    /**
     * Set breadcrumb for debugging
     * 
     * @param {string} message - Breadcrumb message
     * @param {Object} data - Additional data
     */
    addBreadcrumb(message, data = {}) {
        if (this.sentryLoaded && typeof Sentry !== 'undefined') {
            Sentry.addBreadcrumb({
                message,
                data,
                timestamp: Date.now() / 1000
            });
        }
    },

    /**
     * Set custom tag
     * 
     * @param {string} key - Tag key
     * @param {string} value - Tag value
     */
    setTag(key, value) {
        if (this.sentryLoaded && typeof Sentry !== 'undefined') {
            Sentry.setTag(key, value);
        }
    },

    /**
     * Set custom context
     * 
     * @param {string} name - Context name
     * @param {Object} data - Context data
     */
    setContext(name, data) {
        if (this.sentryLoaded && typeof Sentry !== 'undefined') {
            Sentry.setContext(name, data);
        }
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Monitoring.init());
} else {
    Monitoring.init();
}

// Make available globally
window.Monitoring = Monitoring;

console.log('✅ Monitoring module loaded');
