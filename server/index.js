import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { setupDatabase } from './db.js';
import { BinService } from './binService.js';
import { initTelegramBot, broadcastFXAlert, broadcastNewUserAlert, broadcastContactAlert } from './telegramBot.js';
import { initRemittanceDB, getLiveRates, upsertFXRate } from './remittanceDB.js';
import { calculateNetPayout } from './payoutEngine.js';
import { generateMarketPulse } from './anithaAI.js';
import { supabase } from './supabaseClient.js';
import { initSwiftScheduler } from './swiftScheduler.js';
import { UAParser } from 'ua-parser-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Prevent browser caching for all API responses to ensure real-time sync
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Serve static portal UI
app.use(express.static(path.join(__dirname, '../public')));

// Explicitly serve HTML files from the root directory for easy testing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/bincheck', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/bincheck.html'));
});
app.get('/swift-codes/countries', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/swift_countries.html'));
});
app.get('/swift-codes/country/:code', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/swift_country.html'));
});
app.get('/exchange-rates', (req, res) => {
  res.redirect(301, '/send_money');
});
app.get('/test_remittance.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../test_remittance.html'));
});
app.get('/test_admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../test_admin.html'));
});

// Dedicated Static Pages
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../public/about.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, '../public/contact.html')));

// Permanent Redirects
app.get('/services', (req, res) => res.redirect(301, '/#services'));

app.get(['/send_money', '/send_money.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../send_money.html'));
});

// Dedicated routes for SEO pages
app.get(['/faq', '/faq.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/faq.html'));
});

app.get(['/blog', '/blog.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/blog.html'));
});

app.get(['/blog_post', '/blog_post.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/blog_post.html'));
});

// Catch-all for upcoming portal pages
const comingSoonRoutes = ['/global_transfer', '/terms', '/privacy', '/partners', '/compare'];
app.get(comingSoonRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/coming_soon.html'));
});
app.get('/currency-converter', (req, res) => {
  res.redirect(301, '/send_money#calculator');
});

let db = null;
let binService = null;

const KSA_OFFSET_MS = 3 * 60 * 60 * 1000;

function getKSAStartAndEnd(dateParam = null) {
    let ksaDate;
    if (dateParam) {
        // Safe parsing of YYYY-MM-DD or MM/DD/YYYY to avoid local timezone offset shifts
        let year, month, day;
        if (dateParam.includes('-')) {
            [year, month, day] = dateParam.split('-');
        } else if (dateParam.includes('/')) {
            [month, day, year] = dateParam.split('/');
        }
        
        if (year && month && day) {
            ksaDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
        } else {
            ksaDate = new Date(dateParam);
            ksaDate.setUTCHours(0, 0, 0, 0);
        }
    } else {
        ksaDate = new Date(Date.now() + KSA_OFFSET_MS);
        ksaDate.setUTCHours(0, 0, 0, 0);
    }
    
    // Convert back to UTC boundary
    const startUTC = new Date(ksaDate.getTime() - KSA_OFFSET_MS);
    const endUTC = new Date(startUTC.getTime() + (24 * 60 * 60 * 1000));
    
    return { startUTC, endUTC };
}

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

// --- Universal Bank Search Endpoint ---
app.get('/api/banks/search', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

        const { q } = req.query;
        if (!q) {
            const { data, error } = await supabase.from('banks').select('*').limit(50);
            if (error) throw error;
            return res.json(data || []);
        }

        const queryStr = `%${q.trim()}%`;
        
        // Advanced Universal Search: Name, SWIFT, Email, Phone, Domain
        const { data, error } = await supabase
            .from('banks')
            .select('*')
            .or(`short_name.ilike.${queryStr},official_name.ilike.${queryStr},swift_code.ilike.${queryStr},website.ilike.${queryStr},email.ilike.${queryStr},customer_service.ilike.${queryStr}`)
            .limit(20);
            
        if (error) throw error;
        res.json(data || []);
    } catch (e) {
        console.error("Bank search error fetching from Supabase:", e);
        res.status(500).json({ error: "Failed to search banks" });
    }
});

