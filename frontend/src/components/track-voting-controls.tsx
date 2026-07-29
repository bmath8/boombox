import React, { useState, useEffect, useCallback } from 'react';
import { Flame, SkipForward, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';

interface TrackVotingControlsProps {
    stationId: string;
    trackId: string;
    currentUserId: string | null;
    onSkipThresholdReached?: () => void;
}

interface VoteStats {
    fire_count: number;
    skip_count: number;
    total_votes: number;
    skip_percentage: number;
}

export function TrackVotingControls({
    stationId,
    trackId,
    currentUserId,
    onSkipThresholdReached
}: TrackVotingControlsProps) {
    const [userVote, setUserVote] = useState<'fire' | 'skip' | null>(null);
    const [voteStats, setVoteStats] = useState<VoteStats>({
        fire_count: 0,
        skip_count: 0,
        total_votes: 0,
        skip_percentage: 0
    });
    const [isVoting, setIsVoting] = useState(false);

    const fetchVotes = useCallback(async () => {
        try {
            // Get vote counts
            const { data: votes, error } = await supabase
                .from('track_votes')
                .select('vote_type')
                .eq('station_id', stationId)
                .eq('track_id', trackId);

            if (error) throw error;

            const fireCount = votes?.filter(v => v.vote_type === 'fire').length || 0;
            const skipCount = votes?.filter(v => v.vote_type === 'skip').length || 0;
            const total = fireCount + skipCount;
            const skipPct = total > 0 ? (skipCount / total) * 100 : 0;

            setVoteStats({
                fire_count: fireCount,
                skip_count: skipCount,
                total_votes: total,
                skip_percentage: skipPct
            });

            // Check skip threshold (e.g., 50%)
            if (skipPct >= 50 && total >= 3 && onSkipThresholdReached) {
                onSkipThresholdReached();
            }

            // Get user's vote
            if (currentUserId) {
                const { data: myVote } = await supabase
                    .from('track_votes')
                    .select('vote_type')
                    .eq('station_id', stationId)
                    .eq('track_id', trackId)
                    .eq('user_id', currentUserId)
                    .single();

                if (myVote) {
                    setUserVote(myVote.vote_type as 'fire' | 'skip');
                } else {
                    setUserVote(null);
                }
            }
        } catch (error) {
            handleError(error, 'FetchVotes');
        }
    }, [stationId, trackId, currentUserId, onSkipThresholdReached]);

    useEffect(() => {
        fetchVotes();

        // Subscribe to vote changes
        const subscription = supabase
            .channel(`votes:${stationId}:${trackId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'track_votes',
                    filter: `station_id=eq.${stationId}`
                },
                () => {
                    fetchVotes();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [stationId, trackId, fetchVotes]);

    const handleVote = async (type: 'fire' | 'skip') => {
        if (!currentUserId || isVoting) return;
        setIsVoting(true);

        try {
            if (userVote === type) {
                // Remove vote
                const { error } = await supabase
                    .from('track_votes')
                    .delete()
                    .eq('station_id', stationId)
                    .eq('track_id', trackId)
                    .eq('user_id', currentUserId);

                if (error) throw error;
                setUserVote(null);
            } else {
                // Add/Update vote
                const { error } = await supabase
                    .from('track_votes')
                    .upsert({
                        station_id: stationId,
                        track_id: trackId,
                        user_id: currentUserId,
                        vote_type: type
                    });

                if (error) throw error;
                setUserVote(type);
            }

            await fetchVotes();
        } catch (error) {
            handleError(error, 'Vote');
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
            {/* Fire Vote */}
            <div className="flex items-center gap-2">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote('fire')}
                    disabled={!currentUserId}
                    className={`p-2 rounded-full transition-colors ${userVote === 'fire'
                            ? 'bg-orange-500/20 text-orange-500'
                            : 'hover:bg-white/10 text-white/60 hover:text-orange-400'
                        }`}
                >
                    <Flame className={`w-5 h-5 ${userVote === 'fire' ? 'fill-current' : ''}`} />
                </motion.button>
                <span className="text-sm font-medium text-white/80">{voteStats.fire_count}</span>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Skip Vote */}
            <div className="flex items-center gap-2">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote('skip')}
                    disabled={!currentUserId}
                    className={`p-2 rounded-full transition-colors ${userVote === 'skip'
                            ? 'bg-blue-500/20 text-blue-500'
                            : 'hover:bg-white/10 text-white/60 hover:text-blue-400'
                        }`}
                >
                    <SkipForward className="w-5 h-5" />
                </motion.button>
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-white/80">{voteStats.skip_count}</span>
                    {voteStats.skip_percentage > 0 && (
                        <span className="text-[10px] text-white/40">
                            {Math.round(voteStats.skip_percentage)}% skip
                        </span>
                    )}
                </div>
            </div>

            {/* Skip Progress Bar */}
            {voteStats.skip_percentage > 0 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 overflow-hidden rounded-b-full">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${voteStats.skip_percentage}%` }}
                        className={`h-full ${voteStats.skip_percentage >= 50 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                    />
                </div>
            )}
        </div>
    );
}
