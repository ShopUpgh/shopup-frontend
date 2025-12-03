// customer-profile-script.js
console.log('Profile script loaded');

let supabaseClient = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Load profile data
    await loadProfile();
    
    // Setup forms
    setupProfileForm();
    setupPreferencesForm();
    setupPasswordForm();
});

async function loadProfile() {
    try {
        const { data, error } = await supabaseClient
            .from('customer_profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        // Fill form
        document.getElementById('firstName').value = data.first_name || '';
        document.getElementById('lastName').value = data.last_name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('dateOfBirth').value = data.date_of_birth || '';
        document.getElementById('gender').value = data.gender || '';
        
        // Preferences
        document.getElementById('marketingEmails').checked = data.receive_marketing_emails;
        document.getElementById('orderUpdates').checked = data.receive_order_updates;
        document.getElementById('whatsappUpdates').checked = data.receive_whatsapp_updates;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
    }
}

function setupProfileForm() {
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        try {
            const formData = new FormData(e.target);
            
            const { error } = await supabaseClient
                .from('customer_profiles')
                .update({
                    first_name: formData.get('firstName'),
                    last_name: formData.get('lastName'),
                    phone: formData.get('phone'),
                    date_of_birth: formData.get('dateOfBirth') || null,
                    gender: formData.get('gender') || null
                })
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            showSuccess('Profile updated successfully!');
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showError('Failed to update profile');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    });
}

function setupPreferencesForm() {
    document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        try {
            const { error } = await supabaseClient
                .from('customer_profiles')
                .update({
                    receive_marketing_emails: formData.get('marketingEmails') === 'on',
                    receive_order_updates: formData.get('orderUpdates') === 'on',
                    receive_whatsapp_updates: formData.get('whatsappUpdates') === 'on'
                })
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            showSuccess('Preferences updated!');
            
        } catch (error) {
            console.error('Error updating preferences:', error);
            showError('Failed to update preferences');
        }
    });
}

function setupPasswordForm() {
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (newPassword !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            showError('Password must be at least 8 characters');
            return;
        }
        
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            
            showSuccess('Password changed successfully!');
            e.target.reset();
            
        } catch (error) {
            console.error('Error changing password:', error);
            showError('Failed to change password');
        }
    });
}

function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    const errorAlert = document.getElementById('errorAlert');
    
    errorAlert.classList.remove('show');
    alert.textContent = message;
    alert.classList.add('show');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    const successAlert = document.getElementById('successAlert');
    
    successAlert.classList.remove('show');
    alert.textContent = message;
    alert.classList.add('show');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('✅ Profile script loaded');
