-- ============================================
-- SHOPUP PLATFORM ENHANCEMENTS - PART 2
-- ============================================
-- Pay For Me, Delivery Zones, Promotions
-- Social Integration, Messaging
-- Version: 2.0
-- Date: November 17, 2025
-- ============================================

-- ============================================
-- 1. PAY FOR ME SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS pay_for_me_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Requester (Buyer)
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_name VARCHAR(255) NOT NULL,
    buyer_phone VARCHAR(20),
    
    -- Order Details
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment Split
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('full', 'partial', 'custom')),
    amount_requested DECIMAL(10,2) NOT NULL, -- Amount buyer wants someone to pay
    amount_paid_by_buyer DECIMAL(10,2) DEFAULT 0.00,
    
    -- Service Fee (Commission + Transaction Fee)
    service_fee DECIMAL(10,2) NOT NULL,
    service_fee_paid_by VARCHAR(20) DEFAULT 'buyer' CHECK (service_fee_paid_by IN ('buyer', 'payer', 'split')),
    
    -- Shareable Link
    share_token VARCHAR(100) UNIQUE NOT NULL,
    share_url TEXT NOT NULL,
    
    -- Payer Info (filled when someone pays)
    payer_name VARCHAR(255),
    payer_phone VARCHAR(20),
    payer_email VARCHAR(255),
    amount_paid_by_payer DECIMAL(10,2) DEFAULT 0.00,
    payer_paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment Status
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'partial', 'completed', 'expired', 'cancelled')
    ),
    
    -- Messages
    message_to_payer TEXT,
    
    -- Expiry
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    
    -- Notifications
    payer_notified BOOLEAN DEFAULT false,
    buyer_notified_on_payment BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pay_for_me_buyer ON pay_for_me_requests(buyer_id);
CREATE INDEX idx_pay_for_me_token ON pay_for_me_requests(share_token);
CREATE INDEX idx_pay_for_me_status ON pay_for_me_requests(payment_status);

-- ============================================
-- 2. PAY FOR ME PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS pay_for_me_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES pay_for_me_requests(id) ON DELETE CASCADE,
    
    -- Payer Details
    payer_name VARCHAR(255) NOT NULL,
    payer_phone VARCHAR(20),
    payer_email VARCHAR(255),
    
    -- Payment
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Transaction Fee (if split)
    transaction_fee DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pay_for_me_payments_request ON pay_for_me_payments(request_id);

-- ============================================
-- 3. SELLER DELIVERY ZONES
-- ============================================

CREATE TABLE IF NOT EXISTS seller_delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Zone Details
    zone_name VARCHAR(255) NOT NULL, -- e.g., "Accra Central", "Tema", "Kumasi"
    zone_type VARCHAR(50) DEFAULT 'city' CHECK (zone_type IN ('neighborhood', 'city', 'region', 'custom')),
    
    -- Pricing
    delivery_fee DECIMAL(10,2) NOT NULL CHECK (delivery_fee >= 0),
    free_delivery_threshold DECIMAL(10,2), -- Orders above this get free delivery
    
    -- Estimated Delivery Time
    min_delivery_days INTEGER DEFAULT 1,
    max_delivery_days INTEGER DEFAULT 3,
    
    -- Coverage
    areas_covered TEXT[], -- Array of specific areas
    postal_codes TEXT[], -- Array of postal codes
    digital_addresses TEXT[], -- Ghana Post GPS addresses
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    
    -- Priority (for overlapping zones)
    priority INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_delivery_zones_seller ON seller_delivery_zones(seller_id);
CREATE INDEX idx_delivery_zones_active ON seller_delivery_zones(is_active) WHERE is_active = true;

-- ============================================
-- 4. SELLER PROMOTIONS & DISCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS seller_promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Promotion Details
    promotion_name VARCHAR(255) NOT NULL,
    promotion_type VARCHAR(50) NOT NULL CHECK (
        promotion_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')
    ),
    
    -- Discount Value
    discount_percentage DECIMAL(5,2), -- e.g., 20.00 for 20%
    discount_amount DECIMAL(10,2), -- Fixed amount off
    
    -- Buy X Get Y
    buy_quantity INTEGER,
    get_quantity INTEGER,
    
    -- Conditions
    min_purchase_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
    
    -- Coupon Code
    coupon_code VARCHAR(50) UNIQUE,
    
    -- Applicability
    applies_to VARCHAR(50) DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_products', 'category')),
    product_ids UUID[], -- Specific products
    category_id UUID REFERENCES product_categories(id),
    
    -- Usage Limits
    max_uses INTEGER, -- Total uses allowed
    max_uses_per_customer INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    -- Date Range
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_promotions_seller ON seller_promotions(seller_id);
CREATE INDEX idx_promotions_code ON seller_promotions(coupon_code);
CREATE INDEX idx_promotions_active ON seller_promotions(is_active) WHERE is_active = true;

-- ============================================
-- 5. PROMOTION USAGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS promotion_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES seller_promotions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Discount Applied
    discount_amount DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(promotion_id, order_id)
);

CREATE INDEX idx_promotion_usage_promotion ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_customer ON promotion_usage(customer_id);

-- ============================================
-- 6. SOCIAL MEDIA INTEGRATION
-- ============================================

