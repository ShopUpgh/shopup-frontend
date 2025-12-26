function AppBootstrap() {
  this.container = window.ShopUpApp && window.ShopUpApp.container;

  this.init = function init() {
    // PHASE 1: Core Revenue Streams
    this.container.register('shopupShip', createShopUpShipService);
    this.container.register('analytics', createAnalyticsProService);
    this.container.register('verification', createVerificationService);

    // PHASE 2: Scale & Automation
    this.container.register('social', createSocialIntegrationService);
    this.container.register('aiAssistant', createAIAssistantService);

    // PHASE 3: Advanced Services (from remaining-revenue-services.js)
    this.container.register('designStudio', createDesignStudioService);
    this.container.register('capital', createCapitalService);
    this.container.register('academy', createAcademyService);
    this.container.register('ads', createAdsService);
    this.container.register('packaging', createPackagingService);

    // PHASE 4: Premium Services
    this.container.register('export', createExportService);
    this.container.register('giftcards', createGiftCardService);
    this.container.register('support', createSupportService);
    this.container.register('liveShopping', createLiveShoppingService);
    this.container.register('payment', createPaymentProcessingService);

    // Electronic Labels
    this.container.register('electronicLabel', createElectronicLabelService);

    // REVENUE MANAGER (ALWAYS LAST!)
    this.container.register('revenueManager', createRevenueManagerService);
  };
}

(function bootstrap() {
  const appBootstrap = new AppBootstrap();
  appBootstrap.init();
})();
