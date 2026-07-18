// ============================================================
// CONTRACTS Page
// ============================================================
import { store } from '../store.js';
import { navigate } from '../router.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { generateId, formatCurrency, formatDate, statusBadge } from '../utils.js';

function getContractStatus(c) {
  const start = new Date(c.startDate).setHours(0,0,0,0);
  const end = new Date(c.earlyTermination && c.actualEndDate ? c.actualEndDate : c.endDate).setHours(23,59,59,999);
  const now = new Date().getTime();
  if (now < start) return 'pendiente';
  if (now > end) return 'vencido';
  return 'activo';
}

export function renderContracts(params) {
  if (params && params[0]) return renderContractDetail(params[0]);

  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Contratos</h1><div class="breadcrumb"><span>Canary Management House</span> / Gestión de Contratos</div>`;

  const content = document.getElementById('page-content');
  const contracts = store.getContracts();
  const properties = store.getProperties();

  content.innerHTML = `
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="contract-search" placeholder="Buscar contrato..." />
          </div>
          <select class="table-filter" id="contract-status-filter">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="vencido">Vencido</option>
            <option value="pendiente">Pendiente</option>
          </select>
          <select class="table-filter" id="contract-property-filter">
            <option value="">Todas las propiedades</option>
            ${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="add-contract-btn">
          <span class="material-icons-outlined">post_add</span> Nuevo Contrato
        </button>
      </div>
      <table>
        <thead>
          <tr><th>Huésped</th><th>Propiedad</th><th>Habitación</th><th>Inicio</th><th>Fin</th><th>Renta</th><th>Franquicia</th><th>Estado</th></tr>
        </thead>
        <tbody id="contracts-tbody">
          ${contracts.map(c => {
            const guest = store.getGuest(c.guestId);
            const room = store.getRoom(c.roomId);
            const property = store.getProperty(c.propertyId || room?.propertyId);
            return `<tr data-id="${c.id}" class="row-clickable" data-status="${getContractStatus(c)}" data-property="${c.propertyId || room?.propertyId || ''}">
              <td style="font-weight:600">${guest?.firstName || ''} ${guest?.lastName || ''}</td>
              <td>${property?.name || '—'}</td>
              <td>${room?.name || '—'}</td>
              <td>${formatDate(c.startDate)}</td>
              <td>${formatDate(c.endDate)}</td>
              <td>${formatCurrency(c.monthlyRent)}</td>
              <td>${formatCurrency(c.franchise || 0)}</td>
              <td>${statusBadge(getContractStatus(c))}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  const filterContracts = () => {
    const q = document.getElementById('contract-search')?.value.toLowerCase() || '';
    const status = document.getElementById('contract-status-filter')?.value || '';
    const propId = document.getElementById('contract-property-filter')?.value || '';
    document.querySelectorAll('#contracts-tbody tr').forEach(row => {
      const matchText = row.textContent.toLowerCase().includes(q);
      const matchStatus = !status || row.dataset.status === status;
      const matchProp = !propId || row.dataset.property === propId;
      row.style.display = matchText && matchStatus && matchProp ? '' : 'none';
    });
  };
  document.getElementById('contract-search')?.addEventListener('input', filterContracts);
  document.getElementById('contract-status-filter')?.addEventListener('change', filterContracts);
  document.getElementById('contract-property-filter')?.addEventListener('change', filterContracts);

  content.querySelectorAll('.row-clickable').forEach(row => {
    row.addEventListener('click', () => navigate('/contracts/' + row.dataset.id));
  });

  document.getElementById('add-contract-btn')?.addEventListener('click', () => showContractModal());
}

export function showContractModal(contract = null) {
  const isEdit = !!contract;
  const guests = store.getGuests();
  const properties = store.getProperties();
  const rooms = store.getRooms();

  const body = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Huésped</label>
        <select class="form-select" id="c-guest">
          <option value="">Seleccionar...</option>
          ${guests.map(g => `<option value="${g.id}" ${contract?.guestId === g.id ? 'selected' : ''}>${g.firstName} ${g.lastName}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Propiedad</label>
        <select class="form-select" id="c-property">
          <option value="">Seleccionar...</option>
          ${properties.map(p => `<option value="${p.id}" ${contract?.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Habitación</label>
      <select class="form-select" id="c-room">
        <option value="">Seleccionar propiedad primero...</option>
        ${contract ? rooms.filter(r => r.propertyId === contract.propertyId && r.isRentable !== false).map(r => `<option value="${r.id}" ${contract.roomId === r.id ? 'selected' : ''}>${r.name} - ${formatCurrency(r.monthlyRent)}/mes (${store.getActiveContractForRoom(r.id) ? 'Ocupada' : 'Disponible'})</option>`).join('') : ''}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Fecha Inicio</label>
        <input class="form-input" type="date" id="c-start" value="${contract?.startDate || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Fecha Fin</label>
        <input class="form-input" type="date" id="c-end" value="${contract?.endDate || ''}" />
      </div>
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Renta Mensual (€)</label>
        <input class="form-input" type="number" step="0.01" id="c-rent" value="${contract?.monthlyRent || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Depósito (€)</label>
        <input class="form-input" type="number" step="0.01" id="c-deposit" value="${contract?.deposit || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Franquicia Costos (€)</label>
        <input class="form-input" type="number" step="0.01" id="c-franchise" value="${contract?.franchise || '0'}" placeholder="0" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label form-checkbox" style="margin-top:2rem">
          <input type="checkbox" id="c-early" ${contract?.earlyTermination ? 'checked' : ''} />
          Terminación anticipada
        </label>
      </div>
      <div class="form-group" id="c-actual-end-group" style="display: ${contract?.earlyTermination ? 'block' : 'none'}">
        <label class="form-label">Fecha Fin Real</label>
        <input class="form-input" type="date" id="c-actual-end" value="${contract?.actualEndDate || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="c-notes">${contract?.notes || ''}</textarea>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    ${isEdit ? '<button class="btn btn-danger" id="delete-contract-btn">Eliminar</button>' : ''}
    <button class="btn btn-primary" id="save-contract-btn">${isEdit ? 'Guardar' : 'Crear Contrato'}</button>
  `;
  openModal(isEdit ? 'Editar Contrato' : 'Nuevo Contrato', body, footer, { large: true });

  // Dynamic room loading when property changes
  document.getElementById('c-property').addEventListener('change', (e) => {
    const propId = e.target.value;
    const propRooms = rooms.filter(r => r.propertyId === propId && r.isRentable !== false);
    const roomSelect = document.getElementById('c-room');
    roomSelect.innerHTML = '<option value="">Seleccionar habitación...</option>' + propRooms.map(r => `<option value="${r.id}">${r.name} - ${formatCurrency(r.monthlyRent)}/mes (${store.getActiveContractForRoom(r.id) ? 'Ocupada' : 'Disponible'})</option>`).join('');
  });

  // Auto-fill rent and deposit when room selected
  document.getElementById('c-room').addEventListener('change', (e) => {
    const room = store.getRoom(e.target.value);
    if (room) {
      document.getElementById('c-rent').value = room.monthlyRent;
      document.getElementById('c-deposit').value = room.monthlyRent;
    }
  });

  document.getElementById('c-early').addEventListener('change', (e) => {
    document.getElementById('c-actual-end-group').style.display = e.target.checked ? 'block' : 'none';
  });

  document.getElementById('save-contract-btn').addEventListener('click', () => {
    const guestId = document.getElementById('c-guest').value;
    const propertyId = document.getElementById('c-property').value;
    const roomId = document.getElementById('c-room').value;
    if (!guestId || !roomId || !propertyId) { showToast('Seleccione huésped, propiedad y habitación', 'error'); return; }

    const startDate = document.getElementById('c-start').value;
    const endDate = document.getElementById('c-end').value;
    if (!startDate || !endDate) { showToast('Fechas requeridas', 'error'); return; }

    const earlyTerm = document.getElementById('c-early').checked;
    const actualEndDate = document.getElementById('c-actual-end').value;

    const start = new Date(startDate).setHours(0,0,0,0);
    const end = new Date(earlyTerm && actualEndDate ? actualEndDate : endDate).setHours(23,59,59,999);
    
    if (end < start) { showToast('Fecha fin debe ser mayor a fecha inicio', 'error'); return; }

    const existing = store.getContractsByRoom(roomId).filter(c => c.id !== contract?.id);
    const overlaps = existing.some(c => {
      const cStart = new Date(c.startDate).setHours(0,0,0,0);
      const cEnd = new Date(c.earlyTermination && c.actualEndDate ? c.actualEndDate : c.endDate).setHours(23,59,59,999);
      return (start <= cEnd && end >= cStart);
    });

    if (overlaps) { showToast('La habitación ya está ocupada en esas fechas', 'error'); return; }

    const tempContract = { startDate, endDate, earlyTermination: earlyTerm, actualEndDate: earlyTerm ? actualEndDate : null };
    const status = getContractStatus(tempContract);

    store.saveContract({
      id: contract?.id || generateId(),
      guestId, roomId, propertyId,
      startDate, endDate,
      earlyTermination: earlyTerm,
      actualEndDate: earlyTerm ? actualEndDate : null,
      monthlyRent: parseFloat(document.getElementById('c-rent').value) || 0,
      deposit: parseFloat(document.getElementById('c-deposit').value) || 0,
      franchise: parseFloat(document.getElementById('c-franchise').value) || 0,
      status,
      notes: document.getElementById('c-notes').value.trim(),
    });

    closeModal();
    showToast(isEdit ? 'Contrato actualizado' : 'Contrato creado');
    renderContracts([]);
  });

  document.getElementById('delete-contract-btn')?.addEventListener('click', async () => {
    if (await confirmDialog('Eliminar Contrato', '¿Está seguro de eliminar este contrato?')) {
      store.deleteContract(contract.id);
      showToast('Contrato eliminado');
      renderContracts([]);
    }
  });
}

function renderContractDetail(contractId) {
  const content = document.getElementById('page-content');
  const titleArea = document.getElementById('page-title-area');
  const contract = store.getContract(contractId);
  if (!contract) { content.innerHTML = '<div class="empty-state"><h3>Contrato no encontrado</h3></div>'; return; }

  const guest = store.getGuest(contract.guestId);
  const room = store.getRoom(contract.roomId);
  const property = store.getProperty(contract.propertyId || room?.propertyId);
  const invoices = store.getInvoiceHeaders().filter(i => i.contractId === contractId);

  if (titleArea) titleArea.innerHTML = `<h1>Contrato</h1><div class="breadcrumb"><a href="#/contracts">Contratos</a> / <span>${guest?.firstName} ${guest?.lastName}</span></div>`;

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="detail-avatar">${guest?.firstName?.charAt(0) || ''}${guest?.lastName?.charAt(0) || ''}</div>
        <div class="detail-info">
          <h1>${guest?.firstName} ${guest?.lastName}</h1>
          <div class="detail-meta">
            <span>${property?.name || ''} — ${room?.name || ''}</span>
            <span>${formatDate(contract.startDate)} → ${formatDate(contract.earlyTermination && contract.actualEndDate ? contract.actualEndDate : contract.endDate)}</span>
            ${statusBadge(getContractStatus(contract))}
          </div>
        </div>
      </div>
      <button class="btn btn-secondary" id="edit-contract-btn"><span class="material-icons-outlined">edit</span>Editar</button>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800;color:var(--text-primary)">${formatCurrency(contract.monthlyRent)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Renta Mensual</div>
      </div>
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800;color:var(--text-primary)">${formatCurrency(contract.deposit)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Depósito</div>
      </div>
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800;color:var(--neon)">${formatCurrency(contract.franchise || 0)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Franquicia Costos</div>
      </div>
      <div class="card" style="text-align:center;padding:var(--space-5)">
        <div style="font-size:var(--text-2xl);font-weight:800;color:var(--text-primary)">${invoices.length}</div>
        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">Facturas Emitidas</div>
      </div>
    </div>

    <div class="card mt-6">
      <div class="card-header">
        <div class="card-title">Facturas del Contrato</div>
      </div>
      <table>
        <thead><tr><th>Nº</th><th>Período</th><th>Total</th><th>Pagado</th><th>Estado</th></tr></thead>
        <tbody>
          ${invoices.map(inv => {
            const paid = store.getTotalPaidForInvoice(inv.id);
            return `<tr class="row-clickable" data-path="/invoices/${inv.id}">
              <td>${inv.invoiceNumber}</td>
              <td>${formatDate(inv.periodStart)} - ${formatDate(inv.periodEnd)}</td>
              <td>${formatCurrency(inv.total)}</td>
              <td>${formatCurrency(paid)}</td>
              <td>${statusBadge(inv.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('edit-contract-btn')?.addEventListener('click', () => showContractModal(contract));
  content.querySelectorAll('.row-clickable').forEach(row => {
    row.addEventListener('click', () => navigate(row.dataset.path));
  });
}
