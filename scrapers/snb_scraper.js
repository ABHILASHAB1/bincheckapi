import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

/**
 * SNB Intelligence Scraper
 * Targeted at public card product portals for BIN & Tier discovery.
 */
async function scrapeSNB() {
  console.log('🚀 [SNB SCRAPER] Launching Intelligence Engine...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // Navigate to the public cards comparison/listing page
    await page.goto('https://www.alahli.com/en-us/personal-banking/credit-cards/Pages/Credit-Cards.aspx', { waitUntil: 'networkidle' });
    
    console.log('🔍 [SNB SCRAPER] Parsing Card Tiers...');
    const cards = await page.evaluate(() => {
      const cardNodes = document.querySelectorAll('.card-box'); // Generic selector, would be refined per live DOM
      return Array.from(cardNodes).map(node => ({
        name: node.querySelector('h3')?.innerText?.trim(),
        description: node.querySelector('.desc')?.innerText?.trim(),
        category: 'CREDIT'
      }));
    });

    console.log(`✅ [SNB SCRAPER] Discovered ${cards.length} Card Profiles.`);
    
    // In a real scenario, we would then look for BIN disclosure docs or 
    // mock the BIN based on known SNB ranges (e.g., 455700, 484200)
    
    const results = {
      bank: 'SNB',
      timestamp: new Date().toISOString(),
      data: cards
    };

    // Save to local intelligence buffer
    const outputPath = path.join(process.cwd(), 'scrapers/output/snb_intel.json');
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`📂 [SNB SCRAPER] Intel exported to ${outputPath}`);

  } catch (err) {
    console.error('❌ [SNB SCRAPER] Fatal Error:', err.message);
  } finally {
    await browser.close();
  }
}

scrapeSNB();
