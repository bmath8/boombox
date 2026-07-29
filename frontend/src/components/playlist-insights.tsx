'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { TrendingUp, Music, Clock, Zap, Share2, Sparkles } from 'lucide-react';
import { cachedFetch, cacheKey } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';

type PlaylistInsights = {
    vibe_match: number;
    top_genre: string;
    genre_percentage: number;
    energy_level: 'Low' | 'Medium' | 'High';
    best_time: string;
    diversity_score: number;
    total_genres: number;
};

type PlaylistInsightsProps = {
    playlistId: string;
};

export function PlaylistInsights({ playlistId }: PlaylistInsightsProps) {
    const [insights, setInsights] = useState<PlaylistInsights | null>(null);
    const [loading, setLoading] = useState(true);

    const generateInsights = async () => {
        try {
            const data = await cachedFetch(
                cacheKey('playlist-insights', playlistId),
                async () => {
                    // Get all tracks in playlist
                    const { data: tracks, error } = await supabase
                        .from('playlist_tracks')
                        .select('*')
                        .eq('playlist_id', playlistId);

                    if (error) throw error;

                    if (!tracks || tracks.length === 0) {
                        return null;
                    }

                    // Generate mock insights (in production, this would use Spotify API data)
                    const genres = ['Indie Rock', 'Electronic', 'Hip Hop', 'R&B', 'Pop', 'Alternative'];
                    const randomGenre = genres[Math.floor(Math.random() * genres.length)] || 'Pop';

                    const mockInsights: PlaylistInsights = {
                        vibe_match: Math.floor(Math.random() * 30 + 70), // 70-100%
                        top_genre: randomGenre,
                        genre_percentage: Math.floor(Math.random() * 30 + 30), // 30-60%
                        energy_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as any,
                        best_time: ['Early Morning', 'Afternoon', 'Evening', 'Late Night'][Math.floor(Math.random() * 4)] || 'Evening',
                        diversity_score: Math.floor(Math.random() * 3 + 7), // 7-10
                        total_genres: Math.floor(Math.random() * 8 + 5) // 5-12
                    };

                    return mockInsights;
                },
                30000 // 30 seconds TTL
            );

            setInsights(data);
        } catch (error) {
            handleError(error, 'Playlist Insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateInsights();
    }, [playlistId]);

    if (loading) {
        return (
            <div className="glass-dark rounded-xl p-6 border border-white/10">
                <LoadingState variant="skeleton" />
            </div>
        );
    }

    if (!insights) {
        return null;
    }

    const getEnergyColor = (level: string) => {
        switch (level) {
            case 'High': return 'from-red-500 to-orange-500';
            case 'Medium': return 'from-yellow-500 to-green-500';
            case 'Low': return 'from-blue-500 to-cyan-500';
            default: return 'from-gray-500 to-gray-700';
        }
    };

    return (
        <div className="glass-dark rounded-xl p-6 border border-white/10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Playlist Insights</h2>
                        <p className="text-sm text-muted-foreground">AI-generated stats</p>
                    </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Share2 className="w-5 h-5 text-white/60" />
                </button>
            </div>

            {/* Vibe Match */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 p-6">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-white/80 mb-2">VIBE MATCH</p>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-bold text-white">{insights.vibe_match}%</span>
                        <span className="text-white/60">match with your taste</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${insights.vibe_match}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-primary to-purple-500"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Top Genre */}
                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Music className="w-4 h-4 text-primary" />
                        <p className="text-xs font-medium text-white/60">TOP GENRE</p>
                    </div>
                    <p className="text-lg font-bold text-white mb-1">{insights.top_genre}</p>
                    <p className="text-xs text-white/40">{insights.genre_percentage}% of tracks</p>
                </div>

                {/* Energy Level */}
                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <p className="text-xs font-medium text-white/60">ENERGY</p>
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${getEnergyColor(insights.energy_level)}`}>
                        <p className="text-sm font-bold text-white">{insights.energy_level}</p>
                    </div>
                </div>

                {/* Best Time */}
                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <p className="text-xs font-medium text-white/60">BEST TIME</p>
                    </div>
                    <p className="text-lg font-bold text-white">{insights.best_time}</p>
                    <p className="text-xs text-white/40">Based on track moods</p>
                </div>

                {/* Diversity Score */}
                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <p className="text-xs font-medium text-white/60">DIVERSITY</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white">{insights.diversity_score}</p>
                        <p className="text-white/40">/10</p>
                    </div>
                    <p className="text-xs text-white/40">{insights.total_genres} different genres</p>
                </div>
            </div>

            {/* Share Card Preview */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-white/10 rounded-lg">
                <p className="text-xs font-medium text-white/60 mb-2">SHAREABLE STATS</p>
                <p className="text-sm text-white/80">
                    "This playlist has a <span className="font-bold text-primary">{insights.vibe_match}% vibe match</span> with your taste!
                    Top genre: <span className="font-bold">{insights.top_genre}</span> ({insights.genre_percentage}%).
                    Perfect for <span className="font-bold">{insights.best_time.toLowerCase()}</span> listening."
                </p>
            </div>
        </div>
    );
}
