/* ═══ App Bootstrap ═══ */
const App = {
  currentUser: null,

  async init() {
    this.initTheme();
    this.initDropdown();
    this.initMobileMenu();

    try {
      const { user } = await API.me();
      this.setUser(user);
      this.showApp();
      Router.init();
    } catch {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    this.currentUser = null;
  },

  showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = '';
  },

  setUser(user) {
    this.currentUser = user;
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0].toUpperCase();
    document.getElementById('dropdown-username').textContent = user.username;
    document.getElementById('dropdown-role').textContent = user.role;
    document.getElementById('nav-admin-link').style.display = user.role === 'ADMIN' ? '' : 'none';
  },

  initTheme() {
    const saved = localStorage.getItem('grc-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-toggle').onclick = () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('grc-theme', next);
    };
  },

  initDropdown() {
    const btn = document.getElementById('user-btn');
    const menu = document.getElementById('dropdown-menu');
    btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('open'); };
    document.addEventListener('click', () => menu.classList.remove('open'));

    document.getElementById('logout-btn').onclick = async () => {
      try { await API.logout(); } catch {}
      this.showLogin();
    };

    document.getElementById('change-password-btn').onclick = (e) => {
      e.stopPropagation();
      menu.classList.remove('open');
      this.showChangePasswordModal();
    };
  },

  showChangePasswordModal() {
    Components.openModal('Change Password',
      `<p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:20px;">
        Your request will be sent to an administrator for approval before taking effect.
      </p>
      <div class="form-group">
        <label>Current Password</label>
        <input type="password" id="cp-old" placeholder="Enter your current password" autocomplete="current-password">
      </div>
      <div class="form-group">
        <label>New Password</label>
        <input type="password" id="cp-new" placeholder="At least 6 characters" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label>Confirm New Password</label>
        <input type="password" id="cp-confirm" placeholder="Repeat new password">
      </div>
      <div id="cp-error" style="display:none;color:#ef4444;font-size:0.85rem;margin-top:8px;padding:10px;background:#ef444415;border-radius:8px;"></div>`,
      `<button class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="App.submitPasswordChange()">Submit Request</button>`
    );
  },

  async submitPasswordChange() {
    const oldPassword = document.getElementById('cp-old').value;
    const newPassword = document.getElementById('cp-new').value;
    const confirm = document.getElementById('cp-confirm').value;
    const errEl = document.getElementById('cp-error');

    errEl.style.display = 'none';

    if (!oldPassword || !newPassword || !confirm) {
      errEl.textContent = 'All fields are required.'; errEl.style.display = 'block'; return;
    }
    if (newPassword !== confirm) {
      errEl.textContent = 'New passwords do not match.'; errEl.style.display = 'block'; return;
    }
    if (newPassword.length < 6) {
      errEl.textContent = 'New password must be at least 6 characters.'; errEl.style.display = 'block'; return;
    }

    try {
      await API.passwordChange.submit(oldPassword, newPassword);
      Components.closeModal();
      Utils.toast('Password change request submitted — awaiting admin approval.', 'success');
    } catch (err) {
      errEl.textContent = err.message; errEl.style.display = 'block';
    }
  },

  initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('header-nav');
    const overlay = document.getElementById('mobile-nav-overlay');
    btn.onclick = () => { nav.classList.toggle('open'); overlay.classList.toggle('open'); };
    overlay.onclick = () => { nav.classList.remove('open'); overlay.classList.remove('open'); };
  }
};

// Login form handler
document.getElementById('login-form').onsubmit = async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  try {
    const { user } = await API.login(
      document.getElementById('login-username').value,
      document.getElementById('login-password').value
    );
    App.setUser(user);
    App.showApp();
    location.hash = '#/dashboard';
    Router.init();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  } finally { btn.disabled = false; }
};

// Brand click → dashboard
document.getElementById('nav-dashboard')?.addEventListener('click', () => { location.hash = '#/dashboard'; });

// Boot
App.init();
