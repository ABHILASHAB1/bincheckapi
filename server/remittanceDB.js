import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fetchGlobalRates } from './fxAggregator.js';

let db;
let simulationInterval = null;
let aggregatorInterval = null;
let trueBaselines = {}; // Holds the real-world ECB rates

const INITIAL_RATES = [
    { pair: 'SAR/INR', rate: 22.25, spread: 0.015, trend: 'stable' },
    { pair: 'USD/EUR', rate: 0.92, spread: 0.008, trend: 'stable' },
    { pair: 'SAR/USD', rate: 0.27, spread: 0.005, trend: 'stable' },
    { pair: 'GBP/SAR', rate: 4.71, spread: 0.012, trend: 'stable' }
];

export const initRemittanceDB = async () => {
    db = await open({
        filename: 'server/bins.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS fx_rates (
            pair TEXT PRIMARY KEY,
            rate REAL,
            spread REAL,
            trend TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed initial rates if empty
    for (const fx of INITIAL_RATES) {
        await db.run(
            `INSERT OR IGNORE INTO fx_rates (pair, rate, spread, trend) VALUES (?, ?, ?, ?)`,
            [fx.pair, fx.rate, fx.spread, fx.trend]
        );
    }

    console.log('✅ Remittance FX Database initialized.');
    
    // Initial sync with Real-World Aggregator
    await syncWithAggregator();

    // Sync with true world markets every hour
    aggregatorInterval = setInterval(syncWithAggregator, 60 * 60 * 1000);

    // Start Market Simulation
    startMarketSimulation();
};

const syncWithAggregator = async () => {
    console.log('🌍 [Aggregator] Syncing live baselines from Frankfurter ECB...');
    const liveRates = await fetchGlobalRates();
    for (const fx of liveRates) {
        trueBaselines[fx.pair] = fx.rate;
        // Upsert immediately with the true baseline
        await upsertFXRate(fx.pair, fx.rate);
    }
    console.log('🌍 [Aggregator] Baselines synchronized.');
};

const startMarketSimulation = () => {
    if (simulationInterval) clearInterval(simulationInterval);
    
    console.log('📈 Starting live FX market simulation engine...');
    
    // Poll every 5 seconds for high-frequency trading simulation
    simulationInterval = setInterval(async () => {
        try {
            const currentRates = await getLiveRates();
            
            for (const fx of currentRates) {
                // Micro-volatility: shift by +/- 0.2% max around the TRUE baseline
                const baseline = trueBaselines[fx.pair] || fx.rate;
                const volatility = (Math.random() * 0.004) - 0.002;
                
                let newRate = baseline + (baseline * volatility);
                
                // Hardcode SAR/USD peg since it's practically fixed
                if (fx.pair === 'SAR/USD') newRate = 0.2666; 

                const newTrend = newRate > fx.rate ? 'up' : newRate < fx.rate ? 'down' : 'stable';

                
                // Update DB
                await db.run(
                    `UPDATE fx_rates SET rate = ?, trend = ?, updated_at = CURRENT_TIMESTAMP WHERE pair = ?`,
                    [newRate, newTrend, fx.pair]
                );
            }
        } catch (error) {
            console.error('Error simulating market:', error);
        }
    }, 5000);
};

export const getLiveRates = async () => {
    if (!db) return [];
    return await db.all('SELECT pair, rate, spread, trend, updated_at FROM fx_rates');
};

export const upsertFXRate = async (pair, newRate) => {
    if (!db) return false;
    
    // Default spread for newly discovered pairs
    const DEFAULT_SPREAD = 0.01; 
    
    const existing = await db.get('SELECT rate FROM fx_rates WHERE pair = ?', [pair]);
    
    if (!existing) {
        // Insert new pair dynamically
        await db.run(
            'INSERT INTO fx_rates (pair, rate, spread, trend) VALUES (?, ?, ?, ?)',
            [pair, newRate, DEFAULT_SPREAD, 'stable']
        );
        console.log(`[FX DB] Dynamically registered new currency pair: ${pair}`);
        return true;
    }

    // Update existing pair
    const trend = newRate > existing.rate ? 'up' : newRate < existing.rate ? 'down' : 'stable';
    await db.run(
        'UPDATE fx_rates SET rate = ?, trend = ?, updated_at = CURRENT_TIMESTAMP WHERE pair = ?',
        [newRate, trend, pair]
    );
    return true;
};
