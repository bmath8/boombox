/**
 * Onboarding Types
 *
 * Type definitions for user onboarding flow
 */

export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    skippable?: boolean;
}

export type OnboardingStepId =
    | 'welcome'
    | 'spotify_connect'
    | 'profile_setup'
    | 'genre_selection'
    | 'follow_users'
    | 'join_station'
    | 'tutorial_complete';

export interface OnboardingProgress {
    user_id: string;
    current_step: OnboardingStepId;
    completed_steps: OnboardingStepId[];
    skipped_steps: OnboardingStepId[];
    completed: boolean;
    started_at: string;
    completed_at?: string;
}

export interface OnboardingState {
    isActive: boolean;
    currentStep: OnboardingStepId;
    progress: OnboardingProgress | null;
    showTooltip: boolean;
    tooltipTarget: string | null;
}

export interface GenreOption {
    id: string;
    name: string;
    description: string;
    icon: string;
    selected: boolean;
}
