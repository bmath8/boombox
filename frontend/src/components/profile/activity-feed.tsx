'use client';

import { useActivity, useFeed } from '@/hooks/queries';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Radio,
    Music,
    Users,
    Heart,
    Share2,
    Trophy,
    PlayCircle,
} from 'lucide-react';
import type { ActivityType, UserActivity } from '@/types/profile';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ActivityFeedProps {
    userId?: string; // If provided, show user's activity. Otherwise, show feed from followed users
    limit?: number;
    className?: string;
}

const activityIcons: Record<ActivityType, React.ElementType> = {
    created_station: Radio,
    joined_station: PlayCircle,
    created_playlist: Music,
    followed_user: Users,
    liked_track: Heart,
    shared_playlist: Share2,
    earned_badge: Trophy,
};

const activityMessages: Record<ActivityType, string> = {
    created_station: 'created a station',
    joined_station: 'joined a station',
    created_playlist: 'created a playlist',
    followed_user: 'followed',
    liked_track: 'liked a track',
    shared_playlist: 'shared a playlist',
    earned_badge: 'earned a badge',
};

export function ActivityFeed({ userId, limit = 20, className }: ActivityFeedProps) {
    const {
        data: activities,
        isLoading,
        error,
    } = userId ? useActivity(userId, limit) : useFeed(limit);

    const activitiesList = activities as UserActivity[] | undefined;

    if (isLoading) {
        return (
            <div className={className}>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <div className="p-8 text-center">
                    <p className="text-muted-foreground">
                        Failed to load activity feed
                    </p>
                </div>
            </Card>
        );
    }

    if (!activitiesList || activitiesList.length === 0) {
        return (
            <Card className={className}>
                <div className="p-8 text-center">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                        {userId
                            ? 'No activity yet'
                            : 'No activity from people you follow'}
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className={className}>
            <div className="space-y-3">
                {activitiesList.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                ))}
            </div>
        </div>
    );
}

function ActivityItem({ activity }: { activity: UserActivity }) {
    const Icon = activityIcons[activity.type] || Music;
    const message = activityMessages[activity.type] || 'did something';

    return (
        <Card className="p-4 hover:bg-accent/5 transition-colors">
            <div className="flex items-start gap-4">
                {/* User Avatar */}
                <Link href={`/profile/${activity.user_id}`}>
                    <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition">
                        <AvatarImage
                            src={activity.user?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                            {activity.user?.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                        <p className="text-sm">
                            <Link
                                href={`/profile/${activity.user_id}`}
                                className="font-semibold hover:text-primary transition"
                            >
                                {activity.user?.display_name || 'Unknown User'}
                            </Link>{' '}
                            <span className="text-muted-foreground">{message}</span>
                        </p>
                    </div>

                    {/* Activity Details */}
                    <ActivityDetails activity={activity} />

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                        })}
                    </p>
                </div>
            </div>
        </Card>
    );
}

function ActivityDetails({ activity }: { activity: UserActivity }) {
    switch (activity.type) {
        case 'created_station':
        case 'joined_station':
            return (
                <Link
                    href={`/radio/${activity.data['station_id']}`}
                    className="block mt-2 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition"
                >
                    <p className="font-medium">{activity.data['station_name']}</p>
                    {activity.data['description'] && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {activity.data['description']}
                        </p>
                    )}
                </Link>
            );

        case 'created_playlist':
        case 'shared_playlist':
            return (
                <Link
                    href={`/playlists/${activity.data['playlist_id']}`}
                    className="block mt-2 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition"
                >
                    <p className="font-medium">{activity.data['playlist_name']}</p>
                    {activity.data['track_count'] && (
                        <p className="text-sm text-muted-foreground">
                            {activity.data['track_count']} tracks
                        </p>
                    )}
                </Link>
            );

        case 'followed_user':
            return (
                <Link
                    href={`/profile/${activity.data['followed_user_id']}`}
                    className="block mt-2 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition"
                >
                    <p className="font-medium">
                        {activity.data['followed_user_name']}
                    </p>
                </Link>
            );

        case 'liked_track':
            return (
                <div className="mt-2 p-3 bg-secondary/50 rounded-lg">
                    <p className="font-medium">{activity.data['track_name']}</p>
                    <p className="text-sm text-muted-foreground">
                        {activity.data['artist_name']}
                    </p>
                </div>
            );

        case 'earned_badge':
            return (
                <div className="mt-2 p-3 bg-primary/10 rounded-lg flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-primary" />
                    <div>
                        <p className="font-medium">{activity.data['badge_name']}</p>
                        <p className="text-sm text-muted-foreground">
                            {activity.data['badge_description']}
                        </p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
