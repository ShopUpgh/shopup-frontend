// Supabase Configuration for ShopUp Ghana

// Check if Supabase is already loaded
if (typeof window.supabase === 'undefined') {
    console.error('❌ Supabase library not loaded! Make sure you include the CDN script first.');
}

// Supabase credentials
const SUPABASE_URL = 'https://brbewkxpvihnsrbrlpzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4';

// Initialize Supabase client (only if not already created)
let supabase;
if (typeof window.supabaseClient === 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase; // Store globally
    console.log('✅ Supabase initialized for ShopUp Ghana');
} else {
    supabase = window.supabaseClient;
    console.log('✅ Using existing Supabase client');
}

console.log('📍 Project URL:', SUPABASE_URL);
console.log('🔑 Key configured:', SUPABASE_ANON_KEY.length > 0 ? 'Yes' : 'No');

// Test database connection
async function testConnection() {
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
if (typeof window !== 'undefined') {
    testConnection();
}
