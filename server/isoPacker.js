export class IsoPacker {
  /**
   * Packs JSON into a raw ISO 8583 Buffer
   */
  static pack(json) {
    const { mti, elements } = json;
    let payload = mti; // 4 digits MTI
    
    // Determine if we need a Secondary Bitmap (any field > 64)
    const activeDEs = Object.keys(elements).map(Number).sort((a,b) => a - b);
    const hasSecondary = activeDEs.some(de => de > 64);
    
    const bitmapSize = hasSecondary ? 16 : 8; // 8 or 16 bytes
    const bitmap = new Uint8Array(bitmapSize);
    
    if (hasSecondary) {
      // Bit 1 indicates presence of secondary bitmap
      bitmap[0] |= 0x80;
    }

    activeDEs.forEach(de => {
      if (de >= 1 && de <= (hasSecondary ? 128 : 64)) {
        if (de === 1) return; // Handled above
        const bitPos = de - 1;
        const byteIndex = Math.floor(bitPos / 8);
        const bitIndex = 7 - (bitPos % 8);
        bitmap[byteIndex] |= (1 << bitIndex);
      }
    });

    const bitmapHex = Array.from(bitmap)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');
    
    payload += bitmapHex;

    // Pack Elements
    activeDEs.forEach(de => {
      if (de === 1) return; // Skip bitmap field
      const config = IsoPacker.DE_CONFIG[de.toString()];
      if (!config) return;

      const val = (elements[de.toString()] || '').toString();
      
      // Strict Field-Level Validation
      if (config.type === 'FIXED' && val.length !== config.len) {
        throw new Error(`Field Validation Error: DE-${de.toString().padStart(3, '0')} (${config.name}) requires exactly ${config.len} characters, but received ${val.length}.`);
      }
      if (['LLVAR', 'LLLVAR', 'LLLLVAR', 'LLLLBINARY'].includes(config.type) && val.length > config.len) {
        throw new Error(`Field Validation Error: DE-${de.toString().padStart(3, '0')} (${config.name}) exceeds maximum allowed length of ${config.len} characters. Received ${val.length}.`);
      }

      if (config.type === 'FIXED') {
        payload += val.padEnd(config.len, ' ').slice(0, config.len);
      } else if (config.type === 'LLVAR') {
        payload += val.length.toString().padStart(2, '0') + val;
      } else if (config.type === 'LLLVAR') {
        payload += val.length.toString().padStart(3, '0') + val;
      } else if (config.type === 'LLLLVAR' || config.type === 'LLLLBINARY') {
        payload += val.length.toString().padStart(4, '0') + val;
      }
    });

    return Buffer.from(payload, 'utf8');
  }

  /**
   * Unpacks a raw ISO 8583 hex string into JSON
   */
  static unpack(input) {
    try {
      const hex = Buffer.isBuffer(input) ? input.toString('utf8') : input;
      let offset = 0;
      const mti = hex.substring(offset, offset + 4);
      offset += 4;

      // Read Primary Bitmap
      const primaryBitmapHex = hex.substring(offset, offset + 16);
      offset += 16;
      const primaryBitmap = Buffer.from(primaryBitmapHex, 'hex');
      
      const hasSecondary = (primaryBitmap[0] & 0x80) !== 0;
      let fullBitmap = primaryBitmap;

      if (hasSecondary) {
        const secondaryBitmapHex = hex.substring(offset, offset + 16);
        offset += 16;
        fullBitmap = Buffer.concat([primaryBitmap, Buffer.from(secondaryBitmapHex, 'hex')]);
      }

      const elements = {};
      const maxFields = hasSecondary ? 128 : 64;

      for (let i = 0; i < maxFields; i++) {
        // Skip bit 1 as it's the secondary bitmap indicator
        if (i === 0) continue;

        const byteIndex = Math.floor(i / 8);
        const bitIndex = 7 - (i % 8);
        const isPresent = (fullBitmap[byteIndex] & (1 << bitIndex)) !== 0;

        if (isPresent) {
          const deNum = i + 1;
          const config = IsoPacker.DE_CONFIG[deNum.toString()];
          if (!config) {
            console.warn(`[PACKER] No config for DE ${deNum}, skipping rest of message.`);
            break;
          }

          if (config.type === 'FIXED') {
            elements[deNum.toString()] = hex.substring(offset, offset + config.len);
            offset += config.len;
          } else if (config.type === 'LLVAR') {
            const len = parseInt(hex.substring(offset, offset + 2), 10);
            offset += 2;
            elements[deNum.toString()] = hex.substring(offset, offset + len);
            offset += len;
          } else if (config.type === 'LLLVAR') {
            const len = parseInt(hex.substring(offset, offset + 3), 10);
            offset += 3;
            elements[deNum.toString()] = hex.substring(offset, offset + len);
            offset += len;
          } else if (config.type === 'LLLLVAR' || config.type === 'LLLLBINARY') {
            const len = parseInt(hex.substring(offset, offset + 4), 10);
            offset += 4;
            elements[deNum.toString()] = hex.substring(offset, offset + len);
            offset += len;
          }
        }
      }

      return { mti, elements };
    } catch (e) {
      console.error('Unpack Error:', e.message);
      return null;
    }
  }

  static analyzeMTI(mti) {
    const v = mti[0], c = mti[1], f = mti[2], o = mti[3];
    return {
      version: v === '0' ? '1987' : (v === '1' ? '1993' : '2003'),
      msgClass: c === '1' ? 'Auth' : (c === '2' ? 'Financial' : (c === '4' ? 'Reversal' : 'Admin')),
      msgFunction: f === '0' ? 'Request' : (f === '1' ? 'Response' : 'Advice'),
      originator: o === '0' ? 'Acquirer' : 'Issuer'
    };
  }

  static unpackEMV(hex) {
    const tags = {};
    let offset = 0;
    while (offset < hex.length) {
      let tag = hex.substring(offset, offset + 2);
      offset += 2;
      if ((parseInt(tag, 16) & 0x1F) === 0x1F) {
        tag += hex.substring(offset, offset + 2);
        offset += 2;
      }
      let len = parseInt(hex.substring(offset, offset + 2), 16);
      offset += 2;
      if (len > 0x80) {
        const lenBytes = len & 0x7F;
        len = parseInt(hex.substring(offset, offset + (lenBytes * 2)), 16);
        offset += (lenBytes * 2);
      }
      const val = hex.substring(offset, offset + (len * 2));
      offset += (len * 2);
      tags[tag.toUpperCase()] = val;
    }
    return tags;
  }
}

