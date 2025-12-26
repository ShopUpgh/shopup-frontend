function createShopUpShipService() {
  return {
    name: 'ShopUp Ship',
    createShipment: (userId, payload) =>
      Promise.resolve({
        userId,
        payload,
        status: 'created',
        trackingId: `SHIP-${Date.now()}`,
      }),
    getTracking: (trackingId) =>
      Promise.resolve({
        trackingId,
        status: 'in_transit',
      }),
  };
}
