-- ============================================
-- PRODUCTION READINESS: CRITICAL TABLES
-- Tables for payment verification, data compliance, and security
-- ============================================

-- ============================================
-- 1. PAYMENT VERIFICATIONS TABLE
-- Stores payment verification results for fraud prevention
-- ============================================
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Payment Reference
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    
    -- Verification Details
    verification_status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'pending'
    amount DECIMAL(10, 2) NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Paystack Response
    paystack_response JSONB,
    
    -- Security
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_payment_reference (payment_reference),
    INDEX idx_verification_status (verification_status),
    INDEX idx_verified_at (verified_at)
);

COMMENT ON TABLE payment_verifications IS 'Stores payment verification results from Paystack for security and audit purposes';

-- ============================================
-- 2. ACCOUNT DELETION REQUESTS TABLE
-- Ghana Data Protection Act (Act 843) compliance
-- ============================================
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    
    -- Request Details
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    
    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Reviewer
    reviewed_by UUID,
    reviewer_notes TEXT,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_requested_at (requested_at)
);

COMMENT ON TABLE account_deletion_requests IS 'Tracks user account deletion requests per Ghana Data Protection Act requirements';

-- ============================================
-- 3. DATA EXPORT LOGS TABLE
-- Track data export requests for compliance
-- ============================================
CREATE TABLE IF NOT EXISTS data_export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User Information
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    
    -- Export Details
    export_type VARCHAR(50) DEFAULT 'full', -- 'full', 'partial', 'orders_only'
    file_size_bytes INTEGER,
    records_exported INTEGER,
    
    -- Security
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_exported_at (exported_at)
);

COMMENT ON TABLE data_export_logs IS 'Audit log of user data exports for compliance tracking';

-- ============================================
-- 4. RATE LIMITING TABLE
-- Prevent abuse and bot attacks
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identifier
    identifier VARCHAR(255) NOT NULL, -- IP address or user ID
    identifier_type VARCHAR(50) NOT NULL, -- 'ip', 'user', 'email'
    
    -- Action Being Limited
    action VARCHAR(100) NOT NULL, -- 'login', 'register', 'checkout', 'api_call'
    
    -- Rate Limit Tracking
    request_count INTEGER DEFAULT 1,
    first_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Block Information
    blocked_until TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE,
    
    -- Window Configuration (in seconds)
    window_size INTEGER DEFAULT 60, -- 60 seconds = 1 minute window
    max_requests INTEGER DEFAULT 5, -- 5 requests per window
    
    UNIQUE (identifier, action),
    INDEX idx_identifier (identifier),
    INDEX idx_action (action),
    INDEX idx_blocked (is_blocked),
    INDEX idx_last_request (last_request_at)
);

COMMENT ON TABLE rate_limits IS 'Tracks request rates to prevent abuse and DDoS attacks';

-- ============================================
-- 5. STOCK RESERVATION TABLE
-- Prevent race conditions in checkout
-- ============================================
CREATE TABLE IF NOT EXISTS stock_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Product and Quantity
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    
    -- User Making Reservation
    user_id UUID,
    session_id VARCHAR(255), -- For non-authenticated users
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
    
    -- Timestamps
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL, -- Reservation expires after 10 minutes
    completed_at TIMESTAMP,
    
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);

COMMENT ON TABLE stock_reservations IS 'Temporary stock holds during checkout to prevent overselling';

-- ============================================
-- 6. VAT RECORDS TABLE
-- Ghana Revenue Authority compliance
-- ============================================
CREATE TABLE IF NOT EXISTS vat_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order Reference
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    order_number VARCHAR(20) NOT NULL,
    
    -- VAT Calculation
    subtotal DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 4) DEFAULT 0.1750, -- 17.5%
    vat_amount DECIMAL(10, 2) NOT NULL,
    total_with_vat DECIMAL(10, 2) NOT NULL,
    
    -- GRA Reference
    gra_filing_period VARCHAR(7), -- e.g., '2024-01' for January 2024
    filed_with_gra BOOLEAN DEFAULT FALSE,
    filed_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_order_id (order_id),
    INDEX idx_order_number (order_number),
    INDEX idx_filing_period (gra_filing_period),
    INDEX idx_filed_status (filed_with_gra)
);

