// logger.js - Production logging system
console.log('🔍 Logger initialized');

// Export logger functions
window.logger = {
  info: (message, data) => {
    console.log(`ℹ️ [INFO] ${message}`, data || '');
  },
  
  error: (message, error) => {
    console.error(`❌ [ERROR] ${message}`, error || '');
    
    // Send to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error || new Error(message));
    }
  },
  
  warn: (message, data) => {
    console.warn(`⚠️ [WARN] ${message}`, data || '');
  },
  
  debug: (message, data) => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`🐛 [DEBUG] ${message}`, data || '');
    }
  },
  
  // Track page views
  pageView: (pageName) => {
    console.log(`📄 Page view: ${pageName}`);
    
    // Send to analytics if available
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  },
  
  // Track user actions
  track: (eventName, properties) => {
    console.log(`📊 Event: ${eventName}`, properties || {});
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }
};

// Log initial page load
window.logger.pageView(document.title);