app.get('/api/banks/:id', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });
        const { id } = req.params;
        const { data, error } = await supabase.from('banks').select('*').eq('id', id).single();
        if (error || !data) return res.status(404).json({ error: 'Bank not found' });
        res.json(data);
    } catch (e) {
        console.error("Error fetching bank by ID from Supabase:", e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/banks/save', async (req, res) => {
    try {
        const { 
            id, short_name, official_name, country, swift_code, website, 
            customer_service, email, brand_color, brand_text_color, card_color, logo_url,
            bin, scheme, type, category 
        } = req.body;
        
        let newId = id;
        
        // 1. Sync to SQLite banks table
        if (id) {
            await db.run(`
                UPDATE banks SET 
                    short_name = ?, official_name = ?, country = ?, swift_code = ?, website = ?, customer_service = ?, email = ?, brand_color = ?, brand_text_color = ?, card_color = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [short_name, official_name, country, swift_code, website, customer_service, email, brand_color, brand_text_color, card_color, logo_url, id]);
        } else {
            const result = await db.run(`
                INSERT INTO banks (short_name, official_name, country, swift_code, website, customer_service, email, brand_color, brand_text_color, card_color, logo_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [short_name, official_name, country, swift_code, website, customer_service, email, brand_color, brand_text_color, card_color, logo_url]);
            newId = result.lastID;
        }

        // 1.5 Sync to Supabase banks table
        if (supabase) {
            await supabase.from('banks').upsert({
                id: newId, // keep IDs in sync with SQLite
                short_name: short_name || null,
                official_name: official_name || null,
                country: country || null,
                swift_code: swift_code || null,
                website: website || null,
                customer_service: customer_service || null,
                email: email || null,
                brand_color: brand_color || null,
                brand_text_color: brand_text_color || null,
                card_color: card_color || null,
                logo_url: logo_url || null
            }, { onConflict: 'id' }).catch(err => console.warn('[Supabase Sync] Banks upsert failed:', err.message));
        }

        // 2. Sync to local and Supabase bins tables
        if (bin && bin.trim() !== '') {
            const cleanBin = bin.trim();
            // Local SQLite bins
            await db.run(`
                INSERT INTO bins (bin, scheme, type, category, issuer, country, source)
                VALUES (?, ?, ?, ?, ?, ?, 'LOCAL_EDITOR')
                ON CONFLICT(bin) DO UPDATE SET
                    scheme = excluded.scheme,
                    type = excluded.type,
                    category = excluded.category,
                    issuer = excluded.issuer,
                    country = excluded.country,
                    updated_at = CURRENT_TIMESTAMP
            `, [cleanBin, scheme || null, type || null, category || null, official_name || short_name, country]);

            // Remote Supabase bins
            if (supabase) {
                await supabase.from('bins').upsert({
                    bin: cleanBin,
                    scheme: scheme || null,
                    type: type || null,
                    category: category || null,
                    issuer: official_name || short_name,
                    country: country,
                    source: 'LOCAL_EDITOR'
                }, { onConflict: 'bin' }).catch(err => console.warn('[Supabase Sync] Bin upsert failed:', err.message));
            }
        }

        // 3. Sync to Supabase swift_codes table
        if (swift_code && swift_code.trim() !== '' && supabase) {
            const cleanSwift = swift_code.trim();
            await supabase.from('swift_codes').upsert({
                swift_code: cleanSwift,
                bank_name: official_name || short_name,
                country: null, // Full country name typically used here, but we only have code SA/US right now
                country_code: country,
                city: null,
                address: null
            }, { onConflict: 'swift_code' }).catch(err => console.warn('[Supabase Sync] Swift upsert failed:', err.message));
        }

        res.json({ success: true, id: newId });
    } catch (e) {
        console.error("Error saving bank:", e);
        res.status(500).json({ error: 'Server error while saving bank' });
    }
});

// --- Support Chat endpoints ---
// Health check endpoint
app.get('/api/botstatus', (req, res) => {
    res.json({
        tokenExists: !!process.env.TELEGRAM_BOT_TOKEN,
        geminiExists: !!process.env.GEMINI_API_KEY
    });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseConnected: !!db,
    binServiceReady: !!binService
  });
});

// ----------------------------------------------------
// Contact Form API
// ----------------------------------------------------
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, email, message } = req.body;
    
    if (!firstName || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        if (supabase) {
            const { error } = await supabase
                .from('contact_messages')
                .insert([{
                    first_name: firstName,
                    last_name: lastName || '',
                    email: email,
                    message: message,
                    created_at: new Date().toISOString()
                }]);
            
            if (error && error.code === '42P01') {
                // Table doesn't exist, we will silently ignore Supabase insert
                // and just send the Telegram message to avoid breaking the flow.
                console.warn('contact_messages table does not exist in Supabase yet.');
            } else if (error) {
                console.error('Supabase contact insert error:', error);
            }
        }

        // Fire Telegram Alert
        await broadcastContactAlert({ firstName, lastName, email, message });

        res.json({ success: true, message: 'Message sent successfully.' });
    } catch (err) {
        console.error('Contact Form Error:', err);
        res.status(500).json({ error: 'Internal server error processing contact form.' });
    }
});

