import { generateId } from './utils.js';

// ============================================================
// STORE — Optimistic UI Layer (Neon API + LocalStorage)
// ============================================================
// Questo approccio mantiene l'interfaccia istantanea e sincrona 
// senza dover riscrivere le centinaia di file della UI.

const STORE_KEY = 'rental_elite_data';
const allowedTables = [
  'properties', 'rooms', 'guests', 'contracts', 
  'costs_header', 'costs_details', 'invoice_headers', 
  'invoice_details', 'payments'
];

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch { return {}; }
}

function setData(data) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

function getCollection(name) {
  return getData()[name] || [];
}

function setCollection(name, items) {
  const data = getData();
  data[name] = items;
  setData(data);
}

// Chiamate al Backend Vercel
const api = async (table, method = 'GET', data = null, id = null) => {
  let url = `/api/crud?table=${table}`;
  if (id && method !== 'POST') url += `&id=${id}`;
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data && method === 'POST') options.body = JSON.stringify(data);
  
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('API Sync Error:', err);
    // In un'app reale qui potremmo salvare le richieste fallite in una coda offline
  }
};

export const store = {
  // Sincronizzazione Iniziale
  isInitialized: async () => {
    try {
      console.log('Sincronizzazione con Neon DB in corso...');
      const allData = {};
      await Promise.all(allowedTables.map(async (table) => {
        allData[table] = await api(table);
      }));
      setData(allData);
      console.log('Sincronizzazione completata!');
      return true;
    } catch (e) {
      console.error('Errore durante la sincronizzazione:', e);
      // Fallback: usiamo i dati locali se offline
      return !!localStorage.getItem(STORE_KEY);
    }
  },

  // Properties
  getProperties: () => getCollection('properties'),
  getProperty: (id) => getCollection('properties').find(p => p.id === id),
  saveProperty: (item) => {
    const items = getCollection('properties');
    const idx = items.findIndex(p => p.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('properties', items);
    api('properties', 'POST', item); // Sync background
  },
  deleteProperty: (id) => {
    setCollection('properties', getCollection('properties').filter(p => p.id !== id));
    api('properties', 'DELETE', null, id);
  },

  // Rooms
  getRooms: () => getCollection('rooms'),
  getRoomsByProperty: (propertyId) => getCollection('rooms').filter(r => r.propertyId === propertyId),
  getRoom: (id) => getCollection('rooms').find(r => r.id === id),
  saveRoom: (item) => {
    const items = getCollection('rooms');
    const idx = items.findIndex(r => r.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('rooms', items);
    api('rooms', 'POST', item);
  },
  deleteRoom: (id) => {
    setCollection('rooms', getCollection('rooms').filter(r => r.id !== id));
    api('rooms', 'DELETE', null, id);
  },

  // Guests
  getGuests: () => getCollection('guests'),
  getGuest: (id) => getCollection('guests').find(g => g.id === id),
  saveGuest: (item) => {
    const items = getCollection('guests');
    const idx = items.findIndex(g => g.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('guests', items);
    api('guests', 'POST', item);
  },
  deleteGuest: (id) => {
    setCollection('guests', getCollection('guests').filter(g => g.id !== id));
    api('guests', 'DELETE', null, id);
  },

  // Contracts
  getContracts: () => getCollection('contracts'),
  getContract: (id) => getCollection('contracts').find(c => c.id === id),
  getContractsByGuest: (guestId) => getCollection('contracts').filter(c => c.guestId === guestId),
  getContractsByRoom: (roomId) => getCollection('contracts').filter(c => c.roomId === roomId),
  getActiveContractForRoom: (roomId) => {
    const today = new Date().toISOString().split('T')[0];
    return getCollection('contracts').find(c => c.roomId === roomId && c.status === 'activo' && c.startDate <= today && c.endDate >= today);
  },
  saveContract: (item) => {
    const items = getCollection('contracts');
    const idx = items.findIndex(c => c.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('contracts', items);
    api('contracts', 'POST', item);
  },
  deleteContract: (id) => {
    setCollection('contracts', getCollection('contracts').filter(c => c.id !== id));
    api('contracts', 'DELETE', null, id);
  },

  // Costs Header
  getCostsHeaders: () => getCollection('costs_header'),
  getCostHeader: (id) => getCollection('costs_header').find(c => c.id === id),
  getCostsByProperty: (propertyId) => getCollection('costs_header').filter(c => c.propertyId === propertyId),
  getCostsByPropertyAndPeriod: (propertyId, month, year) => getCollection('costs_header').filter(c => c.propertyId === propertyId && c.month === month && c.year === year),
  saveCostHeader: (item) => {
    const items = getCollection('costs_header');
    const idx = items.findIndex(c => c.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('costs_header', items);
    api('costs_header', 'POST', item);
  },
  deleteCostHeader: (id) => {
    setCollection('costs_header', getCollection('costs_header').filter(c => c.id !== id));
    api('costs_header', 'DELETE', null, id);
  },

  // Costs Details
  getCostsDetails: () => getCollection('costs_details'),
  getCostDetailsByCostId: (costHeaderId) => getCollection('costs_details').filter(d => d.costHeaderId === costHeaderId),
  getCostDetailsByInvoice: (invoiceId) => getCollection('costs_details').filter(d => d.invoiceId === invoiceId),
  saveCostDetail: (item) => {
    const items = getCollection('costs_details');
    const idx = items.findIndex(d => d.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item });
    setCollection('costs_details', items);
    api('costs_details', 'POST', item);
  },
  deleteCostDetail: (id) => {
    setCollection('costs_details', getCollection('costs_details').filter(d => d.id !== id));
    api('costs_details', 'DELETE', null, id);
  },

  // Invoice Headers
  getInvoiceHeaders: () => getCollection('invoice_headers'),
  getInvoiceHeader: (id) => getCollection('invoice_headers').find(i => i.id === id),
  getInvoicesByGuest: (guestId) => getCollection('invoice_headers').filter(i => i.guestId === guestId),
  getInvoicesByRoom: (roomId) => getCollection('invoice_headers').filter(i => i.roomId === roomId),
  getInvoicesByStatus: (status) => getCollection('invoice_headers').filter(i => i.status === status),
  saveInvoiceHeader: (item) => {
    const items = getCollection('invoice_headers');
    const idx = items.findIndex(i => i.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('invoice_headers', items);
    api('invoice_headers', 'POST', item);
  },
  deleteInvoiceHeader: (id) => {
    setCollection('invoice_headers', getCollection('invoice_headers').filter(i => i.id !== id));
    api('invoice_headers', 'DELETE', null, id);
  },

  // Invoice Details
  getInvoiceDetails: () => getCollection('invoice_details'),
  getInvoiceDetailsByInvoice: (invoiceId) => getCollection('invoice_details').filter(d => d.invoiceId === invoiceId),
  saveInvoiceDetail: (item) => {
    const items = getCollection('invoice_details');
    const idx = items.findIndex(d => d.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item });
    setCollection('invoice_details', items);
    api('invoice_details', 'POST', item);
  },
  deleteInvoiceDetail: (id) => {
    setCollection('invoice_details', getCollection('invoice_details').filter(d => d.id !== id));
    api('invoice_details', 'DELETE', null, id);
  },
  deleteInvoiceDetailsByInvoice: (invoiceId) => {
    const details = store.getInvoiceDetailsByInvoice(invoiceId);
    details.forEach(d => store.deleteInvoiceDetail(d.id));
  },

  // Payments
  getPayments: () => getCollection('payments'),
  getPaymentsByInvoice: (invoiceId) => getCollection('payments').filter(p => p.invoiceId === invoiceId),
  savePayment: (item) => {
    const items = getCollection('payments');
    const idx = items.findIndex(p => p.id === item.id);
    if (!item.id) item.id = generateId();
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, createdAt: new Date().toISOString() });
    setCollection('payments', items);
    api('payments', 'POST', item);
  },
  deletePayment: (id) => {
    setCollection('payments', getCollection('payments').filter(p => p.id !== id));
    api('payments', 'DELETE', null, id);
  },

  // Total paid for an invoice
  getTotalPaidForInvoice: (invoiceId) => {
    return getCollection('payments').filter(p => p.invoiceId === invoiceId).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  },

  clearAll: () => {
    localStorage.removeItem(STORE_KEY);
  }
};

export async function seedDemoData() {
  console.log('Seed demo data disabilitato in produzione.');
}
