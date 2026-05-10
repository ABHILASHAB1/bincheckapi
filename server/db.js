import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupDatabase() {
  const db = await open({
    filename: path.join(__dirname, 'bins.sqlite'),
    driver: sqlite3.Database
  });

  // 1. Core Schema Setup (No tc_code dependencies yet)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS bins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bin TEXT UNIQUE NOT NULL,
      scheme TEXT,
      type TEXT,
      category TEXT,
      issuer TEXT,
      country TEXT,
      source TEXT DEFAULT 'LOCAL',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bin ON bins(bin);
    CREATE INDEX IF NOT EXISTS idx_issuer ON bins(issuer);

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mti TEXT,
      pan TEXT,
      amount TEXT,
      stan TEXT,
      rrn TEXT,
      proc_code TEXT,
      resp_code TEXT,
      raw_request TEXT,
      raw_response TEXT,
      parsed_request TEXT,
      parsed_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tx_rrn ON transactions(rrn);
    CREATE INDEX IF NOT EXISTS idx_tx_mti ON transactions(mti);

    CREATE TABLE IF NOT EXISTS module_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_name TEXT NOT NULL,
      operation_type TEXT,
      parameters_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_module_name ON module_parameters(module_name);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      merchant_id TEXT,
      amount INTEGER,
      currency TEXT,
      status TEXT,
      transaction_type TEXT,
      stan TEXT,
      rrn TEXT,
      auth_code TEXT,
      response_code TEXT,
      card_brand TEXT,
      callback_url TEXT,
      description TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

    CREATE TABLE IF NOT EXISTS tokens (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      token TEXT UNIQUE,
      masked_pan TEXT,
      encrypted_pan TEXT,
      expiry_month TEXT,
      expiry_year TEXT,
      scheme TEXT,
      cardholder_name TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id TEXT PRIMARY KEY,
      merchant_id TEXT,
      total_volume REAL,
      total_fees REAL,
      net_payout REAL,
      currency TEXT,
      status TEXT DEFAULT 'pending',
      batch_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Forensic Migration: Add tc_code if missing
  try {
    await db.exec("ALTER TABLE transactions ADD COLUMN tc_code TEXT;");
    console.log("🛠️ [DB] Forensic Migration: tc_code column added.");
  } catch (e) {
    // Column likely already exists
  }

  // 3. Post-Migration: Add forensic indexes
  try {
    await db.exec("CREATE INDEX IF NOT EXISTS idx_tx_tc ON transactions(tc_code);");
  } catch (e) {
    console.warn("⚠️ [DB] Forensic Indexing skipped (already exists or column missing).");
  }

  return db;
}
