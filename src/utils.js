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
    'other': 'Otro',
  };
  return map[type] || type;
}

export function calculateProRataRent(monthlyRent, startDate, endDate, month, year) {
  const rent = Number(monthlyRent) || 0;
  const totalDays = daysInMonth(month, year);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const contractStart = new Date(startDate);
  const contractEnd = new Date(endDate);

  const effectiveStart = contractStart > periodStart ? contractStart : periodStart;
  const effectiveEnd = contractEnd < periodEnd ? contractEnd : periodEnd;

  if (effectiveStart > effectiveEnd) return 0;

  const activeDays = Math.floor((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;

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
