// Supabase initialization helper (ESM-friendly to avoid CDN blocking)
(async function() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        window.supabaseClientFactory = window.supabase.createClient;
        return;
    }

    if (typeof window.supabaseClientFactory === 'function') {
        return;
    }

    try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.0');
        window.supabaseClientFactory = createClient;
        console.log('✅ Supabase factory loaded via ESM');
    } catch (error) {
        console.warn('⚠️ Supabase ESM load failed, using local fallback:', error);
        const stubQuery = () => ({
            select: async () => ({ data: [], error: null }),
            insert: async () => ({ data: [], error: null }),
            eq: () => stubQuery()
        });
        window.supabaseClientFactory = () => ({
            auth: { getUser: async () => ({ data: { user: null } }) },
            from: () => stubQuery()
        });
    }
})();
