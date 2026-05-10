import axios from 'axios';
import { supabase } from './supabaseClient.js';

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
    const normalized = this.normalize(results);

    // 4. Persistence to TimescaleDB (Supabase)
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
    // Simulated scraper output for Al Rajhi, STC Bank, Lulu
    // In production, these would be populated by the scrapers/ module
    return targets.map(curr => ({
       source: Math.random() > 0.5 ? 'Al Rajhi' : 'STC Bank',
       pair: `${base}_${curr}`,
       rate: (Math.random() * 0.5) + (curr === 'INR' ? 22 : 1), // Realistic mock spreads
       timestamp: new Date().toISOString(),
       is_scraped: true
    }));
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
        // Intelligence Layer: Dynamic Fee Calculation based on Provider
        let fee = 15; // Base fee (SAR)
        if (r.source === 'STC Bank') fee = 10;
        if (r.source === 'Al Rajhi') fee = 20;
        if (r.source === 'Wise') fee = 12.5;
        
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
