'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Plus, Music2, Users, TrendingUp } from 'lucide-react';
import { CollaborativePlaylistCreator } from '@/components/collaborative-playlist-creator';
import { PlaylistChallenges } from '@/components/playlist-challenges';
import { CuratorStats } from '@/components/curator-stats';
import { PlaylistCardSkeletons } from '@/components/ui/skeletons/playlist-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

type Playlist = {
    playlist_id: string;
    playlist_name: string;
    description: string;
    theme: string;
    total_tracks: number;
    total_collaborators: number;
    total_plays: number;
    created_at: string;
};

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreator, setShowCreator] = useState(false);

    const fetchPlaylists = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get playlists where user is a collaborator
        const { data: collaboratorData } = await supabase
            .from('playlist_collaborators')
            .select('playlist_id')
            .eq('user_id', user.id);

        if (collaboratorData && collaboratorData.length > 0) {
            const playlistIds = collaboratorData.map(c => c.playlist_id);

            const { data, error } = await supabase
                .from('collaborative_playlists')
                .select('*')
                .in('playlist_id', playlistIds)
                .order('created_at', { ascending: false });

            if (data) {
                setPlaylists(data);
            }
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const handlePlaylistCreated = (playlistId: string) => {
        fetchPlaylists();
        // Navigate to the new playlist
        window.location.href = `/playlists/${playlistId}`;
    };

    const themeEmojis: Record<string, string> = {
        road_trip: '🚗',
        workout: '💪',
        party: '🎉',
        chill: '😴',
        custom: '🎵'
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white pb-20">
                {/* Header */}
                <header className="fixed top-0 left-0 right-0 h-16 glass-dark z-50 flex items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/20 rounded-full">
                            <Music2 className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-xl tracking-wider bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">BOOMBOX</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-xs font-medium">JD</span>
                    </div>
                </header>

                {/* Main Content */}
                <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Collaborative Playlists</h1>
                            <p className="text-white/60">Create and share playlists with friends</p>
                        </div>
                        <button
                            disabled
                            className="flex items-center gap-2 px-6 py-3 bg-primary/50 rounded-full font-semibold cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            Create Playlist
                        </button>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Playlists Skeleton */}
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PlaylistCardSkeletons count={4} />
                            </div>
                        </div>

                        {/* Right Column: Challenges & Stats */}
                        <div className="space-y-6">
                            <div className="glass-dark rounded-xl p-6 space-y-4">
                                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
                                <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                                <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white pb-20">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 glass-dark z-50 flex items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/20 rounded-full">
                        <Music2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">FAM MUSIC</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xs font-medium">JD</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Collaborative Playlists</h1>
                        <p className="text-white/60">Create and share playlists with friends</p>
                    </div>
                    <button
                        onClick={() => setShowCreator(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 rounded-full font-semibold transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Playlist
                    </button>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Playlists */}
                    <div className="lg:col-span-2">
                        {/* Playlists Grid */}
                        {playlists.length === 0 ? (
                            <EmptyState
                                icon={<Music2 className="w-16 h-16" />}
                                title="No playlists yet"
                                description="Create your first collaborative playlist and start sharing music with friends!"
                                action={
                                    <button
                                        onClick={() => setShowCreator(true)}
                                        className="px-6 py-3 bg-primary hover:bg-primary/80 rounded-full font-semibold transition-colors"
                                    >
                                        Get Started
                                    </button>
                                }
                            />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {playlists.map((playlist, index) => (
                                    <Link key={playlist.playlist_id} href={`/playlists/${playlist.playlist_id}`}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="group glass-dark rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            {/* Theme Icon */}
                                            <div className="w-full aspect-square bg-gradient-to-br from-primary/40 to-primary/20 rounded-lg mb-4 flex items-center justify-center text-6xl">
                                                {themeEmojis[playlist.theme] || '🎵'}
                                            </div>

                                            {/* Playlist Info */}
                                            <h3 className="text-xl font-bold mb-2 truncate group-hover:text-primary transition-colors">
                                                {playlist.playlist_name}
                                            </h3>
                                            {playlist.description && (
                                                <p className="text-sm text-white/60 mb-4 line-clamp-2">
                                                    {playlist.description}
                                                </p>
                                            )}

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 text-xs text-white/40">
                                                <span className="flex items-center gap-1">
                                                    <Music2 className="w-3 h-3" />
                                                    {playlist.total_tracks}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {playlist.total_collaborators}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    {playlist.total_plays}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Challenges & Stats */}
                    <div className="space-y-6">
                        <CuratorStats />
                        <PlaylistChallenges />
                    </div>
                </div>
            </div>

            {/* Creator Modal */}
            <CollaborativePlaylistCreator
                isOpen={showCreator}
                onClose={() => setShowCreator(false)}
                onPlaylistCreated={handlePlaylistCreated}
            />
        </div>
    );
}
