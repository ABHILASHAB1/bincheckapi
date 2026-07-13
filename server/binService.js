import axios from 'axios';
import NodeCache from 'node-cache';
import { supabase } from './supabaseClient.js';

// In-memory cache (TTL: 24 hours)
const binCache = new NodeCache({ stdTTL: 86400 });

// Country code → name/currency map for enrichment
const COUNTRY_META = {
  SA: { name: 'Saudi Arabia',    currency: 'SAR', region: 'GCC' },
  US: { name: 'United States',   currency: 'USD', region: 'Americas' },
  GB: { name: 'United Kingdom',  currency: 'GBP', region: 'Europe' },
  AE: { name: 'United Arab Emirates', currency: 'AED', region: 'GCC' },
  KW: { name: 'Kuwait',          currency: 'KWD', region: 'GCC' },
  BH: { name: 'Bahrain',         currency: 'BHD', region: 'GCC' },
  QA: { name: 'Qatar',           currency: 'QAR', region: 'GCC' },
  OM: { name: 'Oman',            currency: 'OMR', region: 'GCC' },
  EG: { name: 'Egypt',           currency: 'EGP', region: 'MENA' },
  JO: { name: 'Jordan',          currency: 'JOD', region: 'MENA' },
  CN: { name: 'China',           currency: 'CNY', region: 'Asia' },
  IN: { name: 'India',           currency: 'INR', region: 'Asia' },
  DE: { name: 'Germany',         currency: 'EUR', region: 'Europe' },
  FR: { name: 'France',          currency: 'EUR', region: 'Europe' },
};

// Card product keyword mapping → sub_brand
function extractSubBrand(category = '') {
  const upper = category.toUpperCase();
  if (upper.includes('INFINITE')) return 'INFINITE';
  if (upper.includes('SIGNATURE')) return 'SIGNATURE';
  if (upper.includes('WORLD ELITE')) return 'WORLD ELITE';
  if (upper.includes('WORLD BLACK')) return 'WORLD BLACK';
  if (upper.includes('WORLD')) return 'WORLD';
  if (upper.includes('PLATINUM')) return 'PLATINUM';
  if (upper.includes('TITANIUM')) return 'TITANIUM';
  if (upper.includes('GOLD')) return 'GOLD';
  if (upper.includes('SILVER')) return 'SILVER';
  if (upper.includes('CLASSIC')) return 'CLASSIC';
  if (upper.includes('BUSINESS')) return 'BUSINESS';
  if (upper.includes('CORPORATE')) return 'CORPORATE';
  if (upper.includes('PREPAID')) return 'PREPAID';
  if (upper.includes('ELECTRON')) return 'ELECTRON';
  return null;
}

// Local prefix fallback (network-free)
const BIN_PREFIX_MAP = {
  '4':   { scheme: 'visa',       type: 'debit',  category: 'STANDARD', issuer: 'Unknown Visa Issuer',       country_code: null },
  '51':  { scheme: 'mastercard', type: 'credit', category: 'STANDARD', issuer: 'Unknown Mastercard Issuer', country_code: null },
  '52':  { scheme: 'mastercard', type: 'credit', category: 'STANDARD', issuer: 'Unknown Mastercard Issuer', country_code: null },
  '53':  { scheme: 'mastercard', type: 'credit', category: 'STANDARD', issuer: 'Unknown Mastercard Issuer', country_code: null },
  '54':  { scheme: 'mastercard', type: 'credit', category: 'STANDARD', issuer: 'Unknown Mastercard Issuer', country_code: null },
  '55':  { scheme: 'mastercard', type: 'credit', category: 'STANDARD', issuer: 'Unknown Mastercard Issuer', country_code: null },
  '34':  { scheme: 'amex',       type: 'credit', category: 'PREMIUM',  issuer: 'American Express',          country_code: 'US' },
  '37':  { scheme: 'amex',       type: 'credit', category: 'PREMIUM',  issuer: 'American Express',          country_code: 'US' },
  '60':  { scheme: 'discover',   type: 'credit', category: 'STANDARD', issuer: 'Discover Bank',             country_code: 'US' },
  '62':  { scheme: 'unionpay',   type: 'debit',  category: 'STANDARD', issuer: 'UnionPay International',    country_code: 'CN' },
  '636': { scheme: 'mada',       type: 'debit',  category: 'STANDARD', issuer: 'mada (Saudi Arabia)',       country_code: 'SA' },
  '588': { scheme: 'mada',       type: 'debit',  category: 'STANDARD', issuer: 'Al Rajhi Bank (mada)',      country_code: 'SA' },
  '458': { scheme: 'visa',       type: 'debit',  category: 'STANDARD', issuer: 'Al Rajhi Bank',             country_code: 'SA' },
  '404': { scheme: 'visa',       type: 'debit',  category: 'STANDARD', issuer: 'Alinma Bank',               country_code: 'SA' },
  '440': { scheme: 'visa',       type: 'credit', category: 'CLASSIC',  issuer: 'Saudi National Bank (SNB)', country_code: 'SA' },
  '524': { scheme: 'mastercard', type: 'debit',  category: 'STANDARD', issuer: 'Riyad Bank',                country_code: 'SA' },
};

