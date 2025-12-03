# ShopUp Database Implementation Guide

**Guide for setting up the complete order management schema in Supabase**

---

## 📋 Overview

This guide walks you through implementing the complete order management system in your Supabase database. The schema includes:

- ✅ Orders table (main order records)
- ✅ Order items table (products in each order)
- ✅ Order tracking table (status history)
- ✅ Order statistics table (analytics)
- ✅ Views for common queries
- ✅ Triggers for automatic updates
- ✅ Helper functions
- ✅ Row Level Security (RLS) policies

---

## 🚀 Quick Start (5 minutes)

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your **ShopUp** project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** button

### Step 2: Copy the Schema

1. Open [DATABASE-SCHEMA.sql](DATABASE-SCHEMA.sql) in this folder
2. Copy all the SQL code
3. Paste it into the Supabase SQL Editor

### Step 3: Run the Schema

1. Click **Run** button (or press Ctrl+Enter)
2. Wait for execution to complete (30-60 seconds)
3. You should see: ✅ **Queries executed successfully**

### Step 4: Verify Tables Created

1. Click **Table Editor** (left sidebar)
2. Refresh the page
3. You should see these new tables:
   - ✅ orders
   - ✅ order_items
   - ✅ order_tracking
   - ✅ order_statistics

---

## 📝 What Gets Created

### Tables (4 total)

| Table | Purpose | Records | Key Fields |
|-------|---------|---------|-----------|
| **orders** | Main order records | Customer orders | order_number, status, payment_status, total |
| **order_items** | Items in each order | Line items | product_id, quantity, unit_price |
| **order_tracking** | Status history | Status changes | status, message, timestamp |
| **order_statistics** | Analytics data | Daily totals | total_orders, total_revenue, average_order_value |

### Views (3 total)

| View | Purpose | Use Case |
|------|---------|----------|
| **orders_with_seller** | Orders + seller info | Display orders with seller details |
| **orders_with_item_count** | Orders + item count | Show order summaries |
| **seller_orders_summary** | Aggregated seller stats | Dashboard analytics |

### Functions (3 total)

| Function | Purpose | Parameters |
|----------|---------|-----------|
| **generate_order_number()** | Create unique order numbers | None |
| **get_order_summary()** | Get order details | order_id |
| **update_order_status()** | Update status + log change | order_id, new_status, message |

### Triggers (2 total)

| Trigger | Purpose | When Fired |
|---------|---------|-----------|
| **orders_update_timestamp** | Auto-update updated_at | Any order update |
| **orders_log_status_change** | Log status changes | Order status changes |

### Indexes (5 total)

| Index | Purpose | Performance |
|-------|---------|-------------|
| order_number | Find by order # | Fast lookups |
| customer_email | Find customer orders | Fast searches |
| seller_id | Find seller orders | Fast filtering |
| order_status | Filter by status | Fast queries |
| created_at | Find recent orders | Fast sorting |

---

## 🔐 Row Level Security (RLS)

The schema includes RLS policies that automatically protect data:

```sql
-- Sellers can only see their own orders
CREATE POLICY "Users can view their seller orders"
ON orders FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can update their own orders
CREATE POLICY "Sellers can update their orders"
ON orders FOR UPDATE
USING (auth.uid() = seller_id);
```

### What This Means

- Seller A cannot see Seller B's orders
- Customers can only see their own order history
- Automatic security - no extra code needed!

---

## 💾 Database Structure Details

### Orders Table Structure

