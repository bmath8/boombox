'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { StationMessage } from '@/lib/types';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';
import { isMockStation } from '@/lib/constants';

interface StationChatProps {
    stationId: string;
}

export function StationChat({ stationId }: StationChatProps) {
    const [messages, setMessages] = useState<StationMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const { lastMessage, sendMessage } = useWebSocket();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Don't fetch for mock stations
        if (isMockStation(stationId)) {
            setLoading(false);
            return;
        }

        fetchMessages();

        const subscription = supabase
            .channel(`chat:${stationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'station_chat_messages',
                    filter: `station_id=eq.${stationId}`
                },
                async (payload) => {
                    const { new: newMsg } = payload;
                    // Fetch user details for the new message
                    const { data: userData } = await supabase
                        .from('users')
                        .select('display_name, avatar_url')
                        .eq('id', newMsg['user_id'])
                        .single();

                    const messageWithUser = {
                        ...newMsg,
                        users: userData
                    } as unknown as StationMessage;

                    setMessages(prev => [...prev, messageWithUser]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [stationId]);

    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'chat:message' && 'stationId' in lastMessage && lastMessage.stationId === stationId) {
            const msg = lastMessage as { message: { message_id: string } };
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.message_id === msg.message.message_id)) return prev;
                return [...prev, msg.message as unknown as StationMessage];
            });
            scrollToBottom();
        }
    }, [lastMessage, stationId]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('station_chat_messages')
                .select(`
                    *,
                    users (
                        display_name,
                        avatar_url
                    )
                `)
                .eq('station_id', stationId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;

            setMessages(data as unknown as StationMessage[]);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            handleError(error, 'FetchMessages', false);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('station_chat_messages')
                .insert({
                    station_id: stationId,
                    user_id: user.id,
                    content
                })
                .select(`
                    *,
                    users (
                        display_name,
                        avatar_url
                    )
                `)
                .single();

            if (error) throw error;

            // Optimistic update handled by subscription/websocket
            sendMessage({
                type: 'chat:message',
                stationId,
                message: data,
                timestamp: Date.now()
            });

        } catch (error) {
            handleError(error, 'SendMessage');
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Station Chat
                </h3>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto custom-scrollbar"
            >
                {loading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading chat...
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.message_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                                        {msg.user?.avatar_url ? (
                                            <img src={msg.user.avatar_url} alt={msg.user.display_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-medium text-white/50">{msg.user?.display_name?.[0] || '?'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-medium text-white">
                                                {msg.user?.display_name || 'Anonymous'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/80 break-words leading-relaxed">
                                            {msg.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div />
                    </div>
                )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Send"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
