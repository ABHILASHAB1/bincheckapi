import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupDatabase() {
  const dbFilename = process.env.DB_PATH || path.join(__dirname, 'bins.sqlite');
  
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
  `);

  return db;
}
