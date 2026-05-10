-- ================================================================
-- ADDENDUM — Run in Supabase SQL Editor AFTER the main schema
-- Fixes: "Could not persist to fx_history table" warning
-- ================================================================

-- 7. FX Rate History (matches fxAggregator.js persistToHistory columns exactly)
-- Inserts: { pair, rate, provider, spread_pct }
-- ================================================================
CREATE TABLE IF NOT EXISTS fx_history (
    id          UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMPTZ    DEFAULT NOW(),
    pair        VARCHAR(10)    NOT NULL,
    rate        DECIMAL(18,8)  NOT NULL,
    provider    VARCHAR(100),
    spread_pct  DECIMAL(10,6)  DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_fx_history_created_at ON fx_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fx_history_pair ON fx_history(pair);

-- 8. Host Connections
CREATE TABLE IF NOT EXISTS host_connections (
    id        UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
    host      VARCHAR(255)  NOT NULL,
    port      INTEGER       NOT NULL,
    status    VARCHAR(20)   DEFAULT 'unknown',
    last_echo TIMESTAMPTZ   DEFAULT NOW(),
    UNIQUE(host, port)
);

-- 9. Network Logs
CREATE TABLE IF NOT EXISTS network_logs (
    id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    message_type VARCHAR(20),
    direction    VARCHAR(10),
    raw_data     TEXT
);
CREATE INDEX IF NOT EXISTS idx_network_logs_created_at ON network_logs(created_at DESC);

-- ================================================================
-- Row Level Security — anon key (browser) read + insert access
-- ================================================================
ALTER TABLE fx_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearing_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso20022_audit   ENABLE ROW LEVEL SECURITY;

-- Read (anon can read all for dashboard)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fx_history' AND policyname='anon_read_fx') THEN
    CREATE POLICY anon_read_fx       ON fx_history        FOR SELECT USING (true);
    CREATE POLICY anon_read_hosts    ON host_connections  FOR SELECT USING (true);
    CREATE POLICY anon_read_netlogs  ON network_logs      FOR SELECT USING (true);
    CREATE POLICY anon_read_tx       ON transactions      FOR SELECT USING (true);
    CREATE POLICY anon_read_cards    ON test_cards        FOR SELECT USING (true);
    CREATE POLICY anon_read_clearing ON clearing_logs     FOR SELECT USING (true);
    CREATE POLICY anon_read_iso      ON iso20022_audit    FOR SELECT USING (true);
    CREATE POLICY anon_insert_cards  ON test_cards        FOR INSERT WITH CHECK (true);
    CREATE POLICY anon_insert_tx     ON transactions      FOR INSERT WITH CHECK (true);
    CREATE POLICY anon_insert_iso    ON iso20022_audit    FOR INSERT WITH CHECK (true);
    CREATE POLICY anon_insert_fx     ON fx_history        FOR INSERT WITH CHECK (true);
  END IF;
END $$;
