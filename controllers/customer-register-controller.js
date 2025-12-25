/**
 * Customer Register Controller
 * Handles customer registration using the new architecture
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

        logger.info('Customer register controller initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupRegister);
        } else {
            setupRegister();
        }

        function setupRegister() {
            const registerForm = document.getElementById('registerForm');
            
            if (!registerForm) {
                logger.warn('Register form not found');
                return;
            }

            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleRegister();
            });

            // Setup password strength indicator
            setupPasswordStrength();
            
            logger.info('Customer register controller ready');
        }

        // Handle registration
        async function handleRegister() {
            const submitBtn = document.getElementById('registerBtn') || document.querySelector('button[type="submit"]');
            const loading = document.getElementById('loading');
            
            if (!submitBtn) {
                logger.error('Submit button not found');
                showError('❌ Form error. Please refresh the page.');
                return;
            }
            
            // Hide previous alerts
            hideAlerts();
            
            // Get form data
            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                termsAccepted: document.getElementById('terms')?.checked || false,
                marketingConsent: document.getElementById('marketing')?.checked || false
            };
            
            // Validate form
            if (!validateForm(formData)) {
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            if (loading) {
                loading.classList.add('show');
            }
            
            try {
                logger.info('Attempting customer registration', { email: formData.email });
                
                // Sign up user using auth service
                const result = await auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            first_name: formData.firstName,
                            last_name: formData.lastName,
                            phone: formData.phone,
                            full_name: `${formData.firstName} ${formData.lastName}`
                        }
                    }
                });
                
                if (!result.success) {
                    logger.error('Registration failed', result.error);
                    showError('❌ ' + result.error);
                    submitBtn.disabled = false;
                    if (loading) loading.classList.remove('show');
                    return;
                }
                
                logger.info('Auth user created', { userId: result.user.id });
                
                // Wait briefly for Supabase to process
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Create customer profile
                const supabaseClient = auth.getClient();
                const { data: customerData, error: customerError } = await supabaseClient
                    .from('customer_profiles')
                    .insert([{
                        id: result.user.id,
                        email: formData.email,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        full_name: `${formData.firstName} ${formData.lastName}`,
                        marketing_consent: formData.marketingConsent
                    }])
                    .select()
                    .single();
                
                if (customerError) {
                    logger.error('Customer profile error', customerError);
                    showError('❌ Failed to create profile: ' + customerError.message);
                    submitBtn.disabled = false;
                    if (loading) loading.classList.remove('show');
                    return;
                }
                
                logger.info('Customer profile created', { customerId: customerData.id });
                
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
                
                // Success!
                showSuccess('✓ Account created successfully! Redirecting...');
                
                logger.info('Redirecting to customer dashboard');
                
                // Redirect to dashboard
                setTimeout(() => {
                    const dashboardUrl = config.get('routes.customerDashboard', '/customer/customer-dashboard.html');
                    window.location.href = dashboardUrl;
                }, 1500);
                
            } catch (error) {
                logger.error('Registration error', error);
                showError('❌ An error occurred. Please try again.');
                submitBtn.disabled = false;
                if (loading) loading.classList.remove('show');
            }
        }

        // Validate form
        function validateForm(data) {
            // Required fields
            if (!data.firstName || !data.lastName) {
                showError('Please enter your first and last name');
                return false;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showError('Please enter a valid email address');
                return false;
            }
            
            // Phone validation (Ghana format)
            const phoneRegex = /^0[0-9]{9}$/;
            if (!phoneRegex.test(data.phone)) {
                showError('Please enter a valid Ghana phone number (e.g., 0244123456)');
                return false;
            }
            
            // Password validation
            if (data.password.length < 8) {
                showError('Password must be at least 8 characters');
                return false;
            }
            
            // Password match
            if (data.password !== data.confirmPassword) {
                showError('Passwords do not match');
                return false;
            }
            
            // Terms acceptance
            if (!data.termsAccepted) {
                showError('You must accept the Terms of Service');
                return false;
            }
            
            return true;
        }

        // Setup password strength indicator
        function setupPasswordStrength() {
            const passwordInput = document.getElementById('password');
            const strengthBar = document.getElementById('passwordStrengthBar');
            const strengthContainer = document.getElementById('passwordStrength');
            
            if (!passwordInput || !strengthBar || !strengthContainer) {
                return;
            }
            
            passwordInput.addEventListener('input', function() {
                const password = this.value;
                let strength = 0;
                
                if (password.length >= 8) strength += 25;
                if (password.match(/[a-z]/)) strength += 25;
                if (password.match(/[A-Z]/)) strength += 25;
                if (password.match(/[0-9]/)) strength += 25;
                
                strengthContainer.classList.add('show');
                strengthBar.className = 'password-strength-bar';
                
                if (strength <= 25) {
                    strengthBar.classList.add('weak');
                } else if (strength <= 50) {
                    strengthBar.classList.add('medium');
                } else {
                    strengthBar.classList.add('strong');
                }
            });
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

        // Hide all alerts
        function hideAlerts() {
            const successAlert = document.getElementById('successAlert');
            const errorAlert = document.getElementById('errorAlert');
            
            if (successAlert) {
                successAlert.classList.remove('show');
            }
            if (errorAlert) {
                errorAlert.classList.remove('show');
            }
        }
    }

    // Initialize when script loads
    initialize();
    
})(window);
