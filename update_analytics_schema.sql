-- Run this script in your Supabase SQL Editor to add the IP Address column
ALTER TABLE public.page_analytics
ADD COLUMN IF NOT EXISTS ip_address TEXT;
