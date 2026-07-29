'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { QueueItem } from '@/lib/types';
import { Music, GripVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';

interface CollaborativePlaylistProps {
    stationId: string;
    initialQueue: QueueItem[];
    isBroadcaster: boolean;
}

export function CollaborativePlaylist({ stationId, initialQueue, isBroadcaster }: CollaborativePlaylistProps) {
    const { lastMessage, sendMessage } = useWebSocket();
    const [queue, setQueue] = useState<QueueItem[]>(initialQueue);

    useEffect(() => {
        setQueue(initialQueue);
    }, [initialQueue]);

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'playlist:update' && lastMessage.stationId === stationId) {
            handlePlaylistUpdate(lastMessage);
        }
    }, [lastMessage, stationId]);

    const handlePlaylistUpdate = (message: any) => {
        const { action, track, queueId } = message;

        setQueue(prev => {
            switch (action) {
                case 'add':
                    // Avoid duplicates
                    if (prev.some(item => item.queue_id === track.queue_id)) return prev;
                    return [...prev, track];

                case 'remove':
                    return prev.filter(item => item.queue_id !== queueId);

                case 'move':
                    // Complex reordering logic would go here
                    // For now, we'll just re-fetch or rely on the updated list if provided
                    return prev;

                default:
                    return prev;
            }
        });
    };

    const handleRemoveTrack = async (queueId: string) => {
        // Optimistic update
        setQueue(prev => prev.filter(item => item.queue_id !== queueId));

        // Notify others
        sendMessage({
            type: 'playlist:update',
            stationId,
            action: 'remove',
            queueId,
            timestamp: Date.now()
        });

        try {
            const { error } = await supabase
                .from('dj_queue')
                .delete()
                .eq('queue_id', queueId);

            if (error) throw error;
        } catch (error) {
            handleError(error, 'Remove Track');
            // Revert if failed (would need a way to restore the item)
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                <Music className="w-4 h-4 text-primary" />
                Live Playlist
            </h3>

            <AnimatePresence>
                {queue.map((item, index) => (
                    <motion.div
                        key={item.queue_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                    >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-medium text-white">
                            {index + 1}
                        </div>

                        {item.album_art_url ? (
                            <img
                                src={item.album_art_url}
                                alt={item.track_name}
                                className="w-10 h-10 rounded object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                                <Music className="w-5 h-5 text-white/50" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {item.track_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {item.artist_name}
                            </p>
                        </div>

                        {isBroadcaster && (
                            <button
                                onClick={() => handleRemoveTrack(item.queue_id)}
                                className="p-2 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove track"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {queue.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>Playlist is empty</p>
                </div>
            )}
        </div>
    );
}
