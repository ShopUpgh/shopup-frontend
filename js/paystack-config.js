// paystack-config.js
// Paystack Integration Configuration
// SECURITY: Environment-based key switching for production safety

console.log('Paystack config loading...');

// ============================================
// ENVIRONMENT DETECTION
// ============================================

const PaystackEnv = {
    isDevelopment: function() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('preview') ||
               window.location.hostname.includes('test') ||
               window.location.hostname.includes('.local');
    },
    
    isProduction: function() {
        return !this.isDevelopment();
    },
    
    getEnvironment: function() {
        return this.isProduction() ? 'production' : 'development';
    }
};

// ============================================
// CONFIGURATION
// ============================================

const PAYSTACK_CONFIG = {
    // Environment-based key selection
    // IMPORTANT: Replace 'pk_live_YOUR_LIVE_KEY_HERE' with actual live key before production
    publicKey: PaystackEnv.isProduction() 
        ? 'pk_live_YOUR_LIVE_KEY_HERE'  // ⚠️ REPLACE WITH LIVE KEY
        : 'pk_test_568969ab37dbf86e712189b75c2db0edb8f25afc',  // Test key for development
    
    // Webhook URLs (configured in Paystack dashboard)
    webhookUrls: {
        payment: 'https://brbewkxpvihnsrbrlpzq.supabase.co/functions/v1/paystack-webhook',
        subscription: 'https://svjixgpkygbbptltwwji.supabase.co/functions/v1/paystack-subscription-webhook'
    },
    
    // Supported channels
    channels: ['card', 'mobile_money', 'bank_transfer'],
    
    // Mobile Money Networks in Ghana
    mobileMoneyNetworks: {
        mtn: 'MTN Mobile Money',
        vod: 'Vodafone Cash',
        tgo: 'AirtelTigo Money'
    },
    
    // Currency
    currency: 'GHS',
    
    // Callback URLs
    callbackUrl: window.location.origin + '/payment-callback.html',
    
    // Metadata
    metadata: {
        custom_fields: [
            {
                display_name: "Platform",
                variable_name: "platform",
                value: "ShopUp"
            }
        ]
    },
    
    // Environment info
    environment: PaystackEnv.getEnvironment(),
    
    // Validation method
    validateConfiguration: function() {
        const warnings = [];
        const errors = [];
        
        // Check if using test key in production
        if (PaystackEnv.isProduction() && this.publicKey.includes('test')) {
            errors.push('⚠️ CRITICAL: Using TEST Paystack key in PRODUCTION environment!');
            errors.push('   Real transactions will NOT work. Update publicKey to live key.');
        }
        
        // Check if live key placeholder is still present
        if (this.publicKey.includes('YOUR_LIVE_KEY_HERE')) {
            errors.push('⚠️ CRITICAL: Paystack live key placeholder not replaced!');
            errors.push('   Update publicKey with actual live key from Paystack dashboard.');
        }
        
        // Check if using production key in development
        if (PaystackEnv.isDevelopment() && this.publicKey.includes('live')) {
            warnings.push('⚠️ WARNING: Using LIVE Paystack key in development!');
            warnings.push('   Consider using test key for development to avoid real charges.');
        }
        
        return { warnings, errors, isValid: errors.length === 0 };
    }
};

// ============================================
// PAYSTACK HELPERS
// ============================================

