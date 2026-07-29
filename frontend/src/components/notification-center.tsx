'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cachedFetch, cacheKey, requestCache } from '@/lib/cache';
import { handleError } from '@/lib/error-handler';

type Notification = {
    id: string;
    type: 'friend_request' | 'system' | 'alert';
    title: string;
    message: string;
    data?: unknown;
    read: boolean;
    created_at: string;
    sender?: {
        id: string;
        name: string;
        avatar?: string;
    };
};

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const data = await cachedFetch(
                cacheKey('notifications', user.id),
                async () => {
                    // 1. Fetch Friend Requests (Pending)
                    const { data: requests, error: reqError } = await supabase
                        .from('friendships')
                        .select('*, sender:users!friendships_user_id_fkey(user_id, display_name, avatar_url)')
                        .eq('friend_id', user.id)
                        .eq('status', 'pending');

                    if (reqError) throw reqError;

                    // 2. Fetch System Notifications
                    const { data: systemNotifs, error: sysError } = await supabase
                        .from('notifications')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (sysError) throw sysError;

                    // Type for Supabase friendship response
                    interface FriendshipRequest {
                        friendship_id: string;
                        created_at: string;
                        sender: {
                            user_id: string;
                            display_name: string;
                            avatar_url?: string;
                        };
                    }

                    // Type for Supabase notification response
                    interface SystemNotif {
                        notification_id: string;
                        title: string;
                        message: string;
                        read: boolean;
                        created_at: string;
                    }

                    // Combine and format
                    const formattedRequests: Notification[] = (requests as unknown as FriendshipRequest[] || []).map((req) => {
                        const notif: Notification = {
                            id: req.friendship_id,
                            type: 'friend_request' as const,
                            title: 'New Friend Request',
                            message: `${req.sender.display_name} wants to be friends!`,
                            read: false,
                            created_at: req.created_at,
                            sender: {
                                id: req.sender.user_id,
                                name: req.sender.display_name,
                            }
                        };
                        if (req.sender.avatar_url) {
                            if (notif.sender) notif.sender.avatar = req.sender.avatar_url;
                        }
                        return notif;
                    });

                    const formattedSystem: Notification[] = (systemNotifs as unknown as SystemNotif[] || []).map((n) => ({
                        id: n.notification_id,
                        type: 'system' as const,
                        title: n.title,
                        message: n.message,
                        read: n.read,
                        created_at: n.created_at
                    }));

                    return [...formattedRequests, ...formattedSystem].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                },
                30000 // 30s TTL matches polling
            );

            if (data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            handleError(error, 'Fetch Notifications', false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30s
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleFriendRequest = async (notification: Notification, accept: boolean) => {
        if (notification.type !== 'friend_request' || !notification.sender) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (accept) {
                // Update status to accepted
                await supabase
                    .from('friendships')
                    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
                    .eq('friendship_id', notification.id);

                // Create reverse friendship
                await supabase
                    .from('friendships')
                    .insert({
                        user_id: user.id,
                        friend_id: notification.sender.id,
                        status: 'accepted',
                        accepted_at: new Date().toISOString()
                    });

                alert(`You are now friends with ${notification.sender.name}!`);
            } else {
                // Delete request
                await supabase
                    .from('friendships')
                    .delete()
                    .eq('friendship_id', notification.id);
            }

            // Invalidate cache and refresh
            requestCache.invalidate(cacheKey('notifications', user.id));
            fetchNotifications();
        } catch (error) {
            handleError(error, 'Handle Friend Request');
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        setUnreadCount(0);
        // Optimistically update local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) markAsRead();
                }}
                className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-3 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-semibold text-sm">Notifications</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-muted-foreground hover:text-white"
                                    aria-label="Close notifications"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-white/[0.02]' : ''}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-primary' : 'bg-transparent'}`} />
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium leading-none">{notif.title}</p>
                                                    <p className="text-xs text-muted-foreground">{notif.message}</p>

                                                    {notif.type === 'friend_request' && (
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={() => handleFriendRequest(notif, true)}
                                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium rounded-md transition-colors"
                                                            >
                                                                <Check className="w-3 h-3" /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleFriendRequest(notif, false)}
                                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 hover:bg-white/10 text-muted-foreground text-xs font-medium rounded-md transition-colors"
                                                            >
                                                                <X className="w-3 h-3" /> Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
