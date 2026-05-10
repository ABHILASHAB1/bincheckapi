import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchFromInternet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', (err) => { reject(err); });
  });
}

async function enrich() {
  console.log('🚀 Starting Global BIN Repository Enrichment...');
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Source 1: GitHub IIN List (CSV)
  const IIN_URL = 'https://raw.githubusercontent.com/IIN-list/IIN-list/master/IIN_list.csv';
  
  try {
    console.log('📡 Fetching Master IIN List from GitHub...');
    const csvData = await fetchFromInternet(IIN_URL);
    const lines = csvData.split('\n');
    
    let count = 0;
    console.log(`📊 Processing ${lines.length} potential records...`);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Format: BIN,Brand,Issuer,Type,Category,Country,CountryCode
      const parts = line.split(',');
      if (parts.length >= 6) {
        const bin = parts[0].trim().replace(/"/g, '');
        const scheme = parts[1]?.trim().replace(/"/g, '') || 'UNKNOWN';
        const issuer = parts[2]?.trim().replace(/"/g, '') || 'UNKNOWN';
        const type = parts[3]?.trim().replace(/"/g, '') || 'UNKNOWN';
        const country = parts[5]?.trim().replace(/"/g, '') || 'GLOBAL';

        try {
          await db.run(`
            INSERT INTO bins (bin, scheme, type, issuer, country, source)
            VALUES (?, ?, ?, ?, ?, 'INTERNET_SYNC')
            ON CONFLICT(bin) DO UPDATE SET
            scheme = excluded.scheme,
            type = excluded.type,
            issuer = CASE WHEN issuer = 'UNKNOWN' THEN excluded.issuer ELSE issuer END,
            country = excluded.country,
            updated_at = CURRENT_TIMESTAMP
          `, [bin, scheme, type, issuer, country]);
          count++;
          if (count % 1000 === 0) console.log(`✅ Synced ${count} records...`);
        } catch (e) {
          // Ignore duplicates or errors
        }
      }
    }
    console.log(`\n🎉 Enrichment Complete! Added/Updated ${count} records from the internet.`);
    console.log('Your BIN repository is now a global-scale reference.');
  } catch (e) {
    console.error('❌ Failed to enrich from internet:', e.message);
  } finally {
    await db.close();
  }
}

enrich();
