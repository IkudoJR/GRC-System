/* ═══ Controls Page ═══ */
const ControlsPage = {
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
    const canCreate = Components.canDo('CONTROL', 'create');
    el.innerHTML = `<div class="page-header"><div><h1>Security Controls</h1><p>Controls mitigating identified risks</p></div>
      <div class="page-actions">${Components.searchBar('Search controls...', 'ControlsPage.render', search)}
      ${canCreate ? Components.addButton('Add Control', 'ControlsPage.showForm()') : ''}</div></div>
      <div id="controls-table">${Components.spinner()}</div>`;
    try {
      let items = await API.controls.list(search);
      const sk = ControlsPage.sortKey || 'name';
      const asc = ControlsPage.sortAsc !== false;
      items.sort((a, b) => {
        let va = a[sk], vb = b[sk];
        if (sk === 'risks') { va = a.risks?.length || 0; vb = b.risks?.length || 0; }
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });
      const rows = items.map(c => `<tr onclick="ControlsPage.showDetail(${c.id})">
        <td>${Utils.escapeHtml(c.name)}${c.isHidden ? '<span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;">HIDDEN</span>' : ''}</td>
        <td class="table-hide-mobile">${Utils.truncate(c.description)}</td>
        <td>${Utils.badge(c.riskFactor)}</td><td>${Utils.badge(c.status)}</td>
        <td class="table-hide-mobile">${c.risks?.length || 0}</td></tr>`).join('');
      const getTh = (key, label, cls='') => `<th ${cls ? `class="${cls}"` : ''} onclick="ControlsPage.toggleSort('${key}')" style="cursor:pointer;user-select:none;">${label}</th>`;
      document.getElementById('controls-table').innerHTML = items.length
        ? `<div class="table-container"><table class="data-table"><thead><tr>${getTh('name', 'Name')}<th class="table-hide-mobile">Description</th>${getTh('riskFactor', 'Risk Factor')}${getTh('status', 'Status')}${getTh('risks', 'Risks', 'table-hide-mobile')}</tr></thead><tbody>${rows}</tbody></table></div>`
        : Components.emptyState('No controls found');
    } catch (e) { document.getElementById('controls-table').innerHTML = `<p>${e.message}</p>`; }
  },

  async showDetail(id) {
    try {
      const c = await API.controls.get(id);
      const risks = c.risks?.map(r => r.risk) || [];
      const comps = c.compliances?.map(x => x.compliance) || [];
      const assets = [...new Map(risks.flatMap(r => (r.assets||[]).map(a => a.asset)).map(a => [a.id, a])).values()];
      const canEdit = Components.canDo('CONTROL', 'update');
      const canDelete = Components.canDo('CONTROL', 'delete');
      Components.openModal(`Control: ${Utils.escapeHtml(c.name)}${c.isHidden ? ' <span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;vertical-align:middle;">HIDDEN</span>' : ''}`, `
        <div class="detail-grid">
          <div class="detail-item"><label>Risk Factor</label>${Utils.badge(c.riskFactor)}</div>
          <div class="detail-item"><label>Status</label>${Utils.badge(c.status)}</div>
          <div class="detail-item"><label>Created</label><span>${Utils.formatDate(c.createdAt)}</span></div>
          <div class="detail-item detail-full"><label>Description</label><p>${Utils.escapeHtml(c.description) || '—'}</p></div>
        </div>
        <div class="related-section"><h4>⚠️ Mitigated Risks (${risks.length})</h4>
          <div class="related-tags">${risks.map(r => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>RisksPage.showDetail(${r.id}),200)">${Utils.escapeHtml(r.name)} ${Utils.badge(r.severity)}</div>`).join('') || '<span class="no-related">No linked risks</span>'}</div></div>
        <div class="related-section"><h4>📦 Affected Assets (${assets.length})</h4>
          <div class="related-tags">${assets.map(a => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>AssetsPage.showDetail(${a.id}),200)">${Utils.escapeHtml(a.name)}</div>`).join('') || '<span class="no-related">No assets</span>'}</div></div>
        <div class="related-section"><h4>📋 Compliance Requirements (${comps.length})</h4>
          <div class="related-tags">${comps.map(x => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>CompliancePage.showDetail(${x.id}),200)">${Utils.escapeHtml(x.requirement)} ${Utils.badge(x.status)}</div>`).join('') || '<span class="no-related">No compliance links</span>'}</div></div>`,
        `${canEdit ? `<button class="btn btn-ghost" onclick="Components.closeModal();ControlsPage.showForm(${c.id})">Edit</button>` : ''}
         ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="ControlsPage.remove(${c.id})">Delete</button>` : ''}`);
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  async showForm(id) {
    let ctrl = { name:'', description:'', riskFactor:'MEDIUM', status:'PLANNED' };
    let riskIds = [], compIds = [];
    if (id) {
      ctrl = await API.controls.get(id);
      riskIds = ctrl.risks?.map(r => r.risk?.id) || [];
      compIds = ctrl.compliances?.map(c => c.compliance?.id) || [];
    }
    let allRisks = [], allComps = [];
    try { allRisks = await API.risks.list(); } catch (e) { console.warn('No risk read access'); }
    try { allComps = await API.compliance.list(); } catch (e) { console.warn('No compliance read access'); }
    Components.openModal(id ? 'Edit Control' : 'New Control', `
      <div class="form-group"><label>Name</label><input id="f-name" value="${Utils.escapeHtml(ctrl.name)}"></div>
      <div class="form-group"><label>Description</label><textarea id="f-desc">${Utils.escapeHtml(ctrl.description || '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Risk Factor</label><select id="f-rf">${['LOW','MEDIUM','HIGH'].map(o => `<option ${ctrl.riskFactor===o?'selected':''}>${o}</option>`).join('')}</select></div>
        <div class="form-group"><label>Status</label><select id="f-status">${['IMPLEMENTED','PLANNED','NOT_IMPLEMENTED'].map(o => `<option ${ctrl.status===o?'selected':''}>${o}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label>Linked Risks</label>${Components.multiSelect('f-risks', allRisks, riskIds)}</div>
      <div class="form-group"><label>Linked Compliance</label>${Components.multiSelect('f-comps', allComps, compIds, 'requirement')}</div>`,
      `${App.currentUser?.role === 'ADMIN' ? `<div id="f-hidden" class="multi-option ${ctrl.isHidden ? 'selected' : ''}" style="display:inline-flex;align-items:center;padding:6px 16px;font-size:0.85rem;margin-right:auto;" onclick="Components.toggleOption(this)">Hidden</div>` : ''}
       <button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="ControlsPage.save(${id || 'null'})">Save</button>`);
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
      riskFactor: document.getElementById('f-rf').value,
      status: document.getElementById('f-status').value,
      riskIds: Components.getSelectedIds('f-risks'),
      complianceIds: Components.getSelectedIds('f-comps')
    };
    if (App.currentUser?.role === 'ADMIN') data.isHidden = document.getElementById('f-hidden')?.classList.contains('selected') || false;
    
    if (id) {
      window._pendingData = data;
      Components.openModal('Confirm Update', 
        '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to save these changes? The previous state will be archived.</p>',
        `<button class="btn btn-ghost" onclick="ControlsPage.showForm(${id})">Cancel</button>
         <button class="btn btn-primary" onclick="ControlsPage.executeSave(${id})">Confirm Save</button>`
      );
    } else {
      window._pendingData = data;
      this.executeSave(null);
    }
  },

  async executeSave(id) {
    const data = window._pendingData;
    try {
      if (id) { await API.controls.update(id, data); } else { await API.controls.create(data); }
      Components.closeModal(); Utils.toast(id ? 'Control updated' : 'Control created'); ControlsPage.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  remove(id) {
    Components.openModal('Confirm Deletion', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you absolutely sure you want to delete this control? This action cannot be undone.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="ControlsPage.executeRemove(${id})">Delete</button>`
    );
  },

  async executeRemove(id) {
    try { await API.controls.delete(id); Components.closeModal(); Utils.toast('Control deleted'); ControlsPage.render(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  }
};