CREATE TABLE IF NOT EXISTS seller_social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Social Platforms
    instagram_handle VARCHAR(255),
    facebook_page VARCHAR(255),
    whatsapp_number VARCHAR(20),
    tiktok_handle VARCHAR(255),
    twitter_handle VARCHAR(255),
    
    -- Integration Status
    instagram_connected BOOLEAN DEFAULT false,
    facebook_connected BOOLEAN DEFAULT false,
    whatsapp_business_api BOOLEAN DEFAULT false,
    
    -- Sync Settings
    auto_post_new_products BOOLEAN DEFAULT false,
    auto_share_promotions BOOLEAN DEFAULT false,
    
    -- Verification
    instagram_verified BOOLEAN DEFAULT false,
    facebook_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(seller_id)
);

-- ============================================
-- 7. PRODUCT SOCIAL SHARES
-- ============================================

CREATE TABLE IF NOT EXISTS product_social_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Platform
    platform VARCHAR(50) NOT NULL CHECK (
        platform IN ('whatsapp', 'facebook', 'instagram', 'twitter', 'tiktok', 'copy_link')
    ),
    
    -- User who shared
    shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Tracking
    share_token VARCHAR(100),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0, -- Orders from this share
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_social_shares_product ON product_social_shares(product_id);
CREATE INDEX idx_social_shares_platform ON product_social_shares(platform);

-- ============================================
-- 8. LIVE LOCATION DELIVERY
-- ============================================

ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS live_location_lat DECIMAL(10,8);
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS live_location_lng DECIMAL(11,8);
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(10,2); -- In meters
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE delivery_addresses ADD COLUMN IF NOT EXISTS location_method VARCHAR(50) 
    CHECK (location_method IN ('gps', 'manual', 'ghana_post_gps'));

-- Add to orders for delivery tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(11,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- ============================================
-- 9. SELLER-CUSTOMER MESSAGING
-- ============================================

CREATE TABLE IF NOT EXISTS message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Context
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    
    -- Last Message
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    
    -- Unread Counts
    customer_unread_count INTEGER DEFAULT 0,
    seller_unread_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(customer_id, seller_id, order_id)
);

CREATE INDEX idx_threads_customer ON message_threads(customer_id);
CREATE INDEX idx_threads_seller ON message_threads(seller_id);
CREATE INDEX idx_threads_order ON message_threads(order_id);

-- ============================================
-- 10. MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    
    -- Sender
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'seller')),
    
    -- Message Content
    message_type VARCHAR(50) DEFAULT 'text' CHECK (
        message_type IN ('text', 'image', 'quick_reply', 'order_update', 'system')
    ),
    message_text TEXT,
    
    -- Attachments
    image_url TEXT,
    
    -- Quick Replies (pre-set messages)
    quick_reply_type VARCHAR(50), -- 'price_inquiry', 'availability', 'delivery', etc.
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- System Messages
    is_system_message BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- 11. QUICK REPLIES TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS quick_reply_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (
        template_type IN ('greeting', 'price', 'availability', 'delivery', 'payment', 'custom')
    ),
    message_text TEXT NOT NULL,
    
    -- Usage
    use_count INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quick_replies_seller ON quick_reply_templates(seller_id);

-- Insert default quick replies
INSERT INTO quick_reply_templates (seller_id, template_name, template_type, message_text)
SELECT 
    u.id,
    template_name,
    template_type,
    message_text
FROM auth.users u
CROSS JOIN (VALUES
    ('Greeting', 'greeting', 'Hi! Thank you for your interest. How can I help you?'),
    ('Product Available', 'availability', 'Yes, this product is currently in stock!'),
    ('Price Inquiry', 'price', 'The price is as shown. We offer discounts for bulk orders.'),
    ('Delivery Info', 'delivery', 'We deliver to your area. Delivery takes 2-3 business days.'),
    ('Payment Methods', 'payment', 'We accept Mobile Money, Card, and Cash on Delivery.')
) AS templates(template_name, template_type, message_text)
WHERE EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = u.id 
    AND user_roles.role = 'seller'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Email Notifications
    email_order_updates BOOLEAN DEFAULT true,
    email_promotions BOOLEAN DEFAULT true,
    email_messages BOOLEAN DEFAULT true,
    email_price_drops BOOLEAN DEFAULT true,
    
    -- SMS Notifications
    sms_order_updates BOOLEAN DEFAULT true,
    sms_delivery_updates BOOLEAN DEFAULT true,
    sms_messages BOOLEAN DEFAULT false,
    
    -- WhatsApp Notifications
    whatsapp_order_updates BOOLEAN DEFAULT true,
    whatsapp_delivery_updates BOOLEAN DEFAULT true,
    whatsapp_messages BOOLEAN DEFAULT true,
    
    -- Push Notifications
    push_order_updates BOOLEAN DEFAULT true,
    push_messages BOOLEAN DEFAULT true,
    push_promotions BOOLEAN DEFAULT false,
    
    -- In-App
    in_app_messages BOOLEAN DEFAULT true,
    in_app_order_updates BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ShopUp Platform Enhancements - Part 2 Complete!';
    RAISE NOTICE '💰 Added: Pay For Me System (Split Payments)';
    RAISE NOTICE '🚚 Added: Seller-Controlled Delivery Zones';
    RAISE NOTICE '🎁 Added: Seller Promotions & Discounts';
    RAISE NOTICE '📱 Added: Social Media Integration';
    RAISE NOTICE '📍 Added: Live Location Delivery';
    RAISE NOTICE '💬 Added: Seller-Customer Messaging';
    RAISE NOTICE '🔔 Added: Notification Preferences';
END $$;
