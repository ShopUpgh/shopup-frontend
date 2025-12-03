-- ============================================
-- PROFESSIONAL AD SYSTEM
-- ============================================
-- Taskbar ads, sponsored listings, banner ads
-- Non-intrusive, revenue generating
-- Version: 1.0
-- Date: November 17, 2025
-- ============================================

-- ============================================
-- 1. AD CAMPAIGNS
-- ============================================

CREATE TABLE IF NOT EXISTS ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Advertiser
    advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    advertiser_type VARCHAR(50) DEFAULT 'seller' CHECK (
        advertiser_type IN ('seller', 'external', 'platform')
    ),
    
    -- Campaign Details
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL CHECK (
        campaign_type IN ('taskbar', 'banner', 'sponsored_product', 'featured_store', 'category_ad')
    ),
    
    -- Ad Content
    ad_title VARCHAR(255),
    ad_description TEXT,
    ad_image_url TEXT,
    
    -- Call to Action
    cta_text VARCHAR(100), -- e.g., "Shop Now", "Learn More"
    cta_url TEXT NOT NULL,
    
    -- Targeting
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (
        target_audience IN ('all', 'customers', 'sellers', 'location_based', 'custom')
    ),
    target_locations TEXT[], -- e.g., ['Accra', 'Kumasi']
    target_categories UUID[], -- Category IDs
    
    -- Budget & Pricing
    budget_type VARCHAR(50) DEFAULT 'total' CHECK (budget_type IN ('daily', 'total')),
    budget_amount DECIMAL(10,2) NOT NULL,
    spent_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Pricing Model
    pricing_model VARCHAR(50) DEFAULT 'cpm' CHECK (
        pricing_model IN ('cpm', 'cpc', 'cpa', 'flat_rate')
    ),
    cost_per_impression DECIMAL(10,4), -- CPM (Cost Per 1000 impressions)
    cost_per_click DECIMAL(10,2), -- CPC
    cost_per_action DECIMAL(10,2), -- CPA (conversion)
    
    -- Schedule
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (
        status IN ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected')
    ),
    
    -- Approval
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Performance
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0.00, -- Click-through rate
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_advertiser ON ad_campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_campaigns_type ON ad_campaigns(campaign_type);
CREATE INDEX idx_campaigns_active ON ad_campaigns(status, starts_at, ends_at) 
    WHERE status = 'active';

-- ============================================
-- 2. AD PLACEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Placement Details
    placement_code VARCHAR(100) UNIQUE NOT NULL,
    placement_name VARCHAR(255) NOT NULL,
    placement_type VARCHAR(50) NOT NULL CHECK (
        placement_type IN (
            'taskbar_left', 'taskbar_right', 'taskbar_center',
            'banner_top', 'banner_bottom', 'banner_sidebar',
            'product_grid', 'storefront_header', 'category_top'
        )
    ),
    
    -- Display Settings
    max_width INTEGER, -- In pixels
    max_height INTEGER,
    position VARCHAR(50), -- 'fixed', 'sticky', 'relative'
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    
    -- Pricing
    base_price_cpm DECIMAL(10,4) DEFAULT 2.00, -- GH₵2 per 1000 impressions
    base_price_cpc DECIMAL(10,2) DEFAULT 0.50, -- GH₵0.50 per click
    
    -- Performance
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default placements
INSERT INTO ad_placements (placement_code, placement_name, placement_type, max_width, max_height, position, base_price_cpm, base_price_cpc) VALUES
    ('TASKBAR_LEFT', 'Taskbar Left (Logo Area)', 'taskbar_left', 200, 40, 'fixed', 3.00, 0.60),
    ('TASKBAR_RIGHT', 'Taskbar Right (Menu Area)', 'taskbar_right', 300, 40, 'fixed', 3.00, 0.60),
    ('TASKBAR_CENTER', 'Taskbar Center Banner', 'taskbar_center', 400, 40, 'fixed', 4.00, 0.80),
    ('BANNER_TOP', 'Top Banner (Below Navigation)', 'banner_top', 1200, 90, 'sticky', 5.00, 1.00),
    ('BANNER_SIDEBAR', 'Sidebar Banner (Right)', 'banner_sidebar', 300, 600, 'sticky', 3.50, 0.70),
    ('STOREFRONT_FEATURED', 'Featured Store Spot', 'storefront_header', 400, 200, 'relative', 6.00, 1.20),
    ('PRODUCT_SPONSORED', 'Sponsored Product Grid', 'product_grid', 250, 350, 'relative', 4.50, 0.90),
    ('CATEGORY_TOP', 'Category Page Top', 'category_top', 1000, 120, 'relative', 4.00, 0.80)
