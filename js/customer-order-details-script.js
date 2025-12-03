// customer-order-details-script.js
console.log('Order details script loaded');

let supabaseClient = null;
let currentUser = null;
let orderId = null;
let orderData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id');
    
    if (!orderId) {
        alert('No order ID provided');
        window.location.href = 'customer-orders.html';
        return;
    }
    
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Load order
    await loadOrder();
});

async function loadOrder() {
    try {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_name,
                    quantity,
                    unit_price,
                    line_total
                )
            `)
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        
        if (!order) {
            alert('Order not found');
            window.location.href = 'customer-orders.html';
            return;
        }
        
        orderData = order;
        displayOrder();
        
    } catch (error) {
        console.error('Error loading order:', error);
        alert('Failed to load order details');
        window.location.href = 'customer-orders.html';
    }
}

function displayOrder() {
    // Order number
    document.getElementById('orderNumber').textContent = orderData.order_number;
    
    // Order status
    const statusElement = document.getElementById('orderStatus');
    const statusText = orderData.order_status.charAt(0).toUpperCase() + orderData.order_status.slice(1);
    statusElement.textContent = statusText;
    statusElement.className = `order-status status-${orderData.order_status}`;
    
    // Order date
    const orderDate = new Date(orderData.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('orderDate').textContent = orderDate;
    
    // Payment method
    document.getElementById('paymentMethod').textContent = formatPaymentMethod(orderData.payment_method);
    
    // Total amount
    document.getElementById('totalAmount').textContent = `GH₵ ${parseFloat(orderData.total).toFixed(2)}`;
    
    // Order tracking
    displayTracking();
    
    // Order items
    displayItems();
    
    // Delivery address
    displayAddress();
    
    // Actions
    displayActions();
}

function displayTracking() {
    const timeline = document.getElementById('trackingTimeline');
    
    const steps = [
        {
            title: 'Order Placed',
            date: orderData.created_at,
            completed: true
        },
        {
            title: 'Order Confirmed',
            date: orderData.confirmed_at,
            completed: !!orderData.confirmed_at
        },
        {
            title: 'Processing',
            date: orderData.processing_at,
            completed: !!orderData.processing_at || orderData.order_status === 'processing' || orderData.order_status === 'shipped' || orderData.order_status === 'delivered'
        },
        {
            title: 'Shipped',
            date: orderData.shipped_at,
            completed: !!orderData.shipped_at || orderData.order_status === 'shipped' || orderData.order_status === 'delivered'
        },
        {
            title: 'Delivered',
            date: orderData.delivered_at,
            completed: !!orderData.delivered_at || orderData.order_status === 'delivered'
        }
    ];
    
    if (orderData.order_status === 'cancelled') {
        timeline.innerHTML = `
            <div class="tracking-step completed">
                <div class="step-title">Order Cancelled</div>
                <div class="step-date">${formatDate(orderData.cancelled_at || orderData.updated_at)}</div>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = steps.map(step => `
        <div class="tracking-step ${step.completed ? 'completed' : ''}">
            <div class="step-title">${step.title}</div>
            <div class="step-date">${step.date ? formatDate(step.date) : 'Pending'}</div>
        </div>
    `).join('');
}

function displayItems() {
    const tbody = document.getElementById('orderItems');
    
    if (!orderData.order_items || orderData.order_items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orderData.order_items.map(item => `
        <tr>
            <td class="product-name">${item.product_name}</td>
            <td>${item.quantity}</td>
            <td>GH₵ ${parseFloat(item.unit_price).toFixed(2)}</td>
            <td>GH₵ ${parseFloat(item.line_total).toFixed(2)}</td>
        </tr>
    `).join('');
    
    // Price summary
    document.getElementById('subtotal').textContent = `GH₵ ${parseFloat(orderData.subtotal).toFixed(2)}`;
    document.getElementById('deliveryFee').textContent = `GH₵ ${parseFloat(orderData.delivery_fee || 0).toFixed(2)}`;
    document.getElementById('tax').textContent = `GH₵ ${parseFloat(orderData.tax || 0).toFixed(2)}`;
    document.getElementById('total').textContent = `GH₵ ${parseFloat(orderData.total).toFixed(2)}`;
}

function displayAddress() {
    const addressBox = document.getElementById('deliveryAddress');
    
    addressBox.innerHTML = `
        <strong>${orderData.customer_name}</strong><br>
        ${orderData.customer_phone}<br>
        ${orderData.delivery_address}<br>
        ${orderData.delivery_city}, ${orderData.delivery_region}
        ${orderData.delivery_postal ? '<br>' + orderData.delivery_postal : ''}
    `;
}

function displayActions() {
    const actionsDiv = document.getElementById('orderActions');
    let actions = '';
    
    if (orderData.order_status === 'pending' || orderData.order_status === 'confirmed') {
        actions += `<button class="btn btn-danger" onclick="cancelOrder()">Cancel Order</button>`;
    }
    
    if (orderData.order_status === 'delivered') {
        actions += `<button class="btn btn-primary" onclick="reorder()">Order Again</button>`;
    }
    
    actions += `<button class="btn btn-primary" onclick="window.print()">Print Receipt</button>`;
    
    actionsDiv.innerHTML = actions;
}

window.cancelOrder = async function() {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('orders')
            .update({ 
                order_status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', orderId);
        
        if (error) throw error;
        
        alert('Order cancelled successfully');
        window.location.reload();
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Failed to cancel order');
    }
};

window.reorder = function() {
    if (!orderData.order_items) return;
    
    const cart = orderData.order_items.map(item => ({
        id: item.product_id || item.id,
        name: item.product_name,
        price: parseFloat(item.unit_price),
        quantity: item.quantity
    }));
    
    sessionStorage.setItem('cart', JSON.stringify(cart));
    window.location.href = 'cart.html';
};

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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

console.log('✅ Order details script loaded');
