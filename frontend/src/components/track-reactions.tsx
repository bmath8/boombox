'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { cachedFetch, cacheKey, requestCache } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';

type ReactionType = 'fire' | 'heart' | 'cry' | 'laugh' | 'mind_blown';

type ReactionCounts = {
    fire: number;
    heart: number;
    cry: number;
    laugh: number;
    mind_blown: number;
};

type UserReactions = Set<ReactionType>;

type TrackReactionsProps = {
    playlistId: string;
    trackId: string;
    currentUserId: string | null;
};

const REACTIONS = [
    { type: 'fire' as ReactionType, emoji: '🔥', label: 'Fire' },
    { type: 'heart' as ReactionType, emoji: '❤️', label: 'Love' },
    { type: 'cry' as ReactionType, emoji: '😭', label: 'Cry' },
    { type: 'laugh' as ReactionType, emoji: '😂', label: 'Laugh' },
    { type: 'mind_blown' as ReactionType, emoji: '🤯', label: 'Mind Blown' },
];

export function TrackReactions({ playlistId, trackId, currentUserId }: TrackReactionsProps) {
    const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
        fire: 0,
        heart: 0,
        cry: 0,
        laugh: 0,
        mind_blown: 0
    });
    const [userReactions, setUserReactions] = useState<UserReactions>(new Set());
    const [isReacting, setIsReacting] = useState(false);

    const fetchReactions = useCallback(async () => {
        try {
            const allReactions = await cachedFetch(
                cacheKey('track-reactions', trackId),
                async () => {
                    const { data, error } = await supabase
                        .from('track_reactions')
                        .select('reaction_type, user_id')
                        .eq('playlist_id', playlistId)
                        .eq('track_id', trackId);

                    if (error) throw error;

                    // Type for Supabase reaction response
                    interface ReactionData {
                        reaction_type: string;
                        user_id: string;
                    }
                    return data as unknown as ReactionData[];
                },
                10000 // 10s TTL
            );

            if (allReactions) {
                // Count reactions by type
                const counts: ReactionCounts = {
                    fire: 0,
                    heart: 0,
                    cry: 0,
                    laugh: 0,
                    mind_blown: 0
                };

                const userReactionSet = new Set<ReactionType>();

                allReactions.forEach((reaction) => {
                    if (counts.hasOwnProperty(reaction.reaction_type)) {
                        counts[reaction.reaction_type as ReactionType]++;
                    }
                    if (currentUserId && reaction.user_id === currentUserId) {
                        userReactionSet.add(reaction.reaction_type as ReactionType);
                    }
                });

                setReactionCounts(counts);
                setUserReactions(userReactionSet);
            }
        } catch (error) {
            handleError(error, 'Fetch Reactions', false);
        }
    }, [playlistId, trackId, currentUserId]);

    useEffect(() => {
        fetchReactions();

        // Subscribe to reaction changes
        const subscription = supabase
            .channel(`reactions:${trackId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'track_reactions',
                    filter: `track_id=eq.${trackId}`
                },
                () => {
                    // Invalidate cache on update
                    requestCache.invalidate(cacheKey('track-reactions', trackId));
                    fetchReactions();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [trackId, fetchReactions]);

    const handleReaction = async (reactionType: ReactionType) => {
        if (!currentUserId || isReacting) return;

        setIsReacting(true);

        const hasReaction = userReactions.has(reactionType);

        if (hasReaction) {
            // Remove reaction
            const { error } = await supabase
                .from('track_reactions')
                .delete()
                .eq('playlist_id', playlistId)
                .eq('track_id', trackId)
                .eq('user_id', currentUserId)
                .eq('reaction_type', reactionType);

            if (!error) {
                requestCache.invalidate(cacheKey('track-reactions', trackId));
                fetchReactions();
            }
        } else {
            // Add reaction
            const { error } = await supabase.rpc('add_track_reaction', {
                p_playlist_id: playlistId,
                p_track_id: trackId,
                p_user_id: currentUserId,
                p_reaction_type: reactionType
            });

            if (!error) {
                requestCache.invalidate(cacheKey('track-reactions', trackId));
                fetchReactions();
            }
        }

        setIsReacting(false);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {REACTIONS.map((reaction) => {
                const count = reactionCounts[reaction.type];
                const hasReacted = userReactions.has(reaction.type);

                return (
                    <motion.button
                        key={reaction.type}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReaction(reaction.type)}
                        disabled={!currentUserId || isReacting}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${hasReacted
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={reaction.label}
                        aria-label={`React with ${reaction.label}`}
                    >
                        <span className="text-lg">{reaction.emoji}</span>
                        {count > 0 && (
                            <span className={`text-xs font-semibold ${hasReacted ? 'text-primary' : 'text-white/60'
                                }`}>
                                {count}
                            </span>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
