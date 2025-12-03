// ShopUp JavaScript - Basic Functionality

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active class to navigation on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }
});

// Button click handlers (you'll connect these to real pages later)
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling is already handled above
    // All buttons now link to real pages (signup.html, login.html)
    console.log('All authentication pages are now live!');
});

// Log page load (this helps you see that JavaScript is working)
console.log('ShopUp loaded successfully! Sell on Your Terms.');
console.log('Built with ❤️ for Ghana and Africa');
