// ShopUp Customer Storefront JavaScript

let allProducts = [];
let filteredProducts = [];
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    loadStore();
    loadProducts();
    loadCart();
    setupEventListeners();
});

function loadStore() {
    // XSS Protection: Use safeJSONParse for localStorage data
    const sellerDataStr = localStorage.getItem('shopup_seller') || sessionStorage.getItem('shopup_seller');
    const sellerData = window.SecurityUtils ? SecurityUtils.safeJSONParse(sellerDataStr, {}) : JSON.parse(sellerDataStr || '{}');
    
    if (sellerData && sellerData.businessName) {
        const safeName = window.SecurityUtils ? SecurityUtils.escapeHtml(sellerData.businessName) : sellerData.businessName;
        
        // Use textContent (automatically escapes) instead of innerHTML
        const storeNameEl = document.getElementById('storeName');
        const storeTitleEl = document.getElementById('storeTitle');
        
        if (storeNameEl) storeNameEl.textContent = safeName;
        if (storeTitleEl) storeTitleEl.textContent = `${safeName} - ShopUp`;
    }
}

function loadProducts() {
    const allStoredProducts = JSON.parse(localStorage.getItem('shopup_products')) || [];
    allProducts = allStoredProducts.filter(p => p.status === 'active' && p.quantity > 0);
    filteredProducts = [...allProducts];
    displayProducts(filteredProducts);
}

function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    
    if (products.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:4rem"><div style="font-size:4rem">📦</div><h3>No products available</h3></div>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        const hasImage = product.images && product.images.length > 0;
        // XSS Protection: Escape user-generated content
        const safeName = window.SecurityUtils ? SecurityUtils.escapeHtml(product.name) : product.name;
        const safePrice = window.SecurityUtils ? SecurityUtils.sanitizePrice(product.price) : product.price;
        const safeImageUrl = hasImage && window.SecurityUtils ? SecurityUtils.escapeHtml(product.images[0]) : (hasImage ? product.images[0] : null);
        const imageHtml = safeImageUrl ? `<img src="${safeImageUrl}" alt="${safeName}">` : '📷';
        
        return `
            <div class="product-card">
                <div class="product-image">${imageHtml}</div>
                <div class="product-info">
                    <h3 class="product-name">${safeName}</h3>
                    <div class="product-price">GH₵ ${safePrice.toFixed(2)}</div>
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')">🛒 Add to Cart</button>
                </div>
            </div>
        `;
    }).join('');
}

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images && product.images[0],
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`✓ Added ${product.name}`);
};

function updateCartUI() {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cartCount').textContent = cartCount;
    document.getElementById('cartTotal').textContent = `GH₵ ${cartTotal.toFixed(2)}`;
    
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div style="text-align:center;padding:3rem;color:#999"><div style="font-size:4rem">🛒</div><p>Cart is empty</p></div>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => {
        // XSS Protection: Escape user-generated content
        const safeName = window.SecurityUtils ? SecurityUtils.escapeHtml(item.name) : item.name;
        const safePrice = window.SecurityUtils ? SecurityUtils.sanitizePrice(item.price) : item.price;
        const safeQuantity = window.SecurityUtils ? SecurityUtils.sanitizeQuantity(item.quantity) : item.quantity;
        const safeImageUrl = item.image && window.SecurityUtils ? SecurityUtils.escapeHtml(item.image) : item.image;
        
        return `
            <div class="cart-item">
                <div class="cart-item-image">${safeImageUrl ? `<img src="${safeImageUrl}">` : '📷'}</div>
                <div class="cart-item-details">
                    <div style="font-weight:600">${safeName}</div>
                    <div style="color:#2d8a3e">GH₵ ${safePrice.toFixed(2)} × ${safeQuantity}</div>
                    <button onclick="removeFromCart('${item.id}')" style="background:none;border:none;color:#e53935;cursor:pointer;margin-top:0.5rem">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast('✓ Removed');
};

function saveCart() {
    localStorage.setItem('shopup_customer_cart', JSON.stringify(cart));
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem('shopup_customer_cart')) || [];
    updateCartUI();
}

function setupEventListeners() {
    document.getElementById('cartBtn').addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('open');
        document.getElementById('overlay').classList.add('show');
    });
    
    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('overlay').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
}

function closeCart() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
}

function checkout() {
    if (cart.length === 0) {
        showToast('Cart is empty');
        return;
    }
    
    const sellerData = JSON.parse(localStorage.getItem('shopup_seller') || sessionStorage.getItem('shopup_seller'));
    const sellerPhone = sellerData?.phone || '0244123456';
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let message = `*New Order*\n\n`;
    cart.forEach(item => {
        message += `• ${item.name} - Qty: ${item.quantity} - GH₵${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*Total: GH₵${total.toFixed(2)}*`;
    
    const whatsappUrl = `https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    showToast('✓ Opening WhatsApp...');
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    filteredProducts.sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    displayProducts(filteredProducts);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

console.log('Store loaded:', allProducts.length, 'products');
