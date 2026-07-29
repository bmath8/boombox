'use client';

import { useState } from 'react';
import { useFollowUser, useUnfollowUser, useIsFollowing } from '@/hooks/queries';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
    userId: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    showIcon?: boolean;
    className?: string;
}

export function FollowButton({
    userId,
    variant = 'default',
    size = 'md',
    showIcon = true,
    className,
}: FollowButtonProps) {
    const { data: isFollowing, isLoading: isCheckingFollow } = useIsFollowing(userId);
    const { mutate: follow, isPending: isFollowPending } = useFollowUser();
    const { mutate: unfollow, isPending: isUnfollowPending } = useUnfollowUser();

    const isPending = isFollowPending || isUnfollowPending;

    const handleClick = () => {
        if (isFollowing) {
            unfollow(userId);
        } else {
            follow(userId);
        }
    };

    if (isCheckingFollow) {
        return (
            <Button variant={variant} size={size} disabled className={className}>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    return (
        <Button
            variant={isFollowing ? 'outline' : variant}
            size={size}
            onClick={handleClick}
            disabled={isPending}
            className={className}
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : showIcon ? (
                isFollowing ? (
                    <UserMinus className="h-4 w-4 mr-2" />
                ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                )
            ) : null}
            {isFollowing ? 'Following' : 'Follow'}
        </Button>
    );
}
