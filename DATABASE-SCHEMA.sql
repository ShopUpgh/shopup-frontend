/**
 * SHOPUP ORDER MANAGEMENT SYSTEM
 * Database schema for orders, items, and tracking
 *
 * Tables:
 * 1. orders - Main order records
 * 2. order_items - Individual items in each order
 * 3. order_tracking - Status history for each order
 */

-- ============================================
-- 1. ORDERS TABLE
-- ============================================
-- Main table for all customer orders

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Order Information
    order_number VARCHAR(20) UNIQUE NOT NULL,  -- e.g., "ORD-2025-00001"
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,

    -- Delivery Address
    delivery_address TEXT NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_region VARCHAR(100) NOT NULL,
    delivery_postal VARCHAR(20),

    -- Payment Information
    payment_method VARCHAR(50) NOT NULL,  -- 'mtn', 'vodafone', 'bank', 'cod'
    payment_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
    transaction_id VARCHAR(100),  -- From payment gateway

    -- Order Status
    order_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'

    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    -- Special Instructions
    special_instructions TEXT,

    -- Tracking
    tracking_number VARCHAR(50),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,

    -- Relationships
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,

    -- Metadata
    notes TEXT,

    INDEX idx_order_number (order_number),
    INDEX idx_customer_email (customer_email),
    INDEX idx_seller_id (seller_id),
    INDEX idx_order_status (order_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 2. ORDER ITEMS TABLE
-- ============================================
-- Individual items within each order

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE RESTRICT,

    -- Item Details
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    line_total DECIMAL(10, 2) NOT NULL,  -- quantity * unit_price

    -- Product Info at time of order (for history)
    product_description TEXT,
    product_category VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_seller_id (seller_id)
);

-- ============================================
-- 3. ORDER TRACKING TABLE
-- ============================================
-- Track status changes and updates for each order

CREATE TABLE IF NOT EXISTS order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    -- Status Update
    status VARCHAR(50) NOT NULL,  -- 'pending', 'confirmed', 'shipped', 'delivered', etc.
    message TEXT NOT NULL,  -- Human readable message

    -- Who made the change
    updated_by_role VARCHAR(50),  -- 'customer', 'seller', 'admin', 'system'
    updated_by_id UUID,  -- User ID who made the change

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Additional data
    metadata JSONB,  -- Extra data like tracking number, carrier, etc.

    INDEX idx_order_id (order_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ============================================
-- 4. ORDER STATISTICS TABLE (Optional)
-- ============================================
-- For faster analytics queries

CREATE TABLE IF NOT EXISTS order_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Period
    date DATE NOT NULL,

    -- Seller stats
    seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,

    -- Counts
    total_orders INT DEFAULT 0,
    completed_orders INT DEFAULT 0,
    pending_orders INT DEFAULT 0,
    cancelled_orders INT DEFAULT 0,

    -- Revenue
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    completed_revenue DECIMAL(15, 2) DEFAULT 0,

    -- Average
    average_order_value DECIMAL(10, 2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(date, seller_id),
    INDEX idx_seller_id (seller_id),
    INDEX idx_date (date)
);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Performance: Find orders by status
CREATE INDEX idx_orders_status_created ON orders(order_status, created_at DESC);

-- Performance: Find seller's orders
CREATE INDEX idx_orders_seller_status ON orders(seller_id, order_status);

-- Performance: Find customer orders
CREATE INDEX idx_orders_customer_email_created ON orders(customer_email, created_at DESC);

-- Performance: Find by payment status
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================
-- 6. VIEWS FOR COMMON QUERIES
-- ============================================

-- View: All orders with seller info
CREATE OR REPLACE VIEW orders_with_seller AS
SELECT
    o.*,
    s.business_name,
    s.email as seller_email,
    s.phone as seller_phone
FROM orders o
JOIN sellers s ON o.seller_id = s.id;

-- View: Orders with item count
CREATE OR REPLACE VIEW orders_with_item_count AS
SELECT
    o.*,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.id
GROUP BY o.id;

-- View: Seller orders summary
CREATE OR REPLACE VIEW seller_orders_summary AS
SELECT
    seller_id,
    COUNT(*) as total_orders,
    SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN order_status = 'shipped' THEN 1 ELSE 0 END) as shipped,
    SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(total) as total_revenue,
    AVG(total) as average_order_value,
    MAX(created_at) as last_order_date
FROM orders
GROUP BY seller_id;

-- ============================================
-- 7. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Trigger: Update order.updated_at when anything changes
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_timestamp();

-- Trigger: Add tracking entry when order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_status != OLD.order_status THEN
        INSERT INTO order_tracking (
            order_id,
            status,
            message,
            updated_by_role,
            metadata
        ) VALUES (
            NEW.id,
            NEW.order_status,
            'Order status changed to ' || NEW.order_status,
            'system',
            jsonb_build_object('previous_status', OLD.order_status)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_log_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- 8. HELPER FUNCTIONS
-- ============================================

-- Function: Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    order_num VARCHAR;
    next_seq INT;
BEGIN
    -- Get next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number, 12) AS INT)), 0) + 1
    INTO next_seq
    FROM orders
    WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

    -- Format as ORD-YYYY-00001
    order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_seq::TEXT, 5, '0');
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function: Get order summary
CREATE OR REPLACE FUNCTION get_order_summary(order_id UUID)
RETURNS TABLE (
    order_id UUID,
    order_number VARCHAR,
    order_status VARCHAR,
    payment_status VARCHAR,
    customer_name VARCHAR,
    total DECIMAL,
    item_count INT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.order_status,
        o.payment_status,
        o.customer_name,
        o.total,
        COALESCE(COUNT(oi.id), 0)::INT,
        o.created_at
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = $1
    GROUP BY o.id, o.order_number, o.order_status, o.payment_status, o.customer_name, o.total, o.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function: Update order status
CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status VARCHAR,
    status_message TEXT,
    updated_by_role VARCHAR DEFAULT 'system',
    updated_by_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE orders
    SET order_status = new_status
    WHERE id = order_id;

    INSERT INTO order_tracking (
        order_id,
        status,
        message,
        updated_by_role,
        updated_by_id
    ) VALUES (order_id, new_status, status_message, updated_by_role, updated_by_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Sellers can only see their own orders
CREATE POLICY "Users can view their seller orders"
ON orders FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can update their own orders
CREATE POLICY "Sellers can update their own orders"
ON orders FOR UPDATE
USING (auth.uid() = seller_id);

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Sellers can view items in their orders
CREATE POLICY "Users can view order items in their orders"
ON order_items FOR SELECT
USING (
    order_id IN (
        SELECT id FROM orders WHERE seller_id = auth.uid()
    )
);

-- Enable RLS on order_tracking table
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;

-- Sellers can view tracking for their orders
CREATE POLICY "Users can view tracking for their orders"
ON order_tracking FOR SELECT
USING (
    order_id IN (
        SELECT id FROM orders WHERE seller_id = auth.uid()
    )
);

-- ============================================
-- 10. SAMPLE DATA (For Testing)
-- ============================================

-- Insert sample order (uncomment to use)
/*
INSERT INTO orders (
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_city,
    delivery_region,
    payment_method,
    subtotal,
    tax,
    total,
    seller_id
) VALUES (
    'ORD-2025-00001',
    'John Doe',
    'john@example.com',
    '0244123456',
    '123 Main Street',
    'Accra',
    'Greater Accra',
    'mtn',
    100.00,
    15.00,
    115.00,
    'seller-id-here'
);
*/

-- ============================================
-- End of Order Management Schema
-- ============================================
