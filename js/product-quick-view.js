/**
 * Product Quick View Modal for ShopUp Ghana
 * 
 * Allows users to view product details in a modal popup without leaving the current page.
 * Improves browsing experience and reduces page loads.
 * 
 * Features:
 * - Modal popup with product details
 * - Image gallery with thumbnails
 * - Add to cart from modal
 * - Keyboard navigation (Escape to close, arrows for images)
 * - Mobile responsive
 * - Smooth animations
 * 
 * Usage:
 * Add data-quick-view="product-id" to product cards or buttons
 * <button data-quick-view="123">Quick View</button>
 * 
 * Zero Cost: Pure CSS/JavaScript, no external dependencies
 */

(function() {
    'use strict';

    class ProductQuickView {
        constructor() {
            this.modal = null;
            this.currentProductId = null;
            this.currentImageIndex = 0;
            this.productImages = [];
            
            this.init();
        }

        init() {
            this.createModal();
            this.attachEventListeners();
            this.injectStyles();
        }

        /**
         * Create modal HTML structure
         */
        createModal() {
            const modal = document.createElement('div');
            modal.id = 'quick-view-modal';
            modal.className = 'quick-view-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'quick-view-title');
            
            modal.innerHTML = `
                <div class="quick-view-overlay"></div>
                <div class="quick-view-content">
                    <button class="quick-view-close" aria-label="Close quick view">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    
                    <div class="quick-view-body">
                        <div class="quick-view-images">
                            <div class="quick-view-main-image">
                                <img src="" alt="" id="quick-view-main-img">
                                <button class="quick-view-nav quick-view-prev" aria-label="Previous image">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M15 18l-6-6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                                <button class="quick-view-nav quick-view-next" aria-label="Next image">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="quick-view-thumbnails" id="quick-view-thumbnails"></div>
                        </div>
                        
                        <div class="quick-view-details">
                            <h2 id="quick-view-title" class="quick-view-product-name"></h2>
                            <div class="quick-view-price"></div>
                            <div class="quick-view-rating"></div>
                            <div class="quick-view-description"></div>
                            <div class="quick-view-meta">
                                <div class="quick-view-category"></div>
                                <div class="quick-view-stock"></div>
                            </div>
                            <div class="quick-view-actions">
                                <div class="quick-view-quantity">
                                    <button class="qty-btn qty-minus">-</button>
                                    <input type="number" value="1" min="1" class="qty-input" id="quick-view-qty">
                                    <button class="qty-btn qty-plus">+</button>
                                </div>
                                <button class="quick-view-add-to-cart btn-primary">Add to Cart</button>
                                <button class="quick-view-view-full">View Full Details</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="quick-view-loading">
                        <div class="spinner"></div>
                        <p>Loading product...</p>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.modal = modal;
        }

        /**
         * Attach event listeners
         */
        attachEventListeners() {
            // Quick view triggers
            document.addEventListener('click', (e) => {
                const trigger = e.target.closest('[data-quick-view]');
                if (trigger) {
                    e.preventDefault();
                    const productId = trigger.getAttribute('data-quick-view');
                    this.openQuickView(productId);
                }
            });

            // Close button
            const closeBtn = this.modal.querySelector('.quick-view-close');
            closeBtn.addEventListener('click', () => this.close());

            // Overlay click
            const overlay = this.modal.querySelector('.quick-view-overlay');
            overlay.addEventListener('click', () => this.close());

            // Image navigation
            const prevBtn = this.modal.querySelector('.quick-view-prev');
            const nextBtn = this.modal.querySelector('.quick-view-next');
            prevBtn.addEventListener('click', () => this.previousImage());
            nextBtn.addEventListener('click', () => this.nextImage());

            // Quantity controls
            const minusBtn = this.modal.querySelector('.qty-minus');
            const plusBtn = this.modal.querySelector('.qty-plus');
            const qtyInput = this.modal.querySelector('.qty-input');
            
            minusBtn.addEventListener('click', () => {
                const val = parseInt(qtyInput.value) || 1;
                if (val > 1) qtyInput.value = val - 1;
            });
            
            plusBtn.addEventListener('click', () => {
                const val = parseInt(qtyInput.value) || 1;
                qtyInput.value = val + 1;
            });

            // Add to cart
            const addToCartBtn = this.modal.querySelector('.quick-view-add-to-cart');
            addToCartBtn.addEventListener('click', () => this.addToCart());

            // View full details
            const viewFullBtn = this.modal.querySelector('.quick-view-view-full');
            viewFullBtn.addEventListener('click', () => this.viewFullDetails());

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!this.modal.classList.contains('active')) return;
                
                switch(e.key) {
                    case 'Escape':
                        this.close();
                        break;
                    case 'ArrowLeft':
                        this.previousImage();
                        break;
                    case 'ArrowRight':
                        this.nextImage();
                        break;
                }
            });
        }

        /**
         * Open quick view for a product
         */
        async openQuickView(productId) {
            this.currentProductId = productId;
            this.modal.classList.add('active');
            this.showLoading();
            document.body.style.overflow = 'hidden';

            try {
                const product = await this.fetchProduct(productId);
                this.renderProduct(product);
                this.hideLoading();
            } catch (error) {
                console.error('Error loading product:', error);
                this.showError('Failed to load product details');
            }
        }

        /**
         * Close quick view
         */
        close() {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
            this.currentProductId = null;
            this.currentImageIndex = 0;
        }

        /**
         * Fetch product data
         */
        async fetchProduct(productId) {
            // Try Supabase first
            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                
                if (!error) return data;
            }

            // Fallback: scrape from page
            const productCard = document.querySelector(`[data-product-id="${productId}"]`);
            if (productCard) {
                return this.extractProductFromCard(productCard);
            }

            throw new Error('Product not found');
        }

        /**
         * Extract product data from product card
         */
        extractProductFromCard(card) {
            return {
                id: card.getAttribute('data-product-id'),
                name: card.querySelector('.product-name, .product-title, h3, h4')?.textContent?.trim() || 'Unknown Product',
                price: card.querySelector('.product-price, .price')?.textContent?.trim() || 'GH₵ 0.00',
                description: card.querySelector('.product-description, .description')?.textContent?.trim() || 'No description available',
                image_url: card.querySelector('img')?.src || '',
                images: [card.querySelector('img')?.src].filter(Boolean),
                category: card.querySelector('.product-category, .category')?.textContent?.trim() || 'Uncategorized',
                stock: card.querySelector('.stock')?.textContent?.trim() || 'In Stock',
                rating: 4.5 // Default
            };
        }

        /**
         * Render product in modal
         */
        renderProduct(product) {
            // Images
            this.productImages = product.images || [product.image_url].filter(Boolean);
            if (this.productImages.length === 0) {
                this.productImages = ['/images/placeholder.png'];
            }
            
            this.renderImages();

            // Details
            this.modal.querySelector('.quick-view-product-name').textContent = product.name;
            this.modal.querySelector('.quick-view-price').innerHTML = `<span class="price">${product.price}</span>`;
            this.modal.querySelector('.quick-view-description').textContent = product.description;
            this.modal.querySelector('.quick-view-category').innerHTML = `<strong>Category:</strong> ${product.category}`;
            this.modal.querySelector('.quick-view-stock').innerHTML = `<strong>Availability:</strong> <span class="stock-status">${product.stock}</span>`;
            
            // Rating
            const rating = product.rating || 0;
            this.modal.querySelector('.quick-view-rating').innerHTML = this.renderStars(rating);
        }

        /**
         * Render images
         */
        renderImages() {
            const mainImg = this.modal.querySelector('#quick-view-main-img');
            const thumbnails = this.modal.querySelector('#quick-view-thumbnails');
            
            mainImg.src = this.productImages[this.currentImageIndex];
            mainImg.alt = 'Product image';
            
            // Render thumbnails
            thumbnails.innerHTML = this.productImages.map((img, index) => `
                <img src="${img}" 
                     alt="Thumbnail ${index + 1}" 
                     class="quick-view-thumb ${index === this.currentImageIndex ? 'active' : ''}"
                     data-index="${index}">
            `).join('');
            
            // Thumbnail clicks
            thumbnails.querySelectorAll('.quick-view-thumb').forEach(thumb => {
                thumb.addEventListener('click', () => {
                    this.currentImageIndex = parseInt(thumb.getAttribute('data-index'));
                    this.renderImages();
                });
            });

            // Show/hide navigation buttons
            const prevBtn = this.modal.querySelector('.quick-view-prev');
            const nextBtn = this.modal.querySelector('.quick-view-next');
            prevBtn.style.display = this.productImages.length > 1 ? 'flex' : 'none';
            nextBtn.style.display = this.productImages.length > 1 ? 'flex' : 'none';
        }

        /**
         * Navigate to previous image
         */
        previousImage() {
            if (this.productImages.length <= 1) return;
            this.currentImageIndex = (this.currentImageIndex - 1 + this.productImages.length) % this.productImages.length;
            this.renderImages();
        }

        /**
         * Navigate to next image
         */
        nextImage() {
            if (this.productImages.length <= 1) return;
            this.currentImageIndex = (this.currentImageIndex + 1) % this.productImages.length;
            this.renderImages();
        }

        /**
         * Add product to cart
         */
        addToCart() {
            const qty = parseInt(this.modal.querySelector('.qty-input').value) || 1;
            
            // Dispatch event for cart to handle
            window.dispatchEvent(new CustomEvent('addToCart', {
                detail: {
                    productId: this.currentProductId,
                    quantity: qty,
                    source: 'quick-view'
                }
            }));

            // Show feedback
            const btn = this.modal.querySelector('.quick-view-add-to-cart');
            const originalText = btn.textContent;
            btn.textContent = 'Added!';
            btn.style.backgroundColor = '#10b981';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
            }, 2000);
        }

        /**
         * View full product details
         */
        viewFullDetails() {
            window.location.href = `/product.html?id=${this.currentProductId}`;
        }

        /**
         * Render star rating
         */
        renderStars(rating) {
            const fullStars = Math.floor(rating);
            const hasHalf = rating % 1 >= 0.5;
            const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
            
            let html = '<div class="rating-stars">';
            for (let i = 0; i < fullStars; i++) {
                html += '★';
            }
            if (hasHalf) {
                html += '☆';
            }
            for (let i = 0; i < emptyStars; i++) {
                html += '☆';
            }
            html += ` <span class="rating-value">${rating.toFixed(1)}</span></div>`;
            return html;
        }

        /**
         * Show loading state
         */
        showLoading() {
            this.modal.querySelector('.quick-view-loading').style.display = 'flex';
            this.modal.querySelector('.quick-view-body').style.display = 'none';
        }

        /**
         * Hide loading state
         */
        hideLoading() {
            this.modal.querySelector('.quick-view-loading').style.display = 'none';
            this.modal.querySelector('.quick-view-body').style.display = 'grid';
        }

        /**
         * Show error message
         */
        showError(message) {
            this.modal.querySelector('.quick-view-loading').innerHTML = `
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="window.productQuickView.close()">Close</button>
                </div>
            `;
        }

        /**
         * Inject CSS styles
         */
        injectStyles() {
            if (document.getElementById('quick-view-styles')) return;

            const style = document.createElement('style');
            style.id = 'quick-view-styles';
            style.textContent = `
                .quick-view-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .quick-view-modal.active {
                    display: flex;
                }

                .quick-view-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.75);
                    animation: fadeIn 0.3s ease;
                }

                .quick-view-content {
                    position: relative;
                    background: white;
                    border-radius: 12px;
                    max-width: 1000px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .quick-view-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    z-index: 10;
                    transition: transform 0.2s;
                }

                .quick-view-close:hover {
                    transform: scale(1.1);
                }

                .quick-view-body {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    padding: 30px;
                }

                .quick-view-main-image {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1;
                    background: #f5f5f5;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .quick-view-main-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .quick-view-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.9);
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .quick-view-nav:hover {
                    background: white;
                }

                .quick-view-prev {
                    left: 10px;
                }

                .quick-view-next {
                    right: 10px;
                }

                .quick-view-thumbnails {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    overflow-x: auto;
                }

                .quick-view-thumb {
                    width: 60px;
                    height: 60px;
                    object-fit: cover;
                    border-radius: 6px;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: border-color 0.2s;
                }

                .quick-view-thumb.active,
                .quick-view-thumb:hover {
                    border-color: #f97316;
                }

                .quick-view-product-name {
                    font-size: 24px;
                    font-weight: bold;
                    margin: 0 0 15px 0;
                    color: #1f2937;
                }

                .quick-view-price {
                    font-size: 28px;
                    font-weight: bold;
                    color: #f97316;
                    margin-bottom: 15px;
                }

                .quick-view-rating {
                    margin-bottom: 15px;
                }

                .rating-stars {
                    color: #fbbf24;
                    font-size: 20px;
                }

                .rating-value {
                    color: #6b7280;
                    font-size: 14px;
                    margin-left: 5px;
                }

                .quick-view-description {
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 20px;
                }

                .quick-view-meta {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 25px;
                    padding: 15px;
                    background: #f9fafb;
                    border-radius: 8px;
                }

                .quick-view-meta > div {
                    color: #374151;
                    font-size: 14px;
                }

                .stock-status {
                    color: #10b981;
                    font-weight: 600;
                }

                .quick-view-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .quick-view-quantity {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .qty-btn {
                    width: 36px;
                    height: 36px;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 18px;
                    transition: background 0.2s;
                }

                .qty-btn:hover {
                    background: #f3f4f6;
                }

                .qty-input {
                    width: 60px;
                    height: 36px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    text-align: center;
                    font-size: 16px;
                }

                .quick-view-add-to-cart {
                    background: #f97316;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .quick-view-add-to-cart:hover {
                    background: #ea580c;
                }

                .quick-view-view-full {
                    background: transparent;
                    color: #f97316;
                    border: 2px solid #f97316;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-view-view-full:hover {
                    background: #f97316;
                    color: white;
                }

                .quick-view-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px;
                }

                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f4f6;
                    border-top-color: #f97316;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .quick-view-body {
                        grid-template-columns: 1fr;
                        gap: 20px;
                        padding: 20px;
                    }

                    .quick-view-product-name {
                        font-size: 20px;
                    }

                    .quick-view-price {
                        font-size: 24px;
                    }
                }

                /* Dark mode support */
                [data-theme="dark"] .quick-view-content {
                    background: #1f2937;
                    color: #f9fafb;
                }

                [data-theme="dark"] .quick-view-product-name {
                    color: #f9fafb;
                }

                [data-theme="dark"] .quick-view-description {
                    color: #d1d5db;
                }

                [data-theme="dark"] .quick-view-meta {
                    background: #374151;
                }

                [data-theme="dark"] .qty-btn,
                [data-theme="dark"] .qty-input {
                    background: #374151;
                    border-color: #4b5563;
                    color: #f9fafb;
                }
            `;
            
            document.head.appendChild(style);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.productQuickView = new ProductQuickView();
        });
    } else {
        window.productQuickView = new ProductQuickView();
    }

})();
