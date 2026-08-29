import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const allowedTables = [
  'properties', 'rooms', 'guests', 'contracts', 
  'invoice_headers', 'invoice_details', 'payments',
  'costs_header', 'costs_details'
];

const tableColumns = {
  properties: ['id', 'name', 'address', 'city', 'description', 'totalRooms', 'createdAt'],
  rooms: ['id', 'propertyId', 'name', 'floor', 'size_sqm', 'monthlyRent', 'status', 'createdAt'],
  guests: ['id', 'firstName', 'lastName', 'email', 'phone', 'documentType', 'documentNumber', 'nationality', 'dateOfBirth', 'notes', 'createdAt'],
  contracts: ['id', 'guestId', 'roomId', 'propertyId', 'startDate', 'endDate', 'monthlyRent', 'deposit', 'franchise', 'status', 'notes', 'createdAt'],
  costs_header: ['id', 'propertyId', 'costType', 'amount', 'month', 'year', 'description', 'createdAt'],
  costs_details: ['id', 'costHeaderId', 'guestId', 'roomId', 'contractId', 'amount', 'status', 'invoiceId'],
  invoice_headers: ['id', 'invoiceNumber', 'guestId', 'roomId', 'contractId', 'propertyId', 'month', 'year', 'periodStart', 'periodEnd', 'issueDate', 'dueDate', 'subtotal', 'tax', 'total', 'status', 'notes', 'createdAt'],
  invoice_details: ['id', 'invoiceId', 'description', 'quantity', 'unitPrice', 'total'],
  payments: ['id', 'invoiceId', 'amount', 'paymentDate', 'paymentMethod', 'reference', 'notes', 'createdAt']
};

// Columns that require a specific type and cannot accept empty strings
const dateColumns = new Set([
  'dateOfBirth', 'startDate', 'endDate', 'periodStart', 'periodEnd',
  'issueDate', 'dueDate', 'paymentDate'
]);
const numericColumns = new Set([
  'totalRooms', 'floor', 'size_sqm', 'monthlyRent', 'deposit', 'franchise',
  'amount', 'month', 'year', 'subtotal', 'tax', 'total', 'quantity', 'unitPrice'
]);

function sanitizeValue(col, val) {
  if (val === '' || val === undefined) {
    return null;
  }
  if (dateColumns.has(col) && typeof val === 'string' && val.trim() === '') {
    return null;
  }
  if (numericColumns.has(col) && typeof val === 'string' && val.trim() === '') {
    return null;
  }
  return val;
}

export default async function handler(req, res) {
  const table = req.query.table;
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table' });
  }

  try {
    if (req.method === 'GET') {
      const id = req.query.id;
      if (id) {
        const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        return res.status(200).json(rows[0] || null);
      } else {
        const filters = [];
        const values = [];
        let i = 1;
        for (const [key, value] of Object.entries(req.query)) {
          if (key !== 'table' && key !== 'id') {
            filters.push(`"${key}" = $${i}`);
            values.push(value);
            i++;
          }
        }
        let query = `SELECT * FROM ${table}`;
        if (filters.length > 0) {
          query += ` WHERE ${filters.join(' AND ')}`;
        }
        const { rows } = await pool.query(query, values);
        return res.status(200).json(rows);
      }
    } else if (req.method === 'POST') {
      const rawData = req.body;
      const columns = tableColumns[table] || [];
      
      // Filter out any key that does not exist in the database table schema
      // and sanitize empty strings to null for typed columns (DATE, NUMERIC)
      const data = {};
      for (const col of columns) {
        if (rawData[col] !== undefined) {
          data[col] = sanitizeValue(col, rawData[col]);
        }
      }

      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
      
      // ON CONFLICT requires id to be the primary key
      const query = `
        INSERT INTO ${table} (${keys.map(k => `"${k}"`).join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET
        ${keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')}
        RETURNING *;
      `;
      const { rows } = await pool.query(query, values);
      return res.status(200).json(rows[0]);
    } else if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      return res.status(200).json({ success: true });
    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
