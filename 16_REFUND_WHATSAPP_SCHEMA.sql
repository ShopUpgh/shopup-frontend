-- ============================================
-- REFUND SYSTEM SCHEMA
-- For processing customer refunds and returns
-- ============================================

CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order Reference
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_number VARCHAR(20) NOT NULL,
    
    -- Customer Information
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Refund Details
    refund_type VARCHAR(50) NOT NULL, -- 'full', 'partial'
    refund_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    
    -- Paystack Integration
    paystack_refund_id VARCHAR(100),
    paystack_response JSONB,
    
    -- Review
    reviewed_by UUID,
    review_notes TEXT,
    
    -- Return Information
    return_tracking_number VARCHAR(100),
    return_received BOOLEAN DEFAULT FALSE,
    return_condition VARCHAR(50), -- 'good', 'damaged', 'used'
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_customer_email (customer_email),
    INDEX idx_requested_at (requested_at)
);

COMMENT ON TABLE refund_requests IS 'Customer refund and return requests';

-- ============================================
-- WHATSAPP NOTIFICATIONS QUEUE
-- Queue for WhatsApp messages to be sent
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipient
    phone_number VARCHAR(20) NOT NULL, -- Ghana format: +233XXXXXXXXX
    
    -- Message Details
    message_type VARCHAR(50) NOT NULL, -- 'order_confirmation', 'order_shipped', 'refund_approved'
    message_body TEXT NOT NULL,
    
    -- Related Entity
    related_entity_type VARCHAR(50), -- 'order', 'refund', 'verification'
    related_entity_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
    
    -- WhatsApp API Response
    whatsapp_message_id VARCHAR(100),
    whatsapp_response JSONB,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_phone_number (phone_number),
    INDEX idx_message_type (message_type),
    INDEX idx_next_retry (next_retry_at),
    INDEX idx_created_at (created_at)
);

COMMENT ON TABLE whatsapp_notifications IS 'Queue for WhatsApp Business API notifications';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund requests
CREATE POLICY "Users can view own refund requests"
    ON refund_requests FOR SELECT
    USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can create refund requests
CREATE POLICY "Users can create refund requests"
    ON refund_requests FOR INSERT
    WITH CHECK (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can view all refunds
CREATE POLICY "Admins can manage refunds"
    ON refund_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = TRUE
        )
    );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically send WhatsApp notification
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
    p_phone VARCHAR(20),
    p_message_type VARCHAR(50),
    p_message_body TEXT,
    p_entity_type VARCHAR(50) DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO whatsapp_notifications (
        phone_number,
        message_type,
        message_body,
        related_entity_type,
        related_entity_id,
        status
    ) VALUES (
        p_phone,
        p_message_type,
        p_message_body,
        p_entity_type,
        p_entity_id,
        'pending'
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to retry failed WhatsApp messages
CREATE OR REPLACE FUNCTION retry_failed_whatsapp_messages()
RETURNS void AS $$
BEGIN
    UPDATE whatsapp_notifications
    SET 
        status = 'pending',
        retry_count = retry_count + 1,
        next_retry_at = NOW() + (retry_count * INTERVAL '5 minutes')
    WHERE status = 'failed'
    AND retry_count < max_retries
    AND (next_retry_at IS NULL OR next_retry_at <= NOW());
END;
$$ LANGUAGE plpgsql;

-- Trigger to send WhatsApp notification on order creation
CREATE OR REPLACE FUNCTION notify_order_via_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
    -- Send WhatsApp notification to customer
    PERFORM send_whatsapp_notification(
        NEW.customer_phone,
        'order_confirmation',
        FORMAT('✅ Order Confirmed!\n\nOrder #%s\nTotal: GHS %.2f\n\nThank you for shopping with ShopUp Ghana!', 
               NEW.order_number, NEW.total),
        'order',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_whatsapp_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_via_whatsapp();

-- Trigger to notify on refund approval
CREATE OR REPLACE FUNCTION notify_refund_via_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        PERFORM send_whatsapp_notification(
            NEW.customer_phone,
            'refund_approved',
            FORMAT('✅ Refund Approved!\n\nOrder #%s\nRefund Amount: GHS %.2f\n\nYou will receive your refund within 5-7 business days.', 
                   NEW.order_number, NEW.refund_amount),
            'refund',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refund_whatsapp_notification
    AFTER UPDATE ON refund_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_refund_via_whatsapp();

-- ============================================
-- SCHEDULED JOBS (Configure in Supabase)
-- ============================================

-- Retry failed WhatsApp messages every 5 minutes
-- SELECT cron.schedule('retry-whatsapp', '*/5 * * * *', 'SELECT retry_failed_whatsapp_messages()');
