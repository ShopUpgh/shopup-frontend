function createSocialIntegrationService() {
  return {
    name: 'Social Integration',
    connectChannel: (channel) =>
      Promise.resolve({
        channel,
        status: 'connected',
      }),
  };
}
