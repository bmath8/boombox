'use client';

import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/queries/use-notifications';
import { useNotificationStore } from '@/stores/notification-store';
import { NotificationPanel } from './notification-panel';

export function NotificationBell() {
    const { data: unreadData } = useUnreadCount();
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const togglePanel = useNotificationStore((state) => state.toggleNotificationPanel);
    const panelOpen = useNotificationStore((state) => state.notificationPanelOpen);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={togglePanel}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </Button>

            {panelOpen && <NotificationPanel />}
        </div>
    );
}
