/* ═══ API Client ═══ */
const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) { App.showLogin(); }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  },

  // Auth
  login: (u, p) => API.request('/api/auth/login', { method: 'POST', body: { username: u, password: p } }),
  logout: () => API.request('/api/auth/logout', { method: 'POST' }),
  me: () => API.request('/api/auth/me'),

  // Dashboard
  stats: () => API.request('/api/dashboard/stats'),

  // Assets
  assets: {
    list: (s) => API.request('/api/assets' + (s ? `?search=${encodeURIComponent(s)}` : '')),
    get: (id) => API.request(`/api/assets/${id}`),
    create: (d) => API.request('/api/assets', { method: 'POST', body: d }),
    update: (id, d) => API.request(`/api/assets/${id}`, { method: 'PUT', body: d }),
    delete: (id) => API.request(`/api/assets/${id}`, { method: 'DELETE' })
  },

  // Risks
  risks: {
    list: (s) => API.request('/api/risks' + (s ? `?search=${encodeURIComponent(s)}` : '')),
    get: (id) => API.request(`/api/risks/${id}`),
    create: (d) => API.request('/api/risks', { method: 'POST', body: d }),
    update: (id, d) => API.request(`/api/risks/${id}`, { method: 'PUT', body: d }),
    delete: (id) => API.request(`/api/risks/${id}`, { method: 'DELETE' })
  },

  // Controls
  controls: {
    list: (s) => API.request('/api/controls' + (s ? `?search=${encodeURIComponent(s)}` : '')),
    get: (id) => API.request(`/api/controls/${id}`),
    create: (d) => API.request('/api/controls', { method: 'POST', body: d }),
    update: (id, d) => API.request(`/api/controls/${id}`, { method: 'PUT', body: d }),
    delete: (id) => API.request(`/api/controls/${id}`, { method: 'DELETE' })
  },

  // Compliance
  compliance: {
    list: (s) => API.request('/api/compliance' + (s ? `?search=${encodeURIComponent(s)}` : '')),
    get: (id) => API.request(`/api/compliance/${id}`),
    create: (d) => API.request('/api/compliance', { method: 'POST', body: d }),
    update: (id, d) => API.request(`/api/compliance/${id}`, { method: 'PUT', body: d }),
    delete: (id) => API.request(`/api/compliance/${id}`, { method: 'DELETE' })
  },

  // Users
  users: {
    list: () => API.request('/api/users'),
    get: (id) => API.request(`/api/users/${id}`),
    create: (d) => API.request('/api/users', { method: 'POST', body: d }),
    update: (id, d) => API.request(`/api/users/${id}`, { method: 'PUT', body: d }),
    delete: (id) => API.request(`/api/users/${id}`, { method: 'DELETE' }),
    getPerms: (id) => API.request(`/api/users/${id}/permissions`),
    updatePerms: (id, p) => API.request(`/api/users/${id}/permissions`, { method: 'PUT', body: { permissions: p } })
  },

  // Archives
  archives: {
    list: () => API.request('/api/archives'),
    get: (id) => API.request(`/api/archives/${id}`),
    restore: (id) => API.request(`/api/archives/${id}/restore`, { method: 'POST' }),
    delete: (id) => API.request(`/api/archives/${id}`, { method: 'DELETE' })
  },

  // Password Change Requests
  passwordChange: {
    submit: (oldPassword, newPassword) => API.request('/api/password-change', { method: 'POST', body: { oldPassword, newPassword } }),
    listPending: () => API.request('/api/password-change/pending'),
    listAll: () => API.request('/api/password-change'),
    approve: (id) => API.request(`/api/password-change/${id}/approve`, { method: 'POST' }),
    reject: (id) => API.request(`/api/password-change/${id}/reject`, { method: 'POST' })
  }
};
