/**
 * Customer Login Controller
 * Handles customer login using the new architecture
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

        logger.info('Customer login controller initializing...');

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
            
            logger.info('Customer login controller ready');
        }

        // Handle login
        async function handleLogin() {
            const submitBtn = document.getElementById('loginBtn') || document.querySelector('button[type="submit"]');
            const loading = document.getElementById('loading');
            
            if (!submitBtn) {
                logger.error('Submit button not found');
                showError('❌ Form error. Please refresh the page.');
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            if (loading) {
                loading.classList.add('show');
            }
            
            try {
                // Get form data
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const rememberMe = document.getElementById('rememberMe')?.checked || false;
                
                // Validate
                if (!email || !password) {
                    showError('Please enter email and password');
                    submitBtn.disabled = false;
                    if (loading) loading.classList.remove('show');
                    return;
                }
                
                logger.info('Attempting customer login', { email });
                
                // Track in Sentry if available
                if (typeof Sentry !== 'undefined') {
                    Sentry.addBreadcrumb({
                        category: 'auth',
                        message: 'Customer login attempt started',
                        level: 'info',
                        data: { email }
                    });
                }
                
                // Sign in using auth service
                const result = await auth.signIn(email, password);
                
                if (!result.success) {
                    logger.error('Login failed', result.error);
                    showError('❌ ' + result.error);
                    submitBtn.disabled = false;
                    if (loading) loading.classList.remove('show');
                    return;
                }
                
                logger.info('Login successful', { userId: result.user.id });
                
                // Get customer profile from database
                const supabaseClient = auth.getClient();
                const { data: customerData, error: customerError } = await supabaseClient
                    .from('customer_profiles')
                    .select('*')
                    .eq('id', result.user.id)
                    .single();
                
                if (customerError || !customerData) {
                    logger.error('Failed to fetch customer profile', customerError);
                    showError('❌ Failed to load profile');
                    submitBtn.disabled = false;
                    if (loading) loading.classList.remove('show');
                    return;
                }
                
                // Store customer data using storage service
                const customerInfo = {
                    id: customerData.id,
                    email: customerData.email,
                    firstName: customerData.first_name,
                    lastName: customerData.last_name,
                    phone: customerData.phone,
                    fullName: customerData.full_name
                };
                
                storage.set('customer', customerInfo);
                
                // Store auth data
                storage.set('authToken', result.session.access_token);
                storage.set('currentUser', result.user);
                if (result.session.expires_at) {
                    storage.set('sessionExpiry', new Date(result.session.expires_at * 1000).toISOString());
                }
                
                // Handle remember me
                if (rememberMe) {
                    storage.set('remember_me', true);
                }
                
                // Identify user in Sentry if available
                if (typeof Sentry !== 'undefined') {
                    Sentry.setUser({
                        id: result.user.id,
                        email: result.user.email,
                        username: customerInfo.fullName
                    });
                }
                
                // Success!
                showSuccess('✓ Login successful! Redirecting...');
                
                logger.info('Redirecting to customer dashboard');
                
                // Redirect to dashboard
                setTimeout(() => {
                    const dashboardUrl = config.get('routes.customerDashboard', '/customer/customer-dashboard.html');
                    window.location.href = dashboardUrl;
                }, 1000);
                
            } catch (error) {
                logger.error('Login error', error);
                showError('❌ An error occurred. Please try again.');
                submitBtn.disabled = false;
                if (loading) loading.classList.remove('show');
            }
        }

        // Show success alert
        function showSuccess(message) {
            const successAlert = document.getElementById('successAlert');
            const errorAlert = document.getElementById('errorAlert');
            
            if (successAlert) {
                successAlert.textContent = message;
                successAlert.classList.add('show');
            }
            if (errorAlert) {
                errorAlert.classList.remove('show');
            }
        }

        // Show error alert
        function showError(message) {
            const successAlert = document.getElementById('successAlert');
            const errorAlert = document.getElementById('errorAlert');
            
            if (errorAlert) {
                errorAlert.textContent = message;
                errorAlert.classList.add('show');
            }
            if (successAlert) {
                successAlert.classList.remove('show');
            }
        }
    }

    // Initialize when script loads
    initialize();
    
})(window);
