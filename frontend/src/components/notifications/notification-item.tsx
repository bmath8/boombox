'use client';

import { formatDistanceToNow } from 'date-fns';
import {
    useMarkAsRead,
    useDeleteNotification,
} from '@/hooks/queries/use-notifications';
import { Button } from '@/components/ui/button';
import {
    Users,
    Radio,
    Music,
    Trophy,
    MessageCircle,
    Share2,
    X,
    Heart,
} from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notification';
import Link from 'next/link';

interface NotificationItemProps {
    notification: Notification;
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
    new_follower: Users,
    friend_joined_station: Radio,
    mention: MessageCircle,
    friend_request: Users,
    song_request_accepted: Music,
    playlist_shared: Share2,
    playlist_collaboration_invite: Music,
    new_release_from_artist: Music,
    badge_earned: Trophy,
    milestone_reached: Trophy,
    station_broadcast_started: Radio,
    station_ending_soon: Radio,
    new_message: MessageCircle,
};

export function NotificationItem({ notification }: NotificationItemProps) {
    const { mutate: markAsRead } = useMarkAsRead();
    const { mutate: deleteNotification } = useDeleteNotification();

    const Icon = notificationIcons[notification.type] || Music;

    const handleClick = () => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        if (notification.action_url) {
            window.location.href = notification.action_url;
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(notification.id);
    };

    return (
        <div
            className={`group relative p-4 hover:bg-accent/50 transition-colors cursor-pointer ${
                !notification.read ? 'bg-primary/5' : ''
            }`}
            onClick={handleClick}
        >
            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
            )}

            <div className="flex items-start gap-3 ml-3">
                {/* Icon */}
                <div
                    className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        notification.read ? 'bg-secondary' : 'bg-primary/20'
                    }`}
                >
                    <Icon
                        className={`h-5 w-5 ${
                            notification.read ? 'text-muted-foreground' : 'text-primary'
                        }`}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-sm ${
                            notification.read
                                ? 'text-muted-foreground'
                                : 'font-medium'
                        }`}
                    >
                        {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                        })}
                    </p>
                </div>

                {/* Delete button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDelete}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Image (if any) */}
            {notification.image_url && (
                <div className="ml-16 mt-2">
                    <img
                        src={notification.image_url}
                        alt=""
                        className="rounded-lg max-w-full h-auto max-h-40 object-cover"
                    />
                </div>
            )}
        </div>
    );
}
