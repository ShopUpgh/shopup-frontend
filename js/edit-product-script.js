// ShopUp Edit Product JavaScript

let selectedImages = [];
let currentProduct = null;
let productId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    checkAuth();
    
    // Load seller info
    loadSellerInfo();
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id') || localStorage.getItem('editing_product_id');
    
    if (!productId) {
        showToast('Product not found');
        setTimeout(() => window.location.href = 'products.html', 2000);
        return;
    }
    
    // Load product data
    loadProduct(productId);
    
    // Initialize image upload
    initializeImageUpload();
    
    // Set up form handlers
    setupFormHandlers();
});

function checkAuth() {
    const seller = localStorage.getItem('shopup_seller') || sessionStorage.getItem('shopup_seller');
    if (!seller) {
        window.location.href = 'login.html';
    }
}

function loadSellerInfo() {
    const sellerData = JSON.parse(localStorage.getItem('shopup_seller') || sessionStorage.getItem('shopup_seller'));
    if (sellerData) {
        document.getElementById('storeName').textContent = sellerData.businessName || 'My Store';
    }
}

// Load product data
function loadProduct(id) {
    const products = JSON.parse(localStorage.getItem('shopup_products')) || [];
    currentProduct = products.find(p => p.id === id);
    
    if (!currentProduct) {
        showToast('Product not found');
        setTimeout(() => window.location.href = 'products.html', 2000);
        return;
    }
    
    // Populate form
    document.getElementById('productName').value = currentProduct.name;
    document.getElementById('description').value = currentProduct.description;
    document.getElementById('category').value = currentProduct.category;
    document.getElementById('condition').value = currentProduct.condition;
    document.getElementById('price').value = currentProduct.price;
    document.getElementById('comparePrice').value = currentProduct.comparePrice || '';
    document.getElementById('quantity').value = currentProduct.quantity;
    document.getElementById('sku').value = currentProduct.sku || '';
    document.getElementById('shippingNote').value = currentProduct.shippingNote || '';
    
    // Load existing images
    if (currentProduct.images && currentProduct.images.length > 0) {
        selectedImages = currentProduct.images.map(dataUrl => ({
            dataUrl: dataUrl,
            existing: true
        }));
        displayImagePreviews();
    }
}

// Image upload (same as add-product)
function initializeImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    
    uploadArea.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => handleImageFiles(e.target.files));
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleImageFiles(e.dataTransfer.files);
    });
}

function handleImageFiles(files) {
    const maxImages = 5;
    const maxSize = 5 * 1024 * 1024;
    
    if (selectedImages.length >= maxImages) {
        showToast(`Maximum ${maxImages} images allowed`);
        return;
    }
    
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload only image files');
            return;
        }
        
        if (file.size > maxSize) {
            showToast('Image size must be less than 5MB');
            return;
        }
        
        if (selectedImages.length >= maxImages) {
            showToast(`Maximum ${maxImages} images allowed`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImages.push({
                dataUrl: e.target.result,
                existing: false
            });
            displayImagePreviews();
        };
        reader.readAsDataURL(file);
    });
}

function displayImagePreviews() {
    const container = document.getElementById('imagePreview');
    container.innerHTML = '';
    
    selectedImages.forEach((image, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview';
        
        const img = document.createElement('img');
        img.src = image.dataUrl;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.onclick = () => removeImage(index);
        
        previewDiv.appendChild(img);
        previewDiv.appendChild(removeBtn);
        container.appendChild(previewDiv);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    displayImagePreviews();
}

// Set up form handlers
function setupFormHandlers() {
    const form = document.getElementById('productForm');
    const cancelBtn = document.getElementById('cancelBtn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleProductUpdate();
    });
    
    cancelBtn.addEventListener('click', () => {
        if (confirm('Discard changes?')) {
            window.location.href = 'products.html';
        }
    });
}

// Handle product update
async function handleProductUpdate() {
    const saveBtn = document.getElementById('saveBtn');
    
    saveBtn.disabled = true;
    saveBtn.textContent = 'Updating...';
    
    try {
        const updatedProduct = {
            ...currentProduct,
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('description').value.trim(),
            category: document.getElementById('category').value,
            condition: document.getElementById('condition').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            comparePrice: parseFloat(document.getElementById('comparePrice').value) || null,
            quantity: parseInt(document.getElementById('quantity').value) || 0,
            sku: document.getElementById('sku').value.trim() || null,
            shippingNote: document.getElementById('shippingNote').value.trim() || '',
            images: selectedImages.map(img => img.dataUrl),
            updatedAt: new Date().toISOString()
        };
        
        // Validate
        if (!updatedProduct.name || !updatedProduct.description || !updatedProduct.category) {
            showToast('Please fill in all required fields');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Update Product';
            return;
        }
        
        if (updatedProduct.price <= 0) {
            showToast('Please enter a valid price');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Update Product';
            return;
        }
        
        // Update in storage
        await updateProduct(updatedProduct);
        
        showToast('✓ Product updated successfully!');
        
        setTimeout(() => {
            window.location.href = 'products.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Failed to update product');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Update Product';
    }
}

// Update product in storage
async function updateProduct(updatedProduct) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const products = JSON.parse(localStorage.getItem('shopup_products')) || [];
            const index = products.findIndex(p => p.id === updatedProduct.id);
            
            if (index !== -1) {
                products[index] = updatedProduct;
                localStorage.setItem('shopup_products', JSON.stringify(products));
            }
            
            resolve();
        }, 1000);
    });
}

// Show toast
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

console.log('Edit Product page loaded');
