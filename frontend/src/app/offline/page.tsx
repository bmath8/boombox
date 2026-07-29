'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Offline Page
 *
 * Shown when the user is offline and tries to navigate to a page
 * that hasn't been cached.
 */
export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // Check if back online
        const handleOnline = () => {
            setIsOnline(true);
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white flex items-center justify-center p-4">
            <div className="max-w-md text-center">
                {/* Icon */}
                <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                        <WifiOff className="w-12 h-12 text-muted-foreground" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4">
                    {isOnline ? 'Back Online!' : 'You\'re Offline'}
                </h1>

                {/* Description */}
                <p className="text-muted-foreground mb-8">
                    {isOnline
                        ? 'Your connection has been restored. Click retry to continue.'
                        : 'It looks like you\'ve lost your internet connection. Check your network and try again.'}
                </p>

                {/* Action Button */}
                <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 rounded-full font-semibold transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                    Retry
                </button>

                {/* Status Indicator */}
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm">
                    <div
                        className={`w-2 h-2 rounded-full ${
                            isOnline ? 'bg-green-500' : 'bg-red-500'
                        } animate-pulse`}
                    />
                    <span className="text-muted-foreground">
                        {isOnline ? 'Connected' : 'Disconnected'}
                    </span>
                </div>

                {/* Helpful Tips */}
                <div className="mt-12 p-4 bg-white/5 rounded-xl text-left">
                    <h2 className="font-semibold mb-2">While you're offline:</h2>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Previously viewed pages are still available</li>
                        <li>• Your playlists are cached locally</li>
                        <li>• Changes will sync when you're back online</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