// ----------------------------------------------------
// User Tracking API
// ----------------------------------------------------
app.post('/api/track', async (req, res) => {
  try {
    const { userAgent, screenResolution, language, timezone, latitude, longitude } = req.body;
    
    // Generate Fingerprint
    const rawString = `${userAgent}-${screenResolution}-${language}-${timezone}`;
    const fingerprint = crypto.createHash('sha256').update(rawString).digest('hex');

    // Parse User Agent (basic parsing)
    const browserMatch = userAgent?.match(/(firefox|msie|chrome|safari|trident|edge|opr(?=\/))\/?\s*(\d+)/i) || [];
    const browser = browserMatch[1] || 'Unknown';
    const osMatch = userAgent?.match(/(windows nt|mac os x|linux|android|ios|iphone|ipad)/i) || [];
    const os = osMatch[1] || 'Unknown';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent || '');
    const device_type = isMobile ? 'Mobile' : 'Desktop';
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!supabase) {
      return res.status(503).json({ error: 'Database connection not available' });
    }

    // 1. Find Tracked User
    const { data: user, error: userError } = await supabase
      .from('tracked_users')
      .select('*')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    let userId;

    if (user) {
      userId = user.id;
      // Increment visits and update last_seen
      await supabase
        .from('tracked_users')
        .update({ 
          last_seen_at: new Date().toISOString(),
          total_visits: user.total_visits + 1,
          browser,
          os,
          device_type
        })
        .eq('id', userId);
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('tracked_users')
        .insert([{
          fingerprint,
          browser,
          os,
          device_type,
          total_visits: 1
        }])
        .select()
        .single();
        
      if (insertError) throw insertError;
      userId = newUser.id;
    }

    // 2. Log Session
    await supabase
      .from('user_sessions')
      .insert([{
        user_id: userId,
        latitude: latitude || null,
        longitude: longitude || null,
        ip_address
      }]);

    res.json({ success: true, fingerprint });

  } catch (error) {
    console.error('❌ Error tracking user:', error);
    res.status(500).json({ error: 'Internal server error during tracking' });
  }
});

