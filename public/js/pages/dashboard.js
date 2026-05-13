/* ═══ Dashboard Page ═══ */
const DashboardPage = {
  async render() {
    const el = document.getElementById('main-content');
    el.innerHTML = Components.spinner();
    try {
      const stats = await API.stats();
      el.innerHTML = `
        <div class="page-header"><div><h1>Dashboard</h1><p>Overview of your GRC posture</p></div></div>
        <div class="stats-grid">
          ${Components.canDo('ASSET', 'read') ? this.statCard('Assets', stats.counts.totalAssets, 'purple', '<path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>') : ''}
          ${Components.canDo('RISK', 'read') ? this.statCard('Risks', stats.counts.totalRisks, 'danger', '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>') : ''}
          ${Components.canDo('CONTROL', 'read') ? this.statCard('Controls', stats.counts.totalControls, 'info', '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>') : ''}
          ${Components.canDo('COMPLIANCE', 'read') ? this.statCard('Compliance', stats.counts.totalCompliance, 'success', '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') : ''}
          ${App.currentUser?.role === 'ADMIN' ? this.statCard('Users', stats.counts.totalUsers, 'warning', '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>') : ''}
        </div>
        <div class="dashboard-grid">
          ${Components.canDo('RISK', 'read') ? `<div class="dash-card">
            <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg> Risks by Severity</h3>
            ${this.chartBars(stats.risksBySeverity, stats.counts.totalRisks, ['CRITICAL','HIGH','MEDIUM','LOW'])}
          </div>` : ''}
          ${Components.canDo('CONTROL', 'read') ? `<div class="dash-card">
            <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Controls by Status</h3>
            ${this.chartBars(stats.controlsByStatus, stats.counts.totalControls, ['IMPLEMENTED','PLANNED','NOT_IMPLEMENTED'])}
          </div>` : ''}
          ${Components.canDo('COMPLIANCE', 'read') ? `<div class="dash-card">
            <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg> Compliance Status</h3>
            ${this.chartBars(stats.complianceByStatus, stats.counts.totalCompliance, ['COMPLIANT','PARTIAL','NON_COMPLIANT','NOT_ASSESSED'])}
          </div>` : ''}
          ${Components.canDo('RISK', 'read') ? `<div class="dash-card">
            <h3><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Recent Risks</h3>
            <div class="recent-list">
              ${stats.recentRisks.map(r => `<div class="recent-item" onclick="location.hash='#/risks'">
                <span class="recent-item-name">${Utils.escapeHtml(r.name)}</span>
                <span>${Utils.badge(r.severity)}</span>
              </div>`).join('') || '<p class="no-related">No risks yet</p>'}
            </div>
          </div>` : ''}
        </div>`;
    } catch (e) { el.innerHTML = `<p>Error loading dashboard: ${e.message}</p>`; }
  },

  statCard(label, value, color, iconPath) {
    return `<div class="stat-card ${color}">
      <div class="stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg></div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`;
  },

  chartBars(data, total, keys) {
    if (!total) return '<p class="no-related">No data yet</p>';
    return `<div class="chart-bars">${keys.map(k => {
      const count = data[k] || 0;
      const pct = Math.round((count / total) * 100);
      const label = k.replace(/_/g, ' ');
      return `<div class="chart-bar-row">
        <span class="chart-bar-label">${label}</span>
        <div class="chart-bar-track"><div class="chart-bar-fill ${k.toLowerCase()}" style="width:${Math.max(pct, 8)}%">${count}</div></div>
      </div>`;
    }).join('')}</div>`;
  }
};
