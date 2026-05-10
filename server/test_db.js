import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function test() {
  try {
    console.log('Testing SQLite connection...');
    const db = await open({
      filename: path.join(__dirname, 'test.sqlite'),
      driver: sqlite3.Database
    });
    console.log('Opened database.');
    await db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, val TEXT)');
    await db.run('INSERT INTO test (val) VALUES (?)', ['hello']);
    const row = await db.get('SELECT * FROM test');
    console.log('Data:', row);
    await db.close();
    console.log('SUCCESS');
  } catch (err) {
    console.error('FAILURE:', err.message);
  }
}

test();
