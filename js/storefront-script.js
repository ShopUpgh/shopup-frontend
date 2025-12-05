/**
 * SHOPUP Storefront - Enhanced Script
 * Advanced filtering, search, recommendations, cart management
 */

console.log('🛍️ SHOPUP Storefront Enhanced - Loading...');

let supabaseClient = null;
let allProducts = [];
let allSellers = [];
let filteredProducts = [];
let cart = [];
let searchTimeout;
let currentFilters = {
    category: '',
    price: '',
    sort: 'newest',
    search: ''
};

const categoryEmojis = {
    fashion: '👗',
    electronics: '💻',
    food: '🍕',
    beauty: '💄',
    home: '🏠',
    sports: '⚽',
    books: '📚',
    toys: '🧸',
    automotive: '🚗'
};

const categoryNames = {
    fashion: 'Fashion & Clothing',
    electronics: 'Electronics',
    food: 'Food & Beverages',
    beauty: 'Beauty & Cosmetics',
    home: 'Home & Living',
    sports: 'Sports & Fitness',
    books: 'Books & Stationery',
    toys: 'Toys & Kids',
    automotive: 'Automotive'
};

/**
 * INITIALIZATION
 * Wait for Supabase to load, then initialize
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📍 Initializing SHOPUP Storefront...');
    
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('❌ Supabase not available');
        return;
    }
    
    supabaseClient = window.supabase;
    console.log('✅ Supabase connected');
    
    // Load cart from localStorage
    loadCart();
    updateCartBadge();
    
    // Load products and sellers
    await loadProducts();
    await loadSellers();
    
    // Display categories
    displayCategories();
    
    // Initialize displays
    applyFilters();
    
    console.log('✨ Storefront ready!');
});

/**
 * LOAD PRODUCTS FROM DATABASE
 * Query: All active products from all sellers
 */
async function loadProducts() {
    try {
        console.log('📦 Loading products...');
        
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('status', 'active')
            .gt('quantity', 0)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allProducts = products || [];
        filteredProducts = [...allProducts];
        
        console.log(`✅ Loaded ${allProducts.length} products`);
        updateProductCount();
        
        return allProducts;
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showError('Failed to load products');
        return [];
    }
}

/**
 * LOAD SELLERS FROM DATABASE
 * Query: All verified sellers with products
 */
async function loadSellers() {
    try {
        console.log('👥 Loading sellers...');
        
        const { data: sellers, error } = await supabaseClient
            .from('sellers')
            .select('*')
            .eq('verified', true)
            .order('rating', { ascending: false })
            .limit(6);
        
        if (error) throw error;
        
        allSellers = sellers || [];
        
        console.log(`✅ Loaded ${allSellers.length} sellers`);
        displaySellers(allSellers);
        updateSellerCount();
        
        return allSellers;
        
    } catch (error) {
        console.error('❌ Error loading sellers:', error);
    }
}

/**
 * DISPLAY SELLERS
 * Show featured sellers cards
 */
function displaySellers(sellers) {
    const container = document.getElementById('sellersList');
    if (!container) return;
    
    if (!sellers || sellers.length === 0) {
        container.innerHTML = '<p>No sellers available</p>';
        return;
    }
    
    // SECURITY: Use sanitizeHTML for user-generated content
    const sellersHtml = sellers.map(seller => {
        const safeName = typeof sanitizeHTML === 'function' ? sanitizeHTML(seller.business_name) : seller.business_name;
        const safeCity = typeof sanitizeHTML === 'function' ? sanitizeHTML(seller.city || 'Ghana') : (seller.city || 'Ghana');
        const safeAvatar = seller.avatar_emoji || '🏪';
        const safeRating = seller.rating || '4.8';
        
        return `
            <div class="seller-card" onclick="viewSeller('${seller.id}')">
                <div class="seller-avatar">${safeAvatar}</div>
                <h3>${safeName}</h3>
                ${seller.verified ? '<div class="seller-badge">✅ Verified</div>' : ''}
                <div class="seller-rating">⭐ ${safeRating}</div>
                <p style="font-size: 12px; color: #666;">📍 ${safeCity}</p>
            </div>
        `;
    }).join('');
    
    container.innerHTML = sellersHtml;
    console.log('🎨 Sellers displayed');
}

