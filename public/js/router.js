/* ═══ Client-side Router ═══ */
const Router = {
  routes: {
    '/dashboard': () => DashboardPage.render(),
    '/assets': () => AssetsPage.render(),
    '/risks': () => RisksPage.render(),
    '/controls': () => ControlsPage.render(),
    '/compliance': () => CompliancePage.render(),
    '/admin': () => AdminPage.render()
  },

  init() {
    window.addEventListener('hashchange', () => Router.navigate());
    if (!location.hash || location.hash === '#/') location.hash = '#/dashboard';
    else Router.navigate();
  },

  navigate() {
    const hash = location.hash.replace('#', '') || '/dashboard';
    const handler = Router.routes[hash];

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-page') === hash.replace('/', ''));
    });

    // Close mobile menu
    document.getElementById('header-nav')?.classList.remove('open');
    document.getElementById('mobile-nav-overlay')?.classList.remove('open');

    if (handler) handler();
    else { document.getElementById('main-content').innerHTML = '<h2>Page not found</h2>'; }
  }
};
