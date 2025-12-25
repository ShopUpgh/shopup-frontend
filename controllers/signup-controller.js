/**
 * Signup Controller
 * Handles seller registration using the new architecture
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

        logger.info('Signup controller initializing...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupSignup);
        } else {
            setupSignup();
        }

        function setupSignup() {
            const signupForm = document.getElementById('signupForm');
            
            if (!signupForm) {
                logger.warn('Signup form not found');
                return;
            }

            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleSignup();
            });

            // Setup real-time validation
            setupValidation();
            
            logger.info('Signup controller ready');
        }

        // Handle signup
        async function handleSignup() {
            const submitBtn = document.querySelector('.btn-submit') || document.querySelector('button[type="submit"]');
            
            if (!submitBtn) {
                logger.error('Submit button not found');
                showToast('❌ Form error. Please refresh the page.');
                return;
            }
            
            const originalText = submitBtn.textContent;
            
            // Disable button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating your store...';
            
            try {
                // Get form data
                const formData = {
                    email: document.getElementById('email').value.trim(),
                    password: document.getElementById('password').value,
                    businessName: document.getElementById('businessName').value.trim(),
                    firstName: document.getElementById('firstName').value.trim(),
                    lastName: document.getElementById('lastName').value.trim(),
                    phone: document.getElementById('phone').value.trim(),
                    city: document.getElementById('city').value.trim(),
                    region: document.getElementById('region').value,
                    businessCategory: document.getElementById('businessCategory').value
                };
                
                // Validate
                if (!validateForm(formData)) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                
                logger.info('Attempting signup', { email: formData.email });
                
                // Step 1: Create auth user using auth service
                const authResult = await auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            business_name: formData.businessName,
                            first_name: formData.firstName,
                            last_name: formData.lastName
                        }
                    }
                });
                
                if (!authResult.success) {
                    logger.error('Auth error', authResult.error);
                    showToast('❌ ' + authResult.error);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                
                logger.info('Auth user created', { userId: authResult.user.id });
                
                // Wait briefly for Supabase to process the signup
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Step 2: Create seller profile in database
                const storeSlug = formData.businessName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                
                const supabaseClient = auth.getClient();
                const { data: sellerData, error: sellerError } = await supabaseClient
                    .from('sellers')
                    .insert([{
                        id: authResult.user.id,
                        email: formData.email,
                        password_hash: 'managed-by-supabase-auth',
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
                
                if (sellerError) {
                    logger.error('Seller profile error', sellerError);
                    showToast('❌ Failed to create seller profile: ' + sellerError.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
                
                logger.info('Seller profile created', { sellerId: sellerData.id });
                
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
                
                // Success!
                showToast('✓ Account created successfully!');
                
                // Redirect to dashboard
                setTimeout(() => {
                    const dashboardUrl = config.get('routes.sellerDashboard', '/dashboard.html');
                    window.location.href = dashboardUrl;
                }, 1000);
                
            } catch (error) {
                logger.error('Signup error', error);
                showToast('❌ An error occurred. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        // Validate form
        function validateForm(data) {
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showToast('Please enter a valid email address');
                return false;
            }
            
            // Password validation
            if (data.password.length < 8) {
                showToast('Password must be at least 8 characters');
                return false;
            }
            
            // Phone validation
            const phoneRegex = /^0[0-9]{9}$/;
            if (!phoneRegex.test(data.phone)) {
                showToast('Please enter a valid Ghana phone number (e.g., 0244123456)');
                return false;
            }
            
            // Required fields
            if (!data.businessName || !data.firstName || !data.lastName || !data.city) {
                showToast('Please fill in all required fields');
                return false;
            }
            
            return true;
        }

        // Setup real-time validation
        function setupValidation() {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const phoneInput = document.getElementById('phone');
            
            if (!emailInput || !passwordInput || !phoneInput) {
                return;
            }
            
            // Email validation
            emailInput.addEventListener('blur', () => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailInput.value && !emailRegex.test(emailInput.value)) {
                    emailInput.style.borderColor = '#e53935';
                } else {
                    emailInput.style.borderColor = '#e0e0e0';
                }
            });
            
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
            phoneInput.addEventListener('blur', () => {
                const phoneRegex = /^0[0-9]{9}$/;
                if (phoneInput.value && !phoneRegex.test(phoneInput.value)) {
                    phoneInput.style.borderColor = '#e53935';
                } else {
                    phoneInput.style.borderColor = '#e0e0e0';
                }
            });
        }

        // Show toast notification
        function showToast(message) {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            
            if (!toast || !toastMessage) {
                logger.warn('Toast elements not found');
                alert(message);
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
