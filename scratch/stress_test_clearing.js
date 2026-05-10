/**
 * scratch/stress_test_clearing.js
 * Generates 1,000 mixed-TC transactions with self-healing schema migration.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runStressTest() {
  const db = await open({
    filename: path.join(__dirname, '../server/bins.sqlite'),
    driver: sqlite3.Database
  });

  console.log('📂 [STRESS TEST] Verifying database schema...');
  
  // Self-Healing Migration
  try {
    await db.exec("ALTER TABLE transactions ADD COLUMN tc_code TEXT;");
    console.log("🛠️ [STRESS TEST] Added missing tc_code column.");
  } catch (e) {
    // Column exists or table missing
  }

  console.log('🚀 [STRESS TEST] Seeding 1,000 transactions...');

  const tcs = [
    { code: 'TC05', mti: '0200', proc: '000000' },
    { code: 'TC06', mti: '0200', proc: '200000' },
    { code: 'TC07', mti: '0200', proc: '010000' },
    { code: 'TC25', mti: '0420', proc: '000000' },
    { code: 'TC33', mti: '0220', proc: '000000' }
  ];

  await db.run('BEGIN TRANSACTION');
  
  for (let i = 0; i < 1000; i++) {
    const tc = tcs[Math.floor(Math.random() * tcs.length)];
    const amount = (Math.random() * 5000 + 10).toFixed(2);
    const stan = (100000 + i).toString();
    const rrn = '800' + i.toString().padStart(9, '0');
    const pan = '411122223333' + Math.floor(Math.random() * 9000 + 1000).toString();

    await db.run(
      `INSERT INTO transactions (mti, tc_code, pan, amount, stan, rrn, resp_code, parsed_request, parsed_response) 
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [tc.mti, tc.code, pan, amount, stan, rrn, '00', '{}', '{}']
    );
  }

  await db.run('COMMIT');
  console.log('✅ [STRESS TEST] 1,000 transactions successfully seeded.');
  await db.close();
}

runStressTest().catch(console.error);
