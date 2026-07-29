-- 03_playlist_schema.sql
-- Collaborative Playlists, Tracks, Votes, Comments, Reactions, Challenges

-- ============================================================================
-- PLAYLISTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collaborative_playlists (
    playlist_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES public.users(user_id),
    playlist_name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    theme VARCHAR(50) DEFAULT 'custom',
    voting_enabled BOOLEAN DEFAULT true,
    auto_sort_by_votes BOOLEAN DEFAULT false,
    max_tracks_per_user INTEGER DEFAULT 10,
    total_tracks INTEGER DEFAULT 0,
    total_collaborators INTEGER DEFAULT 1,
    total_plays INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_creator ON public.collaborative_playlists(created_by);

-- ============================================================================
-- PLAYLIST TRACKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    track_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    spotify_track_id VARCHAR(100) NOT NULL,
    track_name VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    album_name VARCHAR(255),
    album_art_url TEXT,
    duration_ms INTEGER,
    added_by UUID NOT NULL REFERENCES public.users(user_id),
    added_at TIMESTAMP DEFAULT NOW(),
    vote_count INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    UNIQUE(playlist_id, spotify_track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON public.playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_votes ON public.playlist_tracks(playlist_id, vote_count DESC);

-- ============================================================================
-- PLAYLIST COLLABORATORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playlist_collaborators (
    playlist_id UUID REFERENCES public.collaborative_playlists(playlist_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'collaborator', -- 'owner', 'admin', 'collaborator', 'viewer'
    joined_at TIMESTAMP DEFAULT NOW(),
    tracks_added_count INTEGER DEFAULT 0,
    PRIMARY KEY (playlist_id, user_id)
);

-- ============================================================================
-- TRACK INTERACTIONS (Votes, Comments, Reactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playlist_track_votes (
    vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL, -- 1 for upvote, -1 for downvote
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(track_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.playlist_track_comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.track_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id UUID REFERENCES public.playlist_tracks(track_id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(user_id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL, -- 'fire', 'heart', 'cry', 'laugh', 'mind_blown'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(track_id, user_id, reaction_type)
);

-- ============================================================================
-- GAMIFICATION (Challenges & Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.playlist_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_type VARCHAR(50) NOT NULL, -- 'theme_master', 'hidden_gem', etc.
    challenge_name VARCHAR(100) NOT NULL,
    challenge_description TEXT,
    points_reward INTEGER DEFAULT 0,
    badge_reward VARCHAR(50),
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
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id),
    total_playlists_created INTEGER DEFAULT 0,
    total_tracks_added INTEGER DEFAULT 0,
    total_upvotes_received INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    curator_level INTEGER DEFAULT 1,
    unlocked_badges TEXT[] DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW()
);
