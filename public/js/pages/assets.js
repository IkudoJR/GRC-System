/* ═══ Assets Page ═══ */
const AssetsPage = {
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
    const canCreate = Components.canDo('ASSET', 'create');
    el.innerHTML = `<div class="page-header"><div><h1>Assets</h1><p>Manage organizational assets</p></div>
      <div class="page-actions">${Components.searchBar('Search assets...', 'AssetsPage.render', search)}
      ${canCreate ? Components.addButton('Add Asset', 'AssetsPage.showForm()') : ''}</div></div>
      <div id="assets-table">${Components.spinner()}</div>`;
    try {
      let assets = await API.assets.list(search);
      const sk = AssetsPage.sortKey || 'name';
      const asc = AssetsPage.sortAsc !== false;
      assets.sort((a, b) => {
        let va = a[sk], vb = b[sk];
        if (sk === 'risks') { va = a.risks?.length || 0; vb = b.risks?.length || 0; }
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });
      const rows = assets.map(a => `<tr onclick="AssetsPage.showDetail(${a.id})">
        <td>${Utils.escapeHtml(a.name)}${a.isHidden ? '<span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;">HIDDEN</span>' : ''}</td>
        <td class="table-hide-mobile">${Utils.truncate(a.description)}</td>
        <td>${Utils.badge(a.classification)}</td><td>${Utils.badge(a.status)}</td>
        <td class="table-hide-mobile">${a.risks?.length || 0}</td></tr>`).join('');
      const getTh = (key, label, cls='') => `<th ${cls ? `class="${cls}"` : ''} onclick="AssetsPage.toggleSort('${key}')" style="cursor:pointer;user-select:none;">${label}</th>`;
      document.getElementById('assets-table').innerHTML = assets.length
        ? `<div class="table-container"><table class="data-table"><thead><tr>${getTh('name', 'Name')}<th class="table-hide-mobile">Description</th>${getTh('classification', 'Classification')}${getTh('status', 'Status')}${getTh('risks', 'Risks', 'table-hide-mobile')}</tr></thead><tbody>${rows}</tbody></table></div>`
        : Components.emptyState('No assets found');
    } catch (e) { document.getElementById('assets-table').innerHTML = `<p>${e.message}</p>`; }
  },

  async showDetail(id) {
    try {
      const a = await API.assets.get(id);
      const risks = a.risks?.map(r => r.risk) || [];
      const controls = [...new Map(risks.flatMap(r => (r.controls || []).map(c => c.control)).map(c => [c.id, c])).values()];
      const canEdit = Components.canDo('ASSET', 'update');
      const canDelete = Components.canDo('ASSET', 'delete');
      Components.openModal(`Asset: ${Utils.escapeHtml(a.name)}${a.isHidden ? ' <span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;vertical-align:middle;">HIDDEN</span>' : ''}`, `
        <div class="detail-grid">
          <div class="detail-item"><label>Classification</label>${Utils.badge(a.classification)}</div>
          <div class="detail-item"><label>Status</label>${Utils.badge(a.status)}</div>
          <div class="detail-item"><label>Created</label><span>${Utils.formatDate(a.createdAt)}</span></div>
          <div class="detail-item detail-full"><label>Description</label><p>${Utils.escapeHtml(a.description) || '—'}</p></div>
        </div>
        <div class="related-section"><h4>🔗 Linked Risks (${risks.length})</h4>
          <div class="related-tags">${risks.map(r => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>RisksPage.showDetail(${r.id}),200)">${Utils.escapeHtml(r.name)} ${Utils.badge(r.severity)}</div>`).join('') || '<span class="no-related">No linked risks</span>'}</div></div>
        <div class="related-section"><h4>🛡️ Mitigating Controls (${controls.length})</h4>
          <div class="related-tags">${controls.map(c => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>ControlsPage.showDetail(${c.id}),200)">${Utils.escapeHtml(c.name)} ${Utils.badge(c.status)}</div>`).join('') || '<span class="no-related">No controls</span>'}</div></div>`,
        `${canEdit ? `<button class="btn btn-ghost" onclick="Components.closeModal();AssetsPage.showForm(${a.id})">Edit</button>` : ''}
         ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="AssetsPage.remove(${a.id})">Delete</button>` : ''}`);
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  async showForm(id) {
    let asset = { name:'', description:'', classification:'INTERNAL', status:'ACTIVE' };
    let riskIds = [];
    if (id) {
      asset = await API.assets.get(id);
      riskIds = asset.risks?.map(r => r.riskId || r.risk?.id) || [];
    }
    let allRisks = [];
    try { allRisks = await API.risks.list(); } catch (e) { console.warn('No risk read access'); }
    Components.openModal(id ? 'Edit Asset' : 'New Asset', `
      <div class="form-group"><label>Name</label><input id="f-name" value="${Utils.escapeHtml(asset.name)}"></div>
      <div class="form-group"><label>Description</label><textarea id="f-desc">${Utils.escapeHtml(asset.description || '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Classification</label><select id="f-class">
          ${['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'].map(o => `<option ${asset.classification===o?'selected':''}>${o}</option>`).join('')}</select></div>
        <div class="form-group"><label>Status</label><select id="f-status">
          ${['ACTIVE','INACTIVE','DECOMMISSIONED'].map(o => `<option ${asset.status===o?'selected':''}>${o}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>Linked Risks</label>${Components.multiSelect('f-risks', allRisks, riskIds)}</div>`,
      `${App.currentUser?.role === 'ADMIN' ? `<div id="f-hidden" class="multi-option ${asset.isHidden ? 'selected' : ''}" style="display:inline-flex;align-items:center;padding:6px 16px;font-size:0.85rem;margin-right:auto;" onclick="Components.toggleOption(this)">Hidden</div>` : ''}
       <button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="AssetsPage.save(${id || 'null'})">Save</button>`);
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
      classification: document.getElementById('f-class').value,
      status: document.getElementById('f-status').value,
      riskIds: Components.getSelectedIds('f-risks')
    };
    if (App.currentUser?.role === 'ADMIN') data.isHidden = document.getElementById('f-hidden')?.classList.contains('selected') || false;
    
    if (id) {
      window._pendingData = data;
      Components.openModal('Confirm Update', 
        '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to save these changes? The previous state will be archived.</p>',
        `<button class="btn btn-ghost" onclick="AssetsPage.showForm(${id})">Cancel</button>
         <button class="btn btn-primary" onclick="AssetsPage.executeSave(${id})">Confirm Save</button>`
      );
    } else {
      window._pendingData = data;
      this.executeSave(null);
    }
  },

  async executeSave(id) {
    const data = window._pendingData;
    try {
      if (id) { await API.assets.update(id, data); } else { await API.assets.create(data); }
      Components.closeModal();
      Utils.toast(id ? 'Asset updated' : 'Asset created');
      AssetsPage.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  remove(id) {
    Components.openModal('Confirm Deletion', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you absolutely sure you want to delete this asset? This action cannot be undone.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="AssetsPage.executeRemove(${id})">Delete</button>`
    );
  },

  async executeRemove(id) {
    try { await API.assets.delete(id); Components.closeModal(); Utils.toast('Asset deleted'); AssetsPage.render(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  }
};
