import express from 'express';
import cors from 'cors';
import { setupDatabase } from './db.js';
import { BinService } from './binService.js';
import { startTcpSwitch } from './tcpSwitch.js';
import { Builder } from '../src/iso/builder.js';
import { Parser } from '../src/iso/parser.js';
import { CryptoLab } from './cryptoLab.js';
import { XSDEngine } from './xsdEngine.js';
import { supabase } from './supabaseClient.js';
import net from 'net';
import tls from 'tls';
import { RemittanceService } from './remittanceService.js';
import { importBinsFromCsv } from './importCsvBins.js';
import { FXAggregator } from './fxAggregator.js';
import { ClearingManager } from '../src/clearing/manager.js';
import { DSEngine } from './dsEngine.js';
import { ACSEngine } from './acsEngine.js';
import { SettlementEngine } from './settlementEngine.js';
import { FraudEngine } from './fraudEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TCP SWITCH HANDLER ---
const handleIsoMessage = async (socket, data) => {
  const remoteAddress = socket.remoteAddress;
  console.log(`🔌 [TCP SWITCH] Processing message from ${remoteAddress}...`);

  try {
    // 1. Log Raw Request
    const rawHex = data.toString('hex');
    const mti = data.toString('utf8', 0, 4);
    
    // 2. Check for Remote Forwarding (e.g., to our Issuer Emulator on 8584)
    const remoteHost = '127.0.0.1';
    const remotePort = 8584; // Our new Issuer Port

    if (remoteHost && remotePort) {
      console.log(`🛰️  [PROXY] Forwarding to Remote Host: ${remoteHost}:${remotePort}...`);
      
      const client = new net.Socket();
      client.connect(remotePort, remoteHost, () => {
        client.write(data);
      });

      client.on('data', (responseData) => {
        console.log(`✅ [PROXY] Response received from Remote Host.`);
        socket.write(responseData);
        client.destroy();
      });

      client.on('error', (err) => {
        console.error(`❌ [PROXY] Forwarding Failed: ${err.message}`);
        // Fallback to local mock if remote fails
        const mockResponse = data; // Simplified mock
        socket.write(mockResponse);
      });

      return;
    }

    // 3. Fallback: Local Mock Engine (if no remote host)
    const response = data; // MTI manipulation would go here
    socket.write(response);
  } catch (err) {
    console.error(`❌ [TCP SWITCH] Handler Error: ${err.message}`);
  }
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`🌐 [HTTP] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Global State
let clients = [];
let db = null;
let binService = null;
let settlementEngine = null;
let fraudEngine = new FraudEngine();
const hsm = new CryptoLab();
const PORT = process.env.PORT || 3002;

// Global FX Market Ingestion Loop (30s interval)
setInterval(async () => {
  try {
     const rates = await FXAggregator.getAggregatedRates();
     broadcast('fx_tick', {
        timestamp: new Date().toISOString(),
        rates: rates
     });
     console.log(`📉 [MARKET] FX Aggregation Sync Complete. ${rates.length} corridors updated.`);
  } catch (err) {
     console.error('❌ [MARKET] FX Sync Failed:', err.message);
  }
}, 30000);

// Real-time Streaming
function broadcast(event, data) {
  if (clients.length > 0) {
    console.log(`📡 [SSE] Broadcasting '${event}' to ${clients.length} clients.`);
  }
  clients.forEach(client => {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) { /* ignore */ }
  });
}

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  const clientId = Date.now();
  clients.push({ id: clientId, res });
  
  // Heartbeat to keep ngrok/proxies alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  // Send initial welcome event
  res.write(`event: system_ready\n`);
  res.write(`data: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

  req.on('close', () => { 
    clearInterval(heartbeat);
    clients = clients.filter(c => c.id !== clientId); 
  });
});

// Broadcast periodic market intelligence for the Globe screen
setInterval(() => {
  const corridors = ['SAR_INR', 'SAR_PHP', 'SAR_PKR', 'SAR_EGP', 'SAR_USD', 'SAR_GBP'];
  const corridor = corridors[Math.floor(Math.random() * corridors.length)];
  const impacts = ['POSITIVE', 'NEUTRAL', 'INFO'];
  const messages = [
    `Liquidity surge detected in ${corridor} bridge.`,
    `Settlement window opening for ${corridor.split('_')[1]} network.`,
    `FX rate optimization complete for ${corridor}.`,
    `High-value transaction cleared through ${corridor} gateway.`,
    `Network latency stabilized in ${corridor} hop.`
  ];
  
  broadcast('market_update', {
    id: Date.now(),
    impact: impacts[Math.floor(Math.random() * impacts.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    corridor: corridor
  });
}, 12000);

// --- SYSTEM HANDSHAKE (INTERNAL LOGON) ---
async function triggerSystemHandshake() {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.connect(8583, '127.0.0.1', () => {
      const echoRequest = {
        mti: '0800',
        elements: {
          '007': new Date().toISOString().replace(/[-:T]/g, '').slice(4, 14),
          '011': Math.floor(100000 + Math.random() * 900000).toString(),
          '070': '301'
        }
      };
      client.write(Builder.pack(echoRequest));
    });

    client.on('data', data => {
      client.destroy();
      try {
        const decoded = Parser.unpack(data);
        resolve(decoded);
      } catch (e) { reject(e); }
    });
    client.on('error', reject);
  });
}

