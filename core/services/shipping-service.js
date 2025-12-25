// core/services/shipping-service.js
// Lightweight shipping helper for ShopUp

(function(global) {
  const FALLBACK_PROVIDERS = [
    { id: 'ghana_post', name: 'Ghana Post', supportsGps: true },
    { id: 'dhl_ghana', name: 'DHL Ghana', supportsGps: false },
    { id: 'local_courier', name: 'Local Courier', supportsGps: false }
  ];

  function getConfig() {
    return (global.ConfigManager && global.ConfigManager.getServiceConfig('shipping')) || {};
  }

  function getProviders() {
    const config = getConfig();
    return config.providers || FALLBACK_PROVIDERS;
  }

  async function calculateRate(shipment) {
    const config = getConfig();
    const baseRate = Number(config.baseRate || 25);
    const weightMultiplier = Number(config.weightMultiplier || 1.2);
    const distanceMultiplier = Number(config.distanceMultiplier || 0.8);

    const weight = Number(shipment?.weightKg || 0);
    const distance = Number(shipment?.distanceKm || 0);

    const amount = baseRate + (weight * weightMultiplier) + (distance * distanceMultiplier);

    return {
      provider: config.provider || 'ghana_post',
      currency: config.currency || 'GHS',
      amount: Number(amount.toFixed(2)),
      breakdown: {
        baseRate,
        weight,
        distance
      }
    };
  }

  async function createShipment(shipment) {
    const config = getConfig();
    const trackingNumber = shipment?.trackingNumber || (
      global.IdGenerator && global.IdGenerator.generate
        ? global.IdGenerator.generate('SHP')
        : `SHP-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
    );

    return {
      success: true,
      provider: config.provider || 'ghana_post',
      trackingNumber,
      destination: shipment?.destination,
      eta: shipment?.eta || '2-5 business days'
    };
  }

  async function trackShipment(trackingNumber) {
    const config = getConfig();
    return {
      trackingNumber,
      provider: config.provider || 'ghana_post',
      status: 'processing',
      lastUpdated: new Date().toISOString()
    };
  }

  const ShippingService = {
    getConfig,
    getProviders,
    calculateRate,
    createShipment,
    trackShipment
  };

  global.ShippingService = ShippingService;
  console.log('✅ Shipping service initialized', {
    provider: getConfig().provider || 'ghana_post'
  });
})(window);
