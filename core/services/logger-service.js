/**
 * Logger Service
 * Provides centralized logging with different log levels
 * Supports console logging and optional server-side logging
 */
(function(window) {
    'use strict';

    class LoggerService {
        constructor(config = {}) {
            this.enabled = config.enabled !== undefined ? config.enabled : true;
            this.level = config.level || 'info';
            this.sendToServer = config.sendToServer || false;
            this.prefix = config.prefix || '[ShopUp]';
            
            // Log levels in order of severity
            this.levels = {
                debug: 0,
                info: 1,
                warn: 2,
                error: 3
            };
            
            this.currentLevel = this.levels[this.level] || 1;
        }
        
        /**
         * Check if a log level should be logged
         * @param {string} level - Log level
         * @returns {boolean} True if should log
         */
        shouldLog(level) {
            if (!this.enabled) return false;
            return this.levels[level] >= this.currentLevel;
        }
        
        /**
         * Format log message
         * @param {string} level - Log level
         * @param {Array} args - Log arguments
         * @returns {string} Formatted message
         */
        formatMessage(level, args) {
            const timestamp = new Date().toISOString();
            const levelStr = level.toUpperCase().padEnd(5);
            return `${this.prefix} [${timestamp}] ${levelStr}:`;
        }
        
        /**
         * Send log to server (placeholder for future implementation)
         * @param {string} level - Log level
         * @param {Array} args - Log arguments
         */
        async sendToServerAsync(level, args) {
            if (!this.sendToServer) return;
            
            try {
                // Placeholder for server logging
                // Can be implemented to send logs to a logging service
                const logData = {
                    timestamp: new Date().toISOString(),
                    level,
                    message: args.map(arg => {
                        if (typeof arg === 'object') {
                            return JSON.stringify(arg);
                        }
                        return String(arg);
                    }).join(' '),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };
                
                // TODO: Implement actual server logging
                // await fetch('/api/logs', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(logData)
                // });
            } catch (e) {
                // Silently fail to avoid infinite logging loops
            }
        }
        
        /**
         * Log a debug message
         * @param {...*} args - Arguments to log
         */
        debug(...args) {
            if (!this.shouldLog('debug')) return;
            
            const prefix = this.formatMessage('debug', args);
            console.debug(prefix, ...args);
            this.sendToServerAsync('debug', args);
        }
        
        /**
         * Log an info message
         * @param {...*} args - Arguments to log
         */
        info(...args) {
            if (!this.shouldLog('info')) return;
            
            const prefix = this.formatMessage('info', args);
            console.info(prefix, ...args);
            this.sendToServerAsync('info', args);
        }
        
        /**
         * Log a warning message
         * @param {...*} args - Arguments to log
         */
        warn(...args) {
            if (!this.shouldLog('warn')) return;
            
            const prefix = this.formatMessage('warn', args);
            console.warn(prefix, ...args);
            this.sendToServerAsync('warn', args);
        }
        
        /**
         * Log an error message
         * @param {...*} args - Arguments to log
         */
        error(...args) {
            if (!this.shouldLog('error')) return;
            
            const prefix = this.formatMessage('error', args);
            console.error(prefix, ...args);
            this.sendToServerAsync('error', args);
        }
        
        /**
         * Log an error with stack trace
         * @param {Error} error - Error object
         * @param {string} context - Additional context
         */
        logError(error, context = '') {
            if (!this.shouldLog('error')) return;
            
            const prefix = this.formatMessage('error', [context]);
            console.error(prefix, context, error);
            
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            
            this.sendToServerAsync('error', [context, error.message, error.stack]);
        }
        
        /**
         * Create a child logger with a specific prefix
         * @param {string} childPrefix - Additional prefix
         * @returns {LoggerService} Child logger
         */
        child(childPrefix) {
            return new LoggerService({
                enabled: this.enabled,
                level: this.level,
                sendToServer: this.sendToServer,
                prefix: `${this.prefix} ${childPrefix}`
            });
        }
        
        /**
         * Set log level
         * @param {string} level - New log level
         */
        setLevel(level) {
            if (this.levels[level] !== undefined) {
                this.level = level;
                this.currentLevel = this.levels[level];
                this.info(`Log level set to: ${level}`);
            }
        }
        
        /**
         * Enable logging
         */
        enable() {
            this.enabled = true;
            this.info('Logger enabled');
        }
        
        /**
         * Disable logging
         */
        disable() {
            this.info('Logger disabled');
            this.enabled = false;
        }
    }
    
    // Export to window
    window.LoggerService = LoggerService;
    
    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('✅ LoggerService initialized');
    }
    
})(window);
