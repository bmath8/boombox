'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Users, Heart, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cachedFetch, cacheKey } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';
import { LoadingState } from '@/components/ui/loading-state';
import { CompactEmptyState } from '@/components/ui/empty-state';

type DiscoveryItem = {
    id: string;
    type: 'match' | 'recommendation';
    user?: {
        id: string;
        name: string;
        avatar?: string;
    };
    matchScore?: number;
    sharedArtists?: number;
    timestamp: number;
};

export function DiscoveryFeed() {
    const [items, setItems] = useState<DiscoveryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDiscovery = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const data = await cachedFetch(
                    cacheKey('discovery-feed', user.id),
                    async () => {
                        // 1. Refresh Affinities (Fire and forget)
                        await supabase.rpc('calculate_user_affinities', { target_user_id: user.id });

                        // 2. Get Matches
                        const { data: matches, error: matchError } = await supabase
                            .rpc('find_discovery_matches', { target_user_id: user.id });

                        if (matchError) throw matchError;

                        // Type for match response
                        interface MatchData {
                            matched_user_id: string;
                            match_score: number;
                            shared_artists: number;
                        }

                        const matchItems: DiscoveryItem[] = ((matches || []) as unknown as MatchData[]).map((m) => ({
                            id: `match-${m.matched_user_id}`,
                            type: 'match',
                            user: { id: m.matched_user_id, name: 'Music Soulmate', avatar: '' },
                            matchScore: m.match_score,
                            sharedArtists: m.shared_artists,
                            timestamp: Date.now()
                        }));

                        // Fetch user details for matches
                        if (matchItems.length > 0) {
                            const userIds = matchItems.map(i => i.user!.id);
                            const { data: users, error: userError } = await supabase
                                .from('users')
                                .select('user_id, display_name, avatar_url')
                                .in('user_id', userIds);

                            if (userError) throw userError;

                            // Update match items with user details
                            matchItems.forEach(item => {
                                const userDetail = users?.find(u => u.user_id === item.user!.id);
                                if (userDetail && item.user) {
                                    item.user.name = userDetail.display_name;
                                    item.user.avatar = userDetail.avatar_url;
                                }
                            });
                        }

                        return matchItems;
                    },
                    60000 // 1 minute TTL
                );

                setItems(data);
            } catch (error) {
                handleError(error, 'Discovery Feed');
            } finally {
                setLoading(false);
            }
        };

        fetchDiscovery();
    }, []);

    if (loading) {
        return (
            <div className="glass-dark rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-white">Discover</h3>
                </div>
                <LoadingState variant="skeleton" />
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-white">Discover</h3>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {items.length > 0 ? (
                        items.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                                        {item.type === 'match' ? (
                                            <Users className="w-6 h-6 text-primary" />
                                        ) : (
                                            <Music className="w-6 h-6 text-purple-400" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">
                                            {item.user?.name || 'Music Lover'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.matchScore && `${Math.round(item.matchScore * 100)}% match`}
                                            {item.sharedArtists && ` • ${item.sharedArtists} shared artists`}
                                        </p>
                                    </div>

                                    <Heart className="w-5 h-5 text-white/40 hover:text-red-400 transition-colors" />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <CompactEmptyState
                            icon={<Sparkles className="w-8 h-8" />}
                            message="No matches yet. Keep listening to find your music soulmates!"
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
