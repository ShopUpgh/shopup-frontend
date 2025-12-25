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

    return {
      id: order?.id || (
        global.IdGenerator && global.IdGenerator.generate
          ? global.IdGenerator.generate('RCP')
          : `RCP-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
      ),
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

  function renderReceiptWindow(win, receipt) {
    if (!win || !win.document) {
      return;
    }

    const doc = win.document;
    doc.title = `Receipt ${receipt.id}`;
    doc.body.innerHTML = '';

    const style = doc.createElement('style');
    style.textContent = `
      body { font-family: Arial, sans-serif; padding: 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; }
    `;
    const head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement.appendChild(doc.createElement('head'));
    head.appendChild(style);

    const heading = doc.createElement('h2');
    heading.textContent = `${receipt.issuer} - Receipt`;
    doc.body.appendChild(heading);

    const meta = [
      ['Receipt ID', receipt.id],
      ['Order Number', receipt.orderNumber],
      ['Issued', receipt.issuedAt],
      ['Payment Method', receipt.paymentMethod]
    ];

    meta.forEach(([label, value]) => {
      const p = doc.createElement('p');
      p.textContent = `${label}: ${value}`;
      doc.body.appendChild(p);
    });

    const table = doc.createElement('table');
    const thead = doc.createElement('thead');
    const headerRow = doc.createElement('tr');
    ['Item', 'Qty', 'Price'].forEach(text => {
      const th = doc.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = doc.createElement('tbody');
    (receipt.items || []).forEach(item => {
      const row = doc.createElement('tr');
      const nameCell = doc.createElement('td');
      nameCell.textContent = item.name || '';
      const qtyCell = doc.createElement('td');
      qtyCell.textContent = item.quantity || 0;
      const priceCell = doc.createElement('td');
      priceCell.textContent = `${receipt.currency || 'GHS'} ${Number(item.price || 0).toFixed(2)}`;
      row.appendChild(nameCell);
      row.appendChild(qtyCell);
      row.appendChild(priceCell);
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    doc.body.appendChild(table);

    const totals = [
      ['Subtotal', receipt.totals.subtotal],
      ['Tax', receipt.totals.tax],
      ['Delivery', receipt.totals.deliveryFee],
      ['Total', receipt.totals.total]
    ];

    totals.forEach(([label, value]) => {
      const p = doc.createElement('p');
      p.textContent = `${label}: ${receipt.currency || 'GHS'} ${Number(value || 0).toFixed(2)}`;
      doc.body.appendChild(p);
    });
  }

  function previewReceipt(order) {
    if (!order || typeof order !== 'object') {
      console.warn('Invalid order data for receipt preview');
      return null;
    }

    const receipt = buildReceipt(order);
    const win = global.open('about:blank', 'receipt-preview', 'noopener,noreferrer');

    if (win) {
      renderReceiptWindow(win, receipt);
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
