function createDesignStudioService() {
  return {
    name: 'Design Studio',
    createAsset: (type) => Promise.resolve({ type, status: 'ready' }),
  };
}

function createCapitalService() {
  return {
    name: 'Capital',
    requestAdvance: (amount) =>
      Promise.resolve({ amount, status: 'approved', disbursed: true }),
  };
}

function createAcademyService() {
  return {
    name: 'Academy',
    enroll: (course) => Promise.resolve({ course, status: 'enrolled' }),
  };
}

function createAdsService() {
  return {
    name: 'Ads',
    launchCampaign: (channel) =>
      Promise.resolve({ channel, status: 'live' }),
  };
}

function createPackagingService() {
  return {
    name: 'Packaging',
    orderKits: (quantity) =>
      Promise.resolve({ quantity, status: 'processing' }),
  };
}

function createExportService() {
  return {
    name: 'Export',
    prepareShipment: (destination) =>
      Promise.resolve({ destination, status: 'prepared' }),
  };
}

function createGiftCardService() {
  return {
    name: 'Gift Cards',
    issue: (value) => Promise.resolve({ value, status: 'issued' }),
  };
}

function createSupportService() {
  return {
    name: 'Support',
    openTicket: (topic) => Promise.resolve({ topic, status: 'open' }),
  };
}

function createLiveShoppingService() {
  return {
    name: 'Live Shopping',
    schedule: (slot) => Promise.resolve({ slot, status: 'scheduled' }),
  };
}

function createPaymentProcessingService() {
  return {
    name: 'Payment Processing',
    createCharge: (amount) => Promise.resolve({ amount, status: 'settled' }),
  };
}