/**
 * DISPLAY CATEGORIES
 * Show category cards for quick filtering
 */
function displayCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    const categories = [
        { key: 'fashion', name: 'Fashion', emoji: '👗' },
        { key: 'electronics', name: 'Electronics', emoji: '💻' },
        { key: 'food', name: 'Food', emoji: '🍕' },
        { key: 'beauty', name: 'Beauty', emoji: '💄' },
        { key: 'home', name: 'Home', emoji: '🏠' },
        { key: 'sports', name: 'Sports', emoji: '⚽' },
        { key: 'books', name: 'Books', emoji: '📚' },
        { key: 'toys', name: 'Toys', emoji: '🧸' },
        { key: 'automotive', name: 'Automotive', emoji: '🚗' }
    ];
    
    const categoriesHtml = categories.map(cat => `
        <div class="category-card" onclick="filterByCategory('${cat.key}')">
            <div class="category-icon">${cat.emoji}</div>
            <div>${categoryNames[cat.key]}</div>
        </div>
    `).join('');
    
    container.innerHTML = categoriesHtml;
}

/**
 * FILTER BY CATEGORY
 * Quick filter click from category card
 */
function filterByCategory(category) {
    document.getElementById('categoryFilter').value = category;
    applyFilters();
    document.getElementById('filterSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * DEBOUNCED SEARCH
 * Wait for user to stop typing before searching
 */
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch();
    }, 300);
}

/**
 * PERFORM SEARCH
 * Filter products by search term
 */
function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    currentFilters.search = searchTerm;
    
    if (!searchTerm) {
        console.log('🔍 Search cleared');
        applyFilters();
        return;
    }
    
    console.log(`🔍 Searching for: ${searchTerm}`);
    
    // Search in product names and descriptions
    filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
    );
    
    updateResults();
}

/**
 * APPLY FILTERS
 * Combine category, price, and sort filters
 */
function applyFilters() {
    console.log('🔄 Applying filters...');
    
    // Get filter values
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;
    const sort = document.getElementById('sortFilter').value;
    
    currentFilters.category = category;
    currentFilters.price = priceRange;
    currentFilters.sort = sort;
    
    // Start with all products or search results
    let results = [...allProducts];
    
    // If search active, apply search first
    if (currentFilters.search) {
        results = results.filter(product => 
            product.name.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(currentFilters.search.toLowerCase()))
        );
    }
    
    // Apply category filter
    if (category) {
        results = results.filter(product => product.category === category);
    }
    
    // Apply price filter
    if (priceRange) {
        const [minPrice, maxPrice] = priceRange === '500+' 
            ? [500, Infinity] 
            : priceRange.split('-').map(Number);
        
        results = results.filter(product => 
            product.price >= minPrice && product.price <= maxPrice
        );
    }
    
    // Apply sorting
    results = sortProducts(results, sort);
    
    filteredProducts = results;
    updateResults();
    
    console.log(`📊 Filtered to ${filteredProducts.length} products`);
}

/**
 * SORT PRODUCTS
 * Apply different sorting strategies
 */
function sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch(sortBy) {
        case 'newest':
            return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        case 'price-low':
            return sorted.sort((a, b) => a.price - b.price);
        
        case 'price-high':
            return sorted.sort((a, b) => b.price - a.price);
        
        case 'popular':
            return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        
        case 'rating':
            return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        default:
            return sorted;
    }
}

/**
 * RESET FILTERS
 * Clear all filters and show all products
 */
function resetFilters() {
    console.log('🔄 Resetting filters...');
    
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('sortFilter').value = 'newest';
    
    currentFilters = {
        category: '',
        price: '',
        sort: 'newest',
        search: ''
    };
    
    filteredProducts = [...allProducts];
    updateResults();
}

/**
 * UPDATE RESULTS
 * Display filtered products and update info
 */
function updateResults() {
    displayProducts(filteredProducts);
    updateResultsInfo();
}

