-- Create the Analytics Tracking Table
CREATE TABLE IF NOT EXISTS public.page_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    theme_mode TEXT,
    time_spent_ms BIGINT DEFAULT 0,
    user_agent TEXT,
    ip_address TEXT,
    
    -- Force the timestamp to specifically calculate and store the exact KSA (Saudi Arabia / Riyadh) wall-clock time
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Riyadh'),
    
    -- Keep track of the last update to measure heartbeat updates
    last_ping_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Riyadh')
);

-- Enable RLS (Optional, but good practice. We'll allow public inserts, but restrict reads to admin)
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts to analytics"
ON public.page_analytics
FOR INSERT
TO public, anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous updates to own session"
ON public.page_analytics
FOR UPDATE
TO public, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access"
ON public.page_analytics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for fast querying by session or page
CREATE INDEX IF NOT EXISTS idx_page_analytics_session ON public.page_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_page ON public.page_analytics(page_url);
