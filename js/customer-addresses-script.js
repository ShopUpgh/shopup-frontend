// customer-addresses-script.js
console.log('Addresses script loaded');

let supabaseClient = null;
let currentUser = null;
let customerId = null;
let editingAddressId = null;

document.addEventListener('DOMContentLoaded', async () => {
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
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'customer-login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Get customer ID
    const { data: profile } = await supabaseClient
        .from('customer_profiles')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
    
    customerId = profile.id;
    
    // Load addresses
    await loadAddresses();
    
    // Setup buttons
    document.getElementById('addAddressBtn').addEventListener('click', openAddModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('addressForm').addEventListener('submit', saveAddress);
});

async function loadAddresses() {
    try {
        const { data: addresses, error } = await supabaseClient
            .from('customer_addresses')
            .select('*')
            .eq('customer_id', customerId)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const grid = document.getElementById('addressesGrid');
        
        if (!addresses || addresses.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📍</div>
                    <h3>No addresses yet</h3>
                    <p>Add your delivery address to start shopping</p>
                </div>
            `;
            return;
        }
        
        // SECURITY: Sanitize user-generated address content
        grid.innerHTML = addresses.map(addr => {
            const safeName = typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.full_name) : addr.full_name;
            const safeLabel = typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.address_label || addr.full_name) : (addr.address_label || addr.full_name);
            const safePhone = typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.phone) : addr.phone;
            const safeStreet = typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.street_address) : addr.street_address;
            const safeLandmark = addr.landmark ? (typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.landmark) : addr.landmark) : '';
            const safeCity = typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.city) : addr.city;
            const safeRegion = typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.region) : addr.region;
            const safeDigital = addr.digital_address ? (typeof sanitizeHTML === 'function' ? sanitizeHTML(addr.digital_address) : addr.digital_address) : '';
            
            return `
                <div class="address-card ${addr.is_default ? 'default' : ''}">
                    ${addr.is_default ? '<div class="default-badge">Default</div>' : ''}
                    
                    <div class="address-type">${addr.address_type}</div>
                    <div class="address-name">${safeLabel}</div>
                    
                    <div class="address-details">
                        <strong>${safeName}</strong><br>
                        ${safePhone}<br>
                        ${safeStreet}<br>
                        ${safeLandmark ? `Near ${safeLandmark}<br>` : ''}
                        ${safeCity}, ${safeRegion}<br>
                        ${safeDigital ? `GPS: ${safeDigital}` : ''}
                    </div>
                    
                    <div class="address-actions">
                        ${!addr.is_default ? `<button class="btn-default" onclick="setDefault('${addr.id}')">Set as Default</button>` : ''}
                        <button class="btn-edit" onclick="editAddress('${addr.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteAddress('${addr.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading addresses:', error);
    }
}

function openAddModal() {
    editingAddressId = null;
    document.getElementById('modalTitle').textContent = 'Add New Address';
    document.getElementById('addressForm').reset();
    document.getElementById('addressModal').classList.add('show');
}

function closeModal() {
    document.getElementById('addressModal').classList.remove('show');
}

window.editAddress = async function(id) {
    editingAddressId = id;
    
    const { data, error } = await supabaseClient
        .from('customer_addresses')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error loading address:', error);
        return;
    }
    
    // Fill form
    document.getElementById('modalTitle').textContent = 'Edit Address';
    document.getElementById('addressId').value = data.id;
    document.getElementById('addressType').value = data.address_type;
    document.getElementById('addressLabel').value = data.address_label || '';
    document.getElementById('fullName').value = data.full_name;
    document.getElementById('phone').value = data.phone;
    document.getElementById('streetAddress').value = data.street_address;
    document.getElementById('landmark').value = data.landmark || '';
    document.getElementById('city').value = data.city;
    document.getElementById('region').value = data.region;
    document.getElementById('digitalAddress').value = data.digital_address || '';
    document.getElementById('deliveryInstructions').value = data.delivery_instructions || '';
    
    document.getElementById('addressModal').classList.add('show');
};

async function saveAddress(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const addressData = {
        customer_id: customerId,
        address_type: formData.get('addressType'),
        address_label: formData.get('addressLabel'),
        full_name: formData.get('fullName'),
        phone: formData.get('phone'),
        street_address: formData.get('streetAddress'),
        landmark: formData.get('landmark'),
        city: formData.get('city'),
        region: formData.get('region'),
        digital_address: formData.get('digitalAddress'),
        delivery_instructions: formData.get('deliveryInstructions')
    };
    
    try {
        if (editingAddressId) {
            // Update
            const { error } = await supabaseClient
                .from('customer_addresses')
                .update(addressData)
                .eq('id', editingAddressId);
            
            if (error) throw error;
        } else {
            // Insert
            const { error } = await supabaseClient
                .from('customer_addresses')
                .insert([addressData]);
            
            if (error) throw error;
        }
        
        closeModal();
        await loadAddresses();
        
    } catch (error) {
        console.error('Error saving address:', error);
        alert('Failed to save address');
    }
}

window.setDefault = async function(id) {
    try {
        // First, unset all defaults
        await supabaseClient
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('customer_id', customerId);
        
        // Then set this one as default
        const { error } = await supabaseClient
            .from('customer_addresses')
            .update({ is_default: true })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadAddresses();
        
    } catch (error) {
        console.error('Error setting default:', error);
        alert('Failed to set default address');
    }
};

window.deleteAddress = async function(id) {
    if (!confirm('Delete this address?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('customer_addresses')
            .update({ is_active: false })
            .eq('id', id);
        
        if (error) throw error;
        
        await loadAddresses();
        
    } catch (error) {
        console.error('Error deleting address:', error);
        alert('Failed to delete address');
    }
};

console.log('✅ Addresses script loaded');
