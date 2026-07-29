'use client';

import { useEffect, useRef } from 'react';
import {
    useNotificationsQuery,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
} from '@/hooks/queries/use-notifications';
import { useNotificationStore } from '@/stores/notification-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, CheckCheck, X, Music } from 'lucide-react';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/types/notification';

export function NotificationPanel() {
    const panelRef = useRef<HTMLDivElement>(null);
    const closePanel = useNotificationStore((state) => state.closeNotificationPanel);

    const { data: notificationsData, isLoading } = useNotificationsQuery({ limit: 50 });
    const notifications = notificationsData as Notification[] | undefined;
    const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

    // Close panel on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                closePanel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closePanel]);

    const unreadNotifications =
        notifications?.filter((n) => !n.read) || [];
    const hasUnread = unreadNotifications.length > 0;

    return (
        <Card
            ref={panelRef}
            className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] shadow-lg z-50"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <h3 className="font-semibold">Notifications</h3>
                    {hasUnread && (
                        <span className="text-sm text-muted-foreground">
                            ({unreadNotifications.length} new)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            disabled={isMarkingAll}
                        >
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Mark all read
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={closePanel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Notification List */}
            <ScrollArea className="h-[400px]">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : !notifications || notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No notifications yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            We'll notify you when something happens
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer */}
            {notifications && notifications.length > 0 && (
                <div className="p-3 border-t text-center">
                    <Button variant="link" size="sm" onClick={closePanel}>
                        View all notifications
                    </Button>
                </div>
            )}
        </Card>
    );
}
