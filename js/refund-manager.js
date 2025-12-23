/**
 * Refund Management System for ShopUp Ghana
 * Handles refund requests, processing, and customer notifications
 */

class RefundManager {
    constructor() {
        this.supabase = window.supabase;
    }

    /**
     * Request a refund for an order
     */
    async requestRefund(orderId, reason, refundType = 'full') {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Fetch order details
            const { data: order, error: orderError } = await this.supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;

            // Validate refund eligibility
            const validation = this.validateRefundEligibility(order);
            if (!validation.eligible) {
                throw new Error(validation.reason);
            }

            // Calculate refund amount
            const refundAmount = refundType === 'full' ? order.total : this.calculatePartialRefund(order);

            // Create refund request
            const { data: refund, error: refundError } = await this.supabase
                .from('refund_requests')
                .insert({
                    order_id: orderId,
                    order_number: order.order_number,
                    customer_email: order.customer_email,
                    customer_name: order.customer_name,
                    refund_type: refundType,
                    refund_amount: refundAmount,
                    reason: reason,
                    status: 'pending',
                    requested_at: new Date().toISOString()
                })
                .select()
                .single();

            if (refundError) throw refundError;

            return {
                success: true,
                message: 'Refund request submitted successfully. You will receive an email confirmation.',
                refund_id: refund.id,
                refund_amount: refundAmount
            };

        } catch (error) {
            console.error('Refund request failed:', error);
            throw error;
        }
    }

    /**
     * Validate if order is eligible for refund
     */
    validateRefundEligibility(order) {
        // Check if order was placed within refund window (7 days for Ghana)
        const orderDate = new Date(order.created_at);
        const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceOrder > 7) {
            return {
                eligible: false,
                reason: 'Refund window expired. Refunds are only available within 7 days of purchase.'
            };
        }

        // Check order status
        if (order.order_status === 'delivered') {
            return {
                eligible: true,
                reason: 'Product must be returned in original condition'
            };
        }

        if (order.order_status === 'cancelled') {
            return {
                eligible: false,
                reason: 'Order is already cancelled'
            };
        }

        // Check if already refunded
        if (order.payment_status === 'refunded') {
            return {
                eligible: false,
                reason: 'Order has already been refunded'
            };
        }

        return { eligible: true };
    }

    /**
     * Calculate partial refund amount
     */
    calculatePartialRefund(order) {
        // Implement partial refund logic
        // For now, returns full amount minus shipping
        return order.total - order.shipping_fee;
    }

    /**
     * Process refund (Admin function)
     * This initiates the actual refund through Paystack
     */
    async processRefund(refundId) {
        try {
            // Fetch refund details
            const { data: refund, error: refundError } = await this.supabase
                .from('refund_requests')
                .select('*, orders(*)')
                .eq('id', refundId)
                .single();

            if (refundError) throw refundError;

            // Call Edge Function to process refund via Paystack
            const { data, error } = await this.supabase.functions.invoke('process-refund', {
                body: {
                    refund_id: refundId,
                    transaction_id: refund.orders.transaction_id,
                    amount: refund.refund_amount
                }
            });

            if (error) throw error;

            // Update refund status
            await this.supabase
                .from('refund_requests')
                .update({
                    status: 'approved',
                    processed_at: new Date().toISOString(),
                    paystack_refund_id: data.refund_reference
                })
                .eq('id', refundId);

            // Update order status
            await this.supabase
                .from('orders')
                .update({
                    payment_status: 'refunded',
                    order_status: 'cancelled'
                })
                .eq('id', refund.order_id);

            return {
                success: true,
                message: 'Refund processed successfully',
                refund_reference: data.refund_reference
            };

        } catch (error) {
            console.error('Refund processing failed:', error);
            throw error;
        }
    }

    /**
     * Get refund status
     */
    async getRefundStatus(orderId) {
        try {
            const { data, error } = await this.supabase
                .from('refund_requests')
                .select('*')
                .eq('order_id', orderId)
                .order('requested_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { status: 'no_refund_requested' };
                }
                throw error;
            }

            return data;

        } catch (error) {
            console.error('Error fetching refund status:', error);
            throw error;
        }
    }
}

// Export global instance
window.RefundManager = new RefundManager();

console.log('✅ Refund Management System loaded');
