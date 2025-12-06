/**
 * Sentry Error Tracking Wrappers for ShopUp Ghana
 * =================================================
 * This file provides helper functions for capturing errors, messages,
 * and custom events with Sentry.
 */

(function() {
    'use strict';

    // Check if Sentry is available
    function isSentryAvailable() {
        return typeof Sentry !== 'undefined';
    }

    // ============================================
    // ERROR TRACKING FUNCTIONS
    // ============================================

    /**
     * Capture an exception and send to Sentry
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     */
    window.captureError = function(error, context = {}) {
        console.error('Error captured:', error);
        
        if (isSentryAvailable()) {
            Sentry.withScope(function(scope) {
                // Add extra context
                if (context.user) {
                    scope.setUser(context.user);
                }
                if (context.tags) {
                    Object.keys(context.tags).forEach(function(key) {
                        scope.setTag(key, context.tags[key]);
                    });
                }
                if (context.extra) {
                    Object.keys(context.extra).forEach(function(key) {
                        scope.setExtra(key, context.extra[key]);
                    });
                }
                
                Sentry.captureException(error);
            });
        }
    };

    /**
     * Capture a message with severity level
     * @param {string} message - The message to capture
     * @param {string} level - Severity level (info, warning, error)
     * @param {Object} context - Additional context
     */
    window.captureMessage = function(message, level = 'info', context = {}) {
        console.log('[' + level.toUpperCase() + ']', message);
        
        if (isSentryAvailable()) {
            Sentry.captureMessage(message, {
                level: level,
                tags: context.tags || {},
                extra: context.extra || {}
            });
        }
    };

    /**
     * Set the current user for Sentry tracking
     * @param {Object} user - User object with id, email, etc.
     */
    window.setTrackingUser = function(user) {
        if (isSentryAvailable() && user) {
            Sentry.setUser({
                id: user.id,
                email: user.email,
                username: user.business_name || user.first_name
            });
            console.log('✅ Sentry user context set');
        }
    };

    /**
     * Clear the current user context
     */
    window.clearTrackingUser = function() {
        if (isSentryAvailable()) {
            Sentry.setUser(null);
            console.log('✅ Sentry user context cleared');
        }
    };

    // ============================================
    // TRANSACTION TRACKING
    // ============================================

    /**
     * Start a performance transaction
     * @param {string} name - Transaction name
     * @param {string} op - Operation type
     * @returns {Object} Transaction object
     */
    window.startTransaction = function(name, op = 'custom') {
        if (isSentryAvailable() && Sentry.startTransaction) {
            return Sentry.startTransaction({
                name: name,
                op: op
            });
        }
        return null;
    };

    // ============================================
    // BREADCRUMB TRACKING
    // ============================================

    /**
     * Add a breadcrumb for debugging
     * @param {string} message - Breadcrumb message
     * @param {string} category - Breadcrumb category
     * @param {Object} data - Additional data
     */
    window.addBreadcrumb = function(message, category = 'action', data = {}) {
        if (isSentryAvailable()) {
            Sentry.addBreadcrumb({
                message: message,
                category: category,
                data: data,
                level: 'info'
            });
        }
    };

    // ============================================
    // SHOPUP-SPECIFIC TRACKING
    // ============================================

    /**
     * Track a payment event
     * @param {string} status - Payment status (initiated, success, failed)
     * @param {Object} details - Payment details
     */
    window.trackPayment = function(status, details = {}) {
        addBreadcrumb('Payment ' + status, 'payment', details);
        
        if (status === 'failed') {
            captureMessage('Payment failed', 'error', {
                tags: { type: 'payment' },
                extra: details
            });
        }
    };

    /**
     * Track user actions
     * @param {string} action - Action name
     * @param {Object} details - Action details
     */
    window.trackAction = function(action, details = {}) {
        addBreadcrumb(action, 'user-action', details);
    };

    /**
     * Track API errors
     * @param {string} endpoint - API endpoint
     * @param {number} status - HTTP status code
     * @param {Object} response - Response data
     */
    window.trackApiError = function(endpoint, status, response = {}) {
        captureMessage('API Error: ' + endpoint, 'error', {
            tags: { 
                type: 'api-error',
                status: String(status)
            },
            extra: {
                endpoint: endpoint,
                response: response
            }
        });
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    // Auto-set user if stored in localStorage
    document.addEventListener('DOMContentLoaded', function() {
        var storedUser = localStorage.getItem('shopup_seller') || 
                        localStorage.getItem('shopup_customer');
        if (storedUser) {
            try {
                var user = JSON.parse(storedUser);
                setTrackingUser(user);
            } catch (e) {
                // Ignore parse errors
            }
        }
    });

    console.log('✅ Sentry error tracking utilities loaded');

})();
