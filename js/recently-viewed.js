// Recently Viewed Products for ShopUp Ghana
// Zero-cost feature using localStorage for personalization

const RecentlyViewed = {
    // Configuration
    config: {
        storageKey: 'shopup_recently_viewed',
        maxItems: 10,
        displayLimit: 4
    },
    
    // Cache
    items: [],
    
    /**
     * Initialize recently viewed tracking
     */
    init: function() {
        // Load from localStorage
        this.loadFromStorage();
        
        // Track current product view
        this.trackCurrentProduct();
        
        // Display recently viewed section if on appropriate page
        this.displaySection();
        
        console.log('✅ Recently Viewed initialized');
    },
    
    /**
     * Load recently viewed from localStorage
     */
    loadFromStorage: function() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            this.items = saved ? JSON.parse(saved) : [];
            
            // Clean up old items (older than 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            this.items = this.items.filter(item => item.viewedAt > thirtyDaysAgo);
            
        } catch (error) {
            console.error('Error loading recently viewed:', error);
            this.items = [];
        }
    },
    
    /**
     * Save to localStorage
     */
    saveToStorage: function() {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving recently viewed:', error);
        }
    },
    
    /**
     * Track current product page view
     */
    trackCurrentProduct: function() {
        // Check if we're on a product page
        const productId = this.getCurrentProductId();
        
        if (!productId) return;
        
        // Get product data from page
        const productData = this.extractProductData();
        
        if (productData) {
            this.addProduct(productId, productData);
        }
    },
    
    /**
     * Get current product ID from page
     */
    getCurrentProductId: function() {
        // Try various methods to get product ID
        const urlParams = new URLSearchParams(window.location.search);
        let productId = urlParams.get('id') || urlParams.get('product_id');
        
        if (!productId) {
            // Try data attribute on body or container
            const container = document.querySelector('[data-product-id]');
            if (container) {
                productId = container.getAttribute('data-product-id');
            }
        }
        
        if (!productId) {
            // Try to extract from URL path
            const match = window.location.pathname.match(/\/product\/([^\/]+)/);
            if (match) {
                productId = match[1];
            }
        }
        
        return productId;
    },
    
    /**
     * Extract product data from current page
     */
    extractProductData: function() {
        try {
            const data = {
                name: '',
                price: '',
                image: '',
                url: window.location.href
            };
            
            // Extract name
            const nameEl = document.querySelector('h1, .product-name, .product-title');
            if (nameEl) data.name = nameEl.textContent.trim();
            
            // Extract price
            const priceEl = document.querySelector('.product-price, .price');
            if (priceEl) data.price = priceEl.textContent.trim();
            
            // Extract image
            const imgEl = document.querySelector('.product-image img, .main-image, img[itemprop="image"]');
            if (imgEl) data.image = imgEl.src || imgEl.dataset.src;
            
            // Only return if we have at least a name
            return data.name ? data : null;
            
        } catch (error) {
            console.error('Error extracting product data:', error);
            return null;
        }
    },
    
    /**
     * Add product to recently viewed
     */
    addProduct: function(productId, productData) {
        // Remove if already exists (we'll add it to the front)
        this.items = this.items.filter(item => item.id !== productId);
        
        // Add to front of array
        this.items.unshift({
            id: productId,
            ...productData,
            viewedAt: Date.now()
        });
        
        // Keep only max items
        if (this.items.length > this.config.maxItems) {
            this.items = this.items.slice(0, this.config.maxItems);
        }
        
        // Save to storage
        this.saveToStorage();
    },
    
    /**
     * Get recently viewed items (excluding current product)
     */
    getItems: function(limit = null) {
        const currentProductId = this.getCurrentProductId();
        const filtered = this.items.filter(item => item.id !== currentProductId);
        
        const displayLimit = limit || this.config.displayLimit;
        return filtered.slice(0, displayLimit);
    },
    
    /**
     * Display recently viewed section
     */
    displaySection: function() {
        const items = this.getItems();
        
        // Only display if we have items
        if (items.length === 0) return;
        
        // Find container or create one
        let container = document.getElementById('recently-viewed-section');
        
        if (!container) {
            // Create container
            container = document.createElement('div');
            container.id = 'recently-viewed-section';
            container.className = 'recently-viewed-section';
            
            // Try to insert after main content
            const mainContent = document.querySelector('main, .main-content, .container');
            if (mainContent) {
                mainContent.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
        }
        
        // Build HTML
        let html = `
            <div class="section-header">
                <h2>Recently Viewed</h2>
                <button class="clear-history-btn" onclick="RecentlyViewed.clearHistory()">Clear History</button>
            </div>
            <div class="recently-viewed-grid">
        `;
        
        items.forEach(item => {
            html += `
                <a href="${item.url}" class="recently-viewed-item">
                    <div class="item-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy">` : '<div class="no-image">No Image</div>'}
                    </div>
                    <div class="item-details">
                        <h3 class="item-name">${item.name}</h3>
                        ${item.price ? `<p class="item-price">${item.price}</p>` : ''}
                    </div>
                </a>
            `;
        });
        
        html += `
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Clear history
     */
    clearHistory: function() {
        if (confirm('Clear your recently viewed history?')) {
            this.items = [];
            this.saveToStorage();
            
            // Remove section from page
            const section = document.getElementById('recently-viewed-section');
            if (section) {
                section.remove();
            }
            
            if (window.ErrorHandler) {
                window.ErrorHandler.showSuccess('Recently viewed history cleared');
            }
        }
    },
    
    /**
     * Add styles
     */
    addStyles: function() {
        if (document.getElementById('recently-viewed-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'recently-viewed-styles';
        style.textContent = `
            .recently-viewed-section {
                margin: 40px auto;
                padding: 20px;
                max-width: 1200px;
            }
            
            .recently-viewed-section .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
            }
            
            .recently-viewed-section h2 {
                font-size: 24px;
                color: #333;
                margin: 0;
            }
            
            .clear-history-btn {
                background: none;
                border: 1px solid #ccc;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                color: #666;
                transition: all 0.2s;
            }
            
            .clear-history-btn:hover {
                background: #f5f5f5;
                border-color: #999;
            }
            
            .recently-viewed-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 20px;
            }
            
            @media (max-width: 768px) {
                .recently-viewed-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
            }
            
            @media (max-width: 480px) {
                .recently-viewed-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .recently-viewed-item {
                display: block;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.3s;
                text-decoration: none;
                color: inherit;
            }
            
            .recently-viewed-item:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }
            
            .recently-viewed-item .item-image {
                width: 100%;
                height: 200px;
                background: #f5f5f5;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            
            .recently-viewed-item .item-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .recently-viewed-item .no-image {
                color: #999;
                font-size: 14px;
            }
            
            .recently-viewed-item .item-details {
                padding: 15px;
            }
            
            .recently-viewed-item .item-name {
                font-size: 16px;
                font-weight: 500;
                color: #333;
                margin: 0 0 8px 0;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .recently-viewed-item .item-price {
                font-size: 18px;
                font-weight: bold;
                color: #2d8a3e;
                margin: 0;
            }
            
            /* Dark mode support */
            .dark-mode .recently-viewed-section {
                background: var(--bg-primary);
            }
            
            .dark-mode .recently-viewed-section h2 {
                color: var(--text-primary);
            }
            
            .dark-mode .recently-viewed-section .section-header {
                border-bottom-color: var(--border-color);
            }
            
            .dark-mode .recently-viewed-item {
                background: var(--bg-secondary);
                border-color: var(--border-color);
            }
            
            .dark-mode .recently-viewed-item .item-name {
                color: var(--text-primary);
            }
            
            .dark-mode .clear-history-btn {
                background: var(--bg-secondary);
                border-color: var(--border-color);
                color: var(--text-primary);
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RecentlyViewed.init());
} else {
    RecentlyViewed.init();
}

// Make available globally
window.RecentlyViewed = RecentlyViewed;

console.log('✅ Recently Viewed module loaded');
