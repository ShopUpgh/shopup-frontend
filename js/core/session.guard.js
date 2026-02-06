/**
 * ShopUp Session Guard - Comprehensive Authentication Module
 * 
 * This module provides robust authentication and authorization features including:
 * - Role-Based Access Control (RBAC)
 * - Automatic token refresh handling
 * - Loading state management
 * - Return URL support after login
 * - Session validation and error handling
 * 
 * @module session.guard
 * @version 2.0.0
 * @exports window.ShopUpAuth
 */

(function () {
  "use strict";

  // ============================================================================
  // CONSTANTS & CONFIGURATION
  // ============================================================================

  const DEFAULT_CONFIG = {
    // Default redirect URLs for different roles
    loginUrls: {
      customer: "/customer/customer-login.html",
      admin: "/admin/admin-login.html",
      seller: "/seller/seller-login.html",
      vendor: "/seller/seller-login.html",
      staff: "/admin/admin-login.html",
    },
    // Default dashboard URLs for different roles
    dashboardUrls: {
      customer: "/customer/customer-dashboard.html",
      admin: "/admin/admin-dashboard.html",
      seller: "/seller/seller-dashboard-enhanced.html",
      vendor: "/seller/seller-dashboard-enhanced.html",
      staff: "/admin/admin-dashboard.html",
    },
    // Token refresh configuration
    tokenRefresh: {
      // Refresh token 5 minutes before expiry
      refreshBeforeExpiryMs: 5 * 60 * 1000,
      // Check token expiry every 30 seconds
      checkIntervalMs: 30 * 1000,
    },
    // Loading state configuration
    loading: {
      defaultMessage: "Verifying your session...",
      defaultElementId: "auth-loading-overlay",
    },
    // Debug mode (set to true for development)
    debug: false,
  };

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  let authStateChangeListener = null;
  let tokenRefreshTimer = null;
  let tokenCheckInterval = null;
  let currentLoadingElement = null;

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Debug logger that only logs when debug mode is enabled
   * @private
   * @param {...any} args - Arguments to log
   */
  function debugLog(...args) {
    if (DEFAULT_CONFIG.debug) {
      console.log("[ShopUpAuth]", ...args);
    }
  }

  /**
   * Sanitizes a return URL to prevent open redirect vulnerabilities
   * Only allows same-origin URLs
   * 
   * @private
   * @param {string} url - URL to sanitize
   * @returns {string|null} Sanitized URL or null if invalid
   */
  function sanitizeReturnUrl(url) {
    if (!url || typeof url !== "string") {
      return null;
    }

    try {
      // Remove any leading/trailing whitespace
      url = url.trim();

      // If it's a relative URL (starts with /), it's safe
      if (url.startsWith("/")) {
        // Ensure it doesn't try to navigate to a different origin
        // e.g., //evil.com is technically relative but goes to another domain
        if (url.startsWith("//")) {
          return null;
        }
        return url;
      }

      // If it's an absolute URL, check if it's same-origin
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.origin === window.location.origin) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }

      // Different origin - not allowed
      return null;
    } catch (error) {
      debugLog("Invalid return URL:", url, error);
      return null;
    }
  }

  /**
   * Extracts the return URL from query parameters
   * 
   * @public
   * @returns {string|null} Return URL or null if not found or invalid
   * 
   * @example
   * // URL: /customer-login.html?returnTo=%2Fcustomer-dashboard.html
   * const returnUrl = ShopUpAuth.getReturnUrl();
   * // Returns: "/customer-dashboard.html"
   */
  function getReturnUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get("returnTo");
      return sanitizeReturnUrl(returnTo);
    } catch (error) {
      debugLog("Error extracting return URL:", error);
      return null;
    }
  }

  /**
   * Redirects user to their intended destination after login
   * Uses return URL from query params or falls back to role-based dashboard
   * 
   * @public
   * @param {string} [defaultUrl] - Default URL if no return URL exists
   * @param {string} [userRole] - User role for determining default dashboard
   * 
   * @example
   * // After successful login
   * ShopUpAuth.redirectAfterLogin("/customer/customer-dashboard.html", "customer");
   */
  function redirectAfterLogin(defaultUrl, userRole) {
    const returnUrl = getReturnUrl();
    
    if (returnUrl) {
      debugLog("Redirecting to return URL:", returnUrl);
      window.location.href = returnUrl;
      return;
    }

    // Fall back to role-based dashboard or provided default
    let targetUrl = defaultUrl;
    if (!targetUrl && userRole && DEFAULT_CONFIG.dashboardUrls[userRole]) {
      targetUrl = DEFAULT_CONFIG.dashboardUrls[userRole];
    }

    if (targetUrl) {
      debugLog("Redirecting to default URL:", targetUrl);
      window.location.href = targetUrl;
    } else {
      debugLog("No redirect URL available");
    }
  }

  /**
   * Builds a login URL with return URL parameter
   * 
   * @private
   * @param {string} loginUrl - Base login URL
   * @param {string} [currentUrl] - Current page URL to return to after login
   * @returns {string} Login URL with returnTo parameter
   */
  function buildLoginUrlWithReturn(loginUrl, currentUrl) {
    if (!currentUrl) {
      currentUrl = window.location.pathname + window.location.search + window.location.hash;
    }

    try {
      const url = new URL(loginUrl, window.location.origin);
      url.searchParams.set("returnTo", currentUrl);
      return url.pathname + url.search;
    } catch (error) {
      debugLog("Error building login URL:", error);
      return loginUrl;
    }
  }

  // ============================================================================
  // LOADING STATE MANAGEMENT
  // ============================================================================

  /**
   * Creates and shows a loading overlay
   * 
   * @private
   * @param {Object} options - Loading options
   * @param {string} [options.message] - Loading message to display
   * @param {string} [options.elementId] - Custom loading element ID
   * @returns {HTMLElement|null} Loading element or null if custom element not found
   */
  function showLoading(options = {}) {
    const message = options.message || DEFAULT_CONFIG.loading.defaultMessage;
    const elementId = options.elementId || DEFAULT_CONFIG.loading.defaultElementId;

    // Check if custom loading element exists
    let loadingElement = document.getElementById(elementId);
    
    if (loadingElement) {
      // Use existing custom element
      loadingElement.style.display = "flex";
      currentLoadingElement = loadingElement;
      return loadingElement;
    }

    // Create default loading overlay if it doesn't exist
    if (!loadingElement && elementId === DEFAULT_CONFIG.loading.defaultElementId) {
      loadingElement = createDefaultLoadingOverlay(elementId, message);
      document.body.appendChild(loadingElement);
      currentLoadingElement = loadingElement;
    }

    return loadingElement;
  }

  /**
   * Creates the default loading overlay element
   * 
   * @private
   * @param {string} elementId - Element ID
   * @param {string} message - Loading message
   * @returns {HTMLElement} Loading overlay element
   */
  function createDefaultLoadingOverlay(elementId, message) {
    const overlay = document.createElement("div");
    overlay.id = elementId;
    overlay.className = "shopup-auth-loading-overlay";
    overlay.innerHTML = `
      <div class="shopup-auth-loading-spinner">
        <div class="spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;

    // Add inline styles if CSS not loaded
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    const spinner = overlay.querySelector(".shopup-auth-loading-spinner");
    spinner.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    const spinnerDiv = overlay.querySelector(".spinner");
    spinnerDiv.style.cssText = `
      border: 3px solid #f3f3f3;
      border-top: 3px solid #2d8a3e;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    `;

    // Add keyframe animation
    if (!document.getElementById("shopup-auth-spinner-style")) {
      const style = document.createElement("style");
      style.id = "shopup-auth-spinner-style";
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    return overlay;
  }

  /**
   * Hides the loading overlay
   * 
   * @private
   */
  function hideLoading() {
    if (currentLoadingElement) {
      currentLoadingElement.style.display = "none";
      currentLoadingElement = null;
    }
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL (RBAC)
  // ============================================================================

  /**
   * Extracts user role from session data
   * Checks multiple sources: app_metadata, user_metadata, and custom fields
   * 
   * @private
   * @param {Object} user - Supabase user object
   * @returns {string|null} User role or null if not found
   */
  function extractUserRole(user) {
    if (!user) return null;

    // Check app_metadata first (most secure, set by Supabase)
    if (user.app_metadata && user.app_metadata.role) {
      return user.app_metadata.role;
    }

    // Check user_metadata (user-editable)
    if (user.user_metadata && user.user_metadata.role) {
      return user.user_metadata.role;
    }

    // Check custom field
    if (user.role) {
      return user.role;
    }

    // Check localStorage as fallback
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      return storedRole;
    }

    // Default to customer if no role found
    debugLog("No role found for user, defaulting to 'customer'");
    return "customer";
  }

  /**
   * Validates if user has required role(s)
   * 
   * @private
   * @param {string} userRole - User's current role
   * @param {string[]} requiredRoles - Array of allowed roles
   * @returns {boolean} True if user has one of the required roles
   */
  function hasRequiredRole(userRole, requiredRoles) {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role requirement
    }

    return requiredRoles.includes(userRole);
  }

  // ============================================================================
  // TOKEN REFRESH MANAGEMENT
  // ============================================================================

  /**
   * Sets up automatic token refresh mechanism
   * Monitors token expiry and refreshes before expiration
   * 
   * @private
   * @param {Object} client - Supabase client
   * @param {Object} [callbacks] - Optional callbacks
   * @param {Function} [callbacks.onTokenRefresh] - Called after successful token refresh
   * @param {Function} [callbacks.onRefreshError] - Called when token refresh fails
   */
  async function setupTokenRefresh(client, callbacks = {}) {
    if (!client) return;

    // Clear any existing timers
    clearTokenRefreshTimers();

    // Set up auth state change listener
    authStateChangeListener = client.auth.onAuthStateChange(async (event, session) => {
      debugLog("Auth state changed:", event);

      if (event === "TOKEN_REFRESHED") {
        debugLog("Token refreshed successfully");
        if (callbacks.onTokenRefresh) {
          callbacks.onTokenRefresh(session);
        }
      } else if (event === "SIGNED_OUT") {
        debugLog("User signed out");
        clearTokenRefreshTimers();
      }
    });

    // Set up periodic token expiry check
    tokenCheckInterval = setInterval(async () => {
      try {
        const { data, error } = await client.auth.getSession();
        
        if (error || !data?.session) {
          debugLog("No valid session found during token check");
          return;
        }

        const session = data.session;
        const expiresAt = session.expires_at; // Unix timestamp in seconds
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = (expiresAt - now) * 1000; // Convert to milliseconds

        debugLog(`Token expires in ${Math.floor(timeUntilExpiry / 1000)} seconds`);

        // If token expires soon, refresh it proactively
        if (timeUntilExpiry < DEFAULT_CONFIG.tokenRefresh.refreshBeforeExpiryMs) {
          debugLog("Token expiring soon, refreshing...");
          const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
          
          if (refreshError) {
            debugLog("Token refresh failed:", refreshError);
            if (callbacks.onRefreshError) {
              callbacks.onRefreshError(refreshError);
            }
          } else {
            debugLog("Token refreshed proactively");
            if (callbacks.onTokenRefresh) {
              callbacks.onTokenRefresh(refreshData.session);
            }
          }
        }
      } catch (error) {
        debugLog("Error checking token expiry:", error);
      }
    }, DEFAULT_CONFIG.tokenRefresh.checkIntervalMs);
  }

  /**
   * Clears all token refresh timers and listeners
   * 
   * @private
   */
  function clearTokenRefreshTimers() {
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
      tokenRefreshTimer = null;
    }

    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      tokenCheckInterval = null;
    }

    if (authStateChangeListener) {
      // Unsubscribe from auth state changes
      if (typeof authStateChangeListener.unsubscribe === "function") {
        authStateChangeListener.unsubscribe();
      } else if (typeof authStateChangeListener === "function") {
        authStateChangeListener();
      }
      authStateChangeListener = null;
    }
  }

  // ============================================================================
  // SESSION VALIDATION
  // ============================================================================

  /**
   * Generic session validation function with role-based access control
   * 
   * @public
   * @param {Object} [options] - Configuration options
   * @param {string[]} [options.roles] - Required roles (e.g., ['admin', 'vendor'])
   * @param {string} [options.redirectTo] - Custom redirect URL on auth failure
   * @param {boolean} [options.showLoading=false] - Show loading overlay during validation
   * @param {string} [options.loadingMessage] - Custom loading message
   * @param {string} [options.loadingElementId] - Custom loading element ID
   * @param {boolean} [options.enableTokenRefresh=true] - Enable automatic token refresh
   * @param {Function} [options.onSessionValid] - Callback when session is valid
   * @param {Function} [options.onSessionInvalid] - Callback when session is invalid
   * @param {Function} [options.onTokenRefresh] - Callback after token refresh
   * @param {Function} [options.onRefreshError] - Callback on refresh error
   * @returns {Promise<Object|null>} Session data { client, session, user, role } or null
   * 
   * @example
   * // Admin-only page
   * await ShopUpAuth.requireSession({ roles: ['admin'] });
   * 
   * @example
   * // Multiple roles with loading
   * await ShopUpAuth.requireSession({
   *   roles: ['admin', 'vendor'],
   *   showLoading: true,
   *   loadingMessage: "Checking permissions..."
   * });
   * 
   * @example
   * // With callbacks
   * await ShopUpAuth.requireSession({
   *   roles: ['customer'],
   *   onSessionValid: (data) => console.log('Welcome!', data.user.email),
   *   onSessionInvalid: () => console.log('Access denied')
   * });
   */
  async function requireSession(options = {}) {
    const {
      roles = [],
      redirectTo = null,
      showLoading: shouldShowLoading = false,
      loadingMessage = null,
      loadingElementId = null,
      enableTokenRefresh = true,
      onSessionValid = null,
      onSessionInvalid = null,
      onTokenRefresh = null,
      onRefreshError = null,
    } = options;

    // Show loading if requested
    if (shouldShowLoading) {
      showLoading({
        message: loadingMessage,
        elementId: loadingElementId,
      });
    }

    try {
      // Wait for Supabase client
      const client = await window.supabaseReady;
      
      if (!client) {
        debugLog("Supabase client not available");
        hideLoading();
        
        if (onSessionInvalid) {
          onSessionInvalid({ reason: "client_unavailable" });
        }
        
        redirectToLogin(roles, redirectTo);
        return null;
      }

      // Get current session
      const { data, error } = await client.auth.getSession();
      
      if (error || !data?.session) {
        debugLog("No valid session:", error);
        hideLoading();
        
        if (onSessionInvalid) {
          onSessionInvalid({ reason: "no_session", error });
        }
        
        redirectToLogin(roles, redirectTo);
        return null;
      }

      const session = data.session;
      const user = session.user;
      const userRole = extractUserRole(user);

      debugLog("Session validated for user:", user.email, "Role:", userRole);

      // Check role requirements
      if (roles.length > 0 && !hasRequiredRole(userRole, roles)) {
        debugLog("User role", userRole, "not in required roles:", roles);
        hideLoading();
        
        if (onSessionInvalid) {
          onSessionInvalid({ reason: "insufficient_permissions", userRole, requiredRoles: roles });
        }
        
        // Redirect with error message
        alert(`Access Denied: This page requires one of the following roles: ${roles.join(", ")}`);
        redirectToLogin([userRole], redirectTo);
        return null;
      }

      // Set up automatic token refresh
      if (enableTokenRefresh) {
        setupTokenRefresh(client, {
          onTokenRefresh,
          onRefreshError: (error) => {
            debugLog("Token refresh error, redirecting to login");
            if (onRefreshError) {
              onRefreshError(error);
            }
            // On refresh failure, redirect to login
            redirectToLogin([userRole], redirectTo);
          },
        });
      }

      hideLoading();

      const sessionData = { client, session, user, role: userRole };

      if (onSessionValid) {
        onSessionValid(sessionData);
      }

      return sessionData;
    } catch (error) {
      debugLog("Error validating session:", error);
      hideLoading();
      
      if (onSessionInvalid) {
        onSessionInvalid({ reason: "error", error });
      }

      // Report to Sentry if available
      if (window.Sentry) {
        window.Sentry.captureException(error);
      }
      
      redirectToLogin(roles, redirectTo);
      return null;
    }
  }

  /**
   * Helper function to redirect to appropriate login page
   * 
   * @private
   * @param {string[]} roles - Required roles
   * @param {string|null} customRedirectTo - Custom redirect URL
   */
  function redirectToLogin(roles, customRedirectTo) {
    let loginUrl;

    if (customRedirectTo) {
      loginUrl = customRedirectTo;
    } else if (roles && roles.length > 0) {
      // Use the first role to determine login page
      loginUrl = DEFAULT_CONFIG.loginUrls[roles[0]] || DEFAULT_CONFIG.loginUrls.customer;
    } else {
      loginUrl = DEFAULT_CONFIG.loginUrls.customer;
    }

    // Add return URL parameter
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    loginUrl = buildLoginUrlWithReturn(loginUrl, currentUrl);

    debugLog("Redirecting to login:", loginUrl);
    window.location.href = loginUrl;
  }

  /**
   * Backward-compatible customer session validation
   * Validates session for customer role only
   * 
   * @public
   * @param {Object} [options] - Configuration options (same as requireSession)
   * @returns {Promise<Object|null>} Session data or null
   * 
   * @example
   * // Basic usage (backward compatible)
   * await ShopUpAuth.requireCustomerSession();
   * 
   * @example
   * // With custom redirect
   * await ShopUpAuth.requireCustomerSession({
   *   redirectTo: "/customer/customer-login.html"
   * });
   * 
   * @example
   * // With loading state
   * await ShopUpAuth.requireCustomerSession({
   *   showLoading: true,
   *   loadingMessage: "Loading your dashboard..."
   * });
   */
  async function requireCustomerSession(options = {}) {
    // Default to customer role if not specified
    const customerOptions = {
      ...options,
      roles: options.roles || ["customer"],
      redirectTo: options.redirectTo || DEFAULT_CONFIG.loginUrls.customer,
    };

    return requireSession(customerOptions);
  }

  /**
   * Admin session validation (convenience method)
   * 
   * @public
   * @param {Object} [options] - Configuration options
   * @returns {Promise<Object|null>} Session data or null
   * 
   * @example
   * await ShopUpAuth.requireAdminSession();
   */
  async function requireAdminSession(options = {}) {
    return requireSession({
      ...options,
      roles: ["admin"],
      redirectTo: options.redirectTo || DEFAULT_CONFIG.loginUrls.admin,
    });
  }

  /**
   * Seller/Vendor session validation (convenience method)
   * 
   * @public
   * @param {Object} [options] - Configuration options
   * @returns {Promise<Object|null>} Session data or null
   * 
   * @example
   * await ShopUpAuth.requireSellerSession();
   */
  async function requireSellerSession(options = {}) {
    return requireSession({
      ...options,
      roles: ["seller", "vendor"],
      redirectTo: options.redirectTo || DEFAULT_CONFIG.loginUrls.seller,
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Updates configuration settings
   * 
   * @public
   * @param {Object} newConfig - Configuration updates
   * 
   * @example
   * ShopUpAuth.configure({ debug: true });
   */
  function configure(newConfig) {
    Object.assign(DEFAULT_CONFIG, newConfig);
  }

  /**
   * Cleanup function to remove listeners and timers
   * Call when leaving a page or logging out
   * 
   * @public
   * 
   * @example
   * // Before page navigation
   * ShopUpAuth.cleanup();
   */
  function cleanup() {
    clearTokenRefreshTimers();
    hideLoading();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Public API exported to window.ShopUpAuth
   * All functions are frozen to prevent modifications
   */
  window.ShopUpAuth = Object.freeze({
    // Primary session validation
    requireSession,
    requireCustomerSession,
    requireAdminSession,
    requireSellerSession,

    // Return URL utilities
    getReturnUrl,
    redirectAfterLogin,

    // Configuration
    configure,

    // Cleanup
    cleanup,

    // Version info
    version: "2.0.0",
  });

  debugLog("ShopUpAuth initialized successfully (v2.0.0)");
})();
