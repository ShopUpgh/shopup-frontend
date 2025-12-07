// ShopUp Add Product with Supabase Integration

let currentUser = null;
let uploadedImages = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    await waitForSupabase();
    
    // Check authentication
    currentUser = await checkAuth();
    if (!currentUser) return;
    
    // Load seller info
    await loadSellerInfo();
    
    // Set up event listeners
    setupEventListeners();
});

// Wait for Supabase
async function waitForSupabase() {
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('Supabase not loaded');
        return;
    }
    
    // Wait extra time for session to be available
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Supabase ready for add product');
}

// Check authentication
async function checkAuth() {
    try {
        // First check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
        }
        
        if (!session) {
            console.log('No session found, redirecting to login');
            window.location.href = 'login.html';
            return null;
        }
        
        console.log('Session found:', session.user.id);
        
        // Now get user
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            console.log('User error, redirecting to login');
            window.location.href = 'login.html';
            return null;
        }
        
        console.log('User authenticated for add-product:', user.id);
        return user;
    } catch (error) {
        window.location.href = 'login.html';
        return null;
    }
}

// Load seller info
async function loadSellerInfo() {
    try {
        const { data: seller } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (seller) {
            const storeNameEl = document.getElementById('storeName');
            const userNameEl = document.getElementById('userName');
            if (storeNameEl) storeNameEl.textContent = seller.business_name || 'My Store';
            if (userNameEl) userNameEl.textContent = seller.first_name || 'Seller';
        }
    } catch (error) {
        console.error('Error loading seller info:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleSubmit);
    }
    
    // Image upload
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Price calculation
    const priceInput = document.getElementById('price');
    const comparePriceInput = document.getElementById('comparePrice');
    
    if (priceInput) {
        priceInput.addEventListener('input', calculateSavings);
    }
    if (comparePriceInput) {
        comparePriceInput.addEventListener('input', calculateSavings);
    }
    
    // Real-time character count
    const descriptionInput = document.getElementById('description');
    if (descriptionInput) {
        descriptionInput.addEventListener('input', updateCharCount);
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
                window.location.href = 'products.html';
            }
        });
    }
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('saveBtn');
    const originalText = submitBtn.textContent;
    
    try {
        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        // Get form data
        const formData = {
            seller_id: currentUser.id,
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('description').value.trim(),
            category: document.getElementById('category').value,
            condition: document.getElementById('condition').value,
            price: parseFloat(document.getElementById('price').value),
            compare_price: parseFloat(document.getElementById('comparePrice').value) || null,
            quantity: parseInt(document.getElementById('quantity').value),
            sku: document.getElementById('sku').value.trim() || null,
            shipping_note: document.getElementById('shippingNote').value.trim() || null,
            images: uploadedImages,
            status: 'active'
        };
        
        console.log('Creating product:', formData);
        
        // Insert into Supabase
        const { data, error } = await supabase
            .from('products')
            .insert([formData])
            .select()
            .single();
        
        if (error) throw error;
        
        console.log('Product created:', data);

        // Show success message
        showToast('✓ Product added successfully!');

        // Update navigation counts
        if (window.updateNavigationCounts) {
            await window.updateNavigationCounts();
        }

        // Redirect to products page
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('❌ Error adding product: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle image upload
async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (uploadedImages.length + files.length > maxFiles) {
        showToast(`❌ Maximum ${maxFiles} images allowed`);
        return;
    }
    
    for (const file of files) {
        if (file.size > maxSize) {
            showToast(`❌ ${file.name} is too large (max 5MB)`);
            continue;
        }
        
        try {
            // For now, convert to base64 for local storage
            // TODO: Upload to Supabase Storage when configured
            const base64 = await fileToBase64(file);
            uploadedImages.push(base64);
            
            // Display preview
            displayImagePreview(base64, uploadedImages.length - 1);
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('❌ Error uploading ' + file.name);
        }
    }
    
    updateImageCount();
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Display image preview
function displayImagePreview(imageUrl, index) {
    const previewContainer = document.getElementById('imagePreview');
    
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.innerHTML = `
        <img src="${imageUrl}" alt="Preview ${index + 1}">
        <button type="button" class="remove-image" data-index="${index}">✕</button>
    `;
    
    previewContainer.appendChild(previewItem);
    
    // Add remove listener
    previewItem.querySelector('.remove-image').addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        removeImage(idx);
    });
}

// Remove image
function removeImage(index) {
    uploadedImages.splice(index, 1);
    
    // Refresh preview
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';
    
    uploadedImages.forEach((img, idx) => {
        displayImagePreview(img, idx);
    });
    
    updateImageCount();
}

// Update image count
function updateImageCount() {
    const countEl = document.getElementById('imageCount');
    if (countEl) {
        countEl.textContent = `${uploadedImages.length}/5 images`;
    }
}

// Calculate savings
function calculateSavings() {
    const price = parseFloat(document.getElementById('price').value) || 0;
    const comparePrice = parseFloat(document.getElementById('comparePrice').value) || 0;
    
    const savingsEl = document.getElementById('savingsAmount');
    
    if (comparePrice > price) {
        const savings = comparePrice - price;
        const percentage = ((savings / comparePrice) * 100).toFixed(0);
        savingsEl.textContent = `Save GH₵ ${savings.toFixed(2)} (${percentage}%)`;
        savingsEl.style.display = 'block';
    } else {
        savingsEl.style.display = 'none';
    }
}

// Update character count
function updateCharCount() {
    const description = document.getElementById('description').value;
    const charCount = document.getElementById('charCount');
    const remaining = 500 - description.length;
    
    charCount.textContent = `${remaining} characters remaining`;
    
    if (remaining < 50) {
        charCount.style.color = '#e74c3c';
    } else {
        charCount.style.color = '#7f8c8d';
    }
}

// Show toast
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

console.log('Add product script loaded with Supabase integration');