// ShopUp Shared Navigation Integration
// This script manages navigation badge counts across all pages using localStorage caching
// Load this FIRST, before products-script.js or orders-script.js

console.log('🔄 Shared navigation integration loaded');

let sharedNavSupabase = null;
let sharedNavUser = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📍 Shared nav initializing...');

    // Wait for Supabase (max 5 seconds)
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.supabase) {
        console.warn('⚠️ Supabase not available');
        return;
    }

    sharedNavSupabase = window.supabase;
    console.log('✅ Supabase ready');

    // Get current user
    try {
        const { data: { session } } = await sharedNavSupabase.auth.getSession();
        if (session) {
            sharedNavUser = session.user;
            console.log('👤 User:', sharedNavUser.id.substring(0, 8) + '...');

            // Load cached counts immediately
            loadCachedCounts();

            // Then fetch fresh counts from Supabase
            await updateNavigationCounts();
        }
    } catch (error) {
        console.error('❌ Session error:', error);
    }

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'shopup_nav_counts') {
            console.log('🔔 Counts updated in another tab');
            loadCachedCounts();
        }
    });
});

// Load counts from localStorage (instant, no API call)
function loadCachedCounts() {
    try {
        const cached = localStorage.getItem('shopup_nav_counts');
        if (cached) {
            const counts = JSON.parse(cached);
            console.log('💾 Cached counts:', counts);

            const productBadge = document.getElementById('productCount');
            const orderBadge = document.getElementById('orderCount');

            if (productBadge) {
                productBadge.textContent = counts.products || 0;
                console.log('📦 Product badge: ' + counts.products);
            }
            if (orderBadge) {
                orderBadge.textContent = counts.orders || 0;
                console.log('📋 Order badge: ' + counts.orders);
            }
        }
    } catch (error) {
        console.error('❌ Cache load error:', error);
    }
}

// Update counts from Supabase (called from products-script.js and orders-script.js)
window.updateNavigationCounts = async function() {
    console.log('🔄 Updating counts from Supabase...');

    // Wait for Supabase and user if not ready
    if (!sharedNavSupabase || !sharedNavUser) {
        console.log('⏳ Waiting for Supabase/user...');
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!window.supabase) {
            console.warn('⚠️ Supabase timeout');
            return;
        }

        sharedNavSupabase = window.supabase;

        // Get user again
        try {
            const { data: { session } } = await sharedNavSupabase.auth.getSession();
            if (session) {
                sharedNavUser = session.user;
            } else {
                console.warn('⚠️ No session');
                return;
            }
        } catch (error) {
            console.error('❌ Session error:', error);
            return;
        }
    }

    try {
        // Count products
        const { count: productCount, error: productError } = await sharedNavSupabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', sharedNavUser.id);

        // Count orders
        const { count: orderCount, error: orderError } = await sharedNavSupabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', sharedNavUser.id);

        if (productError) console.error('❌ Product count error:', productError);
        if (orderError) console.error('❌ Order count error:', orderError);

        const products = productCount || 0;
        const orders = orderCount || 0;

        console.log('📊 Fresh counts:', { products, orders });

        // Save to localStorage
        localStorage.setItem('shopup_nav_counts', JSON.stringify({
            products,
            orders,
            timestamp: new Date().getTime()
        }));
        console.log('💾 Counts saved to cache');

        // Update badges
        const productBadge = document.getElementById('productCount');
        const orderBadge = document.getElementById('orderCount');

        if (productBadge) {
            productBadge.textContent = products;
            console.log('✅ Product badge updated: ' + products);
        }
        if (orderBadge) {
            orderBadge.textContent = orders;
            console.log('✅ Order badge updated: ' + orders);
        }

    } catch (error) {
        console.error('❌ Count update error:', error);
    }
};

console.log('✨ Shared nav ready - updateNavigationCounts() available globally');
