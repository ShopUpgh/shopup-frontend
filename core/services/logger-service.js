/**
 * Logger Service for ShopUp Ghana
 * Centralized logging with levels and Sentry integration
 */

class LoggerService {
    constructor(config) {
        this.config = config;
        this.logLevel = config.get('LOG_LEVEL', 'info');
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    /**
     * Check if should log at this level
     */
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.logLevel];
    }

    /**
     * Debug log
     */
    debug(message, data = {}) {
        if (!this.shouldLog('debug')) return;
        
        console.log(`🐛 [DEBUG] ${message}`, data);
    }

    /**
     * Info log
     */
    info(message, data = {}) {
        if (!this.shouldLog('info')) return;
        
        console.log(`ℹ️ [INFO] ${message}`, data);
    }

    /**
     * Warning log
     */
    warn(message, data = {}) {
        if (!this.shouldLog('warn')) return;
        
        console.warn(`⚠️ [WARN] ${message}`, data);
    }

    /**
     * Error log (always logs and sends to Sentry if enabled)
     */
    error(message, error = null, data = {}) {
        console.error(`❌ [ERROR] ${message}`, error || '', data);

        // Send to Sentry if available and enabled
        if (this.config.get('ENABLE_SENTRY') && window.Sentry) {
            try {
                if (error instanceof Error) {
                    window.Sentry.captureException(error, {
                        tags: { source: 'logger-service' },
                        extra: { message, data }
                    });
                } else {
                    window.Sentry.captureMessage(message, {
                        level: 'error',
                        tags: { source: 'logger-service' },
                        extra: { data }
                    });
                }
            } catch (sentryError) {
                console.error('Failed to send to Sentry:', sentryError);
            }
        }
    }

    /**
     * Track page view
     */
    pageView(pageName) {
        this.info(`Page view: ${pageName}`);
        
        // Send to analytics if available
        if (window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: pageName,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
        }
    }

    /**
     * Track event
     */
    track(eventName, properties = {}) {
        this.info(`Event: ${eventName}`, properties);
        
        // Send to analytics
        if (window.gtag) {
            window.gtag('event', eventName, properties);
        }
    }

    /**
     * Set log level
     */
    setLogLevel(level) {
        if (this.levels.hasOwnProperty(level)) {
            this.logLevel = level;
            this.info(`Log level set to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}`);
        }
    }
}

// Factory function for DI container
function createLoggerService(container) {
    const config = container.get('config');
    return new LoggerService(config);
}

// Export
window.LoggerService = LoggerService;
window.createLoggerService = createLoggerService;

console.log('✅ LoggerService loaded');
