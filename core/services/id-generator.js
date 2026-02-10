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

  function ensure(prefix) {
    if (typeof prefix !== 'string' || !prefix.length) {
      throw new Error('A prefix is required to generate an ID');
    }
    return generate(prefix);
  }

  global.IdGenerator = {
    generate,
    ensure
  };

  console.log('✅ ID generator ready');
})(window);
