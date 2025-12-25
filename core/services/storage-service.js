/**
 * Storage Service
 * Provides abstraction layer over localStorage and sessionStorage
 * Handles serialization, deserialization, and error handling
 */
(function(window) {
    'use strict';

    class StorageService {
        constructor(config = {}) {
            this.prefix = config.prefix || 'shopup_';
            this.useSession = config.useSession || false;
        }
        
        /**
         * Get the storage object (localStorage or sessionStorage)
         */
        getStorage() {
            return this.useSession ? sessionStorage : localStorage;
        }
        
        /**
         * Get prefixed key
         * @param {string} key - Key name
         * @returns {string} Prefixed key
         */
        getPrefixedKey(key) {
            return this.prefix + key;
        }
        
        /**
         * Set a value in storage
         * @param {string} key - Key name
         * @param {*} value - Value to store (will be JSON stringified)
         * @returns {boolean} True if successful
         */
        set(key, value) {
            try {
                const prefixedKey = this.getPrefixedKey(key);
                const storage = this.getStorage();
                const serialized = JSON.stringify(value);
                storage.setItem(prefixedKey, serialized);
                return true;
            } catch (e) {
                console.error('StorageService: Failed to set value', key, e);
                return false;
            }
        }
        
        /**
         * Get a value from storage
         * @param {string} key - Key name
         * @param {*} defaultValue - Default value if key doesn't exist
         * @returns {*} Stored value or default
         */
        get(key, defaultValue = null) {
            try {
                const prefixedKey = this.getPrefixedKey(key);
                const storage = this.getStorage();
                const value = storage.getItem(prefixedKey);
                
                if (value === null) {
                    return defaultValue;
                }
                
                return JSON.parse(value);
            } catch (e) {
                console.error('StorageService: Failed to get value', key, e);
                return defaultValue;
            }
        }
        
        /**
         * Remove a value from storage
         * @param {string} key - Key name
         * @returns {boolean} True if successful
         */
        remove(key) {
            try {
                const prefixedKey = this.getPrefixedKey(key);
                const storage = this.getStorage();
                storage.removeItem(prefixedKey);
                return true;
            } catch (e) {
                console.error('StorageService: Failed to remove value', key, e);
                return false;
            }
        }
        
        /**
         * Check if a key exists in storage
         * @param {string} key - Key name
         * @returns {boolean} True if key exists
         */
        has(key) {
            try {
                const prefixedKey = this.getPrefixedKey(key);
                const storage = this.getStorage();
                return storage.getItem(prefixedKey) !== null;
            } catch (e) {
                console.error('StorageService: Failed to check key', key, e);
                return false;
            }
        }
        
        /**
         * Clear all prefixed keys from storage
         * @returns {boolean} True if successful
         */
        clear() {
            try {
                const storage = this.getStorage();
                const keysToRemove = [];
                
                // Find all keys with our prefix
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                // Remove them
                keysToRemove.forEach(key => storage.removeItem(key));
                return true;
            } catch (e) {
                console.error('StorageService: Failed to clear storage', e);
                return false;
            }
        }
        
        /**
         * Get all keys with the prefix
         * @returns {Array<string>} Array of keys (without prefix)
         */
        keys() {
            try {
                const storage = this.getStorage();
                const keys = [];
                
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        keys.push(key.substring(this.prefix.length));
                    }
                }
                
                return keys;
            } catch (e) {
                console.error('StorageService: Failed to get keys', e);
                return [];
            }
        }
        
        /**
         * Get the size of stored data (approximate)
         * @returns {number} Size in bytes
         */
        getSize() {
            try {
                const storage = this.getStorage();
                let size = 0;
                
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith(this.prefix)) {
                        const value = storage.getItem(key);
                        size += key.length + (value ? value.length : 0);
                    }
                }
                
                return size;
            } catch (e) {
                console.error('StorageService: Failed to get size', e);
                return 0;
            }
        }
    }
    
    // Export to window
    window.StorageService = StorageService;
    
    // Log initialization
    if (typeof console !== 'undefined') {
        console.log('✅ StorageService initialized');
    }
    
})(window);
