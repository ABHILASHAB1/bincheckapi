/**
 * src/iso/builder.js
 * Hardened ISO 8583 Builder with Variable-Length Support.
 */
import { Bitmap } from './bitmap.js';

const ISO_SPEC = {
    '002': { type: 'LLVAR', max: 19 },
    '003': { type: 'FIXED', len: 6 },
    '004': { type: 'FIXED', len: 12 },
    '007': { type: 'FIXED', len: 10 },
    '011': { type: 'FIXED', len: 6 },
    '012': { type: 'FIXED', len: 6 },
    '013': { type: 'FIXED', len: 4 },
    '014': { type: 'FIXED', len: 4 },
    '018': { type: 'FIXED', len: 4 },
    '022': { type: 'FIXED', len: 3 },
    '025': { type: 'FIXED', len: 2 },
    '032': { type: 'LLVAR', max: 11 },
    '037': { type: 'FIXED', len: 12 },
    '038': { type: 'FIXED', len: 6 },
    '039': { type: 'FIXED', len: 2 },
    '041': { type: 'FIXED', len: 8 },
    '042': { type: 'FIXED', len: 15 },
    '043': { type: 'FIXED', len: 40 },
    '048': { type: 'LLLVAR', max: 999 },
    '049': { type: 'FIXED', len: 3 },
    '055': { type: 'LLLVAR', max: 999 },
    '060': { type: 'LLLVAR', max: 999 },
    '070': { type: 'FIXED', len: 3 },
    '090': { type: 'FIXED', len: 42 },
    '123': { type: 'LLLVAR', max: 999 }
};

export class Builder {
    static pack(data) {
        const { mti, elements } = data;
        const bitmapHex = Bitmap.generate(elements);
        
        let messageBody = '';
        const sortedFields = Object.keys(elements).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        
        for (const field of sortedFields) {
            const spec = ISO_SPEC[field];
            const val = elements[field].toString();
            
            if (!spec) {
                messageBody += val; // Fallback
                continue;
            }

            if (spec.type === 'FIXED') {
                messageBody += val.padEnd(spec.len, ' ').substring(0, spec.len);
            } else if (spec.type === 'LLVAR') {
                messageBody += val.length.toString().padStart(2, '0') + val;
            } else if (spec.type === 'LLLVAR') {
                messageBody += val.length.toString().padStart(3, '0') + val;
            }
        }
        
        return Buffer.from(mti + bitmapHex + messageBody, 'utf8');
    }
}
