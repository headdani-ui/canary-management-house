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
import { renderDatabasePage } from './pages/database.js';

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
registerRoute('/database', requireAuth(renderDatabasePage));

// --- Boot ---
async function boot() {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:var(--bg-darkest); color:var(--text-primary); font-family:var(--font-display);">
        <div style="font-size:var(--text-xl); font-weight:800; color:var(--neon); letter-spacing:0.15em; text-transform:uppercase; margin-bottom:var(--space-4); display:flex; align-items:center; gap:var(--space-2); animation: pulse 2s ease-in-out infinite;">
          <span class="dot" style="width:8px; height:8px; background:var(--neon); border-radius:50%; box-shadow:0 0 10px var(--neon);"></span>
          Canary Management House
        </div>
        <div style="font-size:var(--text-sm); color:var(--text-secondary); display:flex; align-items:center; gap:8px;">
          <span class="material-icons-outlined" style="font-size:18px; color:var(--neon);">sync</span>
          Sincronizando con el cloud...
        </div>
      </div>
    `;
  }
  
  try {
    await Promise.race([
      store.isInitialized(),
      new Promise(resolve => setTimeout(() => {
        console.warn('Boot timeout (8s): avvio con dati locali.');
        resolve(false);
      }, 8000))
    ]);
  } catch (err) {
    console.error('Error during boot initialization:', err);
  } finally {
    if (isAuthenticated()) {
      initRouter('/dashboard');
    } else {
      initRouter('/login');
    }
  }
}

boot();
