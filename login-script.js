// ShopUp Login with Supabase Integration

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Supabase to initialize
    setTimeout(() => {
        if (!supabase) {
            console.error('Supabase not initialized!');
            showToast('❌ Connection error. Please refresh the page.');
            return;
        }
        
        console.log('Supabase ready!');
    }, 200);
    
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
});

// Handle login with Supabase
async function handleLogin() {
    const submitBtn = document.querySelector('.btn-login') || document.querySelector('button[type="submit"]');
    
    if (!submitBtn) {
        console.error('Submit button not found');
        showToast('❌ Form error. Please refresh the page.');
        return;
    }
    
    const originalText = submitBtn.textContent;
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate
        if (!email || !password) {
            showToast('Please enter both email and password');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Attempting login with:', email);
        
        // Step 1: Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            console.error('Auth error:', authError);
            showToast('❌ ' + authError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Auth successful:', authData.user.id);
        
        // Step 2: Fetch seller profile
        const { data: sellerData, error: sellerError } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', authData.user.id)
            .single();
        
        if (sellerError) {
            console.error('Seller profile error:', sellerError);
            showToast('❌ Failed to fetch seller profile: ' + sellerError.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        console.log('Seller profile fetched:', sellerData);
        
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
        showToast('✓ Login successful!');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('❌ An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
        console.error('Toast elements not found');
        alert(message);
        return;
    }
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

console.log('Login script loaded with Supabase integration');
