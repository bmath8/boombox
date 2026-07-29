'use client';

import { useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './welcome-step';
import { SpotifyConnectStep } from './spotify-connect-step';
import { ProfileSetupStep } from './profile-setup-step';
import { GenreSelectionStep } from './genre-selection-step';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function OnboardingFlow() {
    const {
        isActive,
        currentStep,
        nextStep,
        skipStep,
        completeStep,
        completeOnboarding,
    } = useOnboardingStore();

    const STEP_MAP = {
        welcome: 0,
        spotify_connect: 1,
        profile_setup: 2,
        genre_selection: 3,
        follow_users: 4,
        join_station: 5,
        tutorial_complete: 6,
    };

    const currentStepIndex = STEP_MAP[currentStep];
    const totalSteps = Object.keys(STEP_MAP).length;
    const progress = ((currentStepIndex + 1) / totalSteps) * 100;

    const handleNext = () => {
        completeStep(currentStep);
        nextStep();
    };

    const handleSkip = () => {
        skipStep(currentStep);
        nextStep();
    };

    if (!isActive) return null;

    return (
        <Dialog open={isActive} onOpenChange={(open) => !open && completeOnboarding()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                {/* Progress Bar */}
                {currentStep !== 'welcome' && currentStep !== 'tutorial_complete' && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">
                                Step {currentStepIndex + 1} of {totalSteps}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {Math.round(progress)}% complete
                            </p>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Step Content */}
                <div className="py-8">
                    {currentStep === 'welcome' && <WelcomeStep onNext={handleNext} />}

                    {currentStep === 'spotify_connect' && (
                        <SpotifyConnectStep onNext={handleNext} onSkip={handleSkip} />
                    )}

                    {currentStep === 'profile_setup' && (
                        <ProfileSetupStep onNext={handleNext} onSkip={handleSkip} />
                    )}

                    {currentStep === 'genre_selection' && (
                        <GenreSelectionStep onNext={handleNext} onSkip={handleSkip} />
                    )}

                    {currentStep === 'tutorial_complete' && (
                        <CompletionStep onComplete={completeOnboarding} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CompletionStep({ onComplete }: { onComplete: () => void }) {
    return (
        <div className="text-center space-y-8 py-8">
            <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-4xl font-bold">You're All Set!</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Welcome to BOOMBOX. Start exploring stations, discover new music,
                    and connect with friends.
                </p>
            </div>

            <Card className="p-6 max-w-2xl mx-auto">
                <h3 className="font-semibold text-lg mb-4">Quick Tips:</h3>
                <div className="space-y-3 text-left">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Use keyboard shortcuts</p>
                            <p className="text-sm text-muted-foreground">
                                Press <kbd>?</kbd> to see all available shortcuts
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Create your first station</p>
                            <p className="text-sm text-muted-foreground">
                                Share your favorite music with the community
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Follow friends</p>
                            <p className="text-sm text-muted-foreground">
                                Discover new music through your network
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <Button size="lg" onClick={onComplete} className="px-8">
                Start Exploring
            </Button>
        </div>
    );
}
