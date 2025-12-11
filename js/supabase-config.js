/**
 * ⚠️ DEPRECATED: This file is deprecated and will be removed in a future version.
 * Please use js/config.js instead for secure environment-based configuration.
 * 
 * This file is kept for backwards compatibility only.
 * 
 * SECURITY WARNING: Do NOT hardcode credentials here!
 * Use environment variables via js/config.js
 */

console.warn('⚠️ DEPRECATED: supabase-config.js is deprecated. Use js/config.js instead.');

// Check if new config system is loaded
if (typeof window.AppConfig !== 'undefined' && window.supabase) {
    console.log('✅ Using new config system (js/config.js)');
    
    // Export for backwards compatibility
    const SUPABASE_URL = window.AppConfig.supabase.url;
    const SUPABASE_ANON_KEY = window.AppConfig.supabase.anonKey;
    const supabase = window.supabase;
    
    // Make available globally for old code
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
} else {
    // Fallback to hardcoded values (ONLY for development/migration period)
    console.error('❌ New config system not loaded! Using fallback configuration.');
    console.error('⚠️ WARNING: Hardcoded credentials detected! This is insecure!');
    console.error('Please include js/config.js BEFORE this file.');
    
    // Fallback values - DO NOT USE IN PRODUCTION
    const SUPABASE_URL = 'https://brbewkxpvihnsrbrlpzq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4';
    
    // Initialize Supabase client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Make available globally
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    window.supabase = supabase;
    
    console.log('⚠️ Supabase initialized with fallback configuration');
    console.log('📍 Project URL:', SUPABASE_URL);
}
