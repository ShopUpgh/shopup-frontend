function createElectronicLabelService() {
  return {
    name: 'Electronic Label',
    createLabel: (orderId) =>
      Promise.resolve({
        orderId,
        qr: `QR-${orderId}-${Date.now()}`,
        status: 'generated',
      }),
  };
}
