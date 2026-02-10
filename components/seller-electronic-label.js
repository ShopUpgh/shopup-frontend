function renderSellerElectronicLabel(containerId, labelData) {
  const mount = document.getElementById(containerId);
  if (!mount) return;
  mount.innerHTML = `
    <div class="electronic-label seller">
      <h2>Seller Electronic Label</h2>
      <p>Order: ${labelData.orderId}</p>
      <p>QR: ${labelData.qr}</p>
      <p>Status: ${labelData.status}</p>
    </div>
  `;
}

window.renderSellerElectronicLabel = window.renderSellerElectronicLabel || renderSellerElectronicLabel;
