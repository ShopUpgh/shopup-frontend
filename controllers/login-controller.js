/**
 * Login Controller for ShopUp Ghana
 * Handles login form logic using services
 */

class LoginController {
    constructor(auth, logger, storage, formElement) {
        this.auth = auth;
        this.logger = logger;
        this.storage = storage;
        this.form = formElement;
        
        this.setupEventListeners();
    }

    /**
     * Setup form event listeners
     */
    setupEventListeners() {
        if (!this.form) {
            this.logger.warn('Login form not found');
            return;
        }

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            // Get form data
            const email = this.form.querySelector('#email')?.value.trim() || '';
            const password = this.form.querySelector('#password')?.value || '';

            // Validate
            if (!email || !password) {
                throw new Error('Please enter both email and password');
            }

            this.logger.info('Attempting login');

            // Sign in with auth service
            const result = await this.auth.signIn(email, password);

            if (!result.success) {
                throw new Error(result.error);
            }

            this.logger.info('Login successful', { userId: result.user.id });

            // Fetch seller profile
            await this.loadSellerProfile(result.user.id, email);

            // Success!
            this.showToast('✓ Login successful!');

            // Redirect
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            this.logger.error('Login failed', error);
            this.showToast('❌ ' + (error.message || 'Login failed. Please try again.'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Load seller profile from database
     */
    async loadSellerProfile(userId, email) {
        const supabase = this.auth.getClient();

        const { data, error } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            this.logger.error('Failed to fetch seller profile', error);
            throw error;
        }

        // Store seller info
        this.storage.set('shopup_seller', data);

        return data;
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        if (!toast || !toastMessage) {
            console.error('Toast elements not found, creating fallback');
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:#fff;padding:15px 20px;border-radius:5px;z-index:10000;box-shadow:0 2px 10px rgba(0,0,0,0.2)';
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
            return;
        }

        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Initialize when app is ready
if (window.app) {
    initLoginController();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initLoginController, 500); // Wait for bootstrap
    });
}

function initLoginController() {
    if (!window.app) {
        console.warn('App not initialized, skipping login controller');
        return;
    }

    const form = document.getElementById('loginForm');
    if (form) {
        window.loginController = new LoginController(
            window.app.auth,
            window.app.logger,
            window.app.storage,
            form
        );
        console.log('✅ Login controller initialized');
    }
}

// Export
window.LoginController = LoginController;
console.log('✅ LoginController loaded');
