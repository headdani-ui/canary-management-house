// ============================================================
// SIDEBAR Component
// ============================================================
import { getCurrentRoute, navigate } from '../router.js';
import { store } from '../store.js';
import { formatCurrency } from '../utils.js';

export function renderSidebar() {
  const current = getCurrentRoute();
  const contracts = store.getContracts();
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  // Contracts expiring next month
  const expiringContracts = contracts.filter(c => {
    const end = new Date(c.endDate);
    return c.status === 'activo' && end >= nextMonth && end <= nextMonthEnd;
  });

  // Unpaid invoices
  const pendingInvoices = store.getInvoiceHeaders().filter(i => i.status === 'pendiente' || i.status === 'parcial');

  const totalAlerts = expiringContracts.length + pendingInvoices.length;

  const navItems = [
    { section: 'Principal' },
    { path: '/dashboard', icon: 'dashboard', label: 'Panel de Control' },
    { section: 'Gestión' },
    { path: '/properties', icon: 'domain', label: 'Propiedades' },
    { path: '/guests', icon: 'group', label: 'Huéspedes' },
    { path: '/contracts', icon: 'description', label: 'Contratos' },
    { section: 'Finanzas' },
    { path: '/costs', icon: 'receipt_long', label: 'Costos' },
    { path: '/invoices', icon: 'payments', label: 'Facturación' },
    { section: 'Planificación' },
    { path: '/calendar', icon: 'calendar_month', label: 'Calendario' },
    { section: 'Administración' },
    { path: '/database', icon: 'settings_backup_restore', label: 'Copia y Sincro' },
  ];

  let alertsHtml = '';
  expiringContracts.forEach(c => {
    const guest = store.getGuest(c.guestId);
    const room = store.getRoom(c.roomId);
    alertsHtml += `
      <div class="notification-item" data-action="navigate" data-path="/contracts/${c.id}">
        <div class="notification-icon warning"><span class="material-icons-outlined">schedule</span></div>
        <div>
          <div class="notification-text"><strong>${guest?.firstName} ${guest?.lastName}</strong> — contrato vence el ${new Date(c.endDate).toLocaleDateString('es-ES')}</div>
          <div class="notification-time">${room?.name || ''}</div>
        </div>
      </div>`;
  });
  pendingInvoices.slice(0, 3).forEach(inv => {
    const guest = store.getGuest(inv.guestId);
    alertsHtml += `
      <div class="notification-item" data-action="navigate" data-path="/invoices/${inv.id}">
        <div class="notification-icon danger"><span class="material-icons-outlined">warning</span></div>
        <div>
          <div class="notification-text"><strong>${inv.invoiceNumber}</strong> — ${guest?.firstName} ${guest?.lastName} pendiente</div>
          <div class="notification-time">${formatCurrency(inv.total)}</div>
        </div>
      </div>`;
  });

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="dot"></span>
          Canary Management House
        </div>
        <span class="sidebar-tier">Premium</span>
      </div>
      <nav class="sidebar-nav">
        ${navItems.map(item => {
          if (item.section) {
            return `<div class="sidebar-section-title">${item.section}</div>`;
          }
          const isActive = current === item.path;
          return `<a class="nav-item ${isActive ? 'active' : ''}" data-path="${item.path}" href="#${item.path}">
            <span class="material-icons-outlined">${item.icon}</span>
            ${item.label}
          </a>`;
        }).join('')}
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">AD</div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">Admin</div>
            <div class="sidebar-user-role">Gestor Principal</div>
          </div>
        </div>
        <a class="nav-item" data-path="/login" href="#/login" style="margin-top:8px;padding-left:0">
          <span class="material-icons-outlined">logout</span>
          Cerrar Sesión
        </a>
      </div>
    </aside>
    <div class="main-content" id="main-content">
      <div class="top-bar">
        <div class="top-bar-left" id="page-title-area"></div>
        <div class="top-bar-right">
          <div class="notification-bell" id="notification-bell" style="position:relative">
            <span class="material-icons-outlined">notifications</span>
            ${totalAlerts > 0 ? `<span class="notification-badge">${totalAlerts}</span>` : ''}
            <div class="notification-dropdown" id="notification-dropdown">
              <div style="font-weight:700;margin-bottom:8px;font-size:0.875rem;color:var(--text-primary)">Alertas</div>
              ${alertsHtml || '<div class="text-muted" style="padding:12px;font-size:0.8125rem">Sin alertas pendientes</div>'}
            </div>
          </div>
        </div>
      </div>
      <div id="page-content"></div>
    </div>
  `;
}

export function initSidebarEvents() {
  const bell = document.getElementById('notification-bell');
  const dropdown = document.getElementById('notification-dropdown');
  if (bell && dropdown) {
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('[data-action="navigate"]');
      if (item) {
        const path = item.dataset.path;
        navigate(path);
        dropdown.classList.remove('open');
      }
    });
  }
}
