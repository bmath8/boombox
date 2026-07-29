'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, ChevronUp, Music } from 'lucide-react';
// TODO: Import these when contexts are created
// import { useSpotify } from '@/contexts/spotify-context';
// import { useRadio } from '@/contexts/radio-context';
import { useIOSHaptics } from '@/hooks/use-ios-haptics';

interface MobileMiniPlayerProps {
    onExpand?: () => void;
    className?: string;
}

/**
 * Mini Player Component
 * 
 * Sticky bottom player that shows current track and basic controls
 * Swipe up to expand to full player
 * 
 * Features:
 * - Persistent playback controls during navigation
 * - Swipe-up gesture to expand
 * - Smooth animations with framer-motion
 * - Haptic feedback on interactions
 * - Safe area support for iOS devices
 * 
 * NOTE: Currently simplified - needs spotify-context and radio-context to be created
 * 
 * @example
 * ```tsx
 * <MobileMiniPlayer onExpand={() => router.push('/player')} />
 * ```
 */
export function MobileMiniPlayer({ onExpand, className = '' }: MobileMiniPlayerProps) {
    const { triggerHaptic } = useIOSHaptics();

    // Placeholder data until contexts are created
    const currentTrack: any = null;
    const currentStation: any = null;
    const isPaused = true;

    const handlePlayPause = () => {
        triggerHaptic('medium');
        // TODO: Add actual play/pause logic
    };

    const handleSkip = () => {
        triggerHaptic('light');
        // TODO: Add actual skip logic
    };

    const handleExpand = () => {
        triggerHaptic('medium');
        onExpand?.();
    };

    if (!currentTrack && !currentStation) {
        return null; // Don't show mini player if nothing is playing
    }

    const displayTitle = currentTrack?.name || currentStation?.name || 'No track playing';
    const displayArtist = currentTrack?.artists?.[0]?.name || currentStation?.genre || '';
    const albumArt = currentTrack?.album?.images?.[2]?.url || currentStation?.thumbnail || '/assets/speaker.png';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`fixed bottom-0 left-0 right-0 z-40 pb-safe ${className}`}
            >
                {/* Drag indicator */}
                <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Mini player content */}
                <div className="glass-panel mx-4 mb-4 rounded-2xl overflow-hidden">
                    {/* Progress bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: '0%' }}
                            animate={{ width: '0%' }}
                            style={{ width: '0%' }}
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 pt-4">
                        {/* Album art */}
                        <button
                            onClick={handleExpand}
                            className="flex-shrink-0 relative group"
                        >
                            <img
                                src={albumArt}
                                alt={displayTitle}
                                className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-active:opacity-100 transition-opacity">
                                <ChevronUp className="w-5 h-5 text-white" />
                            </div>
                        </button>

                        {/* Track info */}
                        <button
                            onClick={handleExpand}
                            className="flex-1 min-w-0 text-left"
                        >
                            <h3 className="text-sm font-semibold text-white truncate">
                                {displayTitle}
                            </h3>
                            {displayArtist && (
                                <p className="text-xs text-white/60 truncate">
                                    {displayArtist}
                                </p>
                            )}
                        </button>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handlePlayPause}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 active:scale-95 transition-all touch-target"
                                aria-label={isPaused ? 'Play' : 'Pause'}
                            >
                                {isPaused ? (
                                    <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                ) : (
                                    <Pause className="w-5 h-5 text-black fill-black" />
                                )}
                            </button>

                            {currentTrack && (
                                <button
                                    onClick={handleSkip}
                                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all touch-target"
                                    aria-label="Skip to next"
                                >
                                    <SkipForward className="w-5 h-5 text-white" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
