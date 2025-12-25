/**
 * Login Controller
 * Handles seller login using the new architecture
 */
(function(window) {
    'use strict';

    // Wait for ShopUp app to be ready
    function initialize() {
        if (!window.ShopUpApp) {
            console.warn('ShopUpApp not initialized yet, waiting...');
            setTimeout(initialize, 100);
            return;
        }

        const app = window.ShopUpApp;
        const logger = app.logger;
        const auth = app.auth;
        const storage = app.storage;
        const config = app.config;

        logger.info('Login controller initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupLogin);
        } else {
            setupLogin();
        }

        function setupLogin() {
            const loginForm = document.getElementById('loginForm');
            
            if (!loginForm) {
                logger.warn('Login form not found');
                return;
            }

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleLogin();
            });
            
            logger.info('Login controller ready');
        }

        // Handle login
        async function handleLogin() {
            const submitBtn = document.querySelector('.btn-login') || document.querySelector('button[type="submit"]');
            
            if (!submitBtn) {
                logger.error('Submit button not found');
                showToast('❌ Form error. Please refresh the page.');
                return;
            }
            
            const originalText = submitBtn.textContent;
            
            // Disable button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            
            try {
                // Get form data
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const remember = document.getElementById('remember')?.checked || false;
                
                // Validate
                if (!email || !password) {
                    showToast('Please enter email and password');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                
                logger.info('Attempting login', { email });
                
                // Sign in using auth service
                const result = await auth.signIn(email, password);
                
                if (!result.success) {
                    logger.error('Login failed', result.error);
                    showToast('❌ ' + result.error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                
                logger.info('Login successful', { userId: result.user.id });
                
                // Get seller profile from database
                const supabaseClient = auth.getClient();
                const { data: sellerData, error: sellerError } = await supabaseClient
                    .from('sellers')
                    .select('*')
                    .eq('id', result.user.id)
                    .single();
                
                if (sellerError || !sellerData) {
                    logger.error('Failed to fetch seller profile', sellerError);
                    showToast('❌ Failed to load profile');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                
                // Store seller data using storage service
                const sellerInfo = {
                    id: sellerData.id,
                    email: sellerData.email,
                    businessName: sellerData.business_name,
                    firstName: sellerData.first_name,
                    lastName: sellerData.last_name,
                    phone: sellerData.phone,
                    city: sellerData.city,
                    region: sellerData.region,
                    businessCategory: sellerData.business_category,
                    storeSlug: sellerData.store_slug
                };
                
                storage.set('seller', sellerInfo);
                
                // Handle remember me
                if (remember) {
                    storage.set('remember_me', true);
                }
                
                // Success!
                showToast('✓ Login successful!');
                
                // Redirect to dashboard
                setTimeout(() => {
                    const dashboardUrl = config.get('routes.sellerDashboard', '/dashboard.html');
                    window.location.href = dashboardUrl;
                }, 1000);
                
            } catch (error) {
                logger.error('Login error', error);
                showToast('❌ An error occurred. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        // Show toast notification
        function showToast(message) {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            
            if (!toast || !toastMessage) {
                logger.warn('Toast elements not found');
                // Fallback to error message div
                const errorDiv = document.getElementById('errorMessage');
                const errorText = document.getElementById('errorText');
                if (errorDiv && errorText) {
                    errorText.textContent = message;
                    errorDiv.style.display = 'block';
                    setTimeout(() => {
                        errorDiv.style.display = 'none';
                    }, 4000);
                } else {
                    alert(message);
                }
                return;
            }
            
            toastMessage.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }

    // Initialize when script loads
    initialize();
    
})(window);
