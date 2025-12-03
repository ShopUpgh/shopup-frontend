-- ============================================
-- SHOPUP PLATFORM ENHANCEMENTS - PART 3
-- ============================================
-- Advanced Analytics, Notifications, Functions
-- 2FA, Disputes, PWA Support
-- Version: 2.0
-- Date: November 17, 2025
-- ============================================

-- ============================================
-- 1. ADVANCED SELLER ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS seller_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Traffic
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    product_views INTEGER DEFAULT 0,
    
    -- Sales
    orders_count INTEGER DEFAULT 0,
    orders_value DECIMAL(10,2) DEFAULT 0.00,
    items_sold INTEGER DEFAULT 0,
    
    -- Conversion
    cart_additions INTEGER DEFAULT 0,
    checkout_initiated INTEGER DEFAULT 0,
    checkout_completed INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Cart Abandonment
    abandoned_carts INTEGER DEFAULT 0,
    abandoned_cart_value DECIMAL(10,2) DEFAULT 0.00,
    
    -- Customer Behavior
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    
    -- Revenue
    gross_revenue DECIMAL(10,2) DEFAULT 0.00,
    commission_paid DECIMAL(10,2) DEFAULT 0.00,
    net_revenue DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(seller_id, date)
);

CREATE INDEX idx_analytics_seller_date ON seller_analytics_daily(seller_id, date DESC);

-- ============================================
-- 2. PRODUCT ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Views
    views INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    
    -- Engagement
    cart_adds INTEGER DEFAULT 0,
    wishlist_adds INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- Sales
    units_sold INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    
    -- Conversion
    view_to_cart_rate DECIMAL(5,2) DEFAULT 0.00,
    cart_to_purchase_rate DECIMAL(5,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, date)
);

CREATE INDEX idx_product_analytics_product ON product_analytics(product_id, date DESC);

-- ============================================
-- 3. TRAFFIC SOURCES
-- ============================================

CREATE TABLE IF NOT EXISTS traffic_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Source
    source_type VARCHAR(50) NOT NULL CHECK (
        source_type IN ('direct', 'social', 'whatsapp', 'facebook', 'instagram', 
                       'google', 'referral', 'other')
    ),
    source_detail VARCHAR(255), -- e.g., specific Instagram post
    
    -- Tracking
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer_url TEXT,
    
    -- User
    visitor_id VARCHAR(255),
    
    -- Conversion
    converted BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_traffic_seller ON traffic_sources(seller_id);
CREATE INDEX idx_traffic_product ON traffic_sources(product_id);
CREATE INDEX idx_traffic_source ON traffic_sources(source_type);

-- ============================================
-- 4. TWO-FACTOR AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Method
    method VARCHAR(50) DEFAULT 'sms' CHECK (method IN ('sms', 'email', 'authenticator')),
    
    -- Status
    is_enabled BOOLEAN DEFAULT false,
    
    -- Phone/Email for OTP
    phone_number VARCHAR(20),
    email_address VARCHAR(255),
    
    -- Authenticator (Google Authenticator, etc.)
    authenticator_secret TEXT,
    
    -- Backup Codes
    backup_codes TEXT[], -- Array of hashed backup codes
    
    -- Last Used
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. OTP CODES
-- ============================================

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- OTP
    code VARCHAR(10) NOT NULL,
    code_hash TEXT NOT NULL, -- Hashed version
    
    -- Purpose
    purpose VARCHAR(50) NOT NULL CHECK (
        purpose IN ('login', 'password_reset', 'phone_verification', 'withdrawal', 'sensitive_action')
    ),
    
    -- Delivery
    delivery_method VARCHAR(50) NOT NULL CHECK (delivery_method IN ('sms', 'email', 'whatsapp')),
    sent_to VARCHAR(255) NOT NULL,
    
    -- Status
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '10 minutes',
    
    -- Attempts
    verification_attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_user ON otp_codes(user_id);
CREATE INDEX idx_otp_expiry ON otp_codes(expires_at);

-- ============================================
-- 6. ORDER DISPUTES
-- ============================================

