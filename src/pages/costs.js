// ============================================================
// COSTS Page — Header + Details with charge status
// ============================================================
import { store } from '../store.js';
import { navigate } from '../router.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { generateId, formatCurrency, costTypeLabel, statusBadge, formatMonth } from '../utils.js';

export function renderCosts() {
  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Costos</h1><div class="breadcrumb"><span>Canary Management House</span> / Gestión de Costos</div>`;

  const content = document.getElementById('page-content');
  const properties = store.getProperties();
  const costsHeaders = store.getCostsHeaders();

  // Available months/years
  const periods = [...new Set(costsHeaders.map(c => `${c.year}-${String(c.month).padStart(2, '0')}`))].sort().reverse();
  const currentPeriod = periods[0] || '';

  content.innerHTML = `
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <select class="table-filter" id="cost-property-filter">
            <option value="">Todas las propiedades</option>
            ${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <select class="table-filter" id="cost-period-filter">
            <option value="">Todos los períodos</option>
            ${periods.map(p => {
              const [y, m] = p.split('-');
              return `<option value="${p}">${formatMonth(parseInt(m), parseInt(y))}</option>`;
            }).join('')}
          </select>
          <select class="table-filter" id="cost-type-filter">
            <option value="">Todos los tipos</option>
            <option value="electricity">Electricidad</option>
            <option value="water">Agua</option>
            <option value="internet">Internet</option>
            <option value="gas">Gas</option>
            <option value="cleaning">Limpieza</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <button class="btn btn-primary" id="add-cost-btn">
          <span class="material-icons-outlined">add</span> Nuevo Costo
        </button>
      </div>
      <table>
        <thead>
          <tr><th>Propiedad</th><th>Tipo</th><th>Importe</th><th>Período</th><th>Estado Cobro</th><th></th></tr>
        </thead>
        <tbody id="costs-tbody">
          ${costsHeaders.map(c => {
            const property = store.getProperty(c.propertyId);
            const generatedInvoices = store.getInvoiceHeaders().filter(i => i.propertyId === c.propertyId && i.month === c.month && i.year === c.year);
            const isBilled = generatedInvoices.length > 0;
            const rooms = store.getRoomsByProperty(c.propertyId);
            const activeRooms = rooms.filter(r => !!store.getActiveContractForRoom(r.id)).length;

            let chargeStatus = 'por_cobrar';
            if (!c.chargeToGuests) {
              chargeStatus = 'no_cobrar';
            } else if (isBilled && activeRooms === rooms.length) {
              chargeStatus = 'cobrado';
            } else if (isBilled && activeRooms > 0) {
              chargeStatus = 'parcial';
            }

            return `<tr data-id="${c.id}" class="row-clickable" data-property="${c.propertyId}" data-period="${c.year}-${String(c.month).padStart(2, '0')}" data-type="${c.costType}">
              <td style="font-weight:600">${property?.name || '—'}</td>
              <td>${costTypeLabel(c.costType)}</td>
              <td>${formatCurrency(c.amount)}</td>
              <td>${formatMonth(c.month, c.year)}</td>
              <td>${statusBadge(chargeStatus)}</td>
              <td><button class="btn btn-sm btn-ghost edit-cost-btn" data-id="${c.id}"><span class="material-icons-outlined">edit</span></button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="card mt-6" id="cost-summary">
      <div class="card-header">
        <div class="card-title"><span class="material-icons-outlined" style="font-size:18px;color:var(--neon)">summarize</span> Resumen por Propiedad</div>
      </div>
      <div id="cost-summary-content"></div>
    </div>
  `;

  updateCostSummary();

  const filterCosts = () => {
    const prop = document.getElementById('cost-property-filter')?.value || '';
    const period = document.getElementById('cost-period-filter')?.value || '';
    const type = document.getElementById('cost-type-filter')?.value || '';
    document.querySelectorAll('#costs-tbody tr').forEach(row => {
      const matchProp = !prop || row.dataset.property === prop;
      const matchPeriod = !period || row.dataset.period === period;
      const matchType = !type || row.dataset.type === type;
      row.style.display = matchProp && matchPeriod && matchType ? '' : 'none';
    });
  };
  document.getElementById('cost-property-filter')?.addEventListener('change', filterCosts);
  document.getElementById('cost-period-filter')?.addEventListener('change', filterCosts);
  document.getElementById('cost-type-filter')?.addEventListener('change', filterCosts);

  document.getElementById('add-cost-btn')?.addEventListener('click', () => showCostModal());

  content.querySelectorAll('.edit-cost-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cost = store.getCostHeader(btn.dataset.id);
      showCostModal(cost);
    });
  });
}

function updateCostSummary() {
  const summaryEl = document.getElementById('cost-summary-content');
  if (!summaryEl) return;
  const properties = store.getProperties();
  const rooms = store.getRooms();

  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4)">';
  properties.forEach(p => {
    const pRooms = rooms.filter(r => r.propertyId === p.id);
    const costs = store.getCostsByProperty(p.id);
    const total = costs.reduce((s, c) => s + c.amount, 0);
    const byType = {};
    costs.forEach(c => {
      byType[c.costType] = (byType[c.costType] || 0) + c.amount;
    });

    html += `<div style="background:var(--bg-surface-2);border-radius:var(--radius-md);padding:var(--space-4)">
      <div style="font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3)">${p.name}</div>
      ${Object.entries(byType).map(([type, amount]) => `
        <div class="cost-line"><span>${costTypeLabel(type)}</span><span>${formatCurrency(amount)}</span></div>
      `).join('')}
      <div class="cost-line" style="border-top:1px solid var(--border-medium);margin-top:var(--space-2);padding-top:var(--space-2);font-weight:700;color:var(--neon)">
        <span>Total</span><span>${formatCurrency(total)}</span>
      </div>
      <div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-2)">${pRooms.length} habitaciones</div>
    </div>`;
  });
  html += '</div>';
  summaryEl.innerHTML = html;
}

