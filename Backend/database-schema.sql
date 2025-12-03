-- ShopUp Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. SELLERS TABLE (User accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS sellers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    business_category VARCHAR(50) NOT NULL,
    store_slug VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    quantity INTEGER NOT NULL DEFAULT 0,
    sku VARCHAR(100),
    shipping_note TEXT,
    images JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    product_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. CUSTOMERS TABLE (Optional - for tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(seller_id, phone)
);

-- ============================================
-- INDEXES for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_customers_seller ON customers(seller_id);

-- ============================================
-- FUNCTIONS for auto-updating timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS for auto-updating timestamps
-- ============================================
CREATE TRIGGER update_sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Sellers can only see and modify their own data
CREATE POLICY "Sellers can view own data" ON sellers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Sellers can update own data" ON sellers
    FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Sellers can view own products" ON products
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products" ON products
    FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products" ON products
    FOR DELETE USING (auth.uid() = seller_id);

-- Public can view active products
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Orders policies
CREATE POLICY "Sellers can view own orders" ON orders
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own orders" ON orders
    FOR UPDATE USING (auth.uid() = seller_id);

-- Order items policies
CREATE POLICY "Sellers can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.seller_id = auth.uid()
        )
    );

-- Customers policies
CREATE POLICY "Sellers can view own customers" ON customers
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can manage own customers" ON customers
    FOR ALL USING (auth.uid() = seller_id);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data after creating a seller account

/*
-- Insert sample products (replace seller_id with actual UUID)
INSERT INTO products (seller_id, name, description, category, condition, price, quantity, images) VALUES
('YOUR-SELLER-UUID', 'Blue Cotton T-Shirt', 'Comfortable cotton t-shirt perfect for daily wear', 'fashion', 'new', 50.00, 25, '["image_url_1"]'),
('YOUR-SELLER-UUID', 'Wireless Headphones', 'Premium quality wireless headphones with noise cancellation', 'electronics', 'new', 150.00, 10, '["image_url_2"]');
*/

-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- View all tables
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';

-- Count records in each table
-- SELECT 'sellers' as table_name, COUNT(*) as count FROM sellers
-- UNION ALL
-- SELECT 'products', COUNT(*) FROM products
-- UNION ALL
-- SELECT 'orders', COUNT(*) FROM orders;

-- Get seller's dashboard stats
-- SELECT 
--     (SELECT COUNT(*) FROM products WHERE seller_id = 'YOUR-UUID') as total_products,
--     (SELECT COUNT(*) FROM orders WHERE seller_id = 'YOUR-UUID') as total_orders,
--     (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE seller_id = 'YOUR-UUID' AND status = 'delivered') as total_sales;
