// ShopUp Login with Supabase Integration

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to initialize
    let supabaseCheckAttempts = 0;
    const maxAttempts = 10;
    
    const checkSupabase = setInterval(() => {
        supabaseCheckAttempts++;
        
        if (typeof supabase !== 'undefined' && supabase) {
            clearInterval(checkSupabase);
            console.log('✅ Supabase ready for login!');
            initializeLogin();
        } else if (supabaseCheckAttempts >= maxAttempts) {
            clearInterval(checkSupabase);
            console.error('❌ Supabase not initialized after', maxAttempts, 'attempts');
            showError('Connection error. Please refresh the page.');
        }
    }, 200);
});

// Initialize login form handling
function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) {
        console.error('Login form not found');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
    
    console.log('Login form initialized');
}

// Handle login with Supabase
async function handleLogin() {
    const submitBtn = document.querySelector('.btn-login');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (!submitBtn) {
        console.error('Submit button not found');
        showError('Form error. Please refresh the page.');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    // Hide any previous error messages
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    
    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;
        
        // Basic validation
        if (!email || !password) {
            showError('Please enter both email and password.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Attempting login for:', email);
        
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Login error:', error);
            
            // Show user-friendly error messages
            let errorMsg = 'Login failed. Please try again.';
            if (error.message.includes('Invalid login credentials')) {
                errorMsg = 'Invalid email or password. Please check your credentials.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMsg = 'Please verify your email address before logging in.';
            } else {
                errorMsg = error.message;
            }
            
            showError(errorMsg);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('✅ Login successful:', data.user.id);
        
        // Note: Supabase v2 handles session persistence automatically
        // The "Remember me" checkbox is supported via Supabase's built-in session management
        if (rememberMe) {
            console.log('Remember me enabled - session will persist');
        }
        
        // Fetch seller profile to verify user type and get additional info
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (sellerError) {
            console.warn('Could not fetch seller profile:', sellerError);
            // Continue anyway - user is authenticated
        } else if (sellerData) {
            // Store seller info for quick access
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
                storeSlug: sellerData.store_slug,
                status: sellerData.status
            };
            
            localStorage.setItem('shopup_seller', JSON.stringify(sellerInfo));
            console.log('Seller profile loaded:', sellerData.business_name);
        }
        
        // Show success message
        showToast('✅ Login successful! Redirecting...');
        
        // Determine redirect destination
        // Priority: seller dashboard > customer dashboard > home
        let redirectUrl = 'index.html';
        
        if (sellerData && sellerData.status === 'active') {
            // Seller - redirect to seller dashboard
            redirectUrl = 'dashboard.html';
        } else {
            // Check if customer profile exists
            const { data: customerData } = await supabase
                .from('customer_profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();
            
            if (customerData) {
                // Customer - redirect to customer dashboard or home
                redirectUrl = 'index.html';
            }
        }
        
        console.log('Redirecting to:', redirectUrl);
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Unexpected login error:', error);
        showError('An unexpected error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Show error message in the error UI
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Fallback to toast if error UI not found
        showToast('❌ ' + message);
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
        }, 4000);
    } else {
        // Fallback to console if toast not found
        console.log('Toast:', message);
    }
}

console.log('✅ Login script loaded');
