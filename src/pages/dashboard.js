// ============================================================
// DASHBOARD Page — Clickable KPIs
// ============================================================
import { store } from '../store.js';
import { formatCurrency, getMonthName } from '../utils.js';
import { navigate } from '../router.js';

export function renderDashboard() {
  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Panel de Control</h1><div class="breadcrumb"><span>Canary Management House</span> / Resumen Ejecutivo</div>`;

  const content = document.getElementById('page-content');

  const properties = store.getProperties();
  const rooms = store.getRooms();
  const contracts = store.getContracts();
  const invoices = store.getInvoiceHeaders();
  const payments = store.getPayments();
  const guests = store.getGuests();

  // KPIs
  const activeContracts = contracts.filter(c => c.status === 'activo');
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === 'ocupada').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pendiente' || i.status === 'parcial');
  const totalPending = pendingInvoices.reduce((s, i) => s + (i.total - store.getTotalPaidForInvoice(i.id)), 0);

  // Revenue by month (last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  const revenueByMonth = months.map(m => {
    const monthPayments = payments.filter(p => {
      const d = new Date(p.paymentDate);
      return d.getMonth() + 1 === m.month && d.getFullYear() === m.year;
    });
    return monthPayments.reduce((s, p) => s + p.amount, 0);
  });

  const costsByMonth = months.map(m => {
    const monthCosts = store.getCostsHeaders().filter(c => c.month === m.month && c.year === m.year);
    return monthCosts.reduce((s, c) => s + c.amount, 0);
  });

  const maxChartVal = Math.max(...revenueByMonth, ...costsByMonth, 1);

  // Recent contracts
  const recentContracts = [...contracts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

  content.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card" id="kpi-invoiced" title="Click para ver detalle facturación">
        <div class="kpi-icon green"><span class="material-icons-outlined">account_balance_wallet</span></div>
        <div class="kpi-value">${formatCurrency(totalInvoiced)}</div>
        <div class="kpi-label">Total Facturado</div>
        <div class="kpi-change positive">
          <span class="material-icons-outlined" style="font-size:14px">trending_up</span>
          ${invoices.length} facturas emitidas
        </div>
      </div>
      <div class="kpi-card" id="kpi-occupancy" title="Click para ver propiedades">
        <div class="kpi-icon blue"><span class="material-icons-outlined">home_work</span></div>
        <div class="kpi-value">${occupancyRate}%</div>
        <div class="kpi-label">Tasa de Ocupación</div>
        <div class="kpi-change positive">
          <span class="material-icons-outlined" style="font-size:14px">apartment</span>
          ${occupiedRooms}/${totalRooms} habitaciones
        </div>
      </div>
      <div class="kpi-card" id="kpi-contracts" title="Click para ver contratos">
        <div class="kpi-icon green"><span class="material-icons-outlined">description</span></div>
        <div class="kpi-value">${activeContracts.length}</div>
        <div class="kpi-label">Contratos Activos</div>
        <div class="kpi-change positive">
          <span class="material-icons-outlined" style="font-size:14px">group</span>
          ${guests.length} huéspedes registrados
        </div>
      </div>
      <div class="kpi-card" id="kpi-pending" title="Click para ver facturas pendientes">
        <div class="kpi-icon ${totalPending > 0 ? 'red' : 'green'}"><span class="material-icons-outlined">${totalPending > 0 ? 'warning' : 'check_circle'}</span></div>
        <div class="kpi-value">${formatCurrency(totalPending)}</div>
        <div class="kpi-label">Pagos Pendientes</div>
        <div class="kpi-change ${totalPending > 0 ? 'negative' : 'positive'}">
          <span class="material-icons-outlined" style="font-size:14px">${totalPending > 0 ? 'schedule' : 'done_all'}</span>
          ${pendingInvoices.length} facturas por cobrar
        </div>
      </div>
    </div>

    <div class="page-grid">
      <div>
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">bar_chart</span>
              Ingresos vs Costos
            </div>
            <div class="card-subtitle">Últimos 6 meses</div>
          </div>
          <div class="chart-container">
            <div class="bar-chart">
              ${months.map((m, i) => `
                <div class="bar-group">
                  <div class="bar-pair">
                    <div class="bar revenue" style="height:${Math.max(4, (revenueByMonth[i] / maxChartVal) * 160)}px" title="Ingresos: ${formatCurrency(revenueByMonth[i])}"></div>
                    <div class="bar cost" style="height:${Math.max(4, (costsByMonth[i] / maxChartVal) * 160)}px" title="Costos: ${formatCurrency(costsByMonth[i])}"></div>
                  </div>
                  <div class="bar-label">${getMonthName(m.month).slice(0, 3)}</div>
                </div>
              `).join('')}
            </div>
            <div class="chart-legend">
              <div class="legend-item"><div class="legend-dot revenue"></div>Ingresos</div>
              <div class="legend-item"><div class="legend-dot cost"></div>Costos</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">description</span>
              Contratos Recientes
            </div>
            <button class="btn btn-sm btn-secondary" onclick="location.hash='/contracts'">Ver Todos</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Huésped</th>
                <th>Habitación</th>
                <th>Renta</th>
                <th>Estado</th>
                <th>Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              ${recentContracts.map(c => {
                const guest = store.getGuest(c.guestId);
                const room = store.getRoom(c.roomId);
                const statusCls = c.status === 'activo' ? 'badge-active' : 'badge-expired';
                return `<tr data-action="navigate" data-path="/contracts/${c.id}">
                  <td>${guest?.firstName || ''} ${guest?.lastName || ''}</td>
                  <td>${room?.name || ''}</td>
                  <td>${formatCurrency(c.monthlyRent)}</td>
                  <td><span class="badge ${statusCls}">${c.status}</span></td>
                  <td>${new Date(c.endDate).toLocaleDateString('es-ES')}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">domain</span>
              Infraestructura
            </div>
          </div>
          ${properties.map(p => {
            const pRooms = rooms.filter(r => r.propertyId === p.id);
            const occupied = pRooms.filter(r => r.status === 'ocupada').length;
            const rate = pRooms.length > 0 ? Math.round((occupied / pRooms.length) * 100) : 0;
            return `
              <div class="card-clickable" style="padding:var(--space-4);margin-bottom:var(--space-3);background:var(--bg-surface-2);border-radius:var(--radius-md);border:1px solid var(--border-subtle)" data-action="navigate" data-path="/properties/${p.id}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div style="font-weight:600;color:var(--text-primary);font-size:var(--text-sm)">${p.name}</div>
                    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${p.city} — ${pRooms.length} hab.</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:var(--text-lg);font-weight:700;color:${rate > 70 ? 'var(--neon)' : 'var(--yellow-accent)'}">${rate}%</div>
                    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${occupied}/${pRooms.length} ocup.</div>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">bolt</span>
              Acciones Rápidas
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            <button class="btn btn-secondary btn-block" onclick="location.hash='/properties'" style="justify-content:flex-start">
              <span class="material-icons-outlined">add_home</span> Nueva Propiedad
            </button>
            <button class="btn btn-secondary btn-block" onclick="location.hash='/guests'" style="justify-content:flex-start">
              <span class="material-icons-outlined">person_add</span> Nuevo Huésped
            </button>
            <button class="btn btn-secondary btn-block" onclick="location.hash='/contracts'" style="justify-content:flex-start">
              <span class="material-icons-outlined">post_add</span> Nuevo Contrato
            </button>
            <button class="btn btn-secondary btn-block" onclick="location.hash='/invoices'" style="justify-content:flex-start">
              <span class="material-icons-outlined">receipt</span> Nueva Factura
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // KPI click handlers
  document.getElementById('kpi-invoiced')?.addEventListener('click', () => navigate('/invoices'));
  document.getElementById('kpi-occupancy')?.addEventListener('click', () => navigate('/properties'));
  document.getElementById('kpi-contracts')?.addEventListener('click', () => navigate('/contracts'));
  document.getElementById('kpi-pending')?.addEventListener('click', () => navigate('/invoices/pending'));

  // Table row click handlers
  content.querySelectorAll('[data-action="navigate"]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.path));
  });
}
