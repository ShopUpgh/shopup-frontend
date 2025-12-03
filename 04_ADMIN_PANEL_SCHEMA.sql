-- ============================================
-- ADMIN PANEL SCHEMA
-- ============================================
-- Admin roles, permissions, and audit logs
-- Version: 1.0
-- Date: November 17, 2025
-- ============================================

-- ============================================
-- 1. USER ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'moderator', 'seller', 'customer')),
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);

-- ============================================
-- 2. ADMIN PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role, permission)
);

CREATE INDEX idx_admin_permissions_role ON admin_permissions(role);

-- Insert default permissions
INSERT INTO admin_permissions (role, permission, description) VALUES
    -- Admin permissions
    ('admin', 'users.view', 'View all users'),
    ('admin', 'users.edit', 'Edit user details'),
    ('admin', 'users.delete', 'Delete users'),
    ('admin', 'users.ban', 'Ban/suspend users'),
    ('admin', 'orders.view', 'View all orders'),
    ('admin', 'orders.edit', 'Edit orders'),
    ('admin', 'orders.cancel', 'Cancel orders'),
    ('admin', 'products.view', 'View all products'),
    ('admin', 'products.edit', 'Edit any product'),
    ('admin', 'products.delete', 'Delete any product'),
    ('admin', 'analytics.view', 'View platform analytics'),
    ('admin', 'settings.edit', 'Edit platform settings'),
    ('admin', 'roles.manage', 'Manage user roles'),
    
    -- Moderator permissions
    ('moderator', 'users.view', 'View all users'),
    ('moderator', 'users.ban', 'Ban/suspend users'),
    ('moderator', 'orders.view', 'View all orders'),
    ('moderator', 'products.view', 'View all products'),
    ('moderator', 'products.delete', 'Delete inappropriate products'),
    ('moderator', 'analytics.view', 'View platform analytics')
ON CONFLICT (role, permission) DO NOTHING;

-- ============================================
-- 3. AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who performed the action
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- What action was performed
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    
    -- Details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- 4. PLATFORM SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);

-- Insert default settings
INSERT INTO platform_settings (setting_key, setting_value, setting_type, description) VALUES
    ('platform_name', 'ShopUp', 'string', 'Platform name'),
    ('platform_email', 'support@shopup.gh', 'string', 'Platform support email'),
    ('commission_rate', '10', 'number', 'Platform commission percentage'),
    ('min_order_amount', '10', 'number', 'Minimum order amount in GHS'),
    ('max_order_amount', '10000', 'number', 'Maximum order amount in GHS'),
    ('delivery_fee', '10', 'number', 'Standard delivery fee in GHS'),
    ('tax_rate', '15', 'number', 'Tax rate percentage'),
    ('enable_registration', 'true', 'boolean', 'Allow new user registration'),
    ('maintenance_mode', 'false', 'boolean', 'Platform maintenance mode'),
    ('featured_categories', '["Electronics", "Fashion", "Home"]', 'json', 'Featured categories')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 5. USER BANS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Ban details
    reason TEXT NOT NULL,
    ban_type VARCHAR(50) DEFAULT 'permanent' CHECK (ban_type IN ('temporary', 'permanent')),
    
    -- Who banned
    banned_by UUID REFERENCES auth.users(id),
    
    -- Duration
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    lifted_at TIMESTAMP WITH TIME ZONE,
    lifted_by UUID REFERENCES auth.users(id),
    lift_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_bans_user_id ON user_bans(user_id);
CREATE INDEX idx_user_bans_is_active ON user_bans(is_active);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user has specific role
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user_id
        AND role = p_role
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_permission VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN admin_permissions ap ON ur.role = ap.role
        WHERE ur.user_id = p_user_id
        AND ap.permission = p_permission
        AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_bans
        WHERE user_id = p_user_id
        AND is_active = true
        AND (ban_type = 'permanent' OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_user_email VARCHAR;
    v_user_role VARCHAR;
BEGIN
    -- Get user details
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_user_id AND is_active = true LIMIT 1;
    
    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        description,
        old_values,
        new_values
    ) VALUES (
        p_user_id,
        v_user_email,
        v_user_role,
        p_action,
        p_resource_type,
        p_resource_id,
        p_description,
        p_old_values,
        p_new_values
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_bans_updated_at ON user_bans;
CREATE TRIGGER update_user_bans_updated_at
    BEFORE UPDATE ON user_bans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
CREATE POLICY "Admins can view all roles"
    ON user_roles FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
    ON user_roles FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- Admins and moderators can view audit logs
CREATE POLICY "Admins and moderators can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        has_role(auth.uid(), 'admin') OR 
        has_role(auth.uid(), 'moderator')
    );

-- Only admins can view settings
CREATE POLICY "Admins can view settings"
    ON platform_settings FOR SELECT
    USING (has_role(auth.uid(), 'admin'));

-- Only admins can edit settings
CREATE POLICY "Admins can edit settings"
    ON platform_settings FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- VIEWS
-- ============================================

-- Active admins view
CREATE OR REPLACE VIEW active_admins AS
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.granted_at,
    ur.granted_by
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'moderator')
AND ur.is_active = true
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_roles IS 'User roles and permissions';
COMMENT ON TABLE admin_permissions IS 'Permission definitions for each role';
COMMENT ON TABLE audit_logs IS 'Audit trail of all admin actions';
COMMENT ON TABLE platform_settings IS 'Platform configuration settings';
COMMENT ON TABLE user_bans IS 'User bans and suspensions';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin panel schema created successfully!';
    RAISE NOTICE '👥 Tables: user_roles, admin_permissions, audit_logs, platform_settings, user_bans';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '📋 Default permissions and settings inserted';
    RAISE NOTICE '⚡ Helper functions created';
END $$;
