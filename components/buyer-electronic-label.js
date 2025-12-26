// components/buyer-electronic-label.js

(function() {
  function init() {
    const container = document.getElementById('buyerElectronicLabelContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const tracking = params.get('tracking') || 'SU-DEMO-TRACKING';
    const deviceId = params.get('device') || 'buyer-device';

    if (!window.AppServices || !window.AppServices.electronicLabel) {
      container.innerHTML = '<p>Electronic label service unavailable.</p>';
      return;
    }

    const service = window.AppServices.electronicLabel;
    const qrBox = document.createElement('div');
    qrBox.id = 'buyerQrBox';
    container.innerHTML = `
      <h2>Delivery QR Code</h2>
      <p>Tracking: <strong>${tracking}</strong></p>
      <div id="buyerQrBox"></div>
      <p id="buyerStatus"></p>
    `;
    container.appendChild(qrBox);

    function renderCode() {
      const result = service.createDeliveryCode(tracking, deviceId);
      if (!result.success) {
        document.getElementById('buyerStatus').textContent = 'Failed to generate code';
        return;
      }
      document.getElementById('buyerStatus').textContent = `Expires in 60s`;
      qrBox.innerHTML = '';
      if (window.QRCode) {
        new QRCode(qrBox, {
          text: result.code,
          width: 240,
          height: 240,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } else {
        qrBox.textContent = result.code;
      }
    }

    renderCode();
    setInterval(renderCode, 30000);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
