// Dark Mode Toggle for ShopUp Ghana
// Zero-cost feature that improves user experience

const DarkMode = {
    // Storage key
    STORAGE_KEY: 'shopup_theme',
    
    // Theme values
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },
    
    /**
     * Initialize dark mode
     */
    init: function() {
        // Get saved preference or detect system preference
        const savedTheme = this.getSavedTheme();
        const theme = savedTheme || this.getSystemTheme();
        
        // Apply theme
        this.applyTheme(theme);
        
        // Add toggle button if not exists
        this.addToggleButton();
        
        // Listen for system theme changes
        this.watchSystemTheme();
        
        console.log('✅ Dark Mode initialized:', theme);
    },
    
    /**
     * Get saved theme from localStorage
     */
    getSavedTheme: function() {
        try {
            return localStorage.getItem(this.STORAGE_KEY);
        } catch (error) {
            console.warn('Could not access localStorage:', error);
            return null;
        }
    },
    
    /**
     * Save theme preference
     */
    saveTheme: function(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (error) {
            console.warn('Could not save theme:', error);
        }
    },
    
    /**
     * Get system theme preference
     */
    getSystemTheme: function() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.THEMES.DARK;
        }
        return this.THEMES.LIGHT;
    },
    
    /**
     * Watch for system theme changes
     */
    watchSystemTheme: function() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                const savedTheme = this.getSavedTheme();
                if (!savedTheme || savedTheme === this.THEMES.AUTO) {
                    this.applyTheme(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT);
                }
            });
        }
    },
    
    /**
     * Apply theme to document
     */
    applyTheme: function(theme) {
        const root = document.documentElement;
        
        if (theme === this.THEMES.DARK) {
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark-mode');
        } else {
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark-mode');
        }
        
        // Update toggle button icon if exists
        this.updateToggleIcon(theme);
    },
    
    /**
     * Toggle between light and dark
     */
    toggle: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
        
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
        
        console.log('🌓 Theme toggled to:', newTheme);
    },
    
    /**
     * Add toggle button to page
     */
    addToggleButton: function() {
        // Check if button already exists
        if (document.getElementById('dark-mode-toggle')) return;
        
        // Create toggle button
        const button = document.createElement('button');
        button.id = 'dark-mode-toggle';
        button.className = 'dark-mode-toggle';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.innerHTML = '<span class="icon"></span>';
        
        // Add click handler
        button.addEventListener('click', () => this.toggle());
        
        // Add to page (try to add to nav, or body as fallback)
        const nav = document.querySelector('.navbar, nav');
        if (nav) {
            nav.appendChild(button);
        } else {
            document.body.appendChild(button);
        }
        
        // Add styles
        this.addStyles();
    },
    
    /**
     * Update toggle button icon
     */
    updateToggleIcon: function(theme) {
        const button = document.getElementById('dark-mode-toggle');
        if (!button) return;
        
        const icon = button.querySelector('.icon');
        if (icon) {
            icon.textContent = theme === this.THEMES.DARK ? '☀️' : '🌙';
        }
    },
    
    /**
     * Add styles for dark mode
     */
    addStyles: function() {
        // Check if styles already added
        if (document.getElementById('dark-mode-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            /* Dark Mode Toggle Button */
            .dark-mode-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: var(--toggle-bg, #333);
                color: white;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: transform 0.2s, background 0.3s;
            }
            
            .dark-mode-toggle:hover {
                transform: scale(1.1);
            }
            
            .dark-mode-toggle:active {
                transform: scale(0.95);
            }
            
            /* Dark Mode Color Variables */
            :root {
                --bg-primary: #ffffff;
                --bg-secondary: #f5f7fa;
                --text-primary: #333333;
                --text-secondary: #666666;
                --border-color: #e0e0e0;
                --toggle-bg: #333333;
            }
            
            [data-theme="dark"] {
                --bg-primary: #1a1a1a;
                --bg-secondary: #2d2d2d;
                --text-primary: #e0e0e0;
                --text-secondary: #b0b0b0;
                --border-color: #404040;
                --toggle-bg: #fbbf24;
            }
            
            /* Apply dark mode colors */
            .dark-mode {
                background-color: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .dark-mode body {
                background-color: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .dark-mode .navbar,
            .dark-mode .footer,
            .dark-mode .card,
            .dark-mode .product-card {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }
            
            .dark-mode input,
            .dark-mode textarea,
            .dark-mode select {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }
            
            .dark-mode a {
                color: #60a5fa;
            }
            
            .dark-mode .btn-secondary {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
            }
            
            /* Smooth transition */
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
        `;
        
        document.head.appendChild(style);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DarkMode.init());
} else {
    DarkMode.init();
}

// Make available globally
window.DarkMode = DarkMode;

console.log('✅ Dark Mode module loaded');
