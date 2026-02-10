const ShopUpConfig = {
  version: '1.0.0',
  environment: 'local',
  baseUrl: '/',
  pricing: {
    amount: 10,
    currency: 'GHS',
    perService: {},
  },
};

window.ShopUpConfig = window.ShopUpConfig || ShopUpConfig;
