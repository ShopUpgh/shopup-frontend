// script.js - ShopUp Main JavaScript

console.log('ShopUp loaded successfully! Sell on Your Terms.');
console.log('Built with ❤️ for Ghana and Africa');
console.log('All authentication pages are now live!');

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    // Get all anchor links that start with #
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle if href is not just '#' alone
            if (href && href !== '#' && href.length > 1) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } else if (href === '#') {
                // Prevent default behavior for empty anchors
                e.preventDefault();
            }
        });
    });
    
    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            console.log('Contact form submitted:', formData);
            
            // TODO: Send to backend API
            alert('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            contactForm.reset();
            
            // Track with logger if available
            if (window.logger) {
                window.logger.track('contact_form_submitted', {
                    subject: formData.subject
                });
            }
        });
    }
    
    // Track page view
    if (window.logger) {
        window.logger.pageView(document.title);
    }
});

// Mobile menu toggle (if you add mobile menu later)
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Pricing plan selection tracking
document.addEventListener('DOMContentLoaded', function() {
    const pricingButtons = document.querySelectorAll('.pricing-card .btn-primary, .pricing-card .btn-secondary');
    
    pricingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const card = this.closest('.pricing-card');
            const planName = card.querySelector('h3').textContent;
            
            console.log('Selected plan:', planName);
            
            // Track with logger
            if (window.logger) {
                window.logger.track('pricing_plan_selected', {
                    plan: planName
                });
            }
        });
    });
});
