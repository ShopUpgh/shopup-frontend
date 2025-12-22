// Supabase Configuration for ShopUp Ghana
const SUPABASE_URL = 'https://brbewkxpvihnsrbrlpzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyYmV3a3hwdmlobnNyYnJscHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTI4OTAsImV4cCI6MjA3ODY4ODg5MH0.SfZMbpxsNHTgoXIvn9HZnXSZAQnCSjKNpAnH4vLVVj4';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Log initialization
console.log('✅ Supabase initialized for ShopUp Ghana');
console.log('📍 Project URL:', SUPABASE_URL);
console.log('🔑 Key configured:', SUPABASE_ANON_KEY.length > 0 ? 'Yes' : 'No');

// Test database connection
async function testConnection() {
    try {
        const { data, error } = await supabase.from('customer_profiles').select('count');
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
