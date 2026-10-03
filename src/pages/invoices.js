// ============================================================
// INVOICES Page — Smart Invoice Generator
// ============================================================
import { store } from '../store.js';
import { navigate } from '../router.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { generateId, formatCurrency, formatDate, statusBadge, formatMonth, calculateProRataRent, calculateCostAllocation } from '../utils.js';

export function renderInvoices(params) {
  if (params && params[0] === 'pending') return renderFilteredInvoices('pendiente');
  if (params && params[0]) return renderInvoiceDetail(params[0]);

  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Facturación</h1><div class="breadcrumb"><span>Canary Management House</span> / Gestión de Facturación</div>`;

  const content = document.getElementById('page-content');
  const invoices = store.getInvoiceHeaders();
  const properties = store.getProperties();

  // Summary
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(store.getTotalPaidForInvoice(i.id) || 0), 0);
  const totalPending = totalInvoiced - totalPaid;
  const countPaid = invoices.filter(i => i.status === 'pagada').length;
  const countPending = invoices.filter(i => i.status === 'pendiente' || i.status === 'parcial').length;

  content.innerHTML = `
    <div class="invoice-summary mb-6">
      <div class="invoice-summary-item clickable" id="sum-total" title="Ver todas las facturas">
        <div class="invoice-summary-icon"><span class="material-icons-outlined">receipt_long</span></div>
        <div class="invoice-summary-value">${formatCurrency(totalInvoiced)}</div>
        <div class="invoice-summary-label">Total Facturado (${invoices.length})</div>
      </div>
      <div class="invoice-summary-item clickable" id="sum-paid" title="Ver facturas pagadas">
        <div class="invoice-summary-icon success"><span class="material-icons-outlined">check_circle</span></div>
        <div class="invoice-summary-value">${formatCurrency(totalPaid)}</div>
        <div class="invoice-summary-label">Total Cobrado (${countPaid})</div>
      </div>
      <div class="invoice-summary-item clickable" id="sum-pending" title="Ver facturas pendientes">
        <div class="invoice-summary-icon warning"><span class="material-icons-outlined">schedule</span></div>
        <div class="invoice-summary-value text-${totalPending > 0 ? 'red' : 'neon'}">${formatCurrency(totalPending)}</div>
        <div class="invoice-summary-label">Saldo Pendiente (${countPending})</div>
      </div>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="inv-search" placeholder="Buscar factura, huésped..." />
          </div>
          <select class="table-filter" id="inv-status-filter">
            <option value="">Todos los estados</option>
            <option value="pagada">Pagada</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
          </select>
          <select class="table-filter" id="inv-property-filter">
            <option value="">Todas las propiedades</option>
            ${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="generate-invoice-btn">
          <span class="material-icons-outlined">auto_fix_high</span> Generar Factura
        </button>
      </div>
      <table>
        <thead>
          <tr><th>Nº Factura</th><th>Huésped</th><th>Propiedad</th><th>Período</th><th>Subtotal</th><th>IGIC</th><th>Total</th><th>Pagado</th><th>Estado</th></tr>
        </thead>
        <tbody id="invoices-tbody">
          ${[...invoices].sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber)).map(inv => {
            const guest = store.getGuest(inv.guestId);
            const property = store.getProperty(inv.propertyId);
            const paid = store.getTotalPaidForInvoice(inv.id);
            return `<tr data-id="${inv.id}" class="row-clickable" data-status="${inv.status}" data-property="${inv.propertyId}">
              <td style="font-weight:600;color:var(--neon)">${inv.invoiceNumber}</td>
              <td>${guest?.firstName || ''} ${guest?.lastName || ''}</td>
              <td>${property?.name || '—'}</td>
              <td>${formatMonth(inv.month, inv.year)}</td>
              <td>${formatCurrency(inv.subtotal)}</td>
              <td>${formatCurrency(inv.tax)}</td>
              <td style="font-weight:600">${formatCurrency(inv.total)}</td>
              <td>${formatCurrency(paid)}</td>
              <td>${statusBadge(inv.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Filters
  const filterInvoices = () => {
    const q = document.getElementById('inv-search')?.value.toLowerCase() || '';
    const status = document.getElementById('inv-status-filter')?.value || '';
    const propId = document.getElementById('inv-property-filter')?.value || '';
    document.querySelectorAll('#invoices-tbody tr').forEach(row => {
      row.style.display = (row.textContent.toLowerCase().includes(q)) && (!status || row.dataset.status === status) && (!propId || row.dataset.property === propId) ? '' : 'none';
    });
  };
  document.getElementById('inv-search')?.addEventListener('input', filterInvoices);
  document.getElementById('inv-status-filter')?.addEventListener('change', filterInvoices);
  document.getElementById('inv-property-filter')?.addEventListener('change', filterInvoices);

  // Click summary items
  document.getElementById('sum-pending')?.addEventListener('click', () => {
    document.getElementById('inv-status-filter').value = 'pendiente';
    filterInvoices();
  });

  // Click row
  content.querySelectorAll('.row-clickable').forEach(row => {
    row.addEventListener('click', () => navigate('/invoices/' + row.dataset.id));
  });

  // Generate invoice
  document.getElementById('generate-invoice-btn')?.addEventListener('click', () => showGenerateInvoiceModal());
}

function renderFilteredInvoices(statusFilter) {
  renderInvoices([]);
  setTimeout(() => {
    const filter = document.getElementById('inv-status-filter');
    if (filter) {
      filter.value = statusFilter;
      filter.dispatchEvent(new Event('change'));
    }
  }, 100);
}

function showGenerateInvoiceModal() {
  const allContracts = store.getContracts().filter(c => c && c.status !== 'cancelado');
  const now = new Date();
  let selectedMonth = now.getMonth() + 1;
  let selectedYear = now.getFullYear();

  function getEligibleContracts(month, year) {
    const totalDays = daysInMonth(month, year);
    const mStr = String(month).padStart(2, '0');
    const monthStart = `${year}-${mStr}-01`;
    const monthEnd = `${year}-${mStr}-${String(totalDays).padStart(2, '0')}`;

    return store.getContracts().filter(c => {
      if (!c || c.status === 'cancelado') return false;
      const cStart = c.startDate ? String(c.startDate).slice(0, 10) : '';
      const rawEnd = (c.earlyTermination && c.actualEndDate) ? c.actualEndDate : c.endDate;
      const cEnd = rawEnd ? String(rawEnd).slice(0, 10) : '9999-12-31';
      if (!cStart) return false;
      return cStart <= monthEnd && cEnd >= monthStart;
    });
  }

  // If currently selected month has no contracts, find the month/year of the most recent contract
  if (allContracts.length > 0 && getEligibleContracts(selectedMonth, selectedYear).length === 0) {
    const sorted = [...allContracts].sort((a, b) => {
      const dateA = (a.earlyTermination && a.actualEndDate ? a.actualEndDate : a.endDate) || a.startDate || '';
      const dateB = (b.earlyTermination && b.actualEndDate ? b.actualEndDate : b.endDate) || b.startDate || '';
      return String(dateB).localeCompare(String(dateA));
    });
    if (sorted[0]) {
      const refDate = String(sorted[0].startDate || sorted[0].endDate || '').slice(0, 10);
      if (refDate && refDate.includes('-')) {
        const parts = refDate.split('-');
        selectedYear = parseInt(parts[0], 10) || selectedYear;
        selectedMonth = parseInt(parts[1], 10) || selectedMonth;
      }
    }
  }

  function renderContractsList(month, year) {
    const contracts = getEligibleContracts(month, year);
    const container = document.getElementById('gen-contracts');
    if (!container) return;

    if (contracts.length === 0) {
      container.innerHTML = '<div style="color:var(--text-tertiary);font-size:var(--text-sm);padding:var(--space-4);text-align:center;">No hay contratos activos o registrados con presencia en este período.</div>';
      return;
    }

    const existingInvoices = store.getInvoiceHeaders();

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-2);padding-bottom:var(--space-2);border-bottom:1px solid var(--border-subtle);font-size:var(--text-xs);color:var(--text-secondary)">
        <label style="cursor:pointer;display:flex;align-items:center;gap:var(--space-1)">
          <input type="checkbox" id="gen-select-all" checked /> <span>Seleccionar todos</span>
        </label>
        <span>${contracts.length} contrato(s) encontrado(s)</span>
      </div>
      <div id="gen-contracts-items">
        ${contracts.map(c => {
          const guest = store.getGuest(c.guestId);
          const room = store.getRoom(c.roomId);
          const property = store.getProperty(c.propertyId || room?.propertyId);
          const alreadyInvoiced = existingInvoices.some(i => i.contractId === c.id && Number(i.month) === Number(month) && Number(i.year) === Number(year));
          const rawEnd = (c.earlyTermination && c.actualEndDate) ? c.actualEndDate : c.endDate;
          const effectiveEnd = rawEnd ? String(rawEnd).slice(0, 10) : '';
          const startDate = c.startDate ? String(c.startDate).slice(0, 10) : '';
          const proRata = calculateProRataRent(c.monthlyRent, startDate, effectiveEnd, month, year);

          return `<label class="form-checkbox" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);padding:var(--space-2);border-radius:var(--radius-sm);background:var(--bg-surface-2);gap:var(--space-2);${alreadyInvoiced ? 'opacity:0.6;' : ''}">
            <span style="display:flex;align-items:center;gap:var(--space-2)">
              <input type="checkbox" class="gen-contract-cb" value="${c.id}" ${alreadyInvoiced ? 'disabled' : 'checked'} />
              <span>
                <strong>${guest?.firstName || ''} ${guest?.lastName || ''}</strong> — ${property?.name ? property.name + ' / ' : ''}${room?.name || ''}
                <span style="font-size:var(--text-xs);color:var(--text-tertiary);display:block">(${formatDate(startDate)} al ${formatDate(effectiveEnd)})</span>
              </span>
            </span>
            <span style="white-space:nowrap;font-size:var(--text-sm);font-weight:600">
              ${alreadyInvoiced ? '<span class="badge badge-paid">Ya facturado</span>' : formatCurrency(proRata)}
            </span>
          </label>`;
        }).join('')}
      </div>
    `;

    document.getElementById('gen-select-all')?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      container.querySelectorAll('.gen-contract-cb:not(:disabled)').forEach(cb => {
        cb.checked = isChecked;
      });
    });
  }

  const body = `
    <p style="color:var(--text-secondary);margin-bottom:var(--space-4)">El sistema generará facturas automáticas para todos los contratos con presencia en el período seleccionado, calculando la renta proporcional y los costos de la propiedad.</p>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Mes</label>
        <select class="form-select" id="gen-month">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${new Date(2024,m-1).toLocaleDateString('es-ES',{month:'long'})}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Año</label>
        <input class="form-input" type="number" id="gen-year" value="${selectedYear}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Contratos a Facturar</label>
      <div id="gen-contracts" style="max-height:240px;overflow-y:auto;border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:var(--space-3)">
      </div>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    <button class="btn btn-primary" id="gen-invoice-btn"><span class="material-icons-outlined">auto_fix_high</span> Generar</button>
  `;
  openModal('Generar Facturas', body, footer, { large: true });

  // Initial populate
  renderContractsList(selectedMonth, selectedYear);

  // Dynamic update on month/year change
  const updateList = () => {
    const m = parseInt(document.getElementById('gen-month')?.value, 10) || selectedMonth;
    const y = parseInt(document.getElementById('gen-year')?.value, 10) || selectedYear;
    renderContractsList(m, y);
  };

  document.getElementById('gen-month')?.addEventListener('change', updateList);
  document.getElementById('gen-year')?.addEventListener('input', updateList);

  document.getElementById('gen-invoice-btn').addEventListener('click', () => {
    const month = parseInt(document.getElementById('gen-month').value, 10);
    const year = parseInt(document.getElementById('gen-year').value, 10);
    const checkboxes = document.querySelectorAll('#gen-contracts input.gen-contract-cb:checked');
    const contractIds = Array.from(checkboxes).map(cb => cb.value);

    if (contractIds.length === 0) {
      showToast('Seleccione al menos un contrato a facturar', 'warning');
      return;
    }

    let generated = 0;
    contractIds.forEach(contractId => {
      const contract = store.getContract(contractId);
      if (!contract) return;

      // Check if invoice already exists
      const existing = store.getInvoiceHeaders().find(i => i.contractId === contractId && Number(i.month) === month && Number(i.year) === year);
      if (existing) return;

      const room = store.getRoom(contract.roomId);
      const propId = contract.propertyId || room?.propertyId;
      const property = store.getProperty(propId);
      const rooms = propId ? store.getRoomsByProperty(propId) : [];
      const numRooms = rooms.length;

      // Pro-rata rent (taking into account early termination if present)
      const rawEnd = (contract.earlyTermination && contract.actualEndDate) ? contract.actualEndDate : contract.endDate;
      const effectiveEndDate = rawEnd ? String(rawEnd).slice(0, 10) : '';
      const startDate = contract.startDate ? String(contract.startDate).slice(0, 10) : '';
      const rentAmount = calculateProRataRent(contract.monthlyRent, startDate, effectiveEndDate, month, year);
      if (rentAmount <= 0) return;

      const invId = generateId();
      const totalDays = new Date(year, month, 0).getDate();
      const invNumber = `F-${year}-${String(month).padStart(2, '0')}-${String(store.getInvoiceHeaders().length + 1).padStart(3, '0')}`;

      const details = [];
      const isPartial = rentAmount < contract.monthlyRent;

      details.push({
        id: generateId(),
        invoiceId: invId,
        description: isPartial ? `Alquiler habitación (proporcional)` : 'Alquiler habitación (mes completo)',
        quantity: 1,
        unitPrice: rentAmount,
        total: rentAmount,
      });

      // Cost allocation
      if (propId) {
        const periodCosts = store.getCostsByPropertyAndPeriod(propId, month, year).filter(c => c.chargeToGuests);
        const totalCosts = periodCosts.reduce((s, c) => s + Number(c.amount || 0), 0);
        if (totalCosts > 0 && numRooms > 0) {
          const { perRoom } = calculateCostAllocation(totalCosts, contract.franchise || 0, numRooms);
          if (perRoom > 0) {
            details.push({
              id: generateId(),
              invoiceId: invId,
              description: `Gastos comunes (total: €${totalCosts.toFixed(2)} - franquicia: €${(contract.franchise || 0).toFixed(2)}) / ${numRooms} hab.`,
              quantity: 1,
              unitPrice: perRoom,
              total: perRoom,
            });
          }
        }
      }

      const subtotal = details.reduce((s, d) => s + Number(d.total || 0), 0);
      const tax = 0; // IGIC not calculated
      const total = subtotal;

      store.saveInvoiceHeader({
        id: invId,
        invoiceNumber: invNumber,
        guestId: contract.guestId,
        roomId: contract.roomId,
        contractId: contract.id,
        propertyId: propId,
        month, year,
        periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
        periodEnd: `${year}-${String(month).padStart(2, '0')}-${totalDays}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: `${year}-${String(month).padStart(2, '0')}-10`,
        subtotal, tax, total,
        status: 'pendiente',
        notes: '',
      });

      details.forEach(d => store.saveInvoiceDetail(d));
      generated++;
    });

    closeModal();
    showToast(`${generated} factura(s) generada(s)`, generated > 0 ? 'success' : 'warning');
    renderInvoices([]);
  });
}

function renderInvoiceDetail(invoiceId) {
  const content = document.getElementById('page-content');
  const titleArea = document.getElementById('page-title-area');
  const inv = store.getInvoiceHeader(invoiceId);
  if (!inv) { content.innerHTML = '<div class="empty-state"><h3>Factura no encontrada</h3></div>'; return; }

  const guest = store.getGuest(inv.guestId);
  const room = store.getRoom(inv.roomId);
  const property = store.getProperty(inv.propertyId);
  const details = store.getInvoiceDetailsByInvoice(inv.id);
  const payments = store.getPaymentsByInvoice(inv.id);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const balance = Number(inv.total || 0) - totalPaid;

  if (titleArea) titleArea.innerHTML = `<h1>${inv.invoiceNumber}</h1><div class="breadcrumb"><a href="#/invoices">Facturación</a> / <span>${inv.invoiceNumber}</span></div>`;

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="detail-avatar" style="background:var(--neon);color:var(--bg-primary);font-weight:800">F</div>
        <div class="detail-info">
          <h1>${inv.invoiceNumber}</h1>
          <div class="detail-meta">
            <span><a href="#/guests/${guest?.id}">${guest?.firstName} ${guest?.lastName}</a></span>
            <span>${property?.name || ''} — ${room?.name || ''}</span>
            <span>${formatMonth(inv.month, inv.year)}</span>
            ${statusBadge(inv.status)}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="edit-invoice-btn"><span class="material-icons-outlined">edit</span>Editar</button>
        <button class="btn btn-primary" id="add-payment-btn"><span class="material-icons-outlined">payment</span>Registrar Pago</button>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800">${formatCurrency(inv.total)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Total Factura</div>
      </div>
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800;color:var(--neon)">${formatCurrency(totalPaid)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Total Pagado</div>
      </div>
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800;color:${balance > 0 ? 'var(--red-accent)' : 'var(--text-primary)'}">${formatCurrency(balance)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Saldo Pendiente</div>
      </div>
    </div>

    <div class="card mb-6 mt-6">
      <div class="card-header"><div class="card-title">Detalle de la Factura</div></div>
      <table>
        <thead><tr><th>Descripción</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th></tr></thead>
        <tbody>
          ${details.map(d => `<tr>
            <td>${d.description}</td>
            <td>${d.quantity}</td>
            <td>${formatCurrency(d.unitPrice)}</td>
            <td style="font-weight:600">${formatCurrency(d.total)}</td>
          </tr>`).join('')}
          <tr style="font-size:var(--text-lg);color:var(--neon);border-top:2px solid var(--border-medium)"><td colspan="3" style="text-align:right;font-weight:800">TOTAL COMPLETO</td><td style="font-weight:800">${formatCurrency(inv.total)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Pagos Registrados</div></div>
      <table>
        <thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th>Importe</th><th></th></tr></thead>
        <tbody>
          ${payments.map(p => `<tr>
            <td>${formatDate(p.paymentDate)}</td>
            <td>${p.paymentMethod}</td>
            <td>${p.reference || '—'}</td>
            <td style="font-weight:600;color:var(--neon)">${formatCurrency(p.amount)}</td>
            <td><button class="btn btn-sm btn-ghost delete-payment-btn" data-id="${p.id}"><span class="material-icons-outlined">delete</span></button></td>
          </tr>`).join('')}
          ${payments.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-tertiary);padding:var(--space-6)">Sin pagos registrados</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `;

  // Add payment
  document.getElementById('add-payment-btn')?.addEventListener('click', () => {
    const body = `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Importe (€)</label>
          <input class="form-input" type="number" step="0.01" id="pay-amount" value="${balance.toFixed(2)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input class="form-input" type="date" id="pay-date" value="${new Date().toISOString().split('T')[0]}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Método de Pago</label>
          <select class="form-select" id="pay-method">
            <option>Transferencia</option>
            <option>Efectivo</option>
            <option>Tarjeta</option>
            <option>Bizum</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Referencia</label>
          <input class="form-input" id="pay-ref" placeholder="Opcional" />
        </div>
      </div>
    `;
    const footer = `
      <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
      <button class="btn btn-primary" id="save-payment-btn">Registrar Pago</button>
    `;
    openModal('Registrar Pago', body, footer);

    document.getElementById('save-payment-btn').addEventListener('click', () => {
      const amount = parseFloat(document.getElementById('pay-amount').value);
      if (isNaN(amount) || amount <= 0) { showToast('Importe inválido', 'error'); return; }

      store.savePayment({
        invoiceId: inv.id,
        amount,
        paymentDate: document.getElementById('pay-date').value,
        paymentMethod: document.getElementById('pay-method').value,
        reference: document.getElementById('pay-ref').value.trim(),
        notes: '',
      });

      // Update invoice status
      const newTotalPaid = store.getTotalPaidForInvoice(inv.id);
      let newStatus = 'pendiente';
      if (newTotalPaid >= Number(inv.total || 0)) newStatus = 'pagada';
      else if (newTotalPaid > 0) newStatus = 'parcial';
      store.saveInvoiceHeader({ ...inv, status: newStatus });

      closeModal();
      showToast('Pago registrado');
      renderInvoiceDetail(invoiceId);
    });
  });

  // Delete payment
  content.querySelectorAll('.delete-payment-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (await confirmDialog('Eliminar Pago', '¿Está seguro?')) {
        store.deletePayment(btn.dataset.id);
        const newTotalPaid = store.getTotalPaidForInvoice(inv.id);
        let newStatus = 'pendiente';
        if (newTotalPaid >= inv.total) newStatus = 'pagada';
        else if (newTotalPaid > 0) newStatus = 'parcial';
        store.saveInvoiceHeader({ ...inv, status: newStatus });
        showToast('Pago eliminado');
        renderInvoiceDetail(invoiceId);
      }
    });
  });

  // Edit invoice
  document.getElementById('edit-invoice-btn')?.addEventListener('click', () => showEditInvoiceModal(inv));
}

function showEditInvoiceModal(inv) {
  const details = store.getInvoiceDetailsByInvoice(inv.id);
  let detailRows = details.map((d, i) => `
    <div class="invoice-edit-line" data-idx="${i}">
      <input class="form-input" value="${d.description}" id="ed-desc-${i}" style="flex:3" />
      <input class="form-input" type="number" value="${d.quantity}" id="ed-qty-${i}" style="flex:0.5" />
      <input class="form-input" type="number" step="0.01" value="${d.unitPrice}" id="ed-price-${i}" style="flex:1" />
      <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()"><span class="material-icons-outlined">close</span></button>
    </div>
  `).join('');

  const body = `
    <div style="margin-bottom:var(--space-4)">
      <div class="form-label" style="margin-bottom:var(--space-3)">Líneas de la Factura</div>
      <div id="invoice-lines" style="display:flex;flex-direction:column;gap:var(--space-2)">
        ${detailRows}
      </div>
      <button class="btn btn-sm btn-secondary mt-3" id="add-line-btn"><span class="material-icons-outlined">add</span> Añadir Línea</button>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Estado</label>
        <select class="form-select" id="ed-status">
          <option value="pendiente" ${inv.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="pagada" ${inv.status === 'pagada' ? 'selected' : ''}>Pagada</option>
          <option value="parcial" ${inv.status === 'parcial' ? 'selected' : ''}>Parcial</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha Vencimiento</label>
        <input class="form-input" type="date" id="ed-due" value="${inv.dueDate}" />
      </div>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    <button class="btn btn-danger" id="delete-invoice-btn">Eliminar</button>
    <button class="btn btn-primary" id="save-invoice-btn">Guardar</button>
  `;
  openModal('Editar Factura', body, footer, { large: true });

  let lineCounter = details.length;
  document.getElementById('add-line-btn').addEventListener('click', () => {
    const container = document.getElementById('invoice-lines');
    const div = document.createElement('div');
    div.className = 'invoice-edit-line';
    div.dataset.idx = lineCounter;
    div.innerHTML = `
      <input class="form-input" value="" id="ed-desc-${lineCounter}" style="flex:3" placeholder="Descripción" />
      <input class="form-input" type="number" value="1" id="ed-qty-${lineCounter}" style="flex:0.5" />
      <input class="form-input" type="number" step="0.01" value="0" id="ed-price-${lineCounter}" style="flex:1" />
      <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()"><span class="material-icons-outlined">close</span></button>
    `;
    container.appendChild(div);
    lineCounter++;
  });

  document.getElementById('save-invoice-btn').addEventListener('click', () => {
    // Delete old details
    store.deleteInvoiceDetailsByInvoice(inv.id);

    // Save new details
    const lines = document.querySelectorAll('.invoice-edit-line');
    let subtotal = 0;
    lines.forEach(line => {
      const idx = line.dataset.idx;
      const desc = document.getElementById(`ed-desc-${idx}`)?.value || '';
      const qty = parseFloat(document.getElementById(`ed-qty-${idx}`)?.value) || 1;
      const price = parseFloat(document.getElementById(`ed-price-${idx}`)?.value) || 0;
      const total = qty * price;
      subtotal += total;
      store.saveInvoiceDetail({
        invoiceId: inv.id,
        description: desc,
        quantity: qty,
        unitPrice: price,
        total,
      });
    });

    const tax = 0;
    const total = subtotal;

    store.saveInvoiceHeader({
      ...inv,
      subtotal, tax, total,
      status: document.getElementById('ed-status').value,
      dueDate: document.getElementById('ed-due').value,
    });

    closeModal();
    showToast('Factura actualizada');
    renderInvoiceDetail(inv.id);
  });

  document.getElementById('delete-invoice-btn').addEventListener('click', async () => {
    if (await confirmDialog('Eliminar Factura', '¿Está seguro? Se eliminarán también los pagos asociados.')) {
      store.deleteInvoiceDetailsByInvoice(inv.id);
      store.getPaymentsByInvoice(inv.id).forEach(p => store.deletePayment(p.id));
      store.deleteInvoiceHeader(inv.id);
      closeModal();
      showToast('Factura eliminada');
      navigate('/invoices');
    }
  });
}
