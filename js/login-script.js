// ShopUp Login with Supabase Integration

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to initialize
    setTimeout(() => {
        if (!supabase) {
            console.error('Supabase not initialized!');
            showToast('❌ Connection error. Please refresh the page.');
            return;
        }
        
        console.log('Supabase ready for login!');
    }, 200);
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    } else {
        console.error('Login form not found');
    }
});

// Handle login with Supabase
async function handleLogin() {
    const loginBtn = document.querySelector('.btn-login') || document.querySelector('button[type="submit"]');
    
    if (!loginBtn) {
        console.error('Login button not found');
        showToast('❌ Form error. Please refresh the page.');
        return;
    }
    
    const originalText = loginBtn.textContent;
    
    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate
        if (!email || !password) {
            showToast('❌ Please enter both email and password');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('Attempting login with:', email);
        
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('Login error:', error);
            showToast('❌ ' + error.message);
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('Auth successful:', data.user.id);
        
        // Fetch seller profile
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', data.user.id)
            .single();
        
        if (sellerError) {
            console.error('Seller profile error:', sellerError);
            showToast('❌ Could not load seller profile. Please try again.');
            await supabase.auth.signOut();
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;
            return;
        }
        
        console.log('Seller profile loaded:', sellerData);
        
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
            storeSlug: sellerData.store_slug,
            status: sellerData.status
        };
        
        localStorage.setItem('shopup_seller', JSON.stringify(sellerInfo));
        
        // Success!
        showToast('✓ Login successful! Redirecting to dashboard...');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ An error occurred. Please try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
        console.error('Toast elements not found');
        // Fallback to alert
        alert(message);
        return;
    }
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
