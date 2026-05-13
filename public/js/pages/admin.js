/* ═══ Admin / User Management Page ═══ */
const AdminPage = {
  activeTab: 'users',

  async render() {
    const el = document.getElementById('main-content');
    const isAdmin = App.currentUser?.role === 'ADMIN';

    // Fetch pending password request count for badge
    let pendingCount = 0;
    if (isAdmin) {
      try { const reqs = await API.passwordChange.listPending(); pendingCount = reqs.length; } catch {}
    }
    const pwBadge = pendingCount > 0 ? ` <span style="background:#ef4444;color:#fff;border-radius:10px;padding:1px 7px;font-size:0.72rem;margin-left:6px;">${pendingCount}</span>` : '';

    const tabStyle = (name) => `background:none; border:none; padding:10px 0; color:${this.activeTab === name ? 'var(--primary)' : 'var(--text-secondary)'}; cursor:pointer; font-weight:600; border-bottom:2px solid ${this.activeTab === name ? 'var(--primary)' : 'transparent'};`;

    const headerHtml = `<div class="page-header"><div><h1>Admin Panel</h1><p>${isAdmin ? 'Manage users, archives and password requests' : 'View user directory'}</p></div>
      <div class="page-actions">
        ${(isAdmin && this.activeTab === 'users') ? Components.addButton('Add User', 'AdminPage.showForm()') : ''}
      </div></div>
      ${isAdmin ? `
      <div class="tabs" style="display:flex; gap:20px; border-bottom:1px solid var(--border); margin-bottom:20px;">
        <button onclick="AdminPage.switchTab('users')" style="${tabStyle('users')}">Users</button>
        <button onclick="AdminPage.switchTab('archives')" style="${tabStyle('archives')}">Archives</button>
        <button onclick="AdminPage.switchTab('password-requests')" style="${tabStyle('password-requests')}">Password Requests${pwBadge}</button>
      </div>` : ''}
      <div id="admin-content">${Components.spinner()}</div>`;

    el.innerHTML = headerHtml;

    if (this.activeTab === 'users') await this.renderUsers();
    else if (this.activeTab === 'archives') await this.renderArchives();
    else await this.renderPasswordRequests();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  async renderUsers() {
    try {
      const users = await API.users.list();
      const rows = users.map(u => `<tr onclick="AdminPage.showDetail(${u.id})">
        <td>${Utils.escapeHtml(u.username)}</td>
        <td>${Utils.badge(u.role)}</td>
        <td class="table-hide-mobile">${Utils.formatDate(u.createdAt)}</td></tr>`).join('');
      document.getElementById('admin-content').innerHTML = `<div class="table-container"><table class="data-table">
        <thead><tr><th>Username</th><th>Role</th><th class="table-hide-mobile">Created</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
    } catch (e) { document.getElementById('admin-content').innerHTML = `<p>${e.message}</p>`; }
  },

  async renderArchives() {
    try {
      const archives = await API.archives.list();
      const pending  = (archives || []).filter(a => !a.reviewStatus);
      const reviewed = (archives || []).filter(a =>  a.reviewStatus);

      const buildRow = (a, isReviewed) => `
        <tr onclick="AdminPage.showArchiveDetail(${a.id})" style="cursor:pointer;${isReviewed ? 'opacity:0.8;' : ''}">
          <td><span class="badge" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-secondary);">${a.entityType}</span></td>
          <td>${Utils.escapeHtml(a.entityName)}</td>
          <td><span class="badge" style="background:${a.action === 'DELETE' ? '#ef444433' : '#f59e0b33'};color:${a.action === 'DELETE' ? '#ef4444' : '#f59e0b'};">${a.action}</span></td>
          <td>${Utils.escapeHtml(a.changedBy || 'System')}</td>
          <td class="table-hide-mobile">${Utils.formatDate(a.createdAt)}</td>
          ${isReviewed ? `
            <td><span class="badge" style="background:${a.reviewStatus==='RESTORED'?'#10b98122':'#ef444422'};color:${a.reviewStatus==='RESTORED'?'#10b981':'#ef4444'};">${a.reviewStatus}</span></td>
            <td><span style="font-weight:600;color:var(--primary);">${Utils.escapeHtml(a.reviewedBy || '—')}</span></td>
            <td class="table-hide-mobile">${Utils.formatDate(a.reviewedAt)}</td>
          ` : '<td colspan="3" style="color:var(--text-secondary);font-size:0.85rem;">Pending</td>'}
        </tr>`;

      const thead = `<thead><tr><th>Entity Type</th><th>Name</th><th>Action</th><th>Changed By</th><th class="table-hide-mobile">Archived On</th><th>Status</th><th>Reviewed By</th><th class="table-hide-mobile">Reviewed At</th></tr></thead>`;

      const pendingSection = pending.length > 0
        ? `<h3 style="margin-bottom:10px;">⏳ Pending Review (${pending.length})</h3>
           <div class="table-container" style="margin-bottom:32px;"><table class="data-table">${thead}<tbody>${pending.map(a => buildRow(a, false)).join('')}</tbody></table></div>`
        : `<div style="margin-bottom:32px;padding:20px;background:var(--bg-card);border-radius:10px;color:var(--text-secondary);text-align:center;">No items pending review</div>`;

      const reviewedSection = reviewed.length > 0
        ? `<h3 style="margin-bottom:10px;">✅ Review History (${reviewed.length})</h3>
           <div class="table-container"><table class="data-table">${thead}<tbody>${reviewed.map(a => buildRow(a, true)).join('')}</tbody></table></div>`
        : `<div style="padding:20px;background:var(--bg-card);border-radius:10px;color:var(--text-secondary);text-align:center;">No reviewed items yet</div>`;

      document.getElementById('admin-content').innerHTML = pendingSection + reviewedSection;
    } catch (e) { document.getElementById('admin-content').innerHTML = `<p>${e.message}</p>`; }
  },

  async showArchiveDetail(id) {
    try {
      const a = await API.archives.get(id);
      const isDelete = a.action === 'DELETE';
      let currentData = null;
      if (!isDelete) {
        try {
          if (a.entityType === 'ASSET') currentData = await API.assets.get(a.entityId);
          else if (a.entityType === 'RISK') currentData = await API.risks.get(a.entityId);
          else if (a.entityType === 'CONTROL') currentData = await API.controls.get(a.entityId);
          else if (a.entityType === 'COMPLIANCE') currentData = await API.compliance.get(a.entityId);
        } catch(e) {}
      }

      let dataHtml = '';
      for (const [k, v] of Object.entries(a.originalData)) {
        if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'risks' || k === 'controls' || k === 'assets' || k === 'compliances') continue;
        const val = typeof v === 'object' ? JSON.stringify(v) : v;
        const currentVal = currentData ? currentData[k] : null;
        const labelName = k === 'isHidden' ? 'Hidden' : k;
        
        if (currentData && currentVal !== undefined && String(val) !== String(currentVal)) {
          dataHtml += `<div class="detail-item detail-full"><label>${labelName} <span style="color:#f59e0b">(Changed)</span></label>
            <div style="text-decoration:line-through;color:#ef4444;font-size:0.85rem;margin-bottom:4px;">${Utils.escapeHtml(String(val))}</div>
            <div style="color:#10b981;">${Utils.escapeHtml(String(currentVal))}</div>
          </div>`;
        } else {
          dataHtml += `<div class="detail-item"><label>${labelName}</label><span>${Utils.escapeHtml(String(val))}</span></div>`;
        }
      }

      Components.openModal(`Archive: ${Utils.escapeHtml(a.entityName)}`, `
        <div style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid var(--border);">
          <span class="badge" style="background:${isDelete ? '#ef444433' : '#f59e0b33'};color:${isDelete ? '#ef4444' : '#f59e0b'};">${a.action}</span>
          <span style="color:var(--text-secondary);margin-left:10px;font-size:0.9rem;">Changed by <strong>${Utils.escapeHtml(a.changedBy || 'System')}</strong> on ${Utils.formatDate(a.createdAt)}</span>
        </div>

        <div class="detail-grid">
          ${dataHtml}
        </div>
      `,
      a.reviewStatus
        ? `<button class="btn btn-ghost" onclick="Components.closeModal()">Close</button>
           <div style="color:var(--text-secondary);font-size:0.85rem;padding:6px 0;">Reviewed by <strong style="color:var(--primary);">${Utils.escapeHtml(a.reviewedBy||'unknown')}</strong> on ${Utils.formatDate(a.reviewedAt)}</div>`
        : `<button class="btn btn-ghost" onclick="Components.closeModal()">Close</button>
           <button class="btn btn-primary" onclick="AdminPage.restoreArchive(${a.id}, '${a.entityType}')">Restore</button>
           <button class="btn btn-danger" onclick="AdminPage.deleteArchive(${a.id})">Approve</button>`);
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  restoreArchive(id, entityType) {
    Components.openModal('Confirm Restore', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to restore this item? This will overwrite the current version if it exists, effectively removing any newer changes.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="AdminPage.executeRestoreArchive(${id}, '${entityType}')">Restore</button>`
    );
  },

  async executeRestoreArchive(id, entityType) {
    try {
      await API.archives.restore(id);
      Components.closeModal();
      const formattedType = entityType ? (entityType.charAt(0) + entityType.slice(1).toLowerCase()) : 'Item';
      Utils.toast(`${formattedType} restored successfully`);
      this.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  deleteArchive(id) {
    Components.openModal('Approve Archival', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to approve this archival? This will permanently delete the snapshot and it cannot be restored.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="AdminPage.executeDeleteArchive(${id})">Approve & Delete</button>`
    );
  },

  async executeDeleteArchive(id) {
    try {
      await API.archives.delete(id);
      Components.closeModal();
      Utils.toast('Archive approved and recorded.');
      this.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  // ─── Existing User Methods ───
  async showDetail(id) {
    try {
      const u = await API.users.get(id);
      const perms = u.permissions || [];
      const permRows = ['ASSET','RISK','CONTROL','COMPLIANCE'].map(ent => {
        const p = perms.find(x => x.entity === ent) || {};
        return `<tr><td>${ent}</td>
          <td>${p.canCreate ? '✅' : '❌'}</td><td>${p.canRead ? '✅' : '❌'}</td>
          <td>${p.canUpdate ? '✅' : '❌'}</td><td>${p.canDelete ? '✅' : '❌'}</td></tr>`;
      }).join('');
      
      const isAdmin = App.currentUser?.role === 'ADMIN';
      const isSelf = App.currentUser?.id === u.id;
      const isOtherAdmin = u.role === 'ADMIN' && !isSelf;

      Components.openModal(`User: ${u.username}`, `
        <div class="detail-grid">
          <div class="detail-item"><label>Role</label>${Utils.badge(u.role)}</div>
          <div class="detail-item"><label>Username</label><span>${Utils.escapeHtml(u.username)}</span></div>
          <div class="detail-item"><label>Created</label><span>${Utils.formatDate(u.createdAt)}</span></div>
        </div>
        ${isAdmin || isSelf ? `
        <div class="related-section"><h4>🔐 Permissions</h4>
          ${u.role === 'ADMIN' ? '<p style="color:var(--primary);font-size:.85rem;">Admins have full access to all resources.</p>' :
          `<table class="perm-table"><thead><tr><th>Entity</th><th>Create</th><th>Read</th><th>Update</th><th>Delete</th></tr></thead><tbody>${permRows}</tbody></table>`}
        </div>` : ''}`,
        `${(isAdmin && !isOtherAdmin) || isSelf ? `<button class="btn btn-ghost" onclick="Components.closeModal();AdminPage.showForm(${u.id})">Edit</button>` : ''}
         ${isAdmin && u.role !== 'ADMIN' ? `<button class="btn btn-ghost" onclick="Components.closeModal();AdminPage.showPermissions(${u.id})">Edit Permissions</button>` : ''}
         ${isAdmin && !isSelf ? `<button class="btn btn-danger btn-sm" onclick="AdminPage.remove(${u.id})">Delete</button>` : ''}`);
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  async showForm(id) {
    let user = { username:'', role:'USER' };
    if (id) user = await API.users.get(id);
    const isAdmin = App.currentUser?.role === 'ADMIN';
    const isSelf = App.currentUser?.id === user.id;
    const canChangeRole = isAdmin && !isSelf;
    
    Components.openModal(id ? 'Edit User' : 'New User', `
      <div class="form-group"><label>Username</label><input id="f-uname" value="${Utils.escapeHtml(user.username)}"></div>
      <div class="form-group"><label>${id ? 'New Password (leave blank to keep)' : 'Password'}</label><input type="text" id="f-pass" autocomplete="new-password"></div>
      <div class="form-group"><label>Role</label><select id="f-role" ${!canChangeRole ? 'disabled' : ''}>${['USER','ADMIN'].map(o => `<option ${user.role===o?'selected':''}>${o}</option>`).join('')}</select>
      ${!isAdmin ? '<small style="color:var(--text-secondary);margin-top:4px;display:block;">Only administrators can manage roles.</small>' : 
        (isSelf ? '<small style="color:var(--text-secondary);margin-top:4px;display:block;">You cannot change your own role.</small>' : '')}
      </div>`,
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="AdminPage.save(${id || 'null'})">Save</button>`);
  },

  async save(id) {
    const data = { username: document.getElementById('f-uname').value, role: document.getElementById('f-role').value };
    const pass = document.getElementById('f-pass').value;
    if (pass) data.password = pass;
    else if (!id) { Utils.toast('Password is required', 'error'); return; }
    
    if (id) {
      window._pendingData = data;
      Components.openModal('Confirm Update', 
        '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you sure you want to save these changes to the user?</p>',
        `<button class="btn btn-ghost" onclick="AdminPage.showForm(${id})">Cancel</button>
         <button class="btn btn-primary" onclick="AdminPage.executeSave(${id})">Confirm Save</button>`
      );
    } else {
      window._pendingData = data;
      this.executeSave(null);
    }
  },

  async executeSave(id) {
    const data = window._pendingData;
    try {
      if (id) { await API.users.update(id, data); } else { await API.users.create(data); }
      Components.closeModal(); Utils.toast(id ? 'User updated' : 'User created'); AdminPage.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  async showPermissions(userId) {
    const user = await API.users.get(userId);
    if (user.role === 'ADMIN') { Utils.toast('Admins have full access', 'info'); return; }
    const perms = user.permissions || [];
    const entities = ['ASSET','RISK','CONTROL','COMPLIANCE'];
    const actions = ['canCreate','canRead','canUpdate','canDelete'];
    const rows = entities.map(ent => {
      const p = perms.find(x => x.entity === ent) || {};
      const checks = actions.map(a => `<td><input type="checkbox" data-entity="${ent}" data-action="${a}" ${p[a]?'checked':''}></td>`).join('');
      return `<tr><td>${ent}</td>${checks}</tr>`;
    }).join('');
    Components.openModal(`Permissions: ${user.username}`, `
      <table class="perm-table"><thead><tr><th>Entity</th><th>Create</th><th>Read</th><th>Update</th><th>Delete</th></tr></thead>
      <tbody>${rows}</tbody></table>`,
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="AdminPage.savePermissions(${userId})">Save Permissions</button>`);
  },

  async savePermissions(userId) {
    const entities = ['ASSET','RISK','CONTROL','COMPLIANCE'];
    const permissions = entities.map(entity => ({
      entity,
      canCreate: !!document.querySelector(`input[data-entity="${entity}"][data-action="canCreate"]`)?.checked,
      canRead: !!document.querySelector(`input[data-entity="${entity}"][data-action="canRead"]`)?.checked,
      canUpdate: !!document.querySelector(`input[data-entity="${entity}"][data-action="canUpdate"]`)?.checked,
      canDelete: !!document.querySelector(`input[data-entity="${entity}"][data-action="canDelete"]`)?.checked
    }));
    try {
      await API.users.updatePerms(userId, permissions);
      Components.closeModal(); Utils.toast('Permissions updated'); AdminPage.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  remove(id) {
    Components.openModal('Confirm Deletion', 
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Are you absolutely sure you want to delete this user? This action cannot be undone.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="AdminPage.executeRemove(${id})">Delete</button>`
    );
  },

  async executeRemove(id) {
    try { await API.users.delete(id); Components.closeModal(); Utils.toast('User deleted'); AdminPage.render(); }
    catch (e) { Utils.toast(e.message, 'error'); }
  },

  // ─── Password Change Requests ───
  async renderPasswordRequests() {
    try {
      const requests = await API.passwordChange.listAll();
      if (!requests || requests.length === 0) {
        document.getElementById('admin-content').innerHTML = Components.emptyState('No password change requests');
        return;
      }
      const statusColor = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };
      const rows = requests.map(r => {
        const color = statusColor[r.status] || 'var(--text-secondary)';
        const reviewedByName = r.reviewedBy?.username
          ? `<span style="font-weight:600;color:var(--primary);">${Utils.escapeHtml(r.reviewedBy.username)}</span>`
          : '<span style="color:var(--text-secondary);">—</span>';
        return `<tr onclick="AdminPage.showPasswordRequestDetail(${r.id})" style="cursor:pointer;">
          <td>${Utils.escapeHtml(r.user?.username || '—')}</td>
          <td><span class="badge" style="background:${color}22;color:${color};">${r.status}</span></td>
          <td>${Utils.formatDate(r.requestedAt)}</td>
          <td>${r.reviewedAt ? Utils.formatDate(r.reviewedAt) : '<span style="color:var(--text-secondary);">—</span>'}</td>
          <td>${reviewedByName}</td>
        </tr>`;
      }).join('');
      document.getElementById('admin-content').innerHTML = `
        <div style="background:#f59e0b15;border:1px solid #f59e0b44;border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:0.88rem;color:#f59e0b;">
          🔒 Passwords are never visible — only the username and request time are shown. You can only Approve or Reject.
        </div>
        <div class="table-container"><table class="data-table">
          <thead><tr><th>Username</th><th>Status</th><th>Requested</th><th>Reviewed At</th><th>Reviewed By</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`;
    } catch (e) {
      document.getElementById('admin-content').innerHTML = `<p>${e.message}</p>`;
    }
  },

  async showPasswordRequestDetail(id) {
    try {
      const requests = await API.passwordChange.listAll();
      const r = requests.find(x => x.id === id);
      if (!r) { Utils.toast('Request not found', 'error'); return; }
      const statusColor = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };
      const color = statusColor[r.status] || 'var(--text-secondary)';
      const isPending = r.status === 'PENDING';
      Components.openModal(`Password Request — ${Utils.escapeHtml(r.user?.username || '?')}`,
        `<div style="background:#6366f115;border:1px solid #6366f133;border-radius:10px;padding:14px 16px;margin-bottom:20px;font-size:0.88rem;color:var(--text-secondary);">
          🔒 The old and new passwords are stored as secure hashes and are <strong>never visible</strong> to administrators.
        </div>
        <div class="detail-grid">
          <div class="detail-item"><label>Username</label><span>${Utils.escapeHtml(r.user?.username || '—')}</span></div>
          <div class="detail-item"><label>Status</label><span class="badge" style="background:${color}22;color:${color};">${r.status}</span></div>
          <div class="detail-item"><label>Requested</label><span>${Utils.formatDate(r.requestedAt)}</span></div>
          <div class="detail-item"><label>Reviewed At</label><span>${r.reviewedAt ? Utils.formatDate(r.reviewedAt) : 'Not yet reviewed'}</span></div>
          <div class="detail-item"><label>Reviewed By</label><span>${r.reviewedBy?.username ? `<span style="font-weight:600;color:var(--primary);">${Utils.escapeHtml(r.reviewedBy.username)}</span>` : 'Not yet reviewed'}</span></div>
        </div>`,
        `<button class="btn btn-ghost" onclick="Components.closeModal()">Close</button>
         ${isPending ? `
           <button class="btn btn-danger" onclick="AdminPage.rejectPasswordRequest(${r.id})">Reject</button>
           <button class="btn btn-primary" onclick="AdminPage.approvePasswordRequest(${r.id})">Approve & Apply</button>
         ` : ''}`
      );
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  approvePasswordRequest(id) {
    Components.openModal('Confirm Approval',
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Approving this request will immediately apply the new password for this user. This cannot be undone.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="AdminPage.executeApprovePasswordRequest(${id})">Confirm Approve</button>`
    );
  },

  async executeApprovePasswordRequest(id) {
    try {
      await API.passwordChange.approve(id);
      Components.closeModal();
      Utils.toast('Password change approved and applied.');
      this.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  },

  rejectPasswordRequest(id) {
    Components.openModal('Confirm Rejection',
      '<p style="color:var(--text-secondary);margin-bottom:20px;">Rejecting this request will leave the user\'s current password unchanged.</p>',
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="AdminPage.executeRejectPasswordRequest(${id})">Confirm Reject</button>`
    );
  },

  async executeRejectPasswordRequest(id) {
    try {
      await API.passwordChange.reject(id);
      Components.closeModal();
      Utils.toast('Password change request rejected.');
      this.render();
    } catch (e) { Utils.toast(e.message, 'error'); }
  }
};
