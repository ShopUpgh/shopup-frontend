// shared-nav-FIXED.js
// This handles navigation badge counts across ALL pages
// Uses localStorage to persist counts between page navigations

console.log('🚀 Shared navigation script loading...');

let supabaseClient = null;
let currentUser = null;

// Wait for Supabase and initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Shared nav initializing...');
    
    // Wait for Supabase (check every 100ms, max 5 seconds)
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('❌ Supabase not available after 5 seconds');
        addRevenueNavLink();
        return;
    }
    
    supabaseClient = window.supabase;
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

    // Add Revenue link to seller navigation
    addRevenueNavLink();
    
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

function addRevenueNavLink() {
    const targets = [
        document.querySelector('.sidebar-menu'),
        document.querySelector('.sidebar-nav'),
        document.querySelector('.nav-links'),
        document.getElementById('sellerNav'),
    ].filter(Boolean);

    targets.forEach((nav) => {
        if (nav.querySelector('[data-revenue-link]')) return;
        const link = document.createElement('a');
        link.href = '/revenue/dashboard.html';
        link.textContent = '💰 Revenue';
        link.setAttribute('data-revenue-link', 'true');
        if (!link.className) {
            link.className = 'menu-item';
        }
        nav.appendChild(link);
    });
}

console.log('✅ Shared navigation script loaded');
