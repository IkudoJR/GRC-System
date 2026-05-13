/* ═══ Compliance Page ═══ */
const CompliancePage = {
  sortKey: 'requirement',
  sortAsc: true,
  toggleSort(key) {
    if (this.sortKey === key) this.sortAsc = !this.sortAsc;
    else { this.sortKey = key; this.sortAsc = true; }
    const s = document.getElementById('search-input')?.value || '';
    this.render(s);
  },
  async render(search) {
    const el = document.getElementById('main-content');
    const canCreate = Components.canDo('COMPLIANCE', 'create');
    el.innerHTML = `<div class="page-header"><div><h1>Compliance</h1><p>Regulatory and framework requirements</p></div>
      <div class="page-actions">${Components.searchBar('Search compliance...', 'CompliancePage.render', search)}
      ${canCreate ? Components.addButton('Add Requirement', 'CompliancePage.showForm()') : ''}</div></div>
      <div id="comp-table">${Components.spinner()}</div>`;
    try {
      let items = await API.compliance.list(search);
      const sk = CompliancePage.sortKey || 'requirement';
      const asc = CompliancePage.sortAsc !== false;
      items.sort((a, b) => {
        let va = a[sk], vb = b[sk];
        if (sk === 'controls') { va = a.controls?.length || 0; vb = b.controls?.length || 0; }
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
      });
      const rows = items.map(c => `<tr onclick="CompliancePage.showDetail(${c.id})">
        <td>${Utils.escapeHtml(c.requirement)}${c.isHidden ? '<span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;">HIDDEN</span>' : ''}</td>
        <td class="table-hide-mobile">${Utils.truncate(c.description)}</td>
        <td>${Utils.badge(c.status)}</td>
        <td class="table-hide-mobile">${c.controls?.length || 0}</td></tr>`).join('');
      const getTh = (key, label, cls='') => `<th ${cls ? `class="${cls}"` : ''} onclick="CompliancePage.toggleSort('${key}')" style="cursor:pointer;user-select:none;">${label}</th>`;
      document.getElementById('comp-table').innerHTML = items.length
        ? `<div class="table-container"><table class="data-table"><thead><tr>${getTh('requirement', 'Requirement')}<th class="table-hide-mobile">Description</th>${getTh('status', 'Status')}${getTh('controls', 'Controls', 'table-hide-mobile')}</tr></thead><tbody>${rows}</tbody></table></div>`
        : Components.emptyState('No compliance requirements found');
    } catch (e) { document.getElementById('comp-table').innerHTML = `<p>${e.message}</p>`; }
  },

  async showDetail(id) {
    try {
      const c = await API.compliance.get(id);
      const controls = c.controls?.map(x => x.control) || [];
      const risks = [...new Map(controls.flatMap(ct => (ct.risks||[]).map(r => r.risk)).map(r => [r.id, r])).values()];
      const assets = [...new Map(risks.flatMap(r => (r.assets||[]).map(a => a.asset)).map(a => [a.id, a])).values()];
      const canEdit = Components.canDo('COMPLIANCE', 'update');
      const canDelete = Components.canDo('COMPLIANCE', 'delete');
      Components.openModal(`Compliance: ${Utils.escapeHtml(c.requirement)}${c.isHidden ? ' <span class="badge" style="background:#4b5563;font-size:0.7rem;padding:2px 4px;margin-left:4px;vertical-align:middle;">HIDDEN</span>' : ''}`, `
        <div class="detail-grid">
          <div class="detail-item"><label>Status</label>${Utils.badge(c.status)}</div>
          <div class="detail-item detail-full"><label>Requirement</label><p>${Utils.escapeHtml(c.requirement)}</p></div>
          <div class="detail-item detail-full"><label>Description</label><p>${Utils.escapeHtml(c.description) || '—'}</p></div>
        </div>
        <div class="related-section"><h4>🛡️ Implementing Controls (${controls.length})</h4>
          <div class="related-tags">${controls.map(ct => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>ControlsPage.showDetail(${ct.id}),200)">${Utils.escapeHtml(ct.name)} ${Utils.badge(ct.status)}</div>`).join('') || '<span class="no-related">No controls</span>'}</div></div>
        <div class="related-section"><h4>⚠️ Related Risks (${risks.length})</h4>
          <div class="related-tags">${risks.map(r => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>RisksPage.showDetail(${r.id}),200)">${Utils.escapeHtml(r.name)} ${Utils.badge(r.severity)}</div>`).join('') || '<span class="no-related">No risks</span>'}</div></div>
        <div class="related-section"><h4>📦 Impacted Assets (${assets.length})</h4>
          <div class="related-tags">${assets.map(a => `<div class="related-tag" onclick="Components.closeModal();setTimeout(()=>AssetsPage.showDetail(${a.id}),200)">${Utils.escapeHtml(a.name)}</div>`).join('') || '<span class="no-related">No assets</span>'}</div></div>`,
        `${canEdit ? `<button class="btn btn-ghost" onclick="Components.closeModal();CompliancePage.showForm(${c.id})">Edit</button>` : ''}
         ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="CompliancePage.remove(${c.id})">Delete</button>` : ''}`);
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  async showForm(id) {
    const c = id ? await API.compliance.get(id) : { requirement:'', description:'', status:'NOT_ASSESSED' };
    const controlIds = c.controls?.map(x => x.control?.id || x.controlId) || [];
    let allControls = [];
    try { allControls = await API.controls.list(); } catch (e) { console.warn('No control read access'); }
    Components.openModal(id ? 'Edit Compliance' : 'New Compliance', `
      <div class="form-group"><label>Requirement</label><input id="f-req" value="${Utils.escapeHtml(c.requirement)}"></div>
      <div class="form-group"><label>Description</label><textarea id="f-desc">${Utils.escapeHtml(c.description || '')}</textarea></div>
      <div class="form-group"><label>Status</label><select id="f-status">${['COMPLIANT','NON_COMPLIANT','PARTIAL','NOT_ASSESSED'].map(o => `<option ${c.status===o?'selected':''}>${o}</option>`).join('')}</select></div>
      <div class="form-group"><label>Linked Controls</label>${Components.multiSelect('f-ctrls', allControls, controlIds)}</div>`,
      `${App.currentUser?.role === 'ADMIN' ? `<div id="f-hidden" class="multi-option ${c.isHidden ? 'selected' : ''}" style="display:inline-flex;align-items:center;padding:6px 16px;font-size:0.85rem;margin-right:auto;" onclick="Components.toggleOption(this)">Hidden</div>` : ''}
       <button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="CompliancePage.save(${id || 'null'})">Save</button>`);
  },

  async save(id) {
    const reqVal = document.getElementById('f-req').value.trim();
    const descVal = document.getElementById('f-desc').value.trim();
    if (!reqVal || !descVal) {
      return Utils.toast('Requirement and description are required.', 'error');
    }
    const data = {
      requirement: reqVal,
      description: descVal,
      status: document.getElementById('f-status').value,
      controlIds: Components.getSelectedIds('f-ctrls')
    };
    if (App.currentUser?.role === 'ADMIN') data.isHidden = document.getElementById('f-hidden')?.classList.contains('selected') || false;
    
    if (id) {
      window._pendingData = data;
      Components.openModal('Confirm Update', 
        '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to save these changes? The previous state will be archived.</p>',
        `<button class="btn btn-ghost" onclick="CompliancePage.showForm(${id})">Cancel</button>
         <button class="btn btn-primary" onclick="CompliancePage.executeSave(${id})">Confirm Save</button>`
      );
    } else {
      window._pendingData = data;
      this.executeSave(id);
    }
  },

  async executeSave(id) {
    const data = window._pendingData;
    try {
      if (id) { await API.compliance.update(id, data); } else { await API.compliance.create(data); }
      Components.closeModal(); Utils.toast(id ? 'Compliance updated' : 'Compliance created'); CompliancePage.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  remove(id) {
    Components.openModal('Confirm Deletion', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you absolutely sure you want to delete this compliance requirement? This action cannot be undone.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="CompliancePage.executeRemove(${id})">Delete</button>`
    );
  },

  async executeRemove(id) {
    try { await API.compliance.delete(id); Components.closeModal(); Utils.toast('Compliance deleted'); CompliancePage.render(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  }
};
