// customer-login-script.js
// Handles customer login with Supabase Auth

console.log('Customer login script loaded');

let supabaseClient = null;

// Wait for Supabase to initialize and safely check session
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Login page loaded');

    // Wait for Supabase on window (up to ~5 seconds)
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }

    if (!window.supabase) {
        console.error('❌ Supabase not loaded on window');
        showError('System error. Please refresh the page.');
        return;
    }

    supabaseClient = window.supabase;
    console.log('Supabase ready for login');

    // Safer existing-session check
    try {
        if (supabaseClient.auth && supabaseClient.auth.getSession) {
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error) {
                console.error('Session check error (login):', error);
            } else if (session && session.user) {
                console.log('Session found, verifying customer role…');

                const isCustomer = await checkUserRole(session.user.id);

                if (isCustomer) {
                    console.log('User already logged in as customer, redirecting…');
                    window.location.href = 'customer-dashboard.html'; // correct, we're in /customer/
                    return;
                } else {
                    console.warn('Logged in but not customer role, signing out…');
                    showError('Please use the seller login page.');
                    await supabaseClient.auth.signOut();
                }
            }
        }
    } catch (err) {
        console.warn('Could not check session on login:', err);
    }

    // Setup form submission after session handling
    setupFormSubmission();

    // Handle URL parameters (prefill email, show messages)
    checkURLParameters();
});

// Setup form submission
function setupFormSubmission() {
    const form = document.getElementById('loginForm');
    if (!form) {
        console.error('❌ loginForm not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!supabaseClient) {
            showError('System error. Please refresh the page.');
            return;
        }

        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }

        // Disable button and show loading
        const loginBtn = document.getElementById('loginBtn');
        const loading = document.getElementById('loading');

        if (loginBtn) loginBtn.disabled = true;
        if (loading) loading.classList.add('show');

        try {
            // Sign in with Supabase
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            console.log('Login successful:', data);

            if (!data.user) {
                throw new Error('No user returned from login.');
            }

            // Verify user is a customer
            const isCustomer = await checkUserRole(data.user.id);

            if (!isCustomer) {
                // Not a customer
                await supabaseClient.auth.signOut();
                showError('This account is not registered as a customer. Please use the seller login.');
                return;
            }

            // Update last login time
            await updateLastLogin(data.user.id);

            // Log login attempt
            await logLoginAttempt(data.user.id, email, true);

            // Show success
            showSuccess('Login successful! Redirecting...');

            // Redirect to customer dashboard
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html'; // correct relative path
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);

            // Log failed attempt
            await logLoginAttempt(null, email, false);

            let errorMessage = 'Login failed. Please check your credentials.';

            if (error.message?.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.message?.includes('Email not confirmed')) {
                errorMessage = 'Please verify your email address before logging in.';
            } else if (error.message?.includes('User not found')) {
                errorMessage = 'No account found with this email address.';
            }

            showError(errorMessage);

        } finally {
            if (loginBtn) loginBtn.disabled = false;
            if (loading) loading.classList.remove('show');
        }
    });
}

// Check user role
async function checkUserRole(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'customer')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') { // ignore "no rows"
            console.error('Error checking role:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('Error in checkUserRole:', error);
        return false;
    }
}

// Update last login time
async function updateLastLogin(userId) {
    try {
        const { error } = await supabaseClient
            .from('customer_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating last login:', error);
        }
    } catch (error) {
        console.error('Error in updateLastLogin:', error);
    }
}

// Log login attempt
async function logLoginAttempt(userId, email, success) {
    try {
        const { error } = await supabaseClient
            .from('login_history')
            .insert([{
                user_id: userId,
                email: email,
                success: success,
                user_agent: navigator.userAgent
            }]);

        if (error) {
            console.error('Error logging login attempt:', error);
        }
    } catch (error) {
        console.error('Error in logLoginAttempt:', error);
    }
}

// Check URL parameters (prefill email, show messages)
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Pre-fill email if provided
    const email = urlParams.get('email');
    if (email) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = email;
    }

    // Show message if provided
    const message = urlParams.get('message');
    if (message === 'registered') {
        showSuccess('Account created successfully! Please log in.');
    } else if (message === 'reset') {
        showSuccess('Password reset successfully! Please log in with your new password.');
    }
}

// Show success message
function showSuccess(message) {
    const successAlert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');

    if (errorAlert) errorAlert.classList.remove('show');
    if (successAlert) {
        successAlert.textContent = message;
        successAlert.classList.add('show');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show error message
function showError(message) {
    const errorAlert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');

    if (successAlert) successAlert.classList.remove('show');
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.classList.add('show');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('✅ Customer login script loaded');
