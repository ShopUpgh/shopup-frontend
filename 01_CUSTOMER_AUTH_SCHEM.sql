-- ============================================
-- SHOPUP CUSTOMER AUTHENTICATION SCHEMA
-- ============================================
-- Purpose: Customer accounts, profiles, and addresses
-- Version: 1.0
-- Date: November 14, 2025
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USER ROLES TABLE
-- ============================================
-- Track different user types in the system

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'seller', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one role per user (or multiple if needed)
    UNIQUE(user_id, role)
);

-- Index for fast role lookups
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================
-- 2. CUSTOMER PROFILES TABLE
-- ============================================
-- Extended profile information for customers

CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Contact Information
    email VARCHAR(255) NOT NULL,
    phone_verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'GHS',
    receive_marketing_emails BOOLEAN DEFAULT true,
    receive_order_updates BOOLEAN DEFAULT true,
    receive_whatsapp_updates BOOLEAN DEFAULT false,
    
    -- Profile Status
    is_active BOOLEAN DEFAULT true,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
    
    -- Stats
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    loyalty_points INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for customer profiles
CREATE INDEX idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX idx_customer_profiles_phone ON customer_profiles(phone);
CREATE INDEX idx_customer_profiles_status ON customer_profiles(account_status);

-- ============================================
-- 3. CUSTOMER ADDRESSES TABLE
-- ============================================
-- Delivery addresses for customers

CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    
    -- Address Type
    address_type VARCHAR(20) DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
    is_default BOOLEAN DEFAULT false,
    
    -- Address Details
    address_label VARCHAR(100), -- e.g., "My Home", "Office"
    full_name VARCHAR(200), -- Recipient name
    phone VARCHAR(20) NOT NULL,
    
    -- Ghana-specific address fields
    street_address TEXT NOT NULL,
    landmark TEXT, -- Important for Ghana: "Near Shoprite", "Behind Total Filling Station"
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL, -- Greater Accra, Ashanti, etc.
    digital_address VARCHAR(50), -- Ghana Post GPS: e.g., "GA-123-4567"
    
    -- Additional Information
    delivery_instructions TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for addresses
CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_is_default ON customer_addresses(is_default);

-- ============================================
-- 4. PASSWORD RESET TOKENS TABLE
-- ============================================
-- For password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- ============================================
-- 5. LOGIN HISTORY TABLE
-- ============================================
-- Track login attempts for security

CREATE TABLE IF NOT EXISTS login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for login history
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_created_at ON login_history(created_at);
CREATE INDEX idx_login_history_success ON login_history(success);

-- ============================================
-- 6. CUSTOMER WISHLIST TABLE
-- ============================================
-- Save favorite products

CREATE TABLE IF NOT EXISTS customer_wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    -- Prevent duplicate entries
    UNIQUE(customer_id, product_id)
);

