import { setupRemittanceDB } from './remittanceDB.js';

let db;

async function getDB() {
  if (!db) db = await setupRemittanceDB();
  return db;
}

export const RemittanceService = {
  async getProviders() {
    const database = await getDB();
    return database.all('SELECT * FROM providers');
  },

  async compareRates(corridor, amount) {
    const database = await getDB();
    const results = await database.all(`
      SELECT p.name, p.code, r.rate, r.margin, f.fixed_fee, f.percent_fee, f.speed
      FROM providers p
      JOIN fx_rates r ON p.code = r.provider_code
      JOIN fees f ON p.code = f.provider_code AND r.corridor = f.corridor
      WHERE r.corridor = ?
    `, corridor);

    return results.map(res => {
      const fee = res.fixed_fee + (amount * (res.percent_fee / 100));
      const effectiveRate = res.rate;
      const amountReceived = (amount - fee) * effectiveRate;
      const totalCost = fee + (amount * res.margin); // Fee + FX Margin hidden cost

      return {
        ...res,
        totalFee: fee,
        amountReceived,
        totalCost,
        currency: corridor.split('_')[1]
      };
    });
  },

  async getTrends(corridor) {
    const database = await getDB();
    // Return mock historical data for the chart
    return database.all(`
      SELECT rate, timestamp, provider_code
      FROM historical_rates
      WHERE corridor = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `, corridor);
  },

  async getLiveFeed() {
    const database = await getDB();
    return database.all('SELECT * FROM market_feed ORDER BY timestamp DESC LIMIT 10');
  },

  async addFeedMessage(message, severity = 'LOW') {
    const database = await getDB();
    await database.run(
      'INSERT INTO market_feed (message, severity) VALUES (?, ?)',
      [message, severity]
    );
    // Prune old
    await database.run('DELETE FROM market_feed WHERE id NOT IN (SELECT id FROM market_feed ORDER BY timestamp DESC LIMIT 50)');
  },

  // Intelligence: AI Recommendation Logic (Multi-Factor Scoring)
  async getSmartRecommendation(corridor, amount) {
    const options = await this.compareRates(corridor, amount);
    if (options.length === 0) return null;

    // Helper to normalize speed to minutes for comparison
    const parseSpeed = (speedStr) => {
      const s = speedStr.toLowerCase();
      const num = parseInt(s) || 60;
      if (s.includes('minute')) return num;
      if (s.includes('hour')) return num * 60;
      if (s.includes('day')) return num * 1440;
      return 1440; // Default to a day
    };

    // Calculate "Intelligence Score" (0-100)
    // 70% Weight on Amount Received, 30% Weight on Speed
    const maxAmount = Math.max(...options.map(o => o.amountReceived));
    const minSpeed = Math.min(...options.map(o => parseSpeed(o.speed)));

    const scoredOptions = options.map(opt => {
      const speedInMinutes = parseSpeed(opt.speed);
      
      const valueScore = (opt.amountReceived / maxAmount) * 70;
      const speedScore = (minSpeed / speedInMinutes) * 30;
      const totalScore = valueScore + speedScore;

      return { ...opt, aiScore: Math.round(totalScore) };
    });

    const bestValue = [...scoredOptions].sort((a, b) => b.amountReceived - a.amountReceived)[0];
    const bestOverall = [...scoredOptions].sort((a, b) => b.aiScore - a.aiScore)[0];
    const fastest = [...scoredOptions].sort((a, b) => parseSpeed(a.speed) - parseSpeed(b.speed))[0];

    // Contextual Intelligence Generation
    let intelligence = `Based on a real-time analysis of ${options.length} providers for ${corridor}: `;
    
    if (bestOverall.code === fastest.code && bestOverall.code === bestValue.code) {
      intelligence += `${bestOverall.name} is the clear winner, offering the best rate and the fastest delivery.`;
    } else if (bestOverall.code === bestValue.code) {
      intelligence += `${bestOverall.name} provides the maximum payout of ${bestOverall.amountReceived.toFixed(2)} ${bestOverall.currency}. `;
      intelligence += `Wait time is ${bestOverall.speed}, but the value outweighs the delay.`;
    } else {
      intelligence += `${bestOverall.name} is our AI-recommended choice for the best balance of speed and payout. `;
      intelligence += `You could get slightly more with ${bestValue.name}, but it would be significantly slower.`;
    }

    return {
      bestOverall,
      bestValue,
      fastest,
      recommendation: intelligence,
      marketAnalysis: {
        volatility: 'LOW',
        trend: 'STABLE',
        optimalWindow: 'NOW'
      },
      action: 'SEND_NOW'
    };
  }
};