// --- PROMETHEUS METRICS ENGINE ---
const metrics = {
  tx_total: 0,
  tx_approved: 0,
  tx_declined: 0,
  tx_error: 0,
  start_time: Date.now()
};

app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  const uptime = (Date.now() - metrics.start_time) / 1000;
  
  let m = `# HELP payment_switch_transactions_total Total transactions processed\n`;
  m += `# TYPE payment_switch_transactions_total counter\n`;
  m += `payment_switch_transactions_total ${metrics.tx_total}\n\n`;
  
  m += `# HELP payment_switch_transactions_approved_total Total approved transactions\n`;
  m += `# TYPE payment_switch_transactions_approved_total counter\n`;
  m += `payment_switch_transactions_approved_total ${metrics.tx_approved}\n\n`;
  
  m += `# HELP payment_switch_transactions_declined_total Total declined transactions\n`;
  m += `# TYPE payment_switch_transactions_declined_total counter\n`;
  m += `payment_switch_transactions_declined_total ${metrics.tx_declined}\n\n`;

  m += `# HELP payment_switch_uptime_seconds Simulator uptime in seconds\n`;
  m += `# TYPE payment_switch_uptime_seconds gauge\n`;
  m += `payment_switch_uptime_seconds ${uptime}\n`;

  res.send(m);
});

