import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { OnboardingStepId, OnboardingProgress } from '@/types/onboarding';

/**
 * Onboarding Store
 *
 * Manages onboarding flow state and progress
 */

interface OnboardingState {
    // State
    isActive: boolean;
    currentStep: OnboardingStepId;
    progress: OnboardingProgress | null;
    showTooltip: boolean;
    tooltipTarget: string | null;

    // Actions
    startOnboarding: () => void;
    completeOnboarding: () => void;
    setCurrentStep: (step: OnboardingStepId) => void;
    completeStep: (step: OnboardingStepId) => void;
    skipStep: (step: OnboardingStepId) => void;
    nextStep: () => void;
    previousStep: () => void;
    setProgress: (progress: OnboardingProgress) => void;
    showTooltipFor: (target: string) => void;
    hideTooltip: () => void;
    reset: () => void;
}

const ONBOARDING_STEPS: OnboardingStepId[] = [
    'welcome',
    'spotify_connect',
    'profile_setup',
    'genre_selection',
    'follow_users',
    'join_station',
    'tutorial_complete',
];

export const useOnboardingStore = create<OnboardingState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                isActive: false,
                currentStep: 'welcome',
                progress: null,
                showTooltip: false,
                tooltipTarget: null,

                // Start onboarding
                startOnboarding: () =>
                    set({
                        isActive: true,
                        currentStep: 'welcome',
                        progress: {
                            user_id: '', // Will be set by parent
                            current_step: 'welcome',
                            completed_steps: [],
                            skipped_steps: [],
                            completed: false,
                            started_at: new Date().toISOString(),
                        },
                    }),

                // Complete entire onboarding
                completeOnboarding: () =>
                    set((state) => ({
                        isActive: false,
                        progress: state.progress
                            ? {
                                ...state.progress,
                                completed: true,
                                completed_at: new Date().toISOString(),
                            }
                            : null,
                    })),

                // Set current step
                setCurrentStep: (step) =>
                    set((state) => ({
                        currentStep: step,
                        progress: state.progress
                            ? { ...state.progress, current_step: step }
                            : null,
                    })),

                // Complete a step
                completeStep: (step) =>
                    set((state) => {
                        if (!state.progress) return state;

                        const completedSteps = [...state.progress.completed_steps];
                        if (!completedSteps.includes(step)) {
                            completedSteps.push(step);
                        }

                        return {
                            progress: {
                                ...state.progress,
                                completed_steps: completedSteps,
                            },
                        };
                    }),

                // Skip a step
                skipStep: (step) =>
                    set((state) => {
                        if (!state.progress) return state;

                        const skippedSteps = [...state.progress.skipped_steps];
                        if (!skippedSteps.includes(step)) {
                            skippedSteps.push(step);
                        }

                        return {
                            progress: {
                                ...state.progress,
                                skipped_steps: skippedSteps,
                            },
                        };
                    }),

                // Go to next step
                nextStep: () => {
                    const currentIndex = ONBOARDING_STEPS.indexOf(get().currentStep);
                    if (currentIndex >= 0 && currentIndex < ONBOARDING_STEPS.length - 1) {
                        const nextStep = ONBOARDING_STEPS[currentIndex + 1];
                        // noUncheckedIndexedAccess compatibility: check if nextStep exists
                        if (nextStep) {
                            get().setCurrentStep(nextStep);
                        }
                    } else {
                        get().completeOnboarding();
                    }
                },

                // Go to previous step
                previousStep: () => {
                    const currentIndex = ONBOARDING_STEPS.indexOf(get().currentStep);
                    if (currentIndex > 0) {
                        const prevStep = ONBOARDING_STEPS[currentIndex - 1];
                        // noUncheckedIndexedAccess compatibility: check if prevStep exists
                        if (prevStep) {
                            get().setCurrentStep(prevStep);
                        }
                    }
                },

                // Set progress
                setProgress: (progress) => set({ progress }),

                // Show tooltip
                showTooltipFor: (target) =>
                    set({ showTooltip: true, tooltipTarget: target }),

                // Hide tooltip
                hideTooltip: () => set({ showTooltip: false, tooltipTarget: null }),

                // Reset onboarding
                reset: () =>
                    set({
                        isActive: false,
                        currentStep: 'welcome',
                        progress: null,
                        showTooltip: false,
                        tooltipTarget: null,
                    }),
            }),
            {
                name: 'onboarding-storage',
                partialize: (state) => ({
                    progress: state.progress,
                }),
            }
        ),
        { name: 'OnboardingStore' }
    )
);

// Optimized selectors
export const useIsOnboarding = () => useOnboardingStore((state) => state.isActive);
export const useCurrentOnboardingStep = () =>
    useOnboardingStore((state) => state.currentStep);
export const useOnboardingProgress = () =>
    useOnboardingStore((state) => state.progress);