CREATE TABLE IF NOT EXISTS order_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Who Filed
    filed_by UUID NOT NULL REFERENCES auth.users(id),
    filed_by_type VARCHAR(20) NOT NULL CHECK (filed_by_type IN ('customer', 'seller')),
    
    -- Dispute Details
    dispute_reason VARCHAR(100) NOT NULL CHECK (
        dispute_reason IN (
            'item_not_received', 'item_not_as_described', 'damaged_item', 
            'wrong_item', 'fake_product', 'payment_issue', 'other'
        )
    ),
    description TEXT NOT NULL,
    
    -- Evidence
    evidence_images TEXT[],
    evidence_documents TEXT[],
    
    -- Resolution
    status VARCHAR(50) DEFAULT 'open' CHECK (
        status IN ('open', 'investigating', 'resolved', 'closed', 'escalated')
    ),
    resolution_type VARCHAR(50) CHECK (
        resolution_type IN ('refund', 'replacement', 'partial_refund', 'no_action')
    ),
    resolution_notes TEXT,
    
    -- Admin Review
    assigned_to UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    
    -- Refund
    refund_amount DECIMAL(10,2),
    refund_processed BOOLEAN DEFAULT false,
    refund_processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Dates
    filed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_disputes_order ON order_disputes(order_id);
CREATE INDEX idx_disputes_status ON order_disputes(status);
CREATE INDEX idx_disputes_filed_by ON order_disputes(filed_by);

-- ============================================
-- 7. DISPUTE MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES order_disputes(id) ON DELETE CASCADE,
    
    -- Sender
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'seller', 'admin')),
    
    -- Message
    message TEXT NOT NULL,
    attachments TEXT[],
    
    -- Visibility
    is_internal BOOLEAN DEFAULT false, -- Admin notes only
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dispute_messages_dispute ON dispute_messages(dispute_id);

-- ============================================
-- 8. PUSH NOTIFICATIONS (PWA)
-- ============================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Subscription Details
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    
    -- Device Info
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

-- ============================================
-- 9. NOTIFICATION QUEUE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (
        notification_type IN (
            'order_placed', 'order_shipped', 'order_delivered', 
            'message_received', 'price_drop', 'promotion', 
            'low_stock', 'review_received', 'dispute_filed'
        )
    ),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Channels
    send_email BOOLEAN DEFAULT false,
    send_sms BOOLEAN DEFAULT false,
    send_whatsapp BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT false,
    send_in_app BOOLEAN DEFAULT true,
    
    -- Data
    data JSONB, -- Additional data for the notification
    action_url TEXT, -- URL to navigate to
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'failed', 'cancelled')
    ),
    
    -- Delivery Status
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    whatsapp_sent BOOLEAN DEFAULT false,
    push_sent BOOLEAN DEFAULT false,
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Errors
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notification_queue(user_id);
CREATE INDEX idx_notifications_status ON notification_queue(status);
CREATE INDEX idx_notifications_scheduled ON notification_queue(scheduled_for);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate service fee
CREATE OR REPLACE FUNCTION calculate_service_fee(
    p_order_total DECIMAL,
    p_commission_rate DECIMAL,
    p_transaction_fee DECIMAL DEFAULT 0.30
)
RETURNS DECIMAL AS $$
DECLARE
    v_commission DECIMAL;
    v_total_fee DECIMAL;
