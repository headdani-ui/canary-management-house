require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log('Connected to Neon Database.');

  const tables = [
    'properties', 'rooms', 'guests', 'contracts', 
    'costs_header', 'costs_details', 'invoice_headers', 
    'invoice_details', 'payments'
  ];

  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`Table "${table}": ${res.rows[0].count} rows`);
    } catch (e) {
      console.error(`Error checking table "${table}":`, e.message);
    }
  }

  await client.end();
}

main();
