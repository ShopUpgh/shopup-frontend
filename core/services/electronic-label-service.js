// core/services/electronic-label-service.js
// Dynamic QR label generator and validator

(function(global) {
  const EXPIRY_MS = 60 * 1000; // 60 seconds
  const STORAGE_KEY = 'shopup_elabel_used';

  function getUsedStore() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveUsedStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      // ignore
    }
  }

  function markUsed(codeId) {
    const store = getUsedStore();
    store[codeId] = Date.now();
    saveUsedStore(store);
  }

  function isUsed(codeId) {
    const store = getUsedStore();
    return Boolean(store[codeId]);
  }

  function generateId(prefix) {
    if (global.crypto && global.crypto.randomUUID) {
      return `${prefix}-${global.crypto.randomUUID()}`;
    }
    const randomSuffix = Math.random().toString(36).slice(2, 10).toUpperCase();
    return `${prefix}-${Date.now()}-${randomSuffix}`;
  }

  function buildPayload(trackingNumber, type, deviceId) {
    const createdAt = Date.now();
    return {
      id: generateId('EL'),
      trackingNumber,
      type,
      deviceId: deviceId || 'unknown-device',
      createdAt,
      expiresAt: createdAt + EXPIRY_MS,
      nonce: generateId('N')
    };
  }

  function encodePayload(payload) {
    return global.btoa(JSON.stringify(payload));
  }

  function decodePayload(encoded) {
    try {
      return JSON.parse(global.atob(encoded));
    } catch (e) {
      return null;
    }
  }

  function createCode(trackingNumber, type, deviceId) {
    const payload = buildPayload(trackingNumber, type, deviceId);
    const encoded = encodePayload(payload);
    return {
      success: true,
      code: encoded,
      payload,
      expiresAt: payload.expiresAt
    };
  }

  async function validateScan(encoded, context = {}) {
    const payload = decodePayload(encoded);

    if (!payload) {
      return { success: false, error: 'Invalid QR code' };
    }

    const now = Date.now();
    if (payload.expiresAt < now) {
      return { success: false, error: 'QR code expired' };
    }

    if (payload.deviceId && context.deviceId && payload.deviceId !== context.deviceId) {
      return { success: false, error: 'Device mismatch' };
    }

    if (isUsed(payload.id)) {
      return { success: false, error: 'QR code already used' };
    }

    markUsed(payload.id);

    return {
      success: true,
      trackingNumber: payload.trackingNumber,
      type: payload.type,
      message: payload.type === 'pickup' ? 'Pickup confirmed' : 'Delivery confirmed',
      scannedAt: new Date(now).toISOString(),
      shipperId: context.shipperId,
      location: context.location
    };
  }

  const ElectronicLabelService = {
    createPickupCode(trackingNumber, deviceId) {
      return createCode(trackingNumber, 'pickup', deviceId);
    },
    createDeliveryCode(trackingNumber, deviceId) {
      return createCode(trackingNumber, 'delivery', deviceId);
    },
    validateScan
  };

  global.ElectronicLabelService = ElectronicLabelService;
  console.log('✅ Electronic label service initialized');
})(window);
