/**
 * Zustand Stores Index
 *
 * Central export for all application stores.
 * Makes importing stores cleaner and more organized.
 *
 * Usage:
 * import { useRadioStore, useUserStore, useUIStore } from '@/stores';
 */

export { useRadioStore, useCurrentStation, useIsBroadcasting, useIsListening, useSyncEngine } from './radio-store';
export { useUserStore, useUser, useProfile, useIsAuthenticated, useDisplayName } from './user-store';
export { useUIStore, useActiveModal, useTheme, useSidebarOpen, useSearchQuery } from './ui-store';
export { useSocialStore, useMyProfile, useFollowing, useFollowers, useFeed, useIsFollowing } from './social-store';
export { useNotificationStore, useNotifications, useUnreadCount, useNotificationPreferences, useIsPushSubscribed, useNotificationPanelOpen } from './notification-store';
export { useOnboardingStore, useIsOnboarding, useCurrentOnboardingStep, useOnboardingProgress } from './onboarding-store';

export type { UserProfile } from './user-store';
