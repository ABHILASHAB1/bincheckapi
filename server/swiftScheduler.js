import cron from 'node-cron';
import { runFullScraper } from './swiftScraper.js';

export function initSwiftScheduler() {
    // Schedule to run every Sunday at 2:00 AM server time
    cron.schedule('0 2 * * 0', async () => {
        console.log('⏰ [CRON] Starting scheduled weekly SWIFT code full scrape...');
        try {
            await runFullScraper();
        } catch (error) {
            console.error('❌ [CRON] Scheduled SWIFT scrape failed:', error);
        }
    });

    console.log('✅ SWIFT Web Scraper scheduler initialized (Runs weekly).');
}
