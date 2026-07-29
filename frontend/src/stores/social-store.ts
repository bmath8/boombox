import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserProfile, UserActivity } from '@/types/profile';

/**
 * Social Store
 *
 * Manages social features state including:
 * - Current user's profile
 * - Following/followers lists
 * - Activity feed
 * - Social interactions
 */

interface SocialState {
    // Current user profile
    myProfile: UserProfile | null;

    // Following/followers
    following: UserProfile[];
    followers: UserProfile[];

    // Activity feed
    feed: UserActivity[];

    // UI state
    profileModalOpen: boolean;
    selectedUserId: string | null;

    // Actions
    setMyProfile: (profile: UserProfile | null) => void;
    setFollowing: (users: UserProfile[]) => void;
    setFollowers: (users: UserProfile[]) => void;
    setFeed: (activities: UserActivity[]) => void;

    addFollowing: (user: UserProfile) => void;
    removeFollowing: (userId: string) => void;
    addFollower: (user: UserProfile) => void;
    removeFollower: (userId: string) => void;

    openProfileModal: (userId: string) => void;
    closeProfileModal: () => void;

    // Helper methods
    isFollowing: (userId: string) => boolean;
    getFollowingIds: () => string[];
}

export const useSocialStore = create<SocialState>()(
    devtools(
        (set, get) => ({
            // Initial state
            myProfile: null,
            following: [],
            followers: [],
            feed: [],
            profileModalOpen: false,
            selectedUserId: null,

            // Basic setters
            setMyProfile: (profile) => set({ myProfile: profile }),
            setFollowing: (users) => set({ following: users }),
            setFollowers: (users) => set({ followers: users }),
            setFeed: (activities) => set({ feed: activities }),

            // Following/followers management
            addFollowing: (user) =>
                set((state) => ({
                    following: [...state.following, user],
                    myProfile: state.myProfile
                        ? {
                              ...state.myProfile,
                              following_count: state.myProfile.following_count + 1,
                          }
                        : null,
                })),

            removeFollowing: (userId) =>
                set((state) => ({
                    following: state.following.filter((u) => u.user_id !== userId),
                    myProfile: state.myProfile
                        ? {
                              ...state.myProfile,
                              following_count: Math.max(
                                  0,
                                  state.myProfile.following_count - 1
                              ),
                          }
                        : null,
                })),

            addFollower: (user) =>
                set((state) => ({
                    followers: [...state.followers, user],
                    myProfile: state.myProfile
                        ? {
                              ...state.myProfile,
                              followers_count: state.myProfile.followers_count + 1,
                          }
                        : null,
                })),

            removeFollower: (userId) =>
                set((state) => ({
                    followers: state.followers.filter((u) => u.user_id !== userId),
                    myProfile: state.myProfile
                        ? {
                              ...state.myProfile,
                              followers_count: Math.max(
                                  0,
                                  state.myProfile.followers_count - 1
                              ),
                          }
                        : null,
                })),

            // Modal management
            openProfileModal: (userId) =>
                set({ profileModalOpen: true, selectedUserId: userId }),
            closeProfileModal: () =>
                set({ profileModalOpen: false, selectedUserId: null }),

            // Helper methods
            isFollowing: (userId) => {
                return get().following.some((u) => u.user_id === userId);
            },

            getFollowingIds: () => {
                return get().following.map((u) => u.user_id);
            },
        }),
        { name: 'SocialStore' }
    )
);

// Optimized selectors
export const useMyProfile = () => useSocialStore((state) => state.myProfile);
export const useFollowing = () => useSocialStore((state) => state.following);
export const useFollowers = () => useSocialStore((state) => state.followers);
export const useFeed = () => useSocialStore((state) => state.feed);
export const useIsFollowing = (userId: string) =>
    useSocialStore((state) => state.isFollowing(userId));
