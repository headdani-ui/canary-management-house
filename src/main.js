// ============================================================
// MAIN — Application Entry Point
// ============================================================
import './style.css';
import { initRouter, registerRoute, navigate } from './router.js';
import { store, seedDemoData } from './store.js';
import { renderSidebar, initSidebarEvents } from './components/sidebar.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProperties } from './pages/properties.js';
import { renderGuests } from './pages/guests.js';
import { renderContracts } from './pages/contracts.js';
import { renderCosts } from './pages/costs.js';
import { renderInvoices } from './pages/invoices.js';
import { renderCalendar } from './pages/calendar.js';

// Initialize demo data on first run
seedDemoData();

// --- Layout ---
function renderAppLayout() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app-layout">
      ${renderSidebar()}
    </div>
    <div id="modal-root"></div>
  `;
  initSidebarEvents();
}

function isAuthenticated() {
  return localStorage.getItem('rental_elite_auth') === 'true';
}

function requireAuth(renderFn) {
  return (params) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    // Re-render layout if needed
    if (!document.getElementById('page-content')) {
      renderAppLayout();
    }
    // Update active sidebar item
    const currentHash = window.location.hash.slice(1).split('/')[1] || 'dashboard';
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemPath = item.dataset.path;
      item.classList.toggle('active', itemPath === `/${currentHash}`);
    });
    renderFn(params);
  };
}

// --- Routes ---
registerRoute('/login', () => {
  localStorage.removeItem('rental_elite_auth');
  document.getElementById('app').innerHTML = '';
  renderLogin();
});

registerRoute('/dashboard', requireAuth(renderDashboard));
registerRoute('/properties', requireAuth(renderProperties));
registerRoute('/guests', requireAuth(renderGuests));
registerRoute('/contracts', requireAuth(renderContracts));
registerRoute('/costs', requireAuth(renderCosts));
registerRoute('/invoices', requireAuth(renderInvoices));
registerRoute('/calendar', requireAuth(renderCalendar));

// --- Boot ---
if (isAuthenticated()) {
  initRouter('/dashboard');
} else {
  initRouter('/login');
}
