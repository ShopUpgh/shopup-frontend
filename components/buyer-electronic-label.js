function renderBuyerElectronicLabel(containerId, labelData) {
  const mount = document.getElementById(containerId);
  if (!mount) return;
  mount.innerHTML = `
    <div class="electronic-label buyer">
      <h2>Buyer Electronic Label</h2>
      <p>Order: ${labelData.orderId}</p>
      <p>QR: ${labelData.qr}</p>
      <p>Status: ${labelData.status}</p>
    </div>
  `;
}

window.renderBuyerElectronicLabel = window.renderBuyerElectronicLabel || renderBuyerElectronicLabel;
