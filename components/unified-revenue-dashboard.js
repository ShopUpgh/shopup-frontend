document.addEventListener('DOMContentLoaded', () => {
  const mount = document.getElementById('unifiedRevenueContainer');
  if (!mount || !window.ShopUpApp) return;

  const revenueManager = window.ShopUpApp.getService('revenueManager');
  const resolveUserId = () => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('user');
    if (fromQuery) return fromQuery;
    try {
      const auth = window.ShopUpApp.getService('auth');
      const current = auth.getCurrentUser && auth.getCurrentUser();
      if (current && current.id) return current.id;
    } catch (e) {
      console.warn('UnifiedRevenueDashboard: auth service unavailable, using fallback user ID', e);
    }
    return 'dashboard-user';
  };

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

  revenueManager.getDashboard(resolveUserId()).then(render);
});
