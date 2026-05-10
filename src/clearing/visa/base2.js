/**
 * src/clearing/visa/base2.js
 * Hardened Visa BASE II CTF Engine (Strict Compliance Version).
 * Enforces 168-byte fixed-width, PAN masking, and Batch Totals.
 */

export class Base2Engine {
    /**
     * PCI-Compliant PAN Masking (Keep 6, Mask 6, Keep 4)
     */
    static maskPan(pan) {
        if (!pan || pan.length < 10) return pan.padEnd(16, ' ');
        const clean = pan.replace(/\D/g, '');
        return (clean.substring(0, 6) + '000000' + clean.slice(-4)).substring(0, 16);
    }

    /**
     * Build TCR0 - Core Financial (168 Bytes)
     */
    static buildTCR0(tx) {
        const maskedPan = this.maskPan(tx.pan);
        const amt = Math.floor(tx.amount * 100).toString().padStart(12, '0');
        const date = tx.date || new Date().toISOString().slice(2, 8).replace(/-/g, '');
        const time = tx.time || new Date().toISOString().slice(11, 17).replace(/:/g, '');
        const rrn = (tx.rrn || '000000000001').padEnd(12, ' ');

        let record = (tx.tc_code || '05').substring(2, 4).padStart(2, '0'); // TC
        record += '00'; // TCR Number
        record += maskedPan; // PAN (16)
        record += '6'; // Transaction Type
        record += amt; // Amount (12)
        record += '840'; // Currency (USD)
        record += amt; // Settlement Amount (12)
        record += '840'; // Settlement Currency
        record += amt; // Billing Amount (12)
        record += '840'; // Billing Currency
        record += date + time; // Date/Time (12)
        record += rrn; // RRN (12)
        record += (tx.terminalId || 'TERM0001').padEnd(8, ' ');
        record += (tx.merchantName || 'VISA MERCHANT').padEnd(25, ' ');
        record += (tx.merchantCity || 'RIYADH').padEnd(13, ' ');
        record += 'SA'; // Country Code
        record += '5411'; // MCC
        
        return record.padEnd(168, ' '); // Enforce 168-Byte fixed width
    }

    /**
     * Build TC90 - File Header
     */
    static buildHeader() {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `90HDR${date}VISACTFPROD`.padEnd(168, ' ');
    }

    /**
     * Build TC91 - Batch Trailer (Reconciliation)
     */
    static buildBatchTrailer(count, amount) {
        let record = '91';
        record += '000001'; // Batch Number
        record += count.toString().padStart(12, '0');
        record += Math.floor(amount * 100).toString().padStart(16, '0');
        return record.padEnd(168, ' ');
    }

    /**
     * Build TC92 - File Trailer (EOF)
     */
    static buildFileTrailer(batchCount, totalCount, totalAmount) {
        let record = '92';
        record += batchCount.toString().padStart(12, '0');
        record += totalCount.toString().padStart(12, '0');
        record += Math.floor(totalAmount * 100).toString().padStart(16, '0');
        return record.padEnd(168, ' ');
    }

    // Additional TCRs (TCR1, TCR3, etc.) follow similar padding logic
    static buildTCR1(tx) {
        return ('0501' + this.maskPan(tx.pan)).padEnd(168, '0');
    }
}
