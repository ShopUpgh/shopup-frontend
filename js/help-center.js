// ShopUp Help Center Module
// Provides in-app help, FAQs, and support information

console.log('Help Center module loaded');

// Configuration - Update these values for your deployment
const HELP_CENTER_CONFIG = {
    support: {
        email: 'support@shopup.gh',
        phone: '+233 XXX XXX XXXX', // TODO: Replace with actual phone number
        hours: 'Mon-Fri, 9 AM - 6 PM (Ghana Time)',
        responseTime: 'Within 24 hours'
    }
};

// Help Center Data
const helpCenterData = {
    faqs: [
        {
            category: 'Getting Started',
            questions: [
                {
                    q: 'How do I add a new product?',
                    a: 'Navigate to Products → Add Product button. Fill in the product details including name, description, price, and images, then click Save.'
                },
                {
                    q: 'How do I manage orders?',
                    a: 'Go to the Orders page to view all orders. You can filter by status (Pending, Confirmed, Shipped, Delivered) and update order status by clicking the action buttons.'
                },
                {
                    q: 'How do I view my sales analytics?',
                    a: 'Visit the Dashboard or Analytics page to see sales charts, revenue tracking, and product performance metrics.'
                }
            ]
        },
        {
            category: 'Products',
            questions: [
                {
                    q: 'How many images can I upload per product?',
                    a: 'You can upload up to 5 images per product. Each image should be under 5MB in size. Supported formats: JPG, PNG, WebP.'
                },
                {
                    q: 'Can I edit a product after publishing?',
                    a: 'Yes! Click the Edit button on any product to update its details, price, stock, or images.'
                },
                {
                    q: 'How do I remove a product?',
                    a: 'Click the Delete button on the product card. This will permanently remove the product from your store.'
                }
            ]
        },
        {
            category: 'Orders',
            questions: [
                {
                    q: 'How do I confirm an order?',
                    a: 'On the Orders page, find the order and click the "Confirm Order" button. This notifies the customer that their order has been accepted.'
                },
                {
                    q: 'How do I mark an order as shipped?',
                    a: 'Click the "Ship Order" button on a confirmed order. You can add tracking information if available.'
                },
                {
                    q: 'Can I cancel an order?',
                    a: 'Yes, click the "Cancel Order" button. This is typically done for orders that cannot be fulfilled or at customer request.'
                }
            ]
        },
        {
            category: 'Payments',
            questions: [
                {
                    q: 'What payment methods are supported?',
                    a: 'ShopUp supports Card payments (via Paystack), Mobile Money (MTN, Vodafone, AirtelTigo), Bank Transfer, and Cash on Delivery.'
                },
                {
                    q: 'When will I receive payment?',
                    a: 'Payments are processed through Paystack. Funds are typically available in your Paystack account within 24-48 hours and can be withdrawn to your bank account.'
                },
                {
                    q: 'What are the transaction fees?',
                    a: 'Paystack charges 1.5% + GH₵0.30 per successful transaction. ShopUp platform fee may apply based on your subscription plan.'
                }
            ]
        },
        {
            category: 'Account & Settings',
            questions: [
                {
                    q: 'How do I update my store information?',
                    a: 'Go to Settings to update your store name, description, contact information, and business details.'
                },
                {
                    q: 'How do I change my password?',
                    a: 'Visit Settings → Security → Change Password. Enter your current password and new password.'
                },
                {
                    q: 'Can I have multiple users manage my store?',
                    a: 'Currently, each store is managed by a single account. Multi-user support is planned for a future update.'
                }
            ]
        }
    ],
    documentation: [
        {
            title: 'Complete Setup Guide',
            icon: '📚',
            description: 'Step-by-step guide to set up your ShopUp store',
            file: 'START-HERE.md'
        },
        {
            title: 'FAQ & Troubleshooting',
            icon: '❓',
            description: 'Answers to common questions and issues',
            file: 'FAQ.md'
        },
        {
            title: 'Testing Checklist',
            icon: '✅',
            description: 'Verify all features are working correctly',
            file: 'TESTING_CHECKLIST.md'
        },
        {
            title: 'Deployment Guide',
            icon: '🚀',
            description: 'Deploy your store to production',
            file: 'DEPLOYMENT_GUIDE.md'
        }
    ],
    support: HELP_CENTER_CONFIG.support,
    videos: [
        {
            title: 'Getting Started with ShopUp',
            duration: '5:30',
            description: 'Learn the basics of setting up your store',
            placeholder: true
        },
        {
            title: 'Managing Products',
            duration: '4:15',
            description: 'How to add, edit, and organize products',
            placeholder: true
        },
        {
            title: 'Processing Orders',
            duration: '6:00',
            description: 'Complete order fulfillment workflow',
            placeholder: true
        }
    ]
};

