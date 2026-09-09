require('dotenv').config();
const { Client } = require('pg');

const tableColumns = {
  guests: ['id', 'firstName', 'lastName', 'email', 'phone', 'documentType', 'documentNumber', 'nationality', 'dateOfBirth', 'notes', 'createdAt']
};

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log('Connected to Neon Database.');

  // Typical frontend guest structure:
  // e.g., dateOfBirth is often empty string "" if not set in HTML form
  const sampleGuest = {
    id: 'guest_test_999',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '123456789',
    documentType: 'DNI',
    documentNumber: '12345678A',
    nationality: 'Española',
    dateOfBirth: '', // Empty string if not set by input type="date"
    notes: 'Test note',
    createdAt: new Date().toISOString()
  };

  const columns = tableColumns.guests;
  const data = {};
  for (const col of columns) {
    if (sampleGuest[col] !== undefined) {
      data[col] = sampleGuest[col];
    }
  }

  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

  const query = `
    INSERT INTO guests (${keys.map(k => `"${k}"`).join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET
    ${keys.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')}
    RETURNING *;
  `;

  console.log('Executing query:', query);
  console.log('Values:', values);

  try {
    const res = await client.query(query, values);
    console.log('Success:', res.rows[0]);
    // Clean up
    await client.query('DELETE FROM guests WHERE id = $1', ['guest_test_999']);
  } catch (e) {
    console.error('DATABASE ERROR:', e.message);
  }

  await client.end();
}

main();
