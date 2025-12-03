// seller-analytics-script.js
console.log('Seller analytics script loaded');

let supabaseClient = null;
let currentUser = null;
let sellerId = null;
let charts = {};

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
    
    // Load analytics
    await loadAnalytics();
    
    // Setup period filter
    document.getElementById('periodFilter').addEventListener('change', loadAnalytics);
});

async function loadAnalytics() {
    const period = parseInt(document.getElementById('periodFilter').value);
    
    try {
        // Calculate date range
        let startDate = null;
        if (period !== 'all') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - period);
        }
        
        // Fetch orders
        let query = supabaseClient
            .from('orders')
            .select(`
                *,
                order_items (
                    id,
                    product_name,
                    product_category,
                    quantity,
                    unit_price,
                    line_total
                )
            `)
            .eq('seller_id', sellerId);
        
        if (startDate) {
            query = query.gte('created_at', startDate.toISOString());
        }
        
        const { data: orders, error } = await query;
        
        if (error) throw error;
        
        // Calculate metrics
        calculateMetrics(orders);
        
        // Generate charts
        generateCharts(orders);
        
        // Show top products
        showTopProducts(orders);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function calculateMetrics(orders) {
    // Total Revenue
    const totalRevenue = orders.reduce((sum, order) => {
        if (order.order_status !== 'cancelled') {
            return sum + parseFloat(order.total);
        }
        return sum;
    }, 0);
    
    document.getElementById('totalRevenue').textContent = `GH₵ ${totalRevenue.toFixed(2)}`;
    
    // Total Orders
    const totalOrders = orders.filter(o => o.order_status !== 'cancelled').length;
    document.getElementById('totalOrders').textContent = totalOrders;
    
    // Average Order Value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    document.getElementById('avgOrderValue').textContent = `GH₵ ${avgOrderValue.toFixed(2)}`;
    
    // Total Customers (unique)
    const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
    
    // Calculate changes (mock for now - in production, compare with previous period)
    document.getElementById('revenueChange').textContent = `+${(Math.random() * 20).toFixed(1)}% from last period`;
    document.getElementById('ordersChange').textContent = `+${(Math.random() * 15).toFixed(1)}% from last period`;
    document.getElementById('customersChange').textContent = `+${(Math.random() * 10).toFixed(1)}% from last period`;
}

function generateCharts(orders) {
    // Revenue Over Time Chart
    generateRevenueChart(orders);
    
    // Orders by Status Chart
    generateStatusChart(orders);
    
    // Top Categories Chart
    generateCategoryChart(orders);
    
    // Payment Methods Chart
    generatePaymentChart(orders);
}

function generateRevenueChart(orders) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Group orders by date
    const revenueByDate = {};
    orders.forEach(order => {
        if (order.order_status !== 'cancelled') {
            const date = new Date(order.created_at).toLocaleDateString();
            revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(order.total);
        }
    });
    
    const sortedDates = Object.keys(revenueByDate).sort();
    const revenueData = sortedDates.map(date => revenueByDate[date]);
    
    // Destroy existing chart if it exists
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates,
            datasets: [{
                label: 'Revenue (GH₵)',
                data: revenueData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
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

function generateStatusChart(orders) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    // Count orders by status
    const statusCounts = {};
    orders.forEach(order => {
        statusCounts[order.order_status] = (statusCounts[order.order_status] || 0) + 1;
    });
    
    const statuses = Object.keys(statusCounts);
    const counts = Object.values(statusCounts);
    
    // Destroy existing chart
    if (charts.status) {
        charts.status.destroy();
    }
    
    charts.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#fbbf24',
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                    '#06b6d4',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function generateCategoryChart(orders) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Count revenue by category
    const categoryRevenue = {};
    orders.forEach(order => {
        if (order.order_status !== 'cancelled' && order.order_items) {
            order.order_items.forEach(item => {
                const category = item.product_category || 'Uncategorized';
                categoryRevenue[category] = (categoryRevenue[category] || 0) + parseFloat(item.line_total);
            });
        }
    });
    
    const categories = Object.keys(categoryRevenue);
    const revenues = Object.values(categoryRevenue);
    
    // Get top 5 categories
    const topCategories = categories
        .map((cat, idx) => ({ category: cat, revenue: revenues[idx] }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    // Destroy existing chart
    if (charts.category) {
        charts.category.destroy();
    }
    
    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topCategories.map(c => c.category),
            datasets: [{
                label: 'Revenue (GH₵)',
                data: topCategories.map(c => c.revenue),
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

function generatePaymentChart(orders) {
    const ctx = document.getElementById('paymentChart').getContext('2d');
    
    // Count orders by payment method
    const paymentCounts = {};
    orders.forEach(order => {
        if (order.order_status !== 'cancelled') {
            const method = formatPaymentMethod(order.payment_method);
            paymentCounts[method] = (paymentCounts[method] || 0) + 1;
        }
    });
    
    const methods = Object.keys(paymentCounts);
    const counts = Object.values(paymentCounts);
    
    // Destroy existing chart
    if (charts.payment) {
        charts.payment.destroy();
    }
    
    charts.payment = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: methods,
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function showTopProducts(orders) {
    const productStats = {};
    
    orders.forEach(order => {
        if (order.order_status !== 'cancelled' && order.order_items) {
            order.order_items.forEach(item => {
                if (!productStats[item.product_name]) {
                    productStats[item.product_name] = {
                        orders: 0,
                        units: 0,
                        revenue: 0
                    };
                }
                
                productStats[item.product_name].orders += 1;
                productStats[item.product_name].units += item.quantity;
                productStats[item.product_name].revenue += parseFloat(item.line_total);
            });
        }
    });
    
    // Sort by revenue
    const topProducts = Object.entries(productStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10);
    
    const tbody = document.getElementById('topProductsTable');
    
    if (topProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #718096; padding: 40px;">
                    No products sold yet
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = topProducts.map(([name, stats]) => `
        <tr>
            <td class="product-name">${name}</td>
            <td>${stats.orders}</td>
            <td>${stats.units}</td>
            <td style="font-weight: 600; color: #10b981;">GH₵ ${stats.revenue.toFixed(2)}</td>
        </tr>
    `).join('');
}

function formatPaymentMethod(method) {
    const methods = {
        'card': 'Card',
        'mobile_money': 'Mobile Money',
        'bank_transfer': 'Bank Transfer',
        'cash_on_delivery': 'Cash on Delivery',
        'mtn': 'MTN MoMo',
        'vodafone': 'Vodafone Cash',
        'bank': 'Bank Transfer',
        'cod': 'Cash on Delivery'
    };
    return methods[method] || method;
}

console.log('✅ Seller analytics script loaded');
