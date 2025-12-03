-- ============================================
-- SELLER VERIFICATION SCHEMA (KYC)
-- ============================================
-- Ghana Card & Mobile Money verification
-- Selfie verification for fraud prevention
-- Version: 1.0
-- Date: November 17, 2025
-- ============================================

-- ============================================
-- 1. SELLER VERIFICATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS seller_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Seller Info
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ghana Card Details
    ghana_card_number VARCHAR(20) UNIQUE NOT NULL,
    ghana_card_name VARCHAR(255) NOT NULL,
    ghana_card_dob DATE NOT NULL,
    ghana_card_front_url TEXT,
    ghana_card_back_url TEXT,
    ghana_card_expiry DATE,
    
    -- Mobile Money Details
    momo_provider VARCHAR(50) NOT NULL CHECK (momo_provider IN ('MTN', 'Vodafone', 'AirtelTigo')),
    momo_number VARCHAR(15) NOT NULL,
    momo_account_name VARCHAR(255) NOT NULL,
    
    -- Selfie Verification
    selfie_url TEXT NOT NULL,
    selfie_with_card_url TEXT,
    
    -- Business Details (Optional)
    business_name VARCHAR(255),
    business_registration_number VARCHAR(50),
    business_type VARCHAR(50) CHECK (business_type IN ('individual', 'sole_proprietorship', 'partnership', 'limited_company')),
    
    -- Verification Status
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (
        verification_status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')
    ),
    
    -- Name Matching
    names_match BOOLEAN DEFAULT false,
    name_match_confidence DECIMAL(5,2), -- 0-100 percentage
    
    -- AI/Manual Review
    auto_verified BOOLEAN DEFAULT false,
    manually_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Rejection/Notes
    rejection_reason TEXT,
    admin_notes TEXT,
    
    -- Verification Dates
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    
    -- Re-verification
    requires_reverification BOOLEAN DEFAULT false,
    reverification_reason TEXT,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(seller_id)
);

-- Indexes
CREATE INDEX idx_seller_verifications_seller_id ON seller_verifications(seller_id);
CREATE INDEX idx_seller_verifications_status ON seller_verifications(verification_status);
CREATE INDEX idx_seller_verifications_ghana_card ON seller_verifications(ghana_card_number);
CREATE INDEX idx_seller_verifications_momo ON seller_verifications(momo_number);
CREATE INDEX idx_seller_verifications_submitted ON seller_verifications(submitted_at DESC);

-- ============================================
-- 2. VERIFICATION ATTEMPTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS verification_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_id UUID REFERENCES seller_verifications(id) ON DELETE SET NULL,
    
    -- Attempt Details
    attempt_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    
    -- What was submitted
    ghana_card_submitted BOOLEAN DEFAULT false,
    momo_submitted BOOLEAN DEFAULT false,
    selfie_submitted BOOLEAN DEFAULT false,
    
    -- Validation Results
    ghana_card_valid BOOLEAN,
    momo_valid BOOLEAN,
    selfie_valid BOOLEAN,
    names_matched BOOLEAN,
    
    -- Failure Reasons
    failure_reasons JSONB,
    
    -- Timestamps
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_attempts_seller ON verification_attempts(seller_id);
CREATE INDEX idx_verification_attempts_date ON verification_attempts(attempted_at DESC);

-- ============================================
-- 3. VERIFICATION DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID NOT NULL REFERENCES seller_verifications(id) ON DELETE CASCADE,
    
    -- Document Details
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN ('ghana_card_front', 'ghana_card_back', 'selfie', 'selfie_with_card', 'business_registration')
    ),
    document_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- AI Analysis (if applicable)
    face_detected BOOLEAN,
    card_detected BOOLEAN,
    text_extracted JSONB,
    confidence_score DECIMAL(5,2),
    
    -- Status
    is_valid BOOLEAN DEFAULT true,
    validation_notes TEXT,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_documents_verification ON verification_documents(verification_id);
CREATE INDEX idx_verification_documents_type ON verification_documents(document_type);

