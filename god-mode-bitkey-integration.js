// god-mode-bitkey-integration.js
// Add this to your existing god-mode-script.js

// ============================================
// BITKEY KILL SWITCH FLOW
// ============================================

async function activateKillSwitchWithBitkey() {
    const btn = document.getElementById('killSwitchBtn');
    const modal = document.getElementById('bitkeyModal');
    
    if (!btn || !modal) {
        console.error('Kill switch button or modal not found');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Generating Challenge...';

    try {
        // Step 1: Get reason from user
        const reason = prompt('Enter reason for kill switch activation:');
        if (!reason || reason.trim() === '') {
            showAlert('Kill switch cancelled', 'info');
            resetKillSwitchButton();
            return;
        }

        // Step 2: Generate Bitkey challenge
        showAlert('Generating Bitkey challenge...', 'info');
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        const accessToken = session?.access_token;

        const challengeRes = await fetch('/functions/v1/bitkey-verify/challenge', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                actionType: 'kill_switch',
                metadata: { reason }
            })
        });

        if (!challengeRes.ok) {
            const err = await challengeRes.json();
            throw new Error(err.error || 'Failed to generate challenge');
        }

        const { challenge } = await challengeRes.json();

        // Step 3: Show Bitkey modal with challenge
        showBitkeyModal(challenge, reason);

    } catch (error) {
        console.error('Kill switch error:', error);
        showAlert(`Failed to generate challenge: ${error.message}`, 'error');
        resetKillSwitchButton();
    }
}

function showBitkeyModal(challenge, reason) {
    const modal = document.getElementById('bitkeyModal');
    const challengeText = document.getElementById('bitkeyChallenge');
    const qrCode = document.getElementById('bitkeyQR');
    const signatureInput = document.getElementById('bitkeySignature');
    const submitBtn = document.getElementById('submitBitkeyBtn');

    // Display challenge text
    challengeText.textContent = challenge.challenge_text;

    // Generate QR code (using qrcode.js library)
    // Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    qrCode.innerHTML = '';
    new QRCode(qrCode, {
        text: challenge.challenge_text,
        width: 200,
        height: 200,
        colorDark: '#0a0e27',
        colorLight: '#ffffff'
    });

    // Show modal
    modal.style.display = 'flex';

    // Handle signature submission
    submitBtn.onclick = () => submitBitkeySignature(challenge, reason);
}

async function submitBitkeySignature(challenge, reason) {
    const signatureInput = document.getElementById('bitkeySignature');
    const submitBtn = document.getElementById('submitBitkeyBtn');
    const signature = signatureInput.value.trim();

    if (!signature) {
        showAlert('Please enter Bitkey signature', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const accessToken = session?.access_token;

        // Step 1: Verify signature
        const verifyRes = await fetch('/functions/v1/bitkey-verify/verify', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                challengeId: challenge.challenge_id,
                signature: signature
            })
        });

        if (!verifyRes.ok) {
            const err = await verifyRes.json();
            throw new Error(err.error || 'Signature verification failed');
        }

        const { actionId } = await verifyRes.json();

        // Step 2: Execute kill switch
        const killRes = await fetch('/functions/v1/bitkey-verify/kill-switch', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                actionId,
                reason
            })
        });

        if (!killRes.ok) {
            const err = await killRes.json();
            throw new Error(err.error || 'Kill switch activation failed');
        }

        // Success!
        closeBitkeyModal();
        showAlert('☢️ KILL SWITCH ACTIVATED - Platform is now in maintenance mode', 'success');
        
        // Update UI
        document.getElementById('killSwitchStatus').textContent = 'ACTIVE';
        document.getElementById('killSwitchStatus').className = 'status-badge active';
        
        // Log action
        await logGodModeAction('platform.kill_switch', `Kill switch activated with Bitkey: ${reason}`);

    } catch (error) {
        console.error('Bitkey verification error:', error);
        showAlert(`Verification failed: ${error.message}`, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Signature';
    }
}

function closeBitkeyModal() {
    const modal = document.getElementById('bitkeyModal');
    modal.style.display = 'none';
    
    // Reset form
    document.getElementById('bitkeySignature').value = '';
    document.getElementById('submitBitkeyBtn').textContent = 'Submit Signature';
    document.getElementById('submitBitkeyBtn').disabled = false;
    
    resetKillSwitchButton();
}

