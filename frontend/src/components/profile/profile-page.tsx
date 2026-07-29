'use client';

import { useState } from 'react';
import { useProfile, useUserStats, useFollowers, useFollowing } from '@/hooks/queries';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    MapPin,
    Music,
    Radio,
    Clock,
    Users,
    Settings,
    Share2,
} from 'lucide-react';
import type { User } from '@/lib/types';
import { FollowButton } from './follow-button';
import { UserBadges } from './user-badges';
import { ActivityFeed } from './activity-feed';
import { ProfileCard } from './profile-card';
import Image from 'next/image';

interface ProfilePageProps {
    userId: string;
    isOwnProfile?: boolean;
}

export function ProfilePage({ userId, isOwnProfile = false }: ProfilePageProps) {
    const { data: profile, isLoading: profileLoading } = useProfile(userId);
    const { data: stats, isLoading: statsLoading } = useUserStats(userId);
    const { data: followersData } = useFollowers(userId);
    const { data: followingData } = useFollowing(userId);

    const followers = followersData as User[] | undefined;
    const following = followingData as User[] | undefined;

    const [activeTab, setActiveTab] = useState('activity');

    if (profileLoading) {
        return <ProfilePageSkeleton />;
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
                    <p className="text-muted-foreground">
                        The user you're looking for doesn't exist.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Cover Photo */}
            <Card className="overflow-hidden">
                <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20">
                    {profile.cover_url && (
                        <Image
                            src={profile.cover_url}
                            alt="Cover"
                            fill
                            className="object-cover"
                        />
                    )}
                </div>

                {/* Profile Header */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
                        {/* Avatar */}
                        <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-3xl">
                                {profile.display_name[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>

                        {/* Name and Actions */}
                        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold">
                                    {profile.display_name}
                                </h1>
                                <p className="text-muted-foreground">
                                    @{profile.username}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <Button variant="outline">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        <FollowButton userId={userId} />
                                        <Button variant="outline" size="icon">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="mt-4 text-muted-foreground max-w-2xl">
                            {profile.bio}
                        </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                        {stats && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {Math.floor(stats.listening_time_all_time / 60)}{' '}
                                    hours listened
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 mt-6">
                        <button
                            className="text-center hover:text-primary transition"
                            onClick={() => setActiveTab('followers')}
                        >
                            <div className="text-2xl font-bold">
                                {profile.followers_count}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Followers
                            </div>
                        </button>
                        <button
                            className="text-center hover:text-primary transition"
                            onClick={() => setActiveTab('following')}
                        >
                            <div className="text-2xl font-bold">
                                {profile.following_count}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Following
                            </div>
                        </button>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {profile.stations_created}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Stations
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">
                                {profile.playlists_created}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Playlists
                            </div>
                        </div>
                    </div>

                    {/* Favorite Genres */}
                    {profile.favorite_genres && profile.favorite_genres.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Music className="h-4 w-4" />
                                Favorite Genres
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.favorite_genres.map((genre) => (
                                    <span
                                        key={genre}
                                        className="px-3 py-1 bg-primary/10 text-sm rounded-full"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="mt-6">
                        <h3 className="text-sm font-medium mb-2">Badges</h3>
                        <UserBadges userId={userId} showAll />
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="stats">Stats</TabsTrigger>
                    <TabsTrigger value="followers">
                        Followers ({profile.followers_count})
                    </TabsTrigger>
                    <TabsTrigger value="following">
                        Following ({profile.following_count})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-6">
                    <ActivityFeed userId={userId} />
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                    {statsLoading ? (
                        <StatsTabSkeleton />
                    ) : stats ? (
                        <StatsTab stats={stats} />
                    ) : (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">
                                No stats available yet
                            </p>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="followers" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {followers && followers.length > 0 ? (
                            followers.map((user) => (
                                <ProfileCard
                                    key={user.user_id}
                                    userId={user.user_id}
                                    showBadges={false}
                                />
                            ))
                        ) : (
                            <Card className="col-span-full p-8 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground">
                                    No followers yet
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="following" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {following && following.length > 0 ? (
                            following.map((user) => (
                                <ProfileCard
                                    key={user.user_id}
                                    userId={user.user_id}
                                    showBadges={false}
                                />
                            ))
                        ) : (
                            <Card className="col-span-full p-8 text-center">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p className="text-muted-foreground">
                                    Not following anyone yet
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatsTab({ stats }: { stats: any }) {
    return (
        <div className="space-y-6">
            {/* Listening Time */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Listening Time
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-2xl font-bold text-primary">
                            {Math.floor(stats.listening_time_today / 60)}h{' '}
                            {stats.listening_time_today % 60}m
                        </div>
                        <div className="text-sm text-muted-foreground">Today</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">
                            {Math.floor(stats.listening_time_week / 60)}h
                        </div>
                        <div className="text-sm text-muted-foreground">This Week</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">
                            {Math.floor(stats.listening_time_month / 60)}h
                        </div>
                        <div className="text-sm text-muted-foreground">
                            This Month
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">
                            {Math.floor(stats.listening_time_all_time / 60)}h
                        </div>
                        <div className="text-sm text-muted-foreground">All Time</div>
                    </div>
                </div>
            </Card>

            {/* Top Artists */}
            {stats.top_artists_month && stats.top_artists_month.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Top Artists This Month
                    </h3>
                    <div className="space-y-3">
                        {stats.top_artists_month.slice(0, 5).map((artist: any) => (
                            <div
                                key={artist.artist_id}
                                className="flex items-center gap-4"
                            >
                                <div className="text-2xl font-bold text-muted-foreground w-8">
                                    {artist.rank}
                                </div>
                                <div className="h-12 w-12 rounded-full bg-secondary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {artist.artist_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {artist.play_count} plays •{' '}
                                        {Math.floor(artist.listening_time / 60)}h
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Top Tracks */}
            {stats.top_tracks_month && stats.top_tracks_month.length > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Radio className="h-5 w-5" />
                        Top Tracks This Month
                    </h3>
                    <div className="space-y-3">
                        {stats.top_tracks_month.slice(0, 5).map((track: any) => (
                            <div
                                key={track.track_id}
                                className="flex items-center gap-4"
                            >
                                <div className="text-2xl font-bold text-muted-foreground w-8">
                                    {track.rank}
                                </div>
                                <div className="h-12 w-12 rounded bg-secondary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {track.track_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {track.artist_name} • {track.play_count} plays
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}

function ProfilePageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Card className="overflow-hidden">
                <Skeleton className="h-48 md:h-64 w-full" />
                <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-16">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-20 w-full mt-4" />
                </div>
            </Card>
        </div>
    );
}

function StatsTabSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i}>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
