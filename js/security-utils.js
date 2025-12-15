/**
 * Security Utilities for ShopUp Ghana
 * XSS Protection, Input Validation, and Safe Display
 * 
 * Usage:
 * - SecurityUtils.escapeHtml(userInput)
 * - SecurityUtils.safeDisplay(element, content)
 * - SecurityUtils.validateInput(input, type)
 */

const SecurityUtils = {
    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} unsafe - Unsafe user input
     * @returns {string} Safe HTML-escaped string
     */
    escapeHtml: function(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    
    /**
     * Sanitize HTML for safe insertion
     * @param {string} dirty - Dirty HTML content
     * @returns {string} Sanitized content
     */
    sanitizeHTML: function(dirty) {
        if (!dirty) return '';
        const div = document.createElement('div');
        div.textContent = dirty;
        return div.innerHTML;
    },
    
    /**
     * Safe display of user content (prevents XSS)
     * @param {HTMLElement} element - Target element
     * @param {string} content - Content to display
     */
    safeDisplay: function(element, content) {
        if (!element) return;
        element.textContent = content || '';
    },
    
    /**
     * Safe HTML display with escaped content
     * @param {HTMLElement} element - Target element
     * @param {string} content - Content to display
     */
    safeHTML: function(element, content) {
        if (!element) return;
        element.innerHTML = this.escapeHtml(content);
    },
    
    /**
     * Validate input based on type
     * @param {string} input - Input to validate
     * @param {string} type - Validation type (email, phone, number, url, etc.)
     * @returns {boolean} True if valid
     */
    validateInput: function(input, type) {
        if (!input) return false;
        
        switch(type) {
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
            case 'phone':
                // Ghana phone formats: 0XX XXX XXXX or +233 XX XXX XXXX
                return /^(\+233|0)[0-9]{9}$/.test(input.replace(/\s/g, ''));
            case 'number':
                return !isNaN(parseFloat(input)) && isFinite(input);
            case 'url':
                try {
                    new URL(input);
                    return true;
                } catch {
                    return false;
                }
            case 'alphanumeric':
                return /^[a-zA-Z0-9]+$/.test(input);
            case 'text':
                return input.trim().length > 0;
            default:
                return input.length > 0;
        }
    },
    
    /**
     * Validate Ghana Digital Address format
     * @param {string} address - Digital address (e.g., GA-123-4567)
     * @returns {boolean} True if valid format
     */
    validateGhanaAddress: function(address) {
        if (!address) return false;
        // Ghana Digital Address format: XX-XXX-XXXX
        return /^[A-Z]{2}-\d{3}-\d{4}$/.test(address.toUpperCase());
    },
    
    /**
     * Sanitize price/currency input
     * @param {string|number} price - Price input
     * @returns {number} Safe numeric price
     */
    sanitizePrice: function(price) {
        if (typeof price === 'number') return Math.max(0, price);
        const cleaned = String(price).replace(/[^0-9.]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    },
    
    /**
     * Sanitize quantity input
     * @param {string|number} quantity - Quantity input
     * @returns {number} Safe integer quantity (min 1)
     */
    sanitizeQuantity: function(quantity) {
        const parsed = parseInt(quantity);
        return isNaN(parsed) ? 1 : Math.max(1, Math.floor(parsed));
    },
    
    /**
     * Safe JSON parse with fallback
     * @param {string} jsonString - JSON string to parse
     * @param {*} defaultValue - Default value if parse fails
     * @returns {*} Parsed object or default value
     */
    safeJSONParse: function(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn('JSON parse failed:', e);
            return defaultValue;
        }
    },
    
    /**
     * Remove potentially dangerous HTML attributes
     * @param {string} html - HTML string
     * @returns {string} Cleaned HTML
     */
    stripDangerousAttributes: function(html) {
        if (!html) return '';
        return html
            .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/<script[^>]*>.*?<\/script>/gi, ''); // Remove script tags
    },
    
    /**
     * Rate limiting helper
     * Tracks attempts and enforces limits
     */
    RateLimiter: {
        attempts: {},
        
        /**
         * Check if action is rate limited
         * @param {string} key - Unique key (e.g., email or IP)
         * @param {number} maxAttempts - Maximum attempts allowed
         * @param {number} windowMs - Time window in milliseconds
         * @returns {Object} {allowed: boolean, remaining: number, resetAt: Date}
         */
        check: function(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
            const now = Date.now();
            const identifier = key.toLowerCase();
            
            if (!this.attempts[identifier]) {
                this.attempts[identifier] = [];
            }
            
            // Clean old attempts
            this.attempts[identifier] = this.attempts[identifier].filter(
                time => now - time < windowMs
            );
            
            const currentAttempts = this.attempts[identifier].length;
            const allowed = currentAttempts < maxAttempts;
            const remaining = Math.max(0, maxAttempts - currentAttempts);
            
            let resetAt = null;
            if (!allowed && this.attempts[identifier].length > 0) {
                const oldestAttempt = this.attempts[identifier][0];
                resetAt = new Date(oldestAttempt + windowMs);
            }
            
            return {
                allowed,
                remaining,
                resetAt,
                attemptsUsed: currentAttempts
            };
        },
        
        /**
         * Record an attempt
         * @param {string} key - Unique key
         */
        record: function(key) {
            const identifier = key.toLowerCase();
            if (!this.attempts[identifier]) {
                this.attempts[identifier] = [];
            }
            this.attempts[identifier].push(Date.now());
        },
        
        /**
         * Clear attempts for a key
         * @param {string} key - Unique key
         */
        clear: function(key) {
            delete this.attempts[key.toLowerCase()];
        }
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.SecurityUtils = SecurityUtils;
}

// Log successful load (only in development)
if (window.logger) {
    window.logger.log('✅ Security utilities loaded');
}
