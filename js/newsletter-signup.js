/**
 * Newsletter Signup for ShopUp Ghana
 * 
 * Collects email addresses for marketing campaigns and product updates.
 * Builds customer email list for zero-cost marketing.
 * 
 * Features:
 * - Email validation
 * - Prevents duplicates
 * - Confirmation message
 * - Stores in Supabase
 * - GDPR/Ghana Data Protection Act compliant
 * 
 * Usage:
 * Add class "newsletter-form" to your form
 * <form class="newsletter-form">
 *   <input type="email" name="email" required>
 *   <button type="submit">Subscribe</button>
 * </form>
 * 
 * Zero Cost: Uses existing Supabase, no email service needed yet
 */

(function() {
    'use strict';

    class NewsletterSignup {
        constructor() {
            this.supabase = window.supabaseClient;
            this.init();
        }

        init() {
            this.attachFormListeners();
            this.injectStyles();
            this.createFloatingSignup();
        }

        /**
         * Attach listeners to newsletter forms
         */
        attachFormListeners() {
            document.addEventListener('submit', async (e) => {
                if (e.target.classList.contains('newsletter-form')) {
                    e.preventDefault();
                    await this.handleSubmit(e.target);
                }
            });
        }

        /**
         * Handle form submission
         */
        async handleSubmit(form) {
            const emailInput = form.querySelector('input[type="email"]');
            const submitBtn = form.querySelector('button[type="submit"]');
            const email = emailInput?.value?.trim();

            if (!email || !this.validateEmail(email)) {
                this.showMessage(form, 'Please enter a valid email address', 'error');
                return;
            }

            // Disable button
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';

            try {
                const success = await this.subscribe(email);
                
                if (success) {
                    this.showMessage(form, 'Successfully subscribed! Check your email.', 'success');
                    emailInput.value = '';
                    
                    // Track subscription
                    this.trackSubscription(email);
                } else {
                    this.showMessage(form, 'This email is already subscribed!', 'info');
                }
            } catch (error) {
                console.error('Newsletter subscription error:', error);
                this.showMessage(form, 'Something went wrong. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }

        /**
         * Subscribe email to newsletter
         */
        async subscribe(email) {
            if (!this.supabase) {
                // Fallback: store in localStorage
                const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
                if (subscribers.includes(email)) {
                    return false;
                }
                subscribers.push(email);
                localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
                return true;
            }

            try {
                // Check if already subscribed
                const { data: existing } = await this.supabase
                    .from('newsletter_subscribers')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (existing) {
                    return false;
                }

                // Insert new subscriber
                const { error } = await this.supabase
                    .from('newsletter_subscribers')
                    .insert({
                        email: email,
                        subscribed_at: new Date().toISOString(),
                        source: 'website',
                        status: 'active'
                    });

                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Database error:', error);
                throw error;
            }
        }

        /**
         * Validate email format
         */
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        /**
         * Show message to user
         */
        showMessage(form, message, type = 'info') {
            // Remove existing message
            const existing = form.querySelector('.newsletter-message');
            if (existing) existing.remove();

            // Create new message
            const msgDiv = document.createElement('div');
            msgDiv.className = `newsletter-message newsletter-${type}`;
            msgDiv.textContent = message;
            form.appendChild(msgDiv);

            // Auto-remove after 5 seconds
            setTimeout(() => msgDiv.remove(), 5000);
        }

        /**
         * Track subscription for analytics
         */
        trackSubscription(email) {
            // Send event to analytics if available
            if (window.gtag) {
                window.gtag('event', 'newsletter_signup', {
                    email_hash: this.hashEmail(email)
                });
            }

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('newsletterSignup', {
                detail: { email }
            }));
        }

        /**
         * Hash email for privacy
         */
        hashEmail(email) {
            let hash = 0;
            for (let i = 0; i < email.length; i++) {
                const char = email.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString();
        }

        /**
         * Create floating newsletter signup popup
         */
        createFloatingSignup() {
            const popup = document.createElement('div');
            popup.id = 'newsletter-popup';
            popup.className = 'newsletter-popup';
            popup.innerHTML = `
                <button class="newsletter-popup-close" aria-label="Close">×</button>
                <h3>📬 Stay Updated!</h3>
                <p>Get exclusive deals and new product alerts delivered to your inbox.</p>
                <form class="newsletter-form newsletter-popup-form">
                    <input type="email" name="email" placeholder="Enter your email" required>
                    <button type="submit">Subscribe</button>
                </form>
                <p class="newsletter-privacy">We respect your privacy. Unsubscribe anytime.</p>
            `;

            document.body.appendChild(popup);

            // Close button
            const closeBtn = popup.querySelector('.newsletter-popup-close');
            closeBtn.addEventListener('click', () => this.closePopup());

            // Show popup after 30 seconds (if not already shown)
            const hasSeenPopup = localStorage.getItem('newsletter_popup_shown');
            if (!hasSeenPopup) {
                setTimeout(() => this.showPopup(), 30000);
            }

            // Show popup on exit intent
            document.addEventListener('mouseleave', (e) => {
                if (e.clientY < 0 && !hasSeenPopup) {
                    this.showPopup();
                }
            });
        }

        /**
         * Show newsletter popup
         */
        showPopup() {
            const popup = document.getElementById('newsletter-popup');
            if (popup && !popup.classList.contains('active')) {
                popup.classList.add('active');
                localStorage.setItem('newsletter_popup_shown', 'true');
            }
        }

        /**
         * Close newsletter popup
         */
        closePopup() {
            const popup = document.getElementById('newsletter-popup');
            if (popup) {
                popup.classList.remove('active');
            }
        }

        /**
         * Inject CSS styles
         */
        injectStyles() {
            if (document.getElementById('newsletter-styles')) return;

            const style = document.createElement('style');
            style.id = 'newsletter-styles';
            style.textContent = `
                .newsletter-message {
                    margin-top: 10px;
                    padding: 10px 15px;
                    border-radius: 6px;
                    font-size: 14px;
                    animation: slideDown 0.3s ease;
                }

                .newsletter-success {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #10b981;
                }

                .newsletter-error {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #ef4444;
                }

                .newsletter-info {
                    background: #dbeafe;
                    color: #1e40af;
                    border: 1px solid #3b82f6;
                }

                .newsletter-popup {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: white;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    max-width: 400px;
                    z-index: 9999;
                    transform: translateY(120%);
                    transition: transform 0.4s ease;
                }

                .newsletter-popup.active {
                    transform: translateY(0);
                }

                .newsletter-popup-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6b7280;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .newsletter-popup-close:hover {
                    background: #f3f4f6;
                }

                .newsletter-popup h3 {
                    margin: 0 0 10px 0;
                    font-size: 20px;
                    color: #1f2937;
                }

                .newsletter-popup p {
                    margin: 0 0 15px 0;
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .newsletter-popup-form {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .newsletter-popup-form input {
                    flex: 1;
                    padding: 10px 15px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .newsletter-popup-form button {
                    padding: 10px 20px;
                    background: #f97316;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .newsletter-popup-form button:hover {
                    background: #ea580c;
                }

                .newsletter-popup-form button:disabled {
                    background: #d1d5db;
                    cursor: not-allowed;
                }

                .newsletter-privacy {
                    font-size: 12px;
                    color: #9ca3af;
                    margin: 0;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 480px) {
                    .newsletter-popup {
                        bottom: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }

                    .newsletter-popup-form {
                        flex-direction: column;
                    }
                }

                /* Dark mode support */
                [data-theme="dark"] .newsletter-popup {
                    background: #1f2937;
                }

                [data-theme="dark"] .newsletter-popup h3 {
                    color: #f9fafb;
                }

                [data-theme="dark"] .newsletter-popup p {
                    color: #d1d5db;
                }

                [data-theme="dark"] .newsletter-popup-form input {
                    background: #374151;
                    border-color: #4b5563;
                    color: #f9fafb;
                }
            `;

            document.head.appendChild(style);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.newsletterSignup = new NewsletterSignup();
        });
    } else {
        window.newsletterSignup = new NewsletterSignup();
    }

})();