const PaystackHelper = {
    
    // Initialize payment
    initializePayment: function(options) {
        return new Promise((resolve, reject) => {
            if (typeof PaystackPop === 'undefined') {
                reject(new Error('Paystack library not loaded'));
                return;
            }
            
            const handler = PaystackPop.setup({
                key: PAYSTACK_CONFIG.publicKey,
                email: options.email,
                amount: Math.round(options.amount * 100), // Convert to kobo
                currency: PAYSTACK_CONFIG.currency,
                ref: options.reference,
                channels: options.channels || PAYSTACK_CONFIG.channels,
                metadata: {
                    ...PAYSTACK_CONFIG.metadata,
                    ...(options.metadata || {}),
                    customer_name: options.customerName,
                    customer_phone: options.customerPhone,
                    order_id: options.orderId
                },
                callback: function(response) {
                    resolve(response);
                },
                onClose: function() {
                    reject(new Error('Payment cancelled'));
                }
            });
            
            handler.openIframe();
        });
    },
    
    // Generate transaction reference
    generateReference: function() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `TXN-${timestamp}-${random}`.toUpperCase();
    },
    
    // Format amount for display
    formatAmount: function(amount) {
        return `GH₵ ${parseFloat(amount).toFixed(2)}`;
    },
    
    // Convert amount to kobo
    toKobo: function(amount) {
        return Math.round(parseFloat(amount) * 100);
    },
    
    // Convert kobo to cedis
    fromKobo: function(kobo) {
        return parseFloat(kobo / 100).toFixed(2);
    },
    
    // Verify payment (call your backend)
    verifyPayment: async function(reference, supabase) {
        try {
            // Record transaction in database
            const { data, error } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('transaction_ref', reference)
                .single();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Verification error:', error);
            throw error;
        }
    },
    
    // Create transaction record
    createTransaction: async function(transactionData, supabase) {
        try {
            const { data, error } = await supabase
                .from('payment_transactions')
                .insert([{
                    transaction_ref: transactionData.reference,
                    paystack_reference: transactionData.paystackReference,
                    order_id: transactionData.orderId,
                    customer_id: transactionData.customerId,
                    amount: transactionData.amount,
                    currency: 'GHS',
                    payment_method: transactionData.paymentMethod,
                    payment_channel: transactionData.channel,
                    customer_email: transactionData.email,
                    customer_phone: transactionData.phone,
                    status: transactionData.status || 'pending'
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Transaction creation error:', error);
            throw error;
        }
    },
    
    // Update transaction status
    updateTransaction: async function(reference, status, paystackResponse, supabase) {
        try {
            const { data, error } = await supabase
                .from('payment_transactions')
                .update({
                    status: status,
                    paystack_status: paystackResponse.status,
                    paystack_message: paystackResponse.message,
                    paystack_response: paystackResponse,
                    paid_at: status === 'success' ? new Date().toISOString() : null
                })
                .eq('transaction_ref', reference)
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Transaction update error:', error);
            throw error;
        }
    },
    
    // Get payment methods for customer
    getPaymentMethods: async function(customerId, supabase) {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('customer_id', customerId)
                .eq('is_active', true)
                .order('is_default', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            return [];
        }
    },
    
    // Save payment method
    savePaymentMethod: async function(methodData, supabase) {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .insert([methodData])
                .select()
                .single();
            
            if (error) throw error;
            
            return data;
        } catch (error) {
            console.error('Error saving payment method:', error);
            throw error;
        }
    }
};

// ============================================
// LOAD PAYSTACK SCRIPT
// ============================================

function loadPaystackScript() {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof PaystackPop !== 'undefined') {
            console.log('Paystack already loaded');
            resolve();
            return;
        }
        
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
}

// Auto-load Paystack on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPaystackScript);
} else {
    loadPaystackScript();
}

// Make available globally
window.PAYSTACK_CONFIG = PAYSTACK_CONFIG;
window.PaystackHelper = PaystackHelper;
window.PaystackEnv = PaystackEnv;

// Validate configuration on load
const validation = PAYSTACK_CONFIG.validateConfiguration();

console.log('✅ Paystack config loaded');
console.log('📍 Environment:', PAYSTACK_CONFIG.environment);
console.log('🔑 Key type:', PAYSTACK_CONFIG.publicKey.includes('test') ? 'TEST' : 'LIVE');

// Display warnings
if (validation.warnings.length > 0) {
    console.warn('⚠️ Paystack Configuration Warnings:');
    validation.warnings.forEach(w => console.warn(w));
}

// Display errors (critical)
if (validation.errors.length > 0) {
    console.error('❌ Paystack Configuration Errors:');
    validation.errors.forEach(e => console.error(e));
    
    // Show alert in production if misconfigured
    if (PaystackEnv.isProduction()) {
        alert('CRITICAL: Payment system is not configured for production. Transactions will not work. Contact support.');
    }
}
