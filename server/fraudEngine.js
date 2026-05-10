/**
 * server/fraudEngine.js
 * AI-Driven Risk Scoring & Rule-Based Fraud Detection for mada Transactions.
 */

export class FraudEngine {
    constructor() {
        this.blacklist = new Set(['5888450000000001']); // Mock blacklisted card
        this.highRiskBins = ['411111']; // Mock high-risk BINS
    }

    /**
     * analyzeTransaction
     * Calculates a risk score from 0 to 100.
     */
    analyzeTransaction(payload) {
        let score = 0;
        const { amount, source, description } = payload;
        const pan = source?.number || '';
        const bin = pan.slice(0, 6);

        // 1. Amount Thresholds
        if (amount > 500000) score += 40; // > 5000 SAR
        if (amount > 1000000) score += 60; // > 10000 SAR

        // 2. Blacklist Check
        if (this.blacklist.has(pan)) {
            return { score: 100, decision: 'BLOCK', reason: 'CARD_BLACKISTED' };
        }

        // 3. BIN Risk
        if (this.highRiskBins.includes(bin)) score += 30;

        // 4. Velocity Simulation (Mock)
        if (description?.includes('TEST_VELOCITY')) score += 50;

        // 5. Domestic mada check
        const isMada = pan.startsWith('5888') || pan.startsWith('9682') || pan.startsWith('4408');
        if (isMada && score > 70) {
            return { score, decision: 'CHALLENGE', reason: 'MADA_HIGH_VALUE_ECOM' };
        }

        return {
            score,
            decision: score >= 80 ? 'BLOCK' : (score >= 40 ? 'CHALLENGE' : 'APPROVE'),
            reason: score >= 40 ? 'RISK_SCORE_THRESHOLD' : 'SAFE'
        };
    }

    toggleBlacklist(pan) {
        if (this.blacklist.has(pan)) this.blacklist.delete(pan);
        else this.blacklist.add(pan);
        return Array.from(this.blacklist);
    }
}
