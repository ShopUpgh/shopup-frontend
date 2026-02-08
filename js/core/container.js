// /js/core/container.js
(function () {
  "use strict";

  function isPromiseLike(value) {
    return value instanceof Promise || (value != null && typeof value.then === "function");
  }

  class Container {
    constructor() {
      this._factories = new Map();
      this._singletons = new Map();
      this._pending = new Map();
    }

    register(name, factory, { singleton = true } = {}) {
      if (!name || typeof factory !== "function") {
        throw new Error("Container.register(name, factory) requires a name and factory function");
      }
      this._factories.set(name, { factory, singleton });
    }

    // Note: resolve returns a value for sync factories, or a promise for singleton async factories.
    // Non-singleton factories are invoked on every call and whatever they return (value or promise) is passed through.
    resolve(name) {
      if (this._singletons.has(name)) return this._singletons.get(name);
      if (this._pending.has(name)) return this._pending.get(name);

      const entry = this._factories.get(name);
      if (!entry) throw new Error(`Dependency not registered: ${name}`);

      const instance = entry.factory(this);

      if (entry.singleton) {
        if (isPromiseLike(instance)) {
          const pending = Promise.resolve(instance)
            .then((resolved) => {
              this._singletons.set(name, resolved);
              this._pending.delete(name);
              return resolved;
            })
            .catch((err) => {
              // Clear pending cache so subsequent resolve calls can retry the factory
              this._pending.delete(name);
              throw err;
            });

          this._pending.set(name, pending);
          return pending;
        }

        this._singletons.set(name, instance);
      }

      return instance;
    }

    resolveAsync(name) {
      // Always returns a promise, useful when caller does not know if the factory is sync or async.
      return Promise.resolve(this.resolve(name));
    }
  }

  window.ShopUpContainer = new Container();
})();
