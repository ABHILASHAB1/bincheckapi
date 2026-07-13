import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { setupDatabase } from './db.js';
import { BinService } from './binService.js';
import { supabase } from './supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Serve static portal UI
app.use(express.static(path.join(__dirname, '../public')));

let db = null;
let binService = null;

async function init() {
  try {
    db = await setupDatabase();
    binService = new BinService(db);
    console.log('✅ SQLite Database and BinService initialized successfully.');

    // Seed default testing key to Supabase if missing
    if (supabase) {
      const { data: existing, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('api_key', 'AOU-SECRET-KEY-12345')
        .maybeSingle();

      if (!existing && !error) {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 2); // 2 years expiry

        const { error: seedErr } = await supabase.from('api_keys').insert([{
          api_key: 'AOU-SECRET-KEY-12345',
          client_name: 'Client AOU',
          balance: 50000,
          limit_queries: 50000,
          expires_at: expiresAt.toISOString(),
          allowed_countries: '*',
          allowed_schemes: '*'
        }]);

        if (seedErr) {
          console.warn('⚠️ Seeding default AOU key on Supabase failed:', seedErr.message);
        } else {
          console.log('🌱 [Supabase] Seeded default Client AOU key successfully.');
        }
      }
    } else {
      console.warn('⚠️ Supabase not active. Cannot seed keys or validate cloud authentication.');
    }
  } catch (err) {
    console.error('❌ Failed to initialize Database/BinService:', err.message);
  }
}

// API Key Authentication & Balance check middleware using Supabase Cloud
async function authenticateApiKey(req, res, next) {
  const apiKey = req.query.api_key;
  
  if (!apiKey) {
    return res.status(422).json({ error: 'API key is missing' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase Cloud Client not initialized' });
  }

  try {
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .maybeSingle();

    if (error || !keyData) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }

    // Verify expiry and status
    const expiryDate = new Date(keyData.expires_at);
    if (expiryDate < new Date() || keyData.status !== 'active') {
      return res.status(401).json({ error: 'Your balance is exhausted,or package expired' });
    }

    // Check query balance
    if (keyData.balance <= 0) {
      return res.status(401).json({ error: 'Your balance is exhausted,or package expired' });
    }

    // Attach validated details
    req.apiKeyData = keyData;
    
    next();
  } catch (err) {
    console.error('❌ [AUTH ERROR]:', err.message);
    res.status(500).json({ error: 'Internal Server Error during Authentication' });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseConnected: !!db,
    binServiceReady: !!binService
  });
});

// GET /v1/balance - Swagger check balance (Free of query charges)
app.get('/v1/balance', authenticateApiKey, (req, res) => {
  res.json({
    result: 200,
    message: 'SUCCESS',
    data: {
      client: req.apiKeyData.client_name,
      balance: req.apiKeyData.balance,
      limit: req.apiKeyData.limit_queries,
      expires: req.apiKeyData.expires_at
    }
  });
});

// GET /v1/{bin} - Swagger BIN Lookup API with search filtering restrictions
app.get('/v1/:bin', authenticateApiKey, async (req, res) => {
  const binId = req.params.bin;
  const keyData = req.apiKeyData;
  console.log(`🔍 [BIN API] Looking up: ${binId} for ${keyData.client_name}`);
  try {
    if (!binService) {
      return res.status(503).json({ error: 'BIN Service not ready' });
    }
    const binDetails = await binService.getBinDetails(binId);
    if (!binDetails) {
      return res.status(404).json({ error: 'BIN not found' });
    }
    
    // ── SEARCH RESTRICTION CHECKS ───────────────────────────────────────────
    
    // 1. Country policy filter check (case-insensitive)
    const country = (binDetails.country_name || binDetails.country || '').trim().toUpperCase();
    if (keyData.allowed_countries && keyData.allowed_countries !== '*') {
      const allowedList = keyData.allowed_countries.split(',').map(c => c.trim().toUpperCase());
      if (!allowedList.includes(country)) {
        return res.status(403).json({
          result: 403,
          message: 'RESTRICTED',
          error: `Search restricted: Country [${country || 'Unknown'}] is not allowed for this API Key.`
        });
      }
    }

    // 2. Card Brand/Scheme policy filter check (case-insensitive)
    const scheme = (binDetails.scheme || '').trim().toLowerCase();
    if (keyData.allowed_schemes && keyData.allowed_schemes !== '*') {
      const allowedList = keyData.allowed_schemes.split(',').map(s => s.trim().toLowerCase());
      if (!allowedList.includes(scheme)) {
        return res.status(403).json({
          result: 403,
          message: 'RESTRICTED',
          error: `Search restricted: Card Brand [${scheme || 'unknown'}] is not allowed for this API Key.`
        });
      }
    }

    // ── CHARGE CLIENT ON SUPABASE ──────────────────────────────────────────
    // Decrement the balance now that lookup succeeded and policy validation passed
    const { error: updateErr } = await supabase
      .from('api_keys')
      .update({ balance: keyData.balance - 1, updated_at: new Date().toISOString() })
      .eq('id', keyData.id);

    if (updateErr) {
      console.warn('⚠️ Failed to decrement balance on Supabase:', updateErr.message);
    }

    res.json({
      result: 200,
      message: 'SUCCESS',
      data: {
        bin: binDetails.bin,
        scheme: binDetails.scheme || 'unknown',
        type: binDetails.type || 'unknown',
        category: binDetails.category || 'STANDARD',
        issuer: binDetails.issuer || 'UNKNOWN',
        country: country || 'Unknown'
      }
    });
  } catch (e) {
    console.error(`❌ [BIN API] Error for ${binId}:`, e.message);
    res.status(404).json({ error: e.message });
  }
});

