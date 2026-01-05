function createRevenueManagerService(container) {
  const defaultPricing = { amount: 10, currency: 'GHS', perService: {} };
  const PRICING = (window.ShopUpConfig && window.ShopUpConfig.pricing) || defaultPricing;

  const getRegisteredServiceKeys = () =>
    Array.from(container.services.keys()).filter((key) => key !== 'revenueManager');

  const getServiceSummary = () => {
    const summary = {};
    getRegisteredServiceKeys().forEach((key) => {
      try {
        const service = container.get(key);
        summary[key] = service.name || key;
      } catch (e) {
        summary[key] = 'unavailable';
      }
    });
    return summary;
  };

  return {
    name: 'Revenue Manager',
    getDashboard: (userId) =>
      Promise.resolve({
        userId,
        services: getServiceSummary(),
        timestamp: new Date().toISOString(),
      }),

    getSuggestedServices: (userId) =>
      Promise.resolve(
        getRegisteredServiceKeys().map((service) => ({
          userId,
          service,
          recommended: service !== 'revenueManager',
        })),
      ),

    createUnifiedInvoice: (userId, billingPeriod) => {
      const services = getRegisteredServiceKeys();
      const lineItems = services.map((service) => ({
        service,
        amount: (PRICING.perService && PRICING.perService[service]) || PRICING.amount,
        currency: PRICING.currency,
      }));

      const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

      return Promise.resolve({
        userId,
        billingPeriod,
        lineItems,
        total,
        currency: PRICING.currency,
      });
    },
  };
}
