// orders-script-FIXED.js
// Added: Call to updateNavigationCounts after orders load
// Wrapped in IIFE to avoid global scope conflicts with shared-nav.js

console.log('Orders script loaded with Supabase integration');

(function() {
    // Use local variables to avoid conflicts with shared-nav.js
    let ordersSupabase = null;
    let ordersCurrentUser = null;

// Initialize when Supabase is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Orders page DOM loaded');
    
    // Wait for Supabase to be ready
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('Supabase not available');
        return;
    }
    
    ordersSupabase = window.supabase;
    console.log('Supabase ready for orders');
    
    // Get current user session
    try {
        const { data: { session } } = await ordersSupabase.auth.getSession();
        if (session) {
            ordersCurrentUser = session.user;
            console.log('Session found:', ordersCurrentUser.id);
            console.log('User authenticated for orders:', ordersCurrentUser.id);
        } else {
            console.log('No session - user not logged in');
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Error getting session:', error);
        return;
    }
    
    // Load and display orders
    await loadOrders();
    
    // 🆕 IMPORTANT: Update navigation counts after orders load
    if (window.updateNavigationCounts) {
        console.log('🔄 Calling updateNavigationCounts from orders page');
        await window.updateNavigationCounts();
    } else {
        console.warn('⚠️ updateNavigationCounts not available yet');
    }
    
    // Setup filter handlers
    setupFilters();
});

// Load orders from Supabase
async function loadOrders(status = null) {
    try {
        if (!ordersCurrentUser) {
            console.error('No user - cannot load orders');
            return;
        }
        
        let query = ordersSupabase
            .from('orders')
            .select('*')
            .eq('seller_id', ordersCurrentUser.id)
            .order('created_at', { ascending: false });
        
        // Apply status filter if provided
        if (status && status !== 'all') {
            query = query.eq('order_status', status);
        }
        
        const { data: orders, error } = await query;
        
        if (error) {
            console.error('Error loading orders:', error);
            return;
        }
        
        console.log('Loaded ' + orders.length + ' orders from Supabase');
        
        // Display orders in the UI
        displayOrders(orders);
        
    } catch (error) {
        console.error('Error in loadOrders:', error);
    }
}

// Display orders in the order grid/list
function displayOrders(orders) {
    const orderList = document.getElementById('orderList');
    if (!orderList) {
        console.log('Order list not found on this page');
        return;
    }
    
    if (orders.length === 0) {
        orderList.innerHTML = `
            <div class="no-orders">
                <p>No orders yet. Orders will appear here when customers place them.</p>
            </div>
        `;
        return;
    }
    
    // SECURITY: Sanitize order data before display
    orderList.innerHTML = orders.map(order => {
        const safeOrderNumber = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.order_number) : order.order_number;
        const safeCustomerName = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.customer_name) : order.customer_name;
        const safeStatus = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.order_status) : order.order_status;
        const safePaymentMethod = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.payment_method) : order.payment_method;
        const safePaymentStatus = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.payment_status) : order.payment_status;
        const safeTracking = order.tracking_number ? (typeof sanitizeHTML === 'function' ? sanitizeHTML(order.tracking_number) : order.tracking_number) : '';
        const safeTotal = parseFloat(order.total).toFixed(2);
        
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <span class="order-number">${safeOrderNumber}</span>
                    <span class="order-status status-${safeStatus}">${safeStatus}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${safeCustomerName}</p>
                    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> GH₵ ${safeTotal}</p>
                    <p><strong>Payment:</strong> ${safePaymentMethod} (${safePaymentStatus})</p>
                    ${safeTracking ? `<p><strong>Tracking:</strong> ${safeTracking}</p>` : ''}
                </div>
                <div class="order-actions">
                    <button onclick="viewOrder('${order.id}')" class="btn-view">View Details</button>
                    ${order.order_status === 'pending' ? `
                        <button onclick="confirmOrder('${order.id}')" class="btn-confirm">Confirm</button>
                    ` : ''}
                    ${order.order_status === 'confirmed' ? `
                        <button onclick="shipOrder('${order.id}')" class="btn-ship">Mark as Shipped</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Setup filter handlers
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Load orders with selected filter
            const status = btn.dataset.status;
            loadOrders(status);
        });
    });
}

// View order details (placeholder)
window.viewOrder = function(orderId) {
    console.log('View order:', orderId);
    // TODO: Show modal or navigate to order details page
    window.location.href = `order-details.html?id=${orderId}`;
};

// Confirm order
window.confirmOrder = async function(orderId) {
    if (!confirm('Confirm this order?')) return;
    
    try {
        const { error } = await ordersSupabase
            .from('orders')
            .update({ 
                order_status: 'confirmed',
                payment_status: 'paid',
                confirmed_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .eq('seller_id', ordersCurrentUser.id);
        
        if (error) throw error;
        
        console.log('Order confirmed successfully');
        alert('Order confirmed!');
        
        // Reload orders
        await loadOrders();
        
        // 🆕 Update navigation counts after confirming order
        if (window.updateNavigationCounts) {
            await window.updateNavigationCounts();
        }
        
    } catch (error) {
        console.error('Error confirming order:', error);
        alert('Failed to confirm order: ' + error.message);
    }
};

// Ship order
window.shipOrder = async function(orderId) {
    const trackingNumber = prompt('Enter tracking number:');
    if (!trackingNumber) return;
    
    try {
        const { error } = await ordersSupabase
            .from('orders')
            .update({ 
                order_status: 'shipped',
                tracking_number: trackingNumber,
                shipped_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .eq('seller_id', ordersCurrentUser.id);
        
        if (error) throw error;
        
        console.log('Order marked as shipped');
        alert('Order marked as shipped!');
        
        // Reload orders
        await loadOrders();
        
        // 🆕 Update navigation counts after shipping order
        if (window.updateNavigationCounts) {
            await window.updateNavigationCounts();
        }
        
    } catch (error) {
        console.error('Error shipping order:', error);
        alert('Failed to mark order as shipped: ' + error.message);
    }
};

console.log('✅ Orders script fully loaded');

})(); // End of IIFE