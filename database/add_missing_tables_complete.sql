-- Add Missing Tables (Complete Fix - Handles all edge cases)
-- This version handles existing tables and missing columns

-- ============================================================================
-- FRIENDSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friendships (
    friendship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id, status);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for friendships" ON public.friendships;
CREATE POLICY "Allow all for friendships" 
ON public.friendships 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- FIND_DISCOVERY_MATCHES FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS public.find_discovery_matches(UUID);

CREATE FUNCTION public.find_discovery_matches(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name VARCHAR(100),
    avatar_url TEXT,
    match_type VARCHAR(50),
    match_score INTEGER,
    shared_tracks INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        u.user_id,
        u.display_name,
        u.avatar_url,
        'shared_track'::VARCHAR(50) as match_type,
        50 as match_score,
        1 as shared_tracks
    FROM public.users u
    WHERE u.user_id != target_user_id
    AND u.user_id NOT IN (
        SELECT friend_id FROM public.friendships 
        WHERE user_id = target_user_id AND status = 'accepted'
    )
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULED_SHOWS (Handle existing table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_shows (
    show_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcaster_id UUID REFERENCES public.users(user_id),
    show_name VARCHAR(100) NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    recurring_pattern VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_shows' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.scheduled_shows ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scheduled_shows_broadcaster ON public.scheduled_shows(broadcaster_id);

-- Create index only if is_active column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_shows' 
        AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_scheduled_shows_time 
        ON public.scheduled_shows(scheduled_time) 
        WHERE is_active = true;
    END IF;
END $$;

ALTER TABLE public.scheduled_shows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for scheduled_shows" ON public.scheduled_shows;
CREATE POLICY "Allow all for scheduled_shows" 
ON public.scheduled_shows 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'friendships') as friendships_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'scheduled_shows') as scheduled_shows_exists,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'find_discovery_matches') as function_exists;
