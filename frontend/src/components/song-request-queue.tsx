'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useRadio } from '@/lib/radio-station';
import { useSpotify } from '@/lib/spotify-sdk';
import { Search, Plus, ThumbsUp, Music2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Artist } from '@/lib/types';
import { logger } from '@/lib/logger';

type SongRequest = {
    id: string;
    track: {
        id: string;
        name: string;
        artist: string;
        image?: string | undefined;
        uri: string;
    };
    requester: {
        id: string;
        name: string;
    };
    votes: number;
    timestamp: number;
};

// Interface for search results (unified from Spotify and iTunes)
interface SearchResultTrack {
    id: string;
    name: string;
    artists: Artist[];
    album: {
        images: { url: string }[];
    };
    uri: string;
    preview_url?: string | undefined;
}

export function SongRequestQueue() {
    const { lastMessage, sendMessage } = useWebSocket();
    const { currentStation, isBroadcasting } = useRadio();
    const { player } = useSpotify();
    const [queue, setQueue] = useState<SongRequest[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResultTrack[]>([]);

    // Handle incoming queue updates
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'radio:song-request' && lastMessage.stationId === currentStation?.station_id) {
            const newRequest: SongRequest = {
                id: Math.random().toString(36).substr(2, 9),
                track: lastMessage.track,
                requester: {
                    id: lastMessage.requesterId,
                    name: 'Listener', // Fetch name in real app
                },
                votes: 1,
                timestamp: lastMessage.timestamp,
            };
            setQueue((prev) => [...prev, newRequest].sort((a, b) => b.votes - a.votes));
        }
    }, [lastMessage, currentStation]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        // Try Spotify first if we have a token
        if (session?.provider_token) {
            try {
                const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
                    headers: {
                        Authorization: `Bearer ${session.provider_token}`,
                    },
                });
                const data = await response.json();
                // Map Spotify results to unified format
                interface SpotifyTrack {
                    id: string;
                    name: string;
                    artists: { name: string; id?: string }[];
                    album: { images: { url: string }[] };
                    uri: string;
                    preview_url: string | null;
                }

                const mappedResults = (data.tracks?.items as SpotifyTrack[] || []).map(track => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists,
                    album: track.album,
                    uri: track.uri,
                    preview_url: track.preview_url || undefined
                }));

                setSearchResults(mappedResults);
                return;
            } catch (error) {
                logger.error('Spotify search failed', error);
            }
        }

        // Fallback to iTunes API (free, no auth required)
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5`);
            const data = await response.json();

            // Type for iTunes API response
            interface ITunesTrack {
                trackId: number;
                trackName: string;
                artistName: string;
                collectionName: string;
                artworkUrl100: string;
                artworkUrl60: string;
                artworkUrl30: string;
                previewUrl: string;
            }

            // Convert iTunes format to Spotify-like format for compatibility
            const convertedResults: SearchResultTrack[] = (data.results as ITunesTrack[] || []).map((track) => ({
                id: track.trackId.toString(),
                name: track.trackName,
                artists: [{ name: track.artistName }] as Artist[],
                album: {
                    images: [
                        { url: track.artworkUrl100 },
                        { url: track.artworkUrl60 },
                        { url: track.artworkUrl30 }
                    ]
                },
                uri: track.previewUrl, // iTunes preview URL
                preview_url: track.previewUrl
            }));

            setSearchResults(convertedResults);
        } catch (error) {
            logger.error('iTunes search failed', error);
            setSearchResults([]);
        }
    };

    interface TrackRequest {
        id: string;
        name: string;
        artists: Artist[];
        album: {
            images: { url: string }[];
        };
        uri: string;
    }

    const handleRequest = async (track: TrackRequest) => {
        if (!currentStation) return;

        const imageUrl = track.album.images[2]?.url;
        const trackData = {
            id: track.id,
            name: track.name,
            artist: track.artists[0]?.name || 'Unknown Artist',
            ...(imageUrl ? { image: imageUrl } : {}),
            uri: track.uri,
        };

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Save to database
        const { error } = await supabase
            .from('song_requests')
            .insert({
                station_id: currentStation.station_id,
                requester_id: user.id,
                track_id: track.id,
                track_name: track.name,
                artist: track.artists[0]?.name || 'Unknown Artist',
                album_art_url: track.album.images[2]?.url,
                status: 'pending'
            });

        if (error) {
            logger.error('Failed to add song request', error);
            return;
        }

        // Send WebSocket message
        sendMessage({
            type: 'radio:song-request',
            stationId: currentStation.station_id,
            track: trackData,
            timestamp: Date.now(),
        });

        setIsSearching(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handlePlayRequest = async (trackUri: string) => {
        if (!isBroadcasting) return;

        // In a real app, this would queue to the broadcaster's Spotify player
        // For now, we'll just log it
        logger.info('Playing requested track', { trackUri });

        // Remove from queue
        setQueue((prev) => prev.filter((req) => req.track.uri !== trackUri));
    };

    return (
        <div className="flex flex-col h-full glass-dark rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white">Request Queue</h3>
                <button
                    onClick={() => setIsSearching(!isSearching)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    {isSearching ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isSearching && (
                    <div className="mb-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search for a song..."
                                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            {searchResults.map((track) => (
                                <button
                                    key={track.id}
                                    onClick={() => handleRequest(track)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left group"
                                >
                                    {track.album?.images[2]?.url ? (
                                        <img
                                            src={track.album.images[2].url}
                                            alt={track.name}
                                            className="w-10 h-10 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                                            <Music2 className="w-5 h-5 text-white/50" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{track.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {track.artists[0]?.name || 'Unknown Artist'}
                                        </p>
                                    </div>
                                    <Plus className="w-4 h-4 text-white/0 group-hover:text-white/100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {queue.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                            {req.track.image ? (
                                <img
                                    src={req.track.image}
                                    alt={req.track.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Music2 className="w-6 h-6 text-white/50" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{req.track.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{req.track.artist}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-white/40">
                                        Req by {req.requester.name}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        <ThumbsUp className="w-3 h-3" />
                                        {req.votes}
                                    </span>
                                </div>
                            </div>

                            {isBroadcasting && (
                                <button
                                    onClick={() => handlePlayRequest(req.track.uri)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-primary"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {queue.length === 0 && !isSearching && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Music2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Request queue is empty</p>
                        <p className="text-sm opacity-60">Search to request a song</p>
                    </div>
                )}
            </div>
        </div>
    );
}
