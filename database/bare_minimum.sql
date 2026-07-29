-- Absolute minimal setup - just radio_stations table
-- No foreign keys, no constraints, just the basics

CREATE TABLE IF NOT EXISTS public.radio_stations (
    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcaster_id UUID NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    listener_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    went_live_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;

-- Allow all access (for development)
DROP POLICY IF EXISTS "Allow all for radio_stations" ON public.radio_stations;
CREATE POLICY "Allow all for radio_stations" 
ON public.radio_stations 
FOR ALL 
USING (true) 
WITH CHECK (true);
