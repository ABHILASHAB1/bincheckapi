import axios from 'axios';
import { supabase } from './supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global FX Aggregation Service
 * Collects, Normalizes, and Broadcasts world-standard FX rates.
 */
export class FXAggregator {
  static SOURCES = {
    WISE: 'https://api.wise.com/v1/rates', // Mock or Real
    FRANKFURTER: 'https://api.frankfurter.app/latest',
    EXCHANGE_RATE: 'https://api.exchangerate.host/latest'
  };

  static async getAggregatedRates(base = 'SAR', targets = ['INR', 'PKR', 'EGP', 'USD', 'PHP']) {
    console.log(`🌐 [FX AGGREGATOR] Synchronizing ${base} corridors...`);
    
    const results = [];

    // 1. Parallel API Fetching
    const apiTasks = [
      this.fetchFrankfurter(base, targets),
      this.fetchExchangeRateHost(base, targets)
    ];

    const apiResults = await Promise.allSettled(apiTasks);
    apiResults.forEach(res => { if (res.status === 'fulfilled') results.push(...res.value); });

    // 2. Specialized Bank Scraper Integration (STC Pay / Al Rajhi Mock)
    const scraperResults = await this.fetchLocalScrapers(base, targets);
    results.push(...scraperResults);

    // 3. Normalization Engine
    let normalized = this.normalize(results);

    // 4. Fail-safe Fallback: If DB and APIs are empty, provide mock data so UI doesn't go blank
    if (!normalized || normalized.length === 0) {
       console.log("⚠️ [FX AGGREGATOR] Database and APIs are empty! Injecting fail-safe mock data...");
       const fallbackResults = targets.map(curr => {
         let rate = 1.0;
         if (curr === 'INR') rate = 22.35;
         if (curr === 'PHP') rate = 14.85;
         if (curr === 'PKR') rate = 74.20;
         if (curr === 'EGP') rate = 12.65;
         if (curr === 'BDT') rate = 29.10;
         if (curr === 'USD') rate = 0.266;

         return {
           source: 'Mock Provider (Awaiting Scraper)',
           pair: `${base}_${curr}`,
           rate: rate,
           cash_rate: rate - (rate * 0.005), // slightly worse for cash
           b2b_charge: 15,
           cash_charge: 20,
           transfer_time: 'In minutes',
           timestamp: new Date().toISOString(),
           is_scraped: false
         };
       });
       normalized = this.normalize(fallbackResults);
    }

    // 5. Persistence to TimescaleDB (Supabase)
    if (supabase) {
       await this.persistToHistory(normalized);
    }

    return normalized;
  }

  static async fetchFrankfurter(base, targets) {
    try {
      const res = await axios.get(`${this.SOURCES.FRANKFURTER}?from=${base}&to=${targets.join(',')}`);
      return Object.entries(res.data.rates).map(([curr, rate]) => ({
        source: 'Frankfurter',
        pair: `${base}_${curr}`,
        rate: rate,
        timestamp: new Date().toISOString()
      }));
    } catch (e) { return []; }
  }

  static async fetchExchangeRateHost(base, targets) {
    try {
      const res = await axios.get(`${this.SOURCES.EXCHANGE_RATE}?base=${base}&symbols=${targets.join(',')}`);
      return Object.entries(res.data.rates).map(([curr, rate]) => ({
        source: 'ExchangeRate.host',
        pair: `${base}_${curr}`,
        rate: rate,
        timestamp: new Date().toISOString()
      }));
    } catch (e) { return []; }
  }

