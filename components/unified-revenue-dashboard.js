// components/unified-revenue-dashboard.js

(function() {
  async function init() {
    const container = document.getElementById('unifiedRevenueContainer');
    if (!container) return;

    if (!window.AppServices || !window.AppServices.revenueManager) {
      container.innerHTML = '<p>Revenue manager unavailable.</p>';
      return;
    }

    const svc = window.AppServices.revenueManager;
    const dashboard = await svc.getDashboard('demo-user');

    const activeStreams = Object.entries(dashboard.breakdown)
      .filter(([, s]) => s.active)
      .map(([key, s]) => `<li><strong>${s.name || key}</strong> - GH₵ ${s.cost}/mo (${s.plan || 'standard'})</li>`)
      .join('') || '<li>No active services</li>';

    const suggestions = (dashboard.suggestions || [])
      .map(s => `<li><strong>${s.title}</strong> — Potential: GH₵ ${s.potentialRevenue} <a href="${s.url}">${s.cta}</a></li>`)
      .join('') || '<li>No suggestions right now</li>';

    container.innerHTML = `
      <section>
        <h2>Unified Revenue Dashboard</h2>
        <p><strong>Monthly Total:</strong> GH₵ ${dashboard.current.monthlyRecurring.toFixed(2)}</p>
        <p><strong>Bundle Discount:</strong> GH₵ ${dashboard.discount.toFixed(2)} (${(dashboard.discountRate * 100).toFixed(0)}%)</p>
      </section>
      <section>
        <h3>Active Services</h3>
        <ul>${activeStreams}</ul>
      </section>
      <section>
        <h3>Suggestions</h3>
        <ul>${suggestions}</ul>
      </section>
    `;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
