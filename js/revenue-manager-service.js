// Revenue Manager Service
// Handles subscription summaries, bundle discounts, and cross-sell data
(function() {
    const STORAGE_KEY = 'shopup_revenue_state_v1';
    const SERVICE_PRICING = {
        ship: { starter: 199, growth: 399, enterprise: 799 },
        analytics: { pro: 49, enterprise: 129 },
        ai: { business: 199, starter: 99, enterprise: 299 },
        verification: { pro: 99 },
        design: { studio: 149 },
        capital: { starter: 0 }
    };

    function loadState() {
        if (typeof localStorage === 'undefined') {
            return { subscriptions: {}, shipments: {}, aiSettings: {} };
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { subscriptions: {}, shipments: {}, aiSettings: {} };
            const parsed = JSON.parse(raw);
            return {
                subscriptions: parsed.subscriptions || {},
                shipments: parsed.shipments || {},
                aiSettings: parsed.aiSettings || {}
            };
        } catch (err) {
            console.warn('⚠️ Unable to read revenue state, resetting', err);
            return { subscriptions: {}, shipments: {}, aiSettings: {} };
        }
    }

    function saveState(state) {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('⚠️ Unable to persist revenue state', err);
        }
    }

    function ensureUser(state, userId) {
        if (!state.subscriptions[userId]) state.subscriptions[userId] = [];
        if (!state.shipments[userId]) state.shipments[userId] = [];
        if (!state.aiSettings[userId]) state.aiSettings[userId] = {};
    }

    function resolvePrice(type, plan) {
        if (SERVICE_PRICING[type] && SERVICE_PRICING[type][plan]) {
            return SERVICE_PRICING[type][plan];
        }
        return SERVICE_PRICING[type]?.starter || 0;
    }

    function upsertSubscription(userId, subscription) {
        const state = loadState();
        ensureUser(state, userId);
        const existingIndex = state.subscriptions[userId].findIndex(
            (s) => s.type === subscription.type
        );
        const payload = {
            ...subscription,
            price: subscription.price ?? resolvePrice(subscription.type, subscription.plan || 'starter')
        };
        if (existingIndex >= 0) {
            state.subscriptions[userId][existingIndex] = payload;
        } else {
            state.subscriptions[userId].push(payload);
        }
        saveState(state);
        return payload;
    }

    function getSubscriptions(userId) {
        const state = loadState();
        ensureUser(state, userId);
        return state.subscriptions[userId];
    }

    function addShipment(userId, shipment) {
        const state = loadState();
        ensureUser(state, userId);
        state.shipments[userId].push(shipment);
        saveState(state);
        return shipment;
    }

    function mergeSettings(userId, settings) {
        const state = loadState();
        ensureUser(state, userId);
        state.aiSettings[userId] = {
            ...state.aiSettings[userId],
            ...settings
        };
        saveState(state);
        return state.aiSettings[userId];
    }

    class RevenueManagerService {
        constructor(supabaseClient) {
            this.supabase = supabaseClient
                || (typeof supabase !== 'undefined' ? supabase : null)
                || (typeof window !== 'undefined' ? window.supabase : null);
        }

        async getDashboardData(userId) {
            const subscriptions = getSubscriptions(userId);
            const totals = this.calculateTotals(subscriptions);
            const bundle = this.calculateBundleDiscount(userId);
            return {
                subscriptions,
                totals,
                bundle,
                availableServices: this.getAvailableServices(subscriptions),
                crossSell: this.getCrossSell(subscriptions),
                shipments: this.getShipments(userId)
            };
        }

        getShipments(userId) {
            const state = loadState();
            return (state.shipments && state.shipments[userId]) || [];
        }

        calculateTotals(subscriptions) {
            const totalMonthly = subscriptions.reduce((acc, sub) => {
                const price = sub.price ?? resolvePrice(sub.type, sub.plan || 'starter');
                return acc + price;
            }, 0);
            return {
                activeCount: subscriptions.length,
                totalMonthly: Number(totalMonthly.toFixed(2))
            };
        }

        calculateBundleDiscount(userId) {
            const subscriptions = getSubscriptions(userId);
            const totals = this.calculateTotals(subscriptions);
            const count = subscriptions.length;
            const percentage = count >= 5 ? 10 : count >= 2 ? 5 : 0;
            const savings = Number((totals.totalMonthly * (percentage / 100)).toFixed(2));
            return {
                percentage,
                savings,
                totalBeforeDiscount: totals.totalMonthly,
                totalAfterDiscount: Number((totals.totalMonthly - savings).toFixed(2)),
                activeCount: count
            };
        }

        getAvailableServices(subscriptions = []) {
            const activeTypes = subscriptions.map((s) => s.type);
            const catalog = [
                {
                    type: 'ship',
                    name: 'ShopUp Ship',
                    description: 'Nationwide delivery with tracking and QR labels.',
                    plan: 'starter',
                    price: SERVICE_PRICING.ship.starter
                },
                {
                    type: 'analytics',
                    name: 'Analytics Pro',
                    description: 'Store insights, dashboards, and growth metrics.',
                    plan: 'pro',
                    price: SERVICE_PRICING.analytics.pro
                },
                {
                    type: 'ai',
                    name: 'AI Assistant',
                    description: 'AI replies, canned responses, and smart workflows.',
                    plan: 'business',
                    price: SERVICE_PRICING.ai.business
                },
                {
                    type: 'verification',
                    name: 'Verification',
                    description: 'KYC, documents, and fraud checks for sellers.',
                    plan: 'pro',
                    price: SERVICE_PRICING.verification.pro
                },
                {
                    type: 'design',
                    name: 'Design Studio',
                    description: 'Brand assets, banners, and product templates.',
                    plan: 'studio',
                    price: SERVICE_PRICING.design.studio
                },
                {
                    type: 'capital',
                    name: 'ShopUp Capital',
                    description: 'Growth funding offers based on your sales.',
                    plan: 'starter',
                    price: 0
                }
            ];

            return catalog.map((item) => ({
                ...item,
                isActive: activeTypes.includes(item.type)
            }));
        }

        getCrossSell(subscriptions = []) {
            const activeTypes = subscriptions.map((s) => s.type);
            return [
                {
                    title: 'Bundle & Save',
                    detail: 'Add 2+ services to unlock 5% bundle savings.',
                    icon: '💰'
                },
                {
                    title: 'Launch AI Responses',
                    detail: 'Use AI Assistant to reply to customer chats instantly.',
                    icon: '🤖',
                    hidden: activeTypes.includes('ai')
                },
                {
                    title: 'Track Deliveries',
                    detail: 'Create QR-labeled shipments with ShopUp Ship.',
                    icon: '📦',
                    hidden: activeTypes.includes('ship')
                },
                {
                    title: 'Know Your Numbers',
                    detail: 'Analytics Pro shows top products and conversions.',
                    icon: '📊',
                    hidden: activeTypes.includes('analytics')
                }
            ].filter((item) => !item.hidden);
        }
    }

    window.RevenueManagerService = RevenueManagerService;
    window.SHOPUP_SERVICE_PRICING = SERVICE_PRICING;
    window.__shopupRevenueStorage = {
        STORAGE_KEY,
        loadState,
        saveState,
        ensureUser,
        upsertSubscription,
        getSubscriptions,
        addShipment,
        resolvePrice,
        mergeSettings
    };
})();
