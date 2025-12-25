// core/services/receipt-service.js
// Receipt generation utilities for ShopUp

(function(global) {
  function getConfig() {
    return (global.ConfigManager && global.ConfigManager.getServiceConfig('receipt')) || {};
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function calculateTotals(items, deliveryFee = 0, tax = 0) {
    const subtotal = items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      return sum + (qty * price);
    }, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax || 0),
      deliveryFee: Number(deliveryFee || 0),
      total: Number((subtotal + Number(tax || 0) + Number(deliveryFee || 0)).toFixed(2))
    };
  }

  function buildReceipt(order) {
    const config = getConfig();
    const items = order?.items || [];
    const totals = calculateTotals(items, order?.deliveryFee, order?.tax);
    const generator = global.IdGenerator && global.IdGenerator.ensure;
    if (!generator) {
      throw new Error('IdGenerator is not initialized');
    }

    return {
      id: order?.id || generator('RCP'),
      orderNumber: order?.orderNumber || order?.id || 'N/A',
      issuedAt: order?.issuedAt || new Date().toISOString(),
      currency: config.currency || 'GHS',
      issuer: config.issuer || 'ShopUp Ghana',
      customer: order?.customer || {},
      items,
      totals,
      paymentMethod: order?.paymentMethod || 'card',
      template: config.template || 'standard'
    };
  }

  function renderReceiptHTML(receipt) {
    const currency = receipt.currency || 'GHS';
    const rows = (receipt.items || []).map(item => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.quantity)}</td>
        <td>${currency} ${Number(item.price || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <title>Receipt ${escapeHtml(receipt.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h2>${escapeHtml(receipt.issuer)} - Receipt</h2>
          <p><strong>Receipt ID:</strong> ${escapeHtml(receipt.id)}</p>
          <p><strong>Order Number:</strong> ${escapeHtml(receipt.orderNumber)}</p>
          <p><strong>Issued:</strong> ${escapeHtml(receipt.issuedAt)}</p>
          <p><strong>Payment Method:</strong> ${escapeHtml(receipt.paymentMethod)}</p>
          <hr />
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <p><strong>Subtotal:</strong> ${currency} ${receipt.totals.subtotal.toFixed(2)}</p>
          <p><strong>Tax:</strong> ${currency} ${receipt.totals.tax.toFixed(2)}</p>
          <p><strong>Delivery:</strong> ${currency} ${receipt.totals.deliveryFee.toFixed(2)}</p>
          <p><strong>Total:</strong> ${currency} ${receipt.totals.total.toFixed(2)}</p>
        </body>
      </html>
    `;
  }

  function previewReceipt(order) {
    if (!order || typeof order !== 'object') {
      console.warn('Invalid order data for receipt preview');
      return null;
    }

    const receipt = buildReceipt(order);
    const html = renderReceiptHTML(receipt);
    const blobSupported = global.URL && typeof global.URL.createObjectURL === 'function';
    const blob = blobSupported ? new Blob([html], { type: 'text/html' }) : null;
    const objectUrl = blobSupported && blob ? global.URL.createObjectURL(blob) : null;
    const safeUrl = typeof objectUrl === 'string' && objectUrl.startsWith('blob:') ? objectUrl : null;
    if (!safeUrl) {
      console.warn('Receipt preview skipped because a safe blob URL could not be created.');
      return receipt;
    }

    const win = global.open(safeUrl, 'receipt-preview', 'noopener,noreferrer');

    if (safeUrl && global.URL && typeof global.URL.revokeObjectURL === 'function') {
      const revoke = () => global.URL.revokeObjectURL(safeUrl);
      if (win && typeof win.addEventListener === 'function') {
        win.addEventListener('unload', revoke);
      } else {
        revoke();
      }
    }

    return receipt;
  }

  const ReceiptService = {
    getConfig,
    buildReceipt,
    renderReceiptHTML,
    previewReceipt
  };

  global.ReceiptService = ReceiptService;
  console.log('✅ Receipt service initialized', {
    issuer: getConfig().issuer || 'ShopUp Ghana'
  });
})(window);
