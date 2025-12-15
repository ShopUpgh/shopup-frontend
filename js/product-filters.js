// Advanced Product Filters for ShopUp Ghana
// Zero-cost feature using client-side filtering

const ProductFilters = {
    // State
    filters: {
        priceMin: null,
        priceMax: null,
        categories: [],
        sortBy: 'newest',
        condition: null,
        inStock: null
    },
    
    products: [],
    filteredProducts: [],
    
    /**
     * Initialize product filters
     */
    init: function() {
        // Load products from page
        this.loadProducts();
        
        // Create filter UI if on product listing page
        if (this.isProductListingPage()) {
            this.createFilterUI();
        }
        
        // Apply filters from URL
        this.applyFiltersFromURL();
        
        console.log('✅ Product Filters initialized');
    },
    
    /**
     * Check if we're on a product listing page
     */
    isProductListingPage: function() {
        return document.querySelector('.product-grid, .products-grid, .product-list') !== null;
    },
    
    /**
     * Load products from page
     */
    loadProducts: function() {
        const productElements = document.querySelectorAll('.product-card, .product-item');
        
        this.products = Array.from(productElements).map(el => {
            return {
                element: el,
                name: el.querySelector('.product-name, h3, h2')?.textContent.trim() || '',
                price: this.extractPrice(el),
                category: el.dataset.category || '',
                condition: el.dataset.condition || 'new',
                inStock: el.dataset.inStock !== 'false',
                dateAdded: el.dataset.dateAdded || new Date().toISOString()
            };
        });
        
        this.filteredProducts = [...this.products];
    },
    
    /**
     * Extract price from product element
     */
    extractPrice: function(element) {
        const priceEl = element.querySelector('.product-price, .price');
        if (!priceEl) return 0;
        
        const priceText = priceEl.textContent.trim();
        // Extract numbers from text like "GH₵ 50.00"
        const match = priceText.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return 0;
    },
    
    /**
     * Create filter UI
     */
    createFilterUI: function() {
        // Check if filter UI already exists
        if (document.getElementById('product-filters')) return;
        
        // Find product grid
        const productGrid = document.querySelector('.product-grid, .products-grid, .product-list');
        if (!productGrid) return;
        
        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.id = 'product-filters';
        filterContainer.className = 'product-filters';
        
        // Get unique categories
        const categories = [...new Set(this.products.map(p => p.category).filter(c => c))];
        
        // Build filter HTML
        filterContainer.innerHTML = `
            <div class="filters-header">
                <h3>Filters</h3>
                <button class="clear-filters-btn" onclick="ProductFilters.clearFilters()">Clear All</button>
            </div>
            
            <div class="filter-section">
                <h4>Sort By</h4>
                <select id="sortBy" onchange="ProductFilters.setSortBy(this.value)">
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A-Z</option>
                </select>
            </div>
            
            <div class="filter-section">
                <h4>Price Range</h4>
                <div class="price-inputs">
                    <input type="number" id="priceMin" placeholder="Min" min="0" onchange="ProductFilters.setPriceRange()">
                    <span>-</span>
                    <input type="number" id="priceMax" placeholder="Max" min="0" onchange="ProductFilters.setPriceRange()">
                </div>
                <div class="price-slider">
                    <input type="range" id="priceSlider" min="0" max="1000" value="1000" oninput="ProductFilters.updatePriceMax(this.value)">
                    <span class="price-value">Max: GH₵ <span id="priceValue">1000</span></span>
                </div>
            </div>
            
            ${categories.length > 0 ? `
            <div class="filter-section">
                <h4>Categories</h4>
                <div class="category-checkboxes">
                    ${categories.map(cat => `
                        <label>
                            <input type="checkbox" value="${cat}" onchange="ProductFilters.toggleCategory('${cat}')">
                            <span>${cat}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="filter-section">
                <h4>Condition</h4>
                <div class="condition-radios">
                    <label>
                        <input type="radio" name="condition" value="all" checked onchange="ProductFilters.setCondition('all')">
                        <span>All</span>
                    </label>
                    <label>
                        <input type="radio" name="condition" value="new" onchange="ProductFilters.setCondition('new')">
                        <span>New</span>
                    </label>
                    <label>
                        <input type="radio" name="condition" value="used" onchange="ProductFilters.setCondition('used')">
                        <span>Used</span>
                    </label>
                </div>
            </div>
            
            <div class="filter-section">
                <h4>Availability</h4>
                <label class="checkbox-label">
                    <input type="checkbox" id="inStockOnly" onchange="ProductFilters.setInStockOnly(this.checked)">
                    <span>In Stock Only</span>
                </label>
            </div>
            
            <div class="filter-results">
                <p>Showing <strong><span id="resultsCount">${this.products.length}</span></strong> products</p>
            </div>
        `;
        
        // Insert before product grid
        productGrid.parentNode.insertBefore(filterContainer, productGrid);
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Set sort by
     */
    setSortBy: function(sortBy) {
        this.filters.sortBy = sortBy;
        this.applyFilters();
        this.updateURL();
    },
    
    /**
     * Set price range
     */
    setPriceRange: function() {
        const minInput = document.getElementById('priceMin');
        const maxInput = document.getElementById('priceMax');
        
        this.filters.priceMin = minInput.value ? parseFloat(minInput.value) : null;
        this.filters.priceMax = maxInput.value ? parseFloat(maxInput.value) : null;
        
        this.applyFilters();
        this.updateURL();
    },
    
    /**
     * Update price max from slider
     */
    updatePriceMax: function(value) {
        document.getElementById('priceValue').textContent = value;
        document.getElementById('priceMax').value = value;
        this.setPriceRange();
    },
    
    /**
     * Toggle category
     */
    toggleCategory: function(category) {
        const index = this.filters.categories.indexOf(category);
        if (index > -1) {
            this.filters.categories.splice(index, 1);
        } else {
            this.filters.categories.push(category);
        }
        this.applyFilters();
        this.updateURL();
    },
    
    /**
     * Set condition filter
     */
    setCondition: function(condition) {
        this.filters.condition = condition === 'all' ? null : condition;
        this.applyFilters();
        this.updateURL();
    },
    
    /**
     * Set in stock only filter
     */
    setInStockOnly: function(checked) {
        this.filters.inStock = checked ? true : null;
        this.applyFilters();
        this.updateURL();
    },
    
    /**
     * Apply all filters
     */
    applyFilters: function() {
        // Start with all products
        let filtered = [...this.products];
        
        // Apply price filter
        if (this.filters.priceMin !== null) {
            filtered = filtered.filter(p => p.price >= this.filters.priceMin);
        }
        if (this.filters.priceMax !== null) {
            filtered = filtered.filter(p => p.price <= this.filters.priceMax);
        }
        
        // Apply category filter
        if (this.filters.categories.length > 0) {
            filtered = filtered.filter(p => this.filters.categories.includes(p.category));
        }
        
        // Apply condition filter
        if (this.filters.condition) {
            filtered = filtered.filter(p => p.condition === this.filters.condition);
        }
        
        // Apply in stock filter
        if (this.filters.inStock) {
            filtered = filtered.filter(p => p.inStock);
        }
        
        // Apply sort
        filtered = this.sortProducts(filtered, this.filters.sortBy);
        
        // Store filtered results
        this.filteredProducts = filtered;
        
        // Update display
        this.updateDisplay();
    },
    
    /**
     * Sort products
     */
    sortProducts: function(products, sortBy) {
        const sorted = [...products];
        
        switch(sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'newest':
            default:
                return sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        }
    },
    
    /**
     * Update display
     */
    updateDisplay: function() {
        // Hide all products
        this.products.forEach(p => {
            p.element.style.display = 'none';
        });
        
        // Show filtered products
        this.filteredProducts.forEach(p => {
            p.element.style.display = '';
        });
        
        // Update count
        const countEl = document.getElementById('resultsCount');
        if (countEl) {
            countEl.textContent = this.filteredProducts.length;
        }
        
        // Show "no results" message if needed
        this.showNoResultsMessage(this.filteredProducts.length === 0);
    },
    
    /**
     * Show no results message
     */
    showNoResultsMessage: function(show) {
        let message = document.getElementById('no-results-message');
        
        if (show && !message) {
            const productGrid = document.querySelector('.product-grid, .products-grid, .product-list');
            if (productGrid) {
                message = document.createElement('div');
                message.id = 'no-results-message';
                message.className = 'no-results-message';
                message.innerHTML = `
                    <p>No products match your filters</p>
                    <button onclick="ProductFilters.clearFilters()">Clear Filters</button>
                `;
                productGrid.appendChild(message);
            }
        } else if (!show && message) {
            message.remove();
        }
    },
    
    /**
     * Clear all filters
     */
    clearFilters: function() {
        // Reset filters
        this.filters = {
            priceMin: null,
            priceMax: null,
            categories: [],
            sortBy: 'newest',
            condition: null,
            inStock: null
        };
        
        // Reset UI
        const minInput = document.getElementById('priceMin');
        const maxInput = document.getElementById('priceMax');
        const sortSelect = document.getElementById('sortBy');
        const inStockCheckbox = document.getElementById('inStockOnly');
        
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        if (sortSelect) sortSelect.value = 'newest';
        if (inStockCheckbox) inStockCheckbox.checked = false;
        
        // Uncheck all category checkboxes
        document.querySelectorAll('.category-checkboxes input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset condition radio
        document.querySelector('input[name="condition"][value="all"]').checked = true;
        
        // Apply filters (will show all products)
        this.applyFilters();
        this.updateURL();
        
        if (window.ErrorHandler) {
            window.ErrorHandler.showSuccess('Filters cleared');
        }
    },
    
    /**
     * Apply filters from URL parameters
     */
    applyFiltersFromURL: function() {
        const params = new URLSearchParams(window.location.search);
        
        // Price
        if (params.has('priceMin')) {
            this.filters.priceMin = parseFloat(params.get('priceMin'));
            const input = document.getElementById('priceMin');
            if (input) input.value = this.filters.priceMin;
        }
        if (params.has('priceMax')) {
            this.filters.priceMax = parseFloat(params.get('priceMax'));
            const input = document.getElementById('priceMax');
            if (input) input.value = this.filters.priceMax;
        }
        
        // Categories
        if (params.has('categories')) {
            this.filters.categories = params.get('categories').split(',');
            this.filters.categories.forEach(cat => {
                const checkbox = document.querySelector(`input[value="${cat}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        // Sort
        if (params.has('sortBy')) {
            this.filters.sortBy = params.get('sortBy');
            const select = document.getElementById('sortBy');
            if (select) select.value = this.filters.sortBy;
        }
        
        // Condition
        if (params.has('condition')) {
            this.filters.condition = params.get('condition');
            const radio = document.querySelector(`input[name="condition"][value="${this.filters.condition}"]`);
            if (radio) radio.checked = true;
        }
        
        // In stock
        if (params.has('inStock')) {
            this.filters.inStock = params.get('inStock') === 'true';
            const checkbox = document.getElementById('inStockOnly');
            if (checkbox) checkbox.checked = this.filters.inStock;
        }
        
        // Apply filters
        if (params.toString()) {
            this.applyFilters();
        }
    },
    
    /**
     * Update URL with current filters
     */
    updateURL: function() {
        const params = new URLSearchParams();
        
        if (this.filters.priceMin) params.set('priceMin', this.filters.priceMin);
        if (this.filters.priceMax) params.set('priceMax', this.filters.priceMax);
        if (this.filters.categories.length > 0) params.set('categories', this.filters.categories.join(','));
        if (this.filters.sortBy !== 'newest') params.set('sortBy', this.filters.sortBy);
        if (this.filters.condition) params.set('condition', this.filters.condition);
        if (this.filters.inStock) params.set('inStock', 'true');
        
        // Update URL without page reload
        const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newURL);
    },
    
    /**
     * Add styles
     */
    addStyles: function() {
        if (document.getElementById('product-filters-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'product-filters-styles';
        style.textContent = `
            .product-filters {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }
            
            .filters-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e0e0e0;
            }
            
            .filters-header h3 {
                margin: 0;
                font-size: 20px;
                color: #333;
            }
            
            .clear-filters-btn {
                background: none;
                border: 1px solid #ccc;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                color: #666;
            }
            
            .clear-filters-btn:hover {
                background: #f5f5f5;
                border-color: #999;
            }
            
            .filter-section {
                margin-bottom: 20px;
            }
            
            .filter-section h4 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: #555;
            }
            
            .filter-section select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
            }
            
            .price-inputs {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .price-inputs input {
                flex: 1;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
            }
            
            .price-slider {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .price-slider input[type="range"] {
                width: 100%;
            }
            
            .price-value {
                font-size: 14px;
                color: #666;
            }
            
            .category-checkboxes,
            .condition-radios {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .category-checkboxes label,
            .condition-radios label,
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }
            
            .filter-results {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e0e0e0;
                text-align: center;
            }
            
            .filter-results p {
                margin: 0;
                color: #666;
            }
            
            .no-results-message {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px 20px;
            }
            
            .no-results-message p {
                font-size: 18px;
                color: #666;
                margin-bottom: 15px;
            }
            
            .no-results-message button {
                background: #2d8a3e;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
            }
            
            /* Dark mode */
            .dark-mode .product-filters {
                background: var(--bg-secondary);
                border-color: var(--border-color);
            }
            
            .dark-mode .filters-header h3,
            .dark-mode .filter-section h4 {
                color: var(--text-primary);
            }
            
            .dark-mode .filter-section select,
            .dark-mode .price-inputs input {
                background: var(--bg-primary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .product-filters {
                    padding: 15px;
                }
                
                .filters-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProductFilters.init());
} else {
    ProductFilters.init();
}

// Make available globally
window.ProductFilters = ProductFilters;

console.log('✅ Product Filters module loaded');
