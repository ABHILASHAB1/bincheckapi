import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function check() {
  const db = await open({
    filename: path.join(__dirname, 'server', 'remittance.sqlite'),
    driver: sqlite3.Database
  });

  const feed = await db.all('SELECT * FROM market_feed ORDER BY id DESC LIMIT 5');
  console.log('--- MARKET FEED (LAST 5) ---');
  console.log(JSON.stringify(feed, null, 2));
  process.exit(0);
}

check();
