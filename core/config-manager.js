// core/config-manager.js
// Central configuration manager for ShopUp services

(function(global) {
  const defaultConfig = {
    services: {
      shipping: {
        provider: 'ghana_post',
        apiKey: '',
        baseUrl: 'https://api.shipping.local'
      },
      notification: {
        provider: 'resend',
        apiKey: '',
        defaultSender: 'no-reply@shopup.gh'
      },
      map: {
        provider: 'mapbox',
        apiKey: '',
        fallbackCenter: { lat: 5.6037, lng: -0.187 }
      },
      receipt: {
        issuer: 'ShopUp Ghana',
        currency: 'GHS',
        template: 'standard'
      }
    }
  };

  const overrides = global.SHOPUP_CONFIG || {};
  const mergedConfig = {
    ...defaultConfig,
    ...overrides,
    services: {
      ...defaultConfig.services,
      ...(overrides.services || {})
    }
  };

  const ConfigManager = {
    /**
     * Get a top-level config value
     * @param {string} key
     * @returns {*}
     */
    get(key) {
      return mergedConfig[key];
    },

    /**
     * Set a top-level config value
     * @param {string} key
     * @param {*} value
     * @returns {*}
     */
    set(key, value) {
      mergedConfig[key] = value;
      return mergedConfig[key];
    },

    /**
     * Get configuration for a specific service
     * @param {string} serviceName
     * @returns {Object}
     */
    getServiceConfig(serviceName) {
      return mergedConfig.services[serviceName] || {};
    },

    /**
     * Update configuration for a specific service
     * @param {string} serviceName
     * @param {Object} value
     * @returns {Object}
     */
    updateServiceConfig(serviceName, value) {
      mergedConfig.services[serviceName] = {
        ...(mergedConfig.services[serviceName] || {}),
        ...(value || {})
      };
      return mergedConfig.services[serviceName];
    },

    /**
     * Get a snapshot of all configuration
     * @returns {Object}
     */
    all() {
      return JSON.parse(JSON.stringify(mergedConfig));
    }
  };

  global.ConfigManager = ConfigManager;
  console.log('✅ Config manager ready', {
    services: Object.keys(mergedConfig.services || {})
  });
})(window);
