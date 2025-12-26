document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('unifiedRevenueContainer');
  if (!mount || !window.ShopUpApp) return;

  const revenueManager = window.ShopUpApp.getService('revenueManager');
  const render = (dashboard) => {
    const services = Object.entries(dashboard.services || {})
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join('');

    mount.innerHTML = `
      <section>
        <h1>Unified Revenue Dashboard</h1>
        <p>User: ${dashboard.userId}</p>
        <p>Last Updated: ${dashboard.timestamp}</p>
        <h2>Services</h2>
        <ul>${services}</ul>
      </section>
    `;
  };

  revenueManager.getDashboard('dashboard-user').then(render);
});
