// Image Lazy Loading for ShopUp Ghana
// Zero-cost feature using native browser API and Intersection Observer
// Improves page load performance significantly

const LazyLoading = {
    // Configuration
    config: {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
        loadingClass: 'lazy-loading',
        loadedClass: 'lazy-loaded',
        errorClass: 'lazy-error'
    },
    
    // Observer instance
    observer: null,
    
    /**
     * Initialize lazy loading
     */
    init: function() {
        // Check for browser support
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading supported
            this.useNativeLazyLoading();
            console.log('✅ Using native lazy loading');
        } else if ('IntersectionObserver' in window) {
            // Use Intersection Observer for older browsers
            this.useIntersectionObserver();
            console.log('✅ Using Intersection Observer for lazy loading');
        } else {
            // Fallback: load all images immediately
            this.loadAllImages();
            console.log('⚠️ Lazy loading not supported, loading all images');
        }
        
        // Watch for dynamically added images
        this.watchForNewImages();
    },
    
    /**
     * Use native lazy loading (modern browsers)
     */
    useNativeLazyLoading: function() {
        const images = document.querySelectorAll('img:not([loading])');
        
        images.forEach(img => {
            // Set native lazy loading
            img.loading = 'lazy';
            
            // Add placeholder if no src
            if (!img.src && img.dataset.src) {
                img.src = img.dataset.src;
            }
            
            // Add load event for fade-in effect
            if (!img.complete) {
                img.classList.add(this.config.loadingClass);
                img.addEventListener('load', () => {
                    img.classList.remove(this.config.loadingClass);
                    img.classList.add(this.config.loadedClass);
                });
            }
        });
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Use Intersection Observer (for older browsers)
     */
    useIntersectionObserver: function() {
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        
        // Create observer
        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        });
        
        // Observe all images
        images.forEach(img => {
            img.classList.add(this.config.loadingClass);
            this.observer.observe(img);
        });
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Load individual image
     */
    loadImage: function(img) {
        const src = img.dataset.src || img.src;
        
        if (!src) return;
        
        // Create new image to preload
        const tempImg = new Image();
        
        tempImg.onload = () => {
            img.src = src;
            img.classList.remove(this.config.loadingClass);
            img.classList.add(this.config.loadedClass);
            
            // Remove data-src after loading
            delete img.dataset.src;
        };
        
        tempImg.onerror = () => {
            img.classList.remove(this.config.loadingClass);
            img.classList.add(this.config.errorClass);
            console.error('Failed to load image:', src);
        };
        
        tempImg.src = src;
    },
    
    /**
     * Load all images immediately (fallback)
     */
    loadAllImages: function() {
        const images = document.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
            }
        });
    },
    
    /**
     * Watch for dynamically added images
     */
    watchForNewImages: function() {
        if ('MutationObserver' in window) {
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'IMG') {
                            this.handleNewImage(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('img').forEach(img => {
                                this.handleNewImage(img);
                            });
                        }
                    });
                });
            });
            
            mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    },
    
    /**
     * Handle newly added image
     */
    handleNewImage: function(img) {
        if ('loading' in HTMLImageElement.prototype) {
            img.loading = 'lazy';
            if (img.dataset.src && !img.src) {
                img.src = img.dataset.src;
            }
        } else if (this.observer && img.dataset.src) {
            this.observer.observe(img);
        }
    },
    
    /**
     * Add placeholder while loading
     */
    addPlaceholder: function(img) {
        if (!img.src && !img.dataset.placeholder) {
            // Use a simple SVG placeholder
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-family="Arial" font-size="18"%3ELoading...%3C/text%3E%3C/svg%3E';
        }
    },
    
    /**
     * Convert existing images to lazy loading
     */
    convertImages: function() {
        const images = document.querySelectorAll('img:not([loading]):not([data-src])');
        
        images.forEach(img => {
            // Skip already loaded images
            if (img.complete) return;
            
            // Skip very small images (likely icons)
            if (img.width < 50 && img.height < 50) return;
            
            // Move src to data-src
            if (img.src && !img.dataset.src) {
                img.dataset.src = img.src;
                img.removeAttribute('src');
                this.addPlaceholder(img);
            }
        });
        
        // Re-initialize
        this.init();
    },
    
    /**
     * Add styles for lazy loading effects
     */
    addStyles: function() {
        if (document.getElementById('lazy-loading-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'lazy-loading-styles';
        style.textContent = `
            /* Lazy Loading Styles */
            img.lazy-loading {
                opacity: 0;
                transition: opacity 0.3s ease-in;
            }
            
            img.lazy-loaded {
                opacity: 1;
            }
            
            img.lazy-error {
                opacity: 0.5;
                background: #f0f0f0;
            }
            
            /* Blur-up effect (optional) */
            img[data-src] {
                filter: blur(5px);
                transition: filter 0.3s ease-in;
            }
            
            img.lazy-loaded[data-src] {
                filter: blur(0);
            }
            
            /* Skeleton loader for images */
            img.lazy-loading::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    #f0f0f0 25%,
                    #e0e0e0 50%,
                    #f0f0f0 75%
                );
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }
            
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LazyLoading.init());
} else {
    LazyLoading.init();
}

// Make available globally
window.LazyLoading = LazyLoading;

console.log('✅ Lazy Loading module loaded');
