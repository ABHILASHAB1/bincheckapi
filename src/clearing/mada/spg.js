/**
 * src/clearing/mada/spg.js
 * mada Domestic Clearing Engine (Saudi Payment Gateway).
 */

export class MadaEngine {
    /**
     * Build mada Domestic Transaction Record (168 Bytes)
     * Specifically calibrated for Saudi mada SPG requirements.
     */
    static buildDomesticRecord(tx) {
        const pan = tx.pan.replace(/\D/g, '').padStart(16, '0');
        const amt = Math.floor(tx.amount * 100).toString().padStart(12, '0');
        const date = tx.date || new Date().toISOString().slice(2, 8).replace(/-/g, '');
        
        let record = 'MD'; // mada Domestic TC
        record += 'TCR0';
        record += pan;
        record += amt;
        record += '682'; // SAR
        record += date;
        record += (tx.stan || '000000').padStart(6, '0');
        record += (tx.acquirerId || '112233').padEnd(11, ' '); // Saudi Acquirer ID
        record += (tx.terminalId || 'MADA0001').padEnd(8, ' ');
        record += 'MADA MERCHANT           '.padEnd(25, ' ');
        record += 'RIYADH       ';
        record += 'SA';
        
        return record.padEnd(168, ' ');
    }

    static buildHeader() {
        return `MADA_HDR_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`.padEnd(168, ' ');
    }

    static buildTrailer(count, amount) {
        return `MADA_TRL_${count.toString().padStart(10, '0')}_${Math.floor(amount * 100).toString().padStart(15, '0')}`.padEnd(168, ' ');
    }
}
