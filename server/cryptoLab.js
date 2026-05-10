import crypto from 'crypto';

export class CryptoLab {
  constructor() {
    // Master Keys (Double Length DES keys)
    this.ZMK = Buffer.from('11111111111111112222222222222222', 'hex'); 
    this.TMK = Buffer.from('33333333333333334444444444444444', 'hex'); 
    this.keys = {
      WORKING_KEY: Buffer.from('55555555555555556666666666666666', 'hex')
    };
  }

  generateSessionKey() {
    return crypto.randomBytes(16);
  }

  // Encrypt Working Key under Master Key (Key Exchange)
  encryptWorkingKey(workingKey, masterKey = this.TMK) {
    const cipher = crypto.createCipheriv('des-ede3-cbc', masterKey, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    return Buffer.concat([cipher.update(workingKey), cipher.final()]).toString('hex').toUpperCase();
  }

  decryptWorkingKey(encryptedHex, masterKey = this.TMK) {
    const decipher = crypto.createDecipheriv('des-ede3-cbc', masterKey, Buffer.alloc(8, 0));
    decipher.setAutoPadding(false);
    const key = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    this.keys.WORKING_KEY = key;
    return key.toString('hex').toUpperCase();
  }

  generatePINBlock(pin, pan) {
    const pinStr = pin.toString();
    const panStr = pan.toString().replace(/\D/g, '');
    
    // ISO 9564-1 Format 0
    let block1 = `0${pinStr.length}${pinStr}`;
    block1 = block1.padEnd(16, 'F');
    
    const panPart = panStr.slice(-13, -1).padStart(12, '0');
    const block2 = `0000${panPart}`;
    
    const buf1 = Buffer.from(block1, 'hex');
    const buf2 = Buffer.from(block2, 'hex');
    const out = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      out[i] = buf1[i] ^ buf2[i];
    }
    return out.toString('hex').toUpperCase();
  }

  generateMAC(dataHex, key) {
    let data = Buffer.from(dataHex, 'hex');
    // ISO 9797-1 Padding Method 1
    const padLen = 8 - (data.length % 8);
    if (padLen !== 8) {
       data = Buffer.concat([data, Buffer.alloc(padLen, 0)]);
    }

    // Simplified CBC MAC using DES
    let iv = Buffer.alloc(8, 0);
    const k1 = key.slice(0, 8);
    const k2 = key.slice(8, 16);

    for (let i = 0; i < data.length; i += 8) {
      const block = Buffer.alloc(8);
      for (let j = 0; j < 8; j++) block[j] = data[i + j] ^ iv[j];
      const cipher = crypto.createCipheriv('des-ecb', k1, null);
      cipher.setAutoPadding(false);
      iv = Buffer.concat([cipher.update(block), cipher.final()]);
    }
    
    let decipher = crypto.createDecipheriv('des-ecb', k2, null);
    decipher.setAutoPadding(false);
    iv = Buffer.concat([decipher.update(iv), decipher.final()]);

    let cipher2 = crypto.createCipheriv('des-ecb', k1, null);
    cipher2.setAutoPadding(false);
    const mac = Buffer.concat([cipher2.update(iv), cipher2.final()]);

    return mac.toString('hex').toUpperCase().substring(0, 16);
  }

  // --- VAULT SECURITY: AES-256-GCM ---
  static VAULT_KEY = crypto.scryptSync(process.env.VAULT_SECRET || 'ISO_SIMULATOR_MASTER_SECRET_2026', 'salt', 32);

  static encryptVaultData(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.VAULT_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decryptVaultData(encryptedData) {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
    try {
      const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.VAULT_KEY, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.warn('⚠️ [CRYPTO] Vault Decryption Failed. Data might be raw or corrupted.');
      return encryptedData;
    }
  }
}
