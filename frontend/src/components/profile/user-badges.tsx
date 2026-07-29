'use client';

import { useUserBadges } from '@/hooks/queries';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Music, Users, Radio, Clock, Moon, Calendar, Star } from 'lucide-react';
import type { BadgeType } from '@/types/profile';

interface UserBadgesProps {
    userId: string;
    limit?: number;
    showAll?: boolean;
}

const badgeIcons: Record<BadgeType, React.ElementType> = {
    early_adopter: Star,
    broadcaster: Radio,
    social_butterfly: Users,
    playlist_master: Music,
    music_explorer: Trophy,
    night_owl: Moon,
    weekend_warrior: Calendar,
    genre_specialist: Music,
    '100_hours': Clock,
    '1000_hours': Clock,
};

export function UserBadges({ userId, limit, showAll = false }: UserBadgesProps) {
    const { data: badges, isLoading } = useUserBadges(userId);

    if (isLoading) {
        return (
            <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded-full" />
                ))}
            </div>
        );
    }

    if (!badges || badges.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">No badges earned yet</p>
        );
    }

    const displayBadges = showAll || !limit ? badges : badges.slice(0, limit);

    return (
        <div className="flex flex-wrap gap-2">
            {displayBadges.map((badge) => {
                const Icon = badgeIcons[badge.type] || Trophy;

                return (
                    <div
                        key={badge.id}
                        className="group relative"
                        title={badge.description}
                    >
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 transition-colors rounded-full">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{badge.name}</span>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[200px]">
                            <p className="text-sm font-medium mb-1">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {badge.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Earned {new Date(badge.earned_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                );
            })}

            {!showAll && limit && badges.length > limit && (
                <Badge variant="secondary" className="px-3 py-1.5">
                    +{badges.length - limit} more
                </Badge>
            )}
        </div>
    );
}
