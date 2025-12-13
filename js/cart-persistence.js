/**
 * Cart Database Persistence for ShopUp Ghana
 * 
 * Syncs cart data between localStorage and Supabase database for logged-in users.
 * Allows users to access their cart across devices.
 * 
 * Features:
 * - Automatic sync when user logs in
 * - Periodic background sync
 * - Conflict resolution (newest wins)
 * - Works offline with localStorage fallback
 * - Seamless migration from localStorage to database
 * 
 * Usage:
 * <script src="js/supabase-config.js"></script>
 * <script src="js/cart-persistence.js"></script>
 * 
 * Zero Cost: Uses existing Supabase setup, no additional services needed
 */

(function() {
    'use strict';

    const CART_KEY = 'shopup_cart';
    const LAST_SYNC_KEY = 'shopup_cart_last_sync';
    const SYNC_INTERVAL = 30000; // 30 seconds

    class CartPersistence {
        constructor() {
            this.supabase = window.supabaseClient;
            this.currentUser = null;
            this.syncTimer = null;
            
            this.init();
        }

        async init() {
            if (!this.supabase) {
                console.warn('Supabase not initialized. Cart will use localStorage only.');
                return;
            }

            // Check current auth state
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                await this.syncCartOnLogin();
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    this.currentUser = session.user;
                    await this.syncCartOnLogin();
                    this.startPeriodicSync();
                } else if (event === 'SIGNED_OUT') {
                    this.currentUser = null;
                    this.stopPeriodicSync();
                }
            });

            // Start periodic sync if user is logged in
            if (this.currentUser) {
                this.startPeriodicSync();
            }

            // Listen for cart changes in localStorage
            this.watchLocalStorageChanges();
        }

        /**
         * Sync cart when user logs in
         * Merges localStorage cart with database cart
         */
        async syncCartOnLogin() {
            try {
                const localCart = this.getLocalCart();
                const dbCart = await this.getDbCart();

                if (!dbCart && localCart.length > 0) {
                    // No cart in DB, upload local cart
                    await this.saveToDb(localCart);
                    console.log('Cart uploaded to database');
                } else if (dbCart && localCart.length === 0) {
                    // No local cart, download DB cart
                    this.saveToLocal(dbCart);
                    console.log('Cart downloaded from database');
                } else if (dbCart && localCart.length > 0) {
                    // Both exist, merge them
                    const mergedCart = this.mergeCarts(localCart, dbCart);
                    await this.saveToDb(mergedCart);
                    this.saveToLocal(mergedCart);
                    console.log('Carts merged successfully');
                } else {
                    // Both empty, nothing to do
                    console.log('Cart is empty');
                }

                this.updateLastSyncTime();
            } catch (error) {
                console.error('Error syncing cart on login:', error);
            }
        }

        /**
         * Get cart from localStorage
         */
        getLocalCart() {
            try {
                const cart = localStorage.getItem(CART_KEY);
                return cart ? JSON.parse(cart) : [];
            } catch (error) {
                console.error('Error reading local cart:', error);
                return [];
            }
        }

        /**
         * Save cart to localStorage
         */
        saveToLocal(cart) {
            try {
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
                // Dispatch event for other parts of the app
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
            } catch (error) {
                console.error('Error saving to local cart:', error);
            }
        }

        /**
         * Get cart from database
         */
        async getDbCart() {
            if (!this.currentUser) return null;

            try {
                const { data, error } = await this.supabase
                    .from('carts')
                    .select('cart_data, updated_at')
                    .eq('user_id', this.currentUser.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // Not found is ok
                    throw error;
                }

                return data ? data.cart_data : null;
            } catch (error) {
                console.error('Error reading cart from database:', error);
                return null;
            }
        }

        /**
         * Save cart to database
         */
        async saveToDb(cart) {
            if (!this.currentUser) return;

            try {
                const { error } = await this.supabase
                    .from('carts')
                    .upsert({
                        user_id: this.currentUser.id,
                        cart_data: cart,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                
                this.updateLastSyncTime();
            } catch (error) {
                console.error('Error saving cart to database:', error);
            }
        }

        /**
         * Merge two carts
         * Strategy: Keep all unique items, sum quantities for duplicates
         */
        mergeCarts(localCart, dbCart) {
            const merged = [...dbCart];
            const dbProductIds = new Set(dbCart.map(item => item.product_id || item.id));

            for (const localItem of localCart) {
                const productId = localItem.product_id || localItem.id;
                
                if (!dbProductIds.has(productId)) {
                    // New item, add it
                    merged.push(localItem);
                } else {
                    // Item exists, update quantity
                    const existingItem = merged.find(item => 
                        (item.product_id || item.id) === productId
                    );
                    if (existingItem) {
                        existingItem.quantity = (existingItem.quantity || 1) + (localItem.quantity || 1);
                    }
                }
            }

            return merged;
        }

        /**
         * Start periodic background sync
         */
        startPeriodicSync() {
            if (this.syncTimer) return; // Already running

            this.syncTimer = setInterval(async () => {
                await this.syncCart();
            }, SYNC_INTERVAL);
        }

        /**
         * Stop periodic sync
         */
        stopPeriodicSync() {
            if (this.syncTimer) {
                clearInterval(this.syncTimer);
                this.syncTimer = null;
            }
        }

        /**
         * Sync cart (upload local changes if any)
         */
        async syncCart() {
            if (!this.currentUser) return;

            try {
                const localCart = this.getLocalCart();
                const lastSync = localStorage.getItem(LAST_SYNC_KEY);
                const now = Date.now();

                // Only sync if there are changes (cart modified after last sync)
                if (lastSync && now - parseInt(lastSync) < SYNC_INTERVAL) {
                    return; // Too soon
                }

                await this.saveToDb(localCart);
            } catch (error) {
                console.error('Error during periodic sync:', error);
            }
        }

        /**
         * Update last sync timestamp
         */
        updateLastSyncTime() {
            localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        }

        /**
         * Watch for cart changes in localStorage
         */
        watchLocalStorageChanges() {
            // Watch for storage events (from other tabs)
            window.addEventListener('storage', (e) => {
                if (e.key === CART_KEY && this.currentUser) {
                    // Cart changed in another tab, sync to DB
                    setTimeout(() => this.syncCart(), 1000);
                }
            });

            // Watch for custom cart update events
            window.addEventListener('cartUpdated', () => {
                if (this.currentUser) {
                    setTimeout(() => this.syncCart(), 1000);
                }
            });
        }

        /**
         * Manual sync trigger (can be called from UI)
         */
        async forceSyncCart() {
            if (!this.currentUser) {
                console.log('User not logged in. Cart saved locally only.');
                return false;
            }

            try {
                const localCart = this.getLocalCart();
                await this.saveToDb(localCart);
                console.log('Cart synced successfully');
                return true;
            } catch (error) {
                console.error('Error forcing cart sync:', error);
                return false;
            }
        }

        /**
         * Clear cart (both local and database)
         */
        async clearCart() {
            try {
                // Clear local
                localStorage.removeItem(CART_KEY);
                
                // Clear database
                if (this.currentUser) {
                    await this.supabase
                        .from('carts')
                        .delete()
                        .eq('user_id', this.currentUser.id);
                }

                window.dispatchEvent(new CustomEvent('cartCleared'));
                console.log('Cart cleared');
            } catch (error) {
                console.error('Error clearing cart:', error);
            }
        }
    }

    // Initialize cart persistence
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cartPersistence = new CartPersistence();
        });
    } else {
        window.cartPersistence = new CartPersistence();
    }

    // Expose manual sync function globally
    window.syncCart = function() {
        if (window.cartPersistence) {
            return window.cartPersistence.forceSyncCart();
        }
        return Promise.resolve(false);
    };

})();
