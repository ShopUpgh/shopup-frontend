// seller-dashboard-enhanced-script.js
console.log('Enhanced seller dashboard script loaded');

let supabaseClient = null;
let currentUser = null;
let sellerId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        window.location.href = 'login.html';
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    sellerId = currentUser.id;
    
    // Load dashboard data
    await loadDashboardStats();
    await loadRecentOrders();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

async function loadDashboardStats() {
    try {
        // Get all orders for this seller
        const { data: allOrders, error: ordersError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('seller_id', sellerId);
        
        if (ordersError) throw ordersError;
        
        // Today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = allOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= today && order.order_status !== 'cancelled';
        });
        
        const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        document.getElementById('todayRevenue').textContent = `GH₵ ${todayRevenue.toFixed(2)}`;
        document.querySelector('#todayRevenue').nextElementSibling.textContent = `${todayOrders.length} orders today`;
        
        // Pending orders
        const pendingOrders = allOrders.filter(order => 
            order.order_status === 'pending' || order.order_status === 'confirmed'
        );
        document.getElementById('pendingOrders').textContent = pendingOrders.length;
        document.querySelector('#pendingOrders').nextElementSibling.textContent = 'Need attention';
        
        // Total products
        const { count: productCount, error: productError } = await supabaseClient
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', sellerId);
        
        if (!productError) {
            document.getElementById('totalProducts').textContent = productCount || 0;
            document.querySelector('#totalProducts').nextElementSibling.textContent = 'In your store';
        }
        
        // This month's revenue
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const monthOrders = allOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= firstDayOfMonth && order.order_status !== 'cancelled';
        });
        
        const monthRevenue = monthOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        document.getElementById('monthRevenue').textContent = `GH₵ ${monthRevenue.toFixed(2)}`;
        document.querySelector('#monthRevenue').nextElementSibling.textContent = `${monthOrders.length} orders this month`;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const container = document.getElementById('recentOrders');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No orders yet</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => {
            const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const statusClass = `status-${order.order_status}`;
            const statusText = order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1);
            
            return `
                <div class="order-item">
                    <div class="order-info">
                        <div class="order-number">${order.order_number}</div>
                        <div class="order-date">${orderDate} • GH₵ ${parseFloat(order.total).toFixed(2)}</div>
                    </div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recentOrders').innerHTML = 
            '<div class="empty-state">Failed to load orders</div>';
    }
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout');
    }
}

console.log('✅ Enhanced seller dashboard script loaded');