// ── ADMIN SECURITY MIDDLEWARE ──────────────────────────────────────────────
function authenticateAdmin(req, res, next) {
  const adminToken = req.headers['x-admin-token'];
  const secureToken = process.env.ADMIN_PIN || 'AOU-Admin-2026';
  
  if (!adminToken || adminToken !== secureToken) {
    return res.status(401).json({ error: 'Unauthorized admin access' });
  }
  next();
}

// ── KEY MANAGEMENT ENDPOINTS (SUPABASE CLOUD) ──────────────────────────────

// GET /api/keys - Retrieve all API keys
app.get('/api/keys', authenticateAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login - Firebase Google Auth Sign-In / Register
app.post('/api/auth/login', async (req, res) => {
  const { uid, email, displayName } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Supabase Cloud Client not initialized' });
  }

  try {
    // Check if user already exists
    let { data: user, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('firebase_uid', uid)
      .maybeSingle();
    
    if (!user && !error) {
      // First time registration: generate API Key and give 10 free searches
      const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
      const apiKey = `AOU-SECRET-${hex}`;
      const limit = 10;
      
      const expiryStr = new Date();
      expiryStr.setFullYear(expiryStr.getFullYear() + 1); // 1 year expiration

      const { data: newUser, error: insertErr } = await supabase
        .from('api_keys')
        .insert([{
          api_key: apiKey,
          client_name: displayName || 'Web User',
          balance: limit,
          limit_queries: limit,
          expires_at: expiryStr.toISOString(),
          allowed_countries: '*',
          allowed_schemes: '*',
          firebase_uid: uid,
          email: email || ''
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;
      user = newUser;
      console.log(`🌱 [SUPABASE] Registered new Firebase user: ${displayName || email} with 10 free queries.`);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        client_name: user.client_name,
        email: user.email,
        api_key: user.api_key,
        balance: user.balance,
        limit_queries: user.limit_queries,
        expires_at: user.expires_at,
        status: user.status,
        allowed_countries: user.allowed_countries,
        allowed_schemes: user.allowed_schemes
      }
    });
  } catch (err) {
    console.error('❌ [AUTH LOGIN ERROR]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/keys - Generate a new API key with restrictions
app.post('/api/keys', authenticateAdmin, async (req, res) => {
  const { client_name, limit_queries, expires_months, allowed_countries, allowed_schemes } = req.body;
  if (!client_name) {
    return res.status(400).json({ error: 'Client name is required' });
  }
  
  if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

  const limit = parseInt(limit_queries) || 50000;
  const months = parseInt(expires_months) || 12;
  const countries = (allowed_countries || '*').trim();
  const schemes = (allowed_schemes || '*').trim();
  
  const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
  const apiKey = `AOU-SECRET-${hex}`;
  
  try {
    const expiryStr = new Date();
    expiryStr.setMonth(expiryStr.getMonth() + months);
    
    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert([{
        api_key: apiKey,
        client_name,
        balance: limit,
        limit_queries: limit,
        expires_at: expiryStr.toISOString(),
        allowed_countries: countries,
        allowed_schemes: schemes
      }])
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json(newKey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/keys/:id - Update key status, top up balance, or restrictions
app.patch('/api/keys/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, top_up_balance, allowed_countries, allowed_schemes, balance, limit_queries } = req.body;
  
  if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

  try {
    const updates = {};
    
    if (status !== undefined) updates.status = status;
    
    if (top_up_balance !== undefined) {
      // Query current balance to increment relatively
      const { data: keyData, error: fetchErr } = await supabase
        .from('api_keys')
        .select('balance')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;
      updates.balance = (keyData?.balance || 0) + parseInt(top_up_balance);
    }

    if (balance !== undefined) updates.balance = parseInt(balance);
    if (limit_queries !== undefined) updates.limit_queries = parseInt(limit_queries);
    if (allowed_countries !== undefined) updates.allowed_countries = allowed_countries.trim();
    if (allowed_schemes !== undefined) updates.allowed_schemes = allowed_schemes.trim();
    
    updates.updated_at = new Date().toISOString();
    
    const { data: updated, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/keys/:id - Revoke API Key
app.delete('/api/keys/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });
  try {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database count stats
app.get('/api/bins/stats', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    const row = await db.get('SELECT COUNT(*) as count FROM bins');
    res.json({ success: true, count: row.count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, async () => {
  await init();
  console.log(`🚀 BIN Check API Server listening on port ${port}`);
});