// ----------------------------------------------------
// User Tracking - Update Ping API
// ----------------------------------------------------
app.post('/api/track-ping', express.json(), async (req, res) => {
  try {
    const { fingerprint, baseCurrency, targetCurrency, currentTab, timeSpentSeconds } = req.body;
    
    if (!supabase || !fingerprint) {
      return res.status(400).json({ error: 'Missing fingerprint or db connection' });
    }

    const { data: user } = await supabase
      .from('tracked_users')
      .select('id, time_spent_by_tab')
      .eq('fingerprint', fingerprint)
      .maybeSingle();

    if (user) {
      const updates = {};
      if (baseCurrency) updates.preferred_base = baseCurrency;
      if (targetCurrency) updates.preferred_target = targetCurrency;

      if (currentTab && timeSpentSeconds > 0) {
        const timeMap = user.time_spent_by_tab || {};
        timeMap[currentTab] = (timeMap[currentTab] || 0) + timeSpentSeconds;
        updates.time_spent_by_tab = timeMap;
      }

      await supabase
        .from('tracked_users')
        .update(updates)
        .eq('id', user.id);
        
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error in track-ping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// ----------------------------------------------------
// Admin - View Tracked Users
// ----------------------------------------------------
app.get('/api/admin/tracked-users', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'DB not connected' });
    const { data: users, error } = await supabase
      .from('tracked_users')
      .select('*')
      .order('last_seen_at', { ascending: false })
      .limit(50);
      
    if (error) throw error;
    res.json(users);
  } catch (err) {
    console.error('Failed to fetch tracked users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------------------------------------
// FX Rates (Remittance DB)
// ----------------------------------------------------
app.get('/api/fx-rates', async (req, res) => {
  try {
    const rates = await getLiveRates();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching FX rates:', error);
    res.status(500).json({ error: 'Failed to fetch live FX rates' });
  }
});

app.post('/api/fx-rates', express.json(), async (req, res) => {
  const { pair, rate } = req.body;
  if (!pair || !rate) return res.status(400).json({ error: 'Missing pair or rate' });
  
  try {
    const success = await upsertFXRate(pair, parseFloat(rate));
    if (success) {
      res.json({ success: true, message: `Updated ${pair} to ${rate}` });
    } else {
      res.status(404).json({ error: 'Currency pair not found' });
    }
  } catch (error) {
    console.error('Error updating FX rate:', error);
    res.status(500).json({ error: 'Failed to update FX rate' });
  }
});

app.post('/api/ocr/ingest', express.json(), async (req, res) => {
  try {
    const { base_currency, rates } = req.body;
    if (!base_currency || !Array.isArray(rates)) {
        return res.status(400).json({ error: 'Invalid OCR payload' });
    }

    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }

    const insertedRows = [];
    
    for (const rateObj of rates) {
        // Enforce the OCR Logic strictly
        const ocr_rate = parseFloat(rateObj.sell_rate || rateObj.ocr_rate || rateObj.rate);
        if (isNaN(ocr_rate) || ocr_rate <= 0) continue;
        
        // Calculations according to the prompt
        const sell_rate = ocr_rate;
        const mid_rate = parseFloat((sell_rate * 0.99).toFixed(5));
        const buy_rate = parseFloat((sell_rate * 0.98).toFixed(5));
        const target_currency = rateObj.currency;
        
        const row = {
            bank_name: rateObj.source || 'OCR_Pipeline',
            base_currency: base_currency.toUpperCase(),
            target_currency: target_currency.toUpperCase(),
            buy_rate: buy_rate,
            sell_rate: sell_rate,
            // mid_rate: mid_rate, // NOTE: Needs to be added via SQL in Supabase dashboard
            transfer_type: 'international_transfer',
            updated_at: new Date().toISOString()
        };
        
        const { error: insertErr } = await supabase.from('bank_fx_rates').insert([row]);
        if (insertErr) {
            console.error('OCR DB Insert Error:', insertErr.message);
        } else {
            // Log to fx_history for the charts
            const pair = `${row.base_currency}_${row.target_currency}`;
            await supabase.from('fx_history').insert([{
                pair: pair,
                rate: buy_rate, // using buy rate for historical trend line
                provider: row.bank_name,
                spread_pct: 0
            }]);
        }
        
        insertedRows.push({
            currency: target_currency,
            buy_rate,
            mid_rate,
            sell_rate,
            status: insertErr ? 'failed' : 'success'
        });
    }

    res.json({ success: true, processed: insertedRows });
  } catch (err) {
    console.error('OCR Ingest Error:', err);
    res.status(500).json({ error: 'Failed to process OCR payload' });
  }
});

app.post('/api/payout-calculator', express.json(), (req, res) => {
  const { baseAmount, pair, spread, flatCommission } = req.body;
  
  if (!baseAmount || !pair) return res.status(400).json({ error: 'Missing baseAmount or pair' });

  // In a real app, you would fetch the live rate from DB here for strict security.
  // We'll trust the requested rate if provided, or fallback to the DB rate.
  getLiveRates().then(rates => {
    const fx = rates.find(r => r.pair === pair);
    if (!fx) return res.status(404).json({ error: 'Pair not found' });
    
    try {
      const breakdown = calculateNetPayout(
        baseAmount, 
        fx.rate, 
        spread ?? fx.spread, 
        flatCommission ?? 50
      );
      breakdown.updatedAt = fx.updated_at; // Pass timestamp to frontend
      res.json(breakdown);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
});

app.get('/api/market-pulse', async (req, res) => {
  try {
    const pulse = await generateMarketPulse();
    res.json({ pulse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Anitha AI Market Pulse' });
  }
});

// GET /api/currencies - Fetch distinct bases and targets
app.get('/api/currencies', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });
    const { data, error } = await supabase.from('bank_fx_rates').select('base_currency, target_currency');
    if (error) throw error;
    
    const bases = [...new Set(data.map(d => d.base_currency))].filter(Boolean);
    const targets = [...new Set(data.map(d => d.target_currency))].filter(Boolean);
    
    res.json({ bases, targets });
  } catch (e) {
    console.error('Error fetching currencies:', e);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
});

// GET /api/providers/:base/:target - Fetch live provider rates
app.get('/api/providers/:base/:target', async (req, res) => {
  try {
    const base = req.params.base.toUpperCase();
    const target = req.params.target.toUpperCase();
    if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

    const { startUTC } = getKSAStartAndEnd();

    const { data, error } = await supabase
        .from('bank_fx_rates')
        .select('*')
        .eq('base_currency', base)
        .eq('target_currency', target)
        .gte('updated_at', startUTC.toISOString())
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) throw error;
    
    const uniqueProviders = [];
    const seenBanks = new Set();
    for (const row of (data || [])) {
        if (!seenBanks.has(row.bank_name)) {
            seenBanks.add(row.bank_name);
            uniqueProviders.push(row);
        }
    }
    
    uniqueProviders.sort((a, b) => b.buy_rate - a.buy_rate);
    res.json(uniqueProviders);
  } catch (e) {
    console.error('Error fetching providers:', e);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// GET /api/rates/historical/:base/:target - Fetch best rate for a specific date
app.get('/api/rates/historical/:base/:target', async (req, res) => {
  try {
    const base = req.params.base.toUpperCase();
    const target = req.params.target.toUpperCase();
    const targetDateStr = req.query.date;
    
    console.log(`[Historical API] Requested base=${base}, target=${target}, date=${targetDateStr}`);
    
    // Quick validation
    if (!targetDateStr || targetDateStr.length < 4) {
      console.log('[Historical API] Invalid date format');
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

    // Use KSA helper to get the UTC boundaries for that specific KSA date
    const { startUTC, endUTC } = getKSAStartAndEnd(targetDateStr);
    console.log(`[Historical API] Calculated boundaries: start=${startUTC.toISOString()}, end=${endUTC.toISOString()}`);

    // Fetch rates for that specific day
    const { data, error } = await supabase
        .from('bank_fx_rates')
        .select('buy_rate')
        .eq('base_currency', base)
        .eq('target_currency', target)
        .gte('updated_at', startUTC.toISOString())
        .lt('updated_at', endUTC.toISOString());
        
    if (error) {
      console.error('[Historical API] Supabase error:', error);
      throw error;
    }

    if (data && data.length > 0) {
        const bestRate = Math.max(...data.map(r => r.buy_rate));
        console.log(`[Historical API] Found best rate: ${bestRate}`);
        res.json({ rate: bestRate, found: true });
    } else {
        console.log('[Historical API] No records found for this date block');
        res.json({ rate: 0, found: false });
    }
  } catch (e) {
    console.error('[Historical API] Internal Error:', e);
    res.status(500).json({ error: 'Failed to fetch historical rates' });
  }
});

// GET /api/trends/:base/all - Fetch trends for all available targets against a base
app.get('/api/trends/:base/all', async (req, res) => {
  try {
    const base = req.params.base.toUpperCase();
    if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

    // Use KSA helper to get the UTC boundaries for today
    const { startUTC: todayStartUTC, endUTC: todayEndUTC } = getKSAStartAndEnd();

    // Calculate yesterday boundaries (shift KSA start by 24h)
    const yesterdayStartUTC = new Date(todayStartUTC.getTime() - (24 * 60 * 60 * 1000));
    const yesterdayEndUTC = todayStartUTC;

    // Fetch today's rates
    const { data: todayData, error: todayError } = await supabase
        .from('bank_fx_rates')
        .select('target_currency, buy_rate, sell_rate')
        .eq('base_currency', base)
        .gte('updated_at', todayStartUTC.toISOString())
        .lt('updated_at', todayEndUTC.toISOString());
        
    if (todayError) throw todayError;

    // Fetch yesterday's rates
    const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('bank_fx_rates')
        .select('target_currency, buy_rate')
        .eq('base_currency', base)
        .gte('updated_at', yesterdayStartUTC.toISOString())
        .lt('updated_at', yesterdayEndUTC.toISOString());
        
    if (yesterdayError) throw yesterdayError;

    // Group by target
    const todayByTarget = {};
    for (const r of (todayData || [])) {
        if (!todayByTarget[r.target_currency]) todayByTarget[r.target_currency] = [];
        todayByTarget[r.target_currency].push(r);
    }
    
    const yesterdayByTarget = {};
    for (const r of (yesterdayData || [])) {
        if (!yesterdayByTarget[r.target_currency]) yesterdayByTarget[r.target_currency] = [];
        yesterdayByTarget[r.target_currency].push(r.buy_rate);
    }

    const allTargets = new Set([...Object.keys(todayByTarget), ...Object.keys(yesterdayByTarget)]);
    const results = [];

    for (const target of allTargets) {
        let growth = 0;
        let bestTodayRow = null;
        
        const tRates = todayByTarget[target];
        const yRates = yesterdayByTarget[target];
        
        if (tRates && tRates.length > 0) {
            // Find the object with the highest buy_rate
            bestTodayRow = tRates.reduce((prev, current) => (prev.buy_rate > current.buy_rate) ? prev : current);
        }
        
        const bestToday = bestTodayRow ? bestTodayRow.buy_rate : 0;
        
        if (bestToday > 0 && yRates && yRates.length > 0) {
            const bestYesterday = Math.max(...yRates);
            if (bestYesterday > 0) {
                growth = ((bestToday - bestYesterday) / bestYesterday) * 100;
            }
        }
        
        if (bestToday > 0 || (yRates && yRates.length > 0)) {
           // Base rate calculation on the highest today, or highest yesterday if today doesn't exist
           const primaryBuyRate = bestToday > 0 ? bestToday : Math.max(...yRates);
           
           // If we have a real sell_rate from the DB, use it. Otherwise compute it backwards from buy_rate (buy = sell * 0.98 => sell = buy / 0.98)
           const sell_rate = (bestTodayRow && bestTodayRow.sell_rate) ? bestTodayRow.sell_rate : (primaryBuyRate / 0.98);
           
           // Compute mid rate strictly as 99% of sell rate
           const mid_rate = sell_rate * 0.99;
           
           results.push({
               target_currency: target,
               rate: parseFloat(primaryBuyRate.toFixed(5)), // Keep 'rate' as buy_rate for backwards compatibility
               buy_rate: parseFloat(primaryBuyRate.toFixed(5)),
               mid_rate: parseFloat(mid_rate.toFixed(5)),
               sell_rate: parseFloat(sell_rate.toFixed(5)),
               growthPercentage: Math.abs(growth).toFixed(2),
               trend: growth >= 0 ? 'up' : 'down'
           });
        }
    }

    results.sort((a, b) => a.target_currency.localeCompare(b.target_currency));

    res.json(results);
  } catch (e) {
    console.error('Error fetching all trends:', e);
    res.status(500).json({ error: 'Failed to fetch all trends' });
  }
});

// GET /api/trends/:base/:target - Fetch trend from yesterday
app.get('/api/trends/:base/:target', async (req, res) => {
  try {
    const base = req.params.base.toUpperCase();
    const target = req.params.target.toUpperCase();
    if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });

    // Use KSA helper to get the UTC boundaries for today
    const { startUTC: todayStartUTC, endUTC: todayEndUTC } = getKSAStartAndEnd();

    // Calculate yesterday boundaries (shift KSA start by 24h)
    const yesterdayStartUTC = new Date(todayStartUTC.getTime() - (24 * 60 * 60 * 1000));
    const yesterdayEndUTC = todayStartUTC;

    // Fetch today's rates
    const { data: todayData, error: todayError } = await supabase
        .from('bank_fx_rates')
        .select('buy_rate')
        .eq('base_currency', base)
        .eq('target_currency', target)
        .gte('updated_at', todayStartUTC.toISOString())
        .lt('updated_at', todayEndUTC.toISOString());
        
    if (todayError) throw todayError;

    // Fetch yesterday's rates
    const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('bank_fx_rates')
        .select('buy_rate')
        .eq('base_currency', base)
        .eq('target_currency', target)
        .gte('updated_at', yesterdayStartUTC.toISOString())
        .lt('updated_at', yesterdayEndUTC.toISOString());
        
    if (yesterdayError) throw yesterdayError;

    let growth = 0;
    
    if (todayData && todayData.length > 0 && yesterdayData && yesterdayData.length > 0) {
        const bestToday = Math.max(...todayData.map(r => r.buy_rate));
        const bestYesterday = Math.max(...yesterdayData.map(r => r.buy_rate));
        
        if (bestYesterday > 0) {
            growth = ((bestToday - bestYesterday) / bestYesterday) * 100;
        }
    }

    res.json({ 
        growthPercentage: Math.abs(growth).toFixed(2), 
        trend: growth >= 0 ? 'up' : 'down'
    });
  } catch (e) {
    console.error('Error fetching trends:', e);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// GET /api/rates/chart/:base/:target - Fetch synthetic historical data for chart
app.get('/api/rates/chart/:base/:target', async (req, res) => {
  try {
    const base = req.params.base.toUpperCase();
    const target = req.params.target.toUpperCase();
    
    let days = 30;
    let fromDate = new Date();
    let toDate = new Date();

    if (req.query.from && req.query.to) {
        fromDate = new Date(req.query.from);
        toDate = new Date(req.query.to);
        days = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)));
    } else if (req.query.days) {
        days = parseInt(req.query.days);
        fromDate.setDate(fromDate.getDate() - days);
    }
    toDate.setHours(23, 59, 59, 999);

    // 1. Try fetching real historical data from fx_history
    const pairStr = `${base}_${target}`;
    const { data: historyData, error: historyErr } = await supabase
        .from('fx_history')
        .select('created_at, rate')
        .eq('pair', pairStr)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: true });

    if (!historyErr && historyData && historyData.length > 0) {
        // Group by day to smooth out the chart
        const grouped = {};
        for (const row of historyData) {
            const dateStr = new Date(row.created_at).toISOString().split('T')[0];
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(row.rate);
        }
        
        const aggregatedData = Object.keys(grouped).sort().map(date => {
            const rates = grouped[date];
            const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
            return { date, rate: parseFloat(avg.toFixed(5)) };
        });
        
        return res.json(aggregatedData);
    }

    // 2. Fallback to synthetic data generation if fx_history has no data for this range
    const { data: liveData } = await supabase
        .from('bank_fx_rates')
        .select('buy_rate')
        .eq('base_currency', base)
        .eq('target_currency', target)
        .order('buy_rate', { ascending: false })
        .limit(1);
        
    let currentRate = 25.54; // default fallback
    if (liveData && liveData.length > 0) currentRate = liveData[0].buy_rate;

    // Use a fixed hash to anchor the starting rate so it looks consistent across reloads
    const baseHashStr = `${base}-${target}`;
    let bHash = 0;
    for (let j = 0; j < baseHashStr.length; j++) bHash = Math.imul(31, bHash) + baseHashStr.charCodeAt(j) | 0;
    const initialOffset = ((Math.abs(bHash) % 100) / 100) * 0.04 - 0.02; // -2% to +2%
    
    let currentWalk = currentRate * (1 + initialOffset);
    const chartData = [];
    
    // If a custom 'to' date is provided, use it. Otherwise use today.
    let endDate = new Date();
    if (req.query.to) {
        endDate = new Date(req.query.to);
    }
    
    for (let i = days; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        
        const seedStr = `${base}-${target}-${d.toISOString().split('T')[0]}`;
        let hash = 0;
        for (let j = 0; j < seedStr.length; j++) {
            hash = Math.imul(31, hash) + seedStr.charCodeAt(j) | 0;
        }
        
        // Fluctuate by -0.3% to +0.3% per day
        const randomPercent = ((Math.abs(hash) % 100) / 100) * 0.006 - 0.003;
        currentWalk = currentWalk * (1 + randomPercent);
        
        // Force the very last dot to exactly match the live rate if it ends on today
        if (i === 0 && !req.query.to) currentWalk = currentRate; 
        
        chartData.push({
            date: d.toISOString().split('T')[0],
            rate: parseFloat(currentWalk.toFixed(5))
        });
    }

    res.json(chartData);
  } catch (e) {
    console.error('Error fetching chart data:', e);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
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

// GET /api/config/firebase - Expose Firebase client configurations to frontend
app.get('/api/config/firebase', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || process.env.apiKey || null,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.authDomain || null,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.projectId || null,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.storageBucket || null,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.messagingSenderId || null,
    appId: process.env.FIREBASE_APP_ID || process.env.appId || null
  });
});

// Public BIN Directory List Endpoint
app.get('/api/bins/list', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Supabase not initialized' });
    
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.q ? req.query.q.trim() : '';

    let query = supabase
        .from('bins')
        .select('bin, issuer, country_name, country_code, scheme, type, category', { count: 'exact' });

    if (search) {
        // Search by bin or issuer
        query = query.or(`bin.ilike.%${search}%,issuer.ilike.%${search}%`);
    }

    // Add pagination
    const { data: rawRows, error, count } = await query
        .order('bin', { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Map country_code to country to match the expected format
    const rows = (rawRows || []).map(r => ({
        ...r,
        country: r.country_code || r.country_name || 'US'
    }));
    
    res.json({
        success: true,
        data: rows,
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        pages: Math.ceil((count || 0) / limit)
    });
  } catch (e) {
    console.error("Error fetching BIN list from Supabase:", e);
    res.status(500).json({ error: 'Server error fetching BIN list' });
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

// --- SWIFT CODES API ENDPOINTS ---

app.get('/api/swift/search', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });
    const { code, bank, city } = req.query;
    
    try {
        let query = supabase.from('swift_codes').select('*');
        if (code) query = query.ilike('swift_code', `%${code}%`);
        if (bank) query = query.ilike('bank_name', `%${bank}%`);
        if (city) query = query.ilike('city', `%${city}%`);
        
        const { data, error } = await query.limit(50);
        if (error) throw error;
        res.json({ success: true, count: data.length, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/swift/country/:country_code', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });
    try {
        const { data, error } = await supabase
            .from('swift_codes')
            .select('*')
            .eq('country_code', req.params.country_code.toLowerCase())
            .limit(100);
        if (error) throw error;
        res.json({ success: true, count: data.length, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/swift/validate/:swift_code', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });
    try {
        const { data, error } = await supabase
            .from('swift_codes')
            .select('*')
            .eq('swift_code', req.params.swift_code.toUpperCase().trim())
            .single();
            
        if (error) {
            // Might be "Row not found"
            return res.json({ valid: false, message: 'SWIFT code not found in database', code: req.params.swift_code });
        }
        res.json({ valid: true, data });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin manual trigger for scraper (for testing)
app.post('/api/admin/trigger-swift-scrape', async (req, res) => {
    // In production, secure this with an admin API key
    // For now, we will just trigger it asynchronously so we don't block the response
    res.json({ message: 'SWIFT scrape job initiated in the background' });
    import('./swiftScraper.js').then(({ runFullScraper }) => {
        runFullScraper().catch(console.error);
    });
});

// Analytics tracking endpoint (Uses tracked_users & user_sessions)
app.post('/api/analytics/track', async (req, res) => {
    if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });
    try {
        const { session_id, page_url, theme_mode, delta_ms, user_agent } = req.body;
        
        if (!page_url) {
            return res.status(400).json({ error: 'Missing required tracking fields' });
        }

        const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const clientIp = rawIp.split(',')[0].trim();
        const userAgent = req.headers['user-agent'] || user_agent || 'unknown';

        // Generate deterministic UUID (UUIDv4 format) using SHA-256 of IP + UserAgent
        const hash = crypto.createHash('sha256').update(`${clientIp}-${userAgent}`).digest('hex');
        const fingerprint = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
        
        // 1. Check if user exists in tracked_users
        const { data: userRecord, error: userErr } = await supabase
            .from('tracked_users')
            .select('*')
            .eq('fingerprint', fingerprint)
            .limit(1)
            .maybeSingle();

        if (userErr) throw userErr;

        let userId;

        if (!userRecord) {
            // NEW USER
            const timeObj = {};
            timeObj[page_url] = delta_ms || 0;
            
            // Parse User-Agent
            const parser = new UAParser(userAgent);
            const resData = parser.getResult();
            const browserName = resData.browser.name ? `${resData.browser.name} ${resData.browser.version || ''}`.trim() : 'Unknown Browser';
            const osName = resData.os.name ? `${resData.os.name} ${resData.os.version || ''}`.trim() : 'Unknown OS';
            
            let deviceType = 'Desktop';
            if (resData.device.type === 'mobile') deviceType = 'Mobile';
            else if (resData.device.type === 'tablet') deviceType = 'Tablet';
            if (/bot|crawl|spider/i.test(userAgent)) deviceType = 'Bot';
            
            const { data: newUser, error: insertErr } = await supabase
                .from('tracked_users')
                .insert([{
                    fingerprint: fingerprint,
                    browser: browserName.substring(0, 100),
                    os: osName.substring(0, 100),
                    device_type: deviceType,
                    time_spent_by_tab: timeObj,
                    total_visits: 1
                }])
                .select()
                .single();
                
            if (insertErr) throw insertErr;
            userId = newUser.id;

            // Log session
            await supabase.from('user_sessions').insert([{
                user_id: userId,
                ip_address: clientIp
            }]);

            // Fire Telegram alert for brand new user
            broadcastNewUserAlert(page_url, userAgent);
            
        } else {
            // RETURNING USER
            userId = userRecord.id;
            const currentTimes = userRecord.time_spent_by_tab || {};
            currentTimes[page_url] = (currentTimes[page_url] || 0) + (delta_ms || 0);

            // Did they just start a new session?
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
            const { data: recentSession } = await supabase
                .from('user_sessions')
                .select('id')
                .eq('user_id', userId)
                .gte('visited_at', thirtyMinsAgo)
                .limit(1);

            if (!recentSession || recentSession.length === 0) {
                // New session for existing user
                await supabase.from('user_sessions').insert([{
                    user_id: userId,
                    ip_address: clientIp
                }]);
                
                await supabase.from('tracked_users').update({
                    time_spent_by_tab: currentTimes,
                    last_seen_at: new Date().toISOString(),
                    total_visits: (userRecord.total_visits || 0) + 1
                }).eq('id', userId);
            } else {
                // Just update times and last_seen
                await supabase.from('tracked_users').update({
                    time_spent_by_tab: currentTimes,
                    last_seen_at: new Date().toISOString()
                }).eq('id', userId);
            }
        }
        
        res.json({ success: true, user_id: userId });
    } catch (e) {
        console.error("Analytics Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Get active users online now
app.get('/api/analytics/active', async (req, res) => {
    if (!supabase) return res.json({ active_users: Math.floor(Math.random() * 30) + 140 });
    try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count, error } = await supabase
            .from('tracked_users')
            .select('*', { count: 'exact', head: true })
            .gte('last_seen_at', fiveMinsAgo);
            
        if (error) throw error;
        
        // If traffic is low, boost it slightly for marketing aesthetics, or just return actual
        // We'll return actual + a base of ~140 for the "Global Directory" feel.
        const base = 142;
        res.json({ active_users: (count || 0) + base });
    } catch (e) {
        res.json({ active_users: Math.floor(Math.random() * 30) + 140 });
    }
});

import { runFullScraper } from './swiftScraper.js';
import { runProviderScraper } from './providerScraper.js';
import { broadcastSupportBotAlert, broadcastSupportBotReply, activeSupportSessions } from './telegramBot.js';

app.post('/api/support-bot', async (req, res) => {
    try {
        const data = req.body;
        const ticketId = 'TKT-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // 1. Create the session
        activeSupportSessions.set(ticketId, {
            data,
            active: true,
            messages: [
                {
                    sender: 'user',
                    text: data.message,
                    timestamp: Date.now() - 100
                },
                {
                    sender: 'system',
                    text: 'Thanks for providing the info. We will connect you to a customer executive.',
                    timestamp: Date.now()
                }
            ],
            createdAt: Date.now()
        });

        // 2. Broadcast to Telegram Admin
        await broadcastSupportBotAlert(ticketId, data);

        res.json({ success: true, ticketId, message: "Chat session started." });
    } catch (e) {
        console.error("Support bot routing error:", e);
        res.status(500).json({ error: "Failed to route support ticket." });
    }
});

app.post('/api/support/message', async (req, res) => {
    try {
        const { ticketId, text } = req.body;
        if (!ticketId || !text) return res.status(400).json({ error: 'Missing ticketId or text' });

        const session = activeSupportSessions.get(ticketId);
        if (!session || !session.active) {
            return res.status(404).json({ error: 'Session not found or expired' });
        }

        // Add user message to session
        session.messages.push({
            sender: 'user',
            text: text,
            timestamp: Date.now()
        });

        // Broadcast to admin
        await broadcastSupportBotReply(ticketId, text, session.data.name);

        res.json({ success: true });
    } catch (e) {
        console.error("Error sending user reply:", e);
        res.status(500).json({ error: "Failed to send message." });
    }
});

app.post('/api/support/end', async (req, res) => {
    try {
        const { ticketId } = req.body;
        if (!ticketId) return res.status(400).json({ error: 'Missing ticketId' });

        const session = activeSupportSessions.get(ticketId);
        if (session) {
            session.active = false;
        }

        // We can optionally tell telegram it was closed by user
        // But for now, we just mark inactive
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Failed to end chat." });
    }
});

app.get('/api/support/poll', (req, res) => {
    const { ticketId } = req.query;
    if (!ticketId) return res.status(400).json({ error: 'Missing ticketId' });

    const session = activeSupportSessions.get(ticketId);
    if (!session) {
        return res.json({ active: false, messages: [] });
    }

    res.json({ active: session.active, messages: session.messages });
});

app.listen(port, async () => {
  await init();
  // Initialize Telegram Bot & FX Engine
  await initRemittanceDB();
  await initSwiftScheduler();
  await initTelegramBot();
  
  // Initialize and schedule Provider Scraper (Runs every 15 minutes)
  await runProviderScraper();
  setInterval(runProviderScraper, 15 * 60 * 1000);

  console.log(`🚀 BIN Check API Server listening on port ${port}`);
});
