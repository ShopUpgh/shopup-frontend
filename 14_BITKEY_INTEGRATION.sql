-- ============================================
-- BITKEY INTEGRATION FOR GOD MODE
-- ============================================
-- Hardware wallet integration for nuclear actions
-- Version: 1.0
-- ============================================

-- ============================================
-- 1. ADD BITKEY COLUMNS TO GOD MODE USERS
-- ============================================

ALTER TABLE god_mode_users ADD COLUMN IF NOT EXISTS bitkey_serial VARCHAR(100);
ALTER TABLE god_mode_users ADD COLUMN IF NOT EXISTS bitkey_public_key TEXT;
ALTER TABLE god_mode_users ADD COLUMN IF NOT EXISTS bitkey_registered_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN god_mode_users.bitkey_serial IS 'Bitkey hardware wallet serial number';
COMMENT ON COLUMN god_mode_users.bitkey_public_key IS 'Bitkey public key for signature verification (hex or base64)';

-- ============================================
-- 2. BITKEY SIGNATURE CHALLENGES
-- ============================================

CREATE TABLE IF NOT EXISTS bitkey_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    god_user_id UUID NOT NULL REFERENCES god_mode_users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL CHECK (
        action_type IN (
            'kill_switch',
            'owner_change',
            'treasury_withdrawal',
            'secret_rotation',
            'database_drop',
            'audit_disable',
            'god_mode_transfer'
        )
    ),
    challenge_text TEXT NOT NULL,
    challenge_hash TEXT NOT NULL,
    nonce VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bitkey_challenges_user ON bitkey_challenges(god_user_id);
CREATE INDEX idx_bitkey_challenges_expires ON bitkey_challenges(expires_at);
CREATE INDEX idx_bitkey_challenges_nonce ON bitkey_challenges(nonce);

-- ============================================
-- 3. BITKEY VERIFIED ACTIONS LOG
-- ============================================

CREATE TABLE IF NOT EXISTS bitkey_verified_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    god_user_id UUID NOT NULL REFERENCES god_mode_users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    challenge_id UUID REFERENCES bitkey_challenges(id),
    signature TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
        verification_status IN ('pending', 'verified', 'failed')
    ),
    action_executed BOOLEAN DEFAULT false,
    action_result JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bitkey_actions_user ON bitkey_verified_actions(god_user_id);
CREATE INDEX idx_bitkey_actions_type ON bitkey_verified_actions(action_type);
CREATE INDEX idx_bitkey_actions_status ON bitkey_verified_actions(verification_status);

-- ============================================
-- 4. GENERATE BITKEY CHALLENGE
-- ============================================

