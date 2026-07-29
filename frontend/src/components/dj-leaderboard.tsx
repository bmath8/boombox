'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Users, Radio, Heart, Star, TrendingUp,
    Medal, Crown, Flame
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';

interface DJStats {
    user_id: string;
    display_name: string;
    avatar_url: string;
    total_listeners: number;
    total_broadcasts: number;
    peak_listeners: number;
    total_reactions: number;
    follower_count: number;
    rank: number;
}

type TimeRange = 'today' | 'week' | 'month' | 'allTime';

export function DJLeaderboard() {
    const [leaderboard, setLeaderboard] = useState<DJStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [sortBy, setSortBy] = useState<'listeners' | 'broadcasts' | 'reactions'>('listeners');

    useEffect(() => {
        fetchLeaderboard();
    }, [timeRange, sortBy]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            // Get top stations by listener count
            const { data: stationStats, error: stationError } = await supabase
                .from('radio_stations')
                .select(`
                    station_id,
                    broadcaster_id,
                    listener_count,
                    peak_listeners,
                    users!broadcaster_id (
                        user_id,
                        display_name,
                        avatar_url
                    )
                `)
                .order('listener_count', { ascending: false })
                .limit(50);

            if (stationError) throw stationError;

            // Aggregate stats by broadcaster
            const broadcasterMap = new Map<string, DJStats>();
            // Keep track of station IDs for reaction counts
            const stationIds: string[] = [];

            (stationStats || []).forEach((stationRaw: any) => {
                const broadcasterId = stationRaw.broadcaster_id;
                const existing = broadcasterMap.get(broadcasterId);

                if (stationRaw.station_id) {
                    stationIds.push(stationRaw.station_id);
                }

                // Handle users being either object or array (Supabase join quirks)
                const userData = Array.isArray(stationRaw.users) ? stationRaw.users[0] : stationRaw.users;

                if (existing) {
                    existing.total_listeners += stationRaw.listener_count || 0;
                    existing.total_broadcasts += 1;
                    existing.peak_listeners = Math.max(existing.peak_listeners, stationRaw.peak_listeners || 0);
                } else {
                    broadcasterMap.set(broadcasterId, {
                        user_id: broadcasterId,
                        display_name: userData?.display_name || 'Anonymous DJ',
                        avatar_url: userData?.avatar_url || '',
                        total_listeners: stationRaw.listener_count || 0,
                        total_broadcasts: 1, // Start with 1 confirmed broadcast
                        peak_listeners: stationRaw.peak_listeners || 0,
                        total_reactions: 0,
                        follower_count: 0,
                        rank: 0
                    });
                }
            });

            // Convert to array
            let sortedLeaderboard = Array.from(broadcasterMap.values());

            // Fetch extra social stats for these top DJs
            // We do this in parallel for performance
            const enrichedLeaderboard = await Promise.all(
                sortedLeaderboard.map(async (dj) => {
                    // 1. Get real follower count using RPC
                    const { data: followerCount } = await supabase.rpc('get_follower_count', {
                        target_dj_id: dj.user_id
                    });

                    // 2. Get total reactions for this DJ's stations
                    // Find all stations belonging to this DJ from our initial fetch
                    const djStations = (stationStats || [])
                        .filter((s: any) => s.broadcaster_id === dj.user_id)
                        .map((s: any) => s.station_id);

                    let reactionCount = 0;
                    if (djStations.length > 0) {
                        try {
                            const { count, error } = await supabase
                                .from('chat_reactions')
                                .select('message_id, radio_chat_messages!inner(station_id)', { count: 'exact', head: true })
                                .in('radio_chat_messages.station_id', djStations);

                            if (!error) {
                                reactionCount = count || 0;
                            }
                        } catch (err) {
                            console.warn('Failed to fetch reaction count for DJ', dj.user_id, err);
                        }
                    }

                    return {
                        ...dj,
                        follower_count: followerCount || 0,
                        // To make the UI look alive for demo if data is empty, we might want real data.
                        // But I'll stick to 0 to be honest to the DB.
                        total_reactions: reactionCount
                    };
                })
            );

            sortedLeaderboard = enrichedLeaderboard;

            // Sort logic
            switch (sortBy) {
                case 'listeners':
                    sortedLeaderboard.sort((a, b) => b.total_listeners - a.total_listeners);
                    break;
                case 'broadcasts':
                    sortedLeaderboard.sort((a, b) => b.total_broadcasts - a.total_broadcasts);
                    break;
                case 'reactions':
                    // Secondary sort by listeners if reactions equal
                    sortedLeaderboard.sort((a, b) => (b.total_reactions - a.total_reactions) || (b.total_listeners - a.total_listeners));
                    break;
            }

            // Assign ranks
            sortedLeaderboard = sortedLeaderboard.map((dj, index) => ({
                ...dj,
                rank: index + 1
            }));

            setLeaderboard(sortedLeaderboard.slice(0, 10)); // Top 10
        } catch (error) {
            handleError(error, 'DJLeaderboard');
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-5 h-5 text-yellow-400" />;
            case 2:
                return <Medal className="w-5 h-5 text-gray-300" />;
            case 3:
                return <Medal className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getRankBorder = (rank: number) => {
        switch (rank) {
            case 1:
                return 'border-yellow-400/50 bg-yellow-400/5';
            case 2:
                return 'border-gray-300/50 bg-gray-300/5';
            case 3:
                return 'border-amber-600/50 bg-amber-600/5';
            default:
                return 'border-white/10 bg-white/5';
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    DJ Leaderboard
                </h3>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    <div className="flex bg-white/5 rounded-lg p-1">
                        {(['today', 'week', 'month', 'allTime'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${timeRange === range
                                    ? 'bg-primary text-white'
                                    : 'text-muted-foreground hover:text-white'
                                    }`}
                            >
                                {range === 'allTime' ? 'All Time' : range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-white/5 rounded-lg p-1">
                        {(['listeners', 'broadcasts', 'reactions'] as const).map((sort) => (
                            <button
                                key={sort}
                                onClick={() => setSortBy(sort)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${sortBy === sort
                                    ? 'bg-white/20 text-white'
                                    : 'text-muted-foreground hover:text-white'
                                    }`}
                            >
                                {sort.charAt(0).toUpperCase() + sort.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <LoadingState variant="skeleton" />
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No DJs have broadcast yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {leaderboard.map((dj, index) => (
                                <motion.div
                                    key={dj.user_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center gap-3 p-3 rounded-xl border ${getRankBorder(dj.rank)}`}
                                >
                                    {/* Rank */}
                                    <div className="w-8 flex justify-center">
                                        {getRankIcon(dj.rank)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                                        {dj.avatar_url ? (
                                            <img src={dj.avatar_url} alt={dj.display_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white/50">
                                                {dj.display_name[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{dj.display_name}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {dj.total_listeners}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Radio className="w-3 h-3" />
                                                {dj.total_broadcasts}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3" />
                                                Peak: {dj.peak_listeners}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Hot streak indicator for top 3 */}
                                    {dj.rank <= 3 && (
                                        <div className="flex items-center gap-1 text-orange-400">
                                            <Flame className="w-4 h-4" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
