'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, CheckCircle2, AlertCircle } from 'lucide-react';

interface SpotifyConnectStepProps {
    onNext: () => void;
    onSkip?: () => void;
}

export function SpotifyConnectStep({ onNext, onSkip }: SpotifyConnectStepProps) {
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setConnecting(true);
        setError(null);

        try {
            // Simulate Spotify connection
            // In production, this would redirect to Spotify OAuth
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setConnected(true);
        } catch (err) {
            setError('Failed to connect to Spotify. Please try again.');
        } finally {
            setConnecting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Music className="h-10 w-10 text-green-500" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold">Connect Your Spotify</h2>
                <p className="text-muted-foreground">
                    Connect your Spotify account to start broadcasting and listening to
                    music with your friends.
                </p>
            </div>

            <Card className="p-8">
                {!connected ? (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium">
                                        Broadcast your favorite tracks
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Share what you're listening to with your followers
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium">
                                        Listen to friends' stations
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Discover new music through your network
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-medium">
                                        Track your listening habits
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Get insights into your music preferences
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-3">
                            <Button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="flex-1 bg-green-500 hover:bg-green-600"
                            >
                                {connecting ? 'Connecting...' : 'Connect Spotify'}
                            </Button>
                            {onSkip && (
                                <Button variant="ghost" onClick={onSkip}>
                                    Skip for now
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold mb-2">
                                Spotify Connected!
                            </h3>
                            <p className="text-muted-foreground">
                                You're all set to start sharing music
                            </p>
                        </div>
                        <Button onClick={onNext} className="px-8">
                            Continue
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}
