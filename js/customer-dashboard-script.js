// customer-dashboard-script.js
console.log('Customer dashboard script loaded');

let supabaseClient = null;
let currentUser = null;
let customerProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loading...');
    
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
    
    // Check authentication
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    currentUser = session.user;
    console.log('User authenticated:', currentUser.id);
    
    // Load everything
    await loadCustomerProfile();
    await loadStats();
    await loadRecentOrders();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
});

// Load customer profile
async function loadCustomerProfile() {
    try {
        const { data, error } = await supabaseClient
            .from('customer_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        customerProfile = data;
        
        // Update UI
        const firstName = data.first_name || 'Customer';
        document.getElementById('userName').textContent = firstName;
        document.getElementById('userEmail').textContent = data.email;
        
        // Profile section
        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || '-';
        document.getElementById('profileName').textContent = fullName;
        document.getElementById('profileEmail').textContent = data.email;
        document.getElementById('profilePhone').textContent = data.phone || '-';
        
        const memberDate = new Date(data.created_at).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long'
        });
        document.getElementById('memberSince').textContent = memberDate;
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        // Get customer_id
        const { data: profile } = await supabaseClient
            .from('customer_profiles')
            .select('id, total_orders, total_spent')
            .eq('user_id', currentUser.id)
            .single();
        
        if (profile) {
            // Update stats from profile
            document.getElementById('totalOrders').textContent = profile.total_orders || 0;
            document.getElementById('totalSpent').textContent = 
                `GH₵ ${parseFloat(profile.total_spent || 0).toFixed(2)}`;
            
            // Count pending orders
            const { count: pendingCount } = await supabaseClient
                .from('orders')
                .select('id', { count: 'exact', head: true })
                .eq('customer_id', profile.id)
                .in('order_status', ['pending', 'processing']);
            
            document.getElementById('pendingOrders').textContent = pendingCount || 0;
            
            // Count wishlist
            const { count: wishlistCount } = await supabaseClient
                .from('customer_wishlist')
                .select('id', { count: 'exact', head: true })
                .eq('customer_id', profile.id);
            
            document.getElementById('wishlistCount').textContent = wishlistCount || 0;
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        // Get customer_id
        const { data: profile } = await supabaseClient
            .from('customer_profiles')
            .select('id')
            .eq('user_id', currentUser.id)
            .single();
        
        if (!profile) return;
        
        // Get recent orders
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('customer_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const orderList = document.getElementById('orderList');
        
        if (!orders || orders.length === 0) {
            // Keep empty state
            return;
        }
        
        // Clear empty state and show orders
        // SECURITY: Sanitize order data before display
        orderList.innerHTML = orders.map(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            const statusClass = `status-${order.order_status}`;
            const safeOrderNumber = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.order_number) : order.order_number;
            const safeStatus = typeof sanitizeHTML === 'function' ? sanitizeHTML(order.order_status) : order.order_status;
            const safeTotal = parseFloat(order.total).toFixed(2);
            
            return `
                <div class="order-card">
                    <div class="order-info">
                        <h3>Order #${safeOrderNumber}</h3>
                        <div class="order-details">
                            ${date} • GH₵ ${safeTotal}
                        </div>
                    </div>
                    <div class="order-status ${statusClass}">
                        ${safeStatus}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Logout
async function logout() {
    try {
        await supabaseClient.auth.signOut();
        window.location.href = 'customer-login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

console.log('✅ Dashboard script loaded');
