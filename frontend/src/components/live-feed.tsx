'use client';

import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useRadio } from '@/lib/radio-station';
import { supabase } from '@/lib/supabase';
import { Music, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cachedFetch, cacheKey } from '@/lib/cache';
import { LoadingState } from '@/components/ui/loading-state';
import { formatDistanceToNow } from 'date-fns';
import { User as UserIcon } from 'lucide-react';

type FeedMessage = {
    id: string;
    type: 'track_play' | 'station_join';
    userId: string;
    userName: string;
    userAvatar?: string;
    trackName?: string;
    artistName?: string;
    timestamp: number;
};

export function LiveFeed() {
    const { lastMessage, isConnected } = useWebSocket();
    const { currentStation } = useRadio();
    const [messages, setMessages] = useState<FeedMessage[]>([]);
    const [connecting, setConnecting] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isConnected) {
            setConnecting(false);
        }
    }, [isConnected]);

    useEffect(() => {
        if (!lastMessage || !currentStation) return;

        const processMessage = async () => {
            if (lastMessage.type === 'radio:track-change' && lastMessage.stationId === currentStation.station_id) {
                let displayName = 'Unknown User';
                let avatarUrl: string | undefined = undefined;

                // RadioTrackChangedMessage doesn't include userId, so we'll use the broadcaster
                const broadcasterId = currentStation.broadcaster_id;

                // Fetch user details with cache
                if (broadcasterId) {
                    try {
                        const userData = await cachedFetch(
                            cacheKey('user-profile', broadcasterId),
                            async () => {
                                const { data } = await supabase
                                    .from('users')
                                    .select('display_name, avatar_url')
                                    .eq('user_id', broadcasterId)
                                    .single();
                                return data;
                            },
                            300000 // 5 minutes TTL
                        );

                        if (userData) {
                            displayName = userData.display_name;
                            avatarUrl = userData.avatar_url;
                        }
                    } catch {
                        // Ignore user fetch errors
                    }
                }

                const newMessage: FeedMessage = {
                    id: `${broadcasterId}-${Date.now()}`,
                    type: 'track_play',
                    userId: broadcasterId,
                    userName: displayName,
                    trackName: lastMessage.track.name,
                    artistName: lastMessage.track.artists,
                    timestamp: Date.now(),
                };

                if (avatarUrl) {
                    newMessage.userAvatar = avatarUrl;
                }

                setMessages((prev) => [newMessage, ...prev].slice(0, 20));
            }
        };

        processMessage();
    }, [lastMessage, currentStation]);

    if (connecting) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <LoadingState message="Connecting to live feed..." variant="pulse" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Radio className="w-8 h-8 mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm opacity-50">Tune in to see what&apos;s playing!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-dark p-4 rounded-xl flex items-center gap-4 border border-white/5"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            {msg.userAvatar ? (
                                <img src={msg.userAvatar} alt={msg.userName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <UserIcon className="w-5 h-5 text-primary" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium">
                                {msg.userName} <span className="text-muted-foreground font-normal">is listening to</span>
                            </p>
                            {msg.trackName && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Music className="w-3 h-3 text-primary" />
                                    <p className="text-sm font-semibold truncate text-white/90">
                                        {msg.trackName} {msg.artistName && <span className="text-muted-foreground font-normal">• {msg.artistName}</span>}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
        </div>
    );
}
