'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useRadio } from '@/lib/radio-station';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'lucide-react';
import { cachedFetch, cacheKey } from '@/lib/cache';
import { LoadingState } from '@/components/ui/loading-state';

type Listener = {
    id: string;
    name: string;
    avatar?: string;
    joinedAt: number;
};

export function ListenerWall() {
    const { lastMessage } = useWebSocket();
    const { currentStation } = useRadio();
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch listeners from DB
    useEffect(() => {
        const fetchListeners = async () => {
            if (!currentStation) return;

            try {
                const data = await cachedFetch(
                    cacheKey('station-listeners', currentStation.station_id),
                    async () => {
                        const { data, error } = await supabase
                            .from('radio_listeners')
                            .select(`
                                user_id,
                                joined_at,
                                users (
                                    display_name,
                                    avatar_url
                                )
                            `)
                            .eq('station_id', currentStation.station_id)
                            .order('joined_at', { ascending: false })
                            .limit(20);

                        if (error) throw error;

                        // Type for Supabase listener response
                        interface ListenerData {
                            user_id: string;
                            joined_at: string;
                            users?: {
                                display_name: string;
                                avatar_url?: string;
                            };
                        }

                        return (data as unknown as ListenerData[]).map((item) => {
                            const listener: Listener = {
                                id: item.user_id,
                                name: item.users?.display_name || 'Anonymous',
                                joinedAt: new Date(item.joined_at).getTime(),
                            };
                            if (item.users?.avatar_url) {
                                listener.avatar = item.users.avatar_url;
                            }
                            return listener;
                        });
                    },
                    15000 // 15s TTL
                );

                if (data) setListeners(data);
            } catch {
                // Silent error
            } finally {
                setLoading(false);
            }
        };

        fetchListeners();
    }, [currentStation]);

    // Handle incoming listener events
    useEffect(() => {
        if (!lastMessage || !currentStation) return;

        const handleJoin = async () => {
            if (lastMessage.type === 'radio:listener-joined' && lastMessage.stationId === currentStation.station_id) {
                // Fetch user details with cache
                let displayName = 'New Listener';
                let avatarUrl: string | undefined = undefined;

                try {
                    const userData = await cachedFetch(
                        cacheKey('user-profile', lastMessage.userId),
                        async () => {
                            const { data } = await supabase
                                .from('users')
                                .select('display_name, avatar_url')
                                .eq('user_id', lastMessage.userId)
                                .single();
                            return data;
                        },
                        300000 // 5 min TTL
                    );

                    if (userData) {
                        displayName = userData.display_name;
                        avatarUrl = userData.avatar_url || undefined;
                    }
                } catch {
                    // ignore
                }

                const newListener: Listener = {
                    id: lastMessage.userId,
                    name: displayName,
                    joinedAt: Date.now(),
                };
                if (avatarUrl) {
                    newListener.avatar = avatarUrl;
                }

                setListeners((prev) => {
                    // Avoid duplicates
                    if (prev.some(l => l.id === newListener.id)) return prev;
                    return [newListener, ...prev].slice(0, 20);
                });
            }
        };

        if (lastMessage.type === 'radio:listener-joined') {
            handleJoin();
        }

        if (lastMessage.type === 'radio:listener-left' && lastMessage.stationId === currentStation.station_id) {
            setListeners((prev) => prev.filter((l) => l.id !== lastMessage.userId));
        }
    }, [lastMessage, currentStation]);

    return (
        <div className="glass-dark rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Audience</h3>
                <span className="text-xs text-muted-foreground">{listeners.length} active</span>
            </div>

            <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                    {listeners.map((listener) => (
                        <motion.div
                            key={listener.id}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="relative group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5 group-hover:border-primary/50 transition-colors">
                                {listener.avatar ? (
                                    <img src={listener.avatar} alt={listener.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {listener.name}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {currentStation && currentStation.listener_count > 20 && (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs text-muted-foreground border border-white/5">
                        +{currentStation.listener_count - 20}
                    </div>
                )}
            </div>

            {loading && listeners.length === 0 && (
                <div className="mt-4">
                    <LoadingState variant="skeleton" />
                </div>
            )}
        </div>
    );
}
