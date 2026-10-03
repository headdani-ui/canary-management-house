// ============================================================
// UTILS — Helpers & Formatters
// ============================================================

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function formatMonth(month, year) {
  const d = new Date(year, month - 1);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export function getMonthName(month) {
  const d = new Date(2024, month - 1);
  return d.toLocaleDateString('es-ES', { month: 'long' });
}

export function getMonthDays(month, year) {
  return new Date(year, month, 0).getDate();
}

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function getInitials(firstName, lastName) {
  return (firstName?.charAt(0) || '') + (lastName?.charAt(0) || '');
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function statusBadge(status) {
  const map = {
    'activo': 'badge-active',
    'active': 'badge-active',
    'pagada': 'badge-paid',
    'paid': 'badge-paid',
    'pendiente': 'badge-pending',
    'pending': 'badge-pending',
    'parcial': 'badge-partial',
    'partial': 'badge-partial',
    'vencido': 'badge-expired',
    'expired': 'badge-expired',
    'overdue': 'badge-overdue',
    'disponible': 'badge-available',
    'available': 'badge-available',
    'no_cobrar': 'badge-never',
    'never': 'badge-never',
    'cobrado': 'badge-paid',
    'charged': 'badge-paid',
    'por_cobrar': 'badge-pending',
    'ocupada': 'badge-active',
    'mantenimiento': 'badge-pending',
  };
  const cls = map[status?.toLowerCase()] || 'badge-available';
  const label = status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, ' ') || '';
  return `<span class="badge ${cls}">${label}</span>`;
}

export function costTypeLabel(type) {
  const map = {
    'electricity': 'Electricidad',
    'water': 'Agua',
    'internet': 'Internet',
    'gas': 'Gas',
    'maintenance': 'Mantenimiento',
    'cleaning': 'Limpieza',
    'mejora inmueble': 'Mejora Inmueble',
  };
  return map[type] || type;
}

export function calculateProRataRent(monthlyRent, startDate, endDate, month, year) {
  const rent = Number(monthlyRent) || 0;
  if (!rent || !startDate) return 0;
  const totalDays = daysInMonth(month, year);

  const sStr = String(startDate).slice(0, 10);
  const eStr = endDate ? String(endDate).slice(0, 10) : '9999-12-31';

  const mStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${mStr}-01`;
  const monthEnd = `${year}-${mStr}-${String(totalDays).padStart(2, '0')}`;

  if (sStr > monthEnd || eStr < monthStart) return 0;

  const effStartStr = sStr > monthStart ? sStr : monthStart;
  const effEndStr = eStr < monthEnd ? eStr : monthEnd;

  const effStartDay = parseInt(effStartStr.split('-')[2], 10);
  const effEndDay = parseInt(effEndStr.split('-')[2], 10);

  const activeDays = Math.max(0, effEndDay - effStartDay + 1);

  if (activeDays >= totalDays) return rent;
  return Math.round((rent / totalDays) * activeDays * 100) / 100;
}

export function calculateCostAllocation(totalCosts, franchise, numRooms) {
  const costs = Number(totalCosts) || 0;
  const fran = Number(franchise) || 0;
  const rooms = Number(numRooms) || 0;
  const net = Math.max(0, costs - fran);
  const perRoom = rooms > 0 ? Math.round((net / rooms) * 100) / 100 : 0;
  return { net, perRoom };
}
