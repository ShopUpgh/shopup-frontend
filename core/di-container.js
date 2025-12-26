class DIContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, factory) {
    if (!name || typeof factory !== 'function') {
      throw new Error('Service registration requires a name and factory function');
    }
    this.services.set(name, { factory, instance: null });
  }

  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service "${name}" is not registered`);
    }
    const entry = this.services.get(name);
    if (!entry.instance) {
      entry.instance = entry.factory(this);
    }
    return entry.instance;
  }
}

const ShopUpApp = window.ShopUpApp || {};
ShopUpApp.container = ShopUpApp.container || new DIContainer();
ShopUpApp.registerService = ShopUpApp.registerService || ((name, factory) => {
  ShopUpApp.container.register(name, factory);
});
ShopUpApp.getService = ShopUpApp.getService || ((name) => ShopUpApp.container.get(name));

window.ShopUpApp = ShopUpApp;
