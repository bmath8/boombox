'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, TrendingUp, Calendar, Users, Check, Sparkles } from 'lucide-react';


type Challenge = {
    challenge_id: string;
    challenge_type: string;
    challenge_name: string;
    challenge_description: string;
    points_reward: number;
    badge_reward: string | null;
};

type ChallengeProgress = {
    challenge_id: string;
    progress: number;
    target: number;
    completed: boolean;
    completed_at: string | null;
};

type ChallengeWithProgress = Challenge & ChallengeProgress;

const CHALLENGE_ICONS: Record<string, any> = {
    theme_master: Star,
    hidden_gem: Sparkles,
    crowd_pleaser: TrendingUp,
    consistency_king: Calendar,
    discovery_champion: Users,
};

const CHALLENGE_COLORS: Record<string, string> = {
    theme_master: 'from-yellow-500 to-orange-500',
    hidden_gem: 'from-purple-500 to-pink-500',
    crowd_pleaser: 'from-green-500 to-teal-500',
    consistency_king: 'from-blue-500 to-cyan-500',
    discovery_champion: 'from-red-500 to-pink-500',
};

interface PlaylistChallengesProps {
    playlistId?: string;
}

export function PlaylistChallenges({ playlistId }: PlaylistChallengesProps = {}) {
    const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState<string | null>(null);

    const fetchChallenges = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Initialize challenges for user
        await supabase.rpc('initialize_user_challenges', { p_user_id: user.id });

        // Get all active challenges
        const { data: challengesData } = await supabase
            .from('playlist_challenges')
            .select('*')
            .eq('is_active', true);

        // Get user progress
        const { data: progressData } = await supabase
            .from('user_challenge_progress')
            .select('*')
            .eq('user_id', user.id);

        if (challengesData && progressData) {
            const combined: ChallengeWithProgress[] = challengesData.map((challenge: Challenge) => {
                const progress = progressData.find(p => p.challenge_id === challenge.challenge_id);
                return {
                    ...challenge,
                    progress: progress?.progress || 0,
                    target: progress?.target || 1,
                    completed: progress?.completed || false,
                    completed_at: progress?.completed_at || null
                };
            });

            setChallenges(combined);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchChallenges();

        // Refresh every 30 seconds
        const interval = setInterval(fetchChallenges, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleClaim = async (challengeId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || claiming) return;

        setClaiming(challengeId);

        const { data, error } = await supabase.rpc('claim_challenge_reward', {
            p_user_id: user.id,
            p_challenge_id: challengeId
        });

        if (!error && data?.success) {
            // Celebration!
            const confetti = (await import('canvas-confetti')).default;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Refresh challenges
            fetchChallenges();
        }

        setClaiming(null);
    };

    if (loading) {
        return (
            <div className="glass-dark rounded-xl p-6 border border-white/10">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-white/10 rounded w-1/3" />
                    <div className="h-24 bg-white/10 rounded" />
                    <div className="h-24 bg-white/10 rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-xl p-6 border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Challenges</h2>
                    <p className="text-sm text-muted-foreground">Complete challenges to earn rewards</p>
                </div>
            </div>

            {/* Challenges List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {challenges.map((challenge) => {
                        const Icon = CHALLENGE_ICONS[challenge.challenge_type] || Trophy;
                        const progressPercent = (challenge.progress / challenge.target) * 100;
                        const canClaim = challenge.completed && !claiming;

                        return (
                            <motion.div
                                key={challenge.challenge_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`relative overflow-hidden rounded-xl border-2 ${challenge.completed
                                    ? 'border-primary bg-primary/10'
                                    : 'border-white/10 bg-white/5'
                                    } p-4`}
                            >
                                {/* Background Gradient */}
                                <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${CHALLENGE_COLORS[challenge.challenge_type] || 'from-gray-500 to-gray-700'
                                    }`} />

                                <div className="relative z-10">
                                    {/* Challenge Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg bg-gradient-to-br ${CHALLENGE_COLORS[challenge.challenge_type] || 'from-gray-500 to-gray-700'
                                                }`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white mb-1">
                                                    {challenge.challenge_name}
                                                </h3>
                                                <p className="text-sm text-white/60">
                                                    {challenge.challenge_description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Reward Badge */}
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                                            <Trophy className="w-4 h-4 text-yellow-400" />
                                            <span className="text-sm font-semibold text-yellow-400">
                                                {challenge.points_reward} pts
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                                            <span>Progress</span>
                                            <span>{challenge.progress} / {challenge.target}</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                className={`h-full bg-gradient-to-r ${CHALLENGE_COLORS[challenge.challenge_type] || 'from-gray-500 to-gray-700'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Claim Button */}
                                    {challenge.completed && (
                                        <button
                                            onClick={() => handleClaim(challenge.challenge_id)}
                                            disabled={claiming === challenge.challenge_id}
                                            className="w-full px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-white/10 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {claiming === challenge.challenge_id ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Claiming...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Claim Reward
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
