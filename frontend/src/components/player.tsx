'use client';

import { useEffect } from 'react';
import { useSpotify } from '@/lib/spotify-sdk';
import { Play, Pause, SkipForward, SkipBack, Volume2, Laptop2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Artist } from '@/lib/types';

export function Player() {
    const { player, currentTrack, isPaused, isActive } = useSpotify();

    const togglePlay = () => {
        player?.togglePlay();
    };

    const nextTrack = () => {
        player?.nextTrack();
    };

    const previousTrack = () => {
        player?.previousTrack();
    };

    // Listen for keyboard shortcut events
    useEffect(() => {
        const handleToggle = () => togglePlay();
        const handleNext = () => nextTrack();
        const handlePrevious = () => previousTrack();

        document.addEventListener('player:toggle', handleToggle);
        document.addEventListener('player:next', handleNext);
        document.addEventListener('player:previous', handlePrevious);

        return () => {
            document.removeEventListener('player:toggle', handleToggle);
            document.removeEventListener('player:next', handleNext);
            document.removeEventListener('player:previous', handlePrevious);
        };
    }, [player, isPaused]); // Re-attach listeners if player state changes
    // NOTE (audit 2026-09-23): moved below the hook above so useEffect isn't
    // called conditionally (react-hooks/rules-of-hooks).
    if (!isActive || !currentTrack) {
        return null;
    }


    return (
        <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/10 p-4 z-40 hidden md:block safe-area-inset-bottom"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">

                {/* Track Info */}
                <div className="flex items-center gap-4 w-1/3">
                    <img
                        src={currentTrack.album.images[0]?.url}
                        alt={currentTrack.album.name}
                        className="w-14 h-14 rounded-lg shadow-lg"
                    />
                    <div className="min-w-0">
                        <h4 className="font-bold text-white truncate">{currentTrack.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                            {currentTrack.artists.map((a: Artist) => a.name).join(', ')}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={previousTrack}
                            className="text-muted-foreground hover:text-white transition-colors"
                            aria-label="Previous track"
                            title="Previous track (←)"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                            aria-label={isPaused ? 'Play' : 'Pause'}
                            title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
                        >
                            {isPaused ? (
                                <Play className="w-5 h-5 fill-current ml-1" />
                            ) : (
                                <Pause className="w-5 h-5 fill-current" />
                            )}
                        </button>

                        <button
                            onClick={nextTrack}
                            className="text-muted-foreground hover:text-white transition-colors"
                            aria-label="Next track"
                            title="Next track (→)"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Volume / Device */}
                <div className="flex items-center justify-end gap-4 w-1/3">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 px-3 py-1 rounded-full">
                        <Laptop2 className="w-4 h-4" />
                        <span>FAM Web Player</span>
                    </div>
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                </div>

            </div>
        </motion.div>
    );
}
