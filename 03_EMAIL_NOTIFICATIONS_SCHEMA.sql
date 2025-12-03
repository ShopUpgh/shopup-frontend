-- ============================================
-- EMAIL NOTIFICATION TRIGGERS
-- ============================================
-- Automatically send emails on order events

-- Function to call Edge Function for order confirmation
CREATE OR REPLACE FUNCTION send_order_confirmation_email()
RETURNS TRIGGER AS $$
DECLARE
    order_items_json JSONB;
    payload JSONB;
BEGIN
    -- Only send email when order is first created
    IF TG_OP = 'INSERT' THEN
        -- Get order items
        SELECT json_agg(
            json_build_object(
                'name', product_name,
                'quantity', quantity,
                'price', unit_price
            )
        ) INTO order_items_json
        FROM order_items
        WHERE order_id = NEW.id;
        
        -- Build payload
        payload := json_build_object(
            'to', NEW.customer_email,
            'customerName', NEW.customer_name,
            'orderNumber', NEW.order_number,
            'orderDate', NEW.created_at,
            'items', COALESCE(order_items_json, '[]'::jsonb),
            'subtotal', NEW.subtotal,
            'tax', NEW.tax,
            'deliveryFee', NEW.delivery_fee,
            'total', NEW.total,
            'deliveryAddress', NEW.delivery_address || ', ' || NEW.delivery_city || ', ' || NEW.delivery_region,
            'paymentMethod', NEW.payment_method
        );
        
        -- Call Edge Function (via pg_net extension if available)
        -- Note: This requires pg_net extension
        -- For production, you can also use webhooks or scheduled functions
        
        -- Log the email request
        INSERT INTO email_logs (
            email_type,
            recipient,
            order_id,
            payload,
            status
        ) VALUES (
            'order_confirmation',
            NEW.customer_email,
            NEW.id,
            payload,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send shipping notification
CREATE OR REPLACE FUNCTION send_shipping_notification_email()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    -- Send email when order status changes to 'shipped'
    IF NEW.order_status = 'shipped' AND OLD.order_status != 'shipped' THEN
        
        payload := json_build_object(
            'to', NEW.customer_email,
            'customerName', NEW.customer_name,
            'orderNumber', NEW.order_number,
            'trackingNumber', NEW.tracking_number,
            'carrier', COALESCE(NEW.shipping_carrier, 'Standard Delivery'),
            'estimatedDelivery', COALESCE(NEW.estimated_delivery, '2-5 business days'),
            'deliveryAddress', NEW.delivery_address || ', ' || NEW.delivery_city || ', ' || NEW.delivery_region
        );
        
        -- Log the email request
        INSERT INTO email_logs (
            email_type,
            recipient,
            order_id,
            payload,
            status
        ) VALUES (
            'shipping_notification',
            NEW.customer_email,
            NEW.id,
            payload,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    payload JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- Create triggers
DROP TRIGGER IF EXISTS trigger_send_order_confirmation ON orders;
CREATE TRIGGER trigger_send_order_confirmation
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_order_confirmation_email();

DROP TRIGGER IF EXISTS trigger_send_shipping_notification ON orders;
CREATE TRIGGER trigger_send_shipping_notification
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_shipping_notification_email();

-- Comments
COMMENT ON TABLE email_logs IS 'Logs all email notifications sent';
COMMENT ON FUNCTION send_order_confirmation_email() IS 'Trigger function to send order confirmation emails';
COMMENT ON FUNCTION send_shipping_notification_email() IS 'Trigger function to send shipping notification emails';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Email notification triggers created successfully!';
    RAISE NOTICE '📧 Triggers: order_confirmation, shipping_notification';
    RAISE NOTICE '📋 Email logs table created';
END $$;
