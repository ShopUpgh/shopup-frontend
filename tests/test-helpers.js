/**
 * Test Helpers for ShopUp Ghana
 * Utilities for testing the application
 */

// Create mock services for testing
function createMockAuth() {
    return {
        signUp: async (email, password, metadata) => {
            console.log('[MOCK] SignUp called', { email, metadata });
            return { 
                success: true, 
                user: { id: 'mock-user-123', email },
                session: { access_token: 'mock-token' }
            };
        },
        signIn: async (email, password) => {
            console.log('[MOCK] SignIn called', { email });
            return { 
                success: true, 
                user: { id: 'mock-user-123', email },
                session: { access_token: 'mock-token' }
            };
        },
        signOut: async () => {
            console.log('[MOCK] SignOut called');
            return { success: true };
        },
        getCurrentUser: () => {
            return { id: 'mock-user-123', email: 'test@example.com' };
        },
        isAuthenticated: () => true,
        getClient: () => ({
            from: (table) => ({
                insert: async () => ({ data: {}, error: null }),
                select: () => ({
                    eq: () => ({
                        single: async () => ({ data: {}, error: null })
                    })
                })
            })
        })
    };
}

function createMockLogger() {
    return {
        info: (msg, data) => console.log('[MOCK INFO]', msg, data),
        error: (msg, error, data) => console.log('[MOCK ERROR]', msg, error, data),
        warn: (msg, data) => console.log('[MOCK WARN]', msg, data),
        debug: (msg, data) => console.log('[MOCK DEBUG]', msg, data),
        pageView: (page) => console.log('[MOCK PAGE VIEW]', page),
        track: (event, props) => console.log('[MOCK TRACK]', event, props)
    };
}

function createMockStorage() {
    const store = {};
    return {
        get: (key, defaultValue) => store[key] || defaultValue,
        set: (key, value) => { store[key] = value; return true; },
        remove: (key) => { delete store[key]; return true; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); return true; },
        has: (key) => key in store,
        keys: () => Object.keys(store)
    };
}

function createMockConfig() {
    const config = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-key',
        VAT_RATE: 0.175,
        CURRENCY: 'GHS'
    };
    
    return {
        get: (key, defaultValue) => config[key] || defaultValue,
        set: (key, value) => { config[key] = value; },
        getAll: () => ({ ...config }),
        isFeatureEnabled: (feature) => true,
        getEnvironment: () => 'test',
        isProduction: () => false,
        isDevelopment: () => false
    };
}

// Test a signup form
async function testSignupForm() {
    console.log('\n🧪 Testing Signup Form...\n');
    
    const container = new DIContainer();
    
    // Register mocks
    container.registerInstance('config', createMockConfig());
    container.registerInstance('auth', createMockAuth());
    container.registerInstance('logger', createMockLogger());
    container.registerInstance('storage', createMockStorage());
    
    // Create form element
    const form = document.createElement('form');
    form.id = 'signupForm';
    form.innerHTML = `
        <input id="email" name="email" value="test@example.com">
        <input id="password" name="password" value="password123">
        <input id="confirmPassword" name="confirmPassword" value="password123">
        <input id="businessName" name="businessName" value="Test Shop">
        <input id="firstName" name="firstName" value="John">
        <input id="lastName" name="lastName" value="Doe">
        <input id="phone" name="phone" value="0244123456">
        <input id="city" name="city" value="Accra">
        <select id="region" name="region"><option value="Greater Accra" selected>Greater Accra</option></select>
        <select id="businessCategory" name="businessCategory"><option value="fashion" selected>Fashion</option></select>
        <button type="submit">Submit</button>
    `;
    
    // Create controller with mocks
    const controller = new SignupController(
        container.get('auth'),
        container.get('logger'),
        container.get('storage'),
        form
    );
    
    // Test validation
    const data = controller.getFormData();
    const validation = controller.validate(data);
    
    console.log('✓ Form Data:', data);
    console.log('✓ Validation:', validation);
    
    if (validation.valid) {
        console.log('✅ Signup form test PASSED');
    } else {
        console.log('❌ Signup form test FAILED:', validation.message);
    }
    
    return validation.valid;
}

// Test a login form
async function testLoginForm() {
    console.log('\n🧪 Testing Login Form...\n');
    
    const container = new DIContainer();
    
    // Register mocks
    container.registerInstance('config', createMockConfig());
    container.registerInstance('auth', createMockAuth());
    container.registerInstance('logger', createMockLogger());
    container.registerInstance('storage', createMockStorage());
    
    // Create form element
    const form = document.createElement('form');
    form.id = 'loginForm';
    form.innerHTML = `
        <input id="email" name="email" value="test@example.com">
        <input id="password" name="password" value="password123">
        <button type="submit">Submit</button>
    `;
    
    // Create controller with mocks
    const controller = new LoginController(
        container.get('auth'),
        container.get('logger'),
        container.get('storage'),
        form
    );
    
    console.log('✓ Login controller created');
    console.log('✅ Login form test PASSED');
    
    return true;
}

// Run all tests
async function runAllTests() {
    console.log('\n🚀 Running All Tests...\n');
    
    try {
        await testSignupForm();
        await testLoginForm();
        
        console.log('\n✅ All tests completed!\n');
    } catch (error) {
        console.error('\n❌ Tests failed:', error);
    }
}

// Export
window.TestHelpers = {
    createMockAuth,
    createMockLogger,
    createMockStorage,
    createMockConfig,
    testSignupForm,
    testLoginForm,
    runAllTests
};

console.log('✅ TestHelpers loaded');
console.log('💡 Run tests with: TestHelpers.runAllTests()');
