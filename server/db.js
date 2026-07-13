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

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT UNIQUE NOT NULL,
      client_name TEXT NOT NULL,
      balance INTEGER DEFAULT 1000,
      limit_queries INTEGER DEFAULT 1000,
      expires_at DATETIME NOT NULL,
      status TEXT DEFAULT 'active',
      allowed_countries TEXT DEFAULT '*',
      allowed_schemes TEXT DEFAULT '*',
      firebase_uid TEXT UNIQUE,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_api_key ON api_keys(api_key);
  `);

  // Migrate existing databases if columns are missing
  try {
    await db.exec("ALTER TABLE api_keys ADD COLUMN allowed_countries TEXT DEFAULT '*';");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE api_keys ADD COLUMN allowed_schemes TEXT DEFAULT '*';");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE api_keys ADD COLUMN firebase_uid TEXT;");
  } catch (e) {}
  try {
    await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_firebase_uid ON api_keys(firebase_uid);");
  } catch (e) {}
  try {
    await db.exec("ALTER TABLE api_keys ADD COLUMN email TEXT;");
  } catch (e) {}

  // Seed default AOU Client Key if missing
  try {
    const existing = await db.get('SELECT * FROM api_keys WHERE api_key = "AOU-SECRET-KEY-12345"');
    if (!existing) {
      await db.run(`
        INSERT INTO api_keys (api_key, client_name, balance, limit_queries, expires_at, allowed_countries, allowed_schemes)
        VALUES ('AOU-SECRET-KEY-12345', 'Client AOU', 50000, 50000, '2027-01-01 00:00:00', '*', '*')
      `);
      console.log('🌱 [DB] Seeding default Client AOU key successfully.');
    }
  } catch (e) {
    console.error('⚠️ [DB] Seeding api_keys failed:', e.message);
  }

  return db;
}
