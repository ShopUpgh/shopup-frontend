// admin-users-script.js
console.log('Admin users script loaded');

let supabaseClient = null;
let currentUser = null;
let allUsers = [];
let userToBan = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase
    let attempts = 0;
    while (!window.supabase && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabase) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    supabaseClient = window.supabase;
    
    // Check auth
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Verify admin role
    const isAdmin = await verifyAdminRole(currentUser.id);
    if (!isAdmin) {
        alert('Access denied');
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Load users
    await loadUsers();
    
    // Setup filters
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('roleFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
});

async function verifyAdminRole(userId) {
    try {
        const { data } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('is_active', true)
            .in('role', ['admin', 'moderator']);
        
        return data && data.length > 0;
    } catch (error) {
        return false;
    }
}

async function loadUsers() {
    try {
        // Get all customer profiles
        const { data: customers, error } = await supabaseClient
            .from('customer_profiles')
            .select(`
                id,
                user_id,
                full_name,
                email,
                phone,
                created_at
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Get roles for each user
        const usersWithRoles = await Promise.all(
            customers.map(async (customer) => {
                // Get role
                const { data: roleData } = await supabaseClient
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', customer.user_id)
                    .eq('is_active', true)
                    .single();
                
                // Check if banned
                const { data: banData } = await supabaseClient
                    .from('user_bans')
                    .select('*')
                    .eq('user_id', customer.user_id)
                    .eq('is_active', true)
                    .single();
                
                return {
                    ...customer,
                    role: roleData?.role || 'customer',
                    is_banned: !!banData,
                    ban_reason: banData?.reason
                };
            })
        );
        
        allUsers = usersWithRoles;
        displayUsers(allUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                    Failed to load users
                </td>
            </tr>
        `;
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #718096;">
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => {
        const initials = (user.full_name || user.email || '??')
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const roleBadge = getRoleBadge(user.role);
        const statusBadge = user.is_banned 
            ? '<span class="badge badge-banned">Banned</span>'
            : '<span class="badge" style="background: #d1fae5; color: #065f46;">Active</span>';
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${initials}</div>
                        <div class="user-details">
                            <div class="user-name">${user.full_name || 'N/A'}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${roleBadge}</td>
                <td>${joinDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="actions">
                        ${!user.is_banned ? `
                            <button class="btn btn-ban" onclick="openBanModal('${user.user_id}')">
                                Ban
                            </button>
                        ` : `
                            <button class="btn btn-unban" onclick="unbanUser('${user.user_id}')">
                                Unban
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getRoleBadge(role) {
    const badges = {
        'admin': '<span class="badge badge-admin">Admin</span>',
        'moderator': '<span class="badge badge-admin">Moderator</span>',
        'seller': '<span class="badge badge-seller">Seller</span>',
        'customer': '<span class="badge badge-customer">Customer</span>'
    };
    return badges[role] || badges['customer'];
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    const filtered = allUsers.filter(user => {
        // Search filter
        if (search) {
            const searchMatch = 
                (user.full_name?.toLowerCase() || '').includes(search) ||
                (user.email?.toLowerCase() || '').includes(search);
            if (!searchMatch) return false;
        }
        
        // Role filter
        if (role && user.role !== role) {
            return false;
        }
        
        // Status filter
        if (status === 'active' && user.is_banned) return false;
        if (status === 'banned' && !user.is_banned) return false;
        
        return true;
    });
    
    displayUsers(filtered);
}

window.openBanModal = function(userId) {
    userToBan = userId;
    document.getElementById('banModal').classList.add('active');
    document.getElementById('banReason').value = '';
};

window.closeBanModal = function() {
    document.getElementById('banModal').classList.remove('active');
    userToBan = null;
};

window.confirmBan = async function() {
    const reason = document.getElementById('banReason').value.trim();
    
    if (!reason) {
        alert('Please provide a reason for banning');
        return;
    }
    
    try {
        // Create ban record
        const { error } = await supabaseClient
            .from('user_bans')
            .insert([{
                user_id: userToBan,
                reason: reason,
                ban_type: 'permanent',
                banned_by: currentUser.id
            }]);
        
        if (error) throw error;
        
        // Log action
        await supabaseClient
            .from('audit_logs')
            .insert([{
                user_id: currentUser.id,
                action: 'user.ban',
                resource_type: 'user',
                resource_id: userToBan,
                description: `Banned user: ${reason}`
            }]);
        
        alert('User banned successfully');
        closeBanModal();
        await loadUsers();
        
    } catch (error) {
        console.error('Ban error:', error);
        alert('Failed to ban user');
    }
};

window.unbanUser = async function(userId) {
    if (!confirm('Are you sure you want to unban this user?')) {
        return;
    }
    
    try {
        // Deactivate ban
        const { error } = await supabaseClient
            .from('user_bans')
            .update({
                is_active: false,
                lifted_at: new Date().toISOString(),
                lifted_by: currentUser.id
            })
            .eq('user_id', userId)
            .eq('is_active', true);
        
        if (error) throw error;
        
        // Log action
        await supabaseClient
            .from('audit_logs')
            .insert([{
                user_id: currentUser.id,
                action: 'user.unban',
                resource_type: 'user',
                resource_id: userId,
                description: 'Unbanned user'
            }]);
        
        alert('User unbanned successfully');
        await loadUsers();
        
    } catch (error) {
        console.error('Unban error:', error);
        alert('Failed to unban user');
    }
};

console.log('✅ Admin users script loaded');
