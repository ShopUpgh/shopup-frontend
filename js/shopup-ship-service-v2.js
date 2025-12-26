// ShopUp Ship Service V2
function createShopUpShipServiceV2() {
  return {
    name: 'ShopUp Ship V2',
    createShipment: (userId, payload) =>
      Promise.resolve({
        userId,
        payload,
        status: 'created',
        trackingId: `SHIPV2-${Date.now()}`,
      }),
    getTracking: (trackingId) =>
      Promise.resolve({
        trackingId,
        status: 'in_transit',
      }),
  };
}

window.createShopUpShipServiceV2 = window.createShopUpShipServiceV2 || createShopUpShipServiceV2;
