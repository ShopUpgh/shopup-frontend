// shared-nav-FIXED.js
// This handles navigation badge counts across ALL pages
// Uses localStorage to persist counts between page navigations

console.log('🚀 Shared navigation script loading...');

let supabaseClient = null;
let currentUser = null;

// Wait for Supabase and initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Shared nav initializing...');
    
    // Wait for Supabase client to be ready (check every 100ms, max 5 seconds)
    // The client must have an 'auth' property with 'getSession' method
    let attempts = 0;
    while (attempts < 50) {
        const client = window.supabaseClient || window.supabase;
        if (client && client.auth && typeof client.auth.getSession === 'function') {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    const client = window.supabaseClient || window.supabase;
    if (!client || !client.auth || typeof client.auth.getSession !== 'function') {
        console.error('❌ Supabase client not properly initialized after 5 seconds');
        return;
    }
    
    supabaseClient = client;
    console.log('✅ Supabase ready for shared nav');
    
    // Get current user
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            console.log('✅ Shared nav: User authenticated -', currentUser.id);
            
            // Load cached counts FIRST (instant, no waiting)
            loadCachedCounts();
            
            // Then fetch fresh counts from Supabase (takes ~500ms)
            await updateNavigationCounts();
        } else {
            console.log('⚠️ No session found in shared nav');
        }
    } catch (error) {
        console.error('❌ Error in shared nav initialization:', error);
    }
    
    // Listen for storage changes (if counts update in another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === 'shopup_nav_counts') {
            console.log('🔄 Counts updated in another tab, reloading...');
            loadCachedCounts();
        }
    });
});

// Load counts from localStorage (instant display)
function loadCachedCounts() {
    try {
        const cached = localStorage.getItem('shopup_nav_counts');
        if (cached) {
            const counts = JSON.parse(cached);
            console.log('📦 Loaded cached counts:', counts);
            
            // Update UI immediately
            const productBadge = document.getElementById('productCount');
            const orderBadge = document.getElementById('orderCount');
            
            if (productBadge) {
                productBadge.textContent = counts.products || 0;
                console.log('✅ Updated product badge from cache:', counts.products);
            }
            if (orderBadge) {
                orderBadge.textContent = counts.orders || 0;
                console.log('✅ Updated order badge from cache:', counts.orders);
            }
        } else {
            console.log('ℹ️ No cached counts found (first load)');
        }
    } catch (error) {
        console.error('❌ Error loading cached counts:', error);
    }
}

// Fetch fresh counts from Supabase and update cache
window.updateNavigationCounts = async function() {
    console.log('🔄 Updating navigation counts from Supabase...');
    
    if (!supabaseClient || !currentUser) {
        console.warn('⚠️ Supabase or user not ready for count update');
        return;
    }
    
    try {
        // Count products for this seller
        const { count: productCount, error: productError } = await supabaseClient
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', currentUser.id);
        
        if (productError) {
            console.error('❌ Error counting products:', productError);
        }
        
        // Count orders for this seller
        const { count: orderCount, error: orderError } = await supabaseClient
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', currentUser.id);
        
        if (orderError) {
            console.error('❌ Error counting orders:', orderError);
        }
        
        const finalProductCount = productCount || 0;
        const finalOrderCount = orderCount || 0;
        
        console.log('✅ Fresh counts from Supabase:', {
            products: finalProductCount,
            orders: finalOrderCount
        });
        
        // Update UI
        const productBadge = document.getElementById('productCount');
        const orderBadge = document.getElementById('orderCount');
        
        if (productBadge) {
            productBadge.textContent = finalProductCount;
            console.log('✅ Updated product count badge:', finalProductCount);
        }
        if (orderBadge) {
            orderBadge.textContent = finalOrderCount;
            console.log('✅ Updated order count badge:', finalOrderCount);
        }
        
        // Cache the counts in localStorage
        const counts = {
            products: finalProductCount,
            orders: finalOrderCount,
            timestamp: Date.now()
        };
        localStorage.setItem('shopup_nav_counts', JSON.stringify(counts));
        console.log('💾 Cached counts to localStorage:', counts);
        
    } catch (error) {
        console.error('❌ Error updating navigation counts:', error);
    }
};

console.log('✅ Shared navigation script loaded');