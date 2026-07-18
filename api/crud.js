import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const allowedTables = [
  'properties', 'rooms', 'guests', 'contracts', 
  'costs_header', 'costs_details', 'invoice_headers', 
  'invoice_details', 'payments'
];

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
      const data = req.body;
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
