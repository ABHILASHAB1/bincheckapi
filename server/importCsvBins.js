import { setupDatabase } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = 'c:\\Users\\Abhilash A B\\Downloads\\query_results_1778017775009.csv';

export async function importBinsFromCsv() {
  try {
    console.log('📂 Opening Database...');
    const db = await setupDatabase();
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV File not found at: ${csvPath}`);
    }

    console.log('📖 Reading CSV Data...');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip header
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    console.log(`🚀 Importing ${dataLines.length} BIN records...`);
    
    let inserted = 0;
    let updated = 0;

    // Use a transaction for speed
    await db.run('BEGIN TRANSACTION');

    for (const line of dataLines) {
      // Very basic CSV parser (handling quoted fields if any)
      const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!parts || parts.length < 7) continue;

      // parts: id, bin, scheme, type, category, issuer, country, source...
      const bin = parts[1].replace(/"/g, '').trim();
      const scheme = parts[2].replace(/"/g, '').trim();
      const type = parts[3].replace(/"/g, '').trim();
      const category = parts[4].replace(/"/g, '').trim();
      const issuer = parts[5].replace(/"/g, '').trim();
      const country = parts[6].replace(/"/g, '').trim();
      const source = parts[7]?.replace(/"/g, '').trim() || 'CSV_IMPORT';

      try {
        await db.run(`
          INSERT INTO bins (bin, scheme, type, category, issuer, country, source)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [bin, scheme, type, category, issuer, country, source]);
        inserted++;
      } catch (e) {
        // If duplicate bin, update it
        await db.run(`
          UPDATE bins 
          SET scheme = ?, type = ?, category = ?, issuer = ?, country = ?, source = ?, updated_at = CURRENT_TIMESTAMP
          WHERE bin = ?
        `, [scheme, type, category, issuer, country, source, bin]);
        updated++;
      }
    }

    await db.run('COMMIT');
    
    return {
      inserted,
      updated,
      total: inserted + updated
    };
    
  } catch (err) {
    console.error('❌ CRITICAL ERROR DURING IMPORT:', err.message);
    throw err;
  }
}
