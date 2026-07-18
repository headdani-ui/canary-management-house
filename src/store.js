import { generateId } from './utils.js';

// ============================================================
// STORE — Vercel API Data Layer (Neon Postgres)
// ============================================================

const api = async (table, method = 'GET', data = null, id = null) => {
  let url = `/api/crud?table=${table}`;
  if (id && method !== 'POST') url += `&id=${id}`;
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data && method === 'POST') options.body = JSON.stringify(data);
  
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
  return await res.json();
};

export const store = {
  // Properties
  getProperties: () => api('properties'),
  getProperty: (id) => api('properties', 'GET', null, id),
  saveProperty: async (item) => {
    if (!item.id) item.id = generateId();
    return api('properties', 'POST', item);
  },
  deleteProperty: (id) => api('properties', 'DELETE', null, id),

  // Rooms
  getRooms: () => api('rooms'),
  getRoomsByProperty: async (propertyId) => {
    const res = await fetch(`/api/crud?table=rooms&propertyId=${propertyId}`);
    return res.json();
  },
  getRoom: (id) => api('rooms', 'GET', null, id),
  saveRoom: async (item) => {
    if (!item.id) item.id = generateId();
    return api('rooms', 'POST', item);
  },
  deleteRoom: (id) => api('rooms', 'DELETE', null, id),

  // Guests
  getGuests: () => api('guests'),
  getGuest: (id) => api('guests', 'GET', null, id),
  saveGuest: async (item) => {
    if (!item.id) item.id = generateId();
    return api('guests', 'POST', item);
  },
  deleteGuest: (id) => api('guests', 'DELETE', null, id),

  // Contracts
  getContracts: () => api('contracts'),
  getContract: (id) => api('contracts', 'GET', null, id),
  getContractsByGuest: async (guestId) => {
    const res = await fetch(`/api/crud?table=contracts&guestId=${guestId}`);
    return res.json();
  },
  getContractsByRoom: async (roomId) => {
    const res = await fetch(`/api/crud?table=contracts&roomId=${roomId}`);
    return res.json();
  },
  getActiveContractForRoom: async (roomId) => {
    const res = await fetch(`/api/crud?table=contracts&roomId=${roomId}`);
    const contracts = await res.json();
    const today = new Date().toISOString().split('T')[0];
    return contracts.find(c => c.status === 'activo' && new Date(c.startDate).toISOString().split('T')[0] <= today && new Date(c.endDate).toISOString().split('T')[0] >= today);
  },
  saveContract: async (item) => {
    if (!item.id) item.id = generateId();
    return api('contracts', 'POST', item);
  },
  deleteContract: (id) => api('contracts', 'DELETE', null, id),

  // Costs Header
  getCostsHeaders: () => api('costs_header'),
  getCostHeader: (id) => api('costs_header', 'GET', null, id),
  getCostsByProperty: async (propertyId) => {
    const res = await fetch(`/api/crud?table=costs_header&propertyId=${propertyId}`);
    return res.json();
  },
  getCostsByPropertyAndPeriod: async (propertyId, month, year) => {
    const res = await fetch(`/api/crud?table=costs_header&propertyId=${propertyId}&month=${month}&year=${year}`);
    return res.json();
  },
  saveCostHeader: async (item) => {
    if (!item.id) item.id = generateId();
    return api('costs_header', 'POST', item);
  },
  deleteCostHeader: (id) => api('costs_header', 'DELETE', null, id),

  // Costs Details
  getCostsDetails: () => api('costs_details'),
  getCostDetailsByCostId: async (costHeaderId) => {
    const res = await fetch(`/api/crud?table=costs_details&costHeaderId=${costHeaderId}`);
    return res.json();
  },
  getCostDetailsByInvoice: async (invoiceId) => {
    const res = await fetch(`/api/crud?table=costs_details&invoiceId=${invoiceId}`);
    return res.json();
  },
  saveCostDetail: async (item) => {
    if (!item.id) item.id = generateId();
    return api('costs_details', 'POST', item);
  },
  deleteCostDetail: (id) => api('costs_details', 'DELETE', null, id),

  // Invoice Headers
  getInvoiceHeaders: () => api('invoice_headers'),
  getInvoiceHeader: (id) => api('invoice_headers', 'GET', null, id),
  getInvoicesByGuest: async (guestId) => {
    const res = await fetch(`/api/crud?table=invoice_headers&guestId=${guestId}`);
    return res.json();
  },
  getInvoicesByRoom: async (roomId) => {
    const res = await fetch(`/api/crud?table=invoice_headers&roomId=${roomId}`);
    return res.json();
  },
  getInvoicesByStatus: async (status) => {
    const res = await fetch(`/api/crud?table=invoice_headers&status=${status}`);
    return res.json();
  },
  saveInvoiceHeader: async (item) => {
    if (!item.id) item.id = generateId();
    return api('invoice_headers', 'POST', item);
  },
  deleteInvoiceHeader: (id) => api('invoice_headers', 'DELETE', null, id),

  // Invoice Details
  getInvoiceDetails: () => api('invoice_details'),
  getInvoiceDetailsByInvoice: async (invoiceId) => {
    const res = await fetch(`/api/crud?table=invoice_details&invoiceId=${invoiceId}`);
    return res.json();
  },
  saveInvoiceDetail: async (item) => {
    if (!item.id) item.id = generateId();
    return api('invoice_details', 'POST', item);
  },
  deleteInvoiceDetail: (id) => api('invoice_details', 'DELETE', null, id),
  deleteInvoiceDetailsByInvoice: async (invoiceId) => {
    // Vercel CRUD doesn't support deleting by field natively, we'll fetch then delete one by one
    const details = await store.getInvoiceDetailsByInvoice(invoiceId);
    await Promise.all(details.map(d => store.deleteInvoiceDetail(d.id)));
  },

  // Payments
  getPayments: () => api('payments'),
  getPaymentsByInvoice: async (invoiceId) => {
    const res = await fetch(`/api/crud?table=payments&invoiceId=${invoiceId}`);
    return res.json();
  },
  savePayment: async (item) => {
    if (!item.id) item.id = generateId();
    return api('payments', 'POST', item);
  },
  deletePayment: (id) => api('payments', 'DELETE', null, id),

  // Total paid for an invoice
  getTotalPaidForInvoice: async (invoiceId) => {
    const payments = await store.getPaymentsByInvoice(invoiceId);
    return payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  },

  isInitialized: async () => true,
  clearAll: async () => {} // not supported anymore
};

export async function seedDemoData() {
  // Seeding not implemented for remote DB
  console.log('Seed demo data non più supportato.');
}
