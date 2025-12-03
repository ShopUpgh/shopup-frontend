// ShopUp Login with Supabase Integration

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to initialize
    setTimeout(() => {
        if (!supabase) {
            console.error('Supabase not initialized');
            showToast('❌ Connection error. Please refresh the page.');
            return;
        }
        
        console.log('Supabase ready for login');
    }, 200);
    
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
    
    // Real-time validation
    setupValidation();
});

// Handle login
async function handleLogin() {
    const submitBtn = document.querySelector('.btn-submit') || document.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Submit button not found');
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
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        console.log('Attempting login with:', email);
        
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Login error:', error);
            showToast('❌ ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Login successful:', data.user.id);
        
        // Get seller profile
        const { data: sellerProfile, error: profileError } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (profileError) {
            console.error('Profile error:', profileError);
            showToast('❌ Error loading profile');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Seller profile loaded:', sellerProfile);
        
        // Store seller data in localStorage/sessionStorage
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('shopup_seller', JSON.stringify(sellerProfile));
        
        // Verify session is properly set
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session verified:', session ? 'YES' : 'NO');
        
        // Show success message
        showToast('✓ Login successful!');
        
        // Wait longer before redirect to ensure session is stable
        setTimeout(() => {
            console.log('Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Setup validation
function setupValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            validateEmail(emailInput);
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            validatePassword(passwordInput);
        });
    }
}

// Validate email
function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        setInputError(input, 'Email is required');
        return false;
    }
    
    if (!emailRegex.test(email)) {
        setInputError(input, 'Please enter a valid email');
        return false;
    }
    
    setInputSuccess(input);
    return true;
}

// Validate password
function validatePassword(input) {
    const password = input.value;
    
    if (!password) {
        setInputError(input, 'Password is required');
        return false;
    }
    
    if (password.length < 8) {
        setInputError(input, 'Password must be at least 8 characters');
        return false;
    }
    
    setInputSuccess(input);
    return true;
}

// Set input error
function setInputError(input, message) {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        
        let errorMsg = formGroup.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('span');
            errorMsg.className = 'error-message';
            formGroup.appendChild(errorMsg);
        }
        errorMsg.textContent = message;
    }
}

// Set input success
function setInputSuccess(input) {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        
        const errorMsg = formGroup.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    } else {
        // Just log if toast not found - don't block with alert
        console.log('Toast message:', message);
    }
}

console.log('Login script loaded with Supabase integration');