// script.js - Main application script for ShopUp Ghana
console.log('✅ ShopUp loaded successfully! Sell on Your Terms.');
console.log('🌍 Built with ❤️ for Ghana and Africa');

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 ShopUp app initialized');
    
    // Log page info using logger if available
    if (window.logger) {
        window.logger.info('ShopUp application started', {
            page: document.title,
            url: window.location.href
        });
    }
    
    // Check authentication status
    checkAuthStatus();
    
    // Initialize any page-specific features
    initializePageFeatures();
});

// Check if user is authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        console.log('✅ User is authenticated');
        if (window.logger) {
            window.logger.info('User authenticated', { user: JSON.parse(user).email });
        }
    } else {
        console.log('ℹ️ User is not authenticated');
    }
}

// Initialize page-specific features
function initializePageFeatures() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '/index.html') {
        console.log('🏠 Home page loaded');
        // Add home page specific initialization here
    }
    
    // Log page view
    if (window.logger) {
        window.logger.pageView(document.title);
    }
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('❌ Global error caught:', event.error);
    
    if (window.logger) {
        window.logger.error('Uncaught error', event.error);
    }
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
    
    if (window.logger) {
        window.logger.error('Unhandled promise rejection', event.reason);
    }
});

console.log('🚀 All authentication pages are now live!');
