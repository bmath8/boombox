import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { profileAPI } from '@/lib/api/services/profile';
import { useSocialStore } from '@/stores/social-store';
import { toast } from 'sonner';
import type { ProfileUpdateInput, UserProfile } from '@/types/profile';

/**
 * React Query Hooks for Profile Data
 */

// ==================== Query Keys ====================

export const profileKeys = {
    all: ['profiles'] as const,
    lists: () => [...profileKeys.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
        [...profileKeys.lists(), filters] as const,
    details: () => [...profileKeys.all, 'detail'] as const,
    detail: (id: string) => [...profileKeys.details(), id] as const,
    me: () => [...profileKeys.all, 'me'] as const,
    followers: (id: string) => [...profileKeys.all, id, 'followers'] as const,
    following: (id: string) => [...profileKeys.all, id, 'following'] as const,
    activity: (id: string) => [...profileKeys.all, id, 'activity'] as const,
    feed: () => [...profileKeys.all, 'feed'] as const,
    stats: (id: string) => [...profileKeys.all, id, 'stats'] as const,
    badges: (id: string) => [...profileKeys.all, id, 'badges'] as const,
    history: (id: string) => [...profileKeys.all, id, 'history'] as const,
    suggestions: () => [...profileKeys.all, 'suggestions'] as const,
    featured: () => [...profileKeys.all, 'featured'] as const,
};

// ==================== Profile Queries ====================

/**
 * Get user profile by ID
 */
export function useProfile(userId: string) {
    return useQuery({
        queryKey: profileKeys.detail(userId),
        queryFn: () => profileAPI.getProfile(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Get current user's profile
 */
export function useMyProfile() {
    const setMyProfile = useSocialStore((state) => state.setMyProfile);

    const query = useQuery({
        queryKey: profileKeys.me(),
        queryFn: () => profileAPI.getMyProfile(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    useEffect(() => {
        if (query.data) {
            setMyProfile(query.data);
        }
    }, [query.data, setMyProfile]);

    return query;
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const setMyProfile = useSocialStore((state) => state.setMyProfile);

    return useMutation({
        mutationFn: (data: ProfileUpdateInput) => profileAPI.updateProfile(data),
        onSuccess: (updatedProfile) => {
            queryClient.setQueryData(profileKeys.me(), updatedProfile);
            setMyProfile(updatedProfile);
            queryClient.invalidateQueries({ queryKey: profileKeys.me() });
            toast.success('Profile updated successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update profile');
        },
    });
}

/**
 * Upload avatar mutation
 */
export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => profileAPI.uploadAvatar(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: profileKeys.me() });
            toast.success('Avatar uploaded successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upload avatar');
        },
    });
}

/**
 * Upload cover photo mutation
 */
export function useUploadCover() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => profileAPI.uploadCover(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.me() });
            toast.success('Cover photo uploaded successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to upload cover photo');
        },
    });
}

// ==================== Social Queries ====================

/**
 * Get user's followers
 */
export function useFollowers(userId: string) {
    const setFollowers = useSocialStore((state) => state.setFollowers);

    const query = useQuery({
        queryKey: profileKeys.followers(userId),
        queryFn: () => profileAPI.getFollowers(userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    useEffect(() => {
        if (query.data) {
            setFollowers(query.data);
        }
    }, [query.data, setFollowers]);

    return query;
}

/**
 * Get users that a user is following
 */
export function useFollowing(userId: string) {
    const setFollowing = useSocialStore((state) => state.setFollowing);

    const query = useQuery({
        queryKey: profileKeys.following(userId),
        queryFn: () => profileAPI.getFollowing(userId),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    useEffect(() => {
        if (query.data) {
            setFollowing(query.data);
        }
    }, [query.data, setFollowing]);

    return query;
}

/**
 * Check if following a user
 */
export function useIsFollowing(userId: string) {
    return useQuery({
        queryKey: [...profileKeys.detail(userId), 'is-following'],
        queryFn: () => profileAPI.isFollowing(userId),
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Follow user mutation
 */
export function useFollowUser() {
    const queryClient = useQueryClient();
    const addFollowing = useSocialStore((state) => state.addFollowing);

    return useMutation({
        mutationFn: (userId: string) => profileAPI.followUser(userId),
        onSuccess: (data, userId) => {
            queryClient.invalidateQueries({ queryKey: profileKeys.following(userId) });
            queryClient.invalidateQueries({ queryKey: profileKeys.me() });

            // Optimistically add to following list
            const profile = queryClient.getQueryData<UserProfile>(
                profileKeys.detail(userId)
            );
            if (profile) {
                addFollowing(profile);
            }

            toast.success('Followed successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to follow user');
        },
    });
}

/**
 * Unfollow user mutation
 */
export function useUnfollowUser() {
    const queryClient = useQueryClient();
    const removeFollowing = useSocialStore((state) => state.removeFollowing);

    return useMutation({
        mutationFn: (userId: string) => profileAPI.unfollowUser(userId),
        onSuccess: (data, userId) => {
            queryClient.invalidateQueries({ queryKey: profileKeys.following(userId) });
            queryClient.invalidateQueries({ queryKey: profileKeys.me() });

            // Optimistically remove from following list
            removeFollowing(userId);

            toast.success('Unfollowed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to unfollow user');
        },
    });
}

// ==================== Activity Feed ====================

/**
 * Get user's activity
 */
export function useActivity(userId: string, limit = 20) {
    return useQuery({
        queryKey: profileKeys.activity(userId),
        queryFn: () => profileAPI.getActivity(userId, limit),
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Get activity feed from followed users
 */
export function useFeed(limit = 50) {
    const setFeed = useSocialStore((state) => state.setFeed);

    const query = useQuery({
        queryKey: profileKeys.feed(),
        queryFn: () => profileAPI.getFeed(limit),
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refetch every minute
    });

    useEffect(() => {
        if (query.data) {
            setFeed(query.data);
        }
    }, [query.data, setFeed]);

    return query;
}

// ==================== Stats & History ====================

/**
 * Get user statistics
 */
export function useUserStats(userId: string) {
    return useQuery({
        queryKey: profileKeys.stats(userId),
        queryFn: () => profileAPI.getStats(userId),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Get user's badges
 */
export function useUserBadges(userId: string) {
    return useQuery({
        queryKey: profileKeys.badges(userId),
        queryFn: () => profileAPI.getBadges(userId),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get listening history
 */
export function useListeningHistory(userId: string, params?: { limit?: number }) {
    return useQuery({
        queryKey: [...profileKeys.history(userId), params],
        queryFn: () => profileAPI.getListeningHistory(userId, params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Record track play mutation
 */
export function useRecordPlay() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (trackData: Parameters<typeof profileAPI.recordPlay>[0]) =>
            profileAPI.recordPlay(trackData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: profileKeys.stats('me') });
            queryClient.invalidateQueries({ queryKey: profileKeys.history('me') });
        },
    });
}

// ==================== Discovery ====================

/**
 * Search users
 */
export function useSearchUsers(query: string) {
    return useQuery({
        queryKey: [...profileKeys.all, 'search', query],
        queryFn: () => profileAPI.searchUsers(query),
        enabled: query.length > 0,
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Get suggested users to follow
 */
export function useSuggestions(limit = 10) {
    return useQuery({
        queryKey: profileKeys.suggestions(),
        queryFn: () => profileAPI.getSuggestions(limit),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Get featured users
 */
export function useFeaturedUsers(limit = 20) {
    return useQuery({
        queryKey: profileKeys.featured(),
        queryFn: () => profileAPI.getFeaturedUsers(limit),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}