function getLocalPrefixFallback(bin) {
  for (const len of [6, 3, 2, 1]) {
    const prefix = bin.substring(0, len);
    if (BIN_PREFIX_MAP[prefix]) {
      const p = BIN_PREFIX_MAP[prefix];
      const meta = p.country_code ? COUNTRY_META[p.country_code] : null;
      return {
        bin, ...p,
        country_name: meta?.name || 'Unknown',
        currency: meta?.currency || null,
        region: meta?.region || null,
        source: 'local-prefix'
      };
    }
  }
  return null;
}

// Normalize raw API data into the rich schema shape
function normalizeApiData(cleanBin, apiData) {
  const alpha2 = apiData.country?.alpha2 || null;
  const meta = alpha2 ? COUNTRY_META[alpha2] : null;
  const isPrepaid = !!(
    apiData.prepaid ||
    (apiData.brand || '').toUpperCase().includes('PREPAID') ||
    (apiData.type || '').toUpperCase().includes('PREPAID')
  );
  const category = (apiData.brand || apiData.category || '').toUpperCase() || 'STANDARD';

  return {
    bin: cleanBin,
    bin_length: cleanBin.length,
    scheme: (apiData.scheme || 'UNKNOWN').toLowerCase(),
    type: (apiData.type || 'UNKNOWN').toLowerCase(),
    category,
    sub_brand: extractSubBrand(category),
    prepaid: isPrepaid,
    pan_length: apiData.number?.length || 16,
    luhn_valid: apiData.number?.luhn !== false,
    issuer: apiData.bank?.name || 'UNKNOWN',
    bank_url: apiData.bank?.url || null,
    bank_phone: apiData.bank?.phone || null,
    bank_city: apiData.bank?.city || null,
    country_name: apiData.country?.name || meta?.name || 'Unknown',
    country_code: alpha2 || null,
    currency: apiData.country?.currency || meta?.currency || null,
    region: meta?.region || null,
    source: 'API'
  };
}

export class BinService {
  constructor(db) {
    this.db = db; // SQLite local cache
  }

