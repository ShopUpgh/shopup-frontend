-- ============================================
-- ShopUp Ghana - Security Rate Limiting Schema
-- ============================================
-- This schema implements:
-- 1. Failed login attempt tracking
-- 2. Account lockout mechanism
-- 3. Rate limiting for authentication
-- 4. Audit logging
-- ============================================

-- Table: Failed Login Attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failure_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_timestamp ON failed_login_attempts(attempted_at);

-- Table: Account Lockouts
CREATE TABLE IF NOT EXISTS account_lockouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
    lockout_reason VARCHAR(255) DEFAULT 'Too many failed login attempts',
    failed_attempts_count INTEGER NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlocked_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_lockout_user ON account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_lockout_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_lockout_until ON account_lockouts(locked_until);

-- Table: Payment Audit Log
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(255) NOT NULL,
    order_id UUID,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_transaction_ref ON payment_audit_log(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_audit_order_id ON payment_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON payment_audit_log(created_at);

-- Table: Webhook Events Log
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    reference VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_reference ON webhook_events(reference);
CREATE INDEX IF NOT EXISTS idx_webhook_processed_at ON webhook_events(processed_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Record Failed Login Attempt
CREATE OR REPLACE FUNCTION record_failed_login(
    p_email VARCHAR(255),
    p_ip_address INET,
    p_user_agent TEXT,
    p_failure_reason VARCHAR(100)
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_attempt_count INTEGER;
    v_user_id UUID;
    v_lockout_duration INTERVAL := '15 minutes';
BEGIN
    -- Record the failed attempt
    INSERT INTO failed_login_attempts (email, ip_address, user_agent, failure_reason)
    VALUES (p_email, p_ip_address, p_user_agent, p_failure_reason);
    
    -- Count recent failed attempts (last 15 minutes)
    SELECT COUNT(*) INTO v_attempt_count
    FROM failed_login_attempts
    WHERE email = p_email
    AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    -- If threshold or more failed attempts, lock the account
    -- Note: Threshold can be customized by modifying this constant
    -- For production, consider making this a configuration parameter
    IF v_attempt_count >= 5 THEN
        -- Get user_id if user exists
        SELECT id INTO v_user_id
        FROM auth.users
        WHERE email = p_email;
        
        -- Create lockout record
        INSERT INTO account_lockouts (
            user_id,
            email,
            locked_until,
            failed_attempts_count
        )
        VALUES (
            v_user_id,
            p_email,
            NOW() + v_lockout_duration,
            v_attempt_count
        )
        ON CONFLICT (email)
        DO UPDATE SET
            locked_until = NOW() + v_lockout_duration,
            failed_attempts_count = v_attempt_count,
            unlocked_at = NULL;
    END IF;
    
    RETURN v_attempt_count;
END;
$$;

-- Function: Check if Account is Locked
CREATE OR REPLACE FUNCTION is_account_locked(p_email VARCHAR(255))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_locked BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM account_lockouts
        WHERE email = p_email
        AND locked_until > NOW()
        AND unlocked_at IS NULL
    ) INTO v_locked;
    
    RETURN v_locked;
END;
$$;

-- Function: Get Account Lockout Info
CREATE OR REPLACE FUNCTION get_lockout_info(p_email VARCHAR(255))
RETURNS TABLE (
    is_locked BOOLEAN,
    locked_until TIMESTAMP WITH TIME ZONE,
    minutes_remaining INTEGER,
    failed_attempts INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as is_locked,
        al.locked_until,
        CAST(EXTRACT(EPOCH FROM (al.locked_until - NOW())) / 60 AS INTEGER) AS minutes_remaining,
        al.failed_attempts_count
    FROM account_lockouts al
    WHERE al.email = p_email
    AND al.locked_until > NOW()
    AND al.unlocked_at IS NULL
    ORDER BY al.locked_at DESC
    LIMIT 1;
    
    -- If no lockout found, return default values
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT FALSE, NULL::TIMESTAMP WITH TIME ZONE, 0, 0;
    END IF;
END;
$$;

-- Function: Clear Failed Login Attempts (on successful login)
CREATE OR REPLACE FUNCTION clear_failed_login_attempts(p_email VARCHAR(255))
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete old failed attempts
    DELETE FROM failed_login_attempts
    WHERE email = p_email;
    
    -- Mark any active lockouts as unlocked
    UPDATE account_lockouts
    SET unlocked_at = NOW()
    WHERE email = p_email
    AND unlocked_at IS NULL;
END;
$$;

-- Function: Unlock Account Manually (for admin use)
CREATE OR REPLACE FUNCTION unlock_account(
    p_email VARCHAR(255),
    p_unlocked_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE account_lockouts
    SET 
        unlocked_at = NOW(),
        unlocked_by = p_unlocked_by
    WHERE email = p_email
    AND unlocked_at IS NULL;
    
    -- Clear failed attempts
    DELETE FROM failed_login_attempts
    WHERE email = p_email;
    
    RETURN FOUND;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only access" ON failed_login_attempts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access lockouts" ON account_lockouts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access audit" ON payment_audit_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access webhooks" ON webhook_events
    FOR ALL USING (auth.role() = 'service_role');
