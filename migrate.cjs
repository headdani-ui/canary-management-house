require('dotenv').config();
const { Client } = require('pg');

const schema = `
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(255),
  description TEXT,
  totalRooms INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(50) PRIMARY KEY,
  propertyId VARCHAR(50) REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  floor INT,
  size_sqm NUMERIC,
  monthlyRent NUMERIC,
  status VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
  id VARCHAR(50) PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  documentType VARCHAR(50),
  documentNumber VARCHAR(100),
  nationality VARCHAR(100),
  dateOfBirth DATE,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(50) PRIMARY KEY,
  guestId VARCHAR(50) REFERENCES guests(id) ON DELETE CASCADE,
  roomId VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
  propertyId VARCHAR(50) REFERENCES properties(id) ON DELETE CASCADE,
  startDate DATE,
  endDate DATE,
  monthlyRent NUMERIC,
  deposit NUMERIC,
  franchise NUMERIC,
  status VARCHAR(50),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS costs_header (
  id VARCHAR(50) PRIMARY KEY,
  propertyId VARCHAR(50) REFERENCES properties(id) ON DELETE CASCADE,
  costType VARCHAR(100),
  amount NUMERIC,
  month INT,
  year INT,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_headers (
  id VARCHAR(50) PRIMARY KEY,
  invoiceNumber VARCHAR(100),
  guestId VARCHAR(50) REFERENCES guests(id) ON DELETE CASCADE,
  roomId VARCHAR(50) REFERENCES rooms(id) ON DELETE CASCADE,
  contractId VARCHAR(50) REFERENCES contracts(id) ON DELETE CASCADE,
  propertyId VARCHAR(50) REFERENCES properties(id) ON DELETE CASCADE,
  month INT,
  year INT,
  periodStart DATE,
  periodEnd DATE,
  issueDate DATE,
  dueDate DATE,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  status VARCHAR(50),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS costs_details (
  id VARCHAR(50) PRIMARY KEY,
  costHeaderId VARCHAR(50) REFERENCES costs_header(id) ON DELETE CASCADE,
  guestId VARCHAR(50) REFERENCES guests(id) ON DELETE SET NULL,
  roomId VARCHAR(50) REFERENCES rooms(id) ON DELETE SET NULL,
  contractId VARCHAR(50) REFERENCES contracts(id) ON DELETE SET NULL,
  amount NUMERIC,
  status VARCHAR(50),
  invoiceId VARCHAR(50) REFERENCES invoice_headers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS invoice_details (
  id VARCHAR(50) PRIMARY KEY,
  invoiceId VARCHAR(50) REFERENCES invoice_headers(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC,
  unitPrice NUMERIC,
  total NUMERIC
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  invoiceId VARCHAR(50) REFERENCES invoice_headers(id) ON DELETE CASCADE,
  amount NUMERIC,
  paymentDate DATE,
  paymentMethod VARCHAR(100),
  reference VARCHAR(255),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  console.log('Connected to Neon Database.');
  try {
    await client.query(schema);
    console.log('Schema created successfully.');
  } catch (e) {
    console.error('Error creating schema', e);
  } finally {
    await client.end();
  }
}

main();
