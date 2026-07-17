import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupDatabase() {
  const dbFilename = process.env.DB_PATH || path.join(__dirname, 'bins.sqlite');
  
  // Ensure the parent directory of the database exists
  const dbDir = path.dirname(dbFilename);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = await open({
    filename: dbFilename,
    driver: sqlite3.Database
  });

  // Core Schema Setup for Bins
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
    CREATE TABLE IF NOT EXISTS banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      short_name TEXT,
      official_name TEXT,
      country TEXT,
      swift_code TEXT,
      website TEXT,
      customer_service TEXT,
      email TEXT,
      brand_color TEXT,
      brand_text_color TEXT,
      card_color TEXT,
      logo_url TEXT,
      icon_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_banks_swift ON banks(swift_code);
    CREATE INDEX IF NOT EXISTS idx_banks_name ON banks(official_name);
    CREATE INDEX IF NOT EXISTS idx_banks_short_name ON banks(short_name);
  `);

  return db;
}
