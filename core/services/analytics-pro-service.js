function createAnalyticsProService() {
  return {
    name: 'Analytics Pro',
    getInsights: (userId) =>
      Promise.resolve({
        userId,
        salesForecast: 12500,
        trendingProducts: ['Bags', 'Shoes', 'Accessories'],
      }),
  };
}
