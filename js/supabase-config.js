// Supabase Configuration for ShopUp Ghana
const SUPABASE_URL = 'https://brbewkxpvihnsrbrlpzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4';

// Initialize Supabase client and make it globally available
// Check if Supabase library is loaded from CDN
if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('❌ Supabase CDN library not loaded. Make sure the CDN script is included before this file.');
} else {
    const supabaseLib = window.supabase; // The Supabase library from CDN
    const supabaseClientInstance = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Make the Supabase CLIENT available globally (not just the library)
    // Store on a different property to avoid confusion with the library
    window.supabaseClient = supabaseClientInstance;
    window.supabase = supabaseClientInstance; // Also keep this for backward compatibility

    // Log initialization
    console.log('✅ Supabase initialized for ShopUp Ghana');
    console.log('📍 Project URL:', SUPABASE_URL);
    console.log('🔑 Key configured:', SUPABASE_ANON_KEY.length > 0 ? 'Yes' : 'No');

    // Test database connection
    async function testConnection() {
        try {
            const { data, error } = await supabaseClientInstance.from('customer_profiles').select('count');
            if (error) {
                console.warn('⚠️ Database connection:', error.message);
            } else {
                console.log('✅ Database connected successfully');
            }
        } catch (err) {
            console.error('❌ Connection test failed:', err);
        }
    }

    // Auto-test on load
    testConnection();
}
