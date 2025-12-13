// Keyboard Navigation & Accessibility for ShopUp Ghana
// Zero-cost feature improving usability and legal compliance

const KeyboardNavigation = {
    // Configuration
    config: {
        focusClass: 'keyboard-focus',
        navigationClass: 'keyboard-navigable'
    },
    
    // State
    currentFocusIndex: -1,
    navigableElements: [],
    isKeyboardUser: false,
    
    /**
     * Initialize keyboard navigation
     */
    init: function() {
        // Detect keyboard usage
        this.detectKeyboardUsage();
        
        // Add keyboard shortcuts
        this.addKeyboardShortcuts();
        
        // Enhance focus indicators
        this.enhanceFocusIndicators();
        
        // Make product grids navigable
        this.makeProductGridsNavigable();
        
        // Add skip navigation
        this.addSkipNavigation();
        
        // Add ARIA labels where missing
        this.addAriaLabels();
        
        console.log('✅ Keyboard Navigation initialized');
    },
    
    /**
     * Detect if user is using keyboard
     */
    detectKeyboardUsage: function() {
        // Detect TAB key usage
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.isKeyboardUser = true;
                document.body.classList.add('keyboard-user');
            }
        });
        
        // Detect mouse usage
        document.addEventListener('mousedown', () => {
            this.isKeyboardUser = false;
            document.body.classList.remove('keyboard-user');
        });
    },
    
    /**
     * Add keyboard shortcuts
     */
    addKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input field
            if (e.target.matches('input, textarea, select')) return;
            
            switch(e.key) {
                case 'Escape':
                    this.handleEscape();
                    break;
                case '/':
                    if (!e.ctrlKey && !e.metaKey) {
                        this.focusSearch(e);
                    }
                    break;
                case 'ArrowRight':
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'ArrowDown':
                    if (this.isInProductGrid()) {
                        this.navigateProductGrid(e);
                    }
                    break;
            }
        });
    },
    
    /**
     * Handle Escape key
     */
    handleEscape: function() {
        // Close modals
        const modals = document.querySelectorAll('.modal.active, .overlay.active, .popup.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Close dropdowns
        const dropdowns = document.querySelectorAll('.dropdown.open, .menu.open');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('open');
        });
        
        // Clear search if focused
        const searchInput = document.querySelector('input[type="search"]:focus, #searchInput:focus');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            searchInput.blur();
        }
    },
    
    /**
     * Focus search field
     */
    focusSearch: function(e) {
        const searchInput = document.querySelector('input[type="search"], #searchInput, input[placeholder*="Search"]');
        if (searchInput) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    },
    
    /**
     * Check if currently in product grid
     */
    isInProductGrid: function() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.closest('.product-grid, .products-grid, .product-list') ||
            activeElement.classList.contains('product-card')
        );
    },
    
    /**
     * Navigate product grid with arrow keys
     */
    navigateProductGrid: function(e) {
        const grid = document.querySelector('.product-grid, .products-grid, .product-list');
        if (!grid) return;
        
        const products = Array.from(grid.querySelectorAll('.product-card, .product-item'));
        if (products.length === 0) return;
        
        const activeElement = document.activeElement;
        const currentIndex = products.findIndex(p => 
            p === activeElement || p.contains(activeElement)
        );
        
        if (currentIndex === -1) return;
        
        // Calculate grid columns (approximate)
        const gridWidth = grid.offsetWidth;
        const productWidth = products[0].offsetWidth;
        const columns = Math.floor(gridWidth / productWidth);
        
        let newIndex = currentIndex;
        
        switch(e.key) {
            case 'ArrowRight':
                newIndex = Math.min(currentIndex + 1, products.length - 1);
                break;
            case 'ArrowLeft':
                newIndex = Math.max(currentIndex - 1, 0);
                break;
            case 'ArrowDown':
                newIndex = Math.min(currentIndex + columns, products.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(currentIndex - columns, 0);
                break;
        }
        
        if (newIndex !== currentIndex) {
            e.preventDefault();
            const link = products[newIndex].querySelector('a');
            if (link) {
                link.focus();
            } else {
                products[newIndex].focus();
            }
        }
    },
    
    /**
     * Make product grids navigable
     */
    makeProductGridsNavigable: function() {
        const productCards = document.querySelectorAll('.product-card, .product-item');
        
        productCards.forEach(card => {
            // Make focusable if not already
            if (!card.hasAttribute('tabindex') && !card.querySelector('a')) {
                card.setAttribute('tabindex', '0');
            }
            
            // Add enter key handler
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const link = card.querySelector('a');
                    if (link) {
                        link.click();
                    }
                }
            });
        });
    },
    
    /**
     * Enhance focus indicators
     */
    enhanceFocusIndicators: function() {
        // Add focus class to focusable elements
        const focusableSelector = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
        
        document.addEventListener('focus', (e) => {
            if (this.isKeyboardUser && e.target.matches(focusableSelector)) {
                e.target.classList.add(this.config.focusClass);
            }
        }, true);
        
        document.addEventListener('blur', (e) => {
            e.target.classList.remove(this.config.focusClass);
        }, true);
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Add skip navigation link
     */
    addSkipNavigation: function() {
        // Check if already exists
        if (document.getElementById('skip-to-main')) return;
        
        // Create skip link
        const skipLink = document.createElement('a');
        skipLink.id = 'skip-to-main';
        skipLink.href = '#main-content';
        skipLink.className = 'skip-navigation';
        skipLink.textContent = 'Skip to main content';
        
        // Add click handler
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const main = document.querySelector('#main-content, main, [role="main"]');
            if (main) {
                main.setAttribute('tabindex', '-1');
                main.focus();
            }
        });
        
        // Insert at beginning of body
        document.body.insertBefore(skipLink, document.body.firstChild);
    },
    
    /**
     * Add ARIA labels where missing
     */
    addAriaLabels: function() {
        // Add ARIA labels to buttons without text
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                // Try to infer purpose from class or icon
                const icon = button.textContent || button.innerHTML;
                let label = 'Button';
                
                if (button.classList.contains('close') || icon.includes('×')) {
                    label = 'Close';
                } else if (button.classList.contains('menu') || icon.includes('☰')) {
                    label = 'Menu';
                } else if (button.classList.contains('search') || icon.includes('🔍')) {
                    label = 'Search';
                } else if (button.classList.contains('cart')) {
                    label = 'Shopping cart';
                }
                
                button.setAttribute('aria-label', label);
            }
        });
        
        // Add role to navigation
        const navs = document.querySelectorAll('nav:not([role])');
        navs.forEach(nav => nav.setAttribute('role', 'navigation'));
        
        // Add role to main content
        const main = document.querySelector('main:not([role])');
        if (main) main.setAttribute('role', 'main');
        
        // Add alt text to images without it
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            const altText = img.getAttribute('title') || 
                           img.closest('[data-product-name]')?.getAttribute('data-product-name') ||
                           'Image';
            img.setAttribute('alt', altText);
        });
    },
    
    /**
     * Add styles
     */
    addStyles: function() {
        if (document.getElementById('keyboard-navigation-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'keyboard-navigation-styles';
        style.textContent = `
            /* Skip Navigation Link */
            .skip-navigation {
                position: absolute;
                top: -40px;
                left: 0;
                background: #000;
                color: white;
                padding: 8px 16px;
                text-decoration: none;
                z-index: 10000;
                border-radius: 0 0 4px 0;
            }
            
            .skip-navigation:focus {
                top: 0;
            }
            
            /* Enhanced Focus Indicators */
            .keyboard-user *:focus {
                outline: 3px solid #2d8a3e;
                outline-offset: 2px;
            }
            
            .keyboard-user a:focus,
            .keyboard-user button:focus {
                outline: 3px solid #2d8a3e;
                outline-offset: 2px;
            }
            
            .keyboard-user input:focus,
            .keyboard-user textarea:focus,
            .keyboard-user select:focus {
                outline: 3px solid #2d8a3e;
                outline-offset: 0;
                border-color: #2d8a3e;
            }
            
            /* Product Card Focus */
            .keyboard-user .product-card:focus-within {
                box-shadow: 0 0 0 3px #2d8a3e;
                transform: translateY(-2px);
            }
            
            /* Remove outline for mouse users */
            body:not(.keyboard-user) *:focus {
                outline: none;
            }
            
            /* Focusable elements should be clearly interactive */
            .product-card[tabindex="0"] {
                cursor: pointer;
            }
            
            /* High Contrast Mode Support */
            @media (prefers-contrast: high) {
                .keyboard-user *:focus {
                    outline-width: 4px;
                }
            }
            
            /* Dark Mode Focus */
            .dark-mode.keyboard-user *:focus {
                outline-color: #4ade80;
            }
            
            .dark-mode .skip-navigation {
                background: #1a1a1a;
                color: #e0e0e0;
            }
            
            /* Focus visible (modern browsers) */
            *:focus-visible {
                outline: 3px solid #2d8a3e;
                outline-offset: 2px;
            }
            
            /* Keyboard navigation hints */
            .keyboard-hint {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 9998;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
            }
            
            .keyboard-user .keyboard-hint {
                opacity: 1;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    /**
     * Show keyboard shortcut hint
     */
    showHint: function(message, duration = 3000) {
        let hint = document.getElementById('keyboard-hint');
        
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'keyboard-hint';
            hint.className = 'keyboard-hint';
            document.body.appendChild(hint);
        }
        
        hint.textContent = message;
        hint.style.opacity = '1';
        
        setTimeout(() => {
            hint.style.opacity = '0';
        }, duration);
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyboardNavigation.init());
} else {
    KeyboardNavigation.init();
}

// Make available globally
window.KeyboardNavigation = KeyboardNavigation;

console.log('✅ Keyboard Navigation module loaded');
