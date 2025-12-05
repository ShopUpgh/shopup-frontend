// ============================================
// SHOPUP SECURITY UTILITIES
// ============================================
// This file provides security utilities for the ShopUp platform
// including XSS sanitization, input validation, and rate limiting helpers.
//
// SECURITY NOTE: Always use these functions when displaying user-generated
// content or data from the database to prevent XSS attacks.
// ============================================

'use strict';

// ============================================
// XSS SANITIZATION
// ============================================

/**
 * Sanitizes a string to prevent XSS attacks.
 * Converts special HTML characters to their entity equivalents.
 * 
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string safe for innerHTML
 * 
 * @example
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = sanitizeHTML(userInput);
 * // Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 */
function sanitizeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    
    // Convert to string if not already
    const text = String(str);
    
    // Create a text node and extract the escaped content
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitizes an object's string properties recursively.
 * Useful for sanitizing API response data before display.
 * 
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - A new object with sanitized string values
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'string') {
        return sanitizeHTML(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
    
    return obj;
}

/**
 * Sets text content safely (alternative to innerHTML for plain text).
 * 
 * @param {HTMLElement} element - The DOM element
 * @param {string} text - The text to set
 */
function setTextSafe(element, text) {
    if (element) {
        element.textContent = text || '';
    }
}

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Validates a Ghana phone number format.
 * Accepts formats: 0241234567, +233241234567, 233241234567
 * 
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if valid Ghana phone number
 */
function validateGhanaPhone(phone) {
    if (!phone) return false;
    
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');
    
    // Ghana phone patterns
    const patterns = [
        /^0[235][0-9]{8}$/,           // 0XX XXX XXXX (local)
        /^\+233[235][0-9]{8}$/,       // +233 XX XXX XXXX (international)
        /^233[235][0-9]{8}$/          // 233 XX XXX XXXX (no plus)
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Validates an email address format.
 * 
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid email format
 */
function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validates password strength.
 * Requires: 8+ chars, uppercase, lowercase, number
 * 
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with isValid and details
 */
function validatePasswordStrength(password) {
    const rules = {
        minLength: (password || '').length >= 8,
        hasUppercase: /[A-Z]/.test(password || ''),
        hasLowercase: /[a-z]/.test(password || ''),
        hasNumber: /\d/.test(password || ''),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password || '')
    };
    
    const score = Object.values(rules).filter(Boolean).length;
    
    return {
        isValid: rules.minLength && score >= 3,
        score: score,
        maxScore: 5,
        rules: rules,
        strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : 'strong'
    };
}

/**
 * Validates a monetary amount (GHS).
 * 
 * @param {number|string} amount - The amount to validate
 * @param {number} min - Minimum allowed (default: 0.01)
 * @param {number} max - Maximum allowed (default: 1000000)
 * @returns {boolean} - True if valid amount
 */
function validateAmount(amount, min = 0.01, max = 1000000) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= min && num <= max;
}

// ============================================
// RATE LIMITING (Client-Side Helper)
// ============================================

/**
 * Simple client-side rate limiter using localStorage.
 * Note: This is a helper - real rate limiting must be done server-side.
 */
const RateLimiter = {
    /**
     * Check if an action is rate limited.
     * 
     * @param {string} key - Unique key for the action (e.g., 'login_attempts')
     * @param {number} maxAttempts - Maximum attempts allowed
     * @param {number} windowMs - Time window in milliseconds
     * @returns {Object} - { allowed: boolean, remaining: number, resetIn: number }
     */
    check: function(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const storageKey = `ratelimit_${key}`;
        const now = Date.now();
        
        let data;
        try {
            data = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) {
            data = {};
        }
        
        // Clean up old entries
        if (data.resetAt && now > data.resetAt) {
            data = { attempts: 0, resetAt: now + windowMs };
        }
        
        if (!data.resetAt) {
            data.resetAt = now + windowMs;
        }
        
        const remaining = Math.max(0, maxAttempts - (data.attempts || 0));
        const resetIn = Math.max(0, (data.resetAt || 0) - now);
        
        return {
            allowed: remaining > 0,
            remaining: remaining,
            resetIn: resetIn,
            resetInMinutes: Math.ceil(resetIn / 60000)
        };
    },
    
    /**
     * Record an attempt for rate limiting.
     * 
     * @param {string} key - Unique key for the action
     * @param {number} windowMs - Time window in milliseconds
     */
    recordAttempt: function(key, windowMs = 15 * 60 * 1000) {
        const storageKey = `ratelimit_${key}`;
        const now = Date.now();
        
        let data;
        try {
            data = JSON.parse(localStorage.getItem(storageKey) || '{}');
        } catch (e) {
            data = {};
        }
        
        // Reset if window expired
        if (data.resetAt && now > data.resetAt) {
            data = { attempts: 0, resetAt: now + windowMs };
        }
        
        if (!data.resetAt) {
            data.resetAt = now + windowMs;
        }
        
        data.attempts = (data.attempts || 0) + 1;
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Could not save rate limit data:', e);
        }
    },
    
    /**
     * Reset rate limit for a key (e.g., after successful login).
     * 
     * @param {string} key - Unique key for the action
     */
    reset: function(key) {
        const storageKey = `ratelimit_${key}`;
        try {
            localStorage.removeItem(storageKey);
        } catch (e) {
            console.warn('Could not reset rate limit:', e);
        }
    }
};

// ============================================
// CSRF TOKEN HELPER
// ============================================

/**
 * Get or generate a CSRF token for forms.
 * Note: For Supabase, CSRF is handled by the auth library.
 */
function getCSRFToken() {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
        token = 'csrf_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem('csrf_token', token);
    }
    return token;
}

// ============================================
// ERROR TRACKING HELPER
// ============================================

/**
 * Log an error to the console and optionally to Sentry.
 * 
 * @param {string} context - Where the error occurred
 * @param {Error|string} error - The error object or message
 * @param {Object} extra - Additional context data
 */
function logError(context, error, extra = {}) {
    const errorData = {
        context: context,
        message: error.message || error,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...extra
    };
    
    console.error(`[${context}]`, error, errorData);
    
    // Send to Sentry if available
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
        if (error instanceof Error) {
            Sentry.captureException(error, { extra: errorData });
        } else {
            Sentry.captureMessage(String(error), { extra: errorData });
        }
    }
}

/**
 * Log a security event (e.g., failed login, suspicious activity).
 * 
 * @param {string} event - Event type
 * @param {Object} details - Event details
 */
function logSecurityEvent(event, details = {}) {
    const eventData = {
        event: event,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...details
    };
    
    console.warn(`[SECURITY] ${event}`, eventData);
    
    // Send to Sentry if available
    if (typeof Sentry !== 'undefined' && Sentry.captureMessage) {
        Sentry.captureMessage(`Security: ${event}`, {
            level: 'warning',
            extra: eventData
        });
    }
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

window.sanitizeHTML = sanitizeHTML;
window.sanitizeObject = sanitizeObject;
window.setTextSafe = setTextSafe;
window.validateGhanaPhone = validateGhanaPhone;
window.validateEmail = validateEmail;
window.validatePasswordStrength = validatePasswordStrength;
window.validateAmount = validateAmount;
window.RateLimiter = RateLimiter;
window.getCSRFToken = getCSRFToken;
window.logError = logError;
window.logSecurityEvent = logSecurityEvent;

console.log('✅ Security utilities loaded');
