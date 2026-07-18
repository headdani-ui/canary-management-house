// ============================================================
// STORE — localStorage Data Layer + Seed Data
// ============================================================
import { generateId } from './utils.js';

const STORE_KEY = 'rental_elite_data';

// --- Generic CRUD ---
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

export const store = {
  // Properties
  getProperties: () => getCollection('properties'),
  getProperty: (id) => getCollection('properties').find(p => p.id === id),
  saveProperty: (item) => {
    const items = getCollection('properties');
    const idx = items.findIndex(p => p.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('properties', items);
  },
  deleteProperty: (id) => setCollection('properties', getCollection('properties').filter(p => p.id !== id)),

  // Rooms
  getRooms: () => getCollection('rooms'),
  getRoomsByProperty: (propertyId) => getCollection('rooms').filter(r => r.propertyId === propertyId),
  getRoom: (id) => getCollection('rooms').find(r => r.id === id),
  saveRoom: (item) => {
    const items = getCollection('rooms');
    const idx = items.findIndex(r => r.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('rooms', items);
  },
  deleteRoom: (id) => setCollection('rooms', getCollection('rooms').filter(r => r.id !== id)),

  // Guests
  getGuests: () => getCollection('guests'),
  getGuest: (id) => getCollection('guests').find(g => g.id === id),
  saveGuest: (item) => {
    const items = getCollection('guests');
    const idx = items.findIndex(g => g.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('guests', items);
  },
  deleteGuest: (id) => setCollection('guests', getCollection('guests').filter(g => g.id !== id)),

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
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('contracts', items);
  },
  deleteContract: (id) => setCollection('contracts', getCollection('contracts').filter(c => c.id !== id)),

  // Costs Header
  getCostsHeaders: () => getCollection('costs_header'),
  getCostHeader: (id) => getCollection('costs_header').find(c => c.id === id),
  getCostsByProperty: (propertyId) => getCollection('costs_header').filter(c => c.propertyId === propertyId),
  getCostsByPropertyAndPeriod: (propertyId, month, year) => getCollection('costs_header').filter(c => c.propertyId === propertyId && c.month === month && c.year === year),
  saveCostHeader: (item) => {
    const items = getCollection('costs_header');
    const idx = items.findIndex(c => c.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('costs_header', items);
  },
  deleteCostHeader: (id) => setCollection('costs_header', getCollection('costs_header').filter(c => c.id !== id)),

  // Costs Details
  getCostsDetails: () => getCollection('costs_details'),
  getCostDetailsByCostId: (costHeaderId) => getCollection('costs_details').filter(d => d.costHeaderId === costHeaderId),
  getCostDetailsByInvoice: (invoiceId) => getCollection('costs_details').filter(d => d.invoiceId === invoiceId),
  saveCostDetail: (item) => {
    const items = getCollection('costs_details');
    const idx = items.findIndex(d => d.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId() });
    setCollection('costs_details', items);
  },
  deleteCostDetail: (id) => setCollection('costs_details', getCollection('costs_details').filter(d => d.id !== id)),

  // Invoice Headers
  getInvoiceHeaders: () => getCollection('invoice_headers'),
  getInvoiceHeader: (id) => getCollection('invoice_headers').find(i => i.id === id),
  getInvoicesByGuest: (guestId) => getCollection('invoice_headers').filter(i => i.guestId === guestId),
  getInvoicesByRoom: (roomId) => getCollection('invoice_headers').filter(i => i.roomId === roomId),
  getInvoicesByStatus: (status) => getCollection('invoice_headers').filter(i => i.status === status),
  saveInvoiceHeader: (item) => {
    const items = getCollection('invoice_headers');
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('invoice_headers', items);
  },
  deleteInvoiceHeader: (id) => setCollection('invoice_headers', getCollection('invoice_headers').filter(i => i.id !== id)),

  // Invoice Details
  getInvoiceDetails: () => getCollection('invoice_details'),
  getInvoiceDetailsByInvoice: (invoiceId) => getCollection('invoice_details').filter(d => d.invoiceId === invoiceId),
  saveInvoiceDetail: (item) => {
    const items = getCollection('invoice_details');
    const idx = items.findIndex(d => d.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId() });
    setCollection('invoice_details', items);
  },
  deleteInvoiceDetail: (id) => setCollection('invoice_details', getCollection('invoice_details').filter(d => d.id !== id)),
  deleteInvoiceDetailsByInvoice: (invoiceId) => setCollection('invoice_details', getCollection('invoice_details').filter(d => d.invoiceId !== invoiceId)),

  // Payments
  getPayments: () => getCollection('payments'),
  getPaymentsByInvoice: (invoiceId) => getCollection('payments').filter(p => p.invoiceId === invoiceId),
  savePayment: (item) => {
    const items = getCollection('payments');
    const idx = items.findIndex(p => p.id === item.id);
    if (idx >= 0) items[idx] = { ...items[idx], ...item };
    else items.push({ ...item, id: item.id || generateId(), createdAt: new Date().toISOString() });
    setCollection('payments', items);
  },
  deletePayment: (id) => setCollection('payments', getCollection('payments').filter(p => p.id !== id)),

  // Total paid for an invoice
  getTotalPaidForInvoice: (invoiceId) => {
    return getCollection('payments').filter(p => p.invoiceId === invoiceId).reduce((sum, p) => sum + p.amount, 0);
  },

  // Check and seed
  isInitialized: () => !!localStorage.getItem(STORE_KEY),
  clearAll: () => localStorage.removeItem(STORE_KEY),
};

// ============================================================
// SEED DATA — Abundant demo data
// ============================================================
export function seedDemoData() {
  if (store.isInitialized()) return;

  // --- Properties ---
  const properties = [
    { id: 'prop1', name: 'Villa Canaria', address: 'Calle Triana 42', city: 'Las Palmas', description: 'Villa elegante nel centro storico con patio andaluso', totalRooms: 4 },
    { id: 'prop2', name: 'Casa del Sol', address: 'Av. Marítima 15', city: 'Santa Cruz de Tenerife', description: 'Appartamento moderno con vista oceano', totalRooms: 3 },
    { id: 'prop3', name: 'Residencia Atlántica', address: 'Calle León y Castillo 88', city: 'Las Palmas', description: 'Residenza premium in zona commerciale', totalRooms: 5 },
  ];

  // --- Rooms ---
  const rooms = [
    { id: 'room1', propertyId: 'prop1', name: 'Habitación Palmera', floor: 1, size_sqm: 18, monthlyRent: 550, status: 'ocupada' },
    { id: 'room2', propertyId: 'prop1', name: 'Habitación Jazmín', floor: 1, size_sqm: 15, monthlyRent: 480, status: 'ocupada' },
    { id: 'room3', propertyId: 'prop1', name: 'Habitación Hibisco', floor: 2, size_sqm: 20, monthlyRent: 600, status: 'disponible' },
    { id: 'room4', propertyId: 'prop1', name: 'Habitación Bougainvillea', floor: 2, size_sqm: 22, monthlyRent: 650, status: 'ocupada' },
    { id: 'room5', propertyId: 'prop2', name: 'Suite Oceánica', floor: 3, size_sqm: 25, monthlyRent: 750, status: 'ocupada' },
    { id: 'room6', propertyId: 'prop2', name: 'Habitación Brisa', floor: 3, size_sqm: 16, monthlyRent: 500, status: 'ocupada' },
    { id: 'room7', propertyId: 'prop2', name: 'Habitación Coral', floor: 2, size_sqm: 18, monthlyRent: 520, status: 'disponible' },
    { id: 'room8', propertyId: 'prop3', name: 'Habitación Lanzarote', floor: 1, size_sqm: 17, monthlyRent: 480, status: 'ocupada' },
    { id: 'room9', propertyId: 'prop3', name: 'Habitación Fuerteventura', floor: 1, size_sqm: 19, monthlyRent: 520, status: 'ocupada' },
    { id: 'room10', propertyId: 'prop3', name: 'Habitación Tenerife', floor: 2, size_sqm: 21, monthlyRent: 580, status: 'disponible' },
    { id: 'room11', propertyId: 'prop3', name: 'Habitación Gran Canaria', floor: 2, size_sqm: 23, monthlyRent: 620, status: 'ocupada' },
    { id: 'room12', propertyId: 'prop3', name: 'Habitación La Palma', floor: 3, size_sqm: 20, monthlyRent: 550, status: 'ocupada' },
  ];

  // --- Guests ---
  const guests = [
    { id: 'guest1', firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@mail.com', phone: '+39 345 1234567', documentType: 'Pasaporte', documentNumber: 'YA4521890', nationality: 'Italiana', dateOfBirth: '1988-03-15', notes: 'Estudiante de máster en ULPGC' },
    { id: 'guest2', firstName: 'Elena', lastName: 'García', email: 'elena.garcia@mail.com', phone: '+34 612 345678', documentType: 'DNI', documentNumber: '45678912X', nationality: 'Española', dateOfBirth: '1995-07-22', notes: 'Trabaja en remoto para empresa tech' },
    { id: 'guest3', firstName: 'Lars', lastName: 'Andersen', email: 'lars.andersen@mail.dk', phone: '+45 21 234567', documentType: 'Pasaporte', documentNumber: 'DK8901234', nationality: 'Danesa', dateOfBirth: '1990-11-08', notes: 'Nómada digital, estancia larga' },
    { id: 'guest4', firstName: 'Sophie', lastName: 'Dubois', email: 'sophie.dubois@mail.fr', phone: '+33 6 12345678', documentType: 'Pasaporte', documentNumber: 'FR1234567', nationality: 'Francesa', dateOfBirth: '1992-01-30', notes: 'Profesora de yoga' },
    { id: 'guest5', firstName: 'Kenji', lastName: 'Tanaka', email: 'kenji.tanaka@mail.jp', phone: '+81 90 1234 5678', documentType: 'Pasaporte', documentNumber: 'TK7654321', nationality: 'Japonesa', dateOfBirth: '1985-09-12', notes: 'Fotógrafo profesional' },
    { id: 'guest6', firstName: 'Anna', lastName: 'Müller', email: 'anna.mueller@mail.de', phone: '+49 170 1234567', documentType: 'Pasaporte', documentNumber: 'DE9876543', nationality: 'Alemana', dateOfBirth: '1993-05-18', notes: 'Ingeniera de software, telecommuting' },
    { id: 'guest7', firstName: 'Pedro', lastName: 'Fernández', email: 'pedro.fernandez@mail.es', phone: '+34 678 901234', documentType: 'DNI', documentNumber: '12345678Z', nationality: 'Española', dateOfBirth: '1987-12-03', notes: 'Chef en restaurante local' },
    { id: 'guest8', firstName: 'Olivia', lastName: 'Smith', email: 'olivia.smith@mail.co.uk', phone: '+44 7911 123456', documentType: 'Pasaporte', documentNumber: 'UK5432198', nationality: 'Británica', dateOfBirth: '1991-04-25', notes: 'Escritora freelance' },
    { id: 'guest9', firstName: 'Lucas', lastName: 'Bianchi', email: 'lucas.bianchi@mail.it', phone: '+39 320 9876543', documentType: 'Pasaporte', documentNumber: 'IT6789012', nationality: 'Italiana', dateOfBirth: '1994-08-07', notes: 'Diseñador gráfico' },
    { id: 'guest10', firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@mail.pt', phone: '+351 912 345678', documentType: 'Pasaporte', documentNumber: 'PT3456789', nationality: 'Portuguesa', dateOfBirth: '1989-06-14', notes: 'Investigadora universitaria' },
  ];

  // --- Contracts ---
  const contracts = [
    { id: 'con1', guestId: 'guest1', roomId: 'room1', propertyId: 'prop1', startDate: '2025-09-01', endDate: '2026-08-31', monthlyRent: 550, deposit: 550, franchise: 90, status: 'activo', notes: 'Contrato anual' },
    { id: 'con2', guestId: 'guest2', roomId: 'room2', propertyId: 'prop1', startDate: '2025-11-01', endDate: '2026-04-30', monthlyRent: 480, deposit: 480, franchise: 90, status: 'activo', notes: 'Contrato 6 meses' },
    { id: 'con3', guestId: 'guest3', roomId: 'room4', propertyId: 'prop1', startDate: '2025-10-15', endDate: '2026-10-14', monthlyRent: 650, deposit: 650, franchise: 90, status: 'activo', notes: 'Contrato anual, ingreso a mitad de mes' },
    { id: 'con4', guestId: 'guest4', roomId: 'room5', propertyId: 'prop2', startDate: '2025-08-01', endDate: '2026-07-31', monthlyRent: 750, deposit: 750, franchise: 80, status: 'activo', notes: 'Suite premium' },
    { id: 'con5', guestId: 'guest5', roomId: 'room6', propertyId: 'prop2', startDate: '2026-01-01', endDate: '2026-06-30', monthlyRent: 500, deposit: 500, franchise: 80, status: 'activo', notes: '6 meses' },
    { id: 'con6', guestId: 'guest6', roomId: 'room8', propertyId: 'prop3', startDate: '2025-07-01', endDate: '2026-06-30', monthlyRent: 480, deposit: 480, franchise: 100, status: 'activo', notes: 'Contrato anual' },
    { id: 'con7', guestId: 'guest7', roomId: 'room9', propertyId: 'prop3', startDate: '2025-12-01', endDate: '2026-05-31', monthlyRent: 520, deposit: 520, franchise: 100, status: 'activo', notes: '6 meses' },
    { id: 'con8', guestId: 'guest8', roomId: 'room11', propertyId: 'prop3', startDate: '2025-10-01', endDate: '2026-03-31', monthlyRent: 620, deposit: 620, franchise: 100, status: 'activo', notes: '6 meses, vence pronto' },
    { id: 'con9', guestId: 'guest9', roomId: 'room12', propertyId: 'prop3', startDate: '2026-02-15', endDate: '2026-08-14', monthlyRent: 550, deposit: 550, franchise: 100, status: 'activo', notes: 'Ingreso a mitad de mes' },
    { id: 'con10', guestId: 'guest10', roomId: 'room3', propertyId: 'prop1', startDate: '2025-03-01', endDate: '2025-08-31', monthlyRent: 580, deposit: 580, franchise: 90, status: 'vencido', notes: 'Contrato terminado' },
    // Extra past contract
    { id: 'con11', guestId: 'guest5', roomId: 'room7', propertyId: 'prop2', startDate: '2025-06-01', endDate: '2025-12-31', monthlyRent: 520, deposit: 520, franchise: 80, status: 'vencido', notes: 'Contrato anterior' },
  ];

  // --- Costs Headers ---
  const costsHeaders = [];
  const costTypes = ['electricity', 'water', 'internet', 'gas', 'cleaning'];
  const propIds = ['prop1', 'prop2', 'prop3'];
  const costAmounts = {
    electricity: [120, 95, 150],
    water: [45, 35, 55],
    internet: [50, 50, 60],
    gas: [30, 25, 40],
    cleaning: [80, 60, 100],
  };

  let costIdCounter = 1;
  // Generate costs for Oct 2025 - Mar 2026
  for (let year = 2025; year <= 2026; year++) {
    const startMonth = year === 2025 ? 10 : 1;
    const endMonth = year === 2025 ? 12 : 3;
    for (let month = startMonth; month <= endMonth; month++) {
      propIds.forEach((propId, propIdx) => {
        costTypes.forEach(type => {
          const base = costAmounts[type][propIdx];
          const amount = Math.round(base * (0.85 + Math.random() * 0.3));
          costsHeaders.push({
            id: `cost${costIdCounter++}`,
            propertyId: propId,
            costType: type,
            amount,
            month,
            year,
            description: '',
            createdAt: new Date(year, month - 1, 28).toISOString(),
          });
        });
      });
    }
  }

  // --- Invoice Headers + Details ---
  const invoiceHeaders = [];
  const invoiceDetails = [];
  let invIdCounter = 1;
  let invDetIdCounter = 1;

  // Generate invoices for active contracts for months Nov 2025 - Feb 2026
  const invoiceMonths = [
    { month: 11, year: 2025 },
    { month: 12, year: 2025 },
    { month: 1, year: 2026 },
    { month: 2, year: 2026 },
  ];

  const activeContracts = contracts.filter(c => c.status === 'activo' || c.status === 'vencido');

  invoiceMonths.forEach(({ month, year }) => {
    activeContracts.forEach(contract => {
      const contractStart = new Date(contract.startDate);
      const contractEnd = new Date(contract.endDate);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0);

      if (contractStart > periodEnd || contractEnd < periodStart) return;

      // Calculate pro-rata rent
      const effectiveStart = contractStart > periodStart ? contractStart : periodStart;
      const effectiveEnd = contractEnd < periodEnd ? contractEnd : periodEnd;
      const totalDays = new Date(year, month, 0).getDate();
      const activeDays = Math.floor((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
      const rentAmount = activeDays >= totalDays ? contract.monthlyRent : Math.round((contract.monthlyRent / totalDays) * activeDays * 100) / 100;

      const invId = `inv${invIdCounter++}`;
      const invNumber = `F-${year}-${String(month).padStart(2, '0')}-${String(invIdCounter - 1).padStart(3, '0')}`;

      // Determine status
      let status = 'pendiente';
      if (month <= 12 && year === 2025) status = 'pagada';
      else if (month === 1 && year === 2026) {
        status = Math.random() > 0.3 ? 'pagada' : 'parcial';
      }

      const details = [];
      // Rent line
      const rentDetId = `invd${invDetIdCounter++}`;
      details.push({
        id: rentDetId,
        invoiceId: invId,
        description: activeDays < totalDays
          ? `Alquiler habitación (${activeDays}/${totalDays} días)`
          : 'Alquiler habitación (mes completo)',
        quantity: 1,
        unitPrice: rentAmount,
        total: rentAmount,
      });

      // Costs allocation — check if costs exist for this property/month
      const propertyCosts = costsHeaders.filter(c => c.propertyId === contract.propertyId && c.month === month && c.year === year);
      const totalPropertyCosts = propertyCosts.reduce((s, c) => s + c.amount, 0);
      const room = rooms.find(r => r.id === contract.roomId);
      const property = properties.find(p => p.id === contract.propertyId);
      const numRooms = rooms.filter(r => r.propertyId === contract.propertyId).length;
      const franchise = contract.franchise || 0;

      if (totalPropertyCosts > 0 && totalPropertyCosts > franchise) {
        const netCost = totalPropertyCosts - franchise;
        const costPerRoom = Math.round((netCost / numRooms) * 100) / 100;
        if (costPerRoom > 0) {
          const costDetId = `invd${invDetIdCounter++}`;
          details.push({
            id: costDetId,
            invoiceId: invId,
            description: `Gastos comunes (total: €${totalPropertyCosts} - franquicia: €${franchise}) / ${numRooms} hab.`,
            quantity: 1,
            unitPrice: costPerRoom,
            total: costPerRoom,
          });
        }
      }

      const subtotal = details.reduce((s, d) => s + d.total, 0);
      const tax = Math.round(subtotal * 0.07 * 100) / 100; // 7% IGIC
      const total = Math.round((subtotal + tax) * 100) / 100;

      invoiceHeaders.push({
        id: invId,
        invoiceNumber: invNumber,
        guestId: contract.guestId,
        roomId: contract.roomId,
        contractId: contract.id,
        propertyId: contract.propertyId,
        month,
        year,
        periodStart: `${year}-${String(month).padStart(2, '0')}-01`,
        periodEnd: `${year}-${String(month).padStart(2, '0')}-${totalDays}`,
        issueDate: `${year}-${String(month).padStart(2, '0')}-01`,
        dueDate: `${year}-${String(month).padStart(2, '0')}-10`,
        subtotal,
        tax,
        total,
        status,
        notes: '',
        createdAt: new Date(year, month - 1, 1).toISOString(),
      });

      invoiceDetails.push(...details);
    });
  });

  // --- Payments ---
  const payments = [];
  let payIdCounter = 1;

  invoiceHeaders.forEach(inv => {
    if (inv.status === 'pagada') {
      payments.push({
        id: `pay${payIdCounter++}`,
        invoiceId: inv.id,
        amount: inv.total,
        paymentDate: inv.dueDate,
        paymentMethod: Math.random() > 0.5 ? 'Transferencia' : 'Efectivo',
        reference: `REF-${payIdCounter}`,
        notes: '',
        createdAt: new Date(inv.dueDate).toISOString(),
      });
    } else if (inv.status === 'parcial') {
      const partialAmount = Math.round(inv.total * 0.6 * 100) / 100;
      payments.push({
        id: `pay${payIdCounter++}`,
        invoiceId: inv.id,
        amount: partialAmount,
        paymentDate: inv.dueDate,
        paymentMethod: 'Transferencia',
        reference: `REF-${payIdCounter}`,
        notes: 'Pago parcial',
        createdAt: new Date(inv.dueDate).toISOString(),
      });
    }
  });

  // --- Costs Details ---
  const costsDetails = [];
  let costDetIdCounter = 1;

  // For costs in months with invoices, mark some as charged
  costsHeaders.forEach(costH => {
    const isInvoicedMonth = invoiceMonths.some(m => m.month === costH.month && m.year === costH.year);
    const numRooms = rooms.filter(r => r.propertyId === costH.propertyId).length;

    if (isInvoicedMonth && Math.random() > 0.2) {
      // Create detail entries for each active room contract
      const activeRoomContracts = contracts.filter(c =>
        c.propertyId === costH.propertyId &&
        c.status === 'activo' &&
        new Date(c.startDate) <= new Date(costH.year, costH.month - 1, 28) &&
        new Date(c.endDate) >= new Date(costH.year, costH.month - 1, 1)
      );

      activeRoomContracts.forEach(contract => {
        costsDetails.push({
          id: `cd${costDetIdCounter++}`,
          costHeaderId: costH.id,
          guestId: contract.guestId,
          roomId: contract.roomId,
          contractId: contract.id,
          amount: Math.round((costH.amount / numRooms) * 100) / 100,
          status: 'cobrado',
          invoiceId: invoiceHeaders.find(i => i.contractId === contract.id && i.month === costH.month && i.year === costH.year)?.id || null,
        });
      });
    } else {
      costsDetails.push({
        id: `cd${costDetIdCounter++}`,
        costHeaderId: costH.id,
        guestId: null,
        roomId: null,
        contractId: null,
        amount: costH.amount,
        status: Math.random() > 0.5 ? 'por_cobrar' : 'no_cobrar',
        invoiceId: null,
      });
    }
  });

  // --- Save everything ---
  const data = {
    properties,
    rooms,
    guests,
    contracts,
    costs_header: costsHeaders,
    costs_details: costsDetails,
    invoice_headers: invoiceHeaders,
    invoice_details: invoiceDetails,
    payments,
  };

  setData(data);
  console.log('✅ Demo data seeded:', {
    properties: properties.length,
    rooms: rooms.length,
    guests: guests.length,
    contracts: contracts.length,
    costsHeaders: costsHeaders.length,
    costsDetails: costsDetails.length,
    invoiceHeaders: invoiceHeaders.length,
    invoiceDetails: invoiceDetails.length,
    payments: payments.length,
  });
}