-- ============================================
-- 4. GHANA CARD VALIDATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS ghana_card_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES seller_verifications(id) ON DELETE SET NULL,
    
    -- Card Details
    ghana_card_number VARCHAR(20) NOT NULL,
    
    -- Validation Method
    validation_method VARCHAR(50) CHECK (validation_method IN ('manual', 'api', 'ocr')),
    
    -- Results
    is_valid BOOLEAN NOT NULL,
    validation_response JSONB,
    
    -- API Response (if using Ghana Card API)
    api_provider VARCHAR(100),
    api_response_code VARCHAR(50),
    api_message TEXT,
    
    -- Timestamps
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ghana_card_validations_card ON ghana_card_validations(ghana_card_number);
CREATE INDEX idx_ghana_card_validations_date ON ghana_card_validations(validated_at DESC);

-- ============================================
-- 5. MOBILE MONEY VERIFICATION LOG
-- ============================================

CREATE TABLE IF NOT EXISTS momo_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES seller_verifications(id) ON DELETE SET NULL,
    
    -- MoMo Details
    momo_provider VARCHAR(50) NOT NULL,
    momo_number VARCHAR(15) NOT NULL,
    
    -- Verification Method
    verification_method VARCHAR(50) CHECK (verification_method IN ('manual', 'api', 'micro_payment')),
    
    -- Name Verification
    registered_name VARCHAR(255),
    names_match BOOLEAN,
    match_confidence DECIMAL(5,2),
    
    -- Micro Payment (if used)
    micro_payment_amount DECIMAL(10,2),
    micro_payment_code VARCHAR(10),
    micro_payment_verified BOOLEAN,
    
    -- Results
    is_verified BOOLEAN NOT NULL,
    verification_response JSONB,
    
    -- Timestamps
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_momo_verifications_number ON momo_verifications(momo_number);
CREATE INDEX idx_momo_verifications_date ON momo_verifications(verified_at DESC);

-- ============================================
-- 6. FRAUD ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS fraud_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Related Entities
    seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verification_id UUID REFERENCES seller_verifications(id) ON DELETE SET NULL,
    
    -- Alert Details
    alert_type VARCHAR(50) NOT NULL CHECK (
        alert_type IN ('duplicate_ghana_card', 'duplicate_momo', 'name_mismatch', 'fake_document', 'suspicious_activity', 'multiple_accounts')
    ),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Description
    description TEXT NOT NULL,
    evidence JSONB,
    
    -- Resolution
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Actions Taken
    account_suspended BOOLEAN DEFAULT false,
    verification_rejected BOOLEAN DEFAULT false,
    
    -- Timestamps
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fraud_alerts_seller ON fraud_alerts(seller_id);
CREATE INDEX idx_fraud_alerts_type ON fraud_alerts(alert_type);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if name matches
CREATE OR REPLACE FUNCTION check_name_match(
    name1 VARCHAR,
    name2 VARCHAR
)
RETURNS TABLE(matches BOOLEAN, confidence DECIMAL) AS $$
DECLARE
    similarity_score DECIMAL;
BEGIN
    -- Simple similarity check (in production, use more sophisticated matching)
    SELECT similarity(LOWER(name1), LOWER(name2)) INTO similarity_score;
    
    RETURN QUERY SELECT 
        similarity_score > 0.7,
        similarity_score * 100;
END;
$$ LANGUAGE plpgsql;

