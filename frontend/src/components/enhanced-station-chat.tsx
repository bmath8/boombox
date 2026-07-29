'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { StationMessage } from '@/lib/types';
import {
    Send, MessageSquare, Loader2, Smile, Pin,
    Trash2, Clock, Ban, MoreHorizontal, Reply,
    Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';
import { isMockStation } from '@/lib/constants';
import { useDebounce } from '@/hooks/use-debounce';

// Emoji reactions available for messages
const REACTIONS = ['👍', '❤️', '😂', '🔥', '🎵', '👏'];

// Message with extended properties
interface EnhancedMessage extends StationMessage {
    reactions?: Record<string, string[]>; // emoji -> userIds
    isPinned?: boolean;
    replyTo?: {
        message_id: string;
        content: string;
        user_name: string;
    };
}

interface EnhancedStationChatProps {
    stationId: string;
    isBroadcaster?: boolean;
}

export function EnhancedStationChat({ stationId, isBroadcaster = false }: EnhancedStationChatProps) {
    const [messages, setMessages] = useState<EnhancedMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<{ id: string; name: string; avatar?: string }[]>([]);
    const [replyingTo, setReplyingTo] = useState<EnhancedMessage | null>(null);
    const [pinnedMessage, setPinnedMessage] = useState<EnhancedMessage | null>(null);


    const debouncedSearch = useDebounce(mentionSearch, 300);

    const { lastMessage, sendMessage } = useWebSocket();
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch messages on mount
    useEffect(() => {
        if (isMockStation(stationId)) {
            setLoading(false);
            return;
        }
        fetchMessages();
    }, [stationId]);

    // Handle WebSocket messages
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'chat:message' && 'stationId' in lastMessage && lastMessage.stationId === stationId) {
            const msg = lastMessage as { message: { message_id: string } };
            setMessages(prev => {
                if (prev.some(m => m.message_id === msg.message.message_id)) return prev;
                return [...prev, msg.message as unknown as EnhancedMessage];
            });
            scrollToBottom();
        }

        if (lastMessage.type === 'chat:reaction' && 'stationId' in lastMessage && lastMessage.stationId === stationId) {
            const reactionMsg = lastMessage as { messageId: string; emoji: string; userId: string };
            handleReactionUpdate(reactionMsg);
        }

        if (lastMessage.type === 'chat:pin' && 'stationId' in lastMessage && lastMessage.stationId === stationId) {
            const pinMsg = lastMessage as { messageId: string };
            const msg = messages.find(m => m.message_id === pinMsg.messageId);
            if (msg) setPinnedMessage(msg);
        }
    }, [lastMessage, stationId, messages]);

    // Handle user search for mentions
    useEffect(() => {
        if (!debouncedSearch) {
            setMentionResults([]);
            return;
        }

        const searchUsers = async () => {
            try {
                const { data } = await supabase
                    .from('users')
                    .select('user_id, display_name, avatar_url')
                    .ilike('display_name', `${debouncedSearch}%`)
                    .limit(5);

                if (data) {
                    setMentionResults(data.map(u => ({
                        id: u.user_id,
                        name: u.display_name,
                        avatar: u.avatar_url
                    })));
                }
            } catch (error) {
                console.error('User search failed:', error);
            }
        };

        searchUsers();
    }, [debouncedSearch]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('radio_chat_messages')
                .select(`
                    *,
                    created_at:sent_at,
                    users (
                        display_name,
                        avatar_url
                    )
                `)
                .eq('station_id', stationId)
                .order('sent_at', { ascending: true })
                .limit(100);

            if (error) throw error;

            setMessages(data as unknown as EnhancedMessage[]);
            scrollToBottom();
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
        setReplyingTo(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const messageData: Record<string, unknown> = {
                station_id: stationId,
                user_id: user.id,
                content
            };

            // Add reply reference if replying
            if (replyingTo) {
                messageData['reply_to_id'] = replyingTo.message_id;
            }

            const { data, error } = await supabase
                .from('radio_chat_messages')
                .insert(messageData)
                .select(`
                    *,
                    created_at:sent_at,
                    users (
                        display_name,
                        avatar_url
                    )
                `)
                .single();

            if (error) throw error;

            sendMessage({
                type: 'chat:message',
                stationId,
                message: {
                    ...data,
                    replyTo: replyingTo ? {
                        message_id: replyingTo.message_id,
                        content: replyingTo.content.substring(0, 50),
                        user_name: replyingTo.user?.display_name || 'Anonymous'
                    } : undefined
                },
                timestamp: Date.now()
            });

        } catch (error) {
            handleError(error, 'SendMessage');
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Optimistic update
            setMessages(prev => prev.map(msg => {
                if (msg.message_id !== messageId) return msg;

                const reactions = { ...msg.reactions };
                const userIds = reactions[emoji] || [];

                if (userIds.includes(user.id)) {
                    reactions[emoji] = userIds.filter(id => id !== user.id);
                } else {
                    reactions[emoji] = [...userIds, user.id];
                }

                return { ...msg, reactions };
            }));

            // Broadcast reaction via WebSocket
            sendMessage({
                type: 'chat:reaction',
                stationId,
                messageId,
                emoji,
                userId: user.id,
                timestamp: Date.now()
            });

            setShowEmojiPicker(null);
        } catch (error) {
            handleError(error, 'AddReaction');
        }
    };

    const handleReactionUpdate = (msg: { messageId: string; emoji: string; userId: string }) => {
        setMessages(prev => prev.map(m => {
            if (m.message_id !== msg.messageId) return m;

            const reactions = { ...m.reactions };
            const userIds = reactions[msg.emoji] || [];

            if (userIds.includes(msg.userId)) {
                reactions[msg.emoji] = userIds.filter(id => id !== msg.userId);
            } else {
                reactions[msg.emoji] = [...userIds, msg.userId];
            }

            return { ...m, reactions };
        }));
    };

    const handlePinMessage = async (message: EnhancedMessage) => {
        if (!isBroadcaster) return;

        setPinnedMessage(message);
        sendMessage({
            type: 'chat:pin',
            stationId,
            messageId: message.message_id,
            timestamp: Date.now()
        });
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!isBroadcaster) return;

        try {
            await supabase
                .from('radio_chat_messages')
                .delete()
                .eq('message_id', messageId);

            setMessages(prev => prev.filter(m => m.message_id !== messageId));

            sendMessage({
                type: 'chat:delete',
                stationId,
                messageId,
                timestamp: Date.now()
            });
        } catch (error) {
            handleError(error, 'DeleteMessage');
        }
    };

    const handleMention = useCallback((name: string) => {
        setNewMessage(prev => prev.replace(/@\w*$/, `@${name} `));
        setMentionSearch(null);
        inputRef.current?.focus();
    }, []);

    // Handle input for mentions
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewMessage(value);

        // Check for @mention
        const mentionMatch = value.match(/@(\w*)$/);
        if (mentionMatch) {
            setMentionSearch(mentionMatch[1] ?? null);
            // Search triggered by debounced effect
        } else {
            setMentionSearch(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Station Chat
                    {messages.length > 0 && (
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                            {messages.length}
                        </span>
                    )}
                </h3>
            </div>

            {/* Pinned Message */}
            <AnimatePresence>
                {pinnedMessage && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2"
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <Pin className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-400 font-medium">
                                {pinnedMessage.user?.display_name}:
                            </span>
                            <span className="text-white/80 truncate">
                                {pinnedMessage.content}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar">
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
                                    className="group flex items-start gap-3 relative"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                                        {msg.user?.avatar_url ? (
                                            <img src={msg.user.avatar_url} alt={msg.user.display_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-medium text-white/50">{msg.user?.display_name?.[0] || '?'}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Reply indicator */}
                                        {msg.replyTo && (
                                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                <Reply className="w-3 h-3" />
                                                Replying to {msg.replyTo.user_name}
                                            </div>
                                        )}

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

                                        {/* Reactions */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                                    userIds.length > 0 && (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(msg.message_id, emoji)}
                                                            className="px-2 py-0.5 bg-white/10 rounded-full text-xs hover:bg-white/20 transition-colors"
                                                        >
                                                            {emoji} {userIds.length}
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Actions */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        <button
                                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.message_id ? null : msg.message_id)}
                                            className="p-1 hover:bg-white/10 rounded"
                                            title="React"
                                        >
                                            <Smile className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="p-1 hover:bg-white/10 rounded"
                                            title="Reply"
                                        >
                                            <Reply className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                        {isBroadcaster && (
                                            <>
                                                <button
                                                    onClick={() => handlePinMessage(msg)}
                                                    className="p-1 hover:bg-white/10 rounded"
                                                    title="Pin"
                                                >
                                                    <Pin className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.message_id)}
                                                    className="p-1 hover:bg-white/10 rounded text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Emoji Picker Popup */}
                                    <AnimatePresence>
                                        {showEmojiPicker === msg.message_id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="absolute right-0 top-8 bg-black/90 border border-white/10 rounded-lg p-2 flex gap-1 z-10"
                                            >
                                                {REACTIONS.map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg.message_id, emoji)}
                                                        className="p-1 hover:bg-white/10 rounded text-lg"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Reply indicator */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Reply className="w-4 h-4" />
                            Replying to {replyingTo.user?.display_name}
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-white/10 rounded"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mention Suggestions Popup */}
            <AnimatePresence>
                {mentionSearch && mentionResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-20 left-4 right-4 md:left-4 md:w-64 bg-black/95 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-50 backdrop-blur-xl"
                    >
                        <div className="p-2 space-y-1">
                            {mentionResults.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleMention(user.name)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-white/10 flex items-center gap-3 text-sm text-white transition-colors rounded-lg"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name[0]
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium truncate">{user.name}</span>
                                        <span className="text-xs text-muted-foreground truncate">@{user.name.toLowerCase().replace(/\s/g, '')}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message... (use @ to mention)"
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
