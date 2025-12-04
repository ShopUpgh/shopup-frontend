// Customer Login Script for ShopUp Ghana
console.log('Customer login script loaded');

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Login page loaded');
    
    // Wait for Supabase to load
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        console.error('❌ Supabase not loaded!');
        showError('System error. Please refresh the page.');
        return;
    }
    
    console.log('Supabase ready for login');
    
    // Check if user is already logged in
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('User already logged in, redirecting to dashboard...');
            window.location.href = 'customer-dashboard.html';
            return;
        }
    } catch (err) {
        console.warn('Could not check session:', err);
    }
    
    // Setup login form
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('loginBtn');
    const loading = document.getElementById('loading');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            // Get form data
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe')?.checked || false;
            
            // Validate
            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }
            
            // Show loading
            submitBtn.disabled = true;
            if (loading) loading.classList.add('show');
            
            try {
                console.log('Attempting login...');
                
                // Sign in with Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    console.error('Login error:', error);
                    throw error;
                }
                
                console.log('✅ Login successful!', data.user.id);
                
                // Check if customer profile exists
                const { data: profile } = await supabase
                    .from('customer_profiles')
                    .select('full_name')
                    .eq('user_id', data.user.id)
                    .single();
                
                if (profile) {
                    console.log('✅ Customer profile found:', profile.full_name);
                }
                
                showSuccess('Login successful! Redirecting...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'customer-dashboard.html';
                }, 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'Login failed. Please try again.';
                
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Invalid email or password';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'Please verify your email before logging in';
                }
                
                showError(errorMessage);
                submitBtn.disabled = false;
                if (loading) loading.classList.remove('show');
            }
        });
    }
});

// Show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.classList.add('show');
        
        setTimeout(() => {
            errorAlert.classList.remove('show');
        }, 5000);
    }
}

// Show success message
function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    if (successAlert) {
        successAlert.textContent = message;
        successAlert.classList.add('show');
    }
}

console.log('✅ Customer login script loaded');
