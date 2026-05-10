/**
 * Enterprise Pulse Engine
 * Generates synthetic real-time financial, operational, and market data
 * to simulate a live global command center environment.
 */
export const PulseEngine = {
  
  /**
   * Generate a "Market Pulse" packet (Currencies, Stocks, Oil)
   */
  generateMarketPulse() {
    return {
      type: 'MARKET',
      timestamp: new Date().toISOString(),
      data: {
        'SAR/USD': (3.75 + (Math.random() * 0.001 - 0.0005)).toFixed(4),
        'XAU/USD': (2342 + (Math.random() * 10 - 5)).toFixed(2),
        'OIL/BRENT': (84.2 + (Math.random() * 0.5 - 0.25)).toFixed(2),
        'SP500': (5240 + (Math.random() * 5 - 2)).toFixed(2),
      }
    };
  },

  /**
   * Generate an "Operational Pulse" packet (Transaction volume, latency, errors)
   */
  generateOpsPulse() {
    return {
      type: 'OPS',
      timestamp: new Date().toISOString(),
      data: {
        tps: Math.floor(800 + Math.random() * 400),
        latency: (0.35 + Math.random() * 0.15).toFixed(2),
        errorRate: (Math.random() * 0.05).toFixed(3),
        activeNodes: 124 + (Math.random() > 0.9 ? 1 : 0)
      }
    };
  },

  /**
   * Generate a "Transaction Event" for the live stream
   */
  generateTxEvent() {
    const merchants = ['Al-Rajhi Bank', 'STC Pay', 'NEOM Logistics', 'Jeddah Waterfront', 'Riyadh Metro'];
    const mtis = ['0100', '0200', '0400', 'MT103'];
    
    return {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      timestamp: new Date().toLocaleTimeString(),
      description: merchants[Math.floor(Math.random() * merchants.length)],
      mti: mtis[Math.floor(Math.random() * mtis.length)],
      amount: (Math.random() * 100000).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      currency: 'SAR',
      risk: (Math.random() * 5).toFixed(1),
      status: Math.random() > 0.1 ? 'AUTHORIZED' : 'DECLINED'
    };
  }
};
