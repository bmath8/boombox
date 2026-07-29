'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Trophy, Flame, TrendingUp, Award, Star } from 'lucide-react';
import { cachedFetch, cacheKey, requestCache } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';

type DJStats = {
    total_points: number;
    total_plays: number;
    total_fires: number;
    total_skips: number;
    fire_rate: number;
    level: number;
    unlocked_badges: string[];
};

type DJProfileCardProps = {
    userId: string;
    displayName: string;
    compact?: boolean;
};

const LEVEL_TITLES = {
    1: 'Rookie DJ',
    6: 'Rising Star',
    11: 'Headliner',
    21: 'Legend'
};

const LEVEL_COLORS = {
    1: 'from-gray-500 to-gray-700',
    6: 'from-blue-500 to-purple-500',
    11: 'from-purple-500 to-pink-500',
    21: 'from-yellow-500 to-orange-500'
};

export function DJProfileCard({ userId, displayName, compact = false }: DJProfileCardProps) {
    const [stats, setStats] = useState<DJStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await cachedFetch(
                    cacheKey('dj-stats', userId),
                    async () => {
                        const { data, error } = await supabase
                            .from('dj_stats')
                            .select('*')
                            .eq('user_id', userId)
                            .single();

                        if (error && error.code !== 'PGRST116') throw error;

                        if (data) {
                            return data;
                        } else {
                            // Initialize default stats if none exist
                            return {
                                total_points: 0,
                                total_plays: 0,
                                total_fires: 0,
                                total_skips: 0,
                                fire_rate: 0,
                                level: 1,
                                unlocked_badges: []
                            };
                        }
                    },
                    60000 // 1 minute TTL
                );

                setStats(data);
            } catch (error) {
                handleError(error, 'DJ Profile Stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Subscribe to stats updates
        const subscription = supabase
            .channel(`dj_stats:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'dj_stats',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    // Invalidate cache on update so next fetch gets fresh data
                    requestCache.invalidate(cacheKey('dj-stats', userId));
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    if (loading || !stats) {
        return (
            <div className="glass-dark rounded-xl p-4 border border-white/10">
                <LoadingState variant="skeleton" />
            </div>
        );
    }

    const getLevelTitle = (level: number): string => {
        if (level >= 21) return LEVEL_TITLES[21];
        if (level >= 11) return LEVEL_TITLES[11];
        if (level >= 6) return LEVEL_TITLES[6];
        return LEVEL_TITLES[1];
    };

    const getLevelColor = (level: number): string => {
        if (level >= 21) return LEVEL_COLORS[21];
        if (level >= 11) return LEVEL_COLORS[11];
        if (level >= 6) return LEVEL_COLORS[6];
        return LEVEL_COLORS[1];
    };

    const getNextLevelPoints = (level: number): number => {
        if (level >= 21) return 10000;
        if (level >= 11) return 5000;
        if (level >= 6) return 2500;
        return 1000;
    };

    const nextLevelPoints = getNextLevelPoints(stats.level);
    const progressToNextLevel = (stats.total_points / nextLevelPoints) * 100;

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-3 glass-dark rounded-lg border border-white/10">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getLevelColor(stats.level)} flex items-center justify-center text-white font-bold text-lg`}>
                    {stats.level}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{getLevelTitle(stats.level)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{stats.total_points} pts</p>
                    <p className="text-xs text-muted-foreground">{stats.fire_rate.toFixed(0)}% 🔥</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-xl p-6 border border-white/10 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">{displayName}</h3>
                    <p className="text-sm text-primary font-medium">{getLevelTitle(stats.level)}</p>
                </div>
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor(stats.level)} flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl font-bold text-white">{stats.level}</span>
                </div>
            </div>

            {/* Level Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Level {stats.level}</span>
                    <span>{stats.total_points} / {nextLevelPoints} pts</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full bg-gradient-to-r ${getLevelColor(stats.level)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">Total Plays</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.total_plays}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-muted-foreground">Fire Rate</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.fire_rate.toFixed(1)}%</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-muted-foreground">Total Fires</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.total_fires}</p>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Points</span>
                    </div>
                    <p className="text-xl font-bold text-white">{stats.total_points}</p>
                </div>
            </div>

            {/* Badges */}
            {stats.unlocked_badges.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Badges</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {stats.unlocked_badges.slice(0, 6).map((badge, index) => (
                            <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-xs"
                                title={badge}
                            >
                                🏆
                            </div>
                        ))}
                        {stats.unlocked_badges.length > 6 && (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-muted-foreground">
                                +{stats.unlocked_badges.length - 6}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