// Initialize Help Center
function initHelpCenter() {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('helpCenterModal')) {
        createHelpCenterModal();
    }

    // Attach event listeners to all help links
    const helpLinks = document.querySelectorAll('#help, .help-link, [data-help]');
    helpLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openHelpCenter();
        });
    });

    console.log('Help Center initialized');
}

// Create Help Center Modal
function createHelpCenterModal() {
    const modal = document.createElement('div');
    modal.id = 'helpCenterModal';
    modal.className = 'help-modal';
    modal.innerHTML = `
        <div class="help-modal-overlay" onclick="closeHelpCenter()"></div>
        <div class="help-modal-content">
            <div class="help-modal-header">
                <h2>❓ Help Center</h2>
                <button class="help-close-btn" onclick="closeHelpCenter()">×</button>
            </div>
            
            <div class="help-search">
                <input type="text" id="helpSearch" placeholder="🔍 Search for help..." />
            </div>

            <div class="help-tabs">
                <button class="help-tab active" data-tab="faqs">FAQs</button>
                <button class="help-tab" data-tab="docs">Documentation</button>
                <button class="help-tab" data-tab="videos">Video Tutorials</button>
                <button class="help-tab" data-tab="contact">Contact Support</button>
            </div>

            <div class="help-content">
                <div class="help-tab-content active" id="faqs-content">
                    ${renderFAQs()}
                </div>
                <div class="help-tab-content" id="docs-content">
                    ${renderDocumentation()}
                </div>
                <div class="help-tab-content" id="videos-content">
                    ${renderVideos()}
                </div>
                <div class="help-tab-content" id="contact-content">
                    ${renderContact()}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    setupHelpCenterListeners();
}

// Render FAQs
function renderFAQs() {
    let html = '<div class="help-faqs">';
    
    helpCenterData.faqs.forEach((category, index) => {
        html += `
            <div class="faq-category">
                <h3 class="faq-category-title">${category.category}</h3>
                <div class="faq-questions">
        `;
        
        category.questions.forEach((item, qIndex) => {
            const id = `faq-${index}-${qIndex}`;
            html += `
                <div class="faq-item">
                    <button class="faq-question" onclick="toggleFAQ('${id}')">
                        <span>${item.q}</span>
                        <span class="faq-arrow">▼</span>
                    </button>
                    <div class="faq-answer" id="${id}">
                        <p>${item.a}</p>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Render Documentation
function renderDocumentation() {
    let html = '<div class="help-docs"><div class="docs-grid">';
    
    helpCenterData.documentation.forEach(doc => {
        html += `
            <div class="doc-card">
                <div class="doc-icon">${doc.icon}</div>
                <h4>${doc.title}</h4>
                <p>${doc.description}</p>
                <a href="${doc.file}" target="_blank" class="doc-link">View Guide →</a>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

// Render Videos
function renderVideos() {
    let html = '<div class="help-videos">';
    html += '<p class="videos-notice">📹 Video tutorials coming soon! Check back later for step-by-step video guides.</p>';
    html += '<div class="videos-grid">';
    
    helpCenterData.videos.forEach(video => {
        html += `
            <div class="video-card ${video.placeholder ? 'placeholder' : ''}">
                <div class="video-thumbnail">
                    <span class="video-play">▶️</span>
                </div>
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <p>${video.description}</p>
                    <span class="video-duration">⏱️ ${video.duration}</span>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    return html;
}

// Render Contact Support
function renderContact() {
    const support = helpCenterData.support;
    return `
        <div class="help-contact">
            <div class="contact-header">
                <h3>📞 Get in Touch</h3>
                <p>Our support team is here to help you succeed with ShopUp</p>
            </div>
            
            <div class="contact-methods">
                <div class="contact-card">
                    <div class="contact-icon">📧</div>
                    <h4>Email Support</h4>
                    <p><a href="mailto:${support.email}">${support.email}</a></p>
                    <small>Response time: ${support.responseTime}</small>
                </div>
                
                <div class="contact-card">
                    <div class="contact-icon">📱</div>
                    <h4>Phone Support</h4>
                    <p><a href="tel:${support.phone.replace(/\s/g, '')}">${support.phone}</a></p>
                    <small>${support.hours}</small>
                </div>
            </div>

            <div class="contact-form">
                <h4>Quick Contact Form</h4>
                <form onsubmit="submitHelpForm(event)">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" id="contactName" required />
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="contactEmail" required />
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <select id="contactSubject">
                            <option>General Question</option>
                            <option>Technical Issue</option>
                            <option>Payment Question</option>
                            <option>Feature Request</option>
                            <option>Bug Report</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea id="contactMessage" rows="4" required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    `;
}

// Setup Event Listeners
function setupHelpCenterListeners() {
    // Tab switching
    const tabs = document.querySelectorAll('.help-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchTab(targetTab);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('helpSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchHelp(e.target.value);
        });
    }
}

// Switch Tab
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.help-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.help-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-content`);
    });
}

// Toggle FAQ
window.toggleFAQ = function(id) {
    const answer = document.getElementById(id);
    const question = answer.previousElementSibling;
    const arrow = question.querySelector('.faq-arrow');
    
    answer.classList.toggle('open');
    arrow.style.transform = answer.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
};

// Search Help
function searchHelp(query) {
    if (!query.trim()) {
        // Reset all items to visible
        document.querySelectorAll('.faq-item, .doc-card, .video-card').forEach(item => {
            item.style.display = '';
        });
        return;
    }

    query = query.toLowerCase();

    // Search FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question span').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
        const matches = question.includes(query) || answer.includes(query);
        item.style.display = matches ? '' : 'none';
    });

    // Search Docs
    document.querySelectorAll('.doc-card').forEach(item => {
        const title = item.querySelector('h4').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        const matches = title.includes(query) || description.includes(query);
        item.style.display = matches ? '' : 'none';
    });

    // Search Videos
    document.querySelectorAll('.video-card').forEach(item => {
        const title = item.querySelector('h4').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        const matches = title.includes(query) || description.includes(query);
        item.style.display = matches ? '' : 'none';
    });
}

// Open Help Center
window.openHelpCenter = function() {
    const modal = document.getElementById('helpCenterModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
};

// Close Help Center
window.closeHelpCenter = function() {
    const modal = document.getElementById('helpCenterModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
};

// Submit Help Form
window.submitHelpForm = function(event) {
    event.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;

    // TODO: Integrate with backend email service
    // Implementation options:
    // 1. Use Supabase Edge Function to send email via Resend
    // 2. Use mailto: link to open user's email client
    // 3. Store in database table for admin review
    console.log('Help form submitted:', { name, email, subject, message });
    
    // Temporary placeholder - replace with proper notification system
    // Consider using a toast notification instead of alert()
    if (confirm('✅ Thank you for contacting us!\n\nWe\'ll get back to you within 24 hours via email.\n\nClick OK to close this form.')) {
        // Reset form only after user confirms
        event.target.reset();
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHelpCenter);
} else {
    initHelpCenter();
}

// Also export for manual initialization
window.initHelpCenter = initHelpCenter;
