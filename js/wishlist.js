// Wishlist / Save for Later Feature for ShopUp Ghana
// Zero-cost feature using existing Supabase database

const Wishlist = {
    // Cache
    items: [],
    
    /**
     * Initialize wishlist
     */
    init: async function() {
        // Check if user is logged in
        if (!window.supabase) {
            console.warn('Supabase not initialized');
            return;
        }
        
        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (user) {
            await this.loadWishlist(user.id);
        } else {
            // Load from localStorage for guests
            this.loadGuestWishlist();
        }
        
        // Add wishlist buttons to product cards
        this.addWishlistButtons();
        
        console.log('✅ Wishlist initialized');
    },
    
    /**
     * Load wishlist from database
     */
    loadWishlist: async function(userId) {
        try {
            // Try to load from database
            // Note: This requires a wishlist table in Supabase
            // For now, fall back to localStorage
            this.loadGuestWishlist();
            
            /* When wishlist table exists:
            const { data, error } = await window.supabase
                .from('customer_wishlists')
                .select('product_id, added_at')
                .eq('customer_id', userId);
            
            if (error) throw error;
            
            this.items = data || [];
            */
        } catch (error) {
            console.warn('Could not load wishlist from database:', error);
            this.loadGuestWishlist();
        }
    },
    
    /**
     * Load wishlist from localStorage (guest users)
     */
    loadGuestWishlist: function() {
        try {
            const saved = localStorage.getItem('shopup_wishlist');
            this.items = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading wishlist:', error);
            this.items = [];
        }
    },
    
    /**
     * Save wishlist to localStorage
     */
    saveGuestWishlist: function() {
        try {
            localStorage.setItem('shopup_wishlist', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving wishlist:', error);
        }
    },
    
    /**
     * Check if product is in wishlist
     */
    isInWishlist: function(productId) {
        return this.items.some(item => item.product_id === productId || item === productId);
    },
    
    /**
     * Add product to wishlist
     */
    addToWishlist: async function(productId, productData = {}) {
        // Check if already in wishlist
        if (this.isInWishlist(productId)) {
            if (window.ErrorHandler) {
                window.ErrorHandler.showError('This item is already in your wishlist');
            }
            return false;
        }
        
        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (user) {
            // Save to database
            /* When wishlist table exists:
            try {
                const { error } = await window.supabase
                    .from('customer_wishlists')
                    .insert([{
                        customer_id: user.id,
                        product_id: productId,
                        added_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
                
                this.items.push({ product_id: productId });
            } catch (error) {
                console.error('Error saving to wishlist:', error);
                return false;
            }
            */
            // For now, use localStorage
            this.items.push({ product_id: productId, ...productData });
            this.saveGuestWishlist();
        } else {
            // Save to localStorage for guests
            this.items.push({ product_id: productId, ...productData });
            this.saveGuestWishlist();
        }
        
        // Update UI
        this.updateWishlistButton(productId, true);
        
        if (window.ErrorHandler) {
            window.ErrorHandler.showSuccess('Added to wishlist! ❤️');
        }
        
        return true;
    },
    
    /**
     * Remove product from wishlist
     */
    removeFromWishlist: async function(productId) {
        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        
        if (user) {
            // Remove from database
            /* When wishlist table exists:
            try {
                const { error } = await window.supabase
                    .from('customer_wishlists')
                    .delete()
                    .eq('customer_id', user.id)
                    .eq('product_id', productId);
                
                if (error) throw error;
            } catch (error) {
                console.error('Error removing from wishlist:', error);
                return false;
            }
            */
            // For now, use localStorage
            this.items = this.items.filter(item => 
                item.product_id !== productId && item !== productId
            );
            this.saveGuestWishlist();
        } else {
            // Remove from localStorage
            this.items = this.items.filter(item => 
                item.product_id !== productId && item !== productId
            );
            this.saveGuestWishlist();
        }
        
        // Update UI
        this.updateWishlistButton(productId, false);
        
        if (window.ErrorHandler) {
            window.ErrorHandler.showSuccess('Removed from wishlist');
        }
        
        return true;
    },
    
    /**
     * Toggle wishlist status
     */
    toggle: async function(productId, productData = {}) {
        if (this.isInWishlist(productId)) {
            await this.removeFromWishlist(productId);
        } else {
            await this.addToWishlist(productId, productData);
        }
    },
    
    /**
     * Add wishlist buttons to product cards
     */
    addWishlistButtons: function() {
        // Find all product cards
        const productCards = document.querySelectorAll('.product-card, [data-product-id]');
        
        productCards.forEach(card => {
            // Skip if button already exists
            if (card.querySelector('.wishlist-btn')) return;
            
            // Get product ID
            const productId = card.getAttribute('data-product-id') || 
                            card.querySelector('[data-product-id]')?.getAttribute('data-product-id');
            
            if (!productId) return;
            
            // Create wishlist button
            const button = document.createElement('button');
            button.className = 'wishlist-btn';
            button.setAttribute('data-product-id', productId);
            button.innerHTML = this.isInWishlist(productId) ? '❤️' : '🤍';
            button.title = 'Add to wishlist';
            
            // Add click handler
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggle(productId);
            });
            
            // Add to card
            card.style.position = 'relative';
            card.appendChild(button);
        });
        
        // Add styles if not exists
        this.addStyles();
    },
    
    /**
     * Update wishlist button appearance
     */
    updateWishlistButton: function(productId, isInWishlist) {
        const buttons = document.querySelectorAll(`.wishlist-btn[data-product-id="${productId}"]`);
        buttons.forEach(button => {
            button.innerHTML = isInWishlist ? '❤️' : '🤍';
            button.classList.toggle('active', isInWishlist);
        });
    },
    
    /**
     * Get wishlist count
     */
    getCount: function() {
        return this.items.length;
    },
    
    /**
     * Add styles for wishlist buttons
     */
    addStyles: function() {
        if (document.getElementById('wishlist-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'wishlist-styles';
        style.textContent = `
            .wishlist-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .wishlist-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            
            .wishlist-btn:active {
                transform: scale(0.95);
            }
            
            .wishlist-btn.active {
                animation: heartBeat 0.3s ease;
            }
            
            @keyframes heartBeat {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.3); }
                50% { transform: scale(1.1); }
                75% { transform: scale(1.2); }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Wishlist.init());
} else {
    Wishlist.init();
}

// Make available globally
window.Wishlist = Wishlist;

console.log('✅ Wishlist module loaded');
