// ============================================================
// PROPERTIES Page
// ============================================================
import { store } from '../store.js';
import { navigate } from '../router.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { formatCurrency, generateId, statusBadge } from '../utils.js';

export function renderProperties(params) {
  if (params && params[0]) {
    return renderPropertyDetail(params[0]);
  }

  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Propiedades</h1><div class="breadcrumb"><span>Canary Management House</span> / Base de Datos de Propiedades</div>`;

  const content = document.getElementById('page-content');
  const properties = store.getProperties();
  const rooms = store.getRooms();

  content.innerHTML = `
    <div class="table-container">
      <div class="table-toolbar">
        <div class="table-toolbar-left">
          <div class="table-search">
            <span class="material-icons-outlined">search</span>
            <input type="text" id="property-search" placeholder="Buscar propiedad..." />
          </div>
        </div>
        <button class="btn btn-primary" id="add-property-btn">
          <span class="material-icons-outlined">add</span> Nueva Propiedad
        </button>
      </div>
      <table>
        <thead>
          <tr><th>Propiedad</th><th>Ciudad</th><th>Dirección</th><th>Habitaciones</th><th>Ocupación</th><th>Ingresos/Mes</th></tr>
        </thead>
        <tbody id="properties-tbody">
          ${properties.map(p => {
            const pRooms = rooms.filter(r => r.propertyId === p.id);
            const occupied = pRooms.filter(r => !!store.getActiveContractForRoom(r.id)).length;
            const monthlyRev = pRooms.filter(r => !!store.getActiveContractForRoom(r.id)).reduce((s, r) => s + Number(r.monthlyRent || 0), 0);
            return `<tr data-id="${p.id}" class="row-clickable">
              <td style="font-weight:600;color:var(--text-primary)">${p.name}</td>
              <td>${p.city}</td>
              <td>${p.address}</td>
              <td>${pRooms.length}</td>
              <td><span class="badge ${occupied === pRooms.length && pRooms.length > 0 ? 'badge-active' : 'badge-pending'}">${occupied}/${pRooms.length}</span></td>
              <td>${formatCurrency(monthlyRev)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${properties.length === 0 ? '<div class="table-empty"><span class="material-icons-outlined">domain</span><div>No hay propiedades registradas</div></div>' : ''}
    </div>
  `;

  // Search
  document.getElementById('property-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#properties-tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // Click row
  content.querySelectorAll('.row-clickable').forEach(row => {
    row.addEventListener('click', () => navigate('/properties/' + row.dataset.id));
  });

  // Add property
  document.getElementById('add-property-btn')?.addEventListener('click', () => showPropertyModal());
}

function showPropertyModal(property = null) {
  const isEdit = !!property;
  const body = `
    <div class="form-group">
      <label class="form-label">Nombre de la Propiedad</label>
      <input class="form-input" id="prop-name" value="${property?.name || ''}" placeholder="Ej: Villa Canaria" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Ciudad</label>
        <input class="form-input" id="prop-city" value="${property?.city || ''}" placeholder="Ej: Las Palmas" />
      </div>
      <div class="form-group">
        <label class="form-label">Dirección</label>
        <input class="form-input" id="prop-address" value="${property?.address || ''}" placeholder="Ej: Calle Triana 42" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Descripción</label>
      <textarea class="form-textarea" id="prop-desc" placeholder="Descripción opcional">${property?.description || ''}</textarea>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    <button class="btn btn-primary" id="save-property-btn">${isEdit ? 'Guardar Cambios' : 'Crear Propiedad'}</button>
  `;
  openModal(isEdit ? 'Editar Propiedad' : 'Nueva Propiedad', body, footer);

  document.getElementById('save-property-btn').addEventListener('click', () => {
    const name = document.getElementById('prop-name').value.trim();
    const city = document.getElementById('prop-city').value.trim();
    const address = document.getElementById('prop-address').value.trim();
    const description = document.getElementById('prop-desc').value.trim();

    if (!name || !city) {
      showToast('Complete los campos obligatorios', 'error');
      return;
    }

    store.saveProperty({
      id: property?.id || generateId(),
      name, city, address, description,
      totalRooms: property?.totalRooms || 0,
    });
    closeModal();
    showToast(isEdit ? 'Propiedad actualizada' : 'Propiedad creada');
    renderProperties([]);
  });
}

function renderPropertyDetail(propertyId) {
  const titleArea = document.getElementById('page-title-area');
  const content = document.getElementById('page-content');
  const property = store.getProperty(propertyId);

  if (!property) {
    content.innerHTML = '<div class="empty-state"><h3>Propiedad no encontrada</h3></div>';
    return;
  }

  const rooms = store.getRoomsByProperty(propertyId);
  const contracts = store.getContracts().filter(c => c.propertyId === propertyId);
  const occupied = rooms.filter(r => !!store.getActiveContractForRoom(r.id)).length;

  if (titleArea) titleArea.innerHTML = `<h1>${property.name}</h1><div class="breadcrumb"><a href="#/properties">Propiedades</a> / <span>${property.name}</span></div>`;

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-left">
        <div class="detail-avatar">${property.name.charAt(0)}</div>
        <div class="detail-info">
          <h1>${property.name}</h1>
          <div class="detail-meta">
            <span><span class="material-icons-outlined" style="font-size:16px">location_on</span>${property.address}, ${property.city}</span>
            <span><span class="material-icons-outlined" style="font-size:16px">bed</span>${rooms.length} habitaciones</span>
            <span class="badge ${occupied === rooms.length ? 'badge-active' : 'badge-pending'}">${occupied}/${rooms.length} ocupadas</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary" id="edit-property-btn"><span class="material-icons-outlined">edit</span>Editar</button>
        <button class="btn btn-primary" id="add-room-btn"><span class="material-icons-outlined">add</span>Añadir Habitación</button>
      </div>
    </div>

    <div class="table-container">
      <div class="table-toolbar">
        <div class="card-title"><span class="material-icons-outlined" style="font-size:18px;color:var(--neon);vertical-align:middle">bed</span> Habitaciones</div>
      </div>
      <table>
        <thead>
          <tr><th>Nombre</th><th>Rentable</th><th>Inventario</th><th>Planta</th><th>m²</th><th>Renta Sugerida</th><th>Estado</th><th>Huésped Actual</th><th></th></tr>
        </thead>
        <tbody>
          ${rooms.map(r => {
            const activeContract = store.getActiveContractForRoom(r.id);
            const guest = activeContract ? store.getGuest(activeContract.guestId) : null;
            return `<tr>
              <td style="font-weight:600">${r.name}</td>
              <td>${r.isRentable !== false ? '<span class="text-neon" style="font-weight:700">Sí</span>' : '<span class="text-muted">No</span>'}</td>
              <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.features || '—'}</td>
              <td>${r.floor || '—'}</td>
              <td>${r.size_sqm || '—'}</td>
              <td>${r.isRentable !== false ? formatCurrency(r.monthlyRent) : '—'}</td>
              <td>${r.isRentable !== false ? (activeContract ? '<span class="badge badge-active">Ocupada</span>' : '<span class="badge badge-available">Disponible</span>') : '<span class="text-muted">—</span>'}</td>
              <td>${guest ? `<a href="#/guests/${guest.id}">${guest.firstName} ${guest.lastName}</a>` : '<span class="text-muted">—</span>'}</td>
              <td>
                <button class="btn btn-sm btn-ghost edit-room-btn" data-id="${r.id}"><span class="material-icons-outlined">edit</span></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${rooms.length === 0 ? '<div class="table-empty"><span class="material-icons-outlined">bed</span><div>No hay habitaciones registradas</div></div>' : ''}
    </div>
  `;

  document.getElementById('edit-property-btn')?.addEventListener('click', () => {
    showPropertyModal(property);
  });

  document.getElementById('add-room-btn')?.addEventListener('click', () => showRoomModal(propertyId));

  content.querySelectorAll('.edit-room-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const room = store.getRoom(btn.dataset.id);
      showRoomModal(propertyId, room);
    });
  });
}

function showRoomModal(propertyId, room = null) {
  const isEdit = !!room;
  const body = `
    <div class="form-group">
      <label class="form-label">Nombre de la Habitación</label>
      <input class="form-input" id="room-name" value="${room?.name || ''}" placeholder="Ej: Suite Oceánica" />
    </div>
    <div class="form-row-3">
      <div class="form-group">
        <label class="form-label">Planta</label>
        <input class="form-input" id="room-floor" type="number" value="${room?.floor || ''}" placeholder="1" />
      </div>
      <div class="form-group">
        <label class="form-label">Superficie (m²)</label>
        <input class="form-input" id="room-size" type="number" value="${room?.size_sqm || ''}" placeholder="18" />
      </div>
      <div class="form-group">
        <label class="form-label form-checkbox">
          <input type="checkbox" id="room-is-rentable" ${room ? (room.isRentable !== false ? 'checked' : '') : 'checked'} />
          Habitación rentable (affittabile)
        </label>
      </div>
      <div class="form-group" id="rent-group" style="${room && room.isRentable === false ? 'display:none' : ''}">
        <label class="form-label">RENTA MENSUAL SUGERIDA(€)</label>
        <input class="form-input" id="room-rent" type="number" step="0.01" value="${room?.monthlyRent || ''}" placeholder="500" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Inventario (separado por comas)</label>
      <input class="form-input" id="room-features" value="${room?.features || ''}" placeholder="Cama, TV, Espejo, Armario..." />
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" onclick="document.getElementById('modal-close-btn').click()">Cancelar</button>
    ${isEdit ? '<button class="btn btn-danger" id="delete-room-btn">Eliminar</button>' : ''}
    <button class="btn btn-primary" id="save-room-btn">${isEdit ? 'Guardar' : 'Crear'}</button>
  `;
  openModal(isEdit ? 'Editar Habitación' : 'Nueva Habitación', body, footer);

  setTimeout(() => {
    document.getElementById('room-is-rentable')?.addEventListener('change', (e) => {
      document.getElementById('rent-group').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('save-room-btn').addEventListener('click', () => {
      const name = document.getElementById('room-name').value.trim();
      const isRentable = document.getElementById('room-is-rentable').checked;
      const rent = isRentable ? parseFloat(document.getElementById('room-rent').value) : 0;
      const features = document.getElementById('room-features').value.trim();

      if (!name || (isRentable && isNaN(rent))) {
        showToast('Complete nombre y renta', 'error');
        return;
      }
      store.saveRoom({
        id: room?.id || generateId(),
        propertyId,
        name,
        floor: parseInt(document.getElementById('room-floor').value) || 1,
        size_sqm: parseInt(document.getElementById('room-size').value) || 0,
        monthlyRent: rent,
        isRentable,
        features,
      });
      closeModal();
      showToast(isEdit ? 'Habitación actualizada' : 'Habitación creada');
      renderPropertyDetail(propertyId);
    });

    document.getElementById('delete-room-btn')?.addEventListener('click', () => {
      store.deleteRoom(room.id);
      closeModal();
      showToast('Habitación eliminada');
      renderPropertyDetail(propertyId);
    });
  }, 0);
}

export { renderPropertyDetail };
