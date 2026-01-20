// Customer Registration Script for ShopUp Ghana
console.log('Customer registration script loaded');

// Wait for DOM and Supabase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Registration page loaded');
    
    // Wait for Supabase to load
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('❌ Supabase not loaded!');
        showAlert('System error. Please refresh the page.', 'error');
        return;
    }
    
    console.log('✅ Supabase ready for registration');
    
    // Get form elements
    const form = document.getElementById('registerForm');
    const submitBtn = document.getElementById('registerBtn');
    const loading = document.getElementById('loading');
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthContainer = document.getElementById('passwordStrength');
    
    if (passwordInput && strengthBar) {
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
    
    // Form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submitted');
            
            // Clear previous alerts
            hideAlerts();
            
            // Get form data
            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value,
                termsAccepted: document.getElementById('terms').checked,
                marketingConsent: document.getElementById('marketing').checked
            };
            
            // Validate form
            if (!validateForm(formData)) {
                return;
            }
            
            // Show loading
            submitBtn.disabled = true;
            loading.classList.add('show');
            
            try {
                console.log('Attempting to create account...');
                
                // Sign up user
                const client =
                    (typeof window.ShopUpSupabaseWait === 'function')
                        ? await window.ShopUpSupabaseWait()
                        : await window.supabaseReady;

                const { data, error } = await client.auth.signUp({
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
                
                if (error) {
                    console.error('Signup error:', error);
                    throw error;
                }
                
                console.log('✅ User created:', data.user.id);
                
                // Create customer profile
                await createProfile(data.user.id, formData);
                
                // Check if email confirmation is required
                if (data.user && !data.session) {
                    showSuccess('✅ Account created! Please check your email to verify your account.');
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        window.location.href = 'customer-login.html';
                    }, 3000);
                    return;
                }
                
                console.log('✅ Registration complete!');
                showSuccess('✅ Account created successfully! Redirecting to dashboard...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'customer-dashboard.html';
                }, 1500);
                
            } catch (error) {
                console.error('Registration error:', error);
                showAlert(error.message || 'Failed to create account. Please try again.', 'error');
                submitBtn.disabled = false;
                loading.classList.remove('show');
            }
        });
    }
});

// Create customer profile in database
async function createProfile(userId, formData) {
    console.log('Creating customer profile...');
    
    const client =
        (typeof window.ShopUpSupabaseWait === 'function')
            ? await window.ShopUpSupabaseWait()
            : await window.supabaseReady;

    const { error: profileError } = await client
        .from('customer_profiles')
        .insert({
            user_id: userId,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    
    if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create profile: ' + profileError.message);
    }
    
    console.log('✅ Customer profile created');
}

// Validate form
function validateForm(data) {
    let isValid = true;
    
    // Validate first name
    if (!data.firstName || data.firstName.length < 2) {
        showFieldError('firstName', 'First name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate last name
    if (!data.lastName || data.lastName.length < 2) {
        showFieldError('lastName', 'Last name must be at least 2 characters');
        isValid = false;
    }
    
    // Validate email
    if (!data.email || !isValidEmail(data.email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate phone
    if (!data.phone || data.phone.length < 10) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Validate password
    if (!data.password || data.password.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters');
        isValid = false;
    }
    
    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    // Validate terms
    if (!data.termsAccepted) {
        showAlert('Please accept the Terms of Service', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
        field.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Show alert
function showAlert(message, type) {
    const alertElement = document.getElementById(type === 'error' ? 'errorAlert' : 'successAlert');
    if (alertElement) {
        alertElement.textContent = message;
        alertElement.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
        }, 5000);
    }
}

// Show success message
function showSuccess(message) {
    showAlert(message, 'success');
}

// Hide all alerts
function hideAlerts() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => alert.classList.remove('show'));
    
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(error => error.classList.remove('show'));
    
    const fields = document.querySelectorAll('input.error');
    fields.forEach(field => field.classList.remove('error'));
}

console.log('✅ Customer registration script loaded');
