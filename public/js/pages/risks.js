/* ═══ Risks Page ═══ */
const RisksPage = {
  sortKey: 'name',
  sortAsc: true,
  toggleSort(key) {
    if (this.sortKey === key) this.sortAsc = !this.sortAsc;
    else { this.sortKey = key; this.sortAsc = true; }
    const s = document.getElementById('search-input')?.value || '';
    this.render(s);
  },
  async render(search) {
    const el = document.getElementById('main-content');
    const canCreate = Components.canDo('RISK', 'create');
    el.innerHTML = `<div class="page-header"><div><h1>Risks</h1><p>Risk register and assessment</p></div>
      <div class="page-actions">${Components.searchBar('Search risks...', 'RisksPage.render', search)}
      ${canCreate ? Components.addButton('Add Risk', 'RisksPage.showForm()') : ''}</div></div>
      <div id="risks-table">${Components.spinner()}</div>`;
    try {
      let risks = await API.risks.list(search);
      const sk = RisksPage.sortKey || 'name';
      const asc = RisksPage.sortAsc !== false;
      risks.sort((a, b) => {
        let va = a[sk], vb = b[sk];
        if (sk === 'controls') { va = a.controls?.length || 0; vb = b.controls?.length || 0; }
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });
      const rows = risks.map(r => `<tr onclick="RisksPage.showDetail(${r.id})">
        <td>${Utils.escapeHtml(r.name)}${r.isHidden ? '<span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;">HIDDEN</span>' : ''}</td>
        <td class="table-hide-mobile">${Utils.truncate(r.description)}</td>
        <td>${Utils.badge(r.severity)}</td><td>${Utils.badge(r.status)}</td>
        <td class="table-hide-mobile">${r.controls?.length || 0}</td></tr>`).join('');
      const getTh = (key, label, cls='') => `<th ${cls ? `class="${cls}"` : ''} onclick="RisksPage.toggleSort('${key}')" style="cursor:pointer;user-select:none;">${label}</th>`;
      document.getElementById('risks-table').innerHTML = risks.length
        ? `<div class="table-container"><table class="data-table"><thead><tr>${getTh('name', 'Name')}<th class="table-hide-mobile">Description</th>${getTh('severity', 'Severity')}${getTh('status', 'Status')}${getTh('controls', 'Controls', 'table-hide-mobile')}</tr></thead><tbody>${rows}</tbody></table></div>`
        : Components.emptyState('No risks found');
    } catch (e) { document.getElementById('risks-table').innerHTML = `<p>${e.message}</p>`; }
  },

  async showDetail(id) {
    try {
      const r = await API.risks.get(id);
      const assets = r.assets?.map(a => a.asset) || [];
      const controls = r.controls?.map(c => c.control) || [];
      const canEdit = Components.canDo('RISK', 'update');
      const canDelete = Components.canDo('RISK', 'delete');
      Components.openModal(`Risk: ${Utils.escapeHtml(r.name)}${r.isHidden ? ' <span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;vertical-align:middle;">HIDDEN</span>' : ''}`, `
        <div class="detail-grid">
          <div class="detail-item"><label>Severity</label>${Utils.badge(r.severity)}</div>
          <div class="detail-item"><label>Status</label>${Utils.badge(r.status)}</div>
          <div class="detail-item"><label>Created</label><span>${Utils.formatDate(r.createdAt)}</span></div>
          <div class="detail-item detail-full"><label>Description</label><p>${Utils.escapeHtml(r.description) || '—'}</p></div>
        </div>
        <div class="related-section"><h4>📦 Affected Assets (${assets.length})</h4>
          <div class="related-tags">${assets.map(a => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>AssetsPage.showDetail(${a.id}),200)">${Utils.escapeHtml(a.name)} ${Utils.badge(a.classification)}</div>`).join('') || '<span class="no-related">No linked assets</span>'}</div></div>
        <div class="related-section"><h4>🛡️ Mitigating Controls (${controls.length})</h4>
          <div class="related-tags">${controls.map(c => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>ControlsPage.showDetail(${c.id}),200)">${Utils.escapeHtml(c.name)} ${Utils.badge(c.status)}</div>`).join('') || '<span class="no-related">No controls</span>'}</div></div>`,
        `${canEdit ? `<button class="btn btn-ghost" onclick="Components.closeModal();RisksPage.showForm(${r.id})">Edit</button>` : ''}
         ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="RisksPage.remove(${r.id})">Delete</button>` : ''}`);
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  async showForm(id) {
    let risk = { name:'', description:'', severity:'MEDIUM', status:'OPEN' };
    let assetIds = [], controlIds = [];
    if (id) {
      risk = await API.risks.get(id);
      assetIds = risk.assets?.map(a => a.asset?.id) || [];
      controlIds = risk.controls?.map(c => c.control?.id) || [];
    }
    let allAssets = [], allControls = [];
    try { allAssets = await API.assets.list(); } catch (e) { console.warn('No asset read access'); }
    try { allControls = await API.controls.list(); } catch (e) { console.warn('No control read access'); }
    Components.openModal(id ? 'Edit Risk' : 'New Risk', `
      <div class="form-group"><label>Name</label><input id="f-name" value="${Utils.escapeHtml(risk.name)}"></div>
      <div class="form-group"><label>Description</label><textarea id="f-desc">${Utils.escapeHtml(risk.description || '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Severity</label><select id="f-sev">${['LOW','MEDIUM','HIGH','CRITICAL'].map(o => `<option ${risk.severity===o?'selected':''}>${o}</option>`).join('')}</select></div>
        <div class="form-group"><label>Status</label><select id="f-status">${['OPEN','MITIGATED','CLOSED','ACCEPTED'].map(o => `<option ${risk.status===o?'selected':''}>${o}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>Linked Assets</label>${Components.multiSelect('f-assets', allAssets, assetIds)}</div>
      <div class="form-group"><label>Linked Controls</label>${Components.multiSelect('f-controls', allControls, controlIds)}</div>`,
      `${App.currentUser?.role === 'ADMIN' ? `<div id="f-hidden" class="multi-option ${risk.isHidden ? 'selected' : ''}" style="display:inline-flex;align-items:center;padding:6px 16px;font-size:0.85rem;margin-right:auto;" onclick="Components.toggleOption(this)">Hidden</div>` : ''}
       <button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="RisksPage.save(${id || 'null'})">Save</button>`);
  },

  async save(id) {
    const nameVal = document.getElementById('f-name').value.trim();
    const descVal = document.getElementById('f-desc').value.trim();
    if (!nameVal || !descVal) {
      return Utils.toast('Name and description are required.', 'error');
    }
    const data = {
      name: nameVal,
      description: descVal,
      severity: document.getElementById('f-sev').value,
      status: document.getElementById('f-status').value,
      assetIds: Components.getSelectedIds('f-assets'),
      controlIds: Components.getSelectedIds('f-controls')
    };
    if (App.currentUser?.role === 'ADMIN') data.isHidden = document.getElementById('f-hidden')?.classList.contains('selected') || false;
    
    if (id) {
      window._pendingData = data;
      Components.openModal('Confirm Update', 
        '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to save these changes? The previous state will be archived.</p>',
        `<button class="btn btn-ghost" onclick="RisksPage.showForm(${id})">Cancel</button>
         <button class="btn btn-primary" onclick="RisksPage.executeSave(${id})">Confirm Save</button>`
      );
    } else {
      window._pendingData = data;
      this.executeSave(null);
    }
  },

  async executeSave(id) {
    const data = window._pendingData;
    try {
      if (id) { await API.risks.update(id, data); } else { await API.risks.create(data); }
      Components.closeModal(); Utils.toast(id ? 'Risk updated' : 'Risk created'); RisksPage.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  remove(id) {
    Components.openModal('Confirm Deletion', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you absolutely sure you want to delete this risk? This action cannot be undone.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="RisksPage.executeRemove(${id})">Delete</button>`
    );
  },

  async executeRemove(id) {
    try { await API.risks.delete(id); Components.closeModal(); Utils.toast('Risk deleted'); RisksPage.render(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  }
};
