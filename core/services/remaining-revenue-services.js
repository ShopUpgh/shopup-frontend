const ensurePositiveNumber = (value, field) => {
  if (typeof value !== 'number' || value <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
};

function createDesignStudioService() {
  return {
    name: 'Design Studio',
    createAsset: (type) => Promise.resolve({ type, status: 'ready' }),
  };
}

function createCapitalService() {
  return {
    name: 'Capital',
    requestAdvance: (amount) => {
      try {
        ensurePositiveNumber(amount, 'Advance amount');
        return Promise.resolve({ amount, status: 'approved', disbursed: true });
      } catch (e) {
        return Promise.reject(e);
      }
    },
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
    orderKits: (quantity) => {
      try {
        ensurePositiveNumber(quantity, 'Packaging quantity');
        return Promise.resolve({ quantity, status: 'processing' });
      } catch (e) {
        return Promise.reject(e);
      }
    },
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
