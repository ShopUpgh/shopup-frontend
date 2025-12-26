// core/app-bootstrap.js
// Registers core services for ShopUp

(function(global) {
  const registry = {};

  if (!global.IdGenerator) {
    console.warn('⚠️ IdGenerator is not initialized; service IDs will not be generated.');
  }

  function registerService(name, service) {
    if (!service) {
      console.warn(`⚠️ Service "${name}" not available during bootstrap`);
      return;
    }
    registry[name] = service;
  }

  function getService(name) {
    return registry[name];
  }

  function init() {
    registerService('shipping', global.ShippingService);
    registerService('notification', global.NotificationService);
    registerService('map', global.MapService);
    registerService('receipt', global.ReceiptService);
    registerService('electronicLabel', global.ElectronicLabelService);
    registerService('revenueManager', global.RevenueManagerService);

    global.AppServices = registry;
    console.log('✅ App bootstrap complete', Object.keys(registry));
  }

  const AppBootstrap = {
    registerService,
    getService,
    listServices: () => Object.keys(registry),
    init
  };

  global.AppBootstrap = AppBootstrap;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
