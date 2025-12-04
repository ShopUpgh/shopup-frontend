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
                    window.location.href = 'customer-dashboard.html';
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

// ---- keep the rest of your existing functions below ----
// setupFormSubmission()
// checkUserRole()
// updateLastLogin()
// logLoginAttempt()
// checkURLParameters()
// showSuccess()
// showError()

console.log('✅ Customer login script loaded');
