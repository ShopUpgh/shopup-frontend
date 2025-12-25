// core/services/map-service.js
// Basic mapping helpers for ShopUp

(function(global) {
  function getConfig() {
    return (global.ConfigManager && global.ConfigManager.getServiceConfig('map')) || {};
  }

  function getFallbackCenter() {
    const config = getConfig();
    return config.fallbackCenter || { lat: 5.6037, lng: -0.187 };
  }

  function buildMapUrl(coordinates) {
    const config = getConfig();
    const { lat, lng } = coordinates || getFallbackCenter();
    const provider = config.provider || 'mapbox';

    if (provider === 'mapbox' && config.apiKey) {
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${lng},${lat},13,0/600x400?access_token=${config.apiKey}`;
    }

    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  async function geocode(address) {
    const center = getFallbackCenter();
    return {
      query: address,
      coordinates: center,
      provider: getConfig().provider || 'mapbox',
      tokenConfigured: Boolean(getConfig().apiKey)
    };
  }

  async function reverseGeocode(coordinates) {
    const { lat, lng } = coordinates || getFallbackCenter();
    return {
      address: `GPS ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      provider: getConfig().provider || 'mapbox'
    };
  }

  const MapService = {
    getConfig,
    geocode,
    reverseGeocode,
    buildMapUrl
  };

  global.MapService = MapService;
  console.log('✅ Map service initialized', {
    provider: getConfig().provider || 'mapbox'
  });
})(window);
