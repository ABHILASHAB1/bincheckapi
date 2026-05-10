-- ================================================================
-- ISO 8583 Simulator — Supabase BIN Database (Full Schema)
-- Run this entire file in your Supabase SQL Editor
-- ================================================================

-- 1. ISO 20022 Audit Log Table
-- ================================================================
CREATE TABLE IF NOT EXISTS iso20022_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    request_xml TEXT NOT NULL,
    response_xml TEXT,
    host VARCHAR(255) NOT NULL,
    port VARCHAR(10) NOT NULL,
    tls_enabled BOOLEAN DEFAULT FALSE,
    latency_ms INTEGER,
    status VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS idx_iso_audit_created_at ON iso20022_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iso_audit_status ON iso20022_audit(status);


-- 2. Clearing Logs (Visa BASE II / Settlement)
-- ================================================================
CREATE TABLE IF NOT EXISTS clearing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tx_type VARCHAR(10),
    pan VARCHAR(20),
    orig_amount DECIMAL(18, 2),
    orig_ccy VARCHAR(3),
    settled_amount DECIMAL(18, 2),
    settled_ccy VARCHAR(3),
    fx_rate DECIMAL(18, 6),
    interchange DECIMAL(18, 6),
    merchant_id VARCHAR(50),
    merchant_name VARCHAR(100),
    merchant_city VARCHAR(50),
    mcc VARCHAR(4),
    rrn VARCHAR(12),
    visa_fee DECIMAL(18, 4),
    bank_margin DECIMAL(18, 4),
    scheme VARCHAR(20)
);
CREATE INDEX IF NOT EXISTS idx_clearing_created_at ON clearing_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clearing_rrn ON clearing_logs(rrn);


-- 3. ISO 8583 Transaction Logs (Dual-Sync)
-- ================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    mti VARCHAR(4),
    pan VARCHAR(20),
    amount DECIMAL(18, 2),
    resp_code VARCHAR(2),
    stan VARCHAR(6),
    rrn VARCHAR(12),
    proc_code VARCHAR(6),
    pos_entry VARCHAR(3),
    parsed_request JSONB,
    parsed_response JSONB,
    risk_score INTEGER,
    status VARCHAR(20)
);
CREATE INDEX IF NOT EXISTS idx_tx_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_rrn ON transactions(rrn);


-- 4. BIN Database Table (Rich Schema)
-- ================================================================
CREATE TABLE IF NOT EXISTS bins (
    id            BIGSERIAL PRIMARY KEY,
    bin           TEXT        UNIQUE NOT NULL,
    bin_length    INTEGER     DEFAULT 6,
    scheme        TEXT,
    type          TEXT,
    category      TEXT,
    sub_brand     TEXT,
    prepaid       BOOLEAN     DEFAULT FALSE,
    pan_length    INTEGER     DEFAULT 16,
    luhn_valid    BOOLEAN     DEFAULT TRUE,
    issuer        TEXT,
    bank_url      TEXT,
    bank_phone    TEXT,
    bank_city     TEXT,
    country_name  TEXT,
    country_code  TEXT,
    currency      TEXT,
    region        TEXT,
    source        TEXT        DEFAULT 'LOCAL',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    search_vector TSVECTOR
);
CREATE INDEX IF NOT EXISTS idx_bins_bin ON bins(bin);


-- 5. Utility: SQL Execution RPC (For Data Explorer)
-- ================================================================
CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    EXECUTE 'SELECT jsonb_agg(t) FROM (' || query_text || ') t' INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- 6. Test Card Vault (Cloud Persistence)
-- ================================================================
CREATE TABLE IF NOT EXISTS test_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    pan VARCHAR(20) UNIQUE NOT NULL,
    bin VARCHAR(8),
    exp VARCHAR(5),
    cvv VARCHAR(4),
    scheme VARCHAR(20),
    type VARCHAR(20),
    issuer_name TEXT,
    scenario TEXT,
    cashback DECIMAL(18, 2) DEFAULT 0.00,
    amount DECIMAL(18, 2) DEFAULT 50.00,
    mti VARCHAR(4) DEFAULT '0100',
    track2 TEXT,
    is_favorite BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_test_cards_issuer ON test_cards(issuer_name);
CREATE INDEX IF NOT EXISTS idx_test_cards_pan ON test_cards(pan);

