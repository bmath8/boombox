-- Sprint 2: Collaborative Playlists & Gamification
-- Database Schema

-- 1. Collaborative Playlists
CREATE TABLE IF NOT EXISTS public.collaborative_playlists (
    playlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    playlist_name VARCHAR(200) NOT NULL,
    description TEXT,
    theme VARCHAR(50) DEFAULT 'custom', -- 'road_trip', 'workout', 'party', 'chill', 'custom'
    is_public BOOLEAN DEFAULT true,
    voting_enabled BOOLEAN DEFAULT true,
    auto_sort_by_votes BOOLEAN DEFAULT false,
    max_tracks_per_user INTEGER DEFAULT 10,
    cover_image_url TEXT,
    total_tracks INTEGER DEFAULT 0,
    total_collaborators INTEGER DEFAULT 1,
    total_plays INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    track_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(200) NOT NULL,
    track_name VARCHAR(200) NOT NULL,
    artist_name VARCHAR(200) NOT NULL,
    album_name VARCHAR(200),
    album_art_url TEXT,
    duration_ms INTEGER,
    added_by UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
    added_at TIMESTAMP DEFAULT NOW(),
    vote_count INTEGER DEFAULT 0,
    position INTEGER,
    play_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.playlist_track_votes (
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    voted_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.playlist_collaborators (
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'contributor', -- creator, moderator, contributor
    tracks_added INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (playlist_id, user_id)
);

-- 2. Track Comments & Reactions
CREATE TABLE IF NOT EXISTS public.playlist_track_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.track_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) CHECK (reaction_type IN ('fire', 'heart', 'cry', 'laugh', 'mind_blown')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(playlist_id, track_id, user_id, reaction_type)
);

-- 3. Challenges & Rewards
CREATE TABLE IF NOT EXISTS public.playlist_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_type VARCHAR(50) NOT NULL, -- 'theme_master', 'hidden_gem', 'crowd_pleaser', etc.
    challenge_name VARCHAR(100) NOT NULL,
    challenge_description TEXT,
    points_reward INTEGER DEFAULT 50,
    badge_reward VARCHAR(50), -- Optional badge ID
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES public.playlist_challenges(challenge_id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    PRIMARY KEY (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS public.curator_stats (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    total_playlists_created INTEGER DEFAULT 0,
    total_tracks_added INTEGER DEFAULT 0,
    total_upvotes_received INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    curator_level INTEGER DEFAULT 1,
    unlocked_badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_added_by ON public.playlist_tracks(added_by);
CREATE INDEX IF NOT EXISTS idx_playlist_collaborators_user ON public.playlist_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_track_votes_track ON public.playlist_track_votes(track_id);
CREATE INDEX IF NOT EXISTS idx_track_comments_track ON public.playlist_track_comments(track_id);

-- Functions

-- 1. Create Collaborative Playlist
CREATE OR REPLACE FUNCTION public.create_collaborative_playlist(
    p_creator_id UUID,
    p_playlist_name VARCHAR(200),
    p_description TEXT,
    p_theme VARCHAR(50),
    p_voting_enabled BOOLEAN,
    p_auto_sort BOOLEAN,
    p_max_tracks INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_playlist_id UUID;
BEGIN
    -- Create playlist
    INSERT INTO public.collaborative_playlists (
        creator_id, playlist_name, description, theme, 
        voting_enabled, auto_sort_by_votes, max_tracks_per_user
    ) VALUES (
        p_creator_id, p_playlist_name, p_description, p_theme,
        p_voting_enabled, p_auto_sort, p_max_tracks
    )
    RETURNING playlist_id INTO v_playlist_id;
    
    -- Add creator as collaborator
    INSERT INTO public.playlist_collaborators (playlist_id, user_id, role)
    VALUES (v_playlist_id, p_creator_id, 'creator');
    
    -- Update curator stats
    INSERT INTO public.curator_stats (user_id, total_playlists_created)
    VALUES (p_creator_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_playlists_created = curator_stats.total_playlists_created + 1;
    
    RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Track to Playlist
CREATE OR REPLACE FUNCTION public.add_track_to_playlist(
    p_playlist_id UUID,
    p_user_id UUID,
    p_spotify_track_id VARCHAR(200),
    p_track_name VARCHAR(200),
    p_artist_name VARCHAR(200),
    p_album_name VARCHAR(200),
    p_album_art_url TEXT,
    p_duration_ms INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_track_id UUID;
    v_user_track_count INTEGER;
    v_max_tracks INTEGER;
    v_next_position INTEGER;
BEGIN
    -- Check max tracks per user
    SELECT max_tracks_per_user INTO v_max_tracks
    FROM public.collaborative_playlists
    WHERE playlist_id = p_playlist_id;
    
    SELECT COUNT(*) INTO v_user_track_count
    FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id AND added_by = p_user_id;
    
    IF v_user_track_count >= v_max_tracks THEN
        RAISE EXCEPTION 'User has reached maximum tracks limit';
    END IF;
    
    -- Get next position
    SELECT COALESCE(MAX(position), 0) + 1 INTO v_next_position
    FROM public.playlist_tracks
    WHERE playlist_id = p_playlist_id;
    
    -- Add track
    INSERT INTO public.playlist_tracks (
        playlist_id, spotify_track_id, track_name, artist_name,
        album_name, album_art_url, duration_ms, added_by, position
    ) VALUES (
        p_playlist_id, p_spotify_track_id, p_track_name, p_artist_name,
        p_album_name, p_album_art_url, p_duration_ms, p_user_id, v_next_position
    )
    RETURNING track_id INTO v_track_id;
    
    -- Update playlist total_tracks
    UPDATE public.collaborative_playlists
    SET total_tracks = total_tracks + 1, updated_at = NOW()
    WHERE playlist_id = p_playlist_id;
    
    -- Update collaborator stats
    UPDATE public.playlist_collaborators
    SET tracks_added = tracks_added + 1
    WHERE playlist_id = p_playlist_id AND user_id = p_user_id;
    
    -- Update curator stats
    INSERT INTO public.curator_stats (user_id, total_tracks_added)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_tracks_added = curator_stats.total_tracks_added + 1;
    
    RETURN v_track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Vote on Track
CREATE OR REPLACE FUNCTION public.vote_on_playlist_track(
    p_playlist_id UUID,
    p_track_id UUID,
    p_user_id UUID,
    p_vote_type VARCHAR(10)
)
RETURNS VOID AS $$
DECLARE
    v_auto_sort BOOLEAN;
BEGIN
    -- Insert or update vote
    INSERT INTO public.playlist_track_votes (playlist_id, track_id, user_id, vote_type)
    VALUES (p_playlist_id, p_track_id, p_user_id, p_vote_type)
    ON CONFLICT (playlist_id, track_id, user_id) 
    DO UPDATE SET vote_type = p_vote_type, voted_at = NOW();
    
    -- Update vote count on track
    UPDATE public.playlist_tracks
    SET vote_count = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - 
               COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM public.playlist_track_votes
        WHERE track_id = p_track_id
    )
    WHERE track_id = p_track_id;
    
    -- Check if auto-sort is enabled
    SELECT auto_sort_by_votes INTO v_auto_sort
    FROM public.collaborative_playlists
    WHERE playlist_id = p_playlist_id;
    
    -- Auto-sort if enabled
    IF v_auto_sort THEN
        PERFORM public.auto_sort_playlist(p_playlist_id);
    END IF;
    
    -- Update curator stats for track owner
    IF p_vote_type = 'up' THEN
        UPDATE public.curator_stats cs
        SET total_upvotes_received = total_upvotes_received + 1
        FROM public.playlist_tracks pt
        WHERE pt.track_id = p_track_id AND cs.user_id = pt.added_by;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Auto-sort Playlist by Votes
CREATE OR REPLACE FUNCTION public.auto_sort_playlist(p_playlist_id UUID)
RETURNS VOID AS $$
DECLARE
    v_track RECORD;
    v_position INTEGER := 1;
BEGIN
    FOR v_track IN 
        SELECT track_id
        FROM public.playlist_tracks
        WHERE playlist_id = p_playlist_id
        ORDER BY vote_count DESC, added_at ASC
    LOOP
        UPDATE public.playlist_tracks
        SET position = v_position
        WHERE track_id = v_track.track_id;
        
        v_position := v_position + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add Collaborator to Playlist
CREATE OR REPLACE FUNCTION public.add_playlist_collaborator(
    p_playlist_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.playlist_collaborators (playlist_id, user_id, role)
    VALUES (p_playlist_id, p_user_id, 'contributor')
    ON CONFLICT (playlist_id, user_id) DO NOTHING;
    
    -- Update playlist total_collaborators
    UPDATE public.collaborative_playlists
    SET total_collaborators = (
        SELECT COUNT(*) FROM public.playlist_collaborators
        WHERE playlist_id = p_playlist_id
    )
    WHERE playlist_id = p_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Add Comment to Track
CREATE OR REPLACE FUNCTION public.add_track_comment(
    p_playlist_id UUID,
    p_track_id UUID,
    p_user_id UUID,
    p_comment_text TEXT
)
RETURNS UUID AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    INSERT INTO public.playlist_track_comments (
        playlist_id, track_id, user_id, comment_text
    ) VALUES (
        p_playlist_id, p_track_id, p_user_id, p_comment_text
    )
    RETURNING comment_id INTO v_comment_id;
    
    RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Add Reaction to Track
CREATE OR REPLACE FUNCTION public.add_track_reaction(
    p_playlist_id UUID,
    p_track_id UUID,
    p_user_id UUID,
    p_reaction_type VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    v_reaction_id UUID;
BEGIN
    INSERT INTO public.track_reactions (
        playlist_id, track_id, user_id, reaction_type
    ) VALUES (
        p_playlist_id, p_track_id, p_user_id, p_reaction_type
    )
    ON CONFLICT (playlist_id, track_id, user_id, reaction_type) DO NOTHING
    RETURNING reaction_id INTO v_reaction_id;
    
    RETURN v_reaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.collaborative_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_track_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_track_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curator_stats ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development
CREATE POLICY "Allow all for collaborative_playlists" ON public.collaborative_playlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for playlist_tracks" ON public.playlist_tracks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for playlist_track_votes" ON public.playlist_track_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for playlist_collaborators" ON public.playlist_collaborators FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for playlist_track_comments" ON public.playlist_track_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for track_reactions" ON public.track_reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for playlist_challenges" ON public.playlist_challenges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for user_challenge_progress" ON public.user_challenge_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for curator_stats" ON public.curator_stats FOR ALL USING (true) WITH CHECK (true);

-- Insert default challenges
INSERT INTO public.playlist_challenges (challenge_type, challenge_name, challenge_description, points_reward, badge_reward) VALUES
('theme_master', 'Theme Master', 'Add 5 tracks that match the playlist theme', 50, 'theme_master'),
('hidden_gem', 'Hidden Gem', 'Add a track with less than 100k Spotify plays that gets 10+ upvotes', 100, 'hidden_gem'),
('crowd_pleaser', 'Crowd Pleaser', 'Your track gets the most upvotes this week', 200, 'crowd_pleaser'),
('consistency_king', 'Consistency King', 'Add tracks to playlists 7 days in a row', 150, 'consistency_king'),
('discovery_champion', 'Discovery Champion', 'Introduce 3 friends to new artists via playlists', 75, 'discovery_champion')
ON CONFLICT DO NOTHING;
