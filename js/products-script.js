// products-script-FIXED.js
// Fixed: Removed duplicate currentUser declaration
// Added: Call to updateNavigationCounts after products load

console.log('Products script loaded with Supabase integration');

let supabaseClient = null;
let currentUser = null;

// Initialize when Supabase is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Products page DOM loaded');
    
    // Wait for Supabase to be ready (check every 100ms for up to 5 seconds)
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('Supabase not available');
        return;
    }
    
    supabaseClient = window.supabase;
    console.log('Supabase ready for products');
    
    // Get current user session
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            console.log('Session found:', currentUser.id);
            console.log('User authenticated for products:', currentUser.id);
        } else {
            console.log('No session - user not logged in');
            window.location.href = 'login.html';
            return;
        }
    } catch (error) {
        console.error('Error getting session:', error);
        return;
    }
    
    // Load and display products
    await loadProducts();
    
    // IMPORTANT: Update navigation counts after products load
    if (window.updateNavigationCounts) {
        console.log('Calling updateNavigationCounts from products page');
        await window.updateNavigationCounts();
    } else {
        console.warn('updateNavigationCounts not available yet');
    }
    
    // Setup add product form handler
    setupAddProductForm();
});

// Load products from Supabase
async function loadProducts() {
    try {
        if (!currentUser) {
            console.error('No user - cannot load products');
            return;
        }
        
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('seller_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading products:', error);
            return;
        }
        
        console.log('Loaded ' + products.length + ' products from Supabase');
        
        // Display products in the UI
        displayProducts(products);
        
    } catch (error) {
        console.error('Error in loadProducts:', error);
    }
}

// Display products in the product grid
function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) {
        console.log('Product grid not found on this page');
        return;
    }
    
    if (products.length === 0) {
        productGrid.innerHTML = '<div class="no-products"><p>No products yet. Add your first product to get started!</p></div>';
        return;
    }
    
    // SECURITY: Sanitize product data before display
    productGrid.innerHTML = products.map(product => {
        const safeName = typeof sanitizeHTML === 'function' ? sanitizeHTML(product.name) : product.name;
        const safePrice = parseFloat(product.price).toFixed(2);
        const safeStock = parseInt(product.stock_quantity, 10) || 0;
        const safeImageUrl = product.image_url ? (typeof sanitizeHTML === 'function' ? sanitizeHTML(product.image_url) : product.image_url) : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    ${safeImageUrl ?
                        `<img src="${safeImageUrl}" alt="${safeName}">` :
                        `<div class="no-image">No Image</div>`
                    }
                </div>
                <div class="product-info">
                    <h3>${safeName}</h3>
                    <p class="product-price">GH₵ ${safePrice}</p>
                    <p class="product-stock">Stock: ${safeStock}</p>
                    <div class="product-actions">
                        <button onclick="editProduct('${product.id}')" class="btn-edit">Edit</button>
                        <button onclick="deleteProduct('${product.id}')" class="btn-delete">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Setup add product form handler
function setupAddProductForm() {
    const addForm = document.getElementById('addProductForm');
    if (!addForm) {
        console.log('Add product form not found on this page');
        return;
    }
    
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(addForm);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            category: formData.get('category'),
            condition: formData.get('condition'),
            price: parseFloat(formData.get('price')),
            compare_price: parseFloat(formData.get('compare_price')) || null,
            stock_quantity: parseInt(formData.get('stock_quantity')),
            image_url: formData.get('image_url') || null
        };
        
        try {
            const { data: newProduct, error } = await supabaseClient
                .from('products')
                .insert([{
                    seller_id: currentUser.id,
                    ...productData
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            console.log('Product added successfully');
            alert('Product added successfully!');
            
            // Reset form
            addForm.reset();
            
            // Reload products
            await loadProducts();
            
            // Update navigation counts after adding product
            if (window.updateNavigationCounts) {
                await window.updateNavigationCounts();
            }
            
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product: ' + error.message);
        }
    });
}

// Edit product (placeholder)
window.editProduct = function(productId) {
    console.log('Edit product:', productId);
    window.location.href = `edit-product.html?id=${productId}`;
};

// Delete product
window.deleteProduct = async function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('seller_id', currentUser.id);
        
        if (error) throw error;
        
        console.log('Product deleted successfully');
        alert('Product deleted!');
        
        // Reload products
        await loadProducts();
        
        // Update navigation counts after deleting product
        if (window.updateNavigationCounts) {
            await window.updateNavigationCounts();
        }
        
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
    }
};

console.log('Products script fully loaded');