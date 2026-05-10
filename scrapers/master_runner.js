import { supabase } from '../server/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Master Scraper Orchestrator
 * Coordinates multiple KSA bank scrapers and syncs to Enterprise Cloud.
 */
async function runMasterSync() {
  console.log('🏗️ [MASTER SCRAPER] Initiating Global Sync...');
  
  const scraperFiles = [
    'snb_scraper.js',
    // 'alrajhi_scraper.js', // Future nodes
    // 'riyad_scraper.js'
  ];

  for (const file of scraperFiles) {
    try {
      console.log(`📡 [MASTER SCRAPER] Executing: ${file}`);
      execSync(`node scrapers/${file}`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`⚠️ [MASTER SCRAPER] ${file} failed, skipping...`);
    }
  }

  // Final Phase: Sync Output to Supabase
  console.log('🔄 [MASTER SCRAPER] Synchronizing Intel to Cloud...');
  const outputDir = path.join(process.cwd(), 'scrapers/output');
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    for (const file of files) {
      if (file.endsWith('_intel.json')) {
        const intel = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
        
        // Map scraped data to Enterprise Schema
        const binRecords = intel.data.map(card => ({
           bin_prefix: 'MOCK_' + Math.floor(Math.random()*900000+100000), // In production, this would be actual BINs found
           issuer_name: intel.bank,
           card_scheme: 'mada',
           card_type: card.category || 'DEBIT',
           country_iso: 'SA'
        }));

        if (supabase) {
           const { error } = await supabase.from('bin_directory').upsert(binRecords);
           if (error) console.error(`❌ [MASTER SCRAPER] Cloud Sync Error for ${intel.bank}:`, error.message);
           else console.log(`✅ [MASTER SCRAPER] Cloud Sync Success for ${intel.bank}.`);
        }
      }
    }
  }

  console.log('🏁 [MASTER SCRAPER] Full Market Sync Complete.');
}

runMasterSync();