```
orders
├── ID fields
│   └── id (UUID, primary key)
│
├── Order Info
│   ├── order_number (unique, e.g., "ORD-2025-00001")
│   ├── customer_name
│   ├── customer_email
│   └── customer_phone
│
├── Delivery Address
│   ├── delivery_address
│   ├── delivery_city
│   ├── delivery_region
│   └── delivery_postal
│
├── Payment Info
│   ├── payment_method (mtn, vodafone, bank, cod)
│   ├── payment_status (pending, processing, completed, failed)
│   └── transaction_id (from payment gateway)
│
├── Order Status
│   └── order_status (pending, confirmed, shipped, delivered, cancelled)
│
├── Pricing
│   ├── subtotal
│   ├── tax
│   ├── shipping_fee
│   └── total
│
├── Tracking
│   ├── tracking_number
│   └── special_instructions
│
└── Timestamps
    ├── created_at
    ├── updated_at
    ├── confirmed_at
    ├── shipped_at
    └── delivered_at
```

---

## 🔄 Order Flow Example

Here's how orders move through the system:

```
1. Customer Creates Order
   └─ INSERT into orders (status = 'pending')
   └─ INSERT into order_items (for each product)
   └─ Trigger: Creates order_tracking entry

2. Seller Confirms Order
   └─ UPDATE orders SET order_status = 'confirmed'
   └─ Trigger: Auto-updates updated_at
   └─ Trigger: Logs change in order_tracking

3. Seller Ships Order
   └─ UPDATE orders SET order_status = 'shipped'
   └─ UPDATE orders SET shipping_number = 'TRK...'
   └─ Trigger: Logs change in order_tracking

4. Customer Receives Order
   └─ UPDATE orders SET order_status = 'delivered'
   └─ Trigger: Logs change in order_tracking

5. Analytics Updated
   └─ order_statistics updated (daily batch)
   └─ Seller dashboard shows updated stats
```

---

## 📊 Using the Views

### View 1: orders_with_seller

Get order details with seller information:

```sql
SELECT * FROM orders_with_seller
WHERE seller_id = '123e4567-e89b-12d3-a456-426614174000';
```

Returns:
- All order columns PLUS
- seller.business_name
- seller.email
- seller.phone

### View 2: orders_with_item_count

Get orders with item counts:

```sql
SELECT * FROM orders_with_item_count
ORDER BY created_at DESC;
```

Returns:
- All order columns PLUS
- item_count (number of different products)
- total_items (sum of quantities)

### View 3: seller_orders_summary

Get aggregated seller statistics:

```sql
SELECT * FROM seller_orders_summary
WHERE seller_id = '123e4567-e89b-12d3-a456-426614174000';
```

Returns:
- total_orders
- delivered
- shipped
- pending
- total_revenue
- average_order_value
- last_order_date

---

## 🛠️ Using the Functions

### Function 1: generate_order_number()

Generate unique order numbers automatically:

```javascript
// In your JavaScript code:
const { data: orderNum, error } = await supabase
    .from('orders')
    .insert([{
        order_number: await generateOrderNumber(),
        customer_name: 'John Doe',
        // ... other fields
    }]);
```

Or in SQL:

```sql
INSERT INTO orders (order_number, customer_name, ...)
VALUES (generate_order_number(), 'John Doe', ...);
```

**Format:** `ORD-2025-00001`, `ORD-2025-00002`, etc.

### Function 2: get_order_summary(order_id)

Get complete order summary:

```sql
SELECT * FROM get_order_summary('550e8400-e29b-41d4-a716-446655440000');
```

Returns:
- order_id
- order_number
- order_status
- payment_status
- customer_name
- total
- item_count (how many different products)
- created_at

### Function 3: update_order_status()

Update order status and auto-log the change:

```sql
SELECT update_order_status(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'shipped',
    'Order has been shipped via DHL',
    'seller',
    '123e4567-e89b-12d3-a456-426614174000'::uuid
);
```

This function:
- ✅ Updates order_status
- ✅ Auto-updates updated_at timestamp
- ✅ Logs the change in order_tracking
- ✅ Records who made the change

---

## 🧪 Testing the Schema

### Test 1: Create an Order

```sql
-- Insert a test order
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
    'Test Customer',
    'test@example.com',
    '0244123456',
    '123 Test Street',
    'Accra',
    'Greater Accra',
    'mtn',
    100.00,
    15.00,
    115.00,
    '550e8400-e29b-41d4-a716-446655440000'::uuid
);
```

