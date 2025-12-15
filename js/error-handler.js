// Error Handler Utility for ShopUp Ghana
// Provides user-friendly error messages and logging

const ErrorHandler = {
    // Error types
    ErrorTypes: {
        NETWORK: 'network',
        AUTH: 'authentication',
        PAYMENT: 'payment',
        VALIDATION: 'validation',
        SERVER: 'server',
        UNKNOWN: 'unknown'
    },
    
    // User-friendly error messages
    ErrorMessages: {
        // Network errors
        'network_offline': 'You appear to be offline. Please check your internet connection and try again.',
        'network_timeout': 'The request took too long. Please check your connection and try again.',
        'network_error': 'Unable to connect to our servers. Please try again in a moment.',
        
        // Authentication errors
        'auth_invalid_credentials': 'Invalid email or password. Please try again.',
        'auth_user_not_found': 'No account found with this email address.',
        'auth_email_taken': 'This email is already registered. Try logging in instead.',
        'auth_weak_password': 'Password must be at least 8 characters long.',
        'auth_session_expired': 'Your session has expired. Please log in again.',
        'auth_unauthorized': 'You need to log in to access this page.',
        
        // Payment errors
        'payment_declined': 'Payment was declined by your bank. Please try another payment method or contact your bank.',
        'payment_insufficient_funds': 'Insufficient funds. Please check your balance and try again.',
        'payment_invalid_card': 'Invalid card details. Please check and try again.',
        'payment_expired_card': 'Your card has expired. Please use a different card.',
        'payment_network_error': 'Unable to process payment. Please try again.',
        'payment_cancelled': 'Payment was cancelled. Your order has not been placed.',
        
        // Validation errors
        'validation_required_field': 'Please fill in all required fields.',
        'validation_invalid_email': 'Please enter a valid email address.',
        'validation_invalid_phone': 'Please enter a valid phone number (10 digits).',
        'validation_password_mismatch': 'Passwords do not match.',
        'validation_invalid_format': 'Please check the format of your input.',
        
        // Order/Product errors
        'product_out_of_stock': 'Sorry, this item is out of stock. We\'ll notify you when it\'s available again.',
        'product_not_found': 'Product not found. It may have been removed.',
        'order_not_found': 'Order not found. Please check your order number.',
        'cart_empty': 'Your cart is empty. Add some items before checking out.',
        'invalid_quantity': 'Please select a valid quantity.',
        
        // Server errors
        'server_error': 'Something went wrong on our end. Please try again in a moment.',
        'server_maintenance': 'We\'re currently performing maintenance. Please try again shortly.',
        'database_error': 'Unable to save your information. Please try again.',
        
        // Generic
        'unknown_error': 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    },
    
    /**
     * Handle and display errors in a user-friendly way
     * @param {Error|string} error - The error object or message
     * @param {string} context - Where the error occurred
     * @param {boolean} showToUser - Whether to show error to user
     * @returns {string} - User-friendly error message
     */
    handle: function(error, context = '', showToUser = true) {
        // Log detailed error for debugging
        console.error(`[${context || 'Error'}]:`, error);
        
        // Determine error type and get user-friendly message
        const errorInfo = this.parseError(error);
        const userMessage = errorInfo.message;
        
        // Log to error tracking service (if configured)
        this.logError(error, context, errorInfo.type);
        
        // Show to user if requested
        if (showToUser) {
            this.showError(userMessage);
        }
        
        return userMessage;
    },
    
    /**
     * Parse error and return type and message
     */
    parseError: function(error) {
        let type = this.ErrorTypes.UNKNOWN;
        let messageKey = 'unknown_error';
        
        // Handle string errors
        if (typeof error === 'string') {
            return {
                type: this.ErrorTypes.UNKNOWN,
                message: error
            };
        }
        
        // Network errors
        if (!navigator.onLine) {
            type = this.ErrorTypes.NETWORK;
            messageKey = 'network_offline';
        } else if (error.message && error.message.includes('timeout')) {
            type = this.ErrorTypes.NETWORK;
            messageKey = 'network_timeout';
        } else if (error.message && error.message.includes('Failed to fetch')) {
            type = this.ErrorTypes.NETWORK;
            messageKey = 'network_error';
        }
        
        // Authentication errors
        else if (error.message && error.message.includes('Invalid login credentials')) {
            type = this.ErrorTypes.AUTH;
            messageKey = 'auth_invalid_credentials';
        } else if (error.message && error.message.includes('User not found')) {
            type = this.ErrorTypes.AUTH;
            messageKey = 'auth_user_not_found';
        } else if (error.message && error.message.includes('User already registered')) {
            type = this.ErrorTypes.AUTH;
            messageKey = 'auth_email_taken';
        } else if (error.message && error.message.includes('Password should be')) {
            type = this.ErrorTypes.AUTH;
            messageKey = 'auth_weak_password';
        }
        
        // Payment errors
        else if (error.message && error.message.includes('Payment cancelled')) {
            type = this.ErrorTypes.PAYMENT;
            messageKey = 'payment_cancelled';
        } else if (error.message && error.message.includes('declined')) {
            type = this.ErrorTypes.PAYMENT;
            messageKey = 'payment_declined';
        } else if (error.message && error.message.includes('insufficient funds')) {
            type = this.ErrorTypes.PAYMENT;
            messageKey = 'payment_insufficient_funds';
        }
        
        // Product/Order errors
        else if (error.message && error.message.includes('out of stock')) {
            messageKey = 'product_out_of_stock';
        } else if (error.message && error.message.includes('Product not found')) {
            messageKey = 'product_not_found';
        }
        
        // Server errors
        else if (error.status && error.status >= 500) {
            type = this.ErrorTypes.SERVER;
            messageKey = 'server_error';
        }
        
        return {
            type,
            message: this.ErrorMessages[messageKey] || this.ErrorMessages.unknown_error
        };
    },
    
    /**
     * Show error message to user
     */
    showError: function(message, duration = 5000) {
        // Try to use existing toast/notification system
        if (typeof showToast === 'function') {
            showToast(message, 'error');
            return;
        }
        
        // Create error notification element if it doesn't exist
        let errorDiv = document.getElementById('error-notification');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'error-notification';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                background: #ef4444;
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                line-height: 1.5;
                display: none;
                animation: slideIn 0.3s ease-out;
            `;
            document.body.appendChild(errorDiv);
        }
        
        // Set message and show
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after duration
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, duration);
    },
    
    /**
     * Show success message to user
     */
    showSuccess: function(message, duration = 3000) {
        // Try to use existing toast/notification system
        if (typeof showToast === 'function') {
            showToast(message, 'success');
            return;
        }
        
        // Create success notification
        let successDiv = document.getElementById('success-notification');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'success-notification';
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                background: #10b981;
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                font-size: 14px;
                line-height: 1.5;
                display: none;
            `;
            document.body.appendChild(successDiv);
        }
        
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, duration);
    },
    
    /**
     * Log error to tracking service
     */
    logError: function(error, context, type) {
        // Log to console in development
        if (window.CONFIG && window.CONFIG.environment !== 'production') {
            console.group('Error Details');
            console.log('Context:', context);
            console.log('Type:', type);
            console.log('Error:', error);
            console.log('Stack:', error.stack);
            console.groupEnd();
        }
        
        // TODO: Send to error tracking service (e.g., Sentry)
        // if (window.Sentry) {
        //     Sentry.captureException(error, {
        //         tags: { context, type }
        //     });
        // }
    },
    
    /**
     * Validate form input and show specific errors
     */
    validateInput: function(input, rules) {
        const errors = [];
        
        if (rules.required && !input.value.trim()) {
            errors.push('This field is required');
        }
        
        if (rules.email && input.value && !this.isValidEmail(input.value)) {
            errors.push('Please enter a valid email address');
        }
        
        if (rules.phone && input.value && !this.isValidPhone(input.value)) {
            errors.push('Please enter a valid phone number');
        }
        
        if (rules.minLength && input.value.length < rules.minLength) {
            errors.push(`Must be at least ${rules.minLength} characters`);
        }
        
        if (rules.match && input.value !== rules.match.value) {
            errors.push(rules.match.message || 'Values do not match');
        }
        
        return errors;
    },
    
    /**
     * Email validation
     */
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Phone validation (Ghana format)
     */
    isValidPhone: function(phone) {
        // Ghana phone: 10 digits starting with 0
        const re = /^0\d{9}$/;
        return re.test(phone.replace(/\s/g, ''));
    }
};

// Make available globally
window.ErrorHandler = ErrorHandler;

console.log('✅ Error Handler loaded');