-- Indexes for wishlist
CREATE INDEX idx_customer_wishlist_customer_id ON customer_wishlist(customer_id);
CREATE INDEX idx_customer_wishlist_product_id ON customer_wishlist(product_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for customer_profiles
DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for customer_addresses
DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Create customer profile after user registration
CREATE OR REPLACE FUNCTION create_customer_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create customer profile
    INSERT INTO customer_profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    
    -- Assign customer role
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_customer_profile();

-- Function: Ensure only one default address per customer
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset other default addresses for this customer
        UPDATE customer_addresses
        SET is_default = false
        WHERE customer_id = NEW.customer_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Maintain single default address
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON customer_addresses;
CREATE TRIGGER ensure_single_default_address_trigger
    BEFORE INSERT OR UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wishlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own role
CREATE POLICY "Users can view own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON customer_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON customer_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can view their own addresses
CREATE POLICY "Users can view own addresses"
    ON customer_addresses FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert their own addresses
CREATE POLICY "Users can insert own addresses"
    ON customer_addresses FOR INSERT
    WITH CHECK (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own addresses
CREATE POLICY "Users can update own addresses"
    ON customer_addresses FOR UPDATE
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own addresses
CREATE POLICY "Users can delete own addresses"
    ON customer_addresses FOR DELETE
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
    ON customer_wishlist FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist"
    ON customer_wishlist FOR ALL
    USING (
        customer_id IN (
            SELECT id FROM customer_profiles WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can view own login history
CREATE POLICY "Users can view own login history"
    ON login_history FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get customer profile by user_id
CREATE OR REPLACE FUNCTION get_customer_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    total_orders INTEGER,
    total_spent DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.user_id,
        cp.first_name,
        cp.last_name,
        cp.email,
        cp.phone,
        cp.total_orders,
        cp.total_spent,
        cp.created_at
    FROM customer_profiles cp
    WHERE cp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get default address for customer
CREATE OR REPLACE FUNCTION get_default_address(p_customer_id UUID)
RETURNS TABLE (
    id UUID,
    street_address TEXT,
    city VARCHAR,
    region VARCHAR,
    phone VARCHAR,
    digital_address VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.street_address,
        ca.city,
        ca.region,
        ca.phone,
        ca.digital_address
    FROM customer_addresses ca
    WHERE ca.customer_id = p_customer_id
    AND ca.is_default = true
    AND ca.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is customer
CREATE OR REPLACE FUNCTION is_customer(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = p_user_id
        AND role = 'customer'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
-- ============================================

-- View: Customer summary
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    cp.id,
    cp.user_id,
    cp.first_name || ' ' || cp.last_name AS full_name,
    cp.email,
    cp.phone,
    cp.total_orders,
    cp.total_spent,
    cp.loyalty_points,
    cp.account_status,
    cp.created_at,
    COUNT(DISTINCT ca.id) AS address_count,
    COUNT(DISTINCT cw.id) AS wishlist_count
FROM customer_profiles cp
LEFT JOIN customer_addresses ca ON cp.id = ca.customer_id AND ca.is_active = true
LEFT JOIN customer_wishlist cw ON cp.id = cw.customer_id
GROUP BY cp.id;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional performance indexes
CREATE INDEX idx_customer_profiles_created_at ON customer_profiles(created_at DESC);
CREATE INDEX idx_customer_profiles_total_spent ON customer_profiles(total_spent DESC);
CREATE INDEX idx_customer_addresses_region ON customer_addresses(region);
CREATE INDEX idx_customer_addresses_city ON customer_addresses(city);

-- ============================================
-- SAMPLE DATA (FOR TESTING)
-- ============================================

-- Note: Actual user registration will be handled by Supabase Auth
-- This is just for reference

/*
-- Example: Register a test customer (do this via Supabase Auth UI)
-- After user signs up via Supabase Auth, the trigger will auto-create profile

-- Example: Add an address for customer
INSERT INTO customer_addresses (
    customer_id,
    address_type,
    is_default,
    full_name,
    phone,
    street_address,
    landmark,
    city,
    region,
    digital_address
) VALUES (
    '[customer_profile_id]',
    'home',
    true,
    'John Doe',
    '+233241234567',
    'House No. 123, Ring Road',
    'Near Shoprite Mall',
    'Accra',
    'Greater Accra',
    'GA-123-4567'
);
*/

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE customer_profiles IS 'Extended profile information for customers';
COMMENT ON TABLE customer_addresses IS 'Delivery addresses for customers with Ghana-specific fields';
COMMENT ON TABLE user_roles IS 'Tracks user roles (customer, seller, admin)';
COMMENT ON TABLE password_reset_tokens IS 'Temporary tokens for password reset';
COMMENT ON TABLE login_history IS 'Security audit log for login attempts';
COMMENT ON TABLE customer_wishlist IS 'Products saved by customers';

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

-- Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE ON customer_profiles TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customer_addresses TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON customer_wishlist TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Customer Authentication Schema created successfully!';
    RAISE NOTICE '📊 Tables created: 6 (user_roles, customer_profiles, customer_addresses, password_reset_tokens, login_history, customer_wishlist)';
    RAISE NOTICE '🔒 RLS policies enabled for security';
    RAISE NOTICE '⚡ Triggers created for auto-profile creation';
    RAISE NOTICE '🎯 Ready for customer registration!';
END $$;