### Test 2: Add Items to Order

```sql
-- Get the order ID first
SELECT id FROM orders WHERE order_number = 'ORD-2025-00001';

-- Then insert items
INSERT INTO order_items (
    order_id,
    product_id,
    seller_id,
    product_name,
    quantity,
    unit_price,
    line_total
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '660e8400-e29b-41d4-a716-446655440000'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Sample Product',
    2,
    50.00,
    100.00
);
```

### Test 3: Update Order Status

```sql
-- Update status and auto-log
SELECT update_order_status(
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'confirmed',
    'Order confirmed by seller',
    'seller'
);

-- Check the tracking log
SELECT * FROM order_tracking
WHERE order_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
```

### Test 4: View Order Summary

```sql
-- Get complete summary
SELECT * FROM get_order_summary('550e8400-e29b-41d4-a716-446655440000'::uuid);

-- Get seller summary
SELECT * FROM seller_orders_summary
WHERE seller_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
```

---

## 🚨 Troubleshooting

### Error: "relation already exists"

**Problem:** Tables already exist
**Solution:** Use `DROP TABLE IF EXISTS` before `CREATE TABLE`

```sql
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS order_tracking CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
-- Then run the schema
```

### Error: "foreign key constraint fails"

**Problem:** seller_id doesn't exist in sellers table
**Solution:** First ensure sellers table exists:

```sql
-- Check if sellers table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'sellers'
);

-- If not, create it first (before running order schema)
```

### Error: "invalid syntax near CREATE TRIGGER"

**Problem:** Supabase might not allow triggers in some plans
**Solution:** Remove the trigger section or use a cheaper plan that supports triggers

### RLS Policy Not Working

**Problem:** Sellers can see other sellers' orders
**Solution:** Make sure RLS is enabled:

```sql
-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('orders', 'order_items', 'order_tracking');

-- If false, enable it
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
```

---

## 📱 Next Steps

After implementing the schema:

### 1. Update JavaScript Code
Add functions to handle orders:

```javascript
// Create order
async function createOrder(orderData) {
    const { data, error } = await supabase
        .from('orders')
        .insert([orderData]);
    return { data, error };
}

// Get seller orders
async function getSellerOrders(sellerId) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
    return { data, error };
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    const { data, error } = await supabase.rpc(
        'update_order_status',
        {
            order_id: orderId,
            new_status: newStatus,
            status_message: `Order status changed to ${newStatus}`
        }
    );
    return { data, error };
}
```

### 2. Create Order Management UI
- Order list page
- Order detail page
- Status update form
- Tracking page

### 3. Implement Payment Integration
- MTN Mobile Money
- Vodafone Cash
- Bank transfer
- Cash on Delivery

### 4. Set Up Notifications
- Email order confirmations
- SMS tracking updates
- Push notifications (future)

---

## 🎓 Learning Resources

- [Supabase SQL Documentation](https://supabase.com/docs/reference/sql)
- [PostgreSQL Triggers Guide](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design Best Practices](https://supabase.com/docs/guides/database)

---

## ✅ Implementation Checklist

- [ ] Access Supabase SQL Editor
- [ ] Copy DATABASE-SCHEMA.sql
- [ ] Paste into SQL Editor
- [ ] Run the schema
- [ ] Verify all tables created
- [ ] Check views are working
- [ ] Test with sample data
- [ ] Verify RLS policies enabled
- [ ] Create order management UI
- [ ] Test order flow end-to-end
- [ ] Set up payment processing
- [ ] Deploy to production

---

## 📞 Support

If you encounter issues:

1. Check the error message in Supabase console
2. Review the troubleshooting section above
3. Check your seller_id and product_id values exist
4. Verify foreign key relationships
5. Review PostgreSQL documentation

---

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** 2024
