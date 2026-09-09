require('dotenv').config();
const { Client } = require('pg');

const dateColumns = new Set([
  'dateOfBirth', 'startDate', 'endDate', 'periodStart', 'periodEnd',
  'issueDate', 'dueDate', 'paymentDate'
]);
const numericColumns = new Set([
  'totalRooms', 'floor', 'size_sqm', 'monthlyRent', 'deposit', 'franchise',
  'amount', 'month', 'year', 'subtotal', 'tax', 'total', 'quantity', 'unitPrice'
]);

function sanitizeValue(col, val) {
  if (val === '' || val === undefined || val === null) {
    if (dateColumns.has(col) || numericColumns.has(col)) return null;
    return val ?? null;
  }
  return val;
}

const tableColumns = {
  guests: ['id', 'firstName', 'lastName', 'email', 'phone', 'documentType', 'documentNumber', 'nationality', 'dateOfBirth', 'notes', 'createdAt'],
  contracts: ['id', 'guestId', 'roomId', 'propertyId', 'startDate', 'endDate', 'monthlyRent', 'deposit', 'franchise', 'status', 'notes', 'createdAt'],
  invoice_headers: ['id', 'invoiceNumber', 'guestId', 'roomId', 'contractId', 'propertyId', 'month', 'year', 'periodStart', 'periodEnd', 'issueDate', 'dueDate', 'subtotal', 'tax', 'total', 'status', 'notes', 'createdAt'],
  invoice_details: ['id', 'invoiceId', 'description', 'quantity', 'unitPrice', 'total'],
  payments: ['id', 'invoiceId', 'amount', 'paymentDate', 'paymentMethod', 'reference', 'notes', 'createdAt'],
  costs_details: ['id', 'costHeaderId', 'guestId', 'roomId', 'contractId', 'amount', 'status', 'invoiceId']
};

const testData = {
  guests: {
    id: 'g_test_001', firstName: 'Mario', lastName: 'Rossi',
    email: 'mario@test.com', phone: '123456', documentType: 'DNI',
    documentNumber: '12345678A', nationality: 'Italiana',
    dateOfBirth: '',  // campo vuoto — il problema principale
    notes: '', createdAt: new Date().toISOString()
  },
  contracts: {
    id: 'c_test_001', guestId: 'g_test_001', roomId: null, propertyId: null,
    startDate: '2025-01-01', endDate: '2025-12-31', monthlyRent: 500,
    deposit: '', franchise: '', status: 'activo', notes: '', createdAt: new Date().toISOString()
  },
  invoice_headers: {
    id: 'ih_test_001', invoiceNumber: 'F-2025-001', guestId: 'g_test_001',
    roomId: null, contractId: 'c_test_001', propertyId: null,
    month: 1, year: 2025, periodStart: '2025-01-01', periodEnd: '2025-01-31',
    issueDate: '2025-01-01', dueDate: '2025-01-10',
    subtotal: 500, tax: 35, total: 535, status: 'pagada', notes: '', createdAt: new Date().toISOString()
  },
  invoice_details: {
    id: 'id_test_001', invoiceId: 'ih_test_001', description: 'Alquiler habitación',
    quantity: 1, unitPrice: 500, total: 500
  },
  payments: {
    id: 'pay_test_001', invoiceId: 'ih_test_001', amount: 535,
    paymentDate: '2025-01-10', paymentMethod: 'Transferencia',
    reference: 'REF-001', notes: '', createdAt: new Date().toISOString()
  },
  costs_details: {
    id: 'cd_test_001', costHeaderId: null, guestId: 'g_test_001',
    roomId: null, contractId: null, amount: 50, status: 'por_cobrar', invoiceId: null
  }
};

async function testInsert(client, table, rawData) {
  const columns = tableColumns[table];
  const data = {};
  for (const col of columns) {
    if (rawData[col] !== undefined) {
      data[col] = sanitizeValue(col, rawData[col]);
    }
  }
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
  const query = `
    INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET
    ${keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')}
    RETURNING id;
  `;
  try {
    const res = await client.query(query, values);
    console.log(`✅ ${table}: OK (id=${res.rows[0].id})`);
    return true;
  } catch(e) {
    console.error(`❌ ${table}: ERROR — ${e.message}`);
    return false;
  }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected. Running insertion tests...\n');
  
  // Insert in dependency order
  await testInsert(client, 'guests', testData.guests);
  await testInsert(client, 'contracts', testData.contracts);
  await testInsert(client, 'invoice_headers', testData.invoice_headers);
  await testInsert(client, 'invoice_details', testData.invoice_details);
  await testInsert(client, 'payments', testData.payments);
  await testInsert(client, 'costs_details', testData.costs_details);
  
  console.log('\nCleaning up test data...');
  await client.query(`DELETE FROM costs_details WHERE id = 'cd_test_001'`);
  await client.query(`DELETE FROM payments WHERE id = 'pay_test_001'`);
  await client.query(`DELETE FROM invoice_details WHERE id = 'id_test_001'`);
  await client.query(`DELETE FROM invoice_headers WHERE id = 'ih_test_001'`);
  await client.query(`DELETE FROM contracts WHERE id = 'c_test_001'`);
  await client.query(`DELETE FROM guests WHERE id = 'g_test_001'`);
  console.log('Done.');
  
  await client.end();
}
main();
