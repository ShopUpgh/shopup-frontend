// login-script.js - Seller Login
console.log('Seller login script loaded');

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase client to be initialized
    let attempts = 0;
    while (typeof supabase === 'undefined' && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (typeof supabase === 'undefined') {
        showError('Configuration error. Please refresh the page.');
        return;
    }
    
    console.log('✅ Supabase ready for seller login');
    
    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        // Check if user is a seller
        const userRole = await checkUserRole(session.user.id);
        if (userRole === 'seller') {
            window.location.href = 'dashboard.html';
            return;
        }
    }
    
    // Setup form
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        // Check user role
        const userRole = await checkUserRole(data.user.id);
        
        if (!userRole || userRole === 'customer') {
            await supabase.auth.signOut();
            throw new Error('This login is for sellers only. Please use the customer login.');
        }
        
        // Show success message
        showSuccess('Login successful! Redirecting...');
        
        // Redirect based on role
        setTimeout(() => {
            if (userRole === 'seller') {
                window.location.href = 'dashboard.html';
            } else if (userRole === 'admin') {
                window.location.href = 'admin/admin-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please confirm your email address before logging in.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorMessage);
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function checkUserRole(userId) {
    try {
        const { data, error } = await supabase
            .from('user_roles')
            .select('user_type')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Role check error:', error);
            return null;
        }
        
        return data?.user_type || null;
        
    } catch (error) {
        console.error('Error checking user role:', error);
        return null;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        // Fallback to toast
        showToast(message, 'error');
    }
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    } else {
        // Fallback to alert
        alert(message);
    }
}

console.log('✅ Seller login script loaded');