  async getBinDetails(bin) {
    if (!bin || bin.length < 6) throw new Error('Invalid BIN. Must be at least 6 digits.');
    const cleanBin = bin.substring(0, 8);

    // ── TIER 1: Memory Cache ──────────────────────────────────────────────────
    const cached = binCache.get(cleanBin);
    if (cached) return { ...cached, cached: true };

    // ── TIER 2: Local SQLite DB (Longest Prefix Match) ───────────────────────
    try {
      let row = null;
      for (let len = cleanBin.length; len >= 6; len--) {
        const prefix = cleanBin.substring(0, len);
        row = await this.db.get('SELECT * FROM bins WHERE bin = ?', [prefix]);
        if (row) break;
      }
      if (row) {
        const result = this.formatDbResult(row);
        binCache.set(cleanBin, result);
        return result;
      }
    } catch (e) {
      console.warn('[BIN] SQLite read error:', e.message);
    }

    // ── TIER 3: Supabase Cloud Query (Longest Prefix Match) ───────────────────
    if (supabase) {
      try {
        let data = null;
        for (let len = cleanBin.length; len >= 6; len--) {
          const prefix = cleanBin.substring(0, len);
          const response = await Promise.race([
            supabase.from('bins').select('*').eq('bin', prefix).maybeSingle(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase timeout')), 5000))
          ]);
          if (response && response.data) {
            data = response.data;
            break;
          }
        }
        if (data) {
          console.log(`[BIN] TIER-3 Supabase hit for ${cleanBin}`);
          const result = this._supabaseRowToResult(data);
          binCache.set(cleanBin, result);
          this._backfillSQLite(result).catch(() => {});
          return result;
        }
      } catch (e) {
        console.warn(`[BIN] TIER-3 Supabase miss for ${cleanBin}:`, e.message);
      }
    }

    // ── TIER 4: Race public APIs in parallel (2s) ─────────────────────────────
    const bin6 = cleanBin.substring(0, 6);
    let apiData = null;
    try {
      apiData = await Promise.any([
        this._fetchBincheck(bin6),
        this._fetchBinlist(bin6),
        this._fetchBincodes(bin6),
        this._fetchBinlookup(bin6),
      ]);
      console.log(`[BIN] TIER-4 API hit for ${bin6}: ${apiData?.scheme}`);
    } catch (e) {
      console.warn(`[BIN] TIER-4 All APIs failed for ${bin6}.`);
    }

    // ── TIER 5: Local prefix fallback ─────────────────────────────────────────
    if (!apiData) {
      const fallback = getLocalPrefixFallback(cleanBin);
      if (fallback) {
        console.log(`[BIN] TIER-5 prefix fallback for ${cleanBin}`);
        binCache.set(cleanBin, fallback);
        return fallback;
      }
      throw new Error('BIN NOT FOUND');
    }

    // ── PERSIST: Normalize & write to SQLite + Supabase ───────────────────────
    const normalized = normalizeApiData(cleanBin, apiData);
    await this._backfillSQLite(normalized);
    this._upsertSupabase(normalized);

    binCache.set(cleanBin, normalized);
    return normalized;
  }

  async updateBin(bin, data) {
    if (!bin) throw new Error('BIN required');
    
    // Update SQLite
    await this.db.run(`
      UPDATE bins SET 
        scheme = ?, 
        type = ?, 
        category = ?, 
        issuer = ?, 
        country = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE bin = ?
    `, [
      data.scheme?.toLowerCase(),
      data.type?.toLowerCase(),
      data.category?.toUpperCase(),
      data.issuer,
      data.country,
      bin
    ]);

    // Update Cache
    binCache.del(bin);

    // Update Supabase if available
    if (supabase) {
      await supabase.from('bins').upsert({
        bin,
        scheme: data.scheme?.toLowerCase(),
        type: data.type?.toLowerCase(),
        category: data.category?.toUpperCase(),
        issuer: data.issuer,
        country_name: data.country,
        source: 'MANUAL_CORRECTION'
      }, { onConflict: 'bin' });
    }

    return { success: true };
  }

  // Search Supabase by issuer name, scheme, country — for UI search
  async searchBins({ query, scheme, country_code, type, limit = 50 }) {
    if (!supabase) throw new Error('Supabase not configured');
    let q = supabase.from('bins').select('*').limit(limit);

    if (query) {
      // Full-text search across bin, issuer, category, country
      q = q.textSearch('search_vector', query, { type: 'websearch', config: 'simple' });
    }
    if (scheme)       q = q.eq('scheme', scheme.toLowerCase());
    if (country_code) q = q.eq('country_code', country_code.toUpperCase());
    if (type)         q = q.eq('type', type.toLowerCase());

    const { data, error } = await q.order('issuer');
    if (error) throw new Error(error.message);
    return data;
  }

  async _backfillSQLite(data) {
    try {
      await this.db.run(`
        INSERT OR REPLACE INTO bins (bin, scheme, type, category, issuer, country, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        data.bin,
        data.scheme,
        data.type,
        data.category || 'STANDARD',
        data.issuer,
        data.country_name || data.country || 'Unknown',
        data.source || 'API'
      ]);
    } catch (e) {
      console.error('[BIN] SQLite backfill error:', e.message);
    }
  }

  _upsertSupabase(data) {
    if (!supabase) return;
    supabase.from('bins').upsert(data, { onConflict: 'bin' })
      .then(({ error }) => {
        if (error) console.warn('[BIN] Supabase upsert error:', error.message);
        else console.log(`[BIN] Supabase synced: ${data.bin}`);
      });
  }

  _supabaseRowToResult(row) {
    return {
      bin: row.bin,
      bin_length: row.bin_length,
      scheme: row.scheme,
      type: row.type,
      category: row.category,
      sub_brand: row.sub_brand,
      prepaid: row.prepaid,
      pan_length: row.pan_length,
      luhn_valid: row.luhn_valid,
      issuer: row.issuer,
      bank_url: row.bank_url,
      bank_phone: row.bank_phone,
      bank_city: row.bank_city,
      country_name: row.country_name,
      country_code: row.country_code,
      currency: row.currency,
      region: row.region,
      source: row.source
    };
  }

  async _fetchBincheck(bin6) {
    // High-performance enrichment via bincheck.io
    const res = await axios.get(`https://api.bincheck.io/bin/${bin6}`, { timeout: 2000 });
    if (!res.data?.bin) throw new Error('No data from bincheck');
    return {
      scheme: (res.data.scheme || '').toLowerCase(),
      type: (res.data.type || '').toLowerCase(),
      brand: res.data.brand || 'Standard',
      bank: { name: res.data.bank },
      country: { name: res.data.country, alpha2: res.data.country_code || '', currency: res.data.currency || '' }
    };
  }

  async searchBins(params) {
    if (!supabase) throw new Error('Supabase not configured. Check your .env file.');
    
    // Sanitize parameters
    const query = (params.query || '').trim();
    const limit = parseInt(params.limit) || 50;
    
    console.log(`🔍 [CLOUD] Searching: "${query}" (Limit: ${limit})`);
    
    try {
      let q = supabase.from('bins').select('*');

      if (query) {
        q = q.or(`bin.ilike.%${query}%,issuer.ilike.%${query}%,country_name.ilike.%${query}%`);
      }
      
      if (params.scheme)       q = q.eq('scheme', params.scheme.toLowerCase());
      if (params.country_code) q = q.eq('country_code', params.country_code.toUpperCase());
      if (params.type)         q = q.eq('type', params.type.toLowerCase());

      // Implement manual timeout to prevent hanging
      const queryPromise = q.order('issuer', { ascending: true }).limit(limit);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloud Query Timeout')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      if (error) {
        console.error('[SUPABASE ERROR]', error.message);
        throw new Error(`Cloud DB Error: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('[CLOUD CRASH PREVENTED]', err.message);
      throw new Error(`Cloud Intelligence Unreachable: ${err.message}`);
    }
  }

  async _fetchBinlist(bin6) {
    const res = await axios.get(`https://lookup.binlist.net/${bin6}`, {
      timeout: 2000,
      headers: { 'Accept-Version': '3', 'Accept': 'application/json' }
    });
    if (!res.data?.scheme) throw new Error('No data from binlist');
    return res.data;
  }

  async _fetchBincodes(bin6) {
    const res = await axios.get(`https://api.bincodes.com/bin/?format=json&api_key=free&bin=${bin6}`, { timeout: 2000 });
    if (!res.data?.bank) throw new Error('No data from bincodes');
    return {
      scheme: (res.data.card || '').toLowerCase(),
      type: (res.data.type || '').toLowerCase(),
      brand: res.data.card || 'Standard',
      bank: { name: res.data.bank },
      country: { name: res.data.country, alpha2: res.data.iso || '', currency: res.data.currency || '' }
    };
  }

  async _fetchBinlookup(bin6) {
    const res = await axios.get(`https://api.binlookup.io/lookup/${bin6}`, {
      timeout: 2000, headers: { 'Accept': 'application/json' }
    });
    const d = res.data;
    if (!d?.Scheme && !d?.scheme) throw new Error('No data from binlookup');
    return {
      scheme: (d.Scheme || d.scheme || '').toLowerCase(),
      type: (d.Type || d.type || '').toLowerCase(),
      brand: d.CardTier || d.brand || 'Standard',
      bank: { name: d.Issuer || d.bank?.name || 'Unknown' },
      country: { name: d.CountryName || d.country?.name || 'Unknown', alpha2: d.CountryCode || '', currency: d.Currency || '' }
    };
  }

  formatDbResult(row) {
    return {
      bin: row.bin, scheme: row.scheme, type: row.type,
      category: row.category, issuer: row.issuer,
      country_name: row.country, source: 'Local SQLite'
    };
  }

  async getIssuers() {
    try {
      // 1. Cloud-First for Rich Saudi Issuers
      if (supabase) {
        const { data, error } = await supabase
          .from('bins')
          .select('issuer_name')
          .not('issuer_name', 'is', null)
          .neq('issuer_name', 'UNKNOWN')
          .order('issuer_name', { ascending: true });
        
        if (!error && data.length > 0) {
          const uniqueIssuers = [...new Set(data.map(d => d.issuer_name))];
          return uniqueIssuers;
        }
      }

      // 2. Fallback to Local SQLite
      let rows = await this.db.all('SELECT DISTINCT issuer FROM bins WHERE issuer IS NOT NULL AND issuer != "UNKNOWN" AND issuer != "" ORDER BY issuer ASC');
      if (rows.length === 0) {
        rows = await this.db.all('SELECT DISTINCT issuer FROM bins WHERE issuer IS NOT NULL ORDER BY issuer ASC');
      }
      return rows.map(r => r.issuer).filter(i => i);
    } catch (e) {
      console.error('[BIN] Failed to fetch issuers:', e.message);
      return [];
    }
  }

  async getRandomBins(limit = 10) {
    try {
      const rows = await this.db.all('SELECT * FROM bins ORDER BY RANDOM() LIMIT ?', [limit]);
      return rows.map(r => this.formatDbResult(r));
    } catch (e) {
      console.error('[BIN] Failed to fetch random bins:', e.message);
      return [];
    }
  }

  async getBinsByIssuer(issuer) {
    try {
      // 1. Cloud Search
      if (supabase) {
        const { data, error } = await supabase
          .from('bins')
          .select('*')
          .ilike('issuer_name', `%${issuer}%`)
          .limit(20);
        
        if (!error && data.length > 0) {
          return data.map(r => this._supabaseRowToResult(r));
        }
      }

      // 2. Local Fallback
      const rows = await this.db.all('SELECT * FROM bins WHERE issuer LIKE ? LIMIT 20', [`%${issuer}%`]);
      return rows.map(r => this.formatDbResult(r));
    } catch (e) {
      console.error('[BIN] Failed to fetch bins by issuer:', e.message);
      return [];
    }
  }

  async getRandomBins(limit = 10) {
    try {
      // 1. Cloud Random
      if (supabase) {
        const { data, error } = await supabase
          .from('bins')
          .select('*')
          .limit(limit); // Supabase random is tricky without extensions, so we just take latest or first
        
        if (!error && data.length > 0) return data.map(r => this._supabaseRowToResult(r));
      }

      // 2. Local Random
      const rows = await this.db.all('SELECT * FROM bins ORDER BY RANDOM() LIMIT ?', [limit]);
      return rows.map(r => this.formatDbResult(r));
    } catch (e) {
      console.error('[BIN] Failed to fetch random bins:', e.message);
      return [];
    }
  }

  async syncFromInternet() {
    if (BinService.syncStatus.isSyncing) return { success: false, message: 'Sync already in progress' };
    
    const https = await import('https');
    const IIN_URL = 'https://raw.githubusercontent.com/IIN-list/IIN-list/master/IIN_list.csv';
    
    BinService.syncStatus = { isSyncing: true, processed: 0, total: 0, lastSync: null };
    
    return new Promise((resolve, reject) => {
      console.log('🚀 [BIN] Starting Global Repository Sync...');
      https.get(IIN_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', async () => {
          try {
            const lines = data.split('\n');
            BinService.syncStatus.total = lines.length;
            let count = 0;
            await this.db.run('BEGIN TRANSACTION');
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (!line.trim()) continue;
              const parts = line.split(',');
              if (parts.length >= 6) {
                const bin = parts[0].trim().replace(/"/g, '');
                const scheme = parts[1]?.trim().replace(/"/g, '') || 'UNKNOWN';
                const issuer = parts[2]?.trim().replace(/"/g, '') || 'UNKNOWN';
                const type = parts[3]?.trim().replace(/"/g, '') || 'UNKNOWN';
                const country = parts[5]?.trim().replace(/"/g, '') || 'GLOBAL';

                await this.db.run(`
                  INSERT INTO bins (bin, scheme, type, issuer, country, source)
                  VALUES (?, ?, ?, ?, ?, 'INTERNET_SYNC')
                  ON CONFLICT(bin) DO UPDATE SET
                  scheme = excluded.scheme,
                  type = excluded.type,
                  issuer = CASE WHEN issuer = 'UNKNOWN' THEN excluded.issuer ELSE issuer END,
                  country = excluded.country,
                  updated_at = CURRENT_TIMESTAMP
                `, [bin, scheme, type, issuer, country]);
                count++;
                if (count % 100 === 0) BinService.syncStatus.processed = count;
              }
            }
            await this.db.run('COMMIT');
            BinService.syncStatus.isSyncing = false;
            BinService.syncStatus.lastSync = new Date();
            console.log(`✅ [BIN] Sync Complete! ${count} records processed.`);
            resolve({ success: true, count });
          } catch (err) {
            BinService.syncStatus.isSyncing = false;
            console.error('[BIN] Sync Error:', err.message);
            reject(err);
          }
        });
      }).on('error', (err) => {
        BinService.syncStatus.isSyncing = false;
        console.error('[BIN] Download Failed:', err.message);
        reject(err);
      });
    });
  }

  async syncFromGithub() {
    if (BinService.syncStatus.isSyncing) return { success: false, message: 'Sync already in progress' };
    
    BinService.syncStatus = { isSyncing: true, processed: 0, total: 0, lastSync: null };
    console.log('🚀 [BIN] Starting GitHub Repository Sync...');
    
    try {
      const csvUrl = 'https://raw.githubusercontent.com/venelinkochev/bin-list-data/refs/heads/master/bin-list-data.csv';
      const response = await axios.get(csvUrl, { timeout: 15000 });
      const csvData = response.data;
      
      const Papa = (await import('papaparse')).default;
      
      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true
      });
      
      const rows = parsed.data;
      BinService.syncStatus.total = rows.length;
      console.log(`📖 [BIN] Parsed ${rows.length} rows from GitHub CSV.`);
      
      let count = 0;
      let inserted = 0;
      let updated = 0;
      
      await this.db.run('BEGIN TRANSACTION');
      for (const row of rows) {
        const bin = (row.BIN || '').trim();
        if (!bin) continue;
        
        const scheme = (row.Brand || 'UNKNOWN').trim().toLowerCase();
        const type = (row.Type || 'UNKNOWN').trim().toLowerCase();
        const category = (row.Category || 'STANDARD').trim().toUpperCase();
        const issuer = (row.Issuer || 'UNKNOWN').trim();
        const country = (row.CountryName || 'Unknown').trim();
        const source = 'GITHUB_SYNC';
        
        try {
          // Insert into SQLite
          await this.db.run(`
            INSERT INTO bins (bin, scheme, type, category, issuer, country, source)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [bin, scheme, type, category, issuer, country, source]);
          inserted++;
        } catch (e) {
          // Update SQLite if duplicate
          await this.db.run(`
            UPDATE bins 
            SET scheme = ?, type = ?, category = ?, issuer = ?, country = ?, source = ?, updated_at = CURRENT_TIMESTAMP
            WHERE bin = ?
          `, [scheme, type, category, issuer, country, source, bin]);
          updated++;
        }
        
        count++;
        if (count % 100 === 0) {
          BinService.syncStatus.processed = count;
        }
      }
      await this.db.run('COMMIT');
      
      // Sync to Supabase in batches if available
      if (supabase) {
        console.log('☁️ [BIN] Syncing to Supabase in batches...');
        
        const extractSubBrandLocal = (cat = '') => {
          const upper = cat.toUpperCase();
          if (upper.includes('INFINITE')) return 'INFINITE';
          if (upper.includes('SIGNATURE')) return 'SIGNATURE';
          if (upper.includes('WORLD ELITE')) return 'WORLD ELITE';
          if (upper.includes('WORLD BLACK')) return 'WORLD BLACK';
          if (upper.includes('WORLD')) return 'WORLD';
          if (upper.includes('PLATINUM')) return 'PLATINUM';
          if (upper.includes('TITANIUM')) return 'TITANIUM';
          if (upper.includes('GOLD')) return 'GOLD';
          if (upper.includes('SILVER')) return 'SILVER';
          if (upper.includes('CLASSIC')) return 'CLASSIC';
          if (upper.includes('BUSINESS')) return 'BUSINESS';
          if (upper.includes('CORPORATE')) return 'CORPORATE';
          if (upper.includes('PREPAID')) return 'PREPAID';
          if (upper.includes('ELECTRON')) return 'ELECTRON';
          return null;
        };

        const BATCH_SIZE = 500;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const chunk = rows.slice(i, i + BATCH_SIZE).map(row => {
            const bin = (row.BIN || '').trim();
            const category = (row.Category || 'STANDARD').trim().toUpperCase();
            const type = (row.Type || 'UNKNOWN').trim().toLowerCase();
            const alpha2 = (row.isoCode2 || '').trim().toUpperCase();
            
            return {
              bin,
              bin_length: bin.length,
              scheme: (row.Brand || 'UNKNOWN').trim().toLowerCase(),
              type,
              category,
              sub_brand: extractSubBrandLocal(category),
              prepaid: category.includes('PREPAID') || type.includes('prepaid'),
              pan_length: 16,
              luhn_valid: true,
              issuer: (row.Issuer || 'UNKNOWN').trim(),
              bank_phone: (row.IssuerPhone || null),
              bank_url: (row.IssuerUrl || null),
              country_name: (row.CountryName || 'Unknown').trim(),
              country_code: alpha2 || null,
              source: 'GITHUB_SYNC'
            };
          });

          try {
            await supabase.from('bins').upsert(chunk, { onConflict: 'bin' });
          } catch (supaErr) {
            console.warn(`⚠️ [BIN Supabase Sync] Batch starting at index ${i} failed:`, supaErr.message);
          }
        }
      }
      
      BinService.syncStatus.isSyncing = false;
      BinService.syncStatus.lastSync = new Date();
      console.log(`✅ [BIN] GitHub Sync Complete! ${inserted} inserted, ${updated} updated.`);
      return { success: true, inserted, updated, total: rows.length };
      
    } catch (err) {
      BinService.syncStatus.isSyncing = false;
      BinService.syncStatus.error = err.message;
      console.error('❌ [BIN] GitHub Sync Error:', err.message);
      throw err;
    }
  }

  async syncFromBincheck(countrySlugs = ['saudi-arabia']) {
    if (BinService.syncStatus.isSyncing) return { success: false, message: 'Sync already in progress' };
    
    // Ensure countrySlugs is an array
    if (!Array.isArray(countrySlugs)) {
      countrySlugs = [countrySlugs];
    }
    
    BinService.syncStatus = { isSyncing: true, processed: 0, total: 0, lastSync: null };
    console.log('🚀 [BINCHECK] Starting bincheck.it scraper sync for countries:', countrySlugs);
    
    try {
      const allBankLinks = [];
      
      for (const countrySlug of countrySlugs) {
        console.log(`[BINCHECK] Fetching banks for country: ${countrySlug}...`);
        try {
          const mainUrl = `https://bincheck.it/country/${countrySlug}`;
          const mainRes = await axios.get(mainUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          
          const html = mainRes.data;
          
          let countryName = '';
          const titleMatch = html.match(/<title>([^|]+) BINs List/i) || html.match(/<title>([^|]+) BIN list/i);
          if (titleMatch && titleMatch[1]) {
            countryName = titleMatch[1].trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          } else {
            countryName = countrySlug
              .split('-')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(' ');
          }
          
          const bankRegex = new RegExp(`/bank/${countrySlug}-[a-zA-Z0-9-]+`, 'g');
          const matches = html.match(bankRegex) || [];
          const bankLinks = [...new Set(matches)]; // unique bank links
          
          console.log(`[BINCHECK] Country: ${countryName} (${countrySlug}) - Found ${bankLinks.length} bank pages.`);
          
          for (const bankLink of bankLinks) {
            allBankLinks.push({ bankLink, countryName, countrySlug });
          }
          
          await new Promise(r => setTimeout(r, 300));
        } catch (err) {
          console.error(`❌ [BINCHECK] Failed to fetch country page for ${countrySlug}:`, err.message);
        }
      }
      
      console.log(`[BINCHECK] Found ${allBankLinks.length} total bank pages to scrape.`);
      BinService.syncStatus.total = allBankLinks.length;
      
      let count = 0;
      let inserted = 0;
      
      const findCountryCodeByName = (countryName) => {
        const norm = countryName.toLowerCase().trim();
        for (const [code, meta] of Object.entries(COUNTRY_META)) {
          if (meta.name.toLowerCase() === norm) {
            return code;
          }
        }
        const commonCodes = {
          'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'american samoa': 'AS', 'andorra': 'AD',
          'angola': 'AO', 'anguilla': 'AI', 'antigua and barbuda': 'AG', 'argentina': 'AR', 'armenia': 'AM',
          'aruba': 'AW', 'australia': 'AU', 'austria': 'AT', 'azerbaijan': 'AZ', 'bahamas': 'BS',
          'bahrain': 'BH', 'bangladesh': 'BD', 'barbados': 'BB', 'belarus': 'BY', 'belgium': 'BE',
          'belize': 'BZ', 'benin': 'BJ', 'bermuda': 'BM', 'bhutan': 'BT', 'bolivia': 'BO',
          'bosnia and herzegovina': 'BA', 'botswana': 'BW', 'brazil': 'BR', 'brunei': 'BN', 'bulgaria': 'BG',
          'burkina faso': 'BF', 'burundi': 'BI', 'cambodia': 'KH', 'cameroon': 'CM', 'canada': 'CA',
          'cape verde': 'CV', 'cayman islands': 'KY', 'central african republic': 'CF', 'chad': 'TD', 'chile': 'CL',
          'china': 'CN', 'colombia': 'CO', 'comoros': 'KM', 'congo': 'CG', 'cook islands': 'CK',
          'costa rica': 'CR', 'croatia': 'HR', 'cuba': 'CU', 'cyprus': 'CY', 'czech republic': 'CZ',
          'denmark': 'DK', 'djibouti': 'DJ', 'dominica': 'DM', 'dominican republic': 'DO', 'ecuador': 'EC',
          'egypt': 'EG', 'el salvador': 'SV', 'estonia': 'EE', 'ethiopia': 'ET', 'fiji': 'FJ',
          'finland': 'FI', 'france': 'FR', 'gabon': 'GA', 'gambia': 'GM', 'georgia': 'GE',
          'germany': 'DE', 'ghana': 'GH', 'gibraltar': 'GI', 'greece': 'GR', 'grenada': 'GD',
          'guam': 'GU', 'guatemala': 'GT', 'guernsey': 'GG', 'guinea': 'GN', 'guyana': 'GY',
          'haiti': 'HT', 'honduras': 'HN', 'hong kong': 'HK', 'hungary': 'HU', 'iceland': 'IS',
          'india': 'IN', 'indonesia': 'ID', 'iran': 'IR', 'iraq': 'IQ', 'ireland': 'IE',
          'israel': 'IL', 'italy': 'IT', 'jamaica': 'JM', 'japan': 'JP', 'jersey': 'JE',
          'jordan': 'JO', 'kazakhstan': 'KZ', 'kenya': 'KE', 'kuwait': 'KW', 'kyrgyzstan': 'KG',
          'latvia': 'LV', 'lebanon': 'LB', 'lesotho': 'LS', 'liberia': 'LR', 'libya': 'LY',
          'liechtenstein': 'LI', 'lithuania': 'LT', 'luxembourg': 'LU', 'macao': 'MO', 'macau': 'MO',
          'madagascar': 'MG', 'malawi': 'MW', 'malaysia': 'MY', 'maldives': 'MV', 'mali': 'ML',
          'malta': 'MT', 'mauritania': 'MR', 'mauritius': 'MU', 'mexico': 'MX', 'monaco': 'MC',
          'mongolia': 'MN', 'montenegro': 'ME', 'montserrat': 'MS', 'morocco': 'MA', 'mozambique': 'MZ',
          'myanmar': 'MM', 'namibia': 'NA', 'nepal': 'NP', 'netherlands': 'NL', 'new zealand': 'NZ',
          'nicaragua': 'NI', 'niger': 'NE', 'nigeria': 'NG', 'norway': 'NO', 'oman': 'OM',
          'pakistan': 'PK', 'palestine': 'PS', 'panama': 'PA', 'papua new guinea': 'PG', 'paraguay': 'PY',
          'peru': 'PE', 'philippines': 'PH', 'poland': 'PL', 'portugal': 'PT', 'puerto rico': 'PR',
          'qatar': 'QA', 'romania': 'RO', 'russian federation': 'RU', 'rwanda': 'RW', 'samoa': 'WS',
          'san marino': 'SM', 'saudi arabia': 'SA', 'senegal': 'SN', 'serbia': 'RS', 'seychelles': 'SC',
          'sierra leone': 'SL', 'singapore': 'SG', 'slovakia': 'SK', 'slovenia': 'SI', 'somalia': 'SO',
          'south africa': 'ZA', 'spain': 'ES', 'sri lanka': 'LK', 'sudan': 'SD', 'suriname': 'SR',
          'swaziland': 'SZ', 'sweden': 'SE', 'switzerland': 'CH', 'syria': 'SY', 'taiwan': 'TW',
          'tajikistan': 'TJ', 'tanzania': 'TZ', 'thailand': 'TH', 'togo': 'TG', 'tonga': 'TO',
          'trinidad and tobago': 'TT', 'tunisia': 'TN', 'turkey': 'TR', 'turkmenistan': 'TM', 'uganda': 'UG',
          'ukraine': 'UA', 'united arab emirates': 'AE', 'united kingdom': 'GB', 'united states': 'US',
          'uruguay': 'UY', 'uzbekistan': 'UZ', 'vanuatu': 'VU', 'venezuela': 'VE', 'viet nam': 'VN',
          'vietnam': 'VN', 'yemen': 'YE', 'zambia': 'ZM', 'zimbabwe': 'ZW'
        };
        for (const [name, code] of Object.entries(commonCodes)) {
          if (norm.includes(name)) return code;
        }
        return null;
      };
      
      for (let i = 0; i < allBankLinks.length; i++) {
        const { bankLink, countryName, countrySlug } = allBankLinks[i];
        const bankUrl = `https://bincheck.it${bankLink}`;
        const prefixToRemove = `${countrySlug}-`;
        const rawBankName = bankLink.split('/bank/')[1] || '';
        const cleanRawBankName = rawBankName.startsWith(prefixToRemove) 
          ? rawBankName.slice(prefixToRemove.length) 
          : rawBankName;
        const bankName = cleanRawBankName
          .split('-')
          .map(w => w.toUpperCase())
          .join(' ');
        
        console.log(`[BINCHECK] [${i + 1}/${allBankLinks.length}] Fetching bank: ${bankName} (${countryName})...`);
        
        try {
          const bankRes = await axios.get(bankUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          
          const bankHtml = bankRes.data;
          const binRegex = /\/bin\/(\d{6,8})/g;
          let binMatch;
          const bins = [];
          while ((binMatch = binRegex.exec(bankHtml)) !== null) {
            bins.push(binMatch[1]);
          }
          
          const uniqueBins = [...new Set(bins)];
          
          await this.db.run('BEGIN TRANSACTION');
          for (const bin of uniqueBins) {
            const scheme = bin.startsWith('4') ? 'visa' : (bin.startsWith('5') ? 'mastercard' : (bin.startsWith('3') ? 'amex' : 'unknown'));
            const type = bin.startsWith('4') || bin.startsWith('6') ? 'debit' : 'credit';
            const category = 'STANDARD';
            const source = 'BINCHECK_IT_SCRAPE';
            
            // INSERT OR IGNORE preserves the existing database records intact
            const res = await this.db.run(`
              INSERT OR IGNORE INTO bins (bin, scheme, type, category, issuer, country, source)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [bin, scheme, type, category, bankName, countryName, source]);
            
            if (res.changes > 0) {
              inserted++;
              
              if (supabase) {
                try {
                  const { data: existingSupa } = await supabase
                     .from('bins')
                     .select('bin')
                     .eq('bin', bin)
                     .single();
                     
                  if (!existingSupa) {
                    const countryCode = findCountryCodeByName(countryName);
                    await supabase.from('bins').insert({
                      bin,
                      bin_length: bin.length,
                      scheme,
                      type,
                      category,
                      issuer: bankName,
                      country_name: countryName,
                      country_code: countryCode,
                      source
                    });
                  }
                } catch (supaErr) {
                  // ignore Supabase errors
                }
              }
            }
          }
          await this.db.run('COMMIT');
          
        } catch (bankErr) {
          console.warn(`[BINCHECK] Failed to scrape ${bankName}:`, bankErr.message);
        }
        
        count++;
        BinService.syncStatus.processed = count;
        
        // Polite delay of 500ms between bank pages
        await new Promise(r => setTimeout(r, 500));
      }
      
      BinService.syncStatus.isSyncing = false;
      BinService.syncStatus.lastSync = new Date();
      console.log(`✅ [BINCHECK] Sync Complete! ${inserted} new BINs added.`);
      return { success: true, inserted, total: allBankLinks.length };
      
    } catch (err) {
      BinService.syncStatus.isSyncing = false;
      BinService.syncStatus.error = err.message;
      console.error('❌ [BINCHECK] Scraper Sync Error:', err.message);
      throw err;
    }
  }
}

BinService.syncStatus = { isSyncing: false, processed: 0, total: 0, lastSync: null };
