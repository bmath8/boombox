/**
 * Spotify OAuth Test Page
 * Test the Spotify authentication flow
 */

'use client';

import React, { useEffect, useState } from 'react';
import { SpotifyConnectButton } from '@/components/spotify-connect-button';
import { TrackSearch } from '@/components/track-search';
import { PlaylistImport } from '@/components/playlist-import';
import { supabase } from '@/lib/supabase';
import { SpotifyTrack } from '@/lib/spotify-api';

export default function SpotifyTestPage() {
    const [isConnected, setIsConnected] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedTracks, setSelectedTracks] = useState<SpotifyTrack[]>([]);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsConnected(!!user?.user_metadata?.['spotify_access_token']);
    };

    const handleTrackSelect = (track: SpotifyTrack) => {
        setSelectedTracks(prev => [...prev, track]);
        console.log('Selected track:', track);
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold">Spotify Integration Test</h1>
                    <p className="text-muted-foreground">
                        Test Spotify OAuth, search, and playlist import
                    </p>
                </div>

                {/* Connection Status */}
                <div className="border border-border rounded-lg p-6 space-y-4">
                    <h2 className="text-2xl font-semibold">Connection Status</h2>
                    <div className="flex items-center gap-4">
                        <div className={`h-4 w-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="font-medium">
                            {isConnected ? 'Connected to Spotify' : 'Not Connected'}
                        </span>
                    </div>
                    {user && (
                        <div className="text-sm text-muted-foreground">
                            <p>User: {user.email}</p>
                            {user.user_metadata?.['spotify_access_token'] && (
                                <p className="text-green-500">✓ Spotify token present</p>
                            )}
                        </div>
                    )}
                    {!isConnected && (
                        <div className="pt-4">
                            <SpotifyConnectButton />
                        </div>
                    )}
                </div>

                {/* Track Search */}
                {isConnected && (
                    <div className="border border-border rounded-lg p-6 space-y-4">
                        <h2 className="text-2xl font-semibold">Track Search</h2>
                        <TrackSearch
                            onTrackSelect={handleTrackSelect}
                            placeholder="Search for tracks on Spotify..."
                        />
                    </div>
                )}

                {/* Selected Tracks */}
                {selectedTracks.length > 0 && (
                    <div className="border border-border rounded-lg p-6 space-y-4">
                        <h2 className="text-2xl font-semibold">Selected Tracks</h2>
                        <div className="space-y-2">
                            {selectedTracks.map((track, index) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
                                    {track.album.images[0] && (
                                        <img
                                            src={track.album.images[0].url}
                                            alt={track.album.name}
                                            className="w-12 h-12 rounded"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{track.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {track.artists.map(a => a.name).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Playlist Import */}
                {isConnected && (
                    <div className="border border-border rounded-lg p-6 space-y-4">
                        <h2 className="text-2xl font-semibold">Playlist Import</h2>
                        <PlaylistImport
                            onImportComplete={(playlistId) => {
                                console.log('Imported playlist:', playlistId);
                                alert(`Playlist imported! ID: ${playlistId}`);
                            }}
                        />
                    </div>
                )}

                {/* Instructions */}
                <div className="border border-border rounded-lg p-6 space-y-4 bg-muted/50">
                    <h2 className="text-2xl font-semibold">Test Instructions</h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Click &quot;Connect Spotify&quot; to start OAuth flow</li>
                        <li>Authorize the app in Spotify</li>
                        <li>You&apos;ll be redirected back here</li>
                        <li>Try searching for tracks</li>
                        <li>Try importing a playlist</li>
                    </ol>
                    <div className="pt-4 text-sm text-muted-foreground">
                        <p><strong>Note:</strong> Make sure you have:</p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                            <li>Added credentials to .env.local</li>
                            <li>Whitelisted redirect URI in Spotify Dashboard</li>
                            <li>Restarted the dev server after adding env vars</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
