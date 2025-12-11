/**
 * ShopUp Ghana - Cookie Consent Banner
 * 
 * Compliant with:
 * - Ghana Data Protection Act 2012
 * - GDPR (for international visitors)
 * - ePrivacy Directive
 */

const CookieConsent = {
    // Configuration
    config: {
        cookieName: 'shopup_cookie_consent',
        expiryDays: 365,
        position: 'bottom', // 'bottom' or 'top'
        theme: 'light' // 'light' or 'dark'
    },

    /**
     * Initialize cookie consent banner
     */
    init() {
        // Check if user has already consented
        if (this.hasConsented()) {
            this.applyConsent();
            return;
        }

        // Show banner if enabled in config
        const enabled = window.AppConfig?.features?.cookieConsent !== false;
        if (enabled) {
            this.showBanner();
        }
    },

    /**
     * Check if user has already given consent
     */
    hasConsented() {
        return this.getCookie(this.config.cookieName) !== null;
    },

    /**
     * Get user's consent preferences
     */
    getConsent() {
        const consent = this.getCookie(this.config.cookieName);
        if (!consent) return null;

        try {
            return JSON.parse(decodeURIComponent(consent));
        } catch (e) {
            return null;
        }
    },

    /**
     * Show cookie consent banner
     */
    showBanner() {
        // Create banner HTML
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = this.getBannerHTML();
        
        // Add to page
        document.body.appendChild(banner);

        // Add event listeners
        document.getElementById('cookie-accept-all').addEventListener('click', () => {
            this.acceptAll();
        });

        document.getElementById('cookie-accept-essential').addEventListener('click', () => {
            this.acceptEssential();
        });

        document.getElementById('cookie-settings').addEventListener('click', () => {
            this.showSettings();
        });

        // Animate in
        setTimeout(() => {
            banner.classList.add('visible');
        }, 100);
    },

    /**
     * Get banner HTML
     */
    getBannerHTML() {
        return `
            <style>
                #cookie-consent-banner {
                    position: fixed;
                    ${this.config.position}: 0;
                    left: 0;
                    right: 0;
                    background: ${this.config.theme === 'dark' ? '#1f2937' : 'white'};
                    color: ${this.config.theme === 'dark' ? 'white' : '#1f2937'};
                    padding: 20px;
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                    z-index: 999999;
                    transform: translateY(${this.config.position === 'bottom' ? '100%' : '-100%'});
                    transition: transform 0.3s ease;
                    border-top: 3px solid #10b981;
                }

                #cookie-consent-banner.visible {
                    transform: translateY(0);
                }

                .cookie-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .cookie-text {
                    flex: 1;
                    min-width: 300px;
                }

                .cookie-text h3 {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .cookie-text p {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .cookie-text a {
                    color: #10b981;
                    text-decoration: underline;
                }

                .cookie-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .cookie-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .cookie-btn-primary {
                    background: #10b981;
                    color: white;
                }

                .cookie-btn-primary:hover {
                    background: #059669;
                }

                .cookie-btn-secondary {
                    background: transparent;
                    color: ${this.config.theme === 'dark' ? 'white' : '#6b7280'};
                    border: 1px solid ${this.config.theme === 'dark' ? '#4b5563' : '#d1d5db'};
                }

                .cookie-btn-secondary:hover {
                    background: ${this.config.theme === 'dark' ? '#374151' : '#f9fafb'};
                }

                @media (max-width: 768px) {
                    .cookie-content {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .cookie-actions {
                        flex-direction: column;
                    }

                    .cookie-btn {
                        width: 100%;
                    }
                }
            </style>
            <div class="cookie-content">
                <div class="cookie-text">
                    <h3>🍪 We Use Cookies</h3>
                    <p>
                        We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                        By clicking "Accept All", you consent to our use of cookies. 
                        See our <a href="privacy-policy.html">Privacy Policy</a> for more details.
                    </p>
                </div>
                <div class="cookie-actions">
                    <button id="cookie-accept-all" class="cookie-btn cookie-btn-primary">
                        Accept All
                    </button>
                    <button id="cookie-accept-essential" class="cookie-btn cookie-btn-secondary">
                        Essential Only
                    </button>
                    <button id="cookie-settings" class="cookie-btn cookie-btn-secondary">
                        Settings
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Accept all cookies
     */
    acceptAll() {
        const consent = {
            essential: true,
            analytics: true,
            marketing: true,
            preferences: true,
            timestamp: new Date().toISOString()
        };

        this.saveConsent(consent);
        this.hideBanner();
        this.applyConsent();
    },

    /**
     * Accept only essential cookies
     */
    acceptEssential() {
        const consent = {
            essential: true,
            analytics: false,
            marketing: false,
            preferences: false,
            timestamp: new Date().toISOString()
        };

        this.saveConsent(consent);
        this.hideBanner();
        this.applyConsent();
    },

    /**
     * Show detailed settings modal
     */
    showSettings() {
        // Create modal for detailed cookie settings
        const modal = document.createElement('div');
        modal.id = 'cookie-settings-modal';
        modal.innerHTML = this.getSettingsHTML();
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('cookie-save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cookie-close-settings').addEventListener('click', () => {
            document.getElementById('cookie-settings-modal').remove();
        });
    },

    /**
     * Get settings modal HTML
     */
    getSettingsHTML() {
        return `
            <style>
                #cookie-settings-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999999;
                    padding: 20px;
                }

                .cookie-modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .cookie-modal-content h2 {
                    margin: 0 0 20px 0;
                    color: #111827;
                }

                .cookie-option {
                    padding: 15px 0;
                    border-bottom: 1px solid #e5e7eb;
                }

                .cookie-option:last-child {
                    border-bottom: none;
                }

                .cookie-option h3 {
                    margin: 0 0 5px 0;
                    font-size: 16px;
                    color: #111827;
                }

                .cookie-option p {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #6b7280;
                }

                .cookie-toggle {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .cookie-toggle input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                }

                .cookie-modal-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
            </style>
            <div class="cookie-modal-content">
                <h2>Cookie Settings</h2>

                <div class="cookie-option">
                    <h3>Essential Cookies</h3>
                    <p>Required for the website to function. Cannot be disabled.</p>
                    <div class="cookie-toggle">
                        <input type="checkbox" id="cookie-essential" checked disabled>
                        <label for="cookie-essential">Always Active</label>
                    </div>
                </div>

                <div class="cookie-option">
                    <h3>Analytics Cookies</h3>
                    <p>Help us understand how visitors interact with our website.</p>
                    <div class="cookie-toggle">
                        <input type="checkbox" id="cookie-analytics" checked>
                        <label for="cookie-analytics">Enable Analytics</label>
                    </div>
                </div>

                <div class="cookie-option">
                    <h3>Marketing Cookies</h3>
                    <p>Used to deliver relevant advertisements to you.</p>
                    <div class="cookie-toggle">
                        <input type="checkbox" id="cookie-marketing">
                        <label for="cookie-marketing">Enable Marketing</label>
                    </div>
                </div>

                <div class="cookie-option">
                    <h3>Preference Cookies</h3>
                    <p>Remember your preferences and settings.</p>
                    <div class="cookie-toggle">
                        <input type="checkbox" id="cookie-preferences" checked>
                        <label for="cookie-preferences">Enable Preferences</label>
                    </div>
                </div>

                <div class="cookie-modal-actions">
                    <button id="cookie-close-settings" class="cookie-btn cookie-btn-secondary">
                        Cancel
                    </button>
                    <button id="cookie-save-settings" class="cookie-btn cookie-btn-primary">
                        Save Settings
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Save detailed settings
     */
    saveSettings() {
        const consent = {
            essential: true,
            analytics: document.getElementById('cookie-analytics').checked,
            marketing: document.getElementById('cookie-marketing').checked,
            preferences: document.getElementById('cookie-preferences').checked,
            timestamp: new Date().toISOString()
        };

        this.saveConsent(consent);
        document.getElementById('cookie-settings-modal').remove();
        this.hideBanner();
        this.applyConsent();
    },

    /**
     * Save consent to cookie
     */
    saveConsent(consent) {
        const value = encodeURIComponent(JSON.stringify(consent));
        this.setCookie(this.config.cookieName, value, this.config.expiryDays);
        console.log('✅ Cookie consent saved:', consent);
    },

    /**
     * Apply user's consent choices
     */
    applyConsent() {
        const consent = this.getConsent();
        if (!consent) return;

        // Load analytics if consented
        if (consent.analytics && window.AppConfig?.features?.analytics) {
            this.loadAnalytics();
        }

        // Load marketing scripts if consented
        if (consent.marketing) {
            this.loadMarketing();
        }

        console.log('✅ Consent applied:', consent);
    },

    /**
     * Load analytics scripts
     */
    loadAnalytics() {
        // Load analytics only if consented
        console.log('📊 Analytics enabled');
        // Add your analytics code here
    },

    /**
     * Load marketing scripts
     */
    loadMarketing() {
        // Load marketing scripts only if consented
        console.log('📢 Marketing enabled');
        // Add your marketing code here
    },

    /**
     * Hide banner
     */
    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('visible');
            setTimeout(() => banner.remove(), 300);
        }
    },

    /**
     * Set cookie
     */
    setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    },

    /**
     * Get cookie
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },

    /**
     * Delete cookie
     */
    deleteCookie(name) {
        this.setCookie(name, '', -1);
    }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CookieConsent.init());
} else {
    CookieConsent.init();
}

// Make available globally
window.CookieConsent = CookieConsent;

console.log('✅ Cookie consent system loaded');