COMMENT ON TABLE vat_records IS 'VAT records for Ghana Revenue Authority reporting and compliance';

-- ============================================
-- 7. SECURITY AUDIT LOG
-- Track security-relevant events
-- ============================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Information
    event_type VARCHAR(100) NOT NULL, -- 'login_failed', 'payment_fraud', 'rate_limit_exceeded', etc.
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
    description TEXT,
    
    -- User Information
    user_id UUID,
    user_email VARCHAR(255),
    
    -- Request Details
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_path VARCHAR(255),
    
    -- Additional Data
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
);

COMMENT ON TABLE security_audit_log IS 'Comprehensive security event logging for monitoring and compliance';

-- ============================================
-- ALTER EXISTING TABLES
-- ============================================

-- Add anonymization support to customer_profiles
ALTER TABLE customer_profiles 
    ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to clean expired stock reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS void AS $$
BEGIN
    -- Mark expired reservations
    UPDATE stock_reservations 
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at < NOW();
    
    -- Return stock to products
    UPDATE products p
    SET stock_quantity = stock_quantity + r.quantity
    FROM stock_reservations r
    WHERE r.product_id = p.id 
    AND r.status = 'expired'
    AND r.completed_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR(255),
    p_identifier_type VARCHAR(50),
    p_action VARCHAR(100),
    p_window_size INTEGER DEFAULT 60,
    p_max_requests INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_is_blocked BOOLEAN;
    v_blocked_until TIMESTAMP;
BEGIN
    -- Check if currently blocked
    SELECT is_blocked, blocked_until
    INTO v_is_blocked, v_blocked_until
    FROM rate_limits
    WHERE identifier = p_identifier 
    AND action = p_action;
    
    -- If blocked and block period not expired
    IF v_is_blocked AND v_blocked_until > NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update rate limit record
    INSERT INTO rate_limits (identifier, identifier_type, action, window_size, max_requests)
    VALUES (p_identifier, p_identifier_type, p_action, p_window_size, p_max_requests)
    ON CONFLICT (identifier, action) DO UPDATE
    SET 
        request_count = CASE 
            WHEN rate_limits.first_request_at < NOW() - (p_window_size || ' seconds')::INTERVAL 
            THEN 1
            ELSE rate_limits.request_count + 1
        END,
        first_request_at = CASE
            WHEN rate_limits.first_request_at < NOW() - (p_window_size || ' seconds')::INTERVAL
            THEN NOW()
            ELSE rate_limits.first_request_at
        END,
        last_request_at = NOW(),
        is_blocked = CASE
            WHEN rate_limits.request_count + 1 > p_max_requests
            THEN TRUE
            ELSE FALSE
        END,
        blocked_until = CASE
            WHEN rate_limits.request_count + 1 > p_max_requests
            THEN NOW() + (p_window_size || ' seconds')::INTERVAL
            ELSE NULL
        END;
    
    -- Check if limit exceeded
    SELECT request_count INTO v_current_count
    FROM rate_limits
    WHERE identifier = p_identifier AND action = p_action;
    
    RETURN v_current_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEDULED JOBS (Configure in Supabase)
-- ============================================

-- Schedule cleanup_expired_reservations to run every 5 minutes
-- pg_cron configuration:
-- SELECT cron.schedule('cleanup-reservations', '*/5 * * * *', 'SELECT cleanup_expired_reservations()');

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_deletion_requests
CREATE POLICY "Users can view own deletion requests"
    ON account_deletion_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deletion requests"
    ON account_deletion_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for data_export_logs
CREATE POLICY "Users can view own export logs"
    ON data_export_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all security logs
CREATE POLICY "Admins can view security logs"
    ON security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator')
            AND is_active = TRUE
        )
    );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_date ON orders(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_products_stock_low ON products(stock_quantity) WHERE stock_quantity < 10;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN payment_verifications.paystack_response IS 'Full Paystack API response for audit purposes';
COMMENT ON COLUMN rate_limits.window_size IS 'Time window in seconds for rate limiting';
COMMENT ON COLUMN stock_reservations.expires_at IS 'Reservation expires after 10 minutes to prevent stock lockup';
COMMENT ON COLUMN vat_records.vat_rate IS 'Ghana VAT rate (17.5% as of 2024)';
