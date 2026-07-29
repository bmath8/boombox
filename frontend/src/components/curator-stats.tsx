'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Music, Users, Heart } from 'lucide-react';
import { cachedFetch, cacheKey } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';

import { PlaylistTrack } from '@/lib/types';

type CuratorStatsData = {
    total_playlists_created: number;
    total_tracks_added: number;
    total_upvotes_received: number;
};

interface CuratorStatsProps {
    tracks?: PlaylistTrack[];
}

export function CuratorStats({ tracks }: CuratorStatsProps = {}) {
    const [stats, setStats] = useState<CuratorStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const data = await cachedFetch(
                    cacheKey('curator-stats', user.id),
                    async () => {
                        const { data, error } = await supabase
                            .from('curator_stats')
                            .select('total_playlists_created, total_tracks_added, total_upvotes_received')
                            .eq('user_id', user.id)
                            .single();

                        if (error && error.code !== 'PGRST116') throw error;
                        return data;
                    },
                    30000 // 30 second cache
                );

                if (data) setStats(data);
            } catch (error) {
                handleError(error, 'Fetch Curator Stats', false);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="glass-dark rounded-xl p-6 border border-white/10">
                <LoadingState variant="skeleton" />
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-xl p-6 border border-white/10 space-y-4">
            <h2 className="text-xl font-bold text-white">Your Stats</h2>

            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Music className="w-4 h-4 text-primary" />
                        <p className="text-xs font-medium text-white/60">PLAYLISTS</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_playlists_created}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <p className="text-xs font-medium text-white/60">TRACKS</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_tracks_added}</p>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-green-400" />
                        <p className="text-xs font-medium text-white/60">UPVOTES</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_upvotes_received}</p>
                </div>
            </div>
        </div>
    );
}
