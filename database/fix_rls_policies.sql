-- ============================================================================
-- PRODUCTION-READY RLS POLICIES
-- Replaces permissive development policies with proper user-scoped access control
-- ============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all for user_affinities" ON public.user_affinities;
DROP POLICY IF EXISTS "Allow all for discovery_matches" ON public.discovery_matches;

-- ============================================================================
-- USER AFFINITIES - Users can only see their own affinities
-- ============================================================================

CREATE POLICY "Users can view own affinities"
ON public.user_affinities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own affinities"
ON public.user_affinities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affinities"
ON public.user_affinities
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own affinities"
ON public.user_affinities
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- DISCOVERY MATCHES - Users can see matches where they are involved
-- ============================================================================

CREATE POLICY "Users can view their discovery matches"
ON public.discovery_matches
FOR SELECT
USING (
    auth.uid() = user_id OR 
    auth.uid() = matched_user_id
);

CREATE POLICY "Users can insert own discovery matches"
ON public.discovery_matches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discovery matches"
ON public.discovery_matches
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own discovery matches"
ON public.discovery_matches
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS - Add input validation
-- ============================================================================

-- Update calculate_user_affinities with validation
CREATE OR REPLACE FUNCTION public.calculate_user_affinities(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Validate input
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'target_user_id cannot be NULL';
    END IF;

    -- Ensure user can only calculate their own affinities
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Can only calculate own affinities';
    END IF;

    -- Clear old affinities for user
    DELETE FROM public.user_affinities WHERE user_id = target_user_id;

    -- Insert new affinities based on top artists from listening_activity
    INSERT INTO public.user_affinities (user_id, artist, affinity_score)
    SELECT 
        user_id,
        artists as artist,
        COUNT(*) * 10 as affinity_score -- Simple score: 10 points per listen
    FROM public.listening_activity
    WHERE user_id = target_user_id
    GROUP BY user_id, artists
    ORDER BY affinity_score DESC
    LIMIT 20; -- Top 20 artists
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update find_discovery_matches with validation
CREATE OR REPLACE FUNCTION public.find_discovery_matches(target_user_id UUID)
RETURNS TABLE (
    matched_user_id UUID,
    match_score BIGINT,
    shared_artists TEXT[]
) AS $$
BEGIN
    -- Validate input
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'target_user_id cannot be NULL';
    END IF;

    -- Ensure user can only find their own matches
    IF auth.uid() != target_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Can only find own matches';
    END IF;

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

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test RLS policies (should only return current user's data)
-- SELECT * FROM user_affinities; -- Should only show auth.uid()'s affinities
-- SELECT * FROM discovery_matches; -- Should only show matches involving auth.uid()
