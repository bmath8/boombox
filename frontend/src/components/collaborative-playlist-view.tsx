'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Shuffle, Share2, Settings, Music } from 'lucide-react';
import { PlaylistTrackCard } from './playlist-track-card';
import { TrackSelectionModal } from './track-selection-modal';
import { PlaylistChallenges } from './playlist-challenges';
import { CuratorStats } from './curator-stats';
import { Playlist, PlaylistTrack } from '@/lib/types';
import { handleError } from '@/lib/error-handler';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';

interface CollaborativePlaylistViewProps {
    playlistId: string;
}

export function CollaborativePlaylistView({ playlistId }: CollaborativePlaylistViewProps) {
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddTrack, setShowAddTrack] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        getUser();
    }, []);

    const fetchTracks = useCallback(async () => {
        try {
            const { data: tracksData, error: tracksError } = await supabase
                .from('playlist_tracks')
                .select(`
                    *,
                    user:added_by (
                        display_name,
                        avatar_url
                    )
                `)
                .eq('playlist_id', playlistId)
                .order('vote_count', { ascending: false })
                .order('added_at', { ascending: true });

            if (tracksError) throw tracksError;

            // Get user votes for these tracks
            if (currentUserId && tracksData) {
                const { data: votes } = await supabase
                    .from('playlist_track_votes')
                    .select('track_id, vote_type')
                    .eq('playlist_id', playlistId)
                    .eq('user_id', currentUserId);

                // Type for track data from Supabase
                interface TrackData {
                    track_id: string;
                    playlist_id: string;
                    spotify_track_id: string;
                    track_name: string;
                    artist_name: string;
                    album_name?: string;
                    album_art_url?: string;
                    duration_ms: number;
                    added_by: string;
                    added_at: string;
                    vote_count: number;
                    play_count: number;
                    position: number;
                    user?: {
                        display_name: string;
                        avatar_url?: string;
                    };
                }

                const tracksWithVotes: PlaylistTrack[] = (tracksData as unknown as TrackData[]).map((track) => {
                    const baseTrack: PlaylistTrack = {
                        track_id: track.track_id,
                        playlist_id: track.playlist_id,
                        spotify_track_id: track.spotify_track_id,
                        track_name: track.track_name,
                        artist_name: track.artist_name,
                        duration_ms: track.duration_ms,
                        added_by: track.added_by,
                        added_at: track.added_at,
                        vote_count: track.vote_count,
                        play_count: track.play_count,
                        position: track.position,
                        user_vote: votes?.find(v => v.track_id === track.track_id)?.vote_type || null
                    };
                    if (track.album_name) baseTrack.album_name = track.album_name;
                    if (track.album_art_url) baseTrack.album_art_url = track.album_art_url;
                    if (track.user) baseTrack.added_by_user = track.user;
                    return baseTrack;
                });
                setTracks(tracksWithVotes);
            } else {
                // Same type assertion for the else case
                interface TrackData {
                    track_id: string;
                    playlist_id: string;
                    spotify_track_id: string;
                    track_name: string;
                    artist_name: string;
                    album_name?: string;
                    album_art_url?: string;
                    duration_ms: number;
                    added_by: string;
                    added_at: string;
                    vote_count: number;
                    play_count: number;
                    position: number;
                    user?: {
                        display_name: string;
                        avatar_url?: string;
                    };
                }
                const mappedTracks: PlaylistTrack[] = (tracksData as unknown as TrackData[]).map(track => {
                    const baseTrack: PlaylistTrack = {
                        track_id: track.track_id,
                        playlist_id: track.playlist_id,
                        spotify_track_id: track.spotify_track_id,
                        track_name: track.track_name,
                        artist_name: track.artist_name,
                        duration_ms: track.duration_ms,
                        added_by: track.added_by,
                        added_at: track.added_at,
                        vote_count: track.vote_count,
                        play_count: track.play_count,
                        position: track.position,
                        user_vote: null
                    };
                    if (track.album_name) baseTrack.album_name = track.album_name;
                    if (track.album_art_url) baseTrack.album_art_url = track.album_art_url;
                    if (track.user) baseTrack.added_by_user = track.user;
                    return baseTrack;
                });
                setTracks(mappedTracks || []);
            }
        } catch (error) {
            handleError(error, 'FetchTracks');
        }
    }, [playlistId, currentUserId]);

    const fetchPlaylistData = useCallback(async () => {
        try {
            // Fetch playlist details
            const { data: playlistData, error: playlistError } = await supabase
                .from('collaborative_playlists')
                .select('*')
                .eq('playlist_id', playlistId)
                .single();

            if (playlistError) throw playlistError;
            setPlaylist(playlistData);

            // Fetch tracks
            await fetchTracks();
        } catch (error) {
            handleError(error, 'FetchPlaylist');
        } finally {
            setLoading(false);
        }
    }, [playlistId, fetchTracks]);

    useEffect(() => {
        fetchPlaylistData();

        // Subscribe to changes
        const subscription = supabase
            .channel(`playlist:${playlistId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'playlist_tracks',
                    filter: `playlist_id=eq.${playlistId}`
                },
                () => {
                    fetchTracks();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [playlistId, fetchPlaylistData, fetchTracks]);

    interface SpotifyTrack {
        id: string;
        name: string;
        artists: { name: string }[];
        album: {
            name: string;
            images: { url: string }[];
        };
    }

    const handleAddTrack = async (track: SpotifyTrack) => {
        if (!currentUserId || !playlist) return;

        // Optimistic update
        const optimisticTrack: PlaylistTrack = {
            track_id: `temp-${Date.now()}`,
            playlist_id: playlistId,
            spotify_track_id: track.id,
            track_name: track.name,
            artist_name: track.artists[0]?.name || 'Unknown Artist',
            duration_ms: 0, // Will be updated on refresh
            added_by: currentUserId,
            added_at: new Date().toISOString(),
            vote_count: 0,
            play_count: 0,
            position: tracks.length,
            user_vote: null
        };
        if (track.album.name) optimisticTrack.album_name = track.album.name;
        if (track.album.images[0]?.url) optimisticTrack.album_art_url = track.album.images[0].url;

        setTracks(prev => [...prev, optimisticTrack]);
        setShowAddTrack(false);

        try {
            const { error } = await supabase
                .from('playlist_tracks')
                .insert({
                    playlist_id: playlistId,
                    spotify_track_id: track.id,
                    track_name: track.name,
                    artist_name: track.artists[0]?.name || 'Unknown Artist',
                    album_art_url: track.album.images[0]?.url,
                    added_by: currentUserId
                });

            if (error) throw error;
            toast.success('Track added to playlist');
            fetchTracks(); // Refresh to get real ID
        } catch (error) {
            setTracks(prev => prev.filter(t => t.track_id !== optimisticTrack.track_id));
            handleError(error, 'AddTrack');
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    if (!playlist) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Music className="w-12 h-12 mb-4 opacity-50" />
                <p>Playlist not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/50 to-black border border-white/10 p-8">
                <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-end">
                    <div className="w-48 h-48 rounded-2xl bg-white/10 shadow-2xl flex items-center justify-center flex-shrink-0">
                        {playlist.cover_image_url ? (
                            <img src={playlist.cover_image_url} alt={playlist.playlist_name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <Music className="w-20 h-20 text-white/20" />
                        )}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 text-sm font-medium text-purple-400">
                            <span className="px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                                Collaborative Playlist
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                            {playlist.playlist_name}
                        </h1>

                        <p className="text-lg text-white/60 max-w-2xl">
                            {playlist.description || 'Add your favorite tracks and vote for the best ones.'}
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                            <button className="px-8 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/25">
                                <Play className="w-5 h-5 fill-current" />
                                Play All
                            </button>
                            <button className="p-3 bg-white/5 text-white rounded-full hover:bg-white/10 transition-colors border border-white/10">
                                <Shuffle className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowAddTrack(true)}
                                className="px-6 py-3 bg-white/5 text-white font-medium rounded-full hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Track
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Track List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-white">Tracks ({tracks.length})</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Sort by:</span>
                            <select className="bg-transparent border-none focus:ring-0 text-white font-medium cursor-pointer">
                                <option value="votes">Most Voted</option>
                                <option value="recent">Recently Added</option>
                            </select>
                        </div>
                    </div>

                    <AnimatePresence mode="popLayout">
                        {tracks.map((track, index) => (
                            <motion.div
                                key={track.track_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <PlaylistTrackCard
                                    track={track}
                                    currentUserId={currentUserId}
                                    onVote={() => fetchTracks()}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {tracks.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                            <Music className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No tracks yet</h3>
                            <p className="text-white/50 mb-6">Be the first to add a track to this playlist!</p>
                            <button
                                onClick={() => setShowAddTrack(true)}
                                className="px-6 py-2 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-colors"
                            >
                                Add Track
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    <CuratorStats tracks={tracks} />
                    <PlaylistChallenges playlistId={playlistId} />
                </div>
            </div>

            <TrackSelectionModal
                isOpen={showAddTrack}
                onClose={() => setShowAddTrack(false)}
                stationId={playlistId} // Reusing this prop for context
                onTrackSelected={handleAddTrack}
            />
        </div>
    );
}
