'use client';

import { useEffect, useState } from 'react';
import {
    useNotificationPreferences,
    useUpdateNotificationPreferences,
    useSubscribePush,
    useUnsubscribePush,
    useSendTestNotification,
} from '@/hooks/queries/use-notifications';
import { pushManager } from '@/lib/notifications/push-manager';
import { useNotificationStore } from '@/stores/notification-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Mail, Volume2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY'] || '';

interface NotificationPreferences {
    push_new_follower: boolean;
    push_friend_joined_station: boolean;
    push_mention: boolean;
    push_song_request: boolean;
    push_playlist_shared: boolean;
    push_badge_earned: boolean;
    push_station_updates: boolean;
    email_enabled: boolean;
    email_weekly_digest: boolean;
    email_monthly_report: boolean;
    sound_enabled: boolean;
    desktop_enabled: boolean;
}

export function NotificationSettings() {
    const { data: preferencesData, isLoading } = useNotificationPreferences();
    const preferences = preferencesData as NotificationPreferences | undefined;
    const { mutate: updatePreferences } = useUpdateNotificationPreferences();
    const { mutate: subscribePush, isPending: isSubscribing } = useSubscribePush();
    const { mutate: unsubscribePush, isPending: isUnsubscribing } =
        useUnsubscribePush();
    const { mutate: sendTest } = useSendTestNotification();

    const isPushSubscribed = useNotificationStore((state) => state.isPushSubscribed);

    const [pushSupported, setPushSupported] = useState(true);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>(
        'default'
    );

    useEffect(() => {
        setPushSupported(pushManager.isSupported());
        setPushPermission(pushManager.getPermissionStatus());

        // Check current subscription
        pushManager.getSubscription().then((subscription) => {
            useNotificationStore.getState().setPushSubscribed(!!subscription);
            useNotificationStore.getState().setPushSubscription(subscription);
        });
    }, []);

    const handleTogglePush = () => {
        if (isPushSubscribed) {
            unsubscribePush();
        } else {
            if (!VAPID_PUBLIC_KEY) {
                toast.error('Push notifications not configured');
                return;
            }
            subscribePush(VAPID_PUBLIC_KEY);
        }
    };

    const handlePreferenceChange = (key: string, value: boolean) => {
        updatePreferences({ [key]: value });
    };

    if (isLoading) {
        return <NotificationSettingsSkeleton />;
    }

    if (!preferences) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load notification preferences
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Push Notifications */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="font-semibold">Push Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                Get notified even when you're not on the app
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isPushSubscribed}
                        onCheckedChange={handleTogglePush}
                        disabled={
                            !pushSupported ||
                            pushPermission === 'denied' ||
                            isSubscribing ||
                            isUnsubscribing
                        }
                    />
                </div>

                {!pushSupported && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Push notifications are not supported in your browser
                        </AlertDescription>
                    </Alert>
                )}

                {pushPermission === 'denied' && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Push notifications are blocked. Please enable them in your
                            browser settings.
                        </AlertDescription>
                    </Alert>
                )}

                {isPushSubscribed && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_new_follower">New followers</Label>
                            <Switch
                                id="push_new_follower"
                                checked={preferences.push_new_follower}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange('push_new_follower', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_friend_joined_station">
                                Friend joins station
                            </Label>
                            <Switch
                                id="push_friend_joined_station"
                                checked={preferences.push_friend_joined_station}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange(
                                        'push_friend_joined_station',
                                        checked
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_mention">Mentions</Label>
                            <Switch
                                id="push_mention"
                                checked={preferences.push_mention}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange('push_mention', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_song_request">Song requests</Label>
                            <Switch
                                id="push_song_request"
                                checked={preferences.push_song_request}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange('push_song_request', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_playlist_shared">Playlist shares</Label>
                            <Switch
                                id="push_playlist_shared"
                                checked={preferences.push_playlist_shared}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange(
                                        'push_playlist_shared',
                                        checked
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_badge_earned">Badges earned</Label>
                            <Switch
                                id="push_badge_earned"
                                checked={preferences.push_badge_earned}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange('push_badge_earned', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="push_station_updates">Station updates</Label>
                            <Switch
                                id="push_station_updates"
                                checked={preferences.push_station_updates}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange(
                                        'push_station_updates',
                                        checked
                                    )
                                }
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendTest()}
                            className="mt-4"
                        >
                            Send Test Notification
                        </Button>
                    </div>
                )}
            </Card>

            {/* Email Notifications */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                            <h3 className="font-semibold">Email Notifications</h3>
                            <p className="text-sm text-muted-foreground">
                                Receive updates via email
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={preferences.email_enabled}
                        onCheckedChange={(checked) =>
                            handlePreferenceChange('email_enabled', checked)
                        }
                    />
                </div>

                {preferences.email_enabled && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="email_weekly_digest">Weekly digest</Label>
                            <Switch
                                id="email_weekly_digest"
                                checked={preferences.email_weekly_digest}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange('email_weekly_digest', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="email_monthly_report">Monthly report</Label>
                            <Switch
                                id="email_monthly_report"
                                checked={preferences.email_monthly_report}
                                onCheckedChange={(checked) =>
                                    handlePreferenceChange(
                                        'email_monthly_report',
                                        checked
                                    )
                                }
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Sound & Desktop */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Volume2 className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="font-semibold">Sound & Desktop</h3>
                        <p className="text-sm text-muted-foreground">
                            In-app notification preferences
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="sound_enabled">Play sound</Label>
                        <Switch
                            id="sound_enabled"
                            checked={preferences.sound_enabled}
                            onCheckedChange={(checked) =>
                                handlePreferenceChange('sound_enabled', checked)
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="desktop_enabled">
                            Desktop notifications
                        </Label>
                        <Switch
                            id="desktop_enabled"
                            checked={preferences.desktop_enabled}
                            onCheckedChange={(checked) =>
                                handlePreferenceChange('desktop_enabled', checked)
                            }
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}

function NotificationSettingsSkeleton() {
    return (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
