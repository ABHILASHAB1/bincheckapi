/**
 * src/routes/mada.js
 * SAMA/mada Domestic Routing & Enforcement Rules.
 */
export class MadaRouter {
    static BIN_PREFIXES = [
        '440647', '440795', '446404', '446393', '439954', '407197',
        '457865', '457997', '468540', '468541', '468542', '468543',
        '484783', '489317', '489318', '489319', '490980', '493428',
        '504300', '506968', '508160', '585265', '588845', '588846',
        '588847', '588848', '588849', '588850', '588851', '636120',
        '968201', '968202', '968203', '968204', '968205', '968206',
        '968207', '968208', '968209', '968210', '968211', '968212',
    ];

    static isMada(pan) {
        return this.BIN_PREFIXES.some(prefix => pan?.startsWith(prefix));
    }

    static validate(parsed) {
        const pan = parsed.elements['002'] || '';
        const amt = parseFloat(parsed.elements['004'] || '0') / 100;
        const curr = parsed.elements['049'] || '';
        const posEntry = parsed.elements['022'] || '';

        if (!this.isMada(pan)) return { valid: true };

        // Domestic Rules
        if (curr !== '682' && curr !== '') return { valid: false, code: '13', reason: 'Currency Mismatch' };
        if (posEntry === '071' && amt > 300) return { valid: false, code: '05', reason: 'Contactless Limit' };
        if (parsed.mti === '0100') return { valid: false, code: '12', reason: 'Protocol Violation' };

        return { valid: true };
    }
}
