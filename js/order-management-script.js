/**
 * ShopUp Order Management System - JavaScript Functions
 * Ready-to-use functions for creating, updating, and managing orders
 *
 * Usage: Include this script in your HTML after supabase-config.js
 * <script src="supabase-config.js"></script>
 * <script src="order-management-script.js"></script>
 */

console.log('📦 Order Management System loaded');

// ============================================
// 1. CREATE ORDER
// ============================================

/**
 * Create a new order
 * @param {Object} orderData - Order information
 * @returns {Object} - {success: bool, data: orderData, error: errorMessage}
 */
async function createOrder(orderData) {
    try {
        console.log('📝 Creating new order...');

        // Validate required fields
        if (!orderData.customer_name || !orderData.customer_email || !orderData.total) {
            throw new Error('Missing required fields: customer_name, customer_email, total');
        }

        // Generate order number
        const orderNumber = await generateOrderNumber();

        // Prepare order data
        const order = {
            order_number: orderNumber,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            customer_phone: orderData.customer_phone || '',
            delivery_address: orderData.delivery_address || '',
            delivery_city: orderData.delivery_city || '',
            delivery_region: orderData.delivery_region || '',
            delivery_postal: orderData.delivery_postal || '',
            payment_method: orderData.payment_method || 'cod',
            payment_status: 'pending',
            subtotal: orderData.subtotal || 0,
            tax: orderData.tax || 0,
            shipping_fee: orderData.shipping_fee || 0,
            total: orderData.total,
            special_instructions: orderData.special_instructions || '',
            seller_id: orderData.seller_id,
            notes: orderData.notes || ''
        };

        // Insert into database
        const { data, error } = await supabase
            .from('orders')
            .insert([order])
            .select();

        if (error) throw error;

        console.log('✅ Order created successfully:', data[0].order_number);
        return { success: true, data: data[0] };

    } catch (error) {
        console.error('❌ Error creating order:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 2. ADD ITEMS TO ORDER
// ============================================

/**
 * Add items to an order
 * @param {string} orderId - Order UUID
 * @param {Array} items - Array of items to add
 * @returns {Object} - {success: bool, data: itemsData, error: errorMessage}
 */
async function addOrderItems(orderId, items) {
    try {
        console.log('📦 Adding items to order...');

        if (!items || items.length === 0) {
            throw new Error('No items provided');
        }

        // Prepare items with calculated line totals
        const preparedItems = items.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            seller_id: item.seller_id,
            product_name: item.product_name,
            product_sku: item.product_sku || '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.quantity * item.unit_price,
            product_description: item.product_description || '',
            product_category: item.product_category || ''
        }));

        // Insert items
        const { data, error } = await supabase
            .from('order_items')
            .insert(preparedItems)
            .select();

        if (error) throw error;

        console.log('✅ Items added to order:', data.length, 'items');
        return { success: true, data };

    } catch (error) {
        console.error('❌ Error adding items:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 3. GET ORDERS
// ============================================

/**
 * Get all orders for a seller
 * @param {string} sellerId - Seller UUID
 * @param {string} status - Filter by status (optional)
 * @returns {Object} - {success: bool, data: ordersData, error: errorMessage}
 */
async function getSellerOrders(sellerId, status = null) {
    try {
        console.log('📋 Fetching seller orders...');

        let query = supabase
            .from('orders')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('order_status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log('✅ Orders fetched:', data.length, 'orders');
        return { success: true, data };

    } catch (error) {
        console.error('❌ Error fetching orders:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get orders by customer email
 * @param {string} email - Customer email
 * @returns {Object} - {success: bool, data: ordersData, error: errorMessage}
 */
async function getCustomerOrders(email) {
    try {
        console.log('📋 Fetching customer orders...');

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('✅ Customer orders fetched:', data.length, 'orders');
        return { success: true, data };

    } catch (error) {
        console.error('❌ Error fetching customer orders:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get a single order with all details
 * @param {string} orderId - Order UUID
 * @returns {Object} - {success: bool, data: orderData, error: errorMessage}
 */
async function getOrderDetails(orderId) {
    try {
        console.log('📋 Fetching order details...');

        // Get order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError) throw orderError;

        // Get items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // Get tracking
        const { data: tracking, error: trackingError } = await supabase
            .from('order_tracking')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (trackingError) throw trackingError;

        const orderDetails = {
            ...order,
            items,
            tracking
        };

        console.log('✅ Order details fetched');
        return { success: true, data: orderDetails };

    } catch (error) {
        console.error('❌ Error fetching order details:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 4. UPDATE ORDER STATUS
// ============================================

/**
 * Update order status
 * @param {string} orderId - Order UUID
 * @param {string} newStatus - New status (pending, confirmed, shipped, delivered, cancelled)
 * @param {string} message - Status message
 * @returns {Object} - {success: bool, data: updated, error: errorMessage}
 */
async function updateOrderStatus(orderId, newStatus, message = '') {
    try {
        console.log('📝 Updating order status...');

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Use the RPC function to update and log
        const { data, error } = await supabase.rpc('update_order_status', {
            order_id: orderId,
            new_status: newStatus,
            status_message: message || `Order status changed to ${newStatus}`,
            updated_by_role: 'seller',
            updated_by_id: user.id
        });

        if (error) throw error;

        console.log('✅ Order status updated to:', newStatus);
        return { success: true, data };

    } catch (error) {
        console.error('❌ Error updating order status:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 5. GET ORDER STATISTICS
// ============================================

/**
 * Get seller order statistics
 * @param {string} sellerId - Seller UUID
 * @returns {Object} - {success: bool, data: statsData, error: errorMessage}
 */
async function getSellerOrderStats(sellerId) {
    try {
        console.log('📊 Fetching seller statistics...');

        const { data, error } = await supabase
            .from('seller_orders_summary')
            .select('*')
            .eq('seller_id', sellerId)
            .single();

        if (error) throw error;

        console.log('✅ Statistics fetched');
        return { success: true, data };

    } catch (error) {
        console.error('❌ Error fetching statistics:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get order summary via function
 * @param {string} orderId - Order UUID
 * @returns {Object} - {success: bool, data: summaryData, error: errorMessage}
 */
async function getOrderSummary(orderId) {
    try {
        console.log('📋 Fetching order summary...');

        const { data, error } = await supabase.rpc('get_order_summary', {
            order_id: orderId
        });

        if (error) throw error;

        console.log('✅ Order summary fetched');
        return { success: true, data: data[0] };

    } catch (error) {
        console.error('❌ Error fetching summary:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 6. UPDATE ORDER DETAILS
// ============================================

/**
 * Update order delivery details
 * @param {string} orderId - Order UUID
 * @param {Object} updates - Fields to update
 * @returns {Object} - {success: bool, data: updated, error: errorMessage}
 */
async function updateOrderDetails(orderId, updates) {
    try {
        console.log('📝 Updating order details...');

        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)
            .select();

        if (error) throw error;

        console.log('✅ Order details updated');
        return { success: true, data: data[0] };

    } catch (error) {
        console.error('❌ Error updating order:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Add tracking number to order
 * @param {string} orderId - Order UUID
 * @param {string} trackingNumber - Tracking number
 * @param {string} carrier - Carrier name (optional)
 * @returns {Object} - {success: bool, data: updated, error: errorMessage}
 */
async function addTrackingNumber(orderId, trackingNumber, carrier = '') {
    try {
        console.log('📍 Adding tracking number...');

        const { data, error } = await supabase
            .from('orders')
            .update({
                tracking_number: trackingNumber,
                notes: `Shipped via ${carrier || 'courier'}`
            })
            .eq('id', orderId)
            .select();

        if (error) throw error;

        console.log('✅ Tracking number added:', trackingNumber);
        return { success: true, data: data[0] };

    } catch (error) {
        console.error('❌ Error adding tracking:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 7. ORDER STATISTICS & ANALYTICS
// ============================================

/**
 * Get total revenue for seller
 * @param {string} sellerId - Seller UUID
 * @returns {Object} - {success: bool, data: revenue, error: errorMessage}
 */
async function getSellerRevenue(sellerId) {
    try {
        console.log('💰 Calculating seller revenue...');

        const { data, error } = await supabase
            .from('orders')
            .select('total')
            .eq('seller_id', sellerId)
            .eq('order_status', 'delivered');

        if (error) throw error;

        const totalRevenue = data.reduce((sum, order) => sum + order.total, 0);

        console.log('✅ Revenue calculated:', totalRevenue);
        return { success: true, data: totalRevenue };

    } catch (error) {
        console.error('❌ Error calculating revenue:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Get order counts by status
 * @param {string} sellerId - Seller UUID
 * @returns {Object} - {success: bool, data: counts, error: errorMessage}
 */
async function getOrderCounts(sellerId) {
    try {
        console.log('📊 Counting orders by status...');

        const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        const counts = {};

        for (const status of statuses) {
            const { count, error } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('seller_id', sellerId)
                .eq('order_status', status);

            if (error) throw error;
            counts[status] = count;
        }

        console.log('✅ Orders counted:', counts);
        return { success: true, data: counts };

    } catch (error) {
        console.error('❌ Error counting orders:', error.message);
        return { success: false, error: error.message };
    }
}

// ============================================
// 8. HELPER FUNCTIONS
// ============================================

/**
 * Generate order number (calls database function)
 * @returns {string} - Generated order number (ORD-2025-00001)
 */
async function generateOrderNumber() {
    try {
        const { data, error } = await supabase.rpc('generate_order_number');

        if (error) throw error;

        console.log('✅ Order number generated:', data);
        return data;

    } catch (error) {
        console.error('❌ Error generating order number:', error.message);
        // Fallback: generate client-side
        const timestamp = Date.now();
        return `ORD-${new Date().getFullYear()}-${timestamp.toString().slice(-5)}`;
    }
}

/**
 * Format order for display
 * @param {Object} order - Order object
 * @returns {Object} - Formatted order
 */
function formatOrder(order) {
    return {
        ...order,
        total_formatted: `GHS ${order.total.toFixed(2)}`,
        created_date: new Date(order.created_at).toLocaleDateString(),
        created_time: new Date(order.created_at).toLocaleTimeString(),
        status_badge: getStatusBadge(order.order_status),
        payment_badge: getPaymentBadge(order.payment_status)
    };
}

/**
 * Get status badge HTML
 * @param {string} status - Order status
 * @returns {string} - HTML badge
 */
function getStatusBadge(status) {
    const badges = {
        pending: '⏳ Pending',
        confirmed: '✅ Confirmed',
        shipped: '📦 Shipped',
        delivered: '🎉 Delivered',
        cancelled: '❌ Cancelled'
    };
    return badges[status] || status;
}

/**
 * Get payment badge HTML
 * @param {string} status - Payment status
 * @returns {string} - HTML badge
 */
function getPaymentBadge(status) {
    const badges = {
        pending: '⏳ Pending',
        processing: '⚙️ Processing',
        completed: '✅ Paid',
        failed: '❌ Failed'
    };
    return badges[status] || status;
}

// ============================================
// 9. REAL-TIME LISTENING (Optional - Future)
// ============================================

/**
 * Subscribe to order updates (real-time)
 * @param {string} orderId - Order UUID
 * @param {Function} callback - Function to call when order updates
 * @returns {Function} - Unsubscribe function
 */
function subscribeToOrderUpdates(orderId, callback) {
    console.log('📡 Subscribing to order updates:', orderId);

    const subscription = supabase
        .from(`orders:id=eq.${orderId}`)
        .on('*', payload => {
            console.log('🔔 Order updated:', payload);
            callback(payload);
        })
        .subscribe();

    return () => subscription.unsubscribe();
}

// ============================================
// 10. EXPORT FUNCTIONS
// ============================================

console.log('✅ Order Management System ready');

// All functions are globally available:
// createOrder(), addOrderItems(), getSellerOrders(), etc.
