-- ============================================
-- SHOPUP PLATFORM ENHANCEMENTS - PART 1
-- ============================================
-- Customer Storefront, Subscriptions, Wallets
-- Reviews, Inventory, Promotions
-- Version: 2.0
-- Date: November 17, 2025
-- ============================================

-- ============================================
-- 1. PRODUCT CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Emoji or icon name
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[]; -- For search
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Insert default categories
INSERT INTO product_categories (name, slug, icon, display_order) VALUES
    ('Fashion & Clothing', 'fashion', '👗', 1),
    ('Electronics', 'electronics', '📱', 2),
    ('Home & Living', 'home', '🏠', 3),
    ('Beauty & Personal Care', 'beauty', '💄', 4),
    ('Food & Beverages', 'food', '🍔', 5),
    ('Sports & Fitness', 'sports', '⚽', 6),
    ('Books & Education', 'books', '📚', 7),
    ('Kids & Babies', 'kids', '👶', 8),
    ('Health & Wellness', 'health', '💊', 9),
    ('Other', 'other', '📦', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. PRODUCT IMAGES (Multiple per product)
-- ============================================

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================
-- 3. SHOPPING CART
-- ============================================

CREATE TABLE IF NOT EXISTS shopping_cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_cart_customer ON shopping_cart(customer_id);
CREATE INDEX idx_cart_product ON shopping_cart(product_id);

-- ============================================
-- 4. SUBSCRIPTION PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(50) NOT NULL UNIQUE CHECK (plan_name IN ('free', 'essential', 'pro', 'enterprise')),
    display_name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2),
    
    -- Limits
    max_products INTEGER,
    commission_rate DECIMAL(5,2) NOT NULL, -- Percentage
    
    -- Features
    verified_badge BOOLEAN DEFAULT false,
    featured_listings BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    custom_branding BOOLEAN DEFAULT false,
    advanced_analytics BOOLEAN DEFAULT false,
    
    -- Trial
    trial_days INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert subscription plans
INSERT INTO subscription_plans (
    plan_name, display_name, price_monthly, price_annual, 
    max_products, commission_rate, verified_badge, featured_listings, 
    priority_support, api_access, custom_branding, advanced_analytics, trial_days
) VALUES
    ('free', 'Free', 0, 0, 10, 5.00, false, false, false, false, false, false, 0),
    ('essential', 'Essential', 50, 500, 50, 3.00, false, false, false, false, false, false, 7),
    ('pro', 'Pro', 150, 1500, 999999, 2.00, true, true, true, false, false, true, 7),
    ('enterprise', 'Enterprise', 500, 5000, 999999, 1.00, true, true, true, true, true, true, 14)
ON CONFLICT (plan_name) DO NOTHING;

-- ============================================
-- 5. SELLER SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS seller_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    
    -- Billing
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
    price_paid DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
    
    -- Dates
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment
    last_payment_id UUID,
    next_billing_date TIMESTAMP WITH TIME ZONE,
    
    -- Auto-renew
    auto_renew BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(seller_id)
);

CREATE INDEX idx_seller_subscriptions_seller ON seller_subscriptions(seller_id);
CREATE INDEX idx_seller_subscriptions_status ON seller_subscriptions(status);

-- ============================================
-- 6. WALLETS (Customer & Seller)
-- ============================================

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'seller')),
    
    -- Balance
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    
    -- Limits
    daily_limit DECIMAL(10,2) DEFAULT 5000.00,
    monthly_limit DECIMAL(10,2) DEFAULT 50000.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    total_credits DECIMAL(10,2) DEFAULT 0.00,
    total_debits DECIMAL(10,2) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallets_user ON wallets(user_id);

-- ============================================
-- 7. WALLET TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN (
            'credit', 'debit', 'refund', 'withdrawal', 
            'top_up', 'commission', 'purchase', 'transfer'
        )
    ),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    
    -- Balance tracking
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50), -- 'order', 'withdrawal', 'refund', etc.
    reference_id UUID,
    
    -- Description
    description TEXT NOT NULL,
    
    -- Payment Method (for top-ups/withdrawals)
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_date ON wallet_transactions(created_at DESC);

-- ============================================
-- 8. PRODUCT REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Review
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    
    -- Photos
    review_images TEXT[],
    
    -- Verified Purchase
    is_verified_purchase BOOLEAN DEFAULT false,
    
    -- Seller Response
    seller_response TEXT,
    seller_responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT true,
    flagged BOOLEAN DEFAULT false,
    flag_reason TEXT,
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, customer_id, order_id)
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_customer ON product_reviews(customer_id);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);

-- Add average rating to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- ============================================
-- 9. INVENTORY TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Movement
    movement_type VARCHAR(50) NOT NULL CHECK (
        movement_type IN ('restock', 'sale', 'return', 'adjustment', 'damage', 'theft')
    ),
    quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
    
    -- Balance
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50), -- 'order', 'manual', 'return'
    reference_id UUID,
    
    -- Notes
    notes TEXT,
    
    -- Who did it
    performed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);

-- Add low stock alert threshold
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock' 
    CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock'));

-- ============================================
-- 10. WISHLIST
-- ============================================

CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Price tracking
    price_when_added DECIMAL(10,2),
    
    -- Notifications
    notify_on_price_drop BOOLEAN DEFAULT true,
    notify_on_back_in_stock BOOLEAN DEFAULT true,
    
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_wishlist_customer ON wishlists(customer_id);
CREATE INDEX idx_wishlist_product ON wishlists(product_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ ShopUp Platform Enhancements - Part 1 Complete!';
    RAISE NOTICE '📦 Added: Categories, Multi-images, Shopping Cart';
    RAISE NOTICE '💳 Added: Subscriptions (Free, Essential, Pro, Enterprise)';
    RAISE NOTICE '💰 Added: Wallet System (Customer & Seller)';
    RAISE NOTICE '⭐ Added: Product Reviews & Ratings';
    RAISE NOTICE '📊 Added: Inventory Tracking';
    RAISE NOTICE '❤️  Added: Wishlist';
END $$;
