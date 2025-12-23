/**
 * GDPR / Ghana Data Protection Act (Act 843) Compliance
 * Data Export and Deletion Features
 * 
 * Legal Requirements:
 * - Right to Access: Users can export their data
 * - Right to Erasure: Users can request data deletion
 * - Data Portability: Data must be in machine-readable format
 */

class DataPrivacyManager {
    constructor() {
        this.supabase = window.supabase;
    }

    /**
     * Export all user data in JSON format (GDPR Article 20)
     */
    async exportUserData() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Collect all user data from various tables
            const exportData = {
                export_date: new Date().toISOString(),
                user_id: user.id,
                personal_information: {},
                orders: [],
                addresses: [],
                reviews: [],
                wishlist: []
            };

            // Fetch customer profile
            const { data: profile } = await this.supabase
                .from('customer_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                exportData.personal_information = {
                    email: profile.email,
                    full_name: profile.full_name,
                    phone: profile.phone,
                    created_at: profile.created_at,
                    updated_at: profile.updated_at
                };
            }

            // Fetch orders
            const { data: orders } = await this.supabase
                .from('orders')
                .select(`
                    *,
                    order_items (*)
                `)
                .eq('customer_email', user.email);

            if (orders) {
                exportData.orders = orders;
            }

            // Fetch addresses
            const { data: addresses } = await this.supabase
                .from('customer_addresses')
                .select('*')
                .eq('customer_id', user.id);

            if (addresses) {
                exportData.addresses = addresses;
            }

            // Fetch product reviews
            const { data: reviews } = await this.supabase
                .from('product_reviews')
                .select('*')
                .eq('customer_id', user.id);

            if (reviews) {
                exportData.reviews = reviews;
            }

            // Fetch wishlist
            const { data: wishlist } = await this.supabase
                .from('wishlist')
                .select('*')
                .eq('customer_id', user.id);

            if (wishlist) {
                exportData.wishlist = wishlist;
            }

            // Create downloadable file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `shopup-data-export-${user.id}-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: 'Your data has been exported successfully'
            };

        } catch (error) {
            console.error('Data export failed:', error);
            throw error;
        }
    }

    /**
     * Request account deletion (GDPR Article 17 - Right to Erasure)
     * This initiates a deletion request that must be approved
     */
    async requestAccountDeletion(reason = '') {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Create deletion request
            const { data, error } = await this.supabase
                .from('account_deletion_requests')
                .insert({
                    user_id: user.id,
                    user_email: user.email,
                    reason: reason,
                    status: 'pending',
                    requested_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Account deletion request submitted. You will receive confirmation via email within 30 days.',
                request_id: data.id
            };

        } catch (error) {
            console.error('Deletion request failed:', error);
            throw error;
        }
    }

    /**
     * Anonymize user data (alternative to full deletion)
     * Keeps order history but removes personal identifiers
     */
    async anonymizeAccount() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Anonymize customer profile
            await this.supabase
                .from('customer_profiles')
                .update({
                    full_name: 'Anonymous User',
                    phone: 'REDACTED',
                    anonymized: true,
                    anonymized_at: new Date().toISOString()
                })
                .eq('id', user.id);

            // Anonymize orders (keep for business records but remove PII)
            await this.supabase
                .from('orders')
                .update({
                    customer_name: 'Anonymous',
                    customer_phone: 'REDACTED',
                    delivery_address: 'Address removed for privacy'
                })
                .eq('customer_email', user.email);

            // Delete addresses
            await this.supabase
                .from('customer_addresses')
                .delete()
                .eq('customer_id', user.id);

            // Delete wishlist
            await this.supabase
                .from('wishlist')
                .delete()
                .eq('customer_id', user.id);

            return {
                success: true,
                message: 'Your account has been anonymized. Order history retained for legal compliance.'
            };

        } catch (error) {
            console.error('Anonymization failed:', error);
            throw error;
        }
    }

    /**
     * Download privacy policy and terms of service
     */
    async downloadLegalDocuments() {
        const documents = {
            privacy_policy: {
                title: 'ShopUp Ghana Privacy Policy',
                last_updated: '2024-12-01',
                compliance: ['Ghana Data Protection Act (Act 843, 2012)', 'GDPR'],
                content: `
# ShopUp Ghana Privacy Policy

## 1. Introduction
ShopUp Ghana ("we", "our", "us") is committed to protecting your privacy and complying with the Ghana Data Protection Act (Act 843, 2012).

## 2. Data We Collect
- Personal identification: Name, email, phone number
- Delivery information: Address, city, region
- Transaction data: Order history, payment information
- Technical data: IP address, browser type, device information

## 3. How We Use Your Data
- Process orders and payments
- Deliver products to you
- Send order confirmations and updates
- Improve our services
- Comply with legal obligations

## 4. Your Rights Under Act 843
You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Object to processing of your data
- Data portability

## 5. Data Security
We implement appropriate technical and organizational measures to protect your data.

## 6. Data Retention
We retain your data for as long as necessary to fulfill purposes outlined in this policy and comply with legal obligations.

## 7. Contact
For privacy concerns, contact our Data Protection Officer at privacy@shopup.gh
`
            },
            terms_of_service: {
                title: 'ShopUp Ghana Terms of Service',
                last_updated: '2024-12-01',
                content: `
# Terms of Service

## 1. Agreement to Terms
By using ShopUp Ghana, you agree to these terms.

## 2. User Accounts
- You must provide accurate information
- You are responsible for account security
- You must be at least 18 years old

## 3. Orders and Payments
- All prices in Ghana Cedis (GHS) include 17.5% VAT
- Payment processed securely through Paystack
- Orders subject to stock availability

## 4. Refunds and Returns
- 7-day return policy for most items
- Items must be in original condition
- Refunds processed within 14 days

## 5. Seller Responsibilities
- Accurate product descriptions
- Timely order fulfillment
- Customer service

## 6. Prohibited Activities
- Fraudulent transactions
- Misuse of platform
- Violation of laws

## 7. Limitation of Liability
ShopUp acts as a marketplace platform.

## 8. Governing Law
These terms governed by laws of Ghana.
`
            }
        };

        return documents;
    }
}

// Global privacy manager instance
window.DataPrivacyManager = new DataPrivacyManager();

// Add UI handlers for privacy settings page
document.addEventListener('DOMContentLoaded', () => {
    // Export data button
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                exportBtn.disabled = true;
                exportBtn.textContent = 'Exporting...';
                
                await window.DataPrivacyManager.exportUserData();
                
                alert('✅ Your data has been exported successfully!');
            } catch (error) {
                alert('❌ Export failed: ' + error.message);
            } finally {
                exportBtn.disabled = false;
                exportBtn.textContent = 'Export My Data';
            }
        });
    }

    // Delete account button
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const confirmed = confirm(
                'Are you sure you want to request account deletion? This action cannot be undone.\n\n' +
                'Your order history will be retained for 7 years as required by Ghana Revenue Authority, ' +
                'but your personal information will be removed.'
            );

            if (!confirmed) return;

            const reason = prompt('Please tell us why you want to delete your account (optional):');

            try {
                deleteBtn.disabled = true;
                deleteBtn.textContent = 'Processing...';
                
                const result = await window.DataPrivacyManager.requestAccountDeletion(reason);
                
                alert('✅ ' + result.message);
            } catch (error) {
                alert('❌ Request failed: ' + error.message);
            } finally {
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete My Account';
            }
        });
    }
});

console.log('✅ Data Privacy Manager loaded - GDPR/Act 843 compliant');
