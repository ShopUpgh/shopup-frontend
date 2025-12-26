/**
 * Storage Service for ShopUp Ghana
 * Abstraction layer over localStorage/sessionStorage
 */

class StorageService {
    constructor(storageType = 'local') {
        this.storage = storageType === 'session' ? sessionStorage : localStorage;
    }

    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*}
     */
    get(key, defaultValue = null) {
        try {
            const item = this.storage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            
            // Try to parse JSON
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.error(`Storage get error for key '${key}':`, error);
            return defaultValue;
        }
    }

    /**
     * Set item in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            const serialized = typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value);
            
            this.storage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error(`Storage set error for key '${key}':`, error);
            return false;
        }
    }

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Storage remove error for key '${key}':`, error);
            return false;
        }
    }

    /**
     * Clear all items from storage
     * @returns {boolean} Success status
     */
    clear() {
        try {
            this.storage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        return this.storage.getItem(key) !== null;
    }

    /**
     * Get all keys
     * @returns {string[]}
     */
    keys() {
        return Object.keys(this.storage);
    }

    /**
     * Get storage size (approximate)
     * @returns {number} Size in bytes
     */
    getSize() {
        let size = 0;
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                size += this.storage[key].length + key.length;
            }
        }
        return size;
    }
}

// Factory function for DI container
function createStorageService(container) {
    return new StorageService('local');
}

// Export
window.StorageService = StorageService;
window.createStorageService = createStorageService;

console.log('✅ StorageService loaded');
