// Social Share Feature for ShopUp Ghana
// Zero-cost feature to enable social sharing of products

const SocialShare = {
    /**
     * Initialize social share buttons
     */
    init: function() {
        // Add share buttons to product pages
        this.addShareButtons();
        
        console.log('✅ Social Share initialized');
    },
    
    /**
     * Share on WhatsApp
     * @param {Object} data - Product data {title, url, price}
     */
    shareWhatsApp: function(data) {
        const text = `Check out this product on ShopUp Ghana!\n\n${data.title}\nPrice: ${data.price}\n\n${data.url}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    },
    
    /**
     * Share on Facebook
     * @param {string} url - URL to share
     */
    shareFacebook: function(url) {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
    },
    
    /**
     * Share on Twitter
     * @param {Object} data - Product data {title, url, hashtags}
     */
    shareTwitter: function(data) {
        const text = `Check out ${data.title} on ShopUp Ghana!`;
        const hashtags = data.hashtags || 'ShopUpGhana,OnlineShopping';
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.url)}&hashtags=${hashtags}`;
        window.open(url, '_blank', 'width=600,height=400');
    },
    
    /**
     * Copy link to clipboard
     * @param {string} url - URL to copy
     */
    copyLink: async function(url) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                if (window.ErrorHandler) {
                    window.ErrorHandler.showSuccess('Link copied to clipboard! 📋');
                } else {
                    alert('Link copied to clipboard!');
                }
            } else {
                // Fallback for older browsers
                const input = document.createElement('input');
                input.value = url;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                alert('Link copied!');
            }
        } catch (error) {
            console.error('Could not copy link:', error);
            alert('Could not copy link. Please copy manually: ' + url);
        }
    },
    
    /**
     * Native share (mobile devices)
     * @param {Object} data - Share data {title, text, url}
     */
    nativeShare: async function(data) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: data.text || `Check out ${data.title} on ShopUp Ghana!`,
                    url: data.url
                });
                console.log('Shared successfully');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        } else {
            // Fall back to copy link
            this.copyLink(data.url);
        }
    },
    
    /**
     * Add share buttons to products
     */
    addShareButtons: function() {
        // Find product containers
        const products = document.querySelectorAll('.product-card, .product-detail');
        
        products.forEach(product => {
            // Skip if already has share button
            if (product.querySelector('.share-btn')) return;
            
            // Get product data
            const productId = product.getAttribute('data-product-id');
            const productTitle = product.querySelector('.product-name, h1')?.textContent || 'Product';
            const productPrice = product.querySelector('.product-price')?.textContent || '';
            const productUrl = window.location.href;
            
            // Create share button
            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn';
            shareBtn.innerHTML = '🔗';
            shareBtn.title = 'Share this product';
            
            // Create share menu
            const shareMenu = this.createShareMenu({
                title: productTitle,
                price: productPrice,
                url: productUrl
            });
            
            // Add click handler
            shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleShareMenu(shareMenu);
            });
            
            // Add to product
            const container = document.createElement('div');
            container.className = 'share-container';
            container.appendChild(shareBtn);
            container.appendChild(shareMenu);
            
            product.appendChild(container);
        });
        
        // Add styles
        this.addStyles();
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.share-container')) {
                document.querySelectorAll('.share-menu.active').forEach(menu => {
                    menu.classList.remove('active');
                });
            }
        });
    },
    
    /**
     * Create share menu
     */
    createShareMenu: function(data) {
        const menu = document.createElement('div');
        menu.className = 'share-menu';
        menu.innerHTML = `
            <button class="share-option" data-method="whatsapp">
                <span class="icon">💬</span>
                <span>WhatsApp</span>
            </button>
            <button class="share-option" data-method="facebook">
                <span class="icon">📘</span>
                <span>Facebook</span>
            </button>
            <button class="share-option" data-method="twitter">
                <span class="icon">🐦</span>
                <span>Twitter</span>
            </button>
            <button class="share-option" data-method="copy">
                <span class="icon">📋</span>
                <span>Copy Link</span>
            </button>
            ${navigator.share ? '<button class="share-option" data-method="native"><span class="icon">📤</span><span>More...</span></button>' : ''}
        `;
        
        // Add click handlers
        menu.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const method = option.getAttribute('data-method');
                
                switch (method) {
                    case 'whatsapp':
                        this.shareWhatsApp(data);
                        break;
                    case 'facebook':
                        this.shareFacebook(data.url);
                        break;
                    case 'twitter':
                        this.shareTwitter(data);
                        break;
                    case 'copy':
                        this.copyLink(data.url);
                        break;
                    case 'native':
                        this.nativeShare(data);
                        break;
                }
                
                menu.classList.remove('active');
            });
        });
        
        return menu;
    },
    
    /**
     * Toggle share menu visibility
     */
    toggleShareMenu: function(menu) {
        // Close other menus
        document.querySelectorAll('.share-menu.active').forEach(m => {
            if (m !== menu) m.classList.remove('active');
        });
        
        // Toggle this menu
        menu.classList.toggle('active');
    },
    
    /**
     * Add styles
     */
    addStyles: function() {
        if (document.getElementById('social-share-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'social-share-styles';
        style.textContent = `
            .share-container {
                position: relative;
                display: inline-block;
            }
            
            .share-btn {
                background: white;
                border: 1px solid #e0e0e0;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .share-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            .share-menu {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 8px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 8px;
                min-width: 160px;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s;
            }
            
            .share-menu.active {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .share-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px;
                border: none;
                background: none;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                transition: background 0.2s;
            }
            
            .share-option:hover {
                background: #f5f5f5;
            }
            
            .share-option .icon {
                font-size: 18px;
            }
            
            .dark-mode .share-btn {
                background: #2d2d2d;
                border-color: #404040;
                color: #e0e0e0;
            }
            
            .dark-mode .share-menu {
                background: #2d2d2d;
                border: 1px solid #404040;
            }
            
            .dark-mode .share-option:hover {
                background: #3d3d3d;
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SocialShare.init());
} else {
    SocialShare.init();
}

// Make available globally
window.SocialShare = SocialShare;

console.log('✅ Social Share module loaded');
