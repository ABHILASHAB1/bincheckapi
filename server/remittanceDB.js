import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupRemittanceDB() {
  const db = await open({
    filename: path.join(__dirname, 'remittance.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      logo_url TEXT,
      type TEXT -- Bank, Wallet, Exchange
    );

    CREATE TABLE IF NOT EXISTS fx_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      corridor TEXT, -- e.g., SAR_INR
      rate REAL,
      margin REAL,
      provider_code TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_code TEXT,
      corridor TEXT,
      fixed_fee REAL,
      percent_fee REAL,
      min_amount REAL,
      speed TEXT -- Minutes, Hours, Days
    );

    CREATE TABLE IF NOT EXISTS market_feed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT, -- RATE_SPIKE, FEE_REDUCTION, ALERT
      message TEXT,
      severity TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS historical_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      corridor TEXT,
      provider_code TEXT,
      rate REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed initial providers if empty
  const providersCount = await db.get('SELECT COUNT(*) as count FROM providers');
  if (providersCount.count === 0) {
    await db.run(`INSERT INTO providers (code, name, type) VALUES 
      ('ALRAJHI', 'Tahweel Al Rajhi', 'Bank'),
      ('SNB', 'SNB QuickPay', 'Bank'),
      ('STCPAY', 'STC Pay', 'Wallet'),
      ('ENJAZ', 'Enjaz (Bank AlBilad)', 'Bank'),
      ('ALINMA', 'Alinma Pay', 'Bank'),
      ('FAWRI', 'Fawri (Bank AlJazira)', 'Bank'),
      ('URPAY', 'urpay', 'Wallet')
    `);

    // Seed some initial rates & fees
    const corridors = ['SAR_INR', 'SAR_PHP', 'SAR_PKR', 'SAR_EGP', 'SAR_USD', 'SAR_GBP'];
    const providers = ['ALRAJHI', 'SNB', 'STCPAY', 'ENJAZ', 'ALINMA', 'FAWRI', 'URPAY'];

    for (const corridor of corridors) {
      let baseRate = 1.0;
      if (corridor === 'SAR_INR') baseRate = 22.15;
      if (corridor === 'SAR_PHP') baseRate = 14.85;
      if (corridor === 'SAR_PKR') baseRate = 74.20;
      if (corridor === 'SAR_EGP') baseRate = 12.40;
      if (corridor === 'SAR_USD') baseRate = 0.26;
      if (corridor === 'SAR_GBP') baseRate = 0.21;

      for (const p of providers) {
        const margin = Math.random() * 0.02; // 0-2% margin
        await db.run(`INSERT INTO fx_rates (corridor, rate, margin, provider_code) VALUES (?, ?, ?, ?)`, 
          corridor, baseRate * (1 - margin), margin, p);
        
        await db.run(`INSERT INTO fees (provider_code, corridor, fixed_fee, percent_fee, speed) VALUES (?, ?, ?, ?, ?)`,
          p, corridor, Math.floor(Math.random() * 20), 0, '10 Minutes');
      }
    }
  }

  return db;
}