function resetKillSwitchButton() {
    const btn = document.getElementById('killSwitchBtn');
    if (btn) {
        btn.disabled = false;
        btn.textContent = '☢️ Activate Kill Switch';
    }
}

// ============================================
// BITKEY MODAL HTML (Add to your god-mode.html)
// ============================================

/*
<!-- Bitkey Verification Modal -->
<div id="bitkeyModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; align-items: center; justify-content: center;">
    <div style="background: #0a0e27; padding: 40px; border-radius: 20px; max-width: 600px; width: 90%; border: 2px solid #f59e0b;">
        <h2 style="color: #f59e0b; margin-bottom: 20px;">🔐 Bitkey Verification Required</h2>
        
        <div style="margin-bottom: 20px;">
            <h3 style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 10px;">Challenge Text:</h3>
            <pre id="bitkeyChallenge" style="background: rgba(15,23,42,0.8); padding: 15px; border-radius: 8px; color: #e0f7ff; font-size: 0.85rem; overflow-x: auto; max-height: 200px;"></pre>
        </div>

        <div style="margin-bottom: 20px; text-align: center;">
            <h3 style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 10px;">Scan with Bitkey App:</h3>
            <div id="bitkeyQR" style="display: inline-block; padding: 10px; background: white; border-radius: 8px;"></div>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 10px;">Paste Signature from Bitkey:</h3>
            <input 
                type="text" 
                id="bitkeySignature" 
                placeholder="Paste signature here (hex format)"
                style="width: 100%; padding: 12px; background: rgba(15,23,42,0.8); border: 1px solid rgba(148,163,184,0.3); border-radius: 8px; color: #e0f7ff; font-family: 'Courier New', monospace;"
            >
        </div>

        <div style="display: flex; gap: 10px;">
            <button 
                id="submitBitkeyBtn"
                style="flex: 1; padding: 12px; background: linear-gradient(135deg, #f59e0b, #f97316); border: none; border-radius: 999px; color: #0a0e27; font-weight: 700; cursor: pointer;"
            >
                Submit Signature
            </button>
            <button 
                onclick="closeBitkeyModal()"
                style="padding: 12px 24px; background: transparent; border: 1px solid rgba(148,163,184,0.6); border-radius: 999px; color: #e0f7ff; cursor: pointer;"
            >
                Cancel
            </button>
        </div>
    </div>
</div>

<!-- Add QR Code library -->
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
*/

// ============================================
// HELPER FUNCTIONS
// ============================================

async function testBitkeySetup() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const { data: godUser, error } = await supabaseClient
            .from('god_mode_users')
            .select('bitkey_serial, bitkey_public_key, bitkey_registered_at')
            .eq('user_id', session.user.id)
            .single();

        if (error || !godUser) {
            showAlert('⚠️ Bitkey not set up. Visit bitkey-setup.html first', 'error');
            return false;
        }

        if (!godUser.bitkey_serial || !godUser.bitkey_public_key) {
            showAlert('⚠️ Bitkey registration incomplete', 'error');
            return false;
        }

        showAlert(`✅ Bitkey ready: ${godUser.bitkey_serial}`, 'success');
        return true;
    } catch (error) {
        console.error('Bitkey test error:', error);
        return false;
    }
}

// Call this when God Mode is activated
async function initializeBitkeyFeatures() {
    const isBitkeyReady = await testBitkeySetup();
    
    if (isBitkeyReady) {
        // Enable Bitkey-protected features
        document.getElementById('killSwitchBtn').disabled = false;
        
        // Add Bitkey indicator to UI
        const bitkeyStatus = document.getElementById('bitkeyStatus');
        if (bitkeyStatus) {
            bitkeyStatus.textContent = '✅ Ready';
            bitkeyStatus.className = 'status-indicator success';
        }
    } else {
        // Disable Bitkey-protected features
        const killBtn = document.getElementById('killSwitchBtn');
        if (killBtn) {
            killBtn.disabled = true;
            killBtn.title = 'Bitkey setup required';
        }
    }
}
