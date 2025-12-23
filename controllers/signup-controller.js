/**
 * Signup Controller for ShopUp Ghana
 * Handles signup form logic using services
 */

class SignupController {
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
            this.logger.warn('Signup form not found');
            return;
        }

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Setup real-time validation
        this.setupValidation();
    }

    /**
     * Handle form submission
     */
    async handleSubmit() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (!submitBtn) return;

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating your store...';

        try {
            // Get form data
            const formData = this.getFormData();

            // Validate
            const validation = this.validate(formData);
            if (!validation.valid) {
                this.showToast(validation.message);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }

            this.logger.info('Attempting signup');

            // Sign up with auth service
            const result = await this.auth.signUp(
                formData.email,
                formData.password,
                {
                    business_name: formData.businessName,
                    first_name: formData.firstName,
                    last_name: formData.lastName
                }
            );

            if (!result.success) {
                throw new Error(result.error);
            }

            this.logger.info('Auth user created', { userId: result.user.id });

            // Create seller profile
            await this.createSellerProfile(result.user.id, formData);

            // Success!
            this.showToast('✓ Account created successfully!');

            // Redirect
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            this.logger.error('Signup failed', error);
            this.showToast('❌ ' + (error.message || 'Signup failed. Please try again.'));
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        return {
            email: this.form.querySelector('#email')?.value.trim() || '',
            password: this.form.querySelector('#password')?.value || '',
            confirmPassword: this.form.querySelector('#confirmPassword')?.value || '',
            businessName: this.form.querySelector('#businessName')?.value.trim() || '',
            firstName: this.form.querySelector('#firstName')?.value.trim() || '',
            lastName: this.form.querySelector('#lastName')?.value.trim() || '',
            phone: this.form.querySelector('#phone')?.value.trim() || '',
            city: this.form.querySelector('#city')?.value.trim() || '',
            region: this.form.querySelector('#region')?.value || '',
            businessCategory: this.form.querySelector('#businessCategory')?.value || ''
        };
    }

    /**
     * Validate form data
     */
    validate(data) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }

        // Password validation
        if (data.password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }

        // Password match
        if (data.password !== data.confirmPassword) {
            return { valid: false, message: 'Passwords do not match' };
        }

        // Phone validation (Ghana format)
        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(data.phone)) {
            return { valid: false, message: 'Please enter a valid Ghana phone number (e.g., 0244123456)' };
        }

        // Required fields
        if (!data.businessName || !data.firstName || !data.lastName || !data.city) {
            return { valid: false, message: 'Please fill in all required fields' };
        }

        return { valid: true };
    }

    /**
     * Create seller profile in database
     */
    async createSellerProfile(userId, formData) {
        const supabase = this.auth.getClient();

        const storeSlug = formData.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'store-' + Date.now();

        const { data, error } = await supabase
            .from('sellers')
            .insert([{
                id: userId,
                email: formData.email,
                business_name: formData.businessName,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone,
                city: formData.city,
                region: formData.region,
                business_category: formData.businessCategory,
                store_slug: storeSlug,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        // Store seller info
        this.storage.set('shopup_seller', data);

        return data;
    }

    /**
     * Setup real-time validation
     */
    setupValidation() {
        const emailInput = this.form.querySelector('#email');
        const passwordInput = this.form.querySelector('#password');
        const confirmPasswordInput = this.form.querySelector('#confirmPassword');
        const phoneInput = this.form.querySelector('#phone');

        // Email validation
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailInput.value && !emailRegex.test(emailInput.value)) {
                    emailInput.style.borderColor = '#e53935';
                } else {
                    emailInput.style.borderColor = '#e0e0e0';
                }
            });
        }

        // Password match validation
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
                    confirmPasswordInput.style.borderColor = '#e53935';
                } else {
                    confirmPasswordInput.style.borderColor = '#e0e0e0';
                }
            });
        }

        // Phone validation
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                const phoneRegex = /^0[0-9]{9}$/;
                if (phoneInput.value && !phoneRegex.test(phoneInput.value)) {
                    phoneInput.style.borderColor = '#e53935';
                } else {
                    phoneInput.style.borderColor = '#e0e0e0';
                }
            });
        }
    }

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.classList.add('show');

            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }
}

// Initialize when app is ready
if (window.app) {
    initSignupController();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSignupController, 500); // Wait for bootstrap
    });
}

function initSignupController() {
    if (!window.app) {
        console.warn('App not initialized, skipping signup controller');
        return;
    }

    const form = document.getElementById('signupForm');
    if (form) {
        window.signupController = new SignupController(
            window.app.auth,
            window.app.logger,
            window.app.storage,
            form
        );
        console.log('✅ Signup controller initialized');
    }
}

// Export
window.SignupController = SignupController;
console.log('✅ SignupController loaded');
