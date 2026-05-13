/* ═══ Utility Functions ═══ */
const Utils = {
  $(sel) { return document.querySelector(sel); },
  $$(sel) { return document.querySelectorAll(sel); },

  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  },

  badge(val) {
    if (!val) return '';
    const cls = val.toLowerCase().replace(/\s+/g, '_');
    const label = val.replace(/_/g, ' ');
    return `<span class="badge badge-${cls}">${label}</span>`;
  },

  toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    const icons = { success:'✓', error:'✕', info:'ℹ' };
    t.innerHTML = `<span>${icons[type] || ''}</span> ${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  truncate(str, len = 60) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '…' : str;
  }
};