ON CONFLICT (placement_code) DO NOTHING;

-- ============================================
-- 3. AD IMPRESSIONS & CLICKS
-- ============================================

CREATE TABLE IF NOT EXISTS ad_impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ad Reference
    campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    placement_id UUID NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
    
    -- User Info
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Tracking
    impression_type VARCHAR(50) DEFAULT 'view' CHECK (impression_type IN ('view', 'click', 'conversion')),
    
    -- Context
    page_url TEXT,
    referrer_url TEXT,
    
    -- Device Info
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Location
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Conversion Tracking
    conversion_value DECIMAL(10,2), -- Order value if converted
    order_id UUID REFERENCES orders(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX idx_impressions_placement ON ad_impressions(placement_id);
CREATE INDEX idx_impressions_type ON ad_impressions(impression_type);
CREATE INDEX idx_impressions_date ON ad_impressions(created_at DESC);
CREATE INDEX idx_impressions_user ON ad_impressions(user_id);

-- Partitioning by date for performance (optional)
-- CREATE TABLE ad_impressions_2025_11 PARTITION OF ad_impressions
--     FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- ============================================
-- 4. AD BILLING
-- ============================================

CREATE TABLE IF NOT EXISTS ad_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Campaign
    campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
    advertiser_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Billing Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Performance
    total_impressions INTEGER NOT NULL,
    total_clicks INTEGER NOT NULL,
    total_conversions INTEGER DEFAULT 0,
    
    -- Costs
    impression_cost DECIMAL(10,2) DEFAULT 0.00,
    click_cost DECIMAL(10,2) DEFAULT 0.00,
    conversion_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    ),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Invoice
    invoice_number VARCHAR(100) UNIQUE,
    invoice_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_billing_campaign ON ad_billing(campaign_id);
CREATE INDEX idx_billing_advertiser ON ad_billing(advertiser_id);
CREATE INDEX idx_billing_period ON ad_billing(period_start, period_end);

-- ============================================
-- 5. AD PACKAGES (Pre-set bundles)
-- ============================================

