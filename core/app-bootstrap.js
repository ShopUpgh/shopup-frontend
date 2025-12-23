/**
 * Application Bootstrap for ShopUp Ghana
 * Initializes and wires all services together
 */

class AppBootstrap {
    constructor() {
        this.initialized = false;
    }

    /**
     * Bootstrap the application
     */
    async bootstrap() {
        if (this.initialized) {
            console.warn('Application already bootstrapped');
            return;
        }

        console.log('🚀 Bootstrapping ShopUp Application...');

        try {
            // 1. Register config (already created globally)
            window.container.registerInstance('config', window.config);

            // 2. Register services
            window.container.register('storage', window.createStorageService);
            window.container.register('logger', window.createLoggerService);
            window.container.register('auth', window.createAuthService);

            // 3. Initialize services (triggers creation)
            const logger = window.container.get('logger');
            const auth = window.container.get('auth');

            // 4. Make services globally accessible for convenience
            window.app = {
                config: window.config,
                storage: window.container.get('storage'),
                logger: logger,
                auth: auth,
                container: window.container,
                
                // Helper methods
                getService: (name) => window.container.get(name),
                isAuthenticated: () => auth.isAuthenticated(),
                getCurrentUser: () => auth.getCurrentUser()
            };

            // 5. Setup global error handler
            this.setupErrorHandling(logger);

            // 6. Log page view
            logger.pageView(document.title);

            this.initialized = true;
            console.log('✅ Application bootstrapped successfully');

            return window.app;
        } catch (error) {
            console.error('❌ Bootstrap failed:', error);
            throw error;
        }
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling(logger) {
        window.addEventListener('error', (event) => {
            logger.error('Uncaught error', event.error, {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            logger.error('Unhandled promise rejection', event.reason);
        });
    }
}

// Auto-bootstrap when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const bootstrap = new AppBootstrap();
        await bootstrap.bootstrap();
    });
} else {
    // DOM already loaded
    (async () => {
        const bootstrap = new AppBootstrap();
        await bootstrap.bootstrap();
    })();
}

// Export
window.AppBootstrap = AppBootstrap;

console.log('✅ AppBootstrap loaded');
