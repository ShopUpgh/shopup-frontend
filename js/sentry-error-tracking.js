// Sentry Error Tracking Helper Functions
// Compatible with Sentry v8+ (removed deprecated transaction APIs)
const SentryTracking = {
    // Track payment operations
    async trackPayment(paymentFunction, paymentData) {
        Sentry.setContext('payment', paymentData);
        Sentry.setTag('transaction_type', 'payment');
        
        try {
            const result = await paymentFunction();
            return result;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    error_category: 'payment',
                    payment_method: paymentData.paymentMethod,
                    amount: paymentData.amount
                }
            });
            throw error;
        }
    },
    
    // Track checkout process
    async trackCheckout(step, checkoutFunction, checkoutData) {
        Sentry.setContext('checkout', checkoutData);
        Sentry.setTag('flow', 'checkout');
        Sentry.setTag('checkout_step', step);
        
        try {
            const result = await checkoutFunction();
            return result;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    error_category: 'checkout',
                    checkout_step: step
                }
            });
            throw error;
        }
    },
    
    // Track cart operations
    async trackCartOperation(operation, action, itemData) {
        Sentry.addBreadcrumb({
            category: 'cart',
            message: `Cart ${action}`,
            level: 'info',
            data: itemData
        });
        
        try {
            const result = await operation();
            return result;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    error_category: 'cart',
                    action: action
                },
                contexts: {
                    cart_item: itemData
                }
            });
            throw error;
        }
    },
    
    // Track database operations
    async trackDatabaseOperation(dbFunction, table, operation) {
        Sentry.setTag('db_table', table);
        Sentry.setTag('db_operation', operation);
        
        try {
            const result = await dbFunction();
            return result;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    error_category: 'database',
                    table: table,
                    operation: operation
                }
            });
            throw error;
        }
    },
    
    // Track authentication
    async trackAuth(authFunction, method) {
        Sentry.setTag('auth_method', method);
        
        try {
            const result = await authFunction();
            
            // Identify user after successful auth
            if (result && result.user) {
                Sentry.setUser({
                    id: result.user.id,
                    email: result.user.email
                });
            }
            
            return result;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    error_category: 'authentication',
                    auth_method: method
                }
            });
            throw error;
        }
    },
    
    // Track API calls
    async trackAPICall(apiFunction, endpoint, method = 'GET') {
        const startTime = performance.now();
        
        try {
            const result = await apiFunction();
            const duration = performance.now() - startTime;
            
            if (duration > 2000) {
                Sentry.captureMessage(`Slow API call: ${endpoint}`, {
                    level: 'warning',
                    tags: {
                        performance_issue: 'true',
                        endpoint: endpoint,
                        duration: duration
                    }
                });
            }
            
            return result;
        } catch (error) {
            Sentry.captureException(error, {
                tags: {
                    error_category: 'api',
                    endpoint: endpoint,
                    method: method
                }
            });
            throw error;
        }
    },
    
    // Track product operations
    trackProductOperation(action, productData) {
        Sentry.addBreadcrumb({
            category: 'product',
            message: `Product ${action}`,
            level: 'info',
            data: productData
        });
    },
    
    // Track order operations
    trackOrderOperation(action, orderData) {
        Sentry.addBreadcrumb({
            category: 'order',
            message: `Order ${action}`,
            level: 'info',
            data: orderData
        });
    },
    
    // Track performance metrics
    trackPerformance(metricName, value, thresholds = {}) {
        if (thresholds.warning && value > thresholds.warning) {
            Sentry.captureMessage(`Performance issue: ${metricName}`, {
                level: value > thresholds.critical ? 'error' : 'warning',
                tags: {
                    performance_issue: 'true',
                    metric_name: metricName,
                    metric_value: value
                }
            });
        }
    },
    
    // Track user actions
    trackUserAction(action, data = {}) {
        Sentry.addBreadcrumb({
            category: 'user_action',
            message: action,
            level: 'info',
            data: data
        });
    },
    
    // Track business metrics
    trackBusinessMetric(metric, value, metadata = {}) {
        Sentry.captureMessage(`Business Metric: ${metric}`, {
            level: 'info',
            tags: {
                metric_type: 'business',
                metric_name: metric,
                metric_value: value
            },
            contexts: {
                business_metric: metadata
            }
        });
    }
};
