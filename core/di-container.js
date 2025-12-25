/**
 * Dependency Injection Container
 * Manages service instances and dependencies for ShopUp application
 * Provides a centralized way to register and resolve services
 */
(function(window) {
    'use strict';

    class DIContainer {
        constructor() {
            this.services = new Map();
            this.singletons = new Map();
        }
        
        /**
         * Register a service factory
         * @param {string} name - Service name
         * @param {Function} factory - Factory function that creates the service
         * @param {boolean} singleton - Whether to create a singleton instance
         */
        register(name, factory, singleton = true) {
            this.services.set(name, {
                factory,
                singleton
            });
        }
        
        /**
         * Resolve a service by name
         * @param {string} name - Service name
         * @returns {*} Service instance
         */
        resolve(name) {
            const service = this.services.get(name);
            
            if (!service) {
                throw new Error(`Service '${name}' not registered`);
            }
            
            // Return singleton instance if already created
            if (service.singleton && this.singletons.has(name)) {
                return this.singletons.get(name);
            }
            
            // Create new instance
            const instance = service.factory(this);
            
            // Store singleton instance
            if (service.singleton) {
                this.singletons.set(name, instance);
            }
            
            return instance;
        }
        
        /**
         * Check if a service is registered
         * @param {string} name - Service name
         * @returns {boolean} True if service is registered
         */
        has(name) {
            return this.services.has(name);
        }
        
        /**
         * Get all registered service names
         * @returns {Array<string>} Array of service names
         */
        getServiceNames() {
            return Array.from(this.services.keys());
        }
        
        /**
         * Clear all services and singletons
         */
        clear() {
            this.services.clear();
            this.singletons.clear();
        }
        
        /**
         * Remove a specific service
         * @param {string} name - Service name
         */
        remove(name) {
            this.services.delete(name);
            this.singletons.delete(name);
        }
    }
    
    // Create singleton instance
    window.DIContainer = DIContainer;
    
    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('✅ DIContainer initialized');
    }
    
})(window);
