/**
 * Dependency Injection Container for ShopUp Ghana
 * Manages service dependencies and lifecycle
 */

class DIContainer {
    constructor() {
        this.services = new Map();
        this.factories = new Map();
        this.singletons = new Map();
    }

    /**
     * Register a service factory
     * @param {string} name - Service name
     * @param {Function} factory - Factory function that creates the service
     * @param {boolean} singleton - Whether to create only one instance
     */
    register(name, factory, singleton = true) {
        this.factories.set(name, { factory, singleton });
        console.log(`📦 Registered service: ${name}`);
    }

    /**
     * Register an existing instance
     * @param {string} name - Service name
     * @param {*} instance - Service instance
     */
    registerInstance(name, instance) {
        this.singletons.set(name, instance);
        console.log(`📦 Registered instance: ${name}`);
    }

    /**
     * Get a service instance
     * @param {string} name - Service name
     * @returns {*} Service instance
     */
    get(name) {
        // Check if singleton instance exists
        if (this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        // Check if factory exists
        if (!this.factories.has(name)) {
            throw new Error(`Service '${name}' not registered`);
        }

        const { factory, singleton } = this.factories.get(name);

        // Create instance
        const instance = factory(this);

        // Store if singleton
        if (singleton) {
            this.singletons.set(name, instance);
        }

        return instance;
    }

    /**
     * Check if service is registered
     * @param {string} name - Service name
     * @returns {boolean}
     */
    has(name) {
        return this.factories.has(name) || this.singletons.has(name);
    }

    /**
     * Remove a service
     * @param {string} name - Service name
     */
    remove(name) {
        this.factories.delete(name);
        this.singletons.delete(name);
        console.log(`🗑️ Removed service: ${name}`);
    }

    /**
     * Clear all services
     */
    clear() {
        this.factories.clear();
        this.singletons.clear();
        console.log('🗑️ Cleared all services');
    }

    /**
     * Get all registered service names
     * @returns {string[]}
     */
    getServiceNames() {
        return [
            ...Array.from(this.factories.keys()),
            ...Array.from(this.singletons.keys())
        ];
    }
}

// Export global instance
window.DIContainer = DIContainer;
window.container = new DIContainer();

console.log('✅ DIContainer initialized');
