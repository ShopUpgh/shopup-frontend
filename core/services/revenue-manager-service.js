// core/services/revenue-manager-service.js
// Lightweight revenue manager stub for cross-sell suggestions and unified totals

(function(global) {
  const STREAMS = [
    { key: 'marketplace', name: 'Marketplace', cost: 199 },
    { key: 'ship', name: 'ShopUp Ship', cost: 399 },
    { key: 'analytics', name: 'Analytics Pro', cost: 49 },
    { key: 'ai', name: 'AI Assistant', cost: 79 },
    { key: 'verification', name: 'Verification', cost: 8.25 }
  ];

  function getUserStreams() {
    // Placeholder: assume first three are active
    return {
      marketplace: { active: true, plan: 'business', cost: 199 },
      ship: { active: true, plan: 'business', cost: 399 },
      analytics: { active: true, plan: 'pro', cost: 49 },
      ai: { active: false, plan: 'starter', cost: 79 },
      verification: { active: false, plan: 'gold', cost: 8.25 }
    };
  }

  function bundleDiscount(count) {
    if (count >= 5) return 0.1;
    if (count >= 3) return 0.05;
    return 0;
  }

  function calculateTotals(streams) {
    const active = Object.values(streams).filter(s => s.active);
    const subtotal = active.reduce((sum, s) => sum + Number(s.cost || 0), 0);
    const discountRate = bundleDiscount(active.length);
    const discount = subtotal * discountRate;
    const total = subtotal - discount;
    return { subtotal, discount, total, discountRate };
  }

  function getSuggestions(streams) {
    const suggestions = [];
    if (!streams.verification?.active && streams.ship?.active) {
      suggestions.push({
        stream: 'verification',
        title: 'Get Verified - Increase Sales by 40%',
        potentialRevenue: 2400,
        cta: 'Get Verified',
        url: '#'
      });
    }
    if (!streams.ai?.active && (streams.analytics?.active || streams.marketplace?.active)) {
      suggestions.push({
        stream: 'ai',
        title: 'Add AI Assistant for 24/7 support',
        potentialRevenue: 1500,
        cta: 'Enable AI Assistant',
        url: '#'
      });
    }
    return suggestions;
  }

  const RevenueManagerService = {
    async getDashboard(userId) {
      const streams = getUserStreams(userId);
      const totals = calculateTotals(streams);
      return {
        success: true,
        current: {
          monthlyRecurring: totals.total,
          total: totals.total
        },
        breakdown: streams,
        discount: totals.discount,
        discountRate: totals.discountRate,
        suggestions: getSuggestions(streams)
      };
    },

    async createUnifiedInvoice(userId, period = '2024-12') {
      const streams = getUserStreams(userId);
      const totals = calculateTotals(streams);
      return {
        invoiceNumber: `INV-${period}-${userId || 'USER'}`,
        items: Object.entries(streams).map(([key, s]) => ({
          service: s.name || key,
          cost: s.cost,
          plan: s.plan,
          active: s.active
        })),
        total: totals.total,
        discount: totals.discount,
        paymentUrl: `/payments/pay.html?invoice=INV-${period}-${userId || 'USER'}`
      };
    },

    async getSuggestedServices(userId) {
      const streams = getUserStreams(userId);
      return getSuggestions(streams);
    }
  };

  global.RevenueManagerService = RevenueManagerService;
  console.log('✅ Revenue manager service initialized');
})(window);