// jPOS Common Message Format (ISO-8583 v2003 Base)
IsoPacker.DE_CONFIG = {
  '2': { name: 'Primary Account Number (PAN)', type: 'LLVAR', len: 19 },
  '3': { name: 'Processing Code', type: 'FIXED', len: 6 },
  '4': { name: 'Amount transaction', type: 'FIXED', len: 16 },
  '5': { name: 'Amount reconciliation', type: 'FIXED', len: 16 },
  '6': { name: 'Amount cardholder billing', type: 'FIXED', len: 16 },
  '7': { name: 'Date and time transmission', type: 'FIXED', len: 10 },
  '8': { name: 'Amount cardholder billing fee', type: 'FIXED', len: 12 },
  '9': { name: 'Conversion rate, settlement', type: 'FIXED', len: 8 },
  '10': { name: 'Conversion rate, cardholder billing', type: 'FIXED', len: 8 },
  '11': { name: 'System Trace Audit Number (STAN)', type: 'FIXED', len: 12 },
  '12': { name: 'Date and time local transaction', type: 'FIXED', len: 14 },
  '13': { name: 'Date effective', type: 'FIXED', len: 6 },
  '14': { name: 'Expiration date', type: 'FIXED', len: 4 },
  '15': { name: 'Settlement date', type: 'FIXED', len: 8 },
  '16': { name: 'Conversion date', type: 'FIXED', len: 4 },
  '17': { name: 'Capture date', type: 'FIXED', len: 4 },
  '18': { name: 'Message Error Indicator', type: 'LLLVAR', len: 140 },
  '19': { name: 'Acquiring Institution Country Code', type: 'FIXED', len: 3 },
  '21': { name: 'Transaction life cycle identification data', type: 'FIXED', len: 22 },
  '22': { name: 'Point-of-Service data code', type: 'FIXED', len: 16 },
  '23': { name: 'Card Sequence Number', type: 'FIXED', len: 3 },
  '24': { name: 'Function Code', type: 'FIXED', len: 3 },
  '25': { name: 'Reason Code', type: 'FIXED', len: 4 },
  '26': { name: 'Merchant Category Code', type: 'FIXED', len: 4 },
  '27': { name: 'Point of service capabilities', type: 'FIXED', len: 27 },
  '30': { name: 'Amounts original', type: 'FIXED', len: 32 },
  '31': { name: 'Acquirer Reference Number', type: 'FIXED', len: 23 },
  '32': { name: 'Acquiring institution identification code', type: 'LLVAR', len: 11 },
  '33': { name: 'Forwarding institution identification code', type: 'LLVAR', len: 11 },
  '34': { name: 'Electronic commerce data', type: 'LLLLVAR', len: 9999 },
  '35': { name: 'Track 2 data', type: 'LLVAR', len: 37 },
  '37': { name: 'Retrieval Reference Number', type: 'FIXED', len: 12 },
  '38': { name: 'Approval Code', type: 'FIXED', len: 6 },
  '39': { name: 'Result Code', type: 'FIXED', len: 4 },
  '41': { name: 'Card Acceptor Terminal ID (TID)', type: 'FIXED', len: 16 },
  '42': { name: 'Card Acceptor Identification Code (MID)', type: 'LLVAR', len: 35 },
  '43': { name: 'Card acceptor name/location', type: 'LLLLVAR', len: 9999 },
  '45': { name: 'Track 1 data', type: 'LLVAR', len: 76 },
  '46': { name: 'Amounts fees', type: 'LLLVAR', len: 216 },
  '49': { name: 'Verification data', type: 'LLLLVAR', len: 9999 },
  '52': { name: 'PIN Block', type: 'FIXED', len: 8 },
  '53': { name: 'Security Related Control Information', type: 'LLVAR', len: 48 },
  '54': { name: 'Additional Amount(s)', type: 'LLLVAR', len: 126 },
  '55': { name: 'Integrated Circuit Card (ICC) Related Data', type: 'LLLLVAR', len: 9999 },
  '56': { name: 'Original data elements', type: 'LLVAR', len: 41 },
  '59': { name: 'Transport data', type: 'LLLVAR', len: 999 },
  '63': { name: 'Display message', type: 'LLLVAR', len: 999 },
  '68': { name: 'Batch/file transfer message control', type: 'FIXED', len: 9 },
  '69': { name: 'Batch/file transfer control data', type: 'FIXED', len: 40 },
  '70': { name: 'Network Mgmt Code', type: 'FIXED', len: 3 },
  '72': { name: 'Data record', type: 'LLLLBINARY', len: 9999 },
  '74': { name: 'Reconciliation data primary', type: 'FIXED', len: 78 },
  '93': { name: 'Transaction destination institution ID code', type: 'LLVAR', len: 11 },
  '94': { name: 'Transaction originator institution ID code', type: 'LLVAR', len: 11 },
  '95': { name: 'Replacement Amounts', type: 'FIXED', len: 96 },
  '97': { name: 'Amount, Net reconciliation', type: 'FIXED', len: 21 },
  '99': { name: 'Settlement institution identification code', type: 'LLVAR', len: 11 },
  '100': { name: 'Receiving institution identification code', type: 'LLVAR', len: 11 },
  '101': { name: 'File Name / Transaction Modifier', type: 'LLVAR', len: 99 },
  '102': { name: 'Account identification 1', type: 'LLVAR', len: 28 },
  '103': { name: 'Account identification 2', type: 'LLVAR', len: 28 },
  '111': { name: 'Discretionary handback data', type: 'LLLLBINARY', len: 9999 },
  '112': { name: 'Discretionary transport data', type: 'LLLLBINARY', len: 9999 },
  '113': { name: 'TPP data elements', type: 'LLLLBINARY', len: 9999 },
  '114': { name: 'Reserved for private use', type: 'LLLLBINARY', len: 9999 },
  '115': { name: 'Reserved for private use', type: 'LLLLBINARY', len: 9999 },
  '116': { name: 'Reserved for national use', type: 'LLLLBINARY', len: 9999 },
  '123': { name: 'Reserved for customer-specific use', type: 'LLLLBINARY', len: 9999 },
  '127': { name: 'UETR (SWIFT gpi)', type: 'LLLVAR', len: 999 },
  '128': { name: 'MAC', type: 'FIXED', len: 16 }
};

