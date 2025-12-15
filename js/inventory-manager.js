// Inventory Management System for ShopUp Ghana
// Prevents overselling and race conditions

const InventoryManager = {
    // In-memory lock for preventing race conditions
    locks: new Map(),
    
    /**
     * Check if product has sufficient stock
     * @param {string} productId - Product ID
     * @param {number} quantity - Requested quantity
     * @param {object} supabase - Supabase client
     * @returns {Promise<{available: boolean, currentStock: number}>}
     */
    checkStock: async function(productId, quantity, supabase) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('stock_quantity, id')
                .eq('id', productId)
                .single();
            
            if (error) throw error;
            
            const currentStock = data.stock_quantity || 0;
            const available = currentStock >= quantity;
            
            return {
                available,
                currentStock,
                requested: quantity
            };
        } catch (error) {
            console.error('Error checking stock:', error);
            throw new Error('Unable to verify product availability');
        }
    },
    
    /**
     * Reserve stock for a cart/order (prevents overselling)
     * @param {string} productId - Product ID
     * @param {number} quantity - Quantity to reserve
     * @param {string} customerId - Customer ID making the reservation
     * @param {object} supabase - Supabase client
     * @returns {Promise<boolean>} - Success status
     */
    reserveStock: async function(productId, quantity, customerId, supabase) {
        const lockKey = `product_${productId}`;
        
        try {
            // Wait for any existing locks to clear
            while (this.locks.get(lockKey)) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Acquire lock
            this.locks.set(lockKey, true);
            
            // Check current stock with locking
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', productId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const currentStock = product.stock_quantity || 0;
            
            if (currentStock < quantity) {
                // Release lock
                this.locks.delete(lockKey);
                return {
                    success: false,
                    message: 'Insufficient stock available',
                    currentStock
                };
            }
            
            // Deduct stock with optimistic locking
            const { data, error } = await supabase
                .from('products')
                .update({ 
                    stock_quantity: currentStock - quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId)
                .eq('stock_quantity', currentStock) // Ensures no changes happened
                .select();
            
            if (error || !data || data.length === 0) {
                // Stock was changed by another transaction
                this.locks.delete(lockKey);
                return {
                    success: false,
                    message: 'Stock was just updated. Please try again.',
                    retry: true
                };
            }
            
            // Create reservation record
            await this.createReservation(productId, quantity, customerId, supabase);
            
            // Release lock
            this.locks.delete(lockKey);
            
            return {
                success: true,
                message: 'Stock reserved successfully',
                newStock: currentStock - quantity
            };
            
        } catch (error) {
            // Release lock on error
            this.locks.delete(lockKey);
            console.error('Error reserving stock:', error);
            throw error;
        }
    },
    
    /**
     * Create a stock reservation record
     */
    createReservation: async function(productId, quantity, customerId, supabase) {
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute hold
            
            const { error } = await supabase
                .from('stock_reservations')
                .insert([{
                    product_id: productId,
                    customer_id: customerId,
                    quantity: quantity,
                    status: 'pending',
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString()
                }]);
            
            if (error && !error.message.includes('does not exist')) {
                // Table might not exist, that's okay - log it
                console.warn('Stock reservations table not available:', error);
            }
        } catch (error) {
            console.warn('Could not create reservation record:', error);
            // Non-critical - don't throw
        }
    },
    
    /**
     * Release reserved stock (e.g., when cart is abandoned or order cancelled)
     */
    releaseStock: async function(productId, quantity, supabase) {
        try {
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', productId)
                .single();
            
            if (fetchError) throw fetchError;
            
            const { error } = await supabase
                .from('products')
                .update({ 
                    stock_quantity: product.stock_quantity + quantity,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productId);
            
            if (error) throw error;
            
            return { success: true };
            
        } catch (error) {
            console.error('Error releasing stock:', error);
            throw error;
        }
    },
    
    /**
     * Batch reserve stock for multiple products (cart checkout)
     */
    reserveMultiple: async function(items, customerId, supabase) {
        const results = [];
        const failed = [];
        const reserved = [];
        
        try {
            for (const item of items) {
                const result = await this.reserveStock(
                    item.productId,
                    item.quantity,
                    customerId,
                    supabase
                );
                
                if (result.success) {
                    reserved.push(item);
                    results.push({ ...item, status: 'reserved' });
                } else {
                    failed.push({ ...item, ...result });
                    results.push({ ...item, status: 'failed', ...result });
                }
            }
            
            // If any failed, rollback all reservations
            if (failed.length > 0) {
                console.log('Rolling back reservations due to failures');
                for (const item of reserved) {
                    await this.releaseStock(item.productId, item.quantity, supabase);
                }
                
                return {
                    success: false,
                    failed,
                    message: 'Some items are no longer available',
                    results
                };
            }
            
            return {
                success: true,
                reserved,
                message: 'All items reserved successfully',
                results
            };
            
        } catch (error) {
            // Rollback on error
            for (const item of reserved) {
                try {
                    await this.releaseStock(item.productId, item.quantity, supabase);
                } catch (rollbackError) {
                    console.error('Rollback error:', rollbackError);
                }
            }
            throw error;
        }
    },
    
    /**
     * Update stock after successful order (confirm reservation)
     */
    confirmOrder: async function(reservationId, supabase) {
        try {
            // Update reservation status if table exists
            await supabase
                .from('stock_reservations')
                .update({ 
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', reservationId);
            
            return { success: true };
            
        } catch (error) {
            console.warn('Could not confirm reservation:', error);
            return { success: true }; // Non-critical
        }
    },
    
    /**
     * Restore stock after order cancellation
     */
    cancelOrder: async function(orderId, supabase) {
        try {
            // Get order items
            const { data: items, error } = await supabase
                .from('order_items')
                .select('product_id, quantity')
                .eq('order_id', orderId);
            
            if (error) throw error;
            
            // Restore stock for each item
            for (const item of items) {
                await this.releaseStock(item.product_id, item.quantity, supabase);
            }
            
            return { success: true };
            
        } catch (error) {
            console.error('Error cancelling order:', error);
            throw error;
        }
    },
    
    /**
     * Clean up expired reservations (run periodically)
     */
    cleanupExpiredReservations: async function(supabase) {
        try {
            const { data: expired, error } = await supabase
                .from('stock_reservations')
                .select('product_id, quantity')
                .eq('status', 'pending')
                .lt('expires_at', new Date().toISOString());
            
            if (error || !expired) return;
            
            // Release stock for expired reservations
            for (const reservation of expired) {
                await this.releaseStock(reservation.product_id, reservation.quantity, supabase);
            }
            
            // Mark as expired
            await supabase
                .from('stock_reservations')
                .update({ status: 'expired' })
                .eq('status', 'pending')
                .lt('expires_at', new Date().toISOString());
            
            console.log(`Cleaned up ${expired.length} expired reservations`);
            
        } catch (error) {
            console.error('Error cleaning up reservations:', error);
        }
    },
    
    /**
     * Get low stock alerts
     */
    getLowStockAlerts: async function(threshold = 10, supabase) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, stock_quantity, seller_id')
                .lte('stock_quantity', threshold)
                .gt('stock_quantity', 0)
                .eq('status', 'active');
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Error fetching low stock alerts:', error);
            return [];
        }
    }
};

// Make available globally
window.InventoryManager = InventoryManager;

console.log('✅ Inventory Manager loaded');
