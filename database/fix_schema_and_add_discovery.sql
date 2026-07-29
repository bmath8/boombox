-- Fix Schema and Add Discovery Features
-- Run this in Supabase SQL Editor

-- 1. Standardize public.users to use 'user_id' instead of 'id'
DO $$
BEGIN
    -- Check if 'id' column exists and 'user_id' does not
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_id') THEN
        
        RAISE NOTICE 'Renaming id to user_id in public.users...';
        ALTER TABLE public.users RENAME COLUMN id TO user_id;
    END IF;
END $$;

-- 2. Create User Affinities Table
CREATE TABLE IF NOT EXISTS public.user_affinities (
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    genre VARCHAR(100),
    artist VARCHAR(100),
    affinity_score INTEGER DEFAULT 1,
    last_updated TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, genre, artist)
);

CREATE INDEX IF NOT EXISTS idx_user_affinities_artist ON public.user_affinities(artist);

-- 3. Create Discovery Matches Table
CREATE TABLE IF NOT EXISTS public.discovery_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    matched_user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    match_score INTEGER,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, matched_user_id)
);

-- 4. Function to calculate affinity
CREATE OR REPLACE FUNCTION public.calculate_user_affinities(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.user_affinities WHERE user_id = target_user_id;

    INSERT INTO public.user_affinities (user_id, artist, affinity_score)
    SELECT 
        user_id,
        artists as artist,
        COUNT(*) * 10 as affinity_score
    FROM public.listening_activity
    WHERE user_id = target_user_id
    GROUP BY user_id, artists
    ORDER BY affinity_score DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to find matches
CREATE OR REPLACE FUNCTION public.find_discovery_matches(target_user_id UUID)
RETURNS TABLE (
    matched_user_id UUID,
    match_score BIGINT,
    shared_artists TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua2.user_id as matched_user_id,
        SUM(LEAST(ua1.affinity_score, ua2.affinity_score)) as match_score,
        ARRAY_AGG(ua1.artist) as shared_artists
    FROM public.user_affinities ua1
    JOIN public.user_affinities ua2 ON ua1.artist = ua2.artist AND ua1.user_id != ua2.user_id
    WHERE ua1.user_id = target_user_id
    AND NOT EXISTS (
        SELECT 1 FROM public.friendships f 
        WHERE (f.user_id = target_user_id AND f.friend_id = ua2.user_id)
           OR (f.user_id = ua2.user_id AND f.friend_id = target_user_id)
    )
    GROUP BY ua2.user_id
    ORDER BY match_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.user_affinities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_matches ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow all for user_affinities" ON public.user_affinities;
CREATE POLICY "Allow all for user_affinities" ON public.user_affinities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for discovery_matches" ON public.discovery_matches;
CREATE POLICY "Allow all for discovery_matches" ON public.discovery_matches FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
    RAISE NOTICE '✅ Schema fixed and discovery features added successfully!';
END $$;
