// ShopUp Ship Service v2
// Manages shipping subscriptions and shipments with safe Supabase fallbacks
(function() {
    const helpers = window.__shopupRevenueStorage || {};
    const pricing = window.SHOPUP_SERVICE_PRICING || {};

    function getPrice(plan) {
        return pricing.ship?.[plan] ?? 199;
    }

    function saveSubscription(userId, subscription) {
        if (helpers.upsertSubscription) {
            return helpers.upsertSubscription(userId, subscription);
        }
        return subscription;
    }

    function recordShipment(userId, shipment) {
        if (helpers.addShipment) {
            return helpers.addShipment(userId, shipment);
        }
        return shipment;
    }

    class ShopUpShipService {
        constructor(supabaseClient) {
            this.supabase = supabaseClient
                || (typeof supabase !== 'undefined' ? supabase : null)
                || (typeof window !== 'undefined' ? window.supabase : null);
        }

        async createSubscription(userId, plan = 'starter') {
            const subscription = {
                id: `ship-${Date.now()}`,
                user_id: userId,
                type: 'ship',
                plan,
                price: getPrice(plan),
                status: 'active',
                created_at: new Date().toISOString()
            };

            saveSubscription(userId, subscription);
            await this.persist('ship_subscriptions', subscription);
            return subscription;
        }

        async createShipment(userId, payload) {
            const tracking = this.generateTrackingNumber();
            const shipment = {
                id: `shp-${Date.now()}`,
                tracking_number: tracking,
                user_id: userId,
                status: 'processing',
                created_at: new Date().toISOString(),
                details: payload || {}
            };

            recordShipment(userId, shipment);
            await this.persist('ship_shipments', {
                user_id: userId,
                tracking_number: tracking,
                status: shipment.status,
                metadata: payload || {},
                created_at: shipment.created_at
            });

            const sellerLabel = { qrData: `seller:${tracking}` };
            const buyerLabel = { qrData: `buyer:${tracking}` };

            return { shipment, sellerLabel, buyerLabel };
        }

        generateTrackingNumber() {
            const base = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `SHOP-${Date.now().toString().slice(-6)}-${base}`;
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

    window.ShopUpShipService = ShopUpShipService;
})();
