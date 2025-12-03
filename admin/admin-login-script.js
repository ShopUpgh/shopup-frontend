// admin-login-script.js
console.log('Admin login script loaded');

let supabaseClient = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        showAlert('Configuration error. Please refresh the page.', 'error');
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check if already logged in
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // Verify admin role
        const isAdmin = await verifyAdminRole(session.user.id);
        if (isAdmin) {
            window.location.href = 'admin-dashboard.html';
            return;
        }
    }
    
    // Setup form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    
    try {
        // Sign in
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Verify admin role
        const isAdmin = await verifyAdminRole(data.user.id);
        
        if (!isAdmin) {
            // Not an admin - sign out
            await supabaseClient.auth.signOut();
            throw new Error('Access denied. Admin privileges required.');
        }
        
        // Log admin login
        await logAdminAction(
            data.user.id,
            'admin.login',
            'auth',
            null,
            'Admin logged in'
        );
        
        showAlert('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
        
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In to Admin Panel';
    }
}

async function verifyAdminRole(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('is_active', true)
            .in('role', ['admin', 'moderator'])
            .single();
        
        if (error) {
            console.error('Role verification error:', error);
            return false;
        }
        
        return !!data;
        
    } catch (error) {
        console.error('Role check error:', error);
        return false;
    }
}

async function logAdminAction(userId, action, resourceType, resourceId, description) {
    try {
        await supabaseClient
            .from('audit_logs')
            .insert([{
                user_id: userId,
                action: action,
                resource_type: resourceType,
                resource_id: resourceId,
                description: description
            }]);
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

function showAlert(message, type = 'error') {
    const container = document.getElementById('alertContainer');
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    const icon = type === 'error' ? '❌' : '✅';
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${icon} ${message}
        </div>
    `;
    
    if (type === 'success') {
        setTimeout(() => {
            container.innerHTML = '';
        }, 3000);
    }
}

console.log('✅ Admin login script loaded');
