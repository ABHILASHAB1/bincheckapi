/**
 * src/clearing/manager.js
 * Scheme-Aware Clearing Orchestrator.
 * Enforces TC90/TC91/TC92 structural hierarchy.
 */

import { Base2Engine } from './visa/base2.js';
import { MadaEngine } from './mada/spg.js';

export class ClearingManager {
    static generateVisaBatch(transactions) {
        const records = [];
        let totalAmount = 0;

        // 1. Mandatory File Header (TC90)
        records.push(Base2Engine.buildHeader());

        // 2. Transaction Records (TCR0 per transaction)
        transactions.forEach(tx => {
            records.push(Base2Engine.buildTCR0(tx));
            totalAmount += parseFloat(tx.amount || 0);
            
            // Add Addendum if needed (e.g. TCR1)
            if (tx.tc_code === 'TC33' || tx.tc_code === 'TC06') {
                records.push(Base2Engine.buildTCR1(tx));
            }
        });

        // 3. Batch Trailer (TC91) - Reconciliation Record
        records.push(Base2Engine.buildBatchTrailer(transactions.length, totalAmount));

        // 4. File Trailer (TC92) - EOF Control
        records.push(Base2Engine.buildFileTrailer(1, transactions.length, totalAmount));

        return records.join('\n');
    }

    static generateMadaBatch(transactions) {
        // mada SPG specific structure
        return MadaEngine.generateBatch(transactions);
    }
}
