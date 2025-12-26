// Analytics Pro Service
// Tracks analytics subscriptions and provides lightweight helpers
(function() {
    const helpers = window.__shopupRevenueStorage || {};
    const pricing = window.SHOPUP_SERVICE_PRICING || {};

    function getPrice(plan) {
        return pricing.analytics?.[plan] ?? 49;
    }

    function saveSubscription(userId, subscription) {
        if (helpers.upsertSubscription) {
            return helpers.upsertSubscription(userId, subscription);
        }
        return subscription;
    }

    class AnalyticsProService {
        constructor(supabaseClient) {
            this.supabase = supabaseClient
                || (typeof supabase !== 'undefined' ? supabase : null)
                || (typeof window !== 'undefined' ? window.supabase : null);
        }

        async createSubscription(userId, plan = 'pro') {
            const subscription = {
                id: `analytics-${Date.now()}`,
                user_id: userId,
                type: 'analytics',
                plan,
                price: getPrice(plan),
                status: 'active',
                created_at: new Date().toISOString()
            };

            saveSubscription(userId, subscription);
            await this.persist('analytics_subscriptions', subscription);
            return subscription;
        }

        async persist(table, payload) {
            if (!this.supabase || !this.supabase.from) return;
            try {
                const { error } = await this.supabase.from(table).insert(payload);
                if (error) {
                    console.warn(`ℹ️ Skipping Supabase insert for ${table}:`, error.message);
                }
            } catch (err) {
                console.warn(`⚠️ Supabase unavailable for ${table}`, err);
            }
        }
    }

    window.AnalyticsProService = AnalyticsProService;
})();
