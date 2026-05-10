/**
 * server/settlementEngine.js
 * Core logic for MDR calculation, merchant payouts, and EOD settlement.
 */

export class SettlementEngine {
    constructor(db) {
        this.db = db;
        // Standard Saudi Merchant Discount Rates (MDR) 2024
        this.FEES = {
            MADA: { pct: 0.008, fixed: 0.0 }, // 0.8%
            VISA: { pct: 0.022, fixed: 0.5 }, // 2.2% + 0.5 SAR
            MASTERCARD: { pct: 0.025, fixed: 0.5 }
        };
    }

    calculateMDR(amountRaw, scheme) {
        const amount = amountRaw / 100;
        const rule = this.FEES[scheme.toUpperCase()] || this.FEES.VISA;
        const fee = (amount * rule.pct) + rule.fixed;
        return {
            gross: amount,
            fee: parseFloat(fee.toFixed(2)),
            net: parseFloat((amount - fee).toFixed(2))
        };
    }

    async processEndOfDay() {
        if (!this.db) throw new Error('DB not initialized');

        // 1. Fetch all 'captured' payments that aren't settled yet
        const pending = await this.db.all(`
            SELECT * FROM payments 
            WHERE status = 'captured' 
        `);

        if (pending.length === 0) return { settledCount: 0, totalPayout: 0 };

        const batchId = `B-${Date.now()}`;
        const merchantGroups = {};

        // 2. Aggregate by merchant
        pending.forEach(tx => {
            const mid = tx.merchant_id || 'MERCHANT000001';
            if (!merchantGroups[mid]) {
                merchantGroups[mid] = { volume: 0, fees: 0, net: 0, count: 0, currency: tx.currency };
            }

            const brand = tx.card_brand || 'VISA';
            const calc = this.calculateMDR(tx.amount, brand);
            
            merchantGroups[mid].volume += calc.gross;
            merchantGroups[mid].fees += calc.fee;
            merchantGroups[mid].net += calc.net;
            merchantGroups[mid].count++;
        });

        // 3. Create Payout Records & Update Payment Status
        for (const mid in merchantGroups) {
            const payout = merchantGroups[mid];
            const payoutId = `pay_${Math.random().toString(36).substr(2, 9)}`;

            await this.db.run(
                `INSERT INTO payouts (id, merchant_id, total_volume, total_fees, net_payout, currency, status, batch_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [payoutId, mid, payout.volume, payout.fees, payout.net, payout.currency, 'paid', batchId]
            );
        }

        // 4. Mark payments as settled
        await this.db.run(`UPDATE payments SET status = 'settled' WHERE status = 'captured'`);

        return {
            batchId,
            merchantsSettled: Object.keys(merchantGroups).length,
            totalVolume: Object.values(merchantGroups).reduce((acc, g) => acc + g.volume, 0)
        };
    }

    async getSettlementReport() {
        return await this.db.all(`SELECT * FROM payouts ORDER BY created_at DESC LIMIT 50`);
    }
}