BEGIN
    -- Commission (percentage of order)
    v_commission := p_order_total * (p_commission_rate / 100);
    
    -- Total fee = Commission + Transaction fee
    v_total_fee := v_commission + p_transaction_fee;
    
    RETURN ROUND(v_total_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating DECIMAL;
    v_review_count INTEGER;
BEGIN
    -- Calculate new average rating
    SELECT 
        ROUND(AVG(rating)::DECIMAL, 2),
        COUNT(*)
    INTO v_avg_rating, v_review_count
    FROM product_reviews
    WHERE product_id = NEW.product_id
    AND is_approved = true;
    
    -- Update product
    UPDATE products
    SET 
        average_rating = COALESCE(v_avg_rating, 0),
        review_count = v_review_count
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Function to update stock status
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_quantity = 0 THEN
        NEW.stock_status := 'out_of_stock';
    ELSIF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        NEW.stock_status := 'low_stock';
    ELSE
        NEW.stock_status := 'in_stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_status ON products;
CREATE TRIGGER trigger_update_stock_status
    BEFORE UPDATE ON products
    FOR EACH ROW
    WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
    EXECUTE FUNCTION update_stock_status();

-- Function to track inventory movements
CREATE OR REPLACE FUNCTION track_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
        INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity_change,
            quantity_before,
            quantity_after,
            performed_by
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'restock'
                WHEN NEW.stock_quantity < OLD.stock_quantity THEN 'adjustment'
            END,
            NEW.stock_quantity - OLD.stock_quantity,
            OLD.stock_quantity,
            NEW.stock_quantity,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_inventory ON products;
CREATE TRIGGER trigger_track_inventory
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_inventory_movement();

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_new_balance DECIMAL;
BEGIN
    -- Calculate new balance based on transaction type
    IF NEW.transaction_type IN ('credit', 'refund', 'top_up') THEN
        v_new_balance := NEW.balance_before + NEW.amount;
    ELSIF NEW.transaction_type IN ('debit', 'withdrawal', 'purchase', 'commission') THEN
        v_new_balance := NEW.balance_before - NEW.amount;
    ELSE
        v_new_balance := NEW.balance_before;
    END IF;
    
    -- Set balance_after
    NEW.balance_after := v_new_balance;
    
    -- Update wallet
    UPDATE wallets
    SET 
        balance = v_new_balance,
        total_credits = CASE 
            WHEN NEW.transaction_type IN ('credit', 'refund', 'top_up') 
            THEN total_credits + NEW.amount 
            ELSE total_credits 
        END,
        total_debits = CASE 
            WHEN NEW.transaction_type IN ('debit', 'withdrawal', 'purchase', 'commission') 
            THEN total_debits + NEW.amount 
            ELSE total_debits 
        END
    WHERE id = NEW.wallet_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallet ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet
    BEFORE INSERT ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(
    p_seller_id UUID,
    p_action VARCHAR -- 'add_product', 'feature_request'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_name VARCHAR;
    v_max_products INTEGER;
    v_current_products INTEGER;
BEGIN
    -- Get seller's plan
    SELECT sp.plan_name, sp.max_products
    INTO v_plan_name, v_max_products
    FROM seller_subscriptions ss
    JOIN subscription_plans sp ON ss.plan_id = sp.id
    WHERE ss.seller_id = p_seller_id
    AND ss.status IN ('trial', 'active');
    
    IF v_plan_name IS NULL THEN
        -- No subscription, assume free plan
        SELECT max_products INTO v_max_products
        FROM subscription_plans
        WHERE plan_name = 'free';
    END IF;
    
    IF p_action = 'add_product' THEN
        -- Count current products
        SELECT COUNT(*) INTO v_current_products
        FROM products
        WHERE seller_id = p_seller_id;
        
        RETURN v_current_products < v_max_products;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON wallets FOR SELECT USING (user_id = auth.uid());

-- Wallet Transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT 
USING (wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid()));

-- Messaging
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own threads" ON message_threads FOR ALL
USING (customer_id = auth.uid() OR seller_id = auth.uid());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON messages FOR ALL
USING (thread_id IN (
    SELECT id FROM message_threads 
    WHERE customer_id = auth.uid() OR seller_id = auth.uid()
));

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ShopUp Platform Enhancements - Part 3 Complete!';
    RAISE NOTICE '📊 Added: Advanced Analytics & Traffic Sources';
    RAISE NOTICE '🔐 Added: Two-Factor Authentication (2FA)';
    RAISE NOTICE '⚖️  Added: Order Disputes & Resolution';
    RAISE NOTICE '🔔 Added: Push Notifications (PWA)';
    RAISE NOTICE '⚙️  Added: Helper Functions & Triggers';
    RAISE NOTICE '🛡️  Added: RLS Policies for Security';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ALL PLATFORM ENHANCEMENTS COMPLETE!';
END $$;
