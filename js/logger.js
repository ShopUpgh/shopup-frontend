/**
 * ShopUp Ghana - Centralized Logging Utility
 * 
 * Provides structured logging for application events
 */

const Logger = {
    // Log levels
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        FATAL: 4
    },

    // Current log level (set from config)
    currentLevel: 1, // Default to INFO

    // Log storage for debugging
    logs: [],
    maxLogs: 1000,

    /**
     * Initialize logger
     */
    init() {
        // Set log level based on environment
        const env = window.AppConfig?.environment || 'development';
        
        if (env === 'development') {
            this.currentLevel = this.levels.DEBUG;
        } else if (env === 'staging') {
            this.currentLevel = this.levels.INFO;
        } else {
            this.currentLevel = this.levels.WARN;
        }

        console.log(`📝 Logger initialized (level: ${this.getLevelName(this.currentLevel)})`);
    },

    /**
     * Get level name
     */
    getLevelName(level) {
        const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
        return names[level] || 'UNKNOWN';
    },

    /**
     * Format log entry
     */
    formatLog(level, message, data = {}) {
        return {
            timestamp: new Date().toISOString(),
            level: this.getLevelName(level),
            message,
            data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
    },

    /**
     * Store log entry
     */
    storeLog(logEntry) {
        this.logs.push(logEntry);

        // Limit log storage
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    },

    /**
     * Send log to backend (if configured)
     */
    async sendToBackend(logEntry) {
        // Only send WARN and above in production
        if (logEntry.level === 'DEBUG' || logEntry.level === 'INFO') {
            return;
        }

        try {
            const supabase = window.supabase;
            if (!supabase) return;

            // Log to application_logs table
            await supabase
                .from('application_logs')
                .insert({
                    level: logEntry.level,
                    message: logEntry.message,
                    data: logEntry.data,
                    url: logEntry.url,
                    user_agent: logEntry.userAgent,
                    created_at: logEntry.timestamp
                });
        } catch (error) {
            // Silent fail to avoid infinite loop
            console.error('Failed to send log to backend:', error);
        }
    },

    /**
     * Log function
     */
    log(level, message, data = {}) {
        // Check if we should log this level
        if (level < this.currentLevel) {
            return;
        }

        const logEntry = this.formatLog(level, message, data);
        this.storeLog(logEntry);

        // Console output
        const levelName = this.getLevelName(level);
        const emoji = this.getEmoji(level);
        const style = this.getStyle(level);

        if (style) {
            console.log(
                `%c[${emoji} ${levelName}] ${message}`,
                style,
                data
            );
        } else {
            console.log(`[${emoji} ${levelName}] ${message}`, data);
        }

        // Send to backend for important logs
        if (level >= this.levels.WARN) {
            this.sendToBackend(logEntry);
        }

        // Send to monitoring if available
        if (window.Monitoring && level >= this.levels.ERROR) {
            window.Monitoring.captureMessage(message, 'error', data);
        }
    },

    /**
     * Get emoji for log level
     */
    getEmoji(level) {
        const emojis = ['🔍', 'ℹ️', '⚠️', '❌', '💀'];
        return emojis[level] || '📝';
    },

    /**
     * Get console style for log level
     */
    getStyle(level) {
        const styles = {
            0: 'color: #6b7280', // DEBUG - gray
            1: 'color: #3b82f6', // INFO - blue
            2: 'color: #f59e0b', // WARN - orange
            3: 'color: #ef4444', // ERROR - red
            4: 'color: #dc2626; font-weight: bold' // FATAL - bold red
        };
        return styles[level] || '';
    },

    /**
     * Debug log
     */
    debug(message, data = {}) {
        this.log(this.levels.DEBUG, message, data);
    },

    /**
     * Info log
     */
    info(message, data = {}) {
        this.log(this.levels.INFO, message, data);
    },

    /**
     * Warning log
     */
    warn(message, data = {}) {
        this.log(this.levels.WARN, message, data);
    },

    /**
     * Error log
     */
    error(message, data = {}) {
        this.log(this.levels.ERROR, message, data);
    },

    /**
     * Fatal error log
     */
    fatal(message, data = {}) {
        this.log(this.levels.FATAL, message, data);
    },

    /**
     * Get recent logs
     */
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    },

    /**
     * Get logs by level
     */
    getLogsByLevel(level) {
        const levelName = this.getLevelName(level);
        return this.logs.filter(log => log.level === levelName);
    },

    /**
     * Clear logs
     */
    clearLogs() {
        this.logs = [];
        console.log('📝 Logs cleared');
    },

    /**
     * Export logs to JSON
     */
    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopup-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Performance logging
     */
    performance: {
        marks: {},

        start(name) {
            this.marks[name] = performance.now();
        },

        end(name) {
            if (!this.marks[name]) {
                Logger.warn(`Performance mark "${name}" not found`);
                return null;
            }

            const duration = performance.now() - this.marks[name];
            delete this.marks[name];

            Logger.info(`⏱️ ${name}`, { duration: `${duration.toFixed(2)}ms` });

            return duration;
        }
    },

    /**
     * API logging helper
     */
    api: {
        request(method, url, data = {}) {
            Logger.debug(`🌐 API Request: ${method} ${url}`, data);
        },

        response(method, url, status, data = {}) {
            if (status >= 200 && status < 300) {
                Logger.debug(`✅ API Response: ${method} ${url} (${status})`, data);
            } else {
                Logger.error(`❌ API Error: ${method} ${url} (${status})`, data);
            }
        }
    },

    /**
     * User action logging
     */
    action(action, data = {}) {
        Logger.info(`👤 User Action: ${action}`, data);

        // Send to analytics if available
        if (window.AppConfig?.features?.analytics && typeof gtag !== 'undefined') {
            gtag('event', action, data);
        }
    }
};

// Auto-initialize
Logger.init();

// Make available globally
window.Logger = Logger;

// Override console.error to capture errors
const originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    Logger.error('Console Error', { args });
};

console.log('✅ Logger initialized');
