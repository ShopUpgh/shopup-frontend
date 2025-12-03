-- ============================================
-- SHOPUP PAYSTACK PAYMENT INTEGRATION SCHEMA
-- ============================================
-- Version: 1.0
-- Date: November 14, 2025
-- ============================================

-- ============================================
-- 1. PAYMENT METHODS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    
    -- Payment Method Type
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN (
        'mobile_money', 
        'card', 
        'bank_transfer',
        'cash_on_delivery'
    )),
    
    -- Provider Details
    provider VARCHAR(50), -- MTN, Vodafone, AirtelTigo, Visa, Mastercard
    
    -- Mobile Money
    mobile_number VARCHAR(20),
    mobile_network VARCHAR(20), -- mtn, vodafone, airteltigo
    
    -- Card Details (tokenized)
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Paystack Authorization
    authorization_code VARCHAR(255),
    
    -- Bank Details
    bank_name VARCHAR(100),
    account_number_last4 VARCHAR(4),
    
    -- Status
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

-- ============================================
-- 2. PAYMENT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_ref VARCHAR(255) UNIQUE NOT NULL,
    paystack_reference VARCHAR(255) UNIQUE,
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    
    -- Payment Method
    payment_method VARCHAR(50) NOT NULL,
    payment_channel VARCHAR(50), -- mobile_money, card, bank, cash
    provider VARCHAR(50), -- mtn, vodafone, visa, mastercard
    
    -- Mobile Money Details
    mobile_number VARCHAR(20),
    mobile_network VARCHAR(20),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'success',
        'failed',
        'cancelled',
        'refunded'
    )),
    
    -- Paystack Response
    paystack_status VARCHAR(50),
    paystack_message TEXT,
    authorization_code VARCHAR(255),
    
    -- Gateway Info
    gateway_response TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Customer Info
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Full Paystack Response
    paystack_response JSONB,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(transaction_ref);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- ============================================
-- 3. PAYMENT WEBHOOKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Webhook Details
    event_type VARCHAR(100) NOT NULL,
    paystack_event_id VARCHAR(255),
    
    -- Transaction Reference
    transaction_ref VARCHAR(255),
    
    -- Payload
    payload JSONB NOT NULL,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Timestamps
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX idx_payment_webhooks_transaction_ref ON payment_webhooks(transaction_ref);

-- ============================================
-- 4. REFUNDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    transaction_id UUID REFERENCES payment_transactions(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    
    -- Refund Details
    refund_ref VARCHAR(255) UNIQUE NOT NULL,
    paystack_refund_id VARCHAR(255),
    
    -- Amount
    original_amount DECIMAL(10,2) NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    
    -- Reason
    reason TEXT,
    refund_type VARCHAR(50) CHECK (refund_type IN ('full', 'partial')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed'
    )),
    
    -- Processing
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_refunds_transaction_id ON refunds(transaction_id);
CREATE INDEX idx_refunds_customer_id ON refunds(customer_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refunds_updated_at ON refunds;
CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure single default payment method
CREATE OR REPLACE FUNCTION ensure_single_default_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE payment_methods
        SET is_default = false
        WHERE customer_id = NEW.customer_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_payment_trigger ON payment_methods;
CREATE TRIGGER ensure_single_default_payment_trigger
    BEFORE INSERT OR UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_payment();

-- Update order status on successful payment
CREATE OR REPLACE FUNCTION update_order_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' AND OLD.status != 'success' THEN
        UPDATE orders
        SET 
            payment_status = 'paid',
            order_status = 'confirmed',
            confirmed_at = NOW()
        WHERE id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_on_payment_trigger ON payment_transactions;
CREATE TRIGGER update_order_on_payment_trigger
    AFTER UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_order_on_payment();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Payment Methods Policies
CREATE POLICY "Users can view own payment methods"
    ON payment_methods FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own payment methods"
    ON payment_methods FOR ALL
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Payment Transactions Policies
CREATE POLICY "Users can view own transactions"
    ON payment_transactions FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Refunds Policies
CREATE POLICY "Users can view own refunds"
    ON refunds FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_ref()
RETURNS VARCHAR AS $$
DECLARE
    ref VARCHAR;
BEGIN
    ref := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- Get payment summary
CREATE OR REPLACE FUNCTION get_payment_summary(p_customer_id UUID)
RETURNS TABLE (
    total_spent DECIMAL,
    total_transactions INTEGER,
    successful_payments INTEGER,
    failed_payments INTEGER,
    pending_payments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_spent,
        COUNT(*)::INTEGER as total_transactions,
        COUNT(CASE WHEN status = 'success' THEN 1 END)::INTEGER as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER as failed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END)::INTEGER as pending_payments
    FROM payment_transactions
    WHERE customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
-- ============================================

-- Payment Summary View
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
    pt.customer_id,
    COUNT(pt.id) as total_transactions,
    COUNT(CASE WHEN pt.status = 'success' THEN 1 END) as successful_payments,
    COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_payments,
    SUM(CASE WHEN pt.status = 'success' THEN pt.amount ELSE 0 END) as total_paid,
    MAX(pt.paid_at) as last_payment_date
FROM payment_transactions pt
GROUP BY pt.customer_id;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE payment_methods IS 'Stored payment methods for customers';
COMMENT ON TABLE payment_transactions IS 'All payment transactions via Paystack';
COMMENT ON TABLE payment_webhooks IS 'Paystack webhook events';
COMMENT ON TABLE refunds IS 'Payment refunds and reversals';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Paystack Payment Schema created successfully!';
    RAISE NOTICE '💳 Tables created: 4 (payment_methods, payment_transactions, payment_webhooks, refunds)';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '⚡ Triggers created for order updates';
    RAISE NOTICE '🎯 Ready for Paystack integration!';
END $$;
