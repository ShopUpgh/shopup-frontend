/**
 * Authentication Service
 * Provides authentication functionality using Supabase
 * Handles user login, signup, logout, and session management
 */
(function(window) {
    'use strict';

    class AuthService {
        constructor(container) {
            this.container = container;
            this.config = container.resolve('config');
            this.logger = container.resolve('logger');
            this.storage = container.resolve('storage');
            
            this.supabaseClient = null;
            this.currentUser = null;
            
            this.initialize();
        }
        
        /**
         * Initialize Supabase client
         */
        initialize() {
            try {
                const supabaseConfig = this.config.getSupabaseConfig();
                
                if (typeof window.supabase === 'undefined') {
                    this.logger.warn('Supabase library not loaded');
                    return;
                }
                
                this.supabaseClient = window.supabase.createClient(
                    supabaseConfig.url,
                    supabaseConfig.anonKey
                );
                
                this.logger.info('Supabase client initialized');
                
                // Check for existing session
                this.checkSession();
            } catch (e) {
                this.logger.error('Failed to initialize Supabase client', e);
            }
        }
        
        /**
         * Check for existing session
         */
        async checkSession() {
            try {
                if (!this.supabaseClient) return;
                
                const { data: { session }, error } = await this.supabaseClient.auth.getSession();
                
                if (error) {
                    this.logger.error('Failed to get session', error);
                    return;
                }
                
                if (session) {
                    this.currentUser = session.user;
                    this.storage.set('session', session);
                    this.logger.info('Active session found', session.user.id);
                }
            } catch (e) {
                this.logger.error('Session check failed', e);
            }
        }
        
        /**
         * Sign up a new user
         * @param {object} credentials - User credentials
         * @returns {Promise<object>} Signup result
         */
        async signUp(credentials) {
            try {
                if (!this.supabaseClient) {
                    throw new Error('Supabase client not initialized');
                }
                
                this.logger.info('Signing up user', credentials.email);
                
                const { data, error } = await this.supabaseClient.auth.signUp({
                    email: credentials.email,
                    password: credentials.password,
                    options: credentials.options || {}
                });
                
                if (error) {
                    this.logger.error('Signup failed', error);
                    return { success: false, error: error.message };
                }
                
                this.currentUser = data.user;
                this.storage.set('session', data.session);
                
                this.logger.info('Signup successful', data.user.id);
                
                return { success: true, user: data.user, session: data.session };
            } catch (e) {
                this.logger.error('Signup error', e);
                return { success: false, error: e.message };
            }
        }
        
        /**
         * Sign in a user
         * @param {string} email - User email
         * @param {string} password - User password
         * @returns {Promise<object>} Login result
         */
        async signIn(email, password) {
            try {
                if (!this.supabaseClient) {
                    throw new Error('Supabase client not initialized');
                }
                
                this.logger.info('Signing in user', email);
                
                const { data, error } = await this.supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) {
                    this.logger.error('Sign in failed', error);
                    return { success: false, error: error.message };
                }
                
                this.currentUser = data.user;
                this.storage.set('session', data.session);
                
                this.logger.info('Sign in successful', data.user.id);
                
                return { success: true, user: data.user, session: data.session };
            } catch (e) {
                this.logger.error('Sign in error', e);
                return { success: false, error: e.message };
            }
        }
        
        /**
         * Sign out the current user
         * @returns {Promise<object>} Logout result
         */
        async signOut() {
            try {
                if (!this.supabaseClient) {
                    throw new Error('Supabase client not initialized');
                }
                
                this.logger.info('Signing out user');
                
                const { error } = await this.supabaseClient.auth.signOut();
                
                if (error) {
                    this.logger.error('Sign out failed', error);
                    return { success: false, error: error.message };
                }
                
                this.currentUser = null;
                this.storage.remove('session');
                
                this.logger.info('Sign out successful');
                
                return { success: true };
            } catch (e) {
                this.logger.error('Sign out error', e);
                return { success: false, error: e.message };
            }
        }
        
        /**
         * Get current user
         * @returns {object|null} Current user or null
         */
        getCurrentUser() {
            return this.currentUser;
        }
        
        /**
         * Check if user is authenticated
         * @returns {boolean} True if authenticated
         */
        isAuthenticated() {
            return this.currentUser !== null;
        }
        
        /**
         * Get current session
         * @returns {Promise<object|null>} Current session or null
         */
        async getSession() {
            try {
                if (!this.supabaseClient) {
                    return null;
                }
                
                const { data: { session }, error } = await this.supabaseClient.auth.getSession();
                
                if (error) {
                    this.logger.error('Failed to get session', error);
                    return null;
                }
                
                return session;
            } catch (e) {
                this.logger.error('Get session error', e);
                return null;
            }
        }
        
        /**
         * Reset password for email
         * @param {string} email - User email
         * @returns {Promise<object>} Reset result
         */
        async resetPassword(email) {
            try {
                if (!this.supabaseClient) {
                    throw new Error('Supabase client not initialized');
                }
                
                this.logger.info('Requesting password reset', email);
                
                const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email);
                
                if (error) {
                    this.logger.error('Password reset failed', error);
                    return { success: false, error: error.message };
                }
                
                this.logger.info('Password reset email sent');
                
                return { success: true };
            } catch (e) {
                this.logger.error('Password reset error', e);
                return { success: false, error: e.message };
            }
        }
        
        /**
         * Update user password
         * @param {string} newPassword - New password
         * @returns {Promise<object>} Update result
         */
        async updatePassword(newPassword) {
            try {
                if (!this.supabaseClient) {
                    throw new Error('Supabase client not initialized');
                }
                
                this.logger.info('Updating password');
                
                const { error } = await this.supabaseClient.auth.updateUser({
                    password: newPassword
                });
                
                if (error) {
                    this.logger.error('Password update failed', error);
                    return { success: false, error: error.message };
                }
                
                this.logger.info('Password updated successfully');
                
                return { success: true };
            } catch (e) {
                this.logger.error('Password update error', e);
                return { success: false, error: e.message };
            }
        }
        
        /**
         * Get Supabase client instance
         * @returns {object|null} Supabase client
         */
        getClient() {
            return this.supabaseClient;
        }
    }
    
    // Export to window
    window.AuthService = AuthService;
    
    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('✅ AuthService initialized');
    }
    
})(window);
