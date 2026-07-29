'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, X, Loader2 } from 'lucide-react';
import type { Artist } from '@/lib/types';

type Track = {
    id: string;
    name: string;
    uri: string;
    artists: Artist[];
    album: {
        name: string;
        images: { url: string }[];
    };
    duration_ms: number;
};

type TrackSelectionModalProps = {
    isOpen: boolean;
    onClose: () => void;
    stationId: string;
    onTrackSelected: (track: Track) => void;
};

export function TrackSelectionModal({ isOpen, onClose, stationId, onTrackSelected }: TrackSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            // Get Spotify access token from Supabase session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.provider_token) {
                throw new Error('No Spotify token available');
            }

            const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${session.provider_token}`
                }
            });

            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            setSearchResults(data.tracks.items);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectTrack = async (track: Track) => {
        setSelectedTrack(track);
    };

    const handleConfirm = async () => {
        if (!selectedTrack) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Add to DJ queue
        const { error } = await supabase.rpc('join_dj_queue', {
            p_station_id: stationId,
            p_user_id: user.id,
            p_track_id: selectedTrack.id,
            p_track_name: selectedTrack.name,
            p_artist_name: selectedTrack.artists.map((a: Artist) => a.name).join(', '),
            p_album_art_url: selectedTrack.album.images[0]?.url || null
        });

        if (!error) {
            onTrackSelected(selectedTrack);
            onClose();
            setSearchQuery('');
            setSearchResults([]);
            setSelectedTrack(null);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">Choose Your Track</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Search for a track to play when it's your turn as DJ
                        </p>
                    </div>

                    {/* Search */}
                    <div className="p-6 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length > 2) {
                                        handleSearch(e.target.value);
                                    }
                                }}
                                placeholder="Search for a track..."
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                            {isSearching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-96 overflow-y-auto p-6 space-y-2">
                        {searchResults.length === 0 && !isSearching && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Search for a track to get started</p>
                            </div>
                        )}

                        {searchResults.map((track) => (
                            <motion.button
                                key={track.id}
                                onClick={() => handleSelectTrack(track)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors ${selectedTrack?.id === track.id
                                    ? 'bg-primary/20 border-2 border-primary'
                                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                                    }`}
                            >
                                <img
                                    src={track.album.images[2]?.url || track.album.images[0]?.url}
                                    alt={track.album.name}
                                    className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-white truncate">{track.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {track.artists.map((a: Artist) => a.name).join(', ')}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedTrack}
                            className="px-6 py-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                        >
                            Join DJ Queue
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
