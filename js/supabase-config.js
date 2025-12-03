// ShopUp Supabase Configuration
// This file connects your frontend to Supabase backend

// ============================================
// SUPABASE SETUP INSTRUCTIONS
// ============================================

/*
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Name: ShopUp
   - Database Password: (choose a strong password)
   - Region: (choose closest to Ghana - Europe West recommended)
4. Wait for project to be created (2-3 minutes)

5. Get your credentials:
   - Go to Settings > API
   - Copy "Project URL" (looks like: https://xxxxx.supabase.co)
   - Copy "anon public" key (long string starting with eyJ...)

6. Run the SQL schema:
   - Go to SQL Editor in Supabase
   - Click "New Query"
   - Copy and paste entire database-schema.sql
   - Click "Run"

7. Enable Storage (for images):
   - Go to Storage
   - Click "New Bucket"
   - Name: "product-images"
   - Make it PUBLIC
   - Click "Create bucket"

8. Replace the values below with your actual credentials
*/

// ============================================
// SUPABASE CONFIGURATION
// ============================================

const SUPABASE_CONFIG = {
    // Replace these with YOUR actual Supabase credentials
    url: 'https://brbewkxpvihnsrbrlpzq.supabase.co',  // Your Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4',  // Your anon/public key
    
    // Storage bucket name for product images
    storageBucket: 'product-images'
};

// ============================================
// INITIALIZE SUPABASE CLIENT
// ============================================

// Load Supabase from CDN (add this to your HTML files)
/*
Add this to the <head> of your HTML files:
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
*/

let supabase;

function initSupabase() {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined' && typeof window.createClient === 'undefined') {
        console.error('Supabase library not loaded. Add the CDN script to your HTML.');
        return null;
    }

    // Use the correct createClient function
    const createClient = window.supabase?.createClient || window.createClient;

    if (!createClient) {
        console.error('createClient function not found');
        return null;
    }

    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    // IMPORTANT: Expose to global scope so other scripts can access it
    window.supabase = supabase;

    console.log('✅ Supabase initialized successfully');
    return supabase;
}

// Initialize Supabase client immediately when script loads
// This ensures it's available before other scripts try to use it
if (typeof window !== 'undefined') {
    // Try to initialize right away if CDN is already loaded
    initSupabase();

    // If that fails, try again in 100ms (CDN might still be loading)
    if (!window.supabase) {
        setTimeout(() => {
            initSupabase();
        }, 100);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get current user
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

// Check if user is authenticated
async function isAuthenticated() {
    const user = await getCurrentUser();
    return !!user;
}

// Sign out
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error signing out:', error);
        return false;
    }
    return true;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Sign up new seller
async function signUpSeller(sellerData) {
    try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: sellerData.email,
            password: sellerData.password,
            options: {
                data: {
                    business_name: sellerData.businessName,
                    first_name: sellerData.firstName,
                    last_name: sellerData.lastName
                }
            }
        });
        
        if (authError) throw authError;
        
        // 2. Create seller profile
        const storeSlug = sellerData.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        const { data: sellerProfile, error: profileError } = await supabase
            .from('sellers')
            .insert([{
                id: authData.user.id,
                email: sellerData.email,
                password_hash: 'managed-by-supabase-auth',
                business_name: sellerData.businessName,
                first_name: sellerData.firstName,
                last_name: sellerData.lastName,
                phone: sellerData.phone,
                city: sellerData.city,
                region: sellerData.region,
                business_category: sellerData.businessCategory,
                store_slug: storeSlug
            }])
            .select()
            .single();
        
        if (profileError) throw profileError;
        
        return { success: true, data: sellerProfile };
        
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in seller
async function signInSeller(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Get seller profile
        const { data: sellerProfile, error: profileError } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) throw profileError;
        
        return { success: true, data: sellerProfile };
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PRODUCTS FUNCTIONS
// ============================================

// Create product
async function createProduct(productData) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('products')
            .insert([{
                seller_id: user.id,
                name: productData.name,
                description: productData.description,
                category: productData.category,
                condition: productData.condition,
                price: productData.price,
                compare_price: productData.comparePrice,
                quantity: productData.quantity,
                sku: productData.sku,
                shipping_note: productData.shippingNote,
                images: productData.images,
                status: 'active'
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Create product error:', error);
        return { success: false, error: error.message };
    }
}

// Get all products for seller
async function getSellerProducts() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Get products error:', error);
        return { success: false, error: error.message };
    }
}

// Update product
async function updateProduct(productId, updates) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
            .eq('seller_id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Update product error:', error);
        return { success: false, error: error.message };
    }
}

// Delete product
async function deleteProduct(productId) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('seller_id', user.id);
        
        if (error) throw error;
        
        return { success: true };
        
    } catch (error) {
        console.error('Delete product error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// ORDERS FUNCTIONS
// ============================================

// Create order
async function createOrder(orderData) {
    try {
        const orderNumber = 'ORD-' + Date.now();
        
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                seller_id: orderData.sellerId,
                order_number: orderNumber,
                customer_name: orderData.customerName,
                customer_phone: orderData.customerPhone,
                customer_email: orderData.customerEmail,
                shipping_address: orderData.shippingAddress,
                payment_method: orderData.paymentMethod,
                total_amount: orderData.totalAmount,
                notes: orderData.notes,
                status: 'pending'
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Insert order items
        if (orderData.items && orderData.items.length > 0) {
            const items = orderData.items.map(item => ({
                order_id: data.id,
                product_id: item.productId,
                product_name: item.name,
                product_price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity,
                product_image: item.image
            }));
            
            await supabase.from('order_items').insert(items);
        }
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Create order error:', error);
        return { success: false, error: error.message };
    }
}

// Get seller orders
async function getSellerOrders() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*)
            `)
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Get orders error:', error);
        return { success: false, error: error.message };
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)
            .eq('seller_id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
        
    } catch (error) {
        console.error('Update order status error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// IMAGE UPLOAD FUNCTIONS
// ============================================

// Upload image to Supabase Storage
async function uploadProductImage(file) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        // Upload file
        const { data, error } = await supabase.storage
            .from(SUPABASE_CONFIG.storageBucket)
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from(SUPABASE_CONFIG.storageBucket)
            .getPublicUrl(fileName);
        
        return { success: true, url: urlData.publicUrl };
        
    } catch (error) {
        console.error('Image upload error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

// Make functions available globally
if (typeof window !== 'undefined') {
    window.SupabaseAPI = {
        // Config
        initSupabase,
        
        // Auth
        getCurrentUser,
        isAuthenticated,
        signOut,
        signUpSeller,
        signInSeller,
        
        // Products
        createProduct,
        getSellerProducts,
        updateProduct,
        deleteProduct,
        
        // Orders
        createOrder,
        getSellerOrders,
        updateOrderStatus,
        
        // Images
        uploadProductImage
    };
}

console.log('Supabase API loaded. Remember to add your credentials!');
