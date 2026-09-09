// ============================================================
// DASHBOARD Page — Clickable KPIs with Property & Date Filters
// ============================================================
import { store } from '../store.js';
import { formatCurrency, getMonthName, daysInMonth } from '../utils.js';
import { navigate } from '../router.js';

export function renderDashboard() {
  const titleArea = document.getElementById('page-title-area');
  if (titleArea) {
    titleArea.innerHTML = `
      <h1>Panel de Control</h1>
      <div class="breadcrumb"><span>Canary Management House</span> / Resumen Ejecutivo</div>
    `;
  }

  const content = document.getElementById('page-content');

  const properties = store.getProperties();
  const rooms = store.getRooms();
  const contracts = store.getContracts();
  const invoices = store.getInvoiceHeaders();
  const costsHeaders = store.getCostsHeaders();
  const payments = store.getPayments();
  const guests = store.getGuests();

  // Default date filter: 1st of January of current year to current day (today)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDay = String(now.getDate()).padStart(2, '0');
  const defaultDateFrom = `${currentYear}-01-01`;
  const defaultDateTo = `${currentYear}-${currentMonth}-${currentDay}`;

  // Filter state
  let selectedPropIds = properties.map(p => p.id);
  let dateFrom = defaultDateFrom;
  let dateTo = defaultDateTo;
  let activePreset = 'this_year';

  // Helper date parsing
  function parseDateParts(dateStr) {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d || 1);
  }

  function getInvoiceDates(inv) {
    let start = inv.periodStart || inv.issueDate;
    let end = inv.periodEnd || inv.issueDate;
    if (!start && inv.year && inv.month) {
      start = `${inv.year}-${String(inv.month).padStart(2, '0')}-01`;
      end = `${inv.year}-${String(inv.month).padStart(2, '0')}-${String(daysInMonth(inv.month, inv.year)).padStart(2, '0')}`;
    }
    if (!start && inv.createdAt) {
      start = inv.createdAt.split('T')[0];
      end = start;
    }
    return { start: start || '', end: end || start || '' };
  }

  function getCostDates(c) {
    let start = c.date;
    let end = c.date;
    if (!start && c.year && c.month) {
      start = `${c.year}-${String(c.month).padStart(2, '0')}-01`;
      end = `${c.year}-${String(c.month).padStart(2, '0')}-${String(daysInMonth(c.month, c.year)).padStart(2, '0')}`;
    }
    if (!start && c.createdAt) {
      start = c.createdAt.split('T')[0];
      end = start;
    }
    return { start: start || '', end: end || start || '' };
  }

  function isInDateRange(itemStart, itemEnd, dFrom, dTo) {
    if (dFrom && itemEnd && itemEnd < dFrom) return false;
    if (dTo && itemStart && itemStart > dTo) return false;
    return true;
  }

  function calculateKPIs() {
    const isAllProps = selectedPropIds.length === 0 || selectedPropIds.length === properties.length;
    const activePropIds = isAllProps ? properties.map(p => p.id) : selectedPropIds;

    // 1. Invoices (Total Facturado / Ricavi)
    const filteredInvoices = invoices.filter(inv => {
      if (activePropIds.length > 0 && !activePropIds.includes(inv.propertyId)) return false;
      const { start, end } = getInvoiceDates(inv);
      return isInDateRange(start, end, dateFrom, dateTo);
    });
    const totalInvoiced = filteredInvoices.reduce((s, i) => s + Number(i.total || 0), 0);

    // 2. Costs (Total Costos)
    const filteredCosts = costsHeaders.filter(c => {
      if (activePropIds.length > 0 && !activePropIds.includes(c.propertyId)) return false;
      const { start, end } = getCostDates(c);
      return isInDateRange(start, end, dateFrom, dateTo);
    });
    // Exclude 'mejora inmueble' from total costs
    const totalCosts = filteredCosts.filter(c => c.costType !== 'mejora inmueble')
      .reduce((s, c) => s + Number(c.amount || 0), 0);

    // 3. Utile / Perdita (Beneficio Neto = Ricavi - Costi)
    const netProfit = totalInvoiced - totalCosts;
    const margin = totalInvoiced > 0 ? Math.round((netProfit / totalInvoiced) * 100) : 0;

    // 4. Occupancy Rate (% Occupazione del periodo)
    const targetRooms = isAllProps ? rooms : rooms.filter(r => activePropIds.includes(r.propertyId));
    let occupancyRate = 0;
    let occupancyDetail = '';

    if (targetRooms.length === 0) {
      occupancyRate = 0;
      occupancyDetail = '0 habitaciones';
    } else if (dateFrom && dateTo) {
      const pStart = parseDateParts(dateFrom);
      const pEnd = parseDateParts(dateTo);
      if (pStart && pEnd && pEnd >= pStart) {
        const totalDays = Math.round((pEnd - pStart) / (1000 * 60 * 60 * 24)) + 1;
        const totalRoomDays = targetRooms.length * totalDays;
        let totalOccupiedDays = 0;

        targetRooms.forEach(room => {
          const roomContracts = contracts.filter(c => c.roomId === room.id && c.status !== 'cancelado');
          const occupiedDayStrings = new Set();

          roomContracts.forEach(c => {
            const actualEnd = c.earlyTermination && c.actualEndDate ? c.actualEndDate : c.endDate;
            if (!c.startDate || !actualEnd) return;
            const cStart = parseDateParts(c.startDate);
            const cEnd = parseDateParts(actualEnd);
            if (!cStart || !cEnd) return;

            const oStart = new Date(Math.max(pStart.getTime(), cStart.getTime()));
            const oEnd = new Date(Math.min(pEnd.getTime(), cEnd.getTime()));

            if (oEnd >= oStart) {
              let cur = new Date(oStart);
              while (cur <= oEnd) {
                const y = cur.getFullYear();
                const m = String(cur.getMonth() + 1).padStart(2, '0');
                const d = String(cur.getDate()).padStart(2, '0');
                occupiedDayStrings.add(`${y}-${m}-${d}`);
                cur.setDate(cur.getDate() + 1);
              }
            }
          });

          totalOccupiedDays += occupiedDayStrings.size;
        });

        occupancyRate = totalRoomDays > 0 ? Math.min(100, Math.round((totalOccupiedDays / totalRoomDays) * 100)) : 0;
        occupancyDetail = `${totalOccupiedDays}/${totalRoomDays} días-hab. (${totalDays}d)`;
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      const occupiedRooms = targetRooms.filter(r => {
        const hasActiveContract = contracts.some(c => {
          const actualEnd = c.earlyTermination && c.actualEndDate ? c.actualEndDate : c.endDate;
          return c.roomId === r.id && c.status === 'activo' && c.startDate <= today && (!actualEnd || actualEnd >= today);
        });
        return hasActiveContract || r.status === 'ocupada';
      }).length;

      occupancyRate = targetRooms.length > 0 ? Math.round((occupiedRooms / targetRooms.length) * 100) : 0;
      occupancyDetail = `${occupiedRooms}/${targetRooms.length} habitaciones ocupadas`;
    }

    // 5. Active Contracts in period
    const filteredContracts = contracts.filter(c => {
      const room = store.getRoom(c.roomId);
      const propId = c.propertyId || room?.propertyId;
      if (activePropIds.length > 0 && !activePropIds.includes(propId)) return false;
      if (dateFrom || dateTo) {
        const actualEnd = c.earlyTermination && c.actualEndDate ? c.actualEndDate : c.endDate;
        return isInDateRange(c.startDate, actualEnd, dateFrom, dateTo);
      }
      return c.status === 'activo';
    });

    return {
      totalInvoiced,
      totalCosts,
      netProfit,
      margin,
      occupancyRate,
      occupancyDetail,
      invoicesCount: filteredInvoices.length,
      costsCount: filteredCosts.length,
      contractsCount: filteredContracts.length,
      activePropIds
    };
  }

  // Initial structure render
  content.innerHTML = `
    <!-- Filtros de Dashboard -->
    <div class="dashboard-filter-bar">
      <div class="dashboard-filter-main">
        <div class="dashboard-filter-controls">
          <!-- Multi-select Proprietà -->
          <div class="multiselect-wrapper" id="dash-multiselect-wrapper">
            <button type="button" class="multiselect-btn" id="dash-prop-btn" title="Filtrar por propiedades">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon)">apartment</span>
              <span id="dash-prop-label">Todas las propiedades (${properties.length})</span>
              <span class="material-icons-outlined" style="font-size:16px;color:var(--text-tertiary)">expand_more</span>
            </button>
            <div class="multiselect-menu" id="dash-prop-menu">
              <div class="multiselect-header">
                <span class="filter-group-label">Propiedades</span>
                <div style="display:flex;gap:var(--space-2)">
                  <button type="button" id="dash-select-all-props">Todas</button>
                  <span style="color:var(--border-subtle)">|</span>
                  <button type="button" id="dash-clear-props">Ninguna</button>
                </div>
              </div>
              <div class="multiselect-options">
                ${properties.map(p => {
                  const pRooms = rooms.filter(r => r.propertyId === p.id);
                  return `
                    <label class="multiselect-option">
                      <input type="checkbox" class="dash-prop-check" value="${p.id}" checked />
                      <span style="flex:1">${p.name}</span>
                      <span style="font-size:11px;color:var(--text-tertiary)">${pRooms.length} hab.</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Date Range Picker -->
          <div class="date-range-container">
            <span class="material-icons-outlined" style="font-size:16px;color:var(--neon)">calendar_today</span>
            <input type="date" id="dash-date-from" value="${dateFrom}" title="Fecha inicio" />
            <span class="date-range-separator">→</span>
            <input type="date" id="dash-date-to" value="${dateTo}" title="Fecha fin" />
          </div>

          <!-- Reset button -->
          <button type="button" class="btn btn-sm btn-ghost" id="dash-reset-filters" title="Restablecer todos los filtros">
            <span class="material-icons-outlined" style="font-size:16px">restart_alt</span> Limpiar
          </button>
        </div>

        <!-- Date Presets -->
        <div class="filter-presets">
          <button type="button" class="preset-pill" data-preset="all">Todo</button>
          <button type="button" class="preset-pill" data-preset="this_month">Este mes</button>
          <button type="button" class="preset-pill" data-preset="last_month">Mes anterior</button>
          <button type="button" class="preset-pill active" data-preset="this_year">Este año</button>
          <button type="button" class="preset-pill" data-preset="last_30_days">Últimos 30 días</button>
        </div>
      </div>
    </div>

    <!-- KPIs Container -->
    <div id="dashboard-kpis" class="kpi-grid"></div>

    <!-- Main Grid -->
    <div class="page-grid">
      <div>
        <!-- Chart: Ingresos vs Costos -->
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">bar_chart</span>
              Ingresos vs Costos
            </div>
            <div class="card-subtitle" id="chart-period-subtitle">Últimos 6 meses</div>
          </div>
          <div class="chart-container" id="dashboard-chart-container"></div>
        </div>

        <div id="property-improvement-card" class="card mt-6"></div>
      </div>

      <div>
        <!-- Infraestructura -->
        <div class="card mb-6">
          <div class="card-header">
            <div class="card-title">
              <span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">domain</span>
              Infraestructura
            </div>
          </div>
          <div id="dashboard-infra-container"></div>
        </div>

        <!-- Acciones Rápidas -->
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
            <button class="btn btn-secondary btn-block" onclick="location.hash='/costs'" style="justify-content:flex-start">
              <span class="material-icons-outlined">payments</span> Nuevo Costo
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Function to re-render dynamic views based on current filters
  function updateDashboardViews() {
    const kpis = calculateKPIs();

    // 1. Render KPIs
    const kpiContainer = document.getElementById('dashboard-kpis');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <!-- KPI 1: Totale Fatturato (Ricavi) -->
        <div class="kpi-card" id="kpi-invoiced" title="Click para ver facturación">
          <div class="kpi-icon green"><span class="material-icons-outlined">account_balance_wallet</span></div>
          <div class="kpi-value">${formatCurrency(kpis.totalInvoiced)}</div>
          <div class="kpi-label">Total Facturado</div>
          <div class="kpi-change positive">
            <span class="material-icons-outlined" style="font-size:14px">trending_up</span>
            ${kpis.invoicesCount} facturas emitidas
          </div>
        </div>

        <!-- KPI 2: Totale Costi -->
        <div class="kpi-card" id="kpi-costs" title="Click para ver gestión de costos">
          <div class="kpi-icon orange"><span class="material-icons-outlined">receipt_long</span></div>
          <div class="kpi-value">${formatCurrency(kpis.totalCosts)}</div>
          <div class="kpi-label">Total Costos</div>
          <div class="kpi-change ${kpis.totalCosts > 0 ? 'negative' : 'positive'}">
            <span class="material-icons-outlined" style="font-size:14px">payments</span>
            ${kpis.costsCount} costos registrados
          </div>
        </div>

        <!-- KPI 3: Utile / Perdita del Periodo (Ricavi - Costi) -->
        <div class="kpi-card" id="kpi-profit" title="Beneficio Neto = Facturación - Costos">
          <div class="kpi-icon ${kpis.netProfit >= 0 ? 'green' : 'red'}">
            <span class="material-icons-outlined">${kpis.netProfit >= 0 ? 'trending_up' : 'trending_down'}</span>
          </div>
          <div class="kpi-value" style="color: ${kpis.netProfit >= 0 ? 'var(--neon)' : 'var(--red-accent)'}">
            ${formatCurrency(kpis.netProfit)}
          </div>
          <div class="kpi-label">Utile / Pérdida de Período</div>
          <div class="kpi-change ${kpis.netProfit >= 0 ? 'positive' : 'negative'}">
            <span class="material-icons-outlined" style="font-size:14px">${kpis.netProfit >= 0 ? 'check_circle' : 'warning'}</span>
            ${kpis.margin}% margen (${kpis.netProfit >= 0 ? 'Beneficio' : 'Déficit'})
          </div>
        </div>

        <!-- KPI 4: % Occupazione del Periodo -->
        <div class="kpi-card" id="kpi-occupancy" title="Click para ver propiedades">
          <div class="kpi-icon blue"><span class="material-icons-outlined">home_work</span></div>
          <div class="kpi-value">${kpis.occupancyRate}%</div>
          <div class="kpi-label">Tasa de Ocupación</div>
          <div class="kpi-change positive">
            <span class="material-icons-outlined" style="font-size:14px">apartment</span>
            ${kpis.occupancyDetail}
          </div>
        </div>

        <!-- KPI 5: Contratos en Período -->
        <div class="kpi-card" id="kpi-contracts" title="Click para ver contratos">
          <div class="kpi-icon purple"><span class="material-icons-outlined">description</span></div>
          <div class="kpi-value">${kpis.contractsCount}</div>
          <div class="kpi-label">Contratos en Período</div>
          <div class="kpi-change positive">
            <span class="material-icons-outlined" style="font-size:14px">group</span>
            ${guests.length} huéspedes en total
          </div>
        </div>
      `;

      // Click handlers for KPIs
      document.getElementById('kpi-invoiced')?.addEventListener('click', () => navigate('/invoices'));
      document.getElementById('kpi-costs')?.addEventListener('click', () => navigate('/costs'));
      document.getElementById('kpi-profit')?.addEventListener('click', () => navigate('/invoices'));
      document.getElementById('kpi-occupancy')?.addEventListener('click', () => navigate('/properties'));
      document.getElementById('kpi-contracts')?.addEventListener('click', () => navigate('/contracts'));
    }

    // 2. Render Chart (Ingresos vs Costos for filtered properties)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    const revenueByMonth = months.map(m => {
      const monthPayments = payments.filter(p => {
        if (kpis.activePropIds.length > 0) {
          const inv = store.getInvoiceHeader(p.invoiceId);
          if (inv && !kpis.activePropIds.includes(inv.propertyId)) return false;
        }
        const d = new Date(p.paymentDate);
        return d.getMonth() + 1 === m.month && d.getFullYear() === m.year;
      });
      return monthPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    });

    const costsByMonth = months.map(m => {
      const monthCosts = costsHeaders.filter(c => {
        if (kpis.activePropIds.length > 0 && !kpis.activePropIds.includes(c.propertyId)) return false;
        if (c.costType === 'mejora inmueble') return false;
        return c.month === m.month && c.year === m.year;
      });
      return monthCosts.reduce((s, c) => s + Number(c.amount || 0), 0);
    });

    const maxChartVal = Math.max(...revenueByMonth, ...costsByMonth, 1);
    const chartContainer = document.getElementById('dashboard-chart-container');
    if (chartContainer) {
      chartContainer.innerHTML = `
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
          <div class="legend-item"><div class="legend-dot revenue"></div>Ingresos cobrados</div>
          <div class="legend-item"><div class="legend-dot cost"></div>Costos registrados</div>
        </div>
      `;
    }

    // 2b. Render Mejora Inmueble card
    const improvementCard = document.getElementById('property-improvement-card');
    if (improvementCard) {
      const visibleProps = properties.filter(p => kpis.activePropIds.length === 0 || kpis.activePropIds.includes(p.id));
      improvementCard.innerHTML = visibleProps.map(p => {
        const purchase = Number(p.purchasePrice || 0);
        const propCosts = costsHeaders.filter(c => c.propertyId === p.id);
        const mejoraSum = propCosts.filter(c => c.costType === 'mejora inmueble' && isInDateRange(getCostDates(c).start, getCostDates(c).end, dateFrom, dateTo))
          .reduce((s, c) => s + Number(c.amount || 0), 0);
        const otherCosts = propCosts.filter(c => c.costType !== 'mejora inmueble' && isInDateRange(getCostDates(c).start, getCostDates(c).end, dateFrom, dateTo))
          .reduce((s, c) => s + Number(c.amount || 0), 0);
        const revenue = payments.filter(pmt => {
          const inv = store.getInvoiceHeader(pmt.invoiceId);
          if (!inv) return false;
          if (kpis.activePropIds.length > 0 && !kpis.activePropIds.includes(inv.propertyId)) return false;
          if (inv.propertyId !== p.id) return false;
          const { start, end } = getInvoiceDates(inv);
          return isInDateRange(start, end, dateFrom, dateTo);
        }).reduce((s, pmt) => s + Number(pmt.amount || 0), 0);
        const totalValue = purchase + mejoraSum;
        const profit = revenue - (otherCosts + mejoraSum);
        const percent = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
        return `<div class="card-clickable" style="padding:var(--space-4);margin-bottom:var(--space-3);background:var(--bg-surface-2);border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
                  <div style="font-weight:600;color:var(--text-primary);font-size:var(--text-sm)">${p.name}</div>
                  <div>Valor Total: ${formatCurrency(totalValue)}</div>
                  <div>Utile/Perdita: ${formatCurrency(profit)} (${percent}%)</div>
                </div>`;
      }).join('');
    }

    // 3. Render Contratos Recientes
    const recentContracts = [...contracts]
      .filter(c => {
        const room = store.getRoom(c.roomId);
        const pId = c.propertyId || room?.propertyId;
        return kpis.activePropIds.length === 0 || kpis.activePropIds.includes(pId);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);

    const contractsContainer = document.getElementById('dashboard-contracts-container');
    if (contractsContainer) {
      if (recentContracts.length === 0) {
        contractsContainer.innerHTML = `<div style="padding:var(--space-6);text-align:center;color:var(--text-tertiary)">No hay contratos para los filtros seleccionados</div>`;
      } else {
        contractsContainer.innerHTML = `
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
        `;
      }
    }

    // 4. Render Infraestructura
    const infraContainer = document.getElementById('dashboard-infra-container');
    if (infraContainer) {
      const visibleProps = properties.filter(p => kpis.activePropIds.length === 0 || kpis.activePropIds.includes(p.id));
      if (visibleProps.length === 0) {
        infraContainer.innerHTML = `<div style="padding:var(--space-6);text-align:center;color:var(--text-tertiary)">Ninguna propiedad seleccionada</div>`;
      } else {
        infraContainer.innerHTML = visibleProps.map(p => {
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
        }).join('');
      }
    }

    // Bind navigation clicks for table & cards
    content.querySelectorAll('[data-action="navigate"]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.path));
    });
  }

  // Multi-select events & label update
  const propBtn = document.getElementById('dash-prop-btn');
  const propMenu = document.getElementById('dash-prop-menu');
  const propLabel = document.getElementById('dash-prop-label');

  function updatePropLabel() {
    if (!propLabel) return;
    if (selectedPropIds.length === properties.length || selectedPropIds.length === 0) {
      propLabel.textContent = `Todas las propiedades (${properties.length})`;
    } else if (selectedPropIds.length === 1) {
      const p = properties.find(x => x.id === selectedPropIds[0]);
      propLabel.textContent = p ? p.name : '1 propiedad';
    } else {
      propLabel.textContent = `${selectedPropIds.length} propiedades seleccionadas`;
    }
  }

  propBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    propMenu?.classList.toggle('show');
    propBtn.classList.toggle('active', propMenu?.classList.contains('show'));
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!document.getElementById('dash-multiselect-wrapper')?.contains(e.target)) {
      propMenu?.classList.remove('show');
      propBtn?.classList.remove('active');
    }
  });

  // Property checkboxes
  content.querySelectorAll('.dash-prop-check').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedPropIds = Array.from(content.querySelectorAll('.dash-prop-check:checked')).map(el => el.value);
      updatePropLabel();
      updateDashboardViews();
    });
  });

  // Select all / clear buttons in dropdown
  document.getElementById('dash-select-all-props')?.addEventListener('click', () => {
    content.querySelectorAll('.dash-prop-check').forEach(cb => cb.checked = true);
    selectedPropIds = properties.map(p => p.id);
    updatePropLabel();
    updateDashboardViews();
  });

  document.getElementById('dash-clear-props')?.addEventListener('click', () => {
    content.querySelectorAll('.dash-prop-check').forEach(cb => cb.checked = false);
    selectedPropIds = [];
    updatePropLabel();
    updateDashboardViews();
  });

  // Date inputs
  const dateFromInput = document.getElementById('dash-date-from');
  const dateToInput = document.getElementById('dash-date-to');

  dateFromInput?.addEventListener('change', () => {
    dateFrom = dateFromInput.value;
    clearPresetPillActive();
    updateDashboardViews();
  });

  dateToInput?.addEventListener('change', () => {
    dateTo = dateToInput.value;
    clearPresetPillActive();
    updateDashboardViews();
  });

  function clearPresetPillActive() {
    content.querySelectorAll('.preset-pill').forEach(p => p.classList.remove('active'));
  }

  // Presets
  content.querySelectorAll('.preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      clearPresetPillActive();
      btn.classList.add('active');
      activePreset = preset;

      const now = new Date();
      if (preset === 'all') {
        dateFrom = '';
        dateTo = '';
      } else if (preset === 'this_month') {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = String(daysInMonth(now.getMonth() + 1, y)).padStart(2, '0');
        dateFrom = `${y}-${m}-01`;
        dateTo = `${y}-${m}-${lastDay}`;
      } else if (preset === 'last_month') {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const y = prev.getFullYear();
        const m = String(prev.getMonth() + 1).padStart(2, '0');
        const lastDay = String(daysInMonth(prev.getMonth() + 1, y)).padStart(2, '0');
        dateFrom = `${y}-${m}-01`;
        dateTo = `${y}-${m}-${lastDay}`;
      } else if (preset === 'this_year') {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        dateFrom = `${y}-01-01`;
        dateTo = `${y}-${m}-${d}`;
      } else if (preset === 'last_30_days') {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dateFrom = fmt(past);
        dateTo = fmt(now);
      }

      if (dateFromInput) dateFromInput.value = dateFrom;
      if (dateToInput) dateToInput.value = dateTo;
      updateDashboardViews();
    });
  });

  // Reset filters
  document.getElementById('dash-reset-filters')?.addEventListener('click', () => {
    selectedPropIds = properties.map(p => p.id);
    content.querySelectorAll('.dash-prop-check').forEach(cb => cb.checked = true);
    updatePropLabel();

    dateFrom = defaultDateFrom;
    dateTo = defaultDateTo;
    if (dateFromInput) dateFromInput.value = defaultDateFrom;
    if (dateToInput) dateToInput.value = defaultDateTo;

    clearPresetPillActive();
    content.querySelector('.preset-pill[data-preset="this_year"]')?.classList.add('active');

    updateDashboardViews();
  });

  // Initial render of dynamic views
  updateDashboardViews();
}