function showCostModal(cost = null) {
  const isEdit = !!cost;
  const properties = store.getProperties();
  const now = new Date();

  const body = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Propiedad</label>
        <select class="form-select" id="cost-property">
          <option value="">Seleccionar...</option>
          ${properties.map(p => `<option value="${p.id}" ${cost?.propertyId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de Costo</label>
        <select class="form-select" id="cost-type">
          <option value="electricity" ${cost?.costType === 'electricity' ? 'selected' : ''}>Electricidad</option>
          <option value="water" ${cost?.costType === 'water' ? 'selected' : ''}>Agua</option>
          <option value="internet" ${cost?.costType === 'internet' ? 'selected' : ''}>Internet</option>
          <option value="gas" ${cost?.costType === 'gas' ? 'selected' : ''}>Gas</option>
          <option value="cleaning" ${cost?.costType === 'cleaning' ? 'selected' : ''}>Limpieza</option>
          <option value="maintenance" ${cost?.costType === 'maintenance' ? 'selected' : ''}>Mantenimiento</option>
          <option value="other" ${cost?.costType === 'other' ? 'selected' : ''}>Otro</option>
        </select>
      </div>
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Importe (€)</label>
        <input class="form-input" type="number" step="0.01" id="cost-amount" value="${cost?.amount || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Mes</label>
        <select class="form-select" id="cost-month">
          ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}" ${(cost?.month || now.getMonth()+1) === m ? 'selected' : ''}>${new Date(2024, m-1).toLocaleDateString('es-ES', {month:'long'})}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Año</label>
        <input class="form-input" type="number" id="cost-year" value="${cost?.year || now.getFullYear()}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label form-checkbox" style="margin-top:2rem">
        <input type="checkbox" id="cost-charge-status" ${cost ? (cost.chargeToGuests ? 'checked' : '') : 'checked'} />
        Cobrar a los huéspedes
      </label>
    </div>
    <div class="form-group">
      <label class="form-label">Descripción (opcional)</label>
      <input class="form-input" id="cost-desc" value="${cost?.description || ''}" />
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    ${isEdit ? '<button class="btn btn-danger" id="delete-cost-btn">Eliminar</button>' : ''}
    <button class="btn btn-primary" id="save-cost-btn">${isEdit ? 'Guardar' : 'Crear Costo'}</button>
  `;
  openModal(isEdit ? 'Editar Costo' : 'Nuevo Costo', body, footer);

  document.getElementById('save-cost-btn').addEventListener('click', () => {
    const propertyId = document.getElementById('cost-property').value;
    const amount = parseFloat(document.getElementById('cost-amount').value);
    if (!propertyId || isNaN(amount)) { showToast('Complete propiedad e importe', 'error'); return; }

    const costId = cost?.id || generateId();
    store.saveCostHeader({
      id: costId, propertyId,
      costType: document.getElementById('cost-type').value,
      amount,
      month: parseInt(document.getElementById('cost-month').value),
      year: parseInt(document.getElementById('cost-year').value),
      chargeToGuests: document.getElementById('cost-charge-status').checked,
      description: document.getElementById('cost-desc').value.trim(),
    });

    closeModal();
    showToast(isEdit ? 'Costo actualizado' : 'Costo creado');
    renderCosts();
  });

  document.getElementById('delete-cost-btn')?.addEventListener('click', () => {
    store.deleteCostHeader(cost.id);
    closeModal();
    showToast('Costo eliminado');
    renderCosts();
  });
}
