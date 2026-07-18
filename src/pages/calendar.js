// ============================================================
// CALENDAR Page — Room occupancy per property
// ============================================================
import { store } from '../store.js';
import { navigate } from '../router.js';
import { daysInMonth, getMonthName } from '../utils.js';
import { showContractModal } from './contracts.js';

export function renderCalendar() {
  const titleArea = document.getElementById('page-title-area');
  if (titleArea) titleArea.innerHTML = `<h1>Calendario</h1><div class="breadcrumb"><span>Canary Management House</span> / Planificación</div>`;

  const content = document.getElementById('page-content');
  const properties = store.getProperties();

  const now = new Date();
  let currentMonth = now.getMonth(); // 0–11
  let currentYear = now.getFullYear();

  function render() {
    const totalDays = daysInMonth(currentMonth + 1, currentYear);
    const monthName = getMonthName(currentMonth + 1);

    content.innerHTML = `
      <div class="calendar-header">
        <button class="btn btn-sm btn-ghost" id="cal-prev"><span class="material-icons-outlined">chevron_left</span></button>
        <div class="calendar-month-title">${monthName} ${currentYear}</div>
        <button class="btn btn-sm btn-ghost" id="cal-next"><span class="material-icons-outlined">chevron_right</span></button>
      </div>

      <div class="form-group" style="max-width:300px;margin-bottom:var(--space-6)">
        <select class="form-select" id="cal-property-filter">
          <option value="">Todas las propiedades</option>
          ${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>

      <div id="calendar-grid">
        ${properties.map(prop => {
          const rooms = store.getRoomsByProperty(prop.id);
          return `
            <div class="card mb-6 cal-property-group" data-property="${prop.id}">
              <div class="card-header">
                <div class="card-title">
                  <span class="material-icons-outlined" style="font-size:18px;color:var(--neon)">domain</span>
                  ${prop.name}
                </div>
                <div class="card-subtitle">${rooms.length} habitaciones</div>
              </div>
              <div class="calendar-table-wrapper">
                <table class="calendar-table">
                  <thead>
                    <tr>
                      <th class="cal-room-header" style="min-width:140px;position:sticky;left:0;background:var(--bg-surface-1);z-index:2">Habitación</th>
                      ${Array.from({length: totalDays}, (_, i) => {
                        const day = i + 1;
                        const date = new Date(currentYear, currentMonth, day);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();
                        return `<th class="cal-day-header ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">${day}</th>`;
                      }).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${rooms.map(room => {
                      const contracts = store.getContractsByRoom(room.id).filter(c => c.status === 'activo' || c.status === 'pendiente');
                      return `<tr>
                        <td class="cal-room-name" style="position:sticky;left:0;background:var(--bg-surface-1);z-index:1">${room.name}</td>
                        ${Array.from({length: totalDays}, (_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const date = new Date(currentYear, currentMonth, day);
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();

                          // Find contract for this day
                          const contract = contracts.find(c => dateStr >= c.startDate && dateStr <= c.endDate);
                          const guest = contract ? store.getGuest(contract.guestId) : null;

                          if (contract) {
                            return `<td class="cal-day occupied ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}" data-contract="${contract.id}" data-room="${room.id}" title="${guest?.firstName} ${guest?.lastName}"></td>`;
                          } else {
                            return `<td class="cal-day available ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}" data-room="${room.id}" data-date="${dateStr}"></td>`;
                          }
                        }).join('')}
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="calendar-legend mt-4">
        <div class="legend-item"><div class="legend-dot" style="background:var(--neon)"></div>Ocupado</div>
        <div class="legend-item"><div class="legend-dot" style="background:var(--bg-surface-2);border:1px solid var(--border-subtle)"></div>Disponible</div>
        <div class="legend-item"><div class="legend-dot" style="background:rgba(255,255,255,0.05);border:1px solid var(--border-subtle)"></div>Fin de semana</div>
      </div>
    `;

    // Navigation
    document.getElementById('cal-prev')?.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      render();
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      render();
    });

    // Property filter
    document.getElementById('cal-property-filter')?.addEventListener('change', (e) => {
      const val = e.target.value;
      document.querySelectorAll('.cal-property-group').forEach(g => {
        g.style.display = !val || g.dataset.property === val ? '' : 'none';
      });
    });

    // Click occupied day → go to contract
    content.querySelectorAll('.cal-day.occupied').forEach(cell => {
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => navigate('/contracts/' + cell.dataset.contract));
    });

    // Click available day → create contract
    content.querySelectorAll('.cal-day.available').forEach(cell => {
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => {
        const roomId = cell.dataset.room;
        const room = store.getRoom(roomId);
        const startDate = cell.dataset.date;
        showContractModal({
          roomId,
          propertyId: room?.propertyId,
          startDate,
          endDate: '',
          monthlyRent: room?.monthlyRent || 0,
          deposit: room?.monthlyRent || 0,
          franchise: 0,
          status: 'activo',
        });
      });
    });
  }

  render();
}
