// ============================================================
// GUESTS Page
// ============================================================
import { store } from '../store.js';
import { navigate } from '../router.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { generateId, formatCurrency, formatDate, statusBadge } from '../utils.js';

export function renderGuests(params) {
  if (params && params[0]) return renderGuestDetail(params[0]);

  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Huéspedes</h1><div class="breadcrumb"><span>Canary Management House</span> / Base de Datos de Huéspedes</div>`;

  const content = document.getElementById('page-content');
  const guests = store.getGuests();

  content.innerHTML = `
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="guest-search" placeholder="Buscar por nombre, apellido, email..." />
          </div>
          <select class="table-filter" id="guest-nationality-filter">
            <option value="">Todas las nacionalidades</option>
            ${[...new Set(guests.map(g => g.nationality).filter(Boolean))].sort().map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="add-guest-btn">
          <span class="material-icons-outlined">person_add</span> Nuevo Huésped
        </button>
      </div>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Nacionalidad</th><th>Documento</th><th>Empadronado</th><th>Contratos</th></tr>
        </thead>
        <tbody id="guests-tbody">
          ${guests.map(g => {
            const contracts = store.getContractsByGuest(g.id);
            const activeContracts = contracts.filter(c => c.status === 'activo').length;
            return `<tr data-id="${g.id}" class="row-clickable" data-nationality="${g.nationality || ''}">
              <td style="font-weight:600;color:var(--text-primary)">${g.firstName} ${g.lastName}</td>
              <td>${g.email || '—'}</td>
              <td>${g.phone || '—'}</td>
              <td>${g.nationality || '—'}</td>
              <td>${g.documentNumber || '—'}</td>
              <td>${g.empadronado ? '<span class="text-neon">Sí</span>' : '<span class="text-muted">No</span>'}</td>
              <td><span class="badge ${activeContracts > 0 ? 'badge-active' : 'badge-available'}">${activeContracts} activos</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${guests.length === 0 ? '<div class="table-empty"><span class="material-icons-outlined">group</span><div>No hay huéspedes registrados</div></div>' : ''}
    </div>
  `;

  // Search & filter
  const filterGuests = () => {
    const q = document.getElementById('guest-search')?.value.toLowerCase() || '';
    const nat = document.getElementById('guest-nationality-filter')?.value || '';
    document.querySelectorAll('#guests-tbody tr').forEach(row => {
      const matchText = row.textContent.toLowerCase().includes(q);
      const matchNat = !nat || row.dataset.nationality === nat;
      row.style.display = matchText && matchNat ? '' : 'none';
    });
  };
  document.getElementById('guest-search')?.addEventListener('input', filterGuests);
  document.getElementById('guest-nationality-filter')?.addEventListener('change', filterGuests);

  content.querySelectorAll('.row-clickable').forEach(row => {
    row.addEventListener('click', () => navigate('/guests/' + row.dataset.id));
  });

  document.getElementById('add-guest-btn')?.addEventListener('click', () => showGuestModal());
}

function showGuestModal(guest = null) {
  const isEdit = !!guest;
  const body = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Nombre</label>
        <input class="form-input" id="g-fname" value="${guest?.firstName || ''}" placeholder="Marco" />
      </div>
      <div class="form-group">
        <label class="form-label">Apellido</label>
        <input class="form-input" id="g-lname" value="${guest?.lastName || ''}" placeholder="Rossi" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="g-email" type="email" value="${guest?.email || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input class="form-input" id="g-phone" value="${guest?.phone || ''}" />
      </div>
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Tipo Documento</label>
        <select class="form-select" id="g-doctype">
          <option ${guest?.documentType === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
          <option ${guest?.documentType === 'DNI' ? 'selected' : ''}>DNI</option>
          <option ${guest?.documentType === 'NIE' ? 'selected' : ''}>NIE</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Nº Documento</label>
        <input class="form-input" id="g-docnum" value="${guest?.documentNumber || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Nacionalidad</label>
        <input class="form-input" id="g-nationality" value="${guest?.nationality || ''}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Fecha Nacimiento</label>
        <input class="form-input" id="g-dob" type="date" value="${guest?.dateOfBirth || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label form-checkbox" style="margin-top: 2rem;">
          <input type="checkbox" id="g-empadronado" ${guest?.empadronado ? 'checked' : ''} />
          Empadronado
        </label>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <input class="form-input" id="g-notes" value="${guest?.notes || ''}" />
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    <button class="btn btn-primary" id="save-guest-btn">${isEdit ? 'Guardar' : 'Crear'}</button>
  `;
  openModal(isEdit ? 'Editar Huésped' : 'Nuevo Huésped', body, footer);

  document.getElementById('save-guest-btn').addEventListener('click', () => {
    const firstName = document.getElementById('g-fname').value.trim();
    const lastName = document.getElementById('g-lname').value.trim();
    if (!firstName || !lastName) { showToast('Nombre y apellido requeridos', 'error'); return; }
    store.saveGuest({
      id: guest?.id || generateId(),
      firstName, lastName,
      email: document.getElementById('g-email').value.trim(),
      phone: document.getElementById('g-phone').value.trim(),
      documentType: document.getElementById('g-doctype').value,
      documentNumber: document.getElementById('g-docnum').value.trim(),
      nationality: document.getElementById('g-nationality').value.trim(),
      dateOfBirth: document.getElementById('g-dob').value,
      empadronado: document.getElementById('g-empadronado').checked,
      notes: document.getElementById('g-notes').value.trim(),
    });
    closeModal();
    showToast(isEdit ? 'Huésped actualizado' : 'Huésped creado');
    renderGuests([]);
  });
}

function renderGuestDetail(guestId) {
  const content = document.getElementById('page-content');
  const titleArea = document.getElementById('page-title-area');
  const guest = store.getGuest(guestId);
  if (!guest) { content.innerHTML = '<div class="empty-state"><h3>Huésped no encontrado</h3></div>'; return; }

  const contracts = store.getContractsByGuest(guestId);
  const invoices = store.getInvoicesByGuest(guestId);
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(store.getTotalPaidForInvoice(i.id) || 0), 0);

  if (titleArea) titleArea.innerHTML = `<h1>${guest.firstName} ${guest.lastName}</h1><div class="breadcrumb"><a href="#/guests">Huéspedes</a> / <span>${guest.firstName} ${guest.lastName}</span></div>`;

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="detail-avatar">${guest.firstName.charAt(0)}${guest.lastName.charAt(0)}</div>
        <div class="detail-info">
          <h1>${guest.firstName} ${guest.lastName}</h1>
          <div class="detail-meta">
            <span><span class="material-icons-outlined" style="font-size:16px">email</span>${guest.email || '—'}</span>
            <span><span class="material-icons-outlined" style="font-size:16px">phone</span>${guest.phone || '—'}</span>
            <span><span class="material-icons-outlined" style="font-size:16px">flag</span>${guest.nationality || '—'}</span>
            <span><span class="material-icons-outlined" style="font-size:16px">home</span>Empadronado: ${guest.empadronado ? '<span class="text-neon fw-bold">Sí</span>' : '<span class="text-muted fw-bold">No</span>'}</span>
          </div>
        </div>
      </div>
      <button class="btn btn-secondary" id="edit-guest-btn"><span class="material-icons-outlined">edit</span>Editar</button>
    </div>

    <div class="invoice-summary mb-6">
      <div class="invoice-summary-item">
        <div class="invoice-summary-value">${contracts.filter(c => c.status === 'activo').length}</div>
        <div class="invoice-summary-label">Contratos Activos</div>
      </div>
      <div class="invoice-summary-item">
        <div class="invoice-summary-value">${formatCurrency(totalInvoiced)}</div>
        <div class="invoice-summary-label">Total Facturado</div>
      </div>
      <div class="invoice-summary-item">
        <div class="invoice-summary-value text-${totalInvoiced - totalPaid > 0 ? 'red' : 'neon'}">${formatCurrency(totalInvoiced - totalPaid)}</div>
        <div class="invoice-summary-label">Saldo Pendiente</div>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header">
        <div class="card-title"><span class="material-icons-outlined" style="font-size:18px;color:var(--neon)">description</span> Contratos</div>
      </div>
      <table>
        <thead><tr><th>Habitación</th><th>Inicio</th><th>Fin</th><th>Renta</th><th>Estado</th></tr></thead>
        <tbody>
          ${contracts.map(c => {
            const room = store.getRoom(c.roomId);
            return `<tr class="row-clickable" data-path="/contracts/${c.id}">
              <td>${room?.name || '—'}</td>
              <td>${formatDate(c.startDate)}</td>
              <td>${formatDate(c.endDate)}</td>
              <td>${formatCurrency(c.monthlyRent)}</td>
              <td>${statusBadge(c.status)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title"><span class="material-icons-outlined" style="font-size:18px;color:var(--neon)">receipt</span> Facturas</div>
      </div>
      <table>
        <thead><tr><th>Nº Factura</th><th>Período</th><th>Total</th><th>Pagado</th><th>Estado</th></tr></thead>
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

  document.getElementById('edit-guest-btn')?.addEventListener('click', () => showGuestModal(guest));
  content.querySelectorAll('.row-clickable').forEach(row => {
    row.addEventListener('click', () => navigate(row.dataset.path));
  });
}

export { showGuestModal };
