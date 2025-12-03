# ShopUp Badge Updates - Template for New Scripts

## Overview

Whenever you create a new script that adds, deletes, or modifies products or orders, use this template to automatically update the navigation badges.

---

## The Pattern (Copy-Paste Ready)

After any successful database operation that changes counts:

```javascript
// ✅ After a database operation succeeds
if (window.updateNavigationCounts) {
    await window.updateNavigationCounts();
}
```

That's it! This will:
- Query Supabase for fresh counts
- Update the badges
- Save to localStorage cache
- Log the update to console

---

## Real-World Examples

### Example 1: Create Order Script (`add-order-script.js`)

```javascript
async function createOrder(orderData) {
    try {
        // Your database operation
        const { data: order, error } = await supabase
            .from('orders')
            .insert([{
                seller_id: currentUser.id,
                customer_name: orderData.name,
                customer_phone: orderData.phone,
                customer_email: orderData.email,
                total_amount: orderData.total,
                status: 'pending'
            }]);

        if (error) throw error;

        console.log('✅ Order created:', order.id);

        // ✅ UPDATE BADGES
        if (window.updateNavigationCounts) {
            console.log('📊 Updating badges from add-order-script');
            await window.updateNavigationCounts();
        }

        showToast('✓ Order created successfully');

    } catch (error) {
        console.error('❌ Error creating order:', error);
        showToast('❌ Error creating order');
        // Don't update badges on error
    }
}
```

### Example 2: Delete Product (`edit-product-script.js`)

```javascript
async function deleteProduct(productId) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('seller_id', currentUser.id);

        if (error) throw error;

        console.log('✅ Product deleted:', productId);

        // ✅ UPDATE BADGES
        if (window.updateNavigationCounts) {
            console.log('📊 Updating badges from deleteProduct');
            await window.updateNavigationCounts();
        }

        // Reload UI
        await loadProducts();
        applyFilters();
        showToast('✓ Product deleted successfully');

    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showToast('❌ Error deleting product');
    }
}
```

### Example 3: Bulk Delete Products (`bulk-operations-script.js`)

```javascript
async function bulkDeleteProducts(productIds) {
    try {
        // Delete all products
        for (let id of productIds) {
            await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('seller_id', currentUser.id);
        }

        console.log('✅ Deleted', productIds.length, 'products');

        // ✅ UPDATE BADGES ONCE (after all operations)
        if (window.updateNavigationCounts) {
            console.log('📊 Updating badges after bulk delete');
            await window.updateNavigationCounts();
        }

        showToast(`✓ Deleted ${productIds.length} products`);

    } catch (error) {
        console.error('❌ Error in bulk delete:', error);
        showToast('❌ Error deleting products');
    }
}
```

### Example 4: Edit Product (Only if status changes affect count)

```javascript
async function updateProduct(productId, updates) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
            .eq('seller_id', currentUser.id);

        if (error) throw error;

        console.log('✅ Product updated:', productId);

        // ✅ UPDATE BADGES (if status changed and affects visibility)
        if (updates.status && window.updateNavigationCounts) {
            console.log('📊 Updating badges (status changed)');
            await window.updateNavigationCounts();
        }

        showToast('✓ Product updated successfully');

    } catch (error) {
        console.error('❌ Error updating product:', error);
        showToast('❌ Error updating product');
    }
}
```

### Example 5: Archive/Unarchive Product

```javascript
async function archiveProduct(productId, isArchive) {
    try {
        const { error } = await supabase
            .from('products')
            .update({ archived: isArchive })
            .eq('id', productId)
            .eq('seller_id', currentUser.id);

        if (error) throw error;

        console.log('✅ Product archived:', isArchive);

        // ✅ UPDATE BADGES (archive status affects count)
        if (window.updateNavigationCounts) {
            console.log('📊 Updating badges (archive status changed)');
            await window.updateNavigationCounts();
        }

        showToast(isArchive ? '✓ Product archived' : '✓ Product restored');

    } catch (error) {
        console.error('❌ Error archiving product:', error);
        showToast('❌ Error archiving product');
    }
}
```

---

## Decision Tree

Use this to decide when to call `updateNavigationCounts()`:

```
Did you perform a database operation?
    ↓ YES
    ↓
Did it succeed (no error)?
    ↓ YES
    ↓
Does it affect product/order count?
    ├─ YES: Product created, deleted, archived, etc.
    │   └─ ✅ Call updateNavigationCounts()
    │
    └─ NO: Product edited (name/price), not affecting visibility
        └─ ❌ Don't call updateNavigationCounts()
```

---

## Current Scripts Already Integrated

| Script | Status | Updates Called |
|--------|--------|-----------------|
| add-product-script.js | ✅ | After creating product |
| orders-script.js | ✅ | After updating order status |
| products-generator.js | ✅ | After generating 40 products |
| edit-product-script.js | ⏳ | Could add if deleting |
| customers-script.js | ⏳ | Could add if managing customers |

---

## Testing Your Integration

After adding badge updates to a new script:

### 1. Manual Console Test

