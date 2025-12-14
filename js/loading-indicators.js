// Loading Indicators for ShopUp Ghana
// Zero-cost feature to improve user experience during async operations

const LoadingIndicator = {
    // Active loaders
    activeLoaders: new Set(),
    
    /**
     * Show loading indicator
     * @param {string} target - Selector or element to show loader on
     * @param {string} message - Optional loading message
     */
    show: function(target = 'body', message = 'Loading...') {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) {
            console.warn('Loading indicator target not found:', target);
            return null;
        }
        
        // Create loader element
        const loaderId = 'loader-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const loader = document.createElement('div');
        loader.className = 'loading-indicator';
        loader.id = loaderId;
        loader.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        
        // Add to target
        element.style.position = 'relative';
        element.appendChild(loader);
        
        // Track active loader
        this.activeLoaders.add(loaderId);
        
        // Add styles if not exists
        this.addStyles();
        
        return loaderId;
    },
    
    /**
     * Hide loading indicator
     * @param {string} loaderId - ID of loader to hide
     */
    hide: function(loaderId) {
        if (!loaderId) {
            // Hide all loaders
            this.activeLoaders.forEach(id => {
                const loader = document.getElementById(id);
                if (loader) loader.remove();
            });
            this.activeLoaders.clear();
            return;
        }
        
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.remove();
            this.activeLoaders.delete(loaderId);
        }
    },
    
    /**
     * Show button loading state
     * @param {HTMLElement} button - Button element
     * @param {string} loadingText - Text to show while loading
     */
    showButton: function(button, loadingText = 'Loading...') {
        if (!button) return;
        
        // Store original state
        button.dataset.originalText = button.innerHTML;
        button.dataset.originalDisabled = button.disabled;
        
        // Set loading state
        button.disabled = true;
        button.classList.add('loading');
        button.innerHTML = `
            <span class="btn-spinner"></span>
            <span>${loadingText}</span>
        `;
    },
    
    /**
     * Hide button loading state
     * @param {HTMLElement} button - Button element
     */
    hideButton: function(button) {
        if (!button) return;
        
        // Restore original state
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.disabled = button.dataset.originalDisabled === 'true';
        button.classList.remove('loading');
        
        // Clean up data attributes
        delete button.dataset.originalText;
        delete button.dataset.originalDisabled;
    },
    
    /**
     * Show skeleton loader for content
     * @param {string} target - Selector for target element
     * @param {number} lines - Number of skeleton lines
     */
    showSkeleton: function(target, lines = 3) {
        const element = document.querySelector(target);
        if (!element) return;
        
        // Store original content
        element.dataset.originalContent = element.innerHTML;
        
        // Create skeleton
        let skeletonHTML = '<div class="skeleton-loader">';
        for (let i = 0; i < lines; i++) {
            skeletonHTML += '<div class="skeleton-line"></div>';
        }
        skeletonHTML += '</div>';
        
        element.innerHTML = skeletonHTML;
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Hide skeleton loader
     * @param {string} target - Selector for target element
     */
    hideSkeleton: function(target) {
        const element = document.querySelector(target);
        if (!element) return;
        
        // Restore original content
        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            delete element.dataset.originalContent;
        }
    },
    
    /**
     * Show progress bar
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} target - Optional target container
     */
    showProgress: function(progress, target = null) {
        let progressBar = document.getElementById('global-progress-bar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'global-progress-bar';
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = '<div class="progress-fill"></div>';
            
            if (target) {
                const container = document.querySelector(target);
                if (container) container.appendChild(progressBar);
            } else {
                document.body.appendChild(progressBar);
            }
            
            this.addStyles();
        }
        
        const fill = progressBar.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = progress + '%';
        }
        
        progressBar.style.display = 'block';
        
        // Auto-hide when complete
        if (progress >= 100) {
            setTimeout(() => this.hideProgress(), 500);
        }
    },
    
    /**
     * Hide progress bar
     */
    hideProgress: function() {
        const progressBar = document.getElementById('global-progress-bar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    },
    
    /**
     * Wrap async function with loading indicator
     * @param {Function} fn - Async function to wrap
     * @param {Object} options - Loading options
     */
    wrap: async function(fn, options = {}) {
        const {
            target = 'body',
            message = 'Loading...',
            button = null
        } = options;
        
        let loaderId = null;
        
        try {
            // Show appropriate loader
            if (button) {
                this.showButton(button, message);
            } else {
                loaderId = this.show(target, message);
            }
            
            // Execute function
            const result = await fn();
            
            return result;
            
        } catch (error) {
            throw error;
            
        } finally {
            // Hide loader
            if (button) {
                this.hideButton(button);
            } else if (loaderId) {
                this.hide(loaderId);
            }
        }
    },
    
    /**
     * Add styles for loading indicators
     */
    addStyles: function() {
        if (document.getElementById('loading-indicator-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'loading-indicator-styles';
        style.textContent = `
            /* Loading Indicator Overlay */
            .loading-indicator {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(2px);
            }
            
            .dark-mode .loading-indicator {
                background: rgba(0, 0, 0, 0.8);
            }
            
            /* Spinner */
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2d8a3e;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .loading-message {
                margin-top: 15px;
                font-size: 16px;
                color: #333;
                font-weight: 500;
            }
            
            .dark-mode .loading-message {
                color: #e0e0e0;
            }
            
            /* Button Spinner */
            .btn-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-right: 8px;
                vertical-align: middle;
            }
            
            button.loading {
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            /* Skeleton Loader */
            .skeleton-loader {
                padding: 10px 0;
            }
            
            .skeleton-line {
                height: 16px;
                background: linear-gradient(
                    90deg,
                    #f0f0f0 25%,
                    #e0e0e0 50%,
                    #f0f0f0 75%
                );
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                margin-bottom: 10px;
                border-radius: 4px;
            }
            
            .skeleton-line:last-child {
                width: 60%;
            }
            
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .dark-mode .skeleton-line {
                background: linear-gradient(
                    90deg,
                    #2d2d2d 25%,
                    #3d3d3d 50%,
                    #2d2d2d 75%
                );
                background-size: 200% 100%;
            }
            
            /* Progress Bar */
            .progress-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: #f0f0f0;
                z-index: 10000;
                display: none;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #2d8a3e, #1a5c28);
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(45, 138, 62, 0.5);
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Make available globally
window.LoadingIndicator = LoadingIndicator;

// Add convenience methods to window
window.showLoading = (target, message) => LoadingIndicator.show(target, message);
window.hideLoading = (loaderId) => LoadingIndicator.hide(loaderId);

console.log('✅ Loading Indicators module loaded');
