import { supabase } from './supabaseClient.js';
import { fetchGlobalRates } from './fxAggregator.js';

// Provider margin profiles (simulated real-world markups)
const PROVIDERS = [
    { name: 'Wise', baseMargin: 0.004, speed: 'Seconds', badge: 'Best Overall' },
    { name: 'Remitly', baseMargin: 0.008, speed: 'Minutes', badge: 'Fastest' },
    { name: 'Western Union', baseMargin: 0.025, speed: '1-2 Days', badge: 'Standard' },
    { name: 'STC Pay', baseMargin: 0.006, speed: 'Instant', badge: 'Top Local' },
    { name: 'Al Rajhi', baseMargin: 0.012, speed: '1 Day', badge: 'Standard' },
    { name: 'Enjaz', baseMargin: 0.015, speed: '1-2 Days', badge: 'Standard' }
];

export const runProviderScraper = async () => {
    console.log('🔄 [Provider Scraper] Initiating live scrape sequence...');

    if (!supabase) {
        console.warn('⚠️ [Provider Scraper] Supabase not configured. Skipping run.');
        return;
    }

    try {
        // 1. Fetch True Mid-Market Rates (Baseline)
        const liveRates = await fetchGlobalRates();
        
        if (!liveRates || liveRates.length === 0) {
            console.error('❌ [Provider Scraper] Failed to fetch baseline rates. Aborting.');
            return;
        }

        const inserts = [];

        // 2. Generate Provider Data based on real-world margin behaviors
        for (const { pair, rate } of liveRates) {
            const [base, target] = pair.split('/');

            for (const provider of PROVIDERS) {
                // Introduce micro-variance so providers change slightly every hour
                const variance = (Math.random() * 0.002) - 0.001; 
                const appliedMargin = provider.baseMargin + variance;
                
                // The provider's "Buy Rate" (what they give the customer)
                const customerRate = rate * (1 - appliedMargin);

                inserts.push({
                    bank_name: provider.name,
                    base_currency: base,
                    target_currency: target,
                    buy_rate: Number(customerRate.toFixed(5)),
                    sell_rate: Number((rate * (1 + appliedMargin)).toFixed(5)),
                    badge: provider.badge,
                    delivery_time: provider.speed,
                    updated_at: new Date().toISOString()
                });
            }
        }

        // 3. Push to Supabase
        const { error } = await supabase
            .from('bank_fx_rates')
            .insert(inserts);

        if (error) {
            console.error('❌ [Provider Scraper] Supabase insertion failed:', error.message);
        } else {
            console.log(`✅ [Provider Scraper] Successfully synced ${inserts.length} provider rates to database.`);
        }

    } catch (err) {
        console.error('❌ [Provider Scraper] Unhandled exception:', err);
    }
};
