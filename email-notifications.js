// email-notifications.js
// Helper functions to trigger email notifications

const EMAIL_FUNCTIONS = {
    orderConfirmation: 'send-order-confirmation',
    shippingNotification: 'send-shipping-notification'
};

/**
 * Send order confirmation email
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>}
 */
async function sendOrderConfirmationEmail(orderData) {
    try {
        const supabase = window.supabase;
        
        const payload = {
            to: orderData.customerEmail,
            customerName: orderData.customerName,
            orderNumber: orderData.orderNumber,
            orderDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            items: orderData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price)
            })),
            subtotal: parseFloat(orderData.subtotal),
            tax: parseFloat(orderData.tax || 0),
            deliveryFee: parseFloat(orderData.deliveryFee || 0),
            total: parseFloat(orderData.total),
            deliveryAddress: orderData.deliveryAddress,
            paymentMethod: formatPaymentMethod(orderData.paymentMethod)
        };
        
        const { data, error } = await supabase.functions.invoke(
            EMAIL_FUNCTIONS.orderConfirmation,
            { body: payload }
        );
        
        if (error) throw error;
        
        console.log('✅ Order confirmation email sent:', data);
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Error sending order confirmation email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send shipping notification email
 * @param {Object} shippingData - Shipping details
 * @returns {Promise<Object>}
 */
async function sendShippingNotificationEmail(shippingData) {
    try {
        const supabase = window.supabase;
        
        const payload = {
            to: shippingData.customerEmail,
            customerName: shippingData.customerName,
            orderNumber: shippingData.orderNumber,
            trackingNumber: shippingData.trackingNumber,
            carrier: shippingData.carrier || 'Standard Delivery',
            estimatedDelivery: shippingData.estimatedDelivery || '2-5 business days',
            deliveryAddress: shippingData.deliveryAddress
        };
        
        const { data, error } = await supabase.functions.invoke(
            EMAIL_FUNCTIONS.shippingNotification,
            { body: payload }
        );
        
        if (error) throw error;
        
        console.log('✅ Shipping notification email sent:', data);
        return { success: true, data };
        
    } catch (error) {
        console.error('❌ Error sending shipping notification email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Format payment method for display
 * @param {string} method
 * @returns {string}
 */
function formatPaymentMethod(method) {
    const methods = {
        'card': 'Card Payment',
        'mobile_money': 'Mobile Money',
        'bank_transfer': 'Bank Transfer',
        'cash_on_delivery': 'Cash on Delivery',
        'mtn': 'MTN Mobile Money',
        'vodafone': 'Vodafone Cash',
        'bank': 'Bank Transfer',
        'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
}

/**
 * Example usage in checkout flow
 */
async function exampleCheckoutFlow() {
    // After order is created successfully
    const order = {
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        orderNumber: 'ORD-2025-00001',
        items: [
            { name: 'Product 1', quantity: 2, price: 50.00 },
            { name: 'Product 2', quantity: 1, price: 75.00 }
        ],
        subtotal: 175.00,
        tax: 26.25,
        deliveryFee: 10.00,
        total: 211.25,
        deliveryAddress: '123 Main St, Accra, Greater Accra',
        paymentMethod: 'mtn'
    };
    
    // Send confirmation email
    const result = await sendOrderConfirmationEmail(order);
    
    if (result.success) {
        console.log('Email sent successfully!');
    }
}

/**
 * Example usage for shipping update
 */
async function exampleShippingUpdate() {
    const shipping = {
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        orderNumber: 'ORD-2025-00001',
        trackingNumber: 'TRK123456789',
        carrier: 'DHL Ghana',
        estimatedDelivery: 'December 20, 2025',
        deliveryAddress: '123 Main St, Accra, Greater Accra'
    };
    
    // Send shipping notification
    const result = await sendShippingNotificationEmail(shipping);
    
    if (result.success) {
        console.log('Shipping notification sent!');
    }
}

// Make functions available globally
window.EmailNotifications = {
    sendOrderConfirmation: sendOrderConfirmationEmail,
    sendShippingNotification: sendShippingNotificationEmail
};

console.log('✅ Email notifications helper loaded');
