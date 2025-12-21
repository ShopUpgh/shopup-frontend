// Supabase Configuration for ShopUp Ghana
const SUPABASE_URL = 'https://brbewkxpvihnsrbrlpzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4';

// Initialize Supabase client (use var to avoid redeclaration errors)
var supabase = null;

// Check if Supabase library is loaded
if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error('❌ Supabase library not loaded from CDN');
}

// Log initialization
if (supabase) {
    console.log('✅ Supabase initialized for ShopUp Ghana');
    console.log('📍 Project URL:', SUPABASE_URL);
    console.log('🔑 Key configured:', SUPABASE_ANON_KEY.length > 0 ? 'Yes' : 'No');
} else {
    console.error('❌ Failed to initialize Supabase client');
}

// Test database connection
async function testConnection() {
    if (!supabase) {
        console.error('❌ Cannot test connection: Supabase client not initialized');
        return;
    }
    
    try {
        const { data, error } = await supabase.from('sellers').select('count');
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
if (typeof window !== 'undefined' && supabase) {
    testConnection();
}