CREATE TABLE IF NOT EXISTS ad_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Package Details
    package_name VARCHAR(255) NOT NULL,
    package_type VARCHAR(50) NOT NULL CHECK (
        package_type IN ('starter', 'growth', 'premium', 'enterprise', 'custom')
    ),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    
    -- Includes
    included_impressions INTEGER,
    included_clicks INTEGER,
    included_placements TEXT[], -- Array of placement codes
    
    -- Features
    features JSONB, -- {"priority_placement": true, "analytics_dashboard": true}
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    purchase_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default packages
INSERT INTO ad_packages (package_name, package_type, price, duration_days, included_impressions, included_clicks, included_placements, features) VALUES
    (
        'Starter Pack',
        'starter',
        50.00,
        7,
        10000,
        100,
        ARRAY['TASKBAR_RIGHT', 'PRODUCT_SPONSORED'],
        '{"priority_placement": false, "analytics_dashboard": true}'::jsonb
    ),
    (
        'Growth Pack',
        'growth',
        200.00,
        30,
        50000,
        500,
        ARRAY['TASKBAR_CENTER', 'BANNER_TOP', 'PRODUCT_SPONSORED'],
        '{"priority_placement": true, "analytics_dashboard": true, "featured_badge": true}'::jsonb
    ),
    (
        'Premium Pack',
        'premium',
        500.00,
        30,
        150000,
        1500,
        ARRAY['TASKBAR_LEFT', 'TASKBAR_CENTER', 'BANNER_TOP', 'STOREFRONT_FEATURED', 'PRODUCT_SPONSORED'],
        '{"priority_placement": true, "analytics_dashboard": true, "featured_badge": true, "dedicated_support": true}'::jsonb
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to track impression
CREATE OR REPLACE FUNCTION track_ad_impression(
    p_campaign_id UUID,
    p_placement_id UUID,
    p_impression_type VARCHAR,
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_impression_id UUID;
BEGIN
    -- Insert impression
    INSERT INTO ad_impressions (
        campaign_id,
        placement_id,
        impression_type,
        user_id,
        session_id
    ) VALUES (
        p_campaign_id,
        p_placement_id,
        p_impression_type,
        p_user_id,
        p_session_id
    ) RETURNING id INTO v_impression_id;
    
    -- Update campaign stats
    UPDATE ad_campaigns
    SET 
        total_impressions = CASE 
            WHEN p_impression_type = 'view' THEN total_impressions + 1 
            ELSE total_impressions 
        END,
        total_clicks = CASE 
            WHEN p_impression_type = 'click' THEN total_clicks + 1 
            ELSE total_clicks 
        END,
        total_conversions = CASE 
            WHEN p_impression_type = 'conversion' THEN total_conversions + 1 
            ELSE total_conversions 
        END,
        ctr = CASE 
            WHEN total_impressions > 0 THEN ROUND((total_clicks::DECIMAL / total_impressions * 100), 2)
            ELSE 0 
        END
    WHERE id = p_campaign_id;
    
    -- Update placement stats
    UPDATE ad_placements
    SET 
        total_impressions = CASE 
            WHEN p_impression_type = 'view' THEN total_impressions + 1 
            ELSE total_impressions 
        END,
        total_clicks = CASE 
            WHEN p_impression_type = 'click' THEN total_clicks + 1 
            ELSE total_clicks 
        END
    WHERE id = p_placement_id;
    
    RETURN v_impression_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active ads for placement
CREATE OR REPLACE FUNCTION get_active_ads_for_placement(
    p_placement_code VARCHAR,
    p_user_location VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 1
)
RETURNS TABLE(
    campaign_id UUID,
    ad_title VARCHAR,
    ad_description TEXT,
    ad_image_url TEXT,
    cta_text VARCHAR,
    cta_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        ac.ad_title,
        ac.ad_description,
        ac.ad_image_url,
        ac.cta_text,
        ac.cta_url
    FROM ad_campaigns ac
    WHERE ac.status = 'active'
    AND ac.starts_at <= NOW()
    AND (ac.ends_at IS NULL OR ac.ends_at >= NOW())
    AND ac.spent_amount < ac.budget_amount
    AND (
        ac.target_audience = 'all' 
        OR p_user_location = ANY(ac.target_locations)
    )
    ORDER BY RANDOM() -- Rotate ads fairly
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Advertisers can view their own campaigns
CREATE POLICY "Advertisers can view own campaigns"
    ON ad_campaigns FOR SELECT
    USING (advertiser_id = auth.uid());

-- Advertisers can create campaigns
CREATE POLICY "Advertisers can create campaigns"
    ON ad_campaigns FOR INSERT
    WITH CHECK (advertiser_id = auth.uid());

-- Advertisers can update their pending/draft campaigns
CREATE POLICY "Advertisers can update own campaigns"
    ON ad_campaigns FOR UPDATE
    USING (advertiser_id = auth.uid() AND status IN ('draft', 'pending_review'));

-- Admins can view all
CREATE POLICY "Admins can view all campaigns"
    ON ad_campaigns FOR ALL
    USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ad_campaigns IS 'Paid advertising campaigns - sellers and external advertisers';
COMMENT ON TABLE ad_placements IS 'Available ad placement spots across the platform';
COMMENT ON TABLE ad_impressions IS 'Tracks views, clicks, and conversions for billing';
COMMENT ON TABLE ad_packages IS 'Pre-packaged ad bundles for easy purchase';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Professional Ad System Created!';
    RAISE NOTICE '📊 8 Ad Placement Types Available';
    RAISE NOTICE '💰 Multiple Pricing Models (CPM, CPC, CPA, Flat)';
    RAISE NOTICE '🎯 Targeting: Location, Category, Audience';
    RAISE NOTICE '📈 Complete Analytics & Performance Tracking';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Ad Placements:';
    RAISE NOTICE '  • Taskbar (Left, Center, Right)';
    RAISE NOTICE '  • Banner (Top, Sidebar)';
    RAISE NOTICE '  • Sponsored Products';
    RAISE NOTICE '  • Featured Stores';
    RAISE NOTICE '  • Category Top Ads';
    RAISE NOTICE '';
    RAISE NOTICE '💵 Revenue Stream: GH₵50-500+ per campaign';
END $$;