-- Function to detect duplicate Ghana Cards
CREATE OR REPLACE FUNCTION detect_duplicate_ghana_card(
    p_ghana_card_number VARCHAR,
    p_seller_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM seller_verifications
        WHERE ghana_card_number = p_ghana_card_number
        AND seller_id != p_seller_id
        AND verification_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to detect duplicate MoMo
CREATE OR REPLACE FUNCTION detect_duplicate_momo(
    p_momo_number VARCHAR,
    p_seller_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM seller_verifications
        WHERE momo_number = p_momo_number
        AND seller_id != p_seller_id
        AND verification_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create fraud alert
CREATE OR REPLACE FUNCTION create_fraud_alert(
    p_seller_id UUID,
    p_verification_id UUID,
    p_alert_type VARCHAR,
    p_description TEXT,
    p_severity VARCHAR DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
BEGIN
    INSERT INTO fraud_alerts (
        seller_id,
        verification_id,
        alert_type,
        description,
        severity
    ) VALUES (
        p_seller_id,
        p_verification_id,
        p_alert_type,
        p_description,
        p_severity
    ) RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to check for duplicate Ghana Card
CREATE OR REPLACE FUNCTION check_duplicate_ghana_card()
RETURNS TRIGGER AS $$
BEGIN
    IF detect_duplicate_ghana_card(NEW.ghana_card_number, NEW.seller_id) THEN
        PERFORM create_fraud_alert(
            NEW.seller_id,
            NEW.id,
            'duplicate_ghana_card',
            'Ghana Card number already used by another verified seller',
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_duplicate_ghana_card ON seller_verifications;
CREATE TRIGGER trigger_check_duplicate_ghana_card
    AFTER INSERT ON seller_verifications
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_ghana_card();

-- Trigger to check for duplicate MoMo
CREATE OR REPLACE FUNCTION check_duplicate_momo()
RETURNS TRIGGER AS $$
BEGIN
    IF detect_duplicate_momo(NEW.momo_number, NEW.seller_id) THEN
        PERFORM create_fraud_alert(
            NEW.seller_id,
            NEW.id,
            'duplicate_momo',
            'Mobile Money number already used by another verified seller',
            'high'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_duplicate_momo ON seller_verifications;
CREATE TRIGGER trigger_check_duplicate_momo
    AFTER INSERT ON seller_verifications
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_momo();

-- Trigger to check name matching
CREATE OR REPLACE FUNCTION check_names_matching()
RETURNS TRIGGER AS $$
DECLARE
    v_match_result RECORD;
BEGIN
    -- Check if Ghana Card name matches MoMo name
    SELECT * FROM check_name_match(NEW.ghana_card_name, NEW.momo_account_name)
    INTO v_match_result;
    
    NEW.names_match := v_match_result.matches;
    NEW.name_match_confidence := v_match_result.confidence;
    
    -- Create alert if names don't match
    IF NOT v_match_result.matches THEN
        PERFORM create_fraud_alert(
            NEW.seller_id,
            NEW.id,
            'name_mismatch',
            format('Ghana Card name (%s) does not match MoMo name (%s). Confidence: %s%%', 
                NEW.ghana_card_name, NEW.momo_account_name, v_match_result.confidence),
            'medium'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_names_matching ON seller_verifications;
CREATE TRIGGER trigger_check_names_matching
    BEFORE INSERT OR UPDATE ON seller_verifications
    FOR EACH ROW
    EXECUTE FUNCTION check_names_matching();

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_seller_verifications_updated_at ON seller_verifications;
CREATE TRIGGER update_seller_verifications_updated_at
    BEFORE UPDATE ON seller_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fraud_alerts_updated_at ON fraud_alerts;
CREATE TRIGGER update_fraud_alerts_updated_at
    BEFORE UPDATE ON fraud_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE seller_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own verification
CREATE POLICY "Sellers can view own verification"
    ON seller_verifications FOR SELECT
    USING (seller_id = auth.uid());

-- Sellers can insert their own verification
CREATE POLICY "Sellers can create own verification"
    ON seller_verifications FOR INSERT
    WITH CHECK (seller_id = auth.uid());

-- Sellers can update their pending verification
CREATE POLICY "Sellers can update pending verification"
    ON seller_verifications FOR UPDATE
    USING (seller_id = auth.uid() AND verification_status = 'pending');

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
    ON seller_verifications FOR SELECT
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Admins can update verifications
CREATE POLICY "Admins can update verifications"
    ON seller_verifications FOR UPDATE
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Fraud alerts - admins only
CREATE POLICY "Admins can view fraud alerts"
    ON fraud_alerts FOR SELECT
    USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage fraud alerts"
    ON fraud_alerts FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE seller_verifications IS 'KYC verification for sellers using Ghana Card and Mobile Money';
COMMENT ON TABLE verification_attempts IS 'Track all verification attempts for audit trail';
COMMENT ON TABLE fraud_alerts IS 'Fraud detection and alerts system';
COMMENT ON FUNCTION detect_duplicate_ghana_card IS 'Detect if Ghana Card is already used';
COMMENT ON FUNCTION detect_duplicate_momo IS 'Detect if Mobile Money number is already used';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Seller Verification (KYC) Schema created successfully!';
    RAISE NOTICE '🔐 Features: Ghana Card, Mobile Money, Selfie verification';
    RAISE NOTICE '🚨 Fraud detection: Duplicate detection, name matching';
    RAISE NOTICE '📋 Tables: seller_verifications, verification_attempts, fraud_alerts';
    RAISE NOTICE '🔍 Triggers: Auto fraud detection, name matching';
END $$;
