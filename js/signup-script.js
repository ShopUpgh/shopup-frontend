// ShopUp Signup with Supabase Integration

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to initialize
    setTimeout(() => {
        // Use the global supabase client
        const supabase = window.supabaseClient || window.supabase;
        
        if (!supabase) {
            console.error('Supabase not initialized!');
            showToast('❌ Connection error. Please refresh the page.');
            return;
        }
        
        console.log('Supabase ready!');
    }, 200);
    
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignup();
        });
    }
    
    // Real-time validation
    setupValidation();
});

// Handle signup with Supabase
async function handleSignup() {
    // Get the global supabase client
    const supabase = window.supabaseClient;
    
    if (!supabase) {
        console.error('Supabase client not found!');
        showToast('❌ Connection error. Please refresh the page.');
        return;
    }
    
    const submitBtn = document.querySelector('.btn-submit') || document.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Submit button not found');
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
        
        console.log('Attempting signup with:', formData.email);
        
        // Step 1: Create auth user with Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
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
        
        if (authError) {
            console.error('Auth error:', authError);
            showToast('❌ ' + authError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Auth user created:', authData.user.id);
        
        // Wait briefly for Supabase to process the signup
        console.log('Processing signup...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Create seller profile in database
        const storeSlug = formData.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .insert([{
                id: authData.user.id,
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
            console.error('Seller profile error:', sellerError);
            showToast('❌ Failed to create seller profile: ' + sellerError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Seller profile created:', sellerData);
        
        // Store seller data locally for quick access
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
        
        localStorage.setItem('shopup_seller', JSON.stringify(sellerInfo));
        
        // Success!
        showToast('✓ Account created successfully!');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Signup error:', error);
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
    
    // Password confirmation check
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword && confirmPassword.value !== data.password) {
        showToast('Passwords do not match');
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
    
    // Terms checkbox
    const termsCheckbox = document.getElementById('agreeTerms');
    if (termsCheckbox && !termsCheckbox.checked) {
        showToast('Please agree to the Terms of Service and Privacy Policy');
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
        console.warn('Some form inputs not found for validation');
        return;
    }
    
    // Email validation
    emailInput.addEventListener('blur', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            emailInput.style.borderColor = '#e53935';
        } else {
            emailInput.style.borderColor = '#ddd';
        }
    });
    
    // Password match validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
                confirmPasswordInput.style.borderColor = '#e53935';
            } else {
                confirmPasswordInput.style.borderColor = '#ddd';
            }
        });
    }
    
    // Phone validation
    phoneInput.addEventListener('blur', () => {
        const phoneRegex = /^0[0-9]{9}$/;
        if (phoneInput.value && !phoneRegex.test(phoneInput.value)) {
            phoneInput.style.borderColor = '#e53935';
        } else {
            phoneInput.style.borderColor = '#ddd';
        }
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
        console.error('Toast elements not found');
        alert(message); // Fallback to alert
        return;
    }
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

console.log('Signup script loaded with Supabase integration');