/**
 * UPDATE RESULTS INFO
 * Show how many products match current filters
 */
function updateResultsInfo() {
    const info = document.getElementById('resultsInfo');
    if (!info) return;
    
    if (filteredProducts.length === 0) {
        info.textContent = '❌ No products match your filters';
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('productsList').style.display = 'none';
    } else {
        info.textContent = `✅ Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`;
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('productsList').style.display = 'grid';
    }
}

/**
 * DISPLAY PRODUCTS
 * Render product cards
 */
function displayProducts(products) {
    const container = document.getElementById('productsList');
    if (!container) return;
    
    // SECURITY: Use sanitizeHTML for user-generated content
    const productsHtml = products.map(product => {
        const discountPercent = product.compare_price 
            ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
            : 0;
        
        // Sanitize user-generated content
        const safeName = typeof sanitizeHTML === 'function' ? sanitizeHTML(product.name) : product.name;
        const safePrice = parseFloat(product.price).toFixed(2);
        const safeComparePrice = product.compare_price ? parseFloat(product.compare_price).toFixed(2) : null;
        
        return `
            <div class="product-card">
                <div class="product-image">📦</div>
                <div class="product-info">
                    ${discountPercent > 0 ? `<div class="product-badge">-${discountPercent}%</div>` : ''}
                    <div class="product-name">${safeName}</div>
                    <div class="product-seller">👤 Seller</div>
                    <div class="product-rating">⭐⭐⭐⭐⭐ (${Math.floor(Math.random() * 200) + 50})</div>
                    <div class="product-price">
                        GH₵ ${safePrice}
                        ${safeComparePrice ? `<span class="product-compare-price">GH₵ ${safeComparePrice}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id}, '${safeName.replace(/'/g, "\\'")}', ${product.price})">
                            🛒 Add
                        </button>
                        <button class="btn-view-product" onclick="viewProduct(${product.id})">
                            👁️ View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = productsHtml;
}

/**
 * ADD TO CART
 * Add product with quantity management
 */
function addToCart(productId, productName, productPrice) {
    console.log(`🛒 Adding to cart: ${productName}`);
    
    // Check if already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        console.log(`📈 Increased quantity: ${productName}`);
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
        });
        console.log(`✨ Added new item: ${productName}`);
    }
    
    saveCart();
    updateCartBadge();
    showNotification(`✅ Added ${productName} to cart!`);
}

/**
 * CART FUNCTIONS
 */
function loadCart() {
    try {
        const saved = localStorage.getItem('shopup_cart');
        if (saved) {
            cart = JSON.parse(saved);
            console.log(`💾 Cart loaded with ${cart.length} items`);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem('shopup_cart', JSON.stringify(cart));
    console.log('💾 Cart saved');
}

function updateCartBadge() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = total;
    }
}

/**
 * UPDATE COUNTS
 */
function updateProductCount() {
    document.getElementById('productCount').textContent = allProducts.length;
    document.getElementById('heroProductCount').textContent = allProducts.length;
}

function updateSellerCount() {
    document.getElementById('sellerCount').textContent = allSellers.length;
    document.getElementById('heroSellerCount').textContent = allSellers.length;
}

/**
 * NAVIGATION
 */
function viewProduct(productId) {
    console.log(`🔍 Viewing product: ${productId}`);
    window.location.href = `product.html?id=${productId}`;
}

function viewSeller(sellerId) {
    console.log(`🏪 Viewing seller: ${sellerId}`);
    window.location.href = `seller.html?id=${sellerId}`;
}

/**
 * NEWSLETTER SUBSCRIPTION
 */
function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail').value;
    
    if (!email || !email.includes('@')) {
        showNotification('❌ Please enter a valid email');
        return;
    }
    
    console.log(`📧 Newsletter subscription: ${email}`);
    showNotification('✅ Thanks for subscribing!');
    document.getElementById('newsletterEmail').value = '';
}

/**
 * UI HELPERS
 */
function showNotification(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showError(message) {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #ef4444;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

console.log('✨ SHOPUP Storefront Enhanced Ready!');