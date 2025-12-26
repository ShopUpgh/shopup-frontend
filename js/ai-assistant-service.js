// AI Assistant Service
// Manages AI subscription plans and customizable settings
(function() {
    const helpers = window.__shopupRevenueStorage || {};
    const pricing = window.SHOPUP_SERVICE_PRICING || {};

    function getPrice(plan) {
        return pricing.ai?.[plan] ?? 199;
    }

    function saveSubscription(userId, subscription) {
        if (helpers.upsertSubscription) {
            return helpers.upsertSubscription(userId, subscription);
        }
        return subscription;
    }

    function saveSettings(userId, settings) {
        if (helpers.mergeSettings) {
            return helpers.mergeSettings(userId, settings);
        }
        return settings;
    }

    class AIAssistantService {
        constructor(supabaseClient) {
            this.supabase = supabaseClient
                || (typeof supabase !== 'undefined' ? supabase : null)
                || (typeof window !== 'undefined' ? window.supabase : null);
        }

        async createSubscription(userId, plan = 'business') {
            const subscription = {
                id: `ai-${Date.now()}`,
                user_id: userId,
                type: 'ai',
                plan,
                price: getPrice(plan),
                status: 'active',
                created_at: new Date().toISOString()
            };

            saveSubscription(userId, subscription);
            await this.persist('ai_assistant_subscriptions', subscription);
            return subscription;
        }

        async updateSettings(userId, settings = {}) {
            const merged = saveSettings(userId, settings);
            await this.persist('ai_assistant_settings', {
                user_id: userId,
                settings: merged,
                updated_at: new Date().toISOString()
            });
            return merged;
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

    window.AIAssistantService = AIAssistantService;
})();