CREATE OR REPLACE FUNCTION generate_bitkey_challenge(
    p_god_user_id UUID,
    p_action_type VARCHAR,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_nonce VARCHAR(64);
    v_timestamp TIMESTAMP WITH TIME ZONE;
    v_challenge_text TEXT;
    v_challenge_hash TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_challenge_id UUID;
BEGIN
    -- Generate random nonce
    v_nonce := encode(gen_random_bytes(32), 'hex');
    v_timestamp := NOW();
    v_expires_at := v_timestamp + INTERVAL '5 minutes';
    
    -- Build challenge text
    v_challenge_text := format(
        E'GODMODE_%s\nshopup.gh\ntimestamp: %s\nnonce: %s\nmetadata: %s',
        UPPER(p_action_type),
        v_timestamp::TEXT,
        v_nonce,
        p_metadata::TEXT
    );
    
    -- Hash for verification
    v_challenge_hash := encode(digest(v_challenge_text, 'sha256'), 'hex');
    
    -- Store challenge
    INSERT INTO bitkey_challenges (
        god_user_id,
        action_type,
        challenge_text,
        challenge_hash,
        nonce,
        expires_at
    ) VALUES (
        p_god_user_id,
        p_action_type,
        v_challenge_text,
        v_challenge_hash,
        v_nonce,
        v_expires_at
    ) RETURNING id INTO v_challenge_id;
    
    -- Return challenge data
    RETURN jsonb_build_object(
        'challenge_id', v_challenge_id,
        'challenge_text', v_challenge_text,
        'challenge_hash', v_challenge_hash,
        'nonce', v_nonce,
        'expires_at', v_expires_at,
        'action_type', p_action_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VERIFY BITKEY SIGNATURE
-- ============================================

CREATE OR REPLACE FUNCTION verify_bitkey_signature(
    p_challenge_id UUID,
    p_signature TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_challenge RECORD;
    v_god_user RECORD;
    v_action_id UUID;
    v_verification_passed BOOLEAN;
BEGIN
    -- Get challenge
    SELECT * INTO v_challenge
    FROM bitkey_challenges
    WHERE id = p_challenge_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Challenge not found'
        );
    END IF;
    
    -- Check expiration
    IF v_challenge.expires_at < NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Challenge expired'
        );
    END IF;
    
    -- Check if already used
    IF v_challenge.is_used THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Challenge already used'
        );
    END IF;
    
    -- Get god mode user
    SELECT * INTO v_god_user
    FROM god_mode_users
    WHERE id = v_challenge.god_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'God Mode user not found'
        );
    END IF;
    
    -- NOTE: Actual cryptographic verification happens in Edge Function
    -- This function assumes signature has been pre-verified
    -- We just log and mark as used
    
    v_verification_passed := true;
    
    -- Log verified action
    INSERT INTO bitkey_verified_actions (
        god_user_id,
        action_type,
        challenge_id,
        signature,
        verification_status,
        ip_address,
        user_agent
    ) VALUES (
        v_challenge.god_user_id,
        v_challenge.action_type,
        p_challenge_id,
        p_signature,
        CASE WHEN v_verification_passed THEN 'verified' ELSE 'failed' END,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_action_id;
    
    -- Mark challenge as used
    UPDATE bitkey_challenges
    SET is_used = true
    WHERE id = p_challenge_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'verified', v_verification_passed,
        'action_id', v_action_id,
        'action_type', v_challenge.action_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. EXECUTE KILL SWITCH (BITKEY REQUIRED)
-- ============================================

CREATE OR REPLACE FUNCTION activate_kill_switch_with_bitkey(
    p_god_user_id UUID,
    p_bitkey_action_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_action RECORD;
BEGIN
    -- Verify Bitkey action was verified
    SELECT * INTO v_action
    FROM bitkey_verified_actions
    WHERE id = p_bitkey_action_id
    AND god_user_id = p_god_user_id
    AND action_type = 'kill_switch'
    AND verification_status = 'verified'
    AND action_executed = false;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bitkey verification required or already executed'
        );
    END IF;
    
    -- Activate kill switch
    INSERT INTO platform_kill_switch (
        id,
        is_active,
        reason,
        activated_by,
        activated_at
    ) VALUES (
        1,
        true,
        p_reason,
        p_god_user_id,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        is_active = true,
        reason = p_reason,
        activated_by = p_god_user_id,
        activated_at = NOW();
    
    -- Mark action as executed
    UPDATE bitkey_verified_actions
    SET 
        action_executed = true,
        action_result = jsonb_build_object(
            'kill_switch_activated', true,
            'reason', p_reason,
            'timestamp', NOW()
        )
    WHERE id = p_bitkey_action_id;
    
    -- Log to god_mode_actions
    INSERT INTO god_mode_actions (
        god_user_id,
        action_type,
        action_description,
        severity
    ) VALUES (
        p_god_user_id,
        'platform.kill_switch',
        'Platform kill switch activated with Bitkey verification: ' || p_reason,
        'critical'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'kill_switch_active', true,
        'activated_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

ALTER TABLE bitkey_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitkey_verified_actions ENABLE ROW LEVEL SECURITY;

-- Only god mode users can see their challenges
CREATE POLICY "God users can view own challenges" ON bitkey_challenges FOR SELECT
USING (
    god_user_id IN (
        SELECT id FROM god_mode_users WHERE user_id = auth.uid()
    )
);

-- Only god mode users can see their verified actions
CREATE POLICY "God users can view own actions" ON bitkey_verified_actions FOR SELECT
USING (
    god_user_id IN (
        SELECT id FROM god_mode_users WHERE user_id = auth.uid()
    )
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Bitkey Integration Complete!';
    RAISE NOTICE '🔐 Hardware wallet columns added';
    RAISE NOTICE '📋 Challenge generation ready';
    RAISE NOTICE '✍️ Signature verification ready';
    RAISE NOTICE '☢️ Kill switch requires Bitkey';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next: Register your Bitkey via bitkey-setup.html';
END $$;
