/**
 * Spotify Playlist Import Component
 * Allows users to import their Spotify playlists
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Music, Download, Check } from 'lucide-react';
import { SpotifyPlaylist } from '@/lib/spotify-api';
import { handleError } from '@/lib/error-handler';
import { supabase } from '@/lib/supabase';

interface PlaylistImportProps {
    onImportComplete?: (playlistId: string) => void;
}

export function PlaylistImport({ onImportComplete }: PlaylistImportProps) {
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState<string | null>(null);
    const [imported, setImported] = useState<Set<string>>(new Set());

    // Load user's Spotify playlists
    useEffect(() => {
        loadPlaylists();
    }, []);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/spotify/playlists');

            if (!response.ok) {
                throw new Error('Failed to load playlists');
            }

            const data = await response.json();
            setPlaylists(data.playlists);
        } catch (error) {
            handleError(error, 'Load Playlists');
        } finally {
            setLoading(false);
        }
    };

    const importPlaylist = useCallback(async (playlist: SpotifyPlaylist) => {
        setImporting(playlist.id);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Create playlist in database
            const { data: newPlaylist, error: playlistError } = await supabase
                .from('collaborative_playlists')
                .insert({
                    creator_id: user.id,
                    name: playlist.name,
                    description: playlist.description || `Imported from Spotify`,
                    is_collaborative: false,
                    voting_enabled: false,
                })
                .select()
                .single();

            if (playlistError) throw playlistError;

            // Get playlist tracks from Spotify
            const tracksResponse = await fetch(
                `/api/spotify/playlists/${playlist.id}/tracks`
            );

            if (!tracksResponse.ok) {
                throw new Error('Failed to load playlist tracks');
            }

            const { tracks } = await tracksResponse.json();

            // Import tracks
            const trackInserts = tracks.map((track: any, index: number) => ({
                playlist_id: newPlaylist.playlist_id,
                spotify_track_id: track.id,
                added_by: user.id,
                position: index,
            }));

            const { error: tracksError } = await supabase
                .from('playlist_tracks')
                .insert(trackInserts);

            if (tracksError) throw tracksError;

            // Mark as imported
            setImported(prev => new Set(prev).add(playlist.id));

            // Notify parent
            if (onImportComplete) {
                onImportComplete(newPlaylist.playlist_id);
            }
        } catch (error) {
            handleError(error, 'Import Playlist');
        } finally {
            setImporting(null);
        }
    }, [onImportComplete]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading your Spotify playlists...</p>
            </div>
        );
    }

    if (playlists.length === 0) {
        return (
            <div className="text-center py-12">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No Spotify playlists found</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Create some playlists in Spotify first
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Spotify Playlists</h3>
                <p className="text-sm text-muted-foreground">
                    {playlists.length} playlist{playlists.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        className="border border-border rounded-lg p-4 space-y-3"
                    >
                        {/* Playlist Image */}
                        {playlist.images[0] && (
                            <img
                                src={playlist.images[0].url}
                                alt={playlist.name}
                                className="w-full aspect-square object-cover rounded"
                            />
                        )}

                        {/* Playlist Info */}
                        <div>
                            <h4 className="font-medium truncate">{playlist.name}</h4>
                            <p className="text-sm text-muted-foreground">
                                {playlist.tracks.total} tracks • by {playlist.owner.display_name}
                            </p>
                        </div>

                        {/* Import Button */}
                        <button
                            onClick={() => importPlaylist(playlist)}
                            disabled={importing === playlist.id || imported.has(playlist.id)}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${imported.has(playlist.id)
                                    ? 'bg-green-500/20 text-green-500 cursor-not-allowed'
                                    : importing === playlist.id
                                        ? 'bg-primary/50 text-primary-foreground cursor-wait'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                        >
                            {imported.has(playlist.id) ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Imported
                                </span>
                            ) : importing === playlist.id ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
                                    Importing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Import
                                </span>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
