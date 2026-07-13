import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { setupDatabase } from './db.js';
import { BinService } from './binService.js';

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
  } catch (err) {
    console.error('❌ Failed to initialize Database/BinService:', err.message);
  }
}

// API Key Authentication & Balance check middleware
async function authenticateApiKey(req, res, next) {
  const apiKey = req.query.api_key;
  
  if (!apiKey) {
    // 422: API Key is missing
    return res.status(422).json({ error: 'API key is missing' });
  }

  try {
    const keyData = await db.get('SELECT * FROM api_keys WHERE api_key = ?', [apiKey]);
    if (!keyData) {
      // 403: Invalid API Key
      return res.status(403).json({ error: 'Invalid API Key' });
    }

    // Verify expiry and status
    const expiryDate = new Date(keyData.expires_at);
    if (expiryDate < new Date() || keyData.status !== 'active') {
      // 401: Your balance is exhausted,or package expired
      return res.status(401).json({ error: 'Your balance is exhausted,or package expired' });
    }

    // Check query balance
    if (keyData.balance <= 0) {
      // 401: Your balance is exhausted,or package expired
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

    // ── CHARGE CLIENT ──────────────────────────────────────────────────────
    // Decrement the balance now that lookup succeeded and policy validation passed
    await db.run('UPDATE api_keys SET balance = balance - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [keyData.id]);

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

// POST /api/auth/login - Firebase Google Auth Sign-In / Register
app.post('/api/auth/login', async (req, res) => {
  const { uid, email, displayName } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });

    // Check if user already exists
    let user = await db.get('SELECT * FROM api_keys WHERE firebase_uid = ?', [uid]);
    
    if (!user) {
      // First time registration: generate API Key and give 10 free searches
      const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
      const apiKey = `AOU-SECRET-${hex}`;
      const limit = 10;
      
      const expiryStr = new Date();
      expiryStr.setFullYear(expiryStr.getFullYear() + 1); // 1 year expiration
      const expiresAt = expiryStr.toISOString().replace('T', ' ').substring(0, 19);

      await db.run(
        `INSERT INTO api_keys (api_key, client_name, balance, limit_queries, expires_at, allowed_countries, allowed_schemes, firebase_uid, email)
         VALUES (?, ?, ?, ?, ?, '*', '*', ?, ?)`,
        [apiKey, displayName || 'Web User', limit, limit, expiresAt, uid, email || '']
      );

      console.log(`🌱 [AUTH] Registered new Firebase user: ${displayName || email} with 10 free queries.`);
      user = await db.get('SELECT * FROM api_keys WHERE firebase_uid = ?', [uid]);
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
        status: user.status
      }
    });
  } catch (err) {
    console.error('❌ [AUTH LOGIN ERROR]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── KEY MANAGEMENT ENDPOINTS ──────────────────────────────────────────────

// GET /api/keys - Retrieve all API keys
app.get('/api/keys', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    const rows = await db.all('SELECT * FROM api_keys ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/keys - Generate a new API key with restrictions
app.post('/api/keys', async (req, res) => {
  const { client_name, limit_queries, expires_months, allowed_countries, allowed_schemes } = req.body;
  if (!client_name) {
    return res.status(400).json({ error: 'Client name is required' });
  }
  
  const limit = parseInt(limit_queries) || 50000;
  const months = parseInt(expires_months) || 12;
  const countries = (allowed_countries || '*').trim();
  const schemes = (allowed_schemes || '*').trim();
  
  // Generate secure API key: AOU-SECRET-[12-char hex]
  const hex = crypto.randomBytes(6).toString('hex').toUpperCase();
  const apiKey = `AOU-SECRET-${hex}`;
  
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    
    const expiryStr = new Date();
    expiryStr.setMonth(expiryStr.getMonth() + months);
    const expiresAt = expiryStr.toISOString().replace('T', ' ').substring(0, 19);
    
    await db.run(
      'INSERT INTO api_keys (api_key, client_name, balance, limit_queries, expires_at, allowed_countries, allowed_schemes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [apiKey, client_name, limit, limit, expiresAt, countries, schemes]
    );
    
    const newKey = await db.get('SELECT * FROM api_keys WHERE api_key = ?', [apiKey]);
    res.status(201).json(newKey);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/keys/:id - Update key status, top up balance, or restrictions
app.patch('/api/keys/:id', async (req, res) => {
  const { id } = req.params;
  const { status, top_up_balance, allowed_countries, allowed_schemes, balance, limit_queries } = req.body;
  
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    
    const keyData = await db.get('SELECT * FROM api_keys WHERE id = ?', [id]);
    if (!keyData) {
      return res.status(404).json({ error: 'API Key not found' });
    }
    
    if (status !== undefined) {
      await db.run('UPDATE api_keys SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    }
    
    if (top_up_balance !== undefined) {
      await db.run('UPDATE api_keys SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [parseInt(top_up_balance), id]);
    }

    if (balance !== undefined) {
      await db.run('UPDATE api_keys SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [parseInt(balance), id]);
    }

    if (limit_queries !== undefined) {
      await db.run('UPDATE api_keys SET limit_queries = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [parseInt(limit_queries), id]);
    }

    if (allowed_countries !== undefined) {
      await db.run('UPDATE api_keys SET allowed_countries = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [allowed_countries.trim(), id]);
    }

    if (allowed_schemes !== undefined) {
      await db.run('UPDATE api_keys SET allowed_schemes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [allowed_schemes.trim(), id]);
    }
    
    const updated = await db.get('SELECT * FROM api_keys WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/keys/:id - Revoke API Key
app.delete('/api/keys/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!db) return res.status(503).json({ error: 'Database not initialized' });
    await db.run('DELETE FROM api_keys WHERE id = ?', [id]);
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
