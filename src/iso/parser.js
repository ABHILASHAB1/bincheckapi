/**
 * src/iso/parser.js
 * Hardened ISO 8583 Parser with Field Specification Table.
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

export class Parser {
    static unpack(buffer) {
        const raw = buffer.toString('utf8');
        const mti = raw.substring(0, 4);
        const hasSecondary = (parseInt(raw[4], 16) & 8) !== 0;
        const bitmapHex = hasSecondary ? raw.substring(4, 36) : raw.substring(4, 20);
        const bits = Bitmap.parse(bitmapHex);
        
        const elements = {};
        let cursor = 4 + bitmapHex.length;

        for (let i = 1; i < bits.length; i++) {
            if (bits[i] === 1) {
                const fieldNum = (i + 1).toString().padStart(3, '0');
                const spec = ISO_SPEC[fieldNum];

                if (!spec) {
                    // Fallback for unknown fields
                    elements[fieldNum] = "UNK";
                    continue;
                }

                let val = '';
                if (spec.type === 'FIXED') {
                    val = raw.substring(cursor, cursor + spec.len);
                    cursor += spec.len;
                } else if (spec.type === 'LLVAR') {
                    const len = parseInt(raw.substring(cursor, cursor + 2), 10);
                    cursor += 2;
                    val = raw.substring(cursor, cursor + len);
                    cursor += len;
                } else if (spec.type === 'LLLVAR') {
                    const len = parseInt(raw.substring(cursor, cursor + 3), 10);
                    cursor += 3;
                    val = raw.substring(cursor, cursor + len);
                    cursor += len;
                }
                elements[fieldNum] = val;
            }
        }

        return { mti, bitmap: bitmapHex, elements };
    }

    static unpackEMV(hex) {
        const tags = {};
        let i = 0;
        while (i < hex.length) {
            let tag = hex.substring(i, i + 2);
            i += 2;
            if ((parseInt(tag, 16) & 0x1F) === 0x1F) {
                tag += hex.substring(i, i + 2);
                i += 2;
            }
            const len = parseInt(hex.substring(i, i + 2), 16);
            i += 2;
            const val = hex.substring(i, i + (len * 2));
            i += (len * 2);
            tags[tag.toUpperCase()] = val;
        }
        return tags;
    }
}
