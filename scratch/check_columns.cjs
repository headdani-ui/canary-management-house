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
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`\nTable "${table}":`);
      res.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
      });
    } catch (e) {
      console.error(`Error checking columns for table "${table}":`, e.message);
    }
  }

  await client.end();
}

main();
