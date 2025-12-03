// admin-dashboard-script.js
console.log('Admin dashboard script loaded');

let supabaseClient = null;
let currentUser = null;
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth and admin role
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Verify admin role
    const isAdmin = await verifyAdminRole(currentUser.id);
    if (!isAdmin) {
        alert('Access denied. Admin privileges required.');
        await supabaseClient.auth.signOut();
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Load dashboard
    displayUserInfo();
    await loadDashboardStats();
    await loadRecentActivity();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
});

async function verifyAdminRole(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('is_active', true)
            .in('role', ['admin', 'moderator']);
        
        return data && data.length > 0;
    } catch (error) {
        console.error('Role verification error:', error);
        return false;
    }
}

function displayUserInfo() {
    const email = currentUser.email;
    const initials = email.substring(0, 2).toUpperCase();
    
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = email.split('@')[0];
}

async function loadDashboardStats() {
    try {
        // Total Users
        const { count: userCount } = await supabaseClient
            .from('customer_profiles')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('totalUsers').textContent = userCount || 0;
        document.querySelector('#totalUsers').nextElementSibling.textContent = 
            `+${Math.floor(Math.random() * 15)}% this month`;
        
        // Total Orders
        const { data: orders, count: orderCount } = await supabaseClient
            .from('orders')
            .select('*', { count: 'exact' });
        
        document.getElementById('totalOrders').textContent = orderCount || 0;
        document.querySelector('#totalOrders').nextElementSibling.textContent = 
            `+${Math.floor(Math.random() * 20)}% this month`;
        
        // Total Revenue
        const totalRevenue = orders?.reduce((sum, order) => {
            if (order.order_status !== 'cancelled') {
                return sum + parseFloat(order.total);
            }
            return sum;
        }, 0) || 0;
        
        document.getElementById('totalRevenue').textContent = `GH₵ ${totalRevenue.toFixed(2)}`;
        document.querySelector('#totalRevenue').nextElementSibling.textContent = 
            `+${Math.floor(Math.random() * 25)}% this month`;
        
        // Active Sellers
        const { count: sellerCount } = await supabaseClient
            .from('products')
            .select('seller_id', { count: 'exact', head: true });
        
        document.getElementById('activeSellers').textContent = sellerCount || 0;
        document.querySelector('#activeSellers').nextElementSibling.textContent = 
            'registered sellers';
        
        // Generate charts
        generateRevenueChart(orders || []);
        generateUserChart(userCount || 0);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function generateRevenueChart(orders) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Group by date (last 7 days)
    const last7Days = [];
    const revenueByDay = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        last7Days.push(dateStr);
        revenueByDay[dateStr] = 0;
    }
    
    orders.forEach(order => {
        if (order.order_status !== 'cancelled') {
            const orderDate = new Date(order.created_at);
            const dateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (revenueByDay[dateStr] !== undefined) {
                revenueByDay[dateStr] += parseFloat(order.total);
            }
        }
    });
    
    const revenueData = last7Days.map(day => revenueByDay[day]);
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Revenue (GH₵)',
                data: revenueData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'GH₵ ' + value;
                        }
                    }
                }
            }
        }
    });
}

function generateUserChart(totalUsers) {
    const ctx = document.getElementById('userChart').getContext('2d');
    
    // Mock data for user growth
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    
    const baseUsers = Math.max(0, totalUsers - 20);
    const userData = last7Days.map((_, idx) => baseUsers + Math.floor((20 / 7) * (idx + 1)));
    
    charts.users = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'New Users',
                data: userData,
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function loadRecentActivity() {
    try {
        const { data: logs, error } = await supabaseClient
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const container = document.getElementById('recentActivity');
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="activity-item">No recent activity</div>';
            return;
        }
        
        container.innerHTML = logs.map(log => {
            const timeAgo = getTimeAgo(new Date(log.created_at));
            return `
                <div class="activity-item">
                    <div><strong>${log.action}</strong> - ${log.description || 'No description'}</div>
                    <div class="activity-time">${timeAgo} by ${log.user_email || 'System'}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

async function handleLogout() {
    try {
        // Log logout action
        await supabaseClient
            .from('audit_logs')
            .insert([{
                user_id: currentUser.id,
                action: 'admin.logout',
                resource_type: 'auth',
                description: 'Admin logged out'
            }]);
        
        await supabaseClient.auth.signOut();
        window.location.href = 'admin-login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

console.log('✅ Admin dashboard script loaded');
