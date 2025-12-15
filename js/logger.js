// Custom Logger for ShopUp Ghana
// Only logs in development environment (localhost/127.0.0.1)
// Production logs are silenced for cleaner user experience

(function(window) {
    'use strict';
    
    // Detect if we're in development environment
    const isDevelopment = () => {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname === '' ||
               hostname.startsWith('192.168.') ||
               hostname.startsWith('10.0.');
    };
    
    // Create custom logger object
    const logger = {
        log: function(...args) {
            if (isDevelopment()) {
                console.log(...args);
            }
        },
        
        info: function(...args) {
            if (isDevelopment()) {
                console.info(...args);
            }
        },
        
        warn: function(...args) {
            if (isDevelopment()) {
                console.warn(...args);
            }
        },
        
        error: function(...args) {
            // Always log errors, even in production
            console.error(...args);
        },
        
        debug: function(...args) {
            if (isDevelopment()) {
                console.debug(...args);
            }
        },
        
        // Utility to check environment
        isDev: isDevelopment
    };
    
    // Expose logger globally
    window.logger = logger;
    
})(window);