  static async fetchLocalScrapers(base, targets) {
    if (!supabase) {
      console.warn('⚠️ [FX] Supabase client not initialized. Cannot fetch local scrapers.');
      return [];
    }
    
    try {
      let data = null;
      
      // 1. Try to read from the local JSON backup created by the Python scraper
      try {
        const jsonPath = path.join(__dirname, '../scraper/latest_rates.json');
        if (fs.existsSync(jsonPath)) {
            const fileContent = fs.readFileSync(jsonPath, 'utf8');
            data = JSON.parse(fileContent);
            console.log(`✅ [FX DB] Loaded ${data.length} live records from local JSON backup!`);
        }
      } catch (err) {
        console.warn('⚠️ [FX DB] Could not read local JSON backup:', err.message);
      }

      // 2. If no local JSON, try Supabase Cloud
      if (!data || data.length === 0) {
          const { data: dbData, error } = await supabase
            .from('bank_fx_rates')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(100);

          if (error) {
            console.warn('⚠️ [FX DB] Supabase fetch error:', error.message);
            return [];
          }
          data = dbData;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ [FX DB] No live scraped records found. Awaiting python script execution.');
        return [];
      }

      // Translate schema (handles both DB and JSON structure) into the standard FXAggregator format
      return data.map(row => ({
         source: row.bank_name,
         pair: `${row.base_currency}_${row.target_currency}`,
         rate: parseFloat(row.buy_rate || row.rate || 1.0), 
         cash_rate: parseFloat(row.sell_rate || row.buy_rate || 1.0),
         b2b_charge: parseFloat(row.b2b_charge_sar || 0),
         cash_charge: parseFloat(row.cash_charge_sar || 0),
         transfer_time: row.transfer_type || 'Standard',
         timestamp: row.updated_at || new Date().toISOString(),
         is_scraped: true
      }));

    } catch (e) {
      console.warn('⚠️ [FX DB] Fatal fetch error:', e.message);
      return [];
    }
  }

  static normalize(rawResults) {
    const pairs = {};
    rawResults.forEach(item => {
      if (!pairs[item.pair]) pairs[item.pair] = { rates: [], best_rate: 0, spread: 0 };
      pairs[item.pair].rates.push(item);
    });

    const amountToTransfer = 1000; // Standard SAR 1000 benchmark

    // Determine Best Rate, Fees, and Effective Payout
    return Object.entries(pairs).map(([pair, data]) => {
      const processed = data.rates.map(r => {
        // Intelligence Layer: Dynamic Fee Calculation
        let fee = 15; // Base fallback fee (SAR)
        if (r.source === 'STC Bank') fee = 10;
        if (r.source === 'Al Rajhi') fee = 20;
        if (r.source === 'Wise') fee = 12.5;
        
        // Use exact scraped fees if available from CTR KSA
        if (r.b2b_charge !== undefined) fee = r.b2b_charge;
        
        const received = (amountToTransfer - fee) * r.rate;
        const effectiveRate = received / amountToTransfer;

        return {
          ...r,
          fee,
          received_amount: received,
          effective_rate: effectiveRate,
          hidden_spread: ((r.rate - effectiveRate) / r.rate) * 100
        };
      });

      const sorted = processed.sort((a, b) => b.received_amount - a.received_amount);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      
      return {
        pair,
        best_payout: best.received_amount,
        best_provider: best.source,
        best_rate: best.rate,
        effective_rate: best.effective_rate,
        fee: best.fee,
        market_spread: ((best.rate - worst.rate) / best.rate) * 100,
        all_providers: sorted,
        last_updated: new Date().toISOString(),
        ai_recommendation: this.getAIRecommendation(best, worst)
      };
    });
  }

  static getAIRecommendation(best, worst) {
    const delta = ((best.received_amount - worst.received_amount) / worst.received_amount) * 100;
    if (delta > 2) return "STRONG BUY: Provider spread is significantly decoupled from market mid-point.";
    if (delta > 0.5) return "OPTIMIZED: Best available rate for this corridor discovered.";
    return "STABLE: Market rates are converged. Minimal savings available.";
  }

  static async persistToHistory(normalizedData) {
    try {
      if (!supabase) return;
      const records = normalizedData.map(d => ({
        pair: d.pair,
        rate: d.best_rate,
        provider: d.best_provider,
        spread_pct: d.market_spread
      }));
      // We assume an 'fx_history' table exists in Supabase
      const { error } = await supabase.from('fx_history').insert(records);
      if (error && error.code !== 'PGRST116') { // Ignore missing table errors
         console.warn('⚠️ [FX] Could not persist to fx_history table.');
      }
    } catch (e) { 
       console.warn('⚠️ [FX] Persistence suppressed:', e.message);
    }
  }
}
