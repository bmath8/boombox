import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';

/**
 * User Store - Zustand
 *
 * Manages user authentication state and profile.
 */

export interface UserProfile {
    user_id: string;
    display_name: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
}

interface UserState {
    // State
    user: User | null;
    profile: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setUser: (user: User | null) => void;
    setProfile: (profile: UserProfile | null) => void;
    setIsLoading: (loading: boolean) => void;
    logout: () => void;

    // Computed
    displayName: () => string;
}

export const useUserStore = create<UserState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                user: null,
                profile: null,
                isAuthenticated: false,
                isLoading: true,

                // Actions
                setUser: (user) => set({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                }),

                setProfile: (profile) => set({ profile }),

                setIsLoading: (loading) => set({ isLoading: loading }),

                logout: () => set({
                    user: null,
                    profile: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),

                // Computed values
                displayName: () => {
                    const state = get();
                    return state.profile?.display_name ||
                        state.user?.user_metadata?.['display_name'] ||
                        state.user?.email?.split('@')[0] ||
                        'User';
                },
            }),
            {
                name: 'user-storage',
                partialize: (state) => ({
                    profile: state.profile,
                }),
            }
        ),
        { name: 'UserStore' }
    )
);

/**
 * Selectors
 */
export const useUser = () => useUserStore((state) => state.user);
export const useProfile = () => useUserStore((state) => state.profile);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useDisplayName = () => useUserStore((state) => state.displayName());
