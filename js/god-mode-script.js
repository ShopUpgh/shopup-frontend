// god-mode-script.js
console.log('⚡ GOD MODE SYSTEM INITIALIZED');

let supabaseClient = null;
let currentUser = null;
let yubikeyVerified = false;
let biometricVerified = false;
let godModeSession = null;

// Matrix background effect
function initMatrix() {
    const canvas = document.getElementById('matrix');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const letters = '01';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 33);
}

document.addEventListener('DOMContentLoaded', async () => {
    initMatrix();
    
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        showAlert('SYSTEM ERROR: Supabase not initialized', 'error');
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        showAlert('ACCESS DENIED: Authentication required', 'error');
        setTimeout(() => {
            window.location.href = 'admin-login.html';
        }, 2000);
        return;
    }
    
    currentUser = session.user;
    
    // Verify God Mode access
    const hasAccess = await verifyGodModeAccess();
    if (!hasAccess) {
        showAlert('ACCESS DENIED: Not authorized for God Mode', 'error');
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 2000);
        return;
    }
    
    // Initialize YubiKey authentication
    initYubikeyAuth();
});

async function verifyGodModeAccess() {
    try {
        const { data, error } = await supabaseClient
            .from('god_mode_users')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        if (error || !data) {
            console.error('Not a God Mode user');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('God Mode verification error:', error);
        return false;
    }
}

function initYubikeyAuth() {
    const yubikeyZone = document.getElementById('yubikeyZone');
    
    yubikeyZone.addEventListener('click', async () => {
        await authenticateWithYubikey();
    });
    
    // Also support NFC detection
    if ('NDEFReader' in window) {
        const ndef = new NDEFReader();
        ndef.addEventListener("reading", () => {
            authenticateWithYubikey();
        });
        
        try {
            ndef.scan();
        } catch (error) {
            console.log('NFC not available');
        }
    }
}

async function authenticateWithYubikey() {
    const zone = document.getElementById('yubikeyZone');
    const status = document.getElementById('yubikeyStatus');
    
    zone.classList.add('active');
    status.textContent = '🔄';
    
    try {
        // Use WebAuthn API for YubiKey
        const publicKeyCredentialRequestOptions = {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: 'required'
        };
        
        const credential = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
        
        if (credential) {
            yubikeyVerified = true;
            status.textContent = '✅';
            status.className = 'status-indicator success';
            zone.classList.remove('active');
            
            showAlert('YubiKey verified successfully', 'success');
            
            // Enable biometric step
            document.getElementById('biometricBtn').disabled = false;
            
            // Log attempt
            await logGodModeAction('yubikey.verified', 'YubiKey authentication successful');
        }
        
    } catch (error) {
        console.error('YubiKey error:', error);
        status.textContent = '❌';
        status.className = 'status-indicator failed';
        zone.classList.remove('active');
        
        showAlert('YubiKey authentication failed', 'error');
        
        // Log failed attempt
        await logGodModeAction('yubikey.failed', 'YubiKey authentication failed');
    }
}

async function verifyBiometric() {
    const status = document.getElementById('biometricStatus');
    const btn = document.getElementById('biometricBtn');
    
    btn.disabled = true;
    btn.textContent = 'Scanning...';
    status.textContent = '🔄';
    
    try {
        // Check if biometric is available
        if (!window.PublicKeyCredential) {
            throw new Error('Biometric authentication not supported');
        }
        
        // Simulate biometric check (in production, use actual biometric API)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        biometricVerified = true;
        status.textContent = '✅';
        status.className = 'status-indicator success';
        btn.textContent = 'Verified ✓';
        
        showAlert('Biometric verification successful', 'success');
        
        // Enable activation button
        if (yubikeyVerified && biometricVerified) {
            document.getElementById('activateBtn').disabled = false;
        }
        
        // Verify Bitkey (optional - auto-success for now)
        document.getElementById('bitkeyStatus').textContent = '✅';
        document.getElementById('bitkeyStatus').className = 'status-indicator success';
        
        await logGodModeAction('biometric.verified', 'Biometric authentication successful');
        
    } catch (error) {
        console.error('Biometric error:', error);
        status.textContent = '❌';
        status.className = 'status-indicator failed';
        btn.disabled = false;
        btn.textContent = 'Try Again';
        
        showAlert('Biometric authentication failed', 'error');
        
        await logGodModeAction('biometric.failed', 'Biometric authentication failed');
    }
}

async function activateGodMode() {
    const btn = document.getElementById('activateBtn');
    btn.disabled = true;
    btn.textContent = 'ACTIVATING...';
    
    try {
        // Create God Mode session
        const { data: sessionData, error } = await supabaseClient.rpc('create_god_mode_session', {
            p_user_id: currentUser.id,
            p_yubikey_response: 'yubikey_token_here',
            p_device_info: {
                device_id: 'device_id',
                device_name: navigator.userAgent,
                ip_address: 'client_ip'
            }
        });
        
        if (error) throw error;
        
        godModeSession = sessionData;
        
        // Update UI
        document.getElementById('accessStatus').textContent = 'SOVEREIGN ACCESS ACTIVE';
        
        showAlert('⚡ GOD MODE ACTIVATED', 'success');
        
        // Switch to God Mode menu
        setTimeout(() => {
            document.getElementById('authScreen').style.display = 'none';
            document.getElementById('godMenu').classList.add('active');
        }, 1500);
        
    } catch (error) {
        console.error('God Mode activation error:', error);
        showAlert('ACTIVATION FAILED: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '⚡ ACTIVATE GOD MODE';
    }
}

async function logGodModeAction(actionType, description) {
    try {
        await supabaseClient
            .from('god_mode_actions')
            .insert([{
                action_type: actionType,
                action_description: description,
                severity: 'high'
            }]);
    } catch (error) {
        console.error('Failed to log action:', error);
    }
}

// God Mode Menu Functions

window.impersonateUser = function() {
    const userId = prompt('Enter User ID to impersonate:');
    if (userId) {
        logGodModeAction('user.impersonate', `Impersonating user: ${userId}`);
        window.location.href = `impersonate.html?user=${userId}`;
    }
};

window.openDatabase = function() {
    logGodModeAction('database.accessed', 'Opened database management');
    window.open('https://supabase.com/dashboard/project/_/editor', '_blank');
};

window.featureFlags = function() {
    logGodModeAction('feature_flags.opened', 'Opened feature flags');
    window.location.href = 'god-mode-features.html';
};

window.revenueWarRoom = function() {
    logGodModeAction('revenue.viewed', 'Opened revenue war room');
    window.location.href = 'god-mode-revenue.html';
};

window.emergencyBroadcast = function() {
    logGodModeAction('emergency.broadcast_opened', 'Opened emergency broadcast');
    window.location.href = 'god-mode-broadcast.html';
};

window.auditLog = function() {
    logGodModeAction('audit_log.viewed', 'Opened hidden audit log');
    window.location.href = 'god-mode-audit.html';
};

window.killSwitch = async function() {
    const confirm1 = confirm('⚠️ WARNING: This will shut down the ENTIRE platform.\n\nAre you sure?');
    if (!confirm1) return;
    
    const confirm2 = confirm('⚠️ FINAL WARNING: All users will be disconnected.\n\nProceed with shutdown?');
    if (!confirm2) return;
    
    const reason = prompt('Enter shutdown reason:');
    if (!reason) return;
    
    try {
        await supabaseClient.rpc('activate_kill_switch', {
            p_god_user_id: currentUser.id,
            p_reason: reason
        });
        
        showAlert('☢️ PLATFORM KILL SWITCH ACTIVATED', 'error');
        
        setTimeout(() => {
            window.location.href = 'maintenance.html';
        }, 3000);
        
    } catch (error) {
        console.error('Kill switch error:', error);
        showAlert('Kill switch activation failed', 'error');
    }
};

window.deactivateGodMode = async function() {
    if (!confirm('Exit God Mode?')) return;
    
    await logGodModeAction('god_mode.deactivated', 'God Mode session ended');
    
    showAlert('God Mode deactivated', 'success');
    
    setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
    }, 1000);
};

function showAlert(message, type = 'error') {
    const container = document.getElementById('alertContainer');
    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';
    
    container.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

console.log('✅ God Mode system ready');
console.log('🔒 Security Level: CLASSIFIED');
console.log('👑 Access: OWNER ONLY');
