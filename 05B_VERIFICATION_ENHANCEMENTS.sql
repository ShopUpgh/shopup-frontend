-- ============================================
-- ENHANCED SELLER VERIFICATION SCHEMA V2
-- ============================================
-- Added: Business registration, Verified badge
-- Enhanced Ghana Card formatting
-- Version: 2.0
-- ============================================

-- Update seller_verifications table
ALTER TABLE seller_verifications ADD COLUMN IF NOT EXISTS ghana_card_photo_url TEXT;
ALTER TABLE seller_verifications ADD COLUMN IF NOT EXISTS business_registration_certificate_url TEXT;
ALTER TABLE seller_verifications ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN DEFAULT false;
ALTER TABLE seller_verifications ADD COLUMN IF NOT EXISTS badge_granted_at TIMESTAMP WITH TIME ZONE;

-- Add index for verified sellers
CREATE INDEX IF NOT EXISTS idx_seller_verifications_verified_badge ON seller_verifications(verified_badge) WHERE verified_badge = true;

-- Function to format Ghana Card number with dashes
CREATE OR REPLACE FUNCTION format_ghana_card_number(card_number VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    -- Remove any existing dashes
    card_number := REPLACE(card_number, '-', '');
    
    -- Add dashes in correct format: GHA-XXXXXXXXX-X
    IF LENGTH(card_number) = 13 AND card_number LIKE 'GHA%' THEN
        RETURN 'GHA-' || SUBSTRING(card_number, 4, 9) || '-' || SUBSTRING(card_number, 13, 1);
    END IF;
    
    RETURN card_number;
END;
$$ LANGUAGE plpgsql;

-- Function to grant verified badge
CREATE OR REPLACE FUNCTION grant_verified_badge(p_verification_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE seller_verifications
    SET 
        verified_badge = true,
        badge_granted_at = NOW()
    WHERE id = p_verification_id
    AND verification_status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-grant badge on approval
CREATE OR REPLACE FUNCTION auto_grant_verified_badge()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verification_status = 'approved' AND OLD.verification_status != 'approved' THEN
        NEW.verified_badge := true;
        NEW.badge_granted_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_grant_badge ON seller_verifications;
CREATE TRIGGER trigger_auto_grant_badge
    BEFORE UPDATE ON seller_verifications
    FOR EACH ROW
    EXECUTE FUNCTION auto_grant_verified_badge();

-- Comments
COMMENT ON COLUMN seller_verifications.ghana_card_photo_url IS 'Optional photo holding Ghana Card';
COMMENT ON COLUMN seller_verifications.business_registration_certificate_url IS 'Optional business registration document';
COMMENT ON COLUMN seller_verifications.verified_badge IS 'Blue checkmark for verified sellers';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Enhanced Verification Schema V2 updated!';
    RAISE NOTICE '🏅 Verified badge system added';
    RAISE NOTICE '📄 Business registration support added';
    RAISE NOTICE '📸 Optional Ghana Card photo added';
END $$;
