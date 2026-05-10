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
      if (config.type === 'FIXED') {
        payload += val.padEnd(config.len, ' ').slice(0, config.len);
      } else if (config.type === 'LLVAR') {
        payload += val.length.toString().padStart(2, '0') + val;
      } else if (config.type === 'LLLVAR') {
        payload += val.length.toString().padStart(3, '0') + val;
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
            const len = parseInt(hex.substring(offset, offset + 2));
            offset += 2;
            elements[deNum.toString()] = hex.substring(offset, offset + len);
            offset += len;
          } else if (config.type === 'LLLVAR') {
            const len = parseInt(hex.substring(offset, offset + 3));
            offset += 3;
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

IsoPacker.DE_CONFIG = {
  '2': { name: 'PAN', type: 'LLVAR', len: 19 },
  '3': { name: 'Processing Code', type: 'FIXED', len: 6 },
  '4': { name: 'Amount', type: 'FIXED', len: 12 },
  '7': { name: 'Transmission Date/Time', type: 'FIXED', len: 10 },
  '11': { name: 'STAN', type: 'FIXED', len: 6 },
  '12': { name: 'Local Time', type: 'FIXED', len: 6 },
  '13': { name: 'Local Date', type: 'FIXED', len: 4 },
  '14': { name: 'Expiry Date', type: 'FIXED', len: 4 },
  '22': { name: 'POS Entry Mode', type: 'FIXED', len: 3 },
  '25': { name: 'POS Condition Code', type: 'FIXED', len: 2 },
  '28': { name: 'Fee Engine Model', type: 'FIXED', len: 2 },
  '32': { name: 'Acquirer ID', type: 'LLVAR', len: 11 },
  '33': { name: 'Forwarding ID', type: 'LLVAR', len: 11 },
  '37': { name: 'RRN', type: 'FIXED', len: 12 },
  '38': { name: 'Auth Code', type: 'FIXED', len: 6 },
  '39': { name: 'Response Code', type: 'FIXED', len: 2 },
  '41': { name: 'Terminal ID', type: 'FIXED', len: 8 },
  '42': { name: 'Merchant ID', type: 'FIXED', len: 15 },
  '43': { name: 'Merchant Name/Loc', type: 'FIXED', len: 40 },
  '48': { name: 'Additional Data (TLV)', type: 'LLLVAR', len: 999 },
  '49': { name: 'Currency Code', type: 'FIXED', len: 3 },
  '52': { name: 'PIN Block', type: 'FIXED', len: 16 },
  '55': { name: 'EMV Data (BER-TLV)', type: 'LLLVAR', len: 999 },
  '60': { name: 'Private Use (mada)', type: 'LLLVAR', len: 999 },
  '70': { name: 'Network Mgmt Code', type: 'FIXED', len: 3 },
  '104': { name: 'End-to-End Reference', type: 'LLLVAR', len: 999 },
  '127': { name: 'UETR (SWIFT gpi)', type: 'LLLVAR', len: 999 },
  '128': { name: 'MAC', type: 'FIXED', len: 16 }
};
