-- Add song_requests table for the queue feature

CREATE TABLE IF NOT EXISTS public.song_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    artist VARCHAR(200) NOT NULL,
    album_art_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_song_requests_station 
ON public.song_requests(station_id, status, requested_at);

-- Enable RLS
ALTER TABLE public.song_requests ENABLE ROW LEVEL SECURITY;

-- Allow all access (for development)
DROP POLICY IF EXISTS "Allow all for song_requests" ON public.song_requests;
CREATE POLICY "Allow all for song_requests" 
ON public.song_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);
