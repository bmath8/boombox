/**
 * Spotify Track Search Component
 * Allows users to search for tracks and add them to playlists/queues
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Search, Plus, Play } from 'lucide-react';
import { SpotifyTrack } from '@/lib/spotify-api';
import { handleError } from '@/lib/error-handler';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

interface TrackSearchProps {
    onTrackSelect: (track: SpotifyTrack) => void;
    placeholder?: string;
}

export function TrackSearch({ onTrackSelect, placeholder }: TrackSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

    const searchTracks = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            await withRateLimit(
                'spotify-search',
                RATE_LIMITS.SUPABASE_QUERY,
                async () => {
                    const response = await fetch(
                        `/api/spotify/search?q=${encodeURIComponent(searchQuery)}&limit=10`
                    );

                    if (!response.ok) {
                        throw new Error('Search failed');
                    }

                    const data = await response.json();
                    setResults(data.tracks);
                }
            );
        } catch (error) {
            handleError(error, 'Spotify Search');
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        searchTracks(query);
    }, [query, searchTracks]);

    const handleSelectTrack = useCallback((track: SpotifyTrack) => {
        setSelectedTrack(track.id);
        onTrackSelect(track);

        // Clear selection after a moment
        setTimeout(() => setSelectedTrack(null), 1000);
    }, [onTrackSelect]);

    return (
        <div className="space-y-4">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder || "Search for tracks..."}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </form>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
                </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.map((track) => (
                        <div
                            key={track.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedTrack === track.id
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-card border-border hover:bg-accent'
                                }`}
                        >
                            {/* Album Art */}
                            {track.album.images[0] && (
                                <img
                                    src={track.album.images[0].url}
                                    alt={track.album.name}
                                    className="w-12 h-12 rounded"
                                />
                            )}

                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{track.name}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                    {track.artists.map(a => a.name).join(', ')}
                                </p>
                            </div>

                            {/* Duration */}
                            <span className="text-sm text-muted-foreground">
                                {Math.floor(track.duration_ms / 60000)}:
                                {String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                            </span>

                            {/* Add Button */}
                            <button
                                onClick={() => handleSelectTrack(track)}
                                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                aria-label="Add track"
                            >
                                {selectedTrack === track.id ? (
                                    <Play className="h-4 w-4" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No tracks found for &quot;{query}&quot;</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                </div>
            )}
        </div>
    );
}
