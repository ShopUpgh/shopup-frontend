// paystack-config.js
// Paystack Integration Configuration

console.log('Paystack config loading...');

// ============================================
// CONFIGURATION
// ============================================

const PAYSTACK_CONFIG = {
    // Get from https://dashboard.paystack.com/#/settings/developer
    publicKey: 'pk_live_8f9d31f1db8aa5210a2a4a9510432101a438ffff', // Use pk_live_ for production
    
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

console.log('✅ Paystack config loaded');
