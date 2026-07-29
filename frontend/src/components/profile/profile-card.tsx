'use client';

import { useProfile } from '@/hooks/queries';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Music } from 'lucide-react';
import { FollowButton } from './follow-button';
import { UserBadges } from './user-badges';
import Link from 'next/link';

interface ProfileCardProps {
    userId: string;
    showFollowButton?: boolean;
    showBadges?: boolean;
    className?: string;
}

export function ProfileCard({
    userId,
    showFollowButton = true,
    showBadges = true,
    className,
}: ProfileCardProps) {
    const { data: profile, isLoading } = useProfile(userId);

    if (isLoading) {
        return (
            <Card className={className}>
                <div className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <Card className={className}>
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <Link href={`/profile/${userId}`}>
                        <Avatar className="h-16 w-16 cursor-pointer hover:opacity-80 transition">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                                {profile.display_name[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <Link href={`/profile/${userId}`}>
                            <h3 className="font-bold text-lg truncate hover:text-primary transition">
                                {profile.display_name}
                            </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground truncate">
                            @{profile.username}
                        </p>

                        {/* Location */}
                        {profile.location && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                    </div>

                    {showFollowButton && <FollowButton userId={userId} size="sm" />}
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.bio}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="font-bold">{profile.followers_count}</span>
                        <span className="text-muted-foreground ml-1">Followers</span>
                    </div>
                    <div>
                        <span className="font-bold">{profile.following_count}</span>
                        <span className="text-muted-foreground ml-1">Following</span>
                    </div>
                    <div>
                        <span className="font-bold">{profile.playlists_created}</span>
                        <span className="text-muted-foreground ml-1">Playlists</span>
                    </div>
                </div>

                {/* Favorite Genres */}
                {profile.favorite_genres && profile.favorite_genres.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        {profile.favorite_genres.slice(0, 3).map((genre) => (
                            <span
                                key={genre}
                                className="px-2 py-1 bg-secondary text-xs rounded-full"
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                )}

                {/* Badges */}
                {showBadges && <UserBadges userId={userId} limit={3} />}
            </div>
        </Card>
    );
}
