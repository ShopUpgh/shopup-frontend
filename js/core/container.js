// /js/core/container.js
(function () {
  "use strict";

  class Container {
    constructor() {
      this._factories = new Map();
      this._singletons = new Map();
    }

    register(name, factory, { singleton = true } = {}) {
      if (!name || typeof factory !== "function") {
        throw new Error("Container.register(name, factory) requires a name and factory function");
      }
      this._factories.set(name, { factory, singleton });
    }

    resolve(name) {
      if (this._singletons.has(name)) return this._singletons.get(name);

      const entry = this._factories.get(name);
      if (!entry) throw new Error(`Dependency not registered: ${name}`);

      const instance = entry.factory(this);
      if (entry.singleton) this._singletons.set(name, instance);
      return instance;
    }
  }

  window.ShopUpContainer = new Container();
})();
