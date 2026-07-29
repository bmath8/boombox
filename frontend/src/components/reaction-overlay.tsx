'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useRadio } from '@/lib/radio-station';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

type Reaction = {
    id: string;
    emoji: string;
    x: number; // Random horizontal position (0-100%)
    userId: string;
};

const AVAILABLE_REACTIONS = ['🔥', '❤️', '🎵', '👏', '💃', '🕺'];

export function ReactionOverlay() {
    const { lastMessage, sendMessage } = useWebSocket();
    const { currentStation } = useRadio();
    const [reactions, setReactions] = useState<Reaction[]>([]);

    const addReaction = useCallback((emoji: string, userId: string) => {
        const newReaction: Reaction = {
            id: Math.random().toString(36).substr(2, 9),
            emoji,
            x: Math.random() * 80 + 10, // Keep within 10-90% width
            userId,
        };

        setReactions((prev) => [...prev, newReaction]);

        // Remove reaction after animation
        setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
        }, 2000);
    }, []);

    // Handle incoming reactions
    useEffect(() => {
        if (lastMessage && lastMessage.type === 'radio:reaction' && lastMessage.stationId === currentStation?.station_id) {
            addReaction(lastMessage.emoji, lastMessage.userId);
        }
    }, [lastMessage, currentStation, addReaction]);

    const sendReaction = async (emoji: string) => {
        if (!currentStation) return;

        // Send via WebSocket for instant feedback
        sendMessage({
            type: 'radio:reaction',
            stationId: currentStation.station_id,
            emoji,
            timestamp: Date.now(),
        });

        // Optimistically add locally
        addReaction(emoji, 'me');

        // Save to database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('reactions')
                .insert({
                    station_id: currentStation.station_id,
                    user_id: user.id,
                    emoji: emoji
                });
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {/* Floating Emojis */}
            <AnimatePresence>
                {reactions.map((reaction) => (
                    <motion.div
                        key={reaction.id}
                        initial={{ opacity: 1, y: '100%', x: `${reaction.x}%`, scale: 0.5 }}
                        animate={{ opacity: 0, y: '0%', scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute bottom-0 text-4xl"
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Controls (Pointer events enabled) */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-3 p-3 bg-black/70 backdrop-blur-md rounded-full border border-white/20 shadow-lg">
                {AVAILABLE_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        className="w-12 h-12 flex items-center justify-center text-2xl hover:scale-125 transition-transform active:scale-95 hover:bg-white/10 rounded-full"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
