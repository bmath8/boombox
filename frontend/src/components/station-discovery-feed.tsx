'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, Users, Play, Heart, Sparkles, TrendingUp,
    Clock, Music, Filter, Search, RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';
import { useRouter } from 'next/navigation';
import { FollowButton } from '@/components/follow-button';
import { LoadingState } from '@/components/ui/loading-state';

interface DiscoveryStation {
    station_id: string;
    station_name: string;
    broadcaster_id: string;
    listener_count: number;
    current_track?: {
        name: string;
        artist: string;
        album_art?: string;
    };
    broadcaster: {
        display_name: string;
        avatar_url: string | undefined;
    };
    genre?: string;
    isLive: boolean;
    startedAt: string | undefined;
}

type DiscoveryFilter = 'trending' | 'live' | 'following' | 'recommended';

export function StationDiscoveryFeed() {
    const router = useRouter();
    const [stations, setStations] = useState<DiscoveryStation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<DiscoveryFilter>('trending');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStations();
    }, [filter]);

    const fetchStations = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('radio_stations')
                .select(`
                    station_id,
                    station_name,
                    broadcaster_id,
                    listener_count,
                    status,
                    current_track_uri,
                    went_live_at
                `);

            // Apply filters
            switch (filter) {
                case 'live':
                    query = query.eq('status', 'live');
                    break;
                case 'trending':
                    query = query.eq('status', 'live').order('listener_count', { ascending: false });
                    break;
                case 'following':
                    // Get followed DJs first
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { data: follows } = await supabase
                            .from('dj_follows')
                            .select('dj_id')
                            .eq('follower_id', user.id);

                        if (follows && follows.length > 0) {
                            const djIds = follows.map(f => f.dj_id);
                            query = query.in('broadcaster_id', djIds);
                        }
                    }
                    break;
                case 'recommended':
                    // For now, just show random live stations
                    query = query.eq('status', 'live').limit(10);
                    break;
            }

            const { data: stationsData, error: stationsError } = await query.limit(20);

            if (stationsError) throw stationsError;

            // Manually fetch broadcaster details to avoid relationship error
            const broadcasterIds = Array.from(new Set((stationsData || []).map((s: any) => s.broadcaster_id)));

            const broadcastersMap = new Map<string, { display_name: string; avatar_url?: string }>();

            if (broadcasterIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('user_id, display_name, avatar_url')
                    .in('user_id', broadcasterIds);

                if (!usersError && usersData) {
                    usersData.forEach((u: any) => {
                        broadcastersMap.set(u.user_id, {
                            display_name: u.display_name,
                            avatar_url: u.avatar_url
                        });
                    });
                }
            }

            const formattedStations: DiscoveryStation[] = (stationsData || []).map((station: any) => {
                const broadcaster = broadcastersMap.get(station.broadcaster_id) || {
                    display_name: 'Anonymous DJ',
                    avatar_url: undefined
                };

                return {
                    station_id: station.station_id,
                    station_name: station.station_name,
                    broadcaster_id: station.broadcaster_id,
                    listener_count: station.listener_count || 0,
                    broadcaster: {
                        display_name: broadcaster.display_name,
                        avatar_url: broadcaster.avatar_url
                    },
                    isLive: station.status === 'live',
                    startedAt: station.went_live_at
                };
            });

            setStations(formattedStations);
        } catch (error) {
            handleError(error, 'StationDiscovery');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStations();
        setRefreshing(false);
    };

    const handleJoinStation = (stationId: string) => {
        router.push(`/radio?station=${stationId}`);
    };

    const filteredStations = stations.filter(station => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            station.station_name.toLowerCase().includes(query) ||
            station.broadcaster.display_name.toLowerCase().includes(query)
        );
    });

    const getTimeLive = (startedAt?: string) => {
        if (!startedAt) return '';
        const diff = Date.now() - new Date(startedAt).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        return `${hours}h ${mins % 60}m`;
    };

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Discover Stations
                    </h3>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stations or DJs..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {([
                        { key: 'trending', icon: TrendingUp, label: 'Trending' },
                        { key: 'live', icon: Radio, label: 'Live Now' },
                        { key: 'following', icon: Heart, label: 'Following' },
                        { key: 'recommended', icon: Sparkles, label: 'For You' }
                    ] as const).map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${filter === key
                                ? 'bg-primary text-white'
                                : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <LoadingState variant="skeleton" />
                ) : filteredStations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No stations found</p>
                        {filter === 'following' && (
                            <p className="text-xs mt-1">Follow some DJs to see their stations here!</p>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence mode="popLayout">
                            {filteredStations.map((station, index) => (
                                <motion.div
                                    key={station.station_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-pointer"
                                    onClick={() => handleJoinStation(station.station_id)}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Album Art / Avatar */}
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 relative">
                                            {station.broadcaster.avatar_url ? (
                                                <img
                                                    src={station.broadcaster.avatar_url}
                                                    alt={station.broadcaster.display_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Radio className="w-8 h-8 text-white/30" />
                                                </div>
                                            )}

                                            {/* Live indicator */}
                                            {station.isLive && (
                                                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white">
                                                    LIVE
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-white truncate">
                                                {station.station_name}
                                            </h4>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {station.broadcaster.display_name}
                                            </p>

                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {station.listener_count}
                                                </span>
                                                {station.startedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {getTimeLive(station.startedAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <FollowButton
                                                djId={station.broadcaster_id}
                                                djName={station.broadcaster.display_name}
                                                size="sm"
                                            />
                                            <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                                                <Play className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
