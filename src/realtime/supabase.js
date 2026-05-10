/**
 * src/realtime/supabase.js
 * Enterprise Real-time Data Vault for Transaction Ledgers & Monitoring.
 *
 * FIX: Supabase realtime "Unauthorized" error caused by using the
 * service_role key in the browser. The service_role key is SERVER-ONLY.
 * The browser must use the anon key (VITE_SUPABASE_ANON_KEY).
 *
 * To get your anon key:
 *   1. Go to https://supabase.com/dashboard/project/<your-project>/settings/api
 *   2. Copy the "anon public" key (NOT service_role)
 *   3. Set VITE_SUPABASE_ANON_KEY=<anon key> in your .env
 *   4. Keep SUPABASE_KEY=<service_role key> for the server only
 */
import { createClient } from '@supabase/supabase-js';

// This file is imported by BOTH:
//   - Browser (Vite): import.meta.env is available, use VITE_ prefixed vars
//   - Node.js (src/tcp/server.js): import.meta.env is undefined, use process.env
const isNode = typeof process !== 'undefined' && process.versions?.node;

const supabaseUrl = isNode
  ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
  : (import.meta.env?.VITE_SUPABASE_URL || '');

const supabaseKey = isNode
  ? (process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '')
  : (import.meta.env?.VITE_SUPABASE_ANON_KEY || '');

// Detect if service_role key was accidentally used as the browser anon key.
// Only warn in browser context — server is allowed to use service_role.
const _detectKeyRole = (jwt) => {
  try { return JSON.parse(atob(jwt.split('.')[1]))?.role || 'unknown'; }
  catch { return 'unknown'; }
};

const keyRole = supabaseKey ? _detectKeyRole(supabaseKey) : 'missing';
const isServiceRole = keyRole === 'service_role';

if (!isNode && isServiceRole) {
  console.error(
    '🔴 [SUPABASE] CRITICAL CONFIG ERROR\n' +
    'VITE_SUPABASE_ANON_KEY is set to the SERVICE_ROLE key.\n' +
    'Browser realtime WebSocket will be rejected with "Unauthorized".\n\n' +
    'Fix: Set VITE_SUPABASE_ANON_KEY=<anon key> in .env\n' +
    'Dashboard → https://supabase.com/dashboard → Settings → API'
  );
}

// Browser: reject service_role key (causes realtime Unauthorized)
// Server: allow any key (service_role is correct for server-side)
const canInit = supabaseUrl && supabaseKey && (isNode || !isServiceRole);

export const supabase = canInit
  ? createClient(supabaseUrl, supabaseKey, {
      realtime: isNode ? { timeout: 5000 } : { params: { eventsPerSecond: 10 } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (!supabase) {
  const ctx = isNode ? '[Server/TCP]' : '[Browser]';
  if (!isNode && isServiceRole) {
    // already logged above
  } else {
    console.warn(`⚠️ [SUPABASE] ${ctx} client not initialized: Missing URL or KEY in .env`);
  }
} else {
  const ctx = isNode ? 'Server/TCP (service_role)' : 'Browser (anon key)';
  console.log(`🚀 [SUPABASE] ${ctx} client initialized ✓`);
}


export class RealtimeVault {
    static async logTransaction(record) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('transactions')
            .insert({
                mti: record.mti,
                stan: record.stan,
                rrn: record.rrn,
                amount: record.amount,
                response_code: record.resp_code,
                raw_iso: record.raw_payload,
                status: record.status,
                type: record.type || 'ISO8583'
            })
            .select('id')
            .single();
        
        if (error) console.error('❌ [VAULT] Sync Error:', error.message);
        return data?.id;
    }

    static async updateHostStatus(host, port, status) {
        if (!supabase) return;
        await supabase
            .from('host_connections')
            .upsert({
                host,
                port,
                status,
                last_echo: new Date().toISOString()
            }, { onConflict: 'host,port' });
    }

    static async logNetworkEvent(type, direction, data) {
        if (!supabase) return;
        await supabase
            .from('network_logs')
            .insert({ message_type: type, direction, raw_data: data });
    }
}
