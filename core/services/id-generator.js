// core/services/id-generator.js
// Shared ID generator utility for ShopUp services

(function(global) {
  function generate(prefix) {
    if (global.crypto && global.crypto.randomUUID) {
      return `${prefix}-${global.crypto.randomUUID()}`;
    }
    const random = Math.random().toString(36).slice(2, 12).toUpperCase();
    return `${prefix}-${Date.now()}-${random}`;
  }

  global.IdGenerator = {
    generate
  };

  console.log('✅ ID generator ready');
})(window);
