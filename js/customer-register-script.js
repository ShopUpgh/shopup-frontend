// customer-register-script.js
// Handles customer registration with validation

console.log('Customer registration script loaded');

let supabaseClient = null;

// Wait for Supabase to initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Registration page loaded');
    
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        showError('Unable to connect. Please refresh the page.');
        return;
    }
    
    supabaseClient = window.supabase;
    console.log('Supabase ready for registration');
    
    // Check if already logged in
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // Already logged in, redirect to customer dashboard
        window.location.href = 'customer-dashboard.html';
        return;
    }
    
    // Setup form handling
    setupFormValidation();
    setupPasswordStrength();
    setupFormSubmission();
});

// Form validation setup
function setupFormValidation() {
    const form = document.getElementById('registerForm');
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
    });
}

// Validate individual field
function validateField(input) {
    const value = input.value.trim();
    const fieldName = input.name;
    let isValid = true;
    let errorMessage = '';
    
    switch(fieldName) {
        case 'firstName':
        case 'lastName':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters';
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'phone':
            // Ghana phone number validation
            const phoneRegex = /^(\+233|0)[2-9][0-9]{8}$/;
            const cleanPhone = value.replace(/\s+/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                isValid = false;
                errorMessage = 'Please enter a valid Ghana phone number';
            }
            break;
            
        case 'password':
            if (value.length < 8) {
                isValid = false;
                errorMessage = 'Password must be at least 8 characters';
            } else if (!/[A-Z]/.test(value)) {
                isValid = false;
                errorMessage = 'Password must contain an uppercase letter';
            } else if (!/[a-z]/.test(value)) {
                isValid = false;
                errorMessage = 'Password must contain a lowercase letter';
            } else if (!/[0-9]/.test(value)) {
                isValid = false;
                errorMessage = 'Password must contain a number';
            }
            break;
            
        case 'confirmPassword':
            const password = document.getElementById('password').value;
            if (value !== password) {
                isValid = false;
                errorMessage = 'Passwords do not match';
            }
            break;
    }
    
    if (!isValid) {
        showFieldError(input, errorMessage);
    }
    
    return isValid;
}

// Show field error
function showFieldError(input, message) {
    input.classList.add('error');
    const errorDiv = document.getElementById(input.name + 'Error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
}

// Clear field error
function clearError(input) {
    input.classList.remove('error');
    const errorDiv = document.getElementById(input.name + 'Error');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

// Password strength indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('passwordStrengthBar');
    const strengthContainer = document.getElementById('passwordStrength');
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        
        if (password.length === 0) {
            strengthContainer.classList.remove('show');
            return;
        }
        
        strengthContainer.classList.add('show');
        const strength = calculatePasswordStrength(password);
        
        strengthBar.className = 'password-strength-bar';
        
        if (strength < 40) {
            strengthBar.classList.add('weak');
        } else if (strength < 70) {
            strengthBar.classList.add('medium');
        } else {
            strengthBar.classList.add('strong');
        }
    });
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    
    // Complexity
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    
    return strength;
}

// Form submission
function setupFormSubmission() {
    const form = document.getElementById('registerForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields
        const inputs = form.querySelectorAll('input[required]');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                allValid = false;
            }
        });
        
        // Check terms checkbox
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox.checked) {
            showError('Please accept the Terms of Service and Privacy Policy');
            allValid = false;
        }
        
        if (!allValid) {
            return;
        }
        
        // Disable button and show loading
        const submitBtn = document.getElementById('registerBtn');
        const loading = document.getElementById('loading');
        
        submitBtn.disabled = true;
        loading.classList.add('show');
        
        // Get form data
        const formData = new FormData(form);
        const userData = {
            email: formData.get('email').trim(),
            password: formData.get('password'),
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            phone: formData.get('phone').trim().replace(/\s+/g, ''),
            receiveMarketing: formData.get('marketing') === 'on'
        };
        
        try {
            // Register user with Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        first_name: userData.firstName,
                        last_name: userData.lastName,
                        phone: userData.phone,
                        role: 'customer'
                    }
                }
            });
            
            if (error) throw error;
            
            console.log('User registered successfully:', data);
            
            // Update customer profile with additional info
            if (data.user) {
                await updateCustomerProfile(data.user.id, userData);
            }
            
            // Show success message
            showSuccess('Account created successfully! Redirecting...');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('already registered')) {
                errorMessage = 'This email is already registered. Please login instead.';
            } else if (error.message.includes('email')) {
                errorMessage = 'Invalid email address.';
            } else if (error.message.includes('password')) {
                errorMessage = 'Password does not meet requirements.';
            }
            
            showError(errorMessage);
            
        } finally {
            submitBtn.disabled = false;
            loading.classList.remove('show');
        }
    });
}

// Update customer profile
async function updateCustomerProfile(userId, userData) {
    try {
        const { error } = await supabaseClient
            .from('customer_profiles')
            .update({
                first_name: userData.firstName,
                last_name: userData.lastName,
                phone: userData.phone,
                receive_marketing_emails: userData.receiveMarketing
            })
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error updating profile:', error);
        } else {
            console.log('Customer profile updated');
        }
    } catch (error) {
        console.error('Error in updateCustomerProfile:', error);
    }
}

// Show success message
function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');
    
    errorAlert.classList.remove('show');
    successAlert.textContent = message;
    successAlert.classList.add('show');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    successAlert.classList.remove('show');
    errorAlert.textContent = message;
    errorAlert.classList.add('show');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('✅ Customer registration script loaded');
