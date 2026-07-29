'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Bell, BellOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/lib/error-handler';
import { toast } from 'sonner';

interface FollowButtonProps {
    djId: string;
    djName: string;
    size?: 'sm' | 'md' | 'lg';
    showNotificationToggle?: boolean;
}

export function FollowButton({
    djId,
    djName,
    size = 'md',
    showNotificationToggle = false
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        checkFollowStatus();
    }, [djId]);

    const checkFollowStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            setCurrentUserId(user.id);

            // Check if already following
            const { data } = await supabase
                .from('dj_follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('dj_id', djId)
                .single();

            if (data) {
                setIsFollowing(true);
                setNotifications(data.notifications_enabled ?? true);
            }
        } catch {
            // Not following
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUserId) {
            toast.error('Please sign in to follow DJs');
            return;
        }

        if (currentUserId === djId) {
            toast.error("You can't follow yourself!");
            return;
        }

        setLoading(true);
        try {
            if (isFollowing) {
                // Unfollow
                await supabase
                    .from('dj_follows')
                    .delete()
                    .eq('follower_id', currentUserId)
                    .eq('dj_id', djId);

                setIsFollowing(false);
                toast.success(`Unfollowed ${djName}`);
            } else {
                // Follow
                await supabase
                    .from('dj_follows')
                    .insert({
                        follower_id: currentUserId,
                        dj_id: djId,
                        notifications_enabled: true
                    });

                setIsFollowing(true);
                setNotifications(true);
                toast.success(`Now following ${djName}`);
            }
        } catch (error) {
            handleError(error, 'Follow');
        } finally {
            setLoading(false);
        }
    };

    const toggleNotifications = async () => {
        if (!currentUserId || !isFollowing) return;

        try {
            const newState = !notifications;

            await supabase
                .from('dj_follows')
                .update({ notifications_enabled: newState })
                .eq('follower_id', currentUserId)
                .eq('dj_id', djId);

            setNotifications(newState);
            toast.success(newState ? 'Notifications enabled' : 'Notifications disabled');
        } catch (error) {
            handleError(error, 'ToggleNotifications');
        }
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs gap-1',
        md: 'px-3 py-1.5 text-sm gap-2',
        lg: 'px-4 py-2 text-base gap-2'
    };

    const iconSize = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    if (loading) {
        return (
            <button
                disabled
                className={`flex items-center ${sizeClasses[size]} bg-white/10 rounded-lg text-muted-foreground`}
            >
                <Loader2 className={`${iconSize[size]} animate-spin`} />
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFollow}
                className={`flex items-center ${sizeClasses[size]} rounded-lg font-medium transition-colors ${isFollowing
                        ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
            >
                {isFollowing ? (
                    <>
                        <UserCheck className={iconSize[size]} />
                        Following
                    </>
                ) : (
                    <>
                        <UserPlus className={iconSize[size]} />
                        Follow
                    </>
                )}
            </motion.button>

            {showNotificationToggle && isFollowing && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleNotifications}
                    className={`p-1.5 rounded-lg transition-colors ${notifications
                            ? 'bg-primary/20 text-primary'
                            : 'bg-white/10 text-muted-foreground hover:text-white'
                        }`}
                    title={notifications ? 'Disable notifications' : 'Enable notifications'}
                >
                    {notifications ? (
                        <Bell className={iconSize[size]} />
                    ) : (
                        <BellOff className={iconSize[size]} />
                    )}
                </motion.button>
            )}
        </div>
    );
}

// Hook to get follower/following counts
export function useFollowCounts(userId: string) {
    const [counts, setCounts] = useState({ followers: 0, following: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Get follower count
                const { count: followerCount } = await supabase
                    .from('dj_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('dj_id', userId);

                // Get following count
                const { count: followingCount } = await supabase
                    .from('dj_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('follower_id', userId);

                setCounts({
                    followers: followerCount || 0,
                    following: followingCount || 0
                });
            } catch (error) {
                console.error('Failed to fetch follow counts:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchCounts();
        }
    }, [userId]);

    return { ...counts, loading };
}
