/**
 * Authentication Service for ShopUp Ghana
 * Abstraction layer over Supabase Auth
 */

class AuthService {
    constructor(config, storage, logger) {
        this.config = config;
        this.storage = storage;
        this.logger = logger;
        this.supabase = null;
        this.currentUser = null;
        
        this.initializeSupabase();
    }

    /**
     * Initialize Supabase client
     */
    async initializeSupabase() {
        try {
            if (!window.supabase) {
                throw new Error('Supabase library not loaded');
            }

            const supabaseUrl = this.config.get('SUPABASE_URL');
            const supabaseKey = this.config.get('SUPABASE_ANON_KEY');

            if (!supabaseUrl || !supabaseKey) {
                throw new Error('Supabase configuration missing');
            }

            this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            
            // Load current session
            await this.loadSession();
            
            this.logger.info('Supabase initialized');
        } catch (error) {
            this.logger.error('Failed to initialize Supabase', error);
            throw error;
        }
    }

    /**
     * Load current session
     */
    async loadSession() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            
            if (user) {
                this.currentUser = user;
                this.storage.set('currentUser', user);
                this.logger.debug('Session loaded', { userId: user.id });
            }
        } catch (error) {
            this.logger.error('Failed to load session', error);
        }
    }

    /**
     * Sign up new user
     */
    async signUp(email, password, metadata = {}) {
        try {
            this.logger.info('Attempting signup');

            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.storage.set('currentUser', data.user);
            
            this.logger.info('Signup successful', { userId: data.user.id });
            
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            this.logger.error('Signup failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign in existing user
     */
    async signIn(email, password) {
        try {
            this.logger.info('Attempting signin');

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            this.storage.set('currentUser', data.user);
            
            this.logger.info('Signin successful', { userId: data.user.id });
            
            return { success: true, user: data.user, session: data.session };
        } catch (error) {
            this.logger.error('Signin failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) throw error;

            this.currentUser = null;
            this.storage.remove('currentUser');
            this.storage.remove('authToken');
            
            this.logger.info('Signout successful');
            
            return { success: true };
        } catch (error) {
            this.logger.error('Signout failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Reset password
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email);
            
            if (error) throw error;
            
            this.logger.info('Password reset email sent');
            
            return { success: true };
        } catch (error) {
            this.logger.error('Password reset failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update user metadata
     */
    async updateUser(updates) {
        try {
            const { data, error } = await this.supabase.auth.updateUser(updates);
            
            if (error) throw error;
            
            this.currentUser = data.user;
            this.storage.set('currentUser', data.user);
            
            this.logger.info('User updated');
            
            return { success: true, user: data.user };
        } catch (error) {
            this.logger.error('User update failed', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get Supabase client (for direct access if needed)
     */
    getClient() {
        return this.supabase;
    }
}

// Factory function for DI container
function createAuthService(container) {
    const config = container.get('config');
    const storage = container.get('storage');
    const logger = container.get('logger');
    
    return new AuthService(config, storage, logger);
}

// Export
window.AuthService = AuthService;
window.createAuthService = createAuthService;

console.log('✅ AuthService loaded');
