/* ═══ Shared Components ═══ */
const Components = {
  searchBar(placeholder, onSearch, initialValue = '') {
    const val = Utils.escapeHtml(initialValue || '');
    return `<div class="search-box" style="display:flex;align-items:center;position:relative;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:12px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" placeholder="${placeholder}" id="search-input" value="${val}" style="padding-right:32px;" onkeydown="if(event.key === 'Enter') ${onSearch}(this.value)">
      ${val ? `<button class="clear-search-btn" onclick="${onSearch}('')" title="Clear search" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px;color:var(--text-muted);display:flex;align-items:center;border-radius:4px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:static;transform:none;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>` : ''}
    </div>`;
  },

  addButton(label, onClick) {
    return `<button class="btn btn-primary" onclick="${onClick}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      ${label}
    </button>`;
  },

  spinner() { return '<div class="spinner"></div>'; },

  emptyState(msg) {
    return `<div class="table-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>${msg}</p>
    </div>`;
  },

  multiSelect(id, items, selectedIds = [], labelKey = 'name') {
    const opts = items.map(i => {
      const sel = selectedIds.includes(i.id) ? 'selected' : '';
      return `<div class="multi-option ${sel}" data-id="${i.id}" onclick="Components.toggleOption(this)">${Utils.escapeHtml(i[labelKey] || i.requirement || '')}</div>`;
    }).join('');
    return `<div class="multi-select" id="${id}">${opts || '<span style="color:var(--text-muted);font-size:.8rem;padding:4px;">No items available</span>'}</div>`;
  },

  toggleOption(el) {
    el.classList.toggle('selected');
  },

  getSelectedIds(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .multi-option.selected`))
      .map(el => parseInt(el.dataset.id));
  },

  openModal(title, bodyHtml, footerHtml = '') {
    document.getElementById('modal-title').innerHTML = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml;
    document.getElementById('modal-overlay').classList.add('open');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  },

  canDo(entity, action) {
    const user = App.currentUser;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const perm = user.permissions?.find(p => p.entity === entity);
    if (!perm) return false;
    const map = { create: 'canCreate', read: 'canRead', update: 'canUpdate', delete: 'canDelete' };
    return perm[map[action]] || false;
  }
};

// Modal close handlers
document.getElementById('modal-close').onclick = Components.closeModal;
document.getElementById('modal-overlay').onclick = (e) => {
  if (e.target === e.currentTarget) Components.closeModal();
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') Components.closeModal();
});
