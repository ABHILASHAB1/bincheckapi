CREATE TABLE IF NOT EXISTS public.saudi_fx_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NOT NULL,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    target_currency VARCHAR(3) NOT NULL,
    buy_rate DECIMAL(15, 6),
    sell_rate DECIMAL(15, 6),
    transfer_type VARCHAR(100) DEFAULT 'International Remittance',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_key DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Constraint to allow safe upserting of daily rates
    CONSTRAINT unique_bank_currency_date UNIQUE (bank_name, target_currency, date_key)
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE public.saudi_fx_rates ENABLE ROW LEVEL SECURITY;

-- Create an index to optimize dashboard querying
CREATE INDEX idx_fx_rates_currency ON public.saudi_fx_rates(target_currency, timestamp DESC);
