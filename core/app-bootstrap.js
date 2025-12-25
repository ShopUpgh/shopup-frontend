/**
 * Application Bootstrap
 * Initializes the ShopUp application and sets up the global context
 * Creates the dependency injection container and registers all services
 */
(function(window) {
    'use strict';

    // Wait for all dependencies to be loaded
    if (typeof window.ConfigManager === 'undefined' ||
        typeof window.DIContainer === 'undefined' ||
        typeof window.StorageService === 'undefined' ||
        typeof window.LoggerService === 'undefined' ||
        typeof window.AuthService === 'undefined') {
        console.error('❌ Required dependencies not loaded. Please ensure all core files are included before app-bootstrap.js');
        return;
    }

    // Create global application context
    window.ShopUpApp = window.ShopUpApp || {};

    /**
     * Bootstrap the application
     */
    function bootstrap() {
        try {
            console.log('🚀 Bootstrapping ShopUp application...');
            
            // Create DI container
            const container = new window.DIContainer();
            
            // Register config manager
            container.register('config', () => {
                return new window.ConfigManager();
            });
            
            // Register storage service
            container.register('storage', (c) => {
                const config = c.resolve('config');
                return new window.StorageService({
                    prefix: 'shopup_',
                    useSession: false
                });
            });
            
            // Register logger service
            container.register('logger', (c) => {
                const config = c.resolve('config');
                const loggingConfig = config.get('logging', {});
                return new window.LoggerService({
                    enabled: loggingConfig.enabled !== undefined ? loggingConfig.enabled : true,
                    level: loggingConfig.level || 'info',
                    sendToServer: loggingConfig.sendToServer || false,
                    prefix: '[ShopUp]'
                });
            });
            
            // Register auth service
            container.register('auth', (c) => {
                return new window.AuthService(c);
            });
            
            // Resolve and expose services globally
            window.ShopUpApp.container = container;
            window.ShopUpApp.config = container.resolve('config');
            window.ShopUpApp.storage = container.resolve('storage');
            window.ShopUpApp.logger = container.resolve('logger');
            window.ShopUpApp.auth = container.resolve('auth');
            
            // Log successful initialization
            window.ShopUpApp.logger.info('✅ ShopUp application bootstrapped successfully');
            window.ShopUpApp.logger.info('App version:', window.ShopUpApp.config.get('app.version'));
            window.ShopUpApp.logger.info('Environment:', window.ShopUpApp.config.get('app.environment'));
            
            // Emit ready event
            const event = new CustomEvent('shopup:ready', {
                detail: { app: window.ShopUpApp }
            });
            window.dispatchEvent(event);
            
            console.log('✅ ShopUp application ready!');
            
        } catch (e) {
            console.error('❌ Failed to bootstrap ShopUp application:', e);
        }
    }

    // Bootstrap on DOMContentLoaded if not already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        // DOM already loaded, bootstrap immediately
        bootstrap();
    }
    
})(window);