// --- API ENDPOINTS ---
app.post('/api/system/logon', async (req, res) => {
  try {
    const result = await triggerSystemHandshake();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- SETTLEMENT ACCRUAL ANALYTICS ---
app.get('/api/v1/clearing/accruals', async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(tc_code, 'TC05') as tc, 
        COUNT(*) as count, 
        SUM(CAST(amount as FLOAT)) as total_amount,
        CASE 
          WHEN pan LIKE '9682%' THEN 'mada'
          ELSE 'Visa'
        END as scheme
      FROM transactions 
      GROUP BY tc, scheme
    `;
    if (!db) return res.status(503).json({ error: 'Local DB Initializing' });
    const rows = await db.all(query);
    
    const accruals = rows.map(row => ({
        tc: row.tc,
        scheme: row.scheme,
        count: row.count,
        amount: row.total_amount,
        currency: row.scheme === 'mada' ? 'SAR' : 'USD'
    }));

    // For Demo: If no TC06/TC15/TC40 exist, inject some mock data so the user sees the diff
    const demoCodes = ['TC06', 'TC15', 'TC40', 'TC07'];
    demoCodes.forEach(code => {
        if (!accruals.find(a => a.tc === code)) {
            accruals.push({
                tc: code,
                scheme: Math.random() > 0.5 ? 'mada' : 'Visa',
                count: Math.floor(Math.random() * 5),
                amount: Math.random() * 1000,
                currency: 'USD'
            });
        }
    });

    res.json({ success: true, accruals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- CLEARING & SETTLEMENT ---
app.get('/api/v1/clearing/visa', async (req, res) => {
  console.log('📡 [CLEARING] Received download request via V1 API');
  try {
    if (!db) return res.status(503).json({ error: 'Database Initializing' });
    const rawTransactions = await db.all(`SELECT amount, pan, rrn, stan, created_at as date FROM transactions WHERE mti = '0200' OR mti = '0100' LIMIT 100`);
    console.log(`📊 [CLEARING] Aggregating ${rawTransactions.length} transactions for BASE II synthesis.`);
    
    const transactions = rawTransactions.map((tx, idx) => ({
        ...tx,
        isChargeback: idx % 15 === 0,
        isRefund: idx % 12 === 1,
        isReversal: idx % 10 === 2,
        reasonCode: idx % 15 === 0 ? '10.4' : (idx % 10 === 2 ? 'REV1' : null)
    }));

    const fileContent = ClearingManager.generateVisaBatch(transactions);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=VISA_BASE2_CLEARING.txt');
    res.send(fileContent);
  } catch (err) {
    console.error('❌ [CLEARING ERROR]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { sql } = req.body;
    
    // 1. Prioritize Supabase (Cloud SQL)
    if (supabase) {
       console.log('🌐 [DATA EXPLORER] Executing Cloud SQL...');
       const { data, error } = await supabase.rpc('execute_sql', { query_text: sql }); // Requires a small RPC function in Supabase
       if (!error) return res.json({ success: true, source: 'supabase_cloud', results: data });
       // If RPC fails (e.g. not set up), fall back or show error
       console.warn('⚠️ [SUPABASE RPC] Failed, falling back to local metadata exploration.');
    }

    // 2. Fallback to Local SQLite
    if (!db) return res.status(503).json({ error: 'Local DB Initializing' });
    const results = await db.all(sql);
    res.json({ success: true, source: 'local_sqlite', results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CLOUD SYNC UTILITY ---
const syncToCloud = async (table, record) => {
  if (!supabase) return null;
  try {
    // Encrypt sensitive fields if this is a transaction or clearing log
    const syncRecord = { ...record };
    if ((table === 'transactions' || table === 'clearing_logs') && syncRecord.pan) {
       syncRecord.pan = CryptoLab.encryptVaultData(syncRecord.pan);
    }
    
    const { data, error } = await supabase.from(table).insert(syncRecord).select('id').single();
    if (error) console.error(`[CLOUD SYNC] Error in ${table}:`, error.message);
    return data ? data.id : null;
  } catch (err) {
    console.error(`[CLOUD SYNC] Fatal in ${table}:`, err.message);
    return null;
  }
};

// --- ENTERPRISE API V1 (WORLD STANDARD) ---

/**
 * @api {post} /api/v1/transactions Ingest & Process ISO Message
 * Dual-write to Local SQLite and Cloud Supabase
 */
// --- SHARED TRANSACTION HANDLER ---
async function handleTransaction(req, res) {
  const { mti, elements, type = 'ISO8583' } = req.body;
  try {
    console.log(`🔌 [API] Ingesting ${mti} transaction...`);
    const { rawRes, decodedRes } = await new Promise((resolve, reject) => {
       const tcpBuffer = Builder.pack({ mti, elements });
       const client = new net.Socket();
       
       const timeout = setTimeout(() => {
         client.destroy();
         reject(new Error('TCP Switch Timeout (5s)'));
       }, 5000);

       client.connect(8583, '127.0.0.1', () => client.write(tcpBuffer));
       
       client.on('data', data => { 
         clearTimeout(timeout);
         client.destroy(); 
         try {
            resolve({ rawRes: data, decodedRes: Parser.unpack(data) }); 
         } catch (e) { reject(e); }
       });
       
       client.on('error', err => {
         clearTimeout(timeout);
         reject(err);
       });
    });

    const procCode = elements['003'] || '000000';
    let tcCode = 'TC05'; // Default Purchase
    if (mti === '0420' || mti === '0400') tcCode = 'TC25';
    else if (procCode.startsWith('20')) tcCode = 'TC06';
    else if (procCode.startsWith('01')) tcCode = 'TC07';
    else if (mti === '0100' || mti === '0120') tcCode = 'TC33';

    const txRecord = {
       type: 'ISO8583',
       mti,
       tc_code: tcCode,
       pan: elements['002'] || '', // Full PAN for backend/sync
       pan_masked: (elements['002'] || '').replace(/^(\d{6})\d+(\d{4})$/, '$1******$2'), 
       proc_code: procCode, 
       amount: parseFloat(elements['004'] || '0') / 100,
       stan: elements['011'] || '',
       rrn: elements['037'] || '',
       resp_code: decodedRes.elements['039'] || 'XX',
       payload_json: { request: elements, response: decodedRes.elements },
       raw_payload: rawRes.toString('hex'),
       status: decodedRes.elements['039'] === '00' ? 'APPROVED' : 'DECLINED',
       created_at: new Date().toISOString()
    };

    const cloudId = await syncToCloud('transactions', txRecord);

    metrics.tx_total++;
    if (txRecord.status === 'APPROVED') metrics.tx_approved++;
    else metrics.tx_declined++;

    if (db) {
       await db.run(
         `INSERT INTO transactions (mti, tc_code, pan, amount, stan, rrn, resp_code, parsed_request, parsed_response) VALUES (?,?,?,?,?,?,?,?,?)`,
         [mti, txRecord.tc_code, CryptoLab.encryptVaultData(txRecord.pan), (elements['004'] || '0').toString(), txRecord.stan, txRecord.rrn, txRecord.resp_code, JSON.stringify(elements), JSON.stringify(decodedRes.elements)]
       );
    }

    broadcast('iso_log', { ...txRecord, cloud_id: cloudId });
    res.status(201).json({ success: true, cloud_id: cloudId, response: decodedRes, decoded: decodedRes, rawRx: txRecord.raw_payload });
  } catch (err) {
    console.error('❌ [TRANSACTION ERROR]:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

app.post('/api/v1/transactions', handleTransaction);
app.post('/api/transmit', handleTransaction);

/**
 * @api {post} /api/v1/cloud/query Cloud Intelligence Query Bridge
 * Allows Data Explorer to search Supabase Transactions
 */
app.post('/api/v1/cloud/query', async (req, res) => {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { table, filters, limit = 50 } = req.body;
    let query = supabase.from(table || 'transactions').select('*').order('created_at', { ascending: false }).limit(limit);

    if (filters) {
       Object.keys(filters).forEach(key => {
          if (filters[key]) query = query.ilike(key, `%${filters[key]}%`);
       });
    }

    const { data, error } = await query;
    if (error) throw error;
    
    res.json({ success: true, results: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/cloud/sql', async (req, res) => {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { sql } = req.body;
    console.log('🌐 [CLOUD SQL] Executing forensic query...');
    
    const { data, error } = await supabase.rpc('execute_sql', { query_text: sql });
    if (error) throw error;
    
    res.json({ success: true, results: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bin/:bin', async (req, res) => {
  try {
    if (!binService) return res.status(503).json({ error: 'Initializing' });
    const data = await binService.getBinDetails(req.params.bin);
    res.json(data);
  } catch (e) { res.status(404).json({ error: e.message }); }
});

app.put('/api/bin/:bin', async (req, res) => {
  try {
    if (!binService) return res.status(503).json({ error: 'Initializing' });
    const { adminPin, ...updateData } = req.body;
    if (adminPin !== '1234') return res.status(403).json({ error: 'Unauthorized' });
    const result = await binService.updateBin(req.params.bin, updateData);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bins/stats', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'Initializing' });
    const row = await db.get('SELECT COUNT(*) as count FROM bins');
    res.json({ success: true, count: row.count || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bins/sync/status', (req, res) => {
  res.json(BinService.syncStatus || { isSyncing: false, processed: 0, total: 0 });
});

app.get('/api/issuers', async (req, res) => {
  try {
    if (!binService) return res.status(503).json({ error: 'Initializing' });
    const issuers = await binService.getIssuers();
    res.json({ success: true, issuers });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bins/issuer/random', async (req, res) => {
  try {
    if (!binService) return res.status(503).json({ error: 'Initializing' });
    const limit = parseInt(req.query.limit) || 10;
    const bins = await binService.getRandomBins(limit);
    res.json({ success: true, bins });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/bins/issuer/:issuer', async (req, res) => {
  try {
    if (!binService) return res.status(503).json({ error: 'Initializing' });
    const bins = await binService.getBinsByIssuer(req.params.issuer);
    res.json({ success: true, bins });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/bins/import-csv', async (req, res) => {
  try {
    const result = await importBinsFromCsv();
    res.json({ success: true, ...result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- CLOUD TEST CARD VAULT SYNC ---
app.get('/api/v1/vault/cards', async (req, res) => {
  try {
    // Graceful fallback if Supabase is not configured
    if (!supabase) {
      return res.json({ success: true, cards: [], source: 'offline' });
    }

    const { data, error } = await supabase
      .from('test_cards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Decrypt sensitive fields for the UI
    const decryptedCards = (data || []).map(c => {
      try {
        return {
          ...c,
          pan: CryptoLab.decryptVaultData(c.pan),
          cvv: CryptoLab.decryptVaultData(c.cvv),
          track2: CryptoLab.decryptVaultData(c.track2)
        };
      } catch (decryptErr) {
        // Skip cards with corrupt encryption rather than crashing
        console.warn(`[Vault] Skipping card with decrypt error: ${decryptErr.message}`);
        return null;
      }
    }).filter(Boolean); // Remove nulls from decrypt failures

    res.json({ success: true, cards: decryptedCards });
  } catch (err) {
    console.error('[Vault GET] Error:', err.message);
    // Return empty array so UI dropdown renders without error
    res.json({ success: true, cards: [], error: err.message });
  }
});

app.post('/api/v1/vault/cards', async (req, res) => {
  try {
    if (!supabase) throw new Error('Supabase not configured');
    const { card } = req.body;
    
    const dbRecord = {
      pan: CryptoLab.encryptVaultData(card.pan),
      bin: card.bin || card.pan.substring(0, 6),
      exp: card.exp,
      cvv: CryptoLab.encryptVaultData(card.cvv),
      scheme: card.network,
      type: card.type,
      issuer_name: card.issuer,
      scenario: card.scenario,
      cashback: parseFloat(card.cashback || 0),
      amount: parseFloat(card.amount || 0),
      mti: card.mti,
      track2: CryptoLab.encryptVaultData(card.track2)
    };

    const { data, error } = await supabase
      .from('test_cards')
      .upsert(dbRecord, { onConflict: 'pan' })
      .select();

    if (error) throw error;
    res.json({ success: true, card: data[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/bins/cloud/search', async (req, res) => {
  console.log(`🌐 [API] Cloud Search Request: ${JSON.stringify(req.query)}`);
  try {
    if (!binService) {
      console.warn('⚠️ [API] binService not initialized yet');
      return res.status(503).json({ error: 'Initializing' });
    }
    const results = await binService.searchBins(req.query);
    console.log(`✅ [API] Cloud Search Success: ${results.length} records found`);
    res.json({ success: true, results });
  } catch (e) { 
    console.error(`❌ [API] Cloud Search Fatal: ${e.message}`);
    res.status(500).json({ error: e.message }); 
  }
});

app.get('/api/v1/clearing/visa', async (req, res) => {
  try {
    if (!supabase) return res.status(503).send('Supabase Offline');

    // 1. Fetch encrypted logs from Cloud
    const { data, error } = await supabase
      .from('clearing_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).send('No clearing records found in Cloud Ledger.');
    }

    const records = [];
    const pad = (s, l) => (s || '').toString().padEnd(l, ' ');
    const num = (n, l) => Math.round(parseFloat(n || 0) * 100).toString().padStart(l, '0');

    // Header Record (TCR90)
    records.push(pad(`90 ${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`, 168));

    let totalAmount = 0;
    
    // Process Data Records (TCR0)
    data.forEach(log => {
      // Decrypt PAN for the clearing file
      const plainPan = CryptoLab.decryptVaultData(log.pan);
      const amount = parseFloat(log.settled_amount || 0);
      totalAmount += amount;

      // TCR0 Construction (Standard Visa Base II Format)
      // Transaction Code (2) + PAN (16) + Amount (12) + CCY (3) + etc...
      const tcr0 = `05` + 
                   pad(plainPan, 16) + 
                   num(amount, 12) + 
                   pad(log.settled_ccy || '682', 3) + 
                   pad(log.auth_code || '000000', 6) +
                   pad(log.rrn || '', 12) +
                   pad(log.proc_code || '000000', 6);
      
      records.push(pad(tcr0, 168));
    });

    // Trailer Record (TCR92)
    const trailer = `92 ` + 
                    num(data.length, 9) + 
                    num(totalAmount, 15) + 
                    pad('682', 3);
    records.push(pad(trailer, 168));

    console.log(`✅ [CLEARING] Generated Visa Base II file with ${data.length} records.`);
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=VISA_BASE2_RECON_${new Date().toISOString().split('T')[0]}.txt`);
    res.send(records.join('\r\n')); // CRLF for mainframes
  } catch (err) {
    console.error('❌ [API] Visa Generation Failed:', err.message);
    res.status(500).send('Generation failed: ' + err.message);
  }
});

app.get('/api/v1/clearing/accruals', async (req, res) => {
  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase Offline' });

    // Aggregating from Cloud Ledger
    const { data, error } = await supabase
      .from('clearing_logs')
      .select('tx_type, settled_amount, settled_ccy, scheme');

    if (error) throw error;

    const accruals = data.reduce((acc, r) => {
      const key = `${r.tx_type}-${r.scheme}`;
      if (!acc[key]) {
        acc[key] = { tc: r.tx_type, scheme: r.scheme, count: 0, amount: 0, currency: r.settled_ccy };
      }
      acc[key].count += 1;
      acc[key].amount += parseFloat(r.settled_amount);
      return acc;
    }, {});

    res.json({ success: true, accruals: Object.values(accruals) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/clearing/stage', async (req, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid batch data' });
  }

  console.log(`🏦 [CLOUD_STAGE] Staging ${records.length} records to Supabase Ledger...`);

  try {
    if (!supabase) {
      throw new Error('Supabase Client not initialized');
    }

    // Map records to Supabase Schema
    const stagedData = records.map(r => ({
      tx_type: r.txType,
      pan: r.pan,
      orig_amount: r.origAmount,
      orig_ccy: r.origCcy,
      settled_amount: r.settledAmount,
      settled_ccy: r.settledCcy,
      fx_rate: r.fxRate,
      interchange: r.interchange,
      merchant_id: r.merchantId,
      merchant_name: r.merchantName,
      merchant_city: r.merchantCity,
      mcc: r.mcc,
      rrn: r.rrn,
      visa_fee: r.visaFee,
      bank_margin: r.bankMargin,
      scheme: r.scheme || 'Visa'
    }));

    const { data, error } = await supabase
      .from('clearing_logs')
      .insert(stagedData);

    if (error) {
      console.error('⚠️ [CLOUD_STAGE] Supabase error:', error.message);
      return res.status(500).json({ 
        error: 'Cloud Ledger Mismatch', 
        details: error.message 
      });
    }

    res.json({ success: true, stagedCount: stagedData.length });
  } catch (err) {
    console.error('❌ [CLOUD_STAGE] Fatal Exception:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- LOAD TESTING ENGINE ---
app.post('/api/load-test/start', async (req, res) => {
  try {
    const { tps, duration, cards } = req.body;
    console.log(`🚀 [LOAD TEST] Starting: ${tps} TPS for ${duration}s`);
    
    // Archive Module Parameters
    const opRecord = { 
      module_name: 'LOAD_TEST_ENGINE', 
      operation_type: 'BATCH_START', 
      parameters_json: { tps, duration, cardCount: cards?.length } 
    };
    await syncToCloud('module_operations', opRecord);
    
    if (db) {
      await db.run(
        `INSERT INTO module_parameters (module_name, operation_type, parameters_json) VALUES (?, ?, ?)`,
        [opRecord.module_name, opRecord.operation_type, JSON.stringify(opRecord.parameters_json)]
      );
    }
    
    // Simple background simulation that broadcasts to the SSE stream
    let count = 0;
    const total = tps * duration;
    
    const interval = setInterval(() => {
      for (let i = 0; i < tps; i++) {
        if (count >= total) {
          clearInterval(interval);
          return;
        }
        
        const card = cards[Math.floor(Math.random() * cards.length)] || { pan: '4111222233334444' };
        broadcast('iso_log', {
          id: `LT-${Date.now()}-${count}`,
          mti: '0100',
          resp_code: '00',
          amount: Math.floor(Math.random() * 500),
          status: 'APPROVED',
          is_load_test: true
        });
        count++;
      }
    }, 1000);

    res.json({ success: true, totalTarget: total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ISO 20022 & XML ENDPOINTS ---
app.post('/api/transmit/xml', async (req, res) => {
  try {
    const { xmlPayload, tcpConfig } = req.body;
    if (!xmlPayload) return res.status(400).json({ error: 'Missing XML' });
    const config = tcpConfig || { host: '127.0.0.1', port: 8583 };
    
    const { rawRx } = await new Promise((resolve, reject) => {
      const client = new net.Socket();
      client.connect(config.port, config.host, () => { client.write(xmlPayload); });
      client.on('data', (data) => {
        client.destroy();
        resolve({ rawRx: data.toString() });
      });
      client.on('error', (e) => reject(e));
    });

    // Cloud Sync XML Transaction
    const txRecord = {
      type: 'ISO20022',
      mti: 'MX',
      msg_id: req.body.metadata?.uetr || 'XML-' + Date.now(),
      pan: (req.body.metadata?.senderBic || 'XML-SND').slice(-4),
      proc_code: req.body.metadata?.procCode || '000000',
      amount: parseFloat(req.body.metadata?.amount || '0') / 100,
      currency: req.body.metadata?.currency || 'SAR',
      raw_payload: xmlPayload,
      payload_json: { response: rawRx, metadata: req.body.metadata },
      status: 'SETTLED',
      created_at: new Date().toISOString()
    };
    const cloudId = await syncToCloud('transactions', txRecord);

    // Update Prometheus Metrics
    metrics.tx_total++;
    metrics.tx_approved++; // XML transmitted is treated as approved in this context

    broadcast('iso_log', { ...txRecord, cloud_id: cloudId });

    res.json({ success: true, cloudId, rawRx });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REMITTANCE & INTELLIGENCE ---
app.get('/api/remittance/compare', async (req, res) => {
  try {
    const { corridor, amount } = req.query;
    const results = await RemittanceService.compareRates(corridor || 'SAR_INR', parseFloat(amount) || 1000);
    const recommendation = await RemittanceService.getSmartRecommendation(corridor || 'SAR_INR', parseFloat(amount) || 1000);
    
    // Archive Module Parameters (Input + AI Result)
    const opRecord = {
      module_name: 'REMITTANCE_INTEL',
      operation_type: 'RATE_COMPARISON',
      parameters_json: { 
        input: { corridor, amount },
        recommendation: recommendation.provider,
        fx_rate: recommendation.fx_rate,
        score: recommendation.score
      }
    };
    await syncToCloud('module_operations', opRecord);

    if (db) {
      await db.run(
        `INSERT INTO module_parameters (module_name, operation_type, parameters_json) VALUES (?, ?, ?)`,
        [opRecord.module_name, opRecord.operation_type, JSON.stringify(opRecord.parameters_json)]
      );
    }

    res.json({ success: true, results, recommendation });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// --- AUDIT & LOGS ---
app.get('/api/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    // 1. Prioritize Supabase Retrieval (Live Enterprise Logs)
    if (supabase) {
       const { data, error } = await supabase
         .from('transactions')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(limit);
       
       if (!error && data) {
         return res.json({ success: true, source: 'supabase_cloud', logs: data });
       }
       console.warn('⚠️ [SUPABASE] Log fetch failed, falling back to local buffer.');
    }

    // 2. Fallback to Local SQLite Buffer
    if (!db) return res.status(503).json({ error: 'Database Initializing' });
    const logs = await db.all(`SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?`, [limit]);
    const safeLogs = logs.map(l => {
      let reqObj = {}, resObj = {};
      try { reqObj = JSON.parse(l.parsed_request || '{}'); } catch(e) {}
      try { resObj = JSON.parse(l.parsed_response || '{}'); } catch(e) {}
      return { ...l, parsed_request: reqObj, parsed_response: resObj };
    });
    res.json({ success: true, source: 'local_sqlite', logs: safeLogs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HSM & CRYPTO ---
app.post('/api/crypto/key-exchange', async (req, res) => {
  try {
    const newKey = hsm.generateSessionKey();
    
    // Archive Module Parameters (Security Audit)
    if (db) {
      await db.run(
        `INSERT INTO module_parameters (module_name, operation_type, parameters_json) VALUES (?, ?, ?)`,
        ['CRYPTO_LAB', 'KEY_EXCHANGE', JSON.stringify({ 
          keyType: 'SESSION', 
          algorithm: 'AES-256',
          key_id: newKey.toString('hex').substring(0, 8) + '...'
        })]
      );
    }

    res.json({ success: true, newKey: newKey.toString('hex').toUpperCase() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PAYMENT GATEWAY API (MOYASAR STYLE) ---
app.post('/api/v1/payments', async (req, res) => {
  try {
    const { amount, currency, source, description, metadata, callback_url } = req.body;
    
    // 1. Fraud Analysis
    const riskAnalysis = fraudEngine.analyzeTransaction(req.body);
    if (riskAnalysis.decision === 'BLOCK') {
      return res.status(403).json({
        id: `pay_${Math.random().toString(36).substr(2, 9)}`,
        status: 'failed',
        failure_reason: 'fraud_blocked',
        risk_score: riskAnalysis.score,
        reason: riskAnalysis.reason
      });
    }

    const id = `pay_${Math.random().toString(36).substr(2, 9)}`;
    
    // Auto-detect brand from card number
    const pan = source?.number || '';
    const isMada = pan.startsWith('5888') || pan.startsWith('9682') || pan.startsWith('4408');
    const brand = isMada ? 'mada' : (pan.startsWith('4') ? 'Visa' : 'Mastercard');
    
    const status = amount > 1000000 ? 'failed' : 'initiated'; 
    const stan = Math.floor(100000 + Math.random() * 900000).toString();
    const rrn = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    
    const payment = {
      id,
      amount,
      currency,
      status: status === 'initiated' ? 'captured' : 'failed', // Auto-capture for simplicity in demo
      transaction_type: 'PURCHASE',
      stan,
      rrn,
      card_brand: brand,
      description,
      callback_url,
      created_at: new Date().toISOString()
    };

    if (db) {
      await db.run(
        `INSERT INTO payments (id, amount, currency, status, transaction_type, stan, rrn, card_brand, description, callback_url, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, amount, currency, payment.status, 'PURCHASE', stan, rrn, brand, description, callback_url, JSON.stringify(metadata || {})]
      );
    }

    // Simulate Webhook delivery after 2 seconds
    if (callback_url) {
      setTimeout(async () => {
        console.log(`📡 [WEBHOOK] Sending 'payment.captured' to ${callback_url}...`);
        broadcast('webhook_sent', {
          id: `wh_${Math.random().toString(36).substr(2, 9)}`,
          url: callback_url,
          event: 'payment.captured',
          data: payment
        });
      }, 2000);
    }

    broadcast('payment_created', payment);
    res.json(payment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/payments/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not ready' });
    const payment = await db.get(`SELECT * FROM payments WHERE id = ?`, [req.params.id]);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/payments/:id/capture', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not ready' });
    await db.run(`UPDATE payments SET status = 'captured' WHERE id = ?`, [req.params.id]);
    res.json({ success: true, status: 'captured' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/payments/:id/refund', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not ready' });
    await db.run(`UPDATE payments SET status = 'refunded' WHERE id = ?`, [req.params.id]);
    res.json({ success: true, status: 'refunded' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/payments/:id/void', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not ready' });
    await db.run(`UPDATE payments SET status = 'voided' WHERE id = ?`, [req.params.id]);
    res.json({ success: true, status: 'voided' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 3DS2 PROTOCOL API (DS & ACS) ---
app.post('/api/v1/3ds/lookup', async (req, res) => {
  try {
    const { pan } = req.body;
    const result = DSEngine.lookupEnrollment(pan);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/3ds/authenticate', async (req, res) => {
  try {
    const { amount, pan, forceChallenge } = req.body;
    const riskScore = ACSEngine.calculateRiskScore({ amount });
    const flow = ACSEngine.decideFlow(riskScore, forceChallenge);
    const otp = ACSEngine.generateOtp();
    
    res.json({
      threeDSServerTransID: `3ds-${Math.random().toString(36).substr(2, 9)}`,
      riskScore,
      flow,
      otp: flow === 'CHALLENGE' ? otp : null,
      eci: flow === 'FRICTIONLESS' ? '05' : '05', // Mock ECI
      transStatus: flow === 'FRICTIONLESS' ? 'Y' : 'C'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- CLEARING & SETTLEMENT ENGINE ---
app.get('/api/v1/clearing/accruals', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not ready' });
    
    // Aggregate approved transactions from the last 24h
    const rows = await db.all(`
      SELECT mti, resp_code, COUNT(*) as count, SUM(CAST(amount AS INTEGER)) as total_raw
      FROM transactions 
      WHERE resp_code = '00' 
      GROUP BY mti
    `);

    const accruals = rows.map(r => ({
      tc: r.mti === '0200' || r.mti === '0100' ? 'TC05' : 'TC15',
      scheme: 'mada', // Defaulting to mada for local transactions
      count: r.count,
      amount: r.total_raw / 100,
      currency: 'SAR'
    }));

    res.json({ success: true, accruals });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/clearing/visa', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not ready' });
    
    const rows = await db.all("SELECT * FROM transactions WHERE resp_code = '00' LIMIT 50");
    
    // Generate 168-byte fixed-width Base II content
    let content = "";
    rows.forEach(row => {
      const tc = "05";
      const pan = (row.pan || "").padEnd(16, ' ');
      const amount = (row.amount || "0").padStart(12, '0');
      const curr = "682";
      const rrn = (row.rrn || "").padEnd(12, ' ');
      const name = "FINTECH SIMULATOR".padEnd(25, ' ');
      
      // 168-byte record construction
      let line = tc + " ".repeat(2) + pan + amount + curr + " ".repeat(100);
      line = line.substring(0, 168);
      content += line + "\n";
    });

    res.header('Content-Type', 'text/plain');
    res.send(content || "90 HEADER RECORD\n91 TRAILER RECORD");
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v1/clearing/stage', async (req, res) => {
  try {
    const { records } = req.body;
    if (supabase) {
      const { error } = await supabase.from('clearing_logs').insert(records.map(r => ({
        tc: r.txType,
        pan: r.pan,
        amount: r.settledAmount,
        currency: r.settledCcy,
        merchant: r.merchantName
      })));
      if (error) throw error;
    }
    res.json({ success: true, stagedCount: records.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TOKENIZATION SYSTEM (PAN VAULTING) ---
app.post('/api/v1/tokens', async (req, res) => {
  try {
    const { number, month, year, name, customer_id } = req.body;
    if (!number) return res.status(400).json({ error: 'Card number required' });

    const isMada = number.startsWith('5888') || number.startsWith('9682') || number.startsWith('4408');
    const scheme = isMada ? 'mada' : (number.startsWith('4') ? 'Visa' : 'Mastercard');
    const tokenId = `tok_${isMada ? 'mada_' : ''}${Math.random().toString(36).substr(2, 9)}`;
    const masked = `${number.substring(0, 6)}${'*'.repeat(number.length - 10)}${number.slice(-4)}`;
    
    // Encrypt real PAN for vaulting
    const encrypted = CryptoLab.encryptVaultData(number);

    if (db) {
      await db.run(
        `INSERT INTO tokens (id, token, customer_id, masked_pan, encrypted_pan, expiry_month, expiry_year, scheme, cardholder_name) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tokenId, tokenId, customer_id || 'guest', masked, encrypted, month, year, scheme, name]
      );
    }

    res.json({
      token: tokenId,
      masked_pan: masked,
      scheme: scheme.toUpperCase(),
      created_at: new Date().toISOString()
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/tokens/:token', async (req, res) => {
  try {
    if (!db) return res.status(503).json({ error: 'DB not ready' });
    const row = await db.get(`SELECT * FROM tokens WHERE token = ?`, [req.params.token]);
    if (!row) return res.status(404).json({ error: 'Token not found' });
    
    res.json({
      token: row.token,
      masked_pan: row.masked_pan,
      scheme: row.scheme,
      status: row.status,
      created_at: row.created_at
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SETTLEMENT & PAYOUT ENGINE ---
app.post('/api/v1/settlement/close-batch', async (req, res) => {
  try {
    if (!settlementEngine) return res.status(503).json({ error: 'Settlement Engine not ready' });
    const result = await settlementEngine.processEndOfDay();
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/v1/settlement/reports', async (req, res) => {
  try {
    if (!settlementEngine) return res.status(503).json({ error: 'Settlement Engine not ready' });
    const reports = await settlementEngine.getSettlementReport();
    res.json({ success: true, reports });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), db: !!db });
});

// Final fallback for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function startServer() {
  try {
    console.log('🏁 [STARTUP] Phase 1: Initiating Engine...');
    
    // Explicit error listener for the app
    const server = app.listen(PORT, '0.0.0.0', async () => {
      console.log(`✅ [STARTUP] Phase 2: API Server bound to Port ${PORT}`);
      
      try {
        console.log('📂 [STARTUP] Phase 3: Connecting to SQLite (bins.sqlite)...');
        db = await setupDatabase();
        console.log('✅ [STARTUP] SQLite Connection Established.');

        console.log('👤 [STARTUP] Phase 4: Initializing BIN Intelligence Service...');
        binService = new BinService(db);
        console.log('✅ [STARTUP] BIN Service Ready.');

        console.log('💰 [STARTUP] Phase 5: Initializing Settlement & Payout Engine...');
        settlementEngine = new SettlementEngine(db);
        console.log('✅ [STARTUP] Settlement Engine Active.');
        
        // Isolated Supabase Diagnostic (Prevents Main Process Crash)
        if (supabase) {
          (async () => {
            try {
              // Standard select without invalid .timeout()
              const { count, error } = await supabase.from('bins').select('count', { count: 'exact', head: true });
              if (error) console.error('⚠️ [SUPABASE] Reachable but reported error:', error.message);
              else console.log(`✅ [SUPABASE] Connection healthy. ${count} records online.`);
            } catch (diagErr) {
              console.error('⚠️ [SUPABASE] Background check timed out or failed. Local operations will continue.');
            }
          })();
        }
        
        console.log('🔌 [STARTUP] Phase 5: Starting ISO 8583 TCP Switch (Port 8583)...');
        try { 
           startTcpSwitch(broadcast); 
           console.log('✅ [STARTUP] TCP Switch Listener Active.');
        } catch (e) { 
           console.error('❌ [STARTUP] TCP Switch Failed:', e.message); 
        }

        console.log('🚀 [STARTUP] ALL SYSTEMS OPERATIONAL.');
      } catch (dbErr) {
        console.error('❌ [STARTUP] DB/SERVICE INITIALIZATION FAILED:', dbErr.message);
      }
    });

    server.on('error', (err) => {
      console.error('❌ [STARTUP] EXPRESS SERVER ERROR:', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`   PORT ${PORT} IS ALREADY IN USE. PLEASE KILL THE OTHER PROCESS.`);
      }
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ [STARTUP] FATAL BOOT EXCEPTION:', err.message);
    process.exit(1);
  }
}

// Hardening against runtime crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('☢️ [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('☢️ [CRITICAL] Uncaught Exception thrown:', err);
});

startServer();
