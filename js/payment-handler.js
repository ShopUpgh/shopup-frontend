/**
 * ShopUp Ghana - Secure Payment Handler
 * 
 * This module handles payment processing with proper verification:
 * 1. Initiates Paystack payment
 * 2. Verifies payment with backend before order creation
 * 3. Handles payment callbacks and errors
 * 4. Implements security best practices
 */

const PaymentHandler = {
    /**
     * Initialize secure payment flow
     * 
     * @param {Object} options Payment options
     * @param {string} options.email Customer email
     * @param {number} options.amount Order amount in cedis
     * @param {string} options.customerName Customer name
     * @param {string} options.customerPhone Customer phone
     * @param {Object} options.orderData Order data (NOT created yet)
     * @returns {Promise<Object>} Payment result
     */
    async initiatePayment(options) {
        try {
            const {
                email,
                amount,
                customerName,
                customerPhone,
                orderData
            } = options;

            // Validate inputs
            if (!email || !amount || !orderData) {
                throw new Error('Missing required payment parameters');
            }

            // Generate unique transaction reference
            const reference = this.generateReference();

            console.log('💳 Initiating payment:', {
                reference,
                amount: `GH₵ ${amount.toFixed(2)}`,
                email
            });

            // Load Paystack if not already loaded
            await this.loadPaystack();

            // Get Paystack configuration from AppConfig
            const config = window.AppConfig?.paystack || window.PAYSTACK_CONFIG;
            
            if (!config || !config.publicKey) {
                throw new Error('Paystack configuration not loaded');
            }

            // Open Paystack payment modal
            const paystackResponse = await this.openPaystackModal({
                email,
                amount,
                reference,
                customerName,
                customerPhone,
                config,
                orderData
            });

            console.log('✅ Paystack payment completed:', paystackResponse);

            // CRITICAL: Verify payment with backend before creating order
            const verificationResult = await this.verifyPayment(
                reference,
                amount,
                orderData
            );

            if (!verificationResult.success || !verificationResult.verified) {
                throw new Error('Payment verification failed: ' + (verificationResult.error || 'Unknown error'));
            }

            console.log('✅ Payment verified successfully');

            return {
                success: true,
                reference,
                payment: verificationResult.payment,
                verified: true
            };

        } catch (error) {
            console.error('❌ Payment failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Open Paystack payment modal
     */
    openPaystackModal(options) {
        return new Promise((resolve, reject) => {
            if (typeof PaystackPop === 'undefined') {
                reject(new Error('Paystack library not loaded'));
                return;
            }

            const handler = PaystackPop.setup({
                key: options.config.publicKey,
                email: options.email,
                amount: Math.round(options.amount * 100), // Convert to kobo
                currency: 'GHS',
                ref: options.reference,
                channels: options.config.channels || ['card', 'mobile_money', 'bank_transfer'],
                metadata: {
                    custom_fields: [
                        {
                            display_name: "Customer Name",
                            variable_name: "customer_name",
                            value: options.customerName
                        },
                        {
                            display_name: "Customer Phone",
                            variable_name: "customer_phone",
                            value: options.customerPhone
                        },
                        {
                            display_name: "Platform",
                            variable_name: "platform",
                            value: "ShopUp"
                        }
                    ]
                },
                onClose: function() {
                    reject(new Error('Payment cancelled by user'));
                },
                callback: function(response) {
                    console.log('Paystack callback:', response);
                    resolve(response);
                }
            });

            handler.openIframe();
        });
    },

    /**
     * Verify payment with backend (CRITICAL SECURITY STEP)
     * 
     * This prevents fraudulent orders by validating with Paystack API
     * via a secure backend function.
     */
    async verifyPayment(reference, amount, orderData) {
        try {
            console.log('🔍 Verifying payment with backend...');

            // Get Supabase URL from config
            const supabaseUrl = window.AppConfig?.supabase?.url || window.SUPABASE_URL;
            
            if (!supabaseUrl) {
                throw new Error('Supabase URL not configured');
            }

            // Call verification edge function
            const response = await fetch(`${supabaseUrl}/functions/v1/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.AppConfig?.supabase?.anonKey || window.SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    reference,
                    orderId: orderData.tempOrderId || 'pending',
                    amount: parseFloat(amount)
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Payment verification failed');
            }

            const result = await response.json();

            if (!result.success || !result.verified) {
                throw new Error(result.error || 'Payment not verified');
            }

            return result;

        } catch (error) {
            console.error('Payment verification error:', error);
            throw error;
        }
    },

    /**
     * Generate unique transaction reference
     */
    generateReference() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10).toUpperCase();
        return `SHOPUP-${timestamp}-${random}`;
    },

    /**
     * Load Paystack library dynamically
     */
    async loadPaystack() {
        // Check if already loaded
        if (typeof PaystackPop !== 'undefined') {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Paystack library loaded');
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ Failed to load Paystack library');
                reject(new Error('Failed to load Paystack'));
            };
            
            document.head.appendChild(script);
        });
    },

    /**
     * Format amount for display
     */
    formatAmount(amount) {
        return `GH₵ ${parseFloat(amount).toFixed(2)}`;
    },

    /**
     * Create order AFTER payment verification
     * 
     * This is the secure flow: Payment → Verify → Create Order
     */
    async createOrderAfterPayment(orderData, paymentDetails) {
        try {
            console.log('Creating order after payment verification...');

            // Add payment reference to order data
            orderData.payment_reference = paymentDetails.reference;
            orderData.payment_status = 'paid';
            orderData.payment_method = paymentDetails.payment?.payment_channel || 'paystack';

            // Use existing createOrder function
            if (typeof createOrder === 'function') {
                const result = await createOrder(orderData);
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to create order');
                }

                return result;
            } else {
                throw new Error('createOrder function not available');
            }

        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }
};

// Make available globally
window.PaymentHandler = PaymentHandler;

console.log('✅ PaymentHandler loaded');
