'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Radio, Users, TrendingUp } from 'lucide-react';

interface WelcomeStepProps {
    onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <Music className="h-10 w-10 text-primary" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Welcome to BOOMBOX!</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    The social radio platform where you can discover, share, and enjoy
                    music with friends in real-time.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <FeatureCard
                    icon={<Radio className="h-8 w-8" />}
                    title="Broadcast Stations"
                    description="Create your own radio station and share your music taste with the world"
                />
                <FeatureCard
                    icon={<Users className="h-8 w-8" />}
                    title="Listen Together"
                    description="Join friends' stations and discover new music in real-time"
                />
                <FeatureCard
                    icon={<TrendingUp className="h-8 w-8" />}
                    title="Track Your Stats"
                    description="See your listening insights and discover patterns in your music taste"
                />
            </div>

            <div className="flex justify-center gap-4">
                <Button size="lg" onClick={onNext} className="px-8">
                    Get Started
                </Button>
            </div>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Card className="p-6 text-center space-y-3">
            <div className="flex justify-center text-primary">{icon}</div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </Card>
    );
}