```javascript
// Open console (F12) and test the function
await window.updateNavigationCounts();

// Check console output - should show:
// 🔄 Updating navigation counts...
// 📊 Fresh counts: {products: 1, orders: 0}
// ✅ Product badge updated: 1
// ✅ Order badge updated: 0

// Check localStorage
console.log(localStorage.getItem('shopup_nav_counts'));
// Should show: {"products":1,"orders":0,"timestamp":1699...}

// Check badges
console.log(document.getElementById('productCount').textContent);  // Should be "1"
console.log(document.getElementById('orderCount').textContent);    // Should be "0"
```

### 2. Integration Test

1. Perform the action (create product, delete order, etc.)
2. Check console for: `📊 Updating badges from [script-name]`
3. Verify badges updated
4. Navigate to another page
5. Verify counts still correct (loaded from cache)
6. Refresh page
7. Verify counts still correct (from localStorage)

### 3. Error Test

1. Disconnect internet (simulate error)
2. Perform action
3. Should show error in toast
4. Badges should NOT update
5. Reconnect internet
6. Try again
7. Badges should update successfully

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Calling updateNavigationCounts() in a loop

```javascript
// BAD - updates badges 50 times!
for (let i = 0; i < 50; i++) {
    await supabase.from('products').delete()...
    await window.updateNavigationCounts();  // DON'T DO THIS
}
```

### ✅ Fix: Call once after the loop

```javascript
// GOOD - updates badges once
for (let i = 0; i < 50; i++) {
    await supabase.from('products').delete()...
}
// Update once, more efficient
await window.updateNavigationCounts();
```

---

### ❌ Mistake 2: Not checking if function exists

```javascript
// BAD - crashes if shared-nav.js didn't load
await window.updateNavigationCounts();
```

### ✅ Fix: Check first

```javascript
// GOOD - graceful fallback
if (window.updateNavigationCounts) {
    await window.updateNavigationCounts();
} else {
    console.warn('updateNavigationCounts not available');
}
```

---

### ❌ Mistake 3: Updating badges on failed operations

```javascript
// BAD - updates even if error occurred
const { error } = await supabase.from('products').delete()...
await window.updateNavigationCounts();  // Updates even if error!
```

### ✅ Fix: Check for errors first

```javascript
// GOOD - only updates on success
const { error } = await supabase.from('products').delete()...
if (error) throw error;  // Throw before updating badges
await window.updateNavigationCounts();  // Only reached if success
```

---

## Performance Tips

### Tip 1: Batch Operations
```javascript
// Instead of:
for (let id of ids) {
    deleteProduct(id);  // Updates badges 10 times
}

// Do:
async function batchDeleteProducts(ids) {
    for (let id of ids) {
        await supabase.from('products').delete().eq('id', id);
    }
    // Update badges once
    await window.updateNavigationCounts();
}
```

### Tip 2: Use Conditional Updates
```javascript
// If editing product details but not affecting count:
async function editProduct(id, updates) {
    await supabase.from('products').update(updates).eq('id', id);

    // Only update if status changed (affects visibility count)
    if (updates.status && window.updateNavigationCounts) {
        await window.updateNavigationCounts();
    }
}
```

### Tip 3: Add Logging for Debugging
```javascript
async function importProducts(products) {
    console.log(`📦 Importing ${products.length} products...`);

    let imported = 0;
    for (let product of products) {
        const { data, error } = await supabase.from('products').insert([product]);
        if (!error) imported++;
    }

    console.log(`✅ Imported ${imported}/${products.length}`);

    if (window.updateNavigationCounts) {
        console.log('📊 Updating badges after import');
        await window.updateNavigationCounts();
    }
}
```

---

## Checklist for New Scripts

When you create a new script that manages products or orders:

- [ ] Script loads Supabase config and auth
- [ ] Database operations wrapped in try/catch
- [ ] Error handling shows toast message
- [ ] After successful operation, check if count changed
- [ ] If count changed, call updateNavigationCounts()
- [ ] Verified in console that function is available
- [ ] Tested manually to ensure badges update
- [ ] Tested navigation between pages (cache works)
- [ ] Tested page refresh (localStorage works)
- [ ] Added logging to console for debugging

---

## Quick Copy-Paste Template

```javascript
// NEW SCRIPT TEMPLATE
// Copy this for any new script that affects product/order counts

async function myDatabaseOperation() {
    try {
        // Your Supabase operation
        const { data, error } = await supabase
            .from('table_name')
            .method(operationData);

        if (error) throw error;

        console.log('✅ Operation succeeded');

        // ✅ UPDATE BADGES
        if (window.updateNavigationCounts) {
            console.log('📊 Updating badges from my-script');
            await window.updateNavigationCounts();
        }

        showToast('✓ Operation successful');

    } catch (error) {
        console.error('❌ Operation failed:', error);
        showToast('❌ ' + error.message);
        // Don't update badges on error
    }
}
```

---

## Summary

When creating new scripts:

1. **Add badge updates** after database operations that change counts
2. **Check function exists** with `if (window.updateNavigationCounts)`
3. **Use try/catch** to only update on success
4. **Batch operations** - don't update in loops
5. **Test thoroughly** - console, navigation, refresh
6. **Log your calls** for debugging

Your badges will now **stay in sync automatically** across your entire app! 🎉
