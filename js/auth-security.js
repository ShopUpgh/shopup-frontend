/**
 * ShopUp Ghana - Authentication Security Helpers
 * 
 * Implements security features:
 * - Rate limiting for login attempts
 * - Account lockout detection
 * - Login attempt tracking
 * - IP address capture
 */

const AuthSecurity = {
    /**
     * Check if account is locked before attempting login
     * 
     * @param {string} email - User email
     * @returns {Promise<Object>} Lockout status
     */
    async checkAccountLockout(email) {
        try {
            const supabase = window.supabase;
            
            if (!supabase) {
                console.error('Supabase client not initialized');
                return { locked: false };
            }

            // Call the is_account_locked function
            const { data, error } = await supabase
                .rpc('is_account_locked', { p_email: email });

            if (error) {
                console.error('Error checking account lockout:', error);
                return { locked: false };
            }

            if (data) {
                // Get detailed lockout info
                const { data: lockoutInfo, error: infoError } = await supabase
                    .rpc('get_lockout_info', { p_email: email });

                if (!infoError && lockoutInfo && lockoutInfo.length > 0) {
                    const info = lockoutInfo[0];
                    return {
                        locked: info.is_locked,
                        lockedUntil: info.locked_until,
                        minutesRemaining: info.minutes_remaining,
                        failedAttempts: info.failed_attempts
                    };
                }

                return { locked: true };
            }

            return { locked: false };

        } catch (error) {
            console.error('Account lockout check failed:', error);
            return { locked: false };
        }
    },

    /**
     * Record failed login attempt
     * 
     * @param {string} email - User email
     * @param {string} reason - Failure reason
     * @returns {Promise<number>} Number of failed attempts
     */
    async recordFailedLogin(email, reason = 'Invalid credentials') {
        try {
            const supabase = window.supabase;
            
            if (!supabase) {
                console.error('Supabase client not initialized');
                return 0;
            }

            // Get user's IP address and user agent
            const ipAddress = await this.getClientIP();
            const userAgent = navigator.userAgent;

            // Call the record_failed_login function
            const { data, error } = await supabase
                .rpc('record_failed_login', {
                    p_email: email,
                    p_ip_address: ipAddress,
                    p_user_agent: userAgent,
                    p_failure_reason: reason
                });

            if (error) {
                console.error('Error recording failed login:', error);
                return 0;
            }

            console.log(`Failed login recorded. Attempt count: ${data}`);
            return data || 0;

        } catch (error) {
            console.error('Failed to record login attempt:', error);
            return 0;
        }
    },

    /**
     * Clear failed login attempts after successful login
     * 
     * @param {string} email - User email
     */
    async clearFailedAttempts(email) {
        try {
            const supabase = window.supabase;
            
            if (!supabase) {
                console.error('Supabase client not initialized');
                return;
            }

            const { error } = await supabase
                .rpc('clear_failed_login_attempts', { p_email: email });

            if (error) {
                console.error('Error clearing failed attempts:', error);
            } else {
                console.log('Failed login attempts cleared for:', email);
            }

        } catch (error) {
            console.error('Failed to clear login attempts:', error);
        }
    },

    /**
     * Get client IP address (best effort)
     */
    async getClientIP() {
        try {
            // Try to get IP from ipify API
            const response = await fetch('https://api.ipify.org?format=json', {
                timeout: 2000
            });
            const data = await response.json();
            return data.ip || 'unknown';
        } catch (error) {
            // Fallback to unknown if service is unavailable
            return 'unknown';
        }
    },

    /**
     * Display lockout message to user
     * 
     * @param {Object} lockoutInfo - Lockout information
     * @returns {string} User-friendly message
     */
    getLockoutMessage(lockoutInfo) {
        if (!lockoutInfo.locked) {
            return '';
        }

        const minutes = lockoutInfo.minutesRemaining || 15;
        const attempts = lockoutInfo.failedAttempts || 5;

        return `🔒 Your account has been temporarily locked due to ${attempts} failed login attempts. 
                Please try again in ${minutes} minutes, or contact support if you need assistance.`;
    },

    /**
     * Secure login handler with rate limiting
     * 
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} Login result
     */
    async secureLogin(email, password) {
        try {
            // 1. Check if account is locked
            const lockoutStatus = await this.checkAccountLockout(email);
            
            if (lockoutStatus.locked) {
                return {
                    success: false,
                    error: this.getLockoutMessage(lockoutStatus),
                    locked: true
                };
            }

            // 2. Attempt login with Supabase
            const supabase = window.supabase;
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                // Record failed attempt
                const attemptCount = await this.recordFailedLogin(email, error.message);

                // Check if this failed attempt triggered a lockout
                const maxAttempts = window.AppConfig?.security?.maxLoginAttempts || 5;
                if (attemptCount >= maxAttempts) {
                    return {
                        success: false,
                        error: `Too many failed attempts. Your account has been locked for ${window.AppConfig?.security?.lockoutDuration || 15} minutes.`,
                        locked: true
                    };
                }

                const remainingAttempts = maxAttempts - attemptCount;
                return {
                    success: false,
                    error: error.message,
                    remainingAttempts
                };
            }

            // 3. Success - clear failed attempts
            await this.clearFailedAttempts(email);

            return {
                success: true,
                user: data.user,
                session: data.session
            };

        } catch (error) {
            console.error('Secure login error:', error);
            return {
                success: false,
                error: 'Login failed. Please try again.'
            };
        }
    },

    /**
     * Show remaining attempts warning
     */
    showRemainingAttemptsWarning(remainingAttempts) {
        if (remainingAttempts <= 2) {
            return `⚠️ Warning: ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before account lockout.`;
        }
        return '';
    }
};

// Make available globally
window.AuthSecurity = AuthSecurity;

console.log('✅ AuthSecurity loaded');
